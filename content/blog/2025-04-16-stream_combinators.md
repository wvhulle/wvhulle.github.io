+++
title = "Building stream combinators"
description = "How to add functionality to asynchronous Rust by building your own stream combinators."
weight = 4
[taxonomies]
tags = ["combinator", "functional", "Rust",  "operator", "poll", "pin", "unpin"]
+++


## Introduction

What if you know how to use streams, but you need some kind of functionality that is not in the `StreamExt` trait from `futures` or the standard library?

In that case, you might try an imperative approach and create the stream using the `unfold` function. This is a solution for simple cases, but it does not generalise well. Disambiguating between different parts of intermediate stream state quickly becomes difficult. 

You might also want to try using imperative design patterns like loops, channels, spawns and generic functions. This approach quickly becomes unmaintainable because of its complexity.


**Important**: before you continue, you must ask yourself the question whether streams are the right abstraction to solve your problem. The following is quite complicated, and you might want to re-evaluate whether it is really worth it to dive deep into the low-level aspects of asynchronous Rust. The problem you are solving really has to be about _asynchronously moving data_. There must be 

- some kind of input/output or network-bound interaction
- the interaction must be repetitive and consistent 

However, I can tell you I am quite satisfied getting into this matter and applying it in a professional project.


## Invalidation through moves

The physical location of variables used in your code may move throughout the lifetime of your program. In Rust, for example, it is common to move a variable through an assignment. A variable that is called by value by a function is **moved** (literally and conceptually) into the the function. The function takes conceptual ownership. As far as I know, this is called the **move semantics** of Rust.

However, through this conceptual/semantical moving process, a physical move of the data in the registers of the CPU or other parts of memory may also occur. This is dangerous when the content **moved** data is self-referencing. 


For more information, see [`std::pin`](https://doc.rust-lang.org/std/pin/index.html).

### Confusion around `Unpin`

The confusing aspect of `Pin` and `Unpin` in Rust, is that it is not `Pin` which is the first that you should understand, but it is `Unpin`.

The naming of `Unpin` makes it seem like it some counterpart to `Pin`. However, it is not. 

First of all. `Unpin` is an auto-trait, which means users cannot implement it. The compiler derives `Unpin` for everything that it deems is safe to move. 

**Remark**: In that sense `Unpin` should have been named `Move`. This name was taken already, so I assume they picked another one.

Anything that looks like it cannot be moved by the compiler, will be marked automatically as `!Unpin`, not `Unpin`, or un-moveable. The reasoning by the compiler is that it necessary to detect when some kind of data type would be invalidated by a move and prevent dangerous actions by users (programmers implementing async functionality).

Almost all primitives in Rust are `Unpin`. And whenever, you encounter something that is not `Unpin` (and has not non-`'static` references), you can just allocate it on the heap with `Box::pin`.

### Standard usage of `Pin` 

As mentioned before, `Unpin` is the first thing to understand. As soon as you understand for marking things `Unpin` or `!Unpin` you can continue with `Pin`.

The concrete type `Pin` is, in fact, not a real physical type. It does not represent a different location or address in memory. It is merely a Rust compiler construct that manifests itself as a type available to the users.


The `Pin` type is essentially a contract for pointer-like types, maintained by two methods that require the pointed-to (also called "pointee") to implement `Unpin`:

- A constructor `new`: This will take any owned object that is safe to move (by implementing the auto-trait `Unpin` as determined by the compiler) and take ownership of it. There is no way to get ownership back. (But you can drop.)
- A mutable getter `get_mut`: This methods allows you get mutable access to the contained, pinned, `Unpin` value. This allows you to still call methods with the `&mut Self` signature on the pinned data.

The reason that the `get_mut` method requires the pointee to be `Unpin` is that mutable access through a mutable reference can be used to move the content of the `Pin`  with a function like `std::mem::replace`. This could invalidate any pinned otherwise unmoveable `!Unpin` type.

`Pin` has `unsafe` counterparts to the above methods which do not have checks for `Unpin`. You might be tempted to use those when the compiler is mad at you. Sometimes you might, for example, attempt to call `poll` methods on an object in some intermediate state that is `!Unpin`. This will fail because the safe contract of `Pin` does not allow it and you would have to use `unsafe` functions of the `Pin` type. This creates a risk, however, as you effectively disable automated checks for move invalidation by the comiler. 

**Remark**: In some cases, where performance is really critical, and heap allocations matter, you might want to avoid using `Box`, but still need to call `poll`. In that case, you are forced to use `unsafe`. I don't recommend this approach however as it seems quite rare to me.


### Interpeting `Pin` as a barrier


The `Pin` type is a **barrier that protects us from moving types** that are `!Unpin` (types explicitly marked as not `Unpin` by the compiler).

| *Metaphor*   | *Type state*               | *Ownership event*   |
| ------------ | -------------------------- | ------------------- |
| _undressed_  | `Type`                     | moveable  / free    |
| _dress-up_   | `Pin::new(Type)`           | give up ownership   |
| _dressed-up_ | `Pin<Type>`                | stuck in memory     |
| _dress-down_ | `Pin::new(Type).get_mut()` | acquire edit access |


This means that `Pin`:
- is nothing more than a barrier. 
- does not have physical or type meaning on itself. 

`Pin` only has meaning when you interact with it through it's methods `new` and `get_mut`.



Why so complicated? 

I don't see a simpler alternative. Updating references manually would have a large overhead ...

<!-- end_slide -->



### Future trait

The future trait is a simplistic version of the stream trait.

Every synchronous / primitive data type value can be turned into a future.

A future that makes a value nullable and just returns the non-null part immediately on `await`-ing / polling.

```rust
pub struct Ready<T>(Option<T>);

impl<T> Future for Ready<T> {
    type Output = T;

    fn poll(mut self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<T> {
        Poll::Ready(self.0.take().expect("Ready polled after completion"))
    }
}
```
Usage:

```rust
let a = 1;
let fut = Ready::new(a);
// or
let fut = ready(a);

// will terminate immediately
let b = fut.await;

assert_eq!(a,b);
```

Remark: `.await` automatically converts everything in a future with `IntoFuture`.

<!-- end_slide -->

### Examples of `!Unpin` types


There a couple of examples of common types that are not safe to move:

- (async) generators, for example `async_stream::stream! {}` streams
- futures returned by `async {}` blocks (the compiler is lazy)
- self-referencing data structures such as trees

Why are `async {}` futures unsafe to move and `Future` does not have this requirement?

When a future with **self-referencing variables** has been polled and was supended, it should not be moved by anyone anymore to prevent invalidation.

<!-- end_slide -->

### Immoveable async blocks

Local variables in `async {}` blocks may reference each-other ahead of an `await` point.

```rust
async {
    let a = 1;
    let r = &a;
    sleep().await;
    println!("After wake-up r = {r}");
}
```

This block is converted into an `enum` with a code-generated transition function.

Each variant of the `enum` is a phase in the `async` block, before or after an `await` point.

Each phase contains all local variables in the phase. 

If the local variables reference eachother, 

- the type of this variant of the `enum` is self-referencing (unmoveable) or `!Unpin`
- the `enum` itself is unmoveable
- the `impl Future` does not convey the message that the underlying `enum` is unmoveable.
- we always need to use `impl Future + Unpin` when using this future in an executor.


<!-- end_slide -->


### Streams as a kind of futures

Streams are simply a future. But 

- their return type is a future of an option
- the name of the `poll` method is different

Otherwise, streams are identical to futures.

The semi-official definition in `futures::Stream` is a trait:

```rust
pub trait Stream {
    type Item;

    fn poll_next(
        self: Pin<&mut Self>,
        cx: &mut Context<'_>,
    ) -> Poll<Option<Self::Item>>;
}
```

## Basic stream combinators


### General guidelines

In general, the `flatten` and `select_all` functions from `futures` will not be adequate. In that case, you have to build your own stream combinator.

The approach that worked best for me over the past weeks is the following:

1. Convert high-level functional description into an object (typically a Rust `struct`) that represents the state of the aggregated stream. This object will represent aggregated output stream and serve as a handle for useful helper methods. One of the fields of this state object will always be a "pinned" stream or an `Unpin` stream so that you can call the `update` method in the next step. 
2. Come up with a main "update" method that updates the stream state based on some input through a mutable `&mut Self` reference to the state object defined in the first step. 

**Remark**: Most library authors use [`pin_project`](https://docs.rs/pin-project/latest/pin_project/), but you can also just use `Pin<Box<Stream>>` (which I recommend).

Once you have done these steps, the rest comes naturally. Now, the only task that remains is to implement the `poll_next` method for the `Stream` trait. 

Often you can put most of your logic in the state update method.

Do not forget to store the waker in case the underlying input data types are not only based on futures. The waker needs to be stored near a place where the IO-bound operation completes. (Most of the time this is not needed.)

### Futures as streams with `Once`


Every future can be converted into a stream by return `Some(Fut::Output)` once:

```rust
pub struct Once<Fut> {
    future: Option<Fut>
}

impl<Fut: Future> Stream for Once<Fut> {
  type Item = Fut::Output;

  fn poll_next(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Option<Self::Item>> {
      let mut this = self.project();
      let v = match this.future.as_mut().as_pin_mut() {
          Some(fut) => ready!(fut.poll(cx)),
          None => return Poll::Ready(None),
      };
      this.future.set(None);
      Poll::Ready(Some(v))
  }
}
```


### Functional building block `Map`

Let's look at a simple example from the "semi-standard" library crate `futures`: the `map` combinator. This combinator just maps the items of an input stream and returns an new output stream (while consuming the input stream.)

The combinator's source code looks like this:

```rust
pub struct Map<St, F> {
    #[pin]
    stream: St,
    f: F,
}

impl<St, F> Stream for Map<St, F>
where
    St: Stream,
    F: FnMut1<St::Item>,
{
    type Item = F::Output;

    fn poll_next(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Option<Self::Item>> { ... }
}
```

Ignore the field attribute `pin` for now.


The definition of [`map`](https://docs.rs/futures/latest/futures/stream/struct.Map.html) and all the behaviour that we expect from a `map` function essentially boils down to storing two things:

- The original input stream.
- The function or closure that maps elements of the input stream.

Then the authors of `futures` had to implement the single required method of the `Stream` trait: `poll_next`:

```rust
impl<St, F> Stream for Map<St, F>
where
    St: Stream,
    F: FnMut1<St::Item>,
{
    type Item = F::Output;

    fn poll_next(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Option<Self::Item>> {
        let mut this = self.project();
        let res = ready!(this.stream.as_mut().poll_next(cx));
        Poll::Ready(res.map(|x| this.f.call_mut(x)))
    }
}
```

At the beginning of the `poll_next` function, only a `Pin<&mut Self>` is given. It has to be "undressed" to a mutable reference to the state object `Map`. This happens through a process called **projection**, which is essentially just calling `get_mut` on `Pin`. 

**Important**: Almost any library I encountered uses the `pin_project` crate which provides the `#[pin]` field attribute that I asked you to ignore. The `pin_project` crate takes care of two things:

- You don't have to call `Box::pin` yourself or `pin_mut!` inside the constructor function of your aggregated stream.
- You get a `project` function which allows you to call  `as_mut()` (equivalent to `get_mut()`). 
  
**Remark**: Internally, `pin_project` makes use of several `unsafe` function calls of the `Pin` type and the source code (containing code generation) is not readable for me so I avoid using this crate and just `Box::pin` most of the time. This might be slightly less performant than this external crate (which may also pin to the stack), but I prefer a more transparent approach.


## Complex stream combinators

I will now focus on more complicated stream combinators. These are functions that take one or more input streams and output an output stream. I sometimes call the output stream an **aggregate stream** and the process **stream aggregation**.

### Flattening nested streams

The `futures` crate already contains a prototypical example of a complex stream combinator. It has several types of flatten functions for nested streams, or streams with a trait bound `Stream<Item: Stream>`:

- Sequential flatten `flatten`: flattens the outer stream by pasting the output from the inner streams consecutively. This is usually not what you want, since most streams are infinite.
- Concurrent flatten `flatten_unordered(None)`: flattens by merging as many inner streams as possible, as they arrive on the outer stream. This might seems like a useful function, but it often not what you want.
- Buffered concurrent flatten `flatten_unordered(Some(N))`: flattens up-to N different inner streams.


### Forking streams (under construction)

