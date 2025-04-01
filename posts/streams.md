---
title: Functional async
sub_title: Mostly in Rust
date: 2025-03-18
author: Willem Vanhulle
theme:
  name: catppuccin-latte
options:
  end_slide_shorthand: true
---

1. [Introduction](#introduction)
   1. [Connecting channels](#connecting-channels)
   2. [Imperative aync: +/-](#imperative-aync--)
   3. [Declarative async: +/-](#declarative-async--)
2. [Basic usage of existing streams](#basic-usage-of-existing-streams)
   1. [Iterating streams](#iterating-streams)
   2. [Consuming streams with `for_each`](#consuming-streams-with-for_each)
   3. [Mapping streams](#mapping-streams)
   4. [Filtering streams](#filtering-streams)
      1. [Misleading messages compiler](#misleading-messages-compiler)
   5. [Filter map](#filter-map)
   6. [Boolean operators](#boolean-operators)
3. [Intermediate usage of streams](#intermediate-usage-of-streams)
   1. [Merging of streams](#merging-of-streams)
   2. [Homogenous stream merging](#homogenous-stream-merging)
   3. [Inhomogenous stream merging](#inhomogenous-stream-merging)
   4. [Splitting streams](#splitting-streams)
      1. [Advanced clone-able streams](#advanced-clone-able-streams)
      2. [Simple channels](#simple-channels)
   5. [Cloning stream backends](#cloning-stream-backends)
   6. [Dual of streams: `Sink`s](#dual-of-streams-sinks)
   7. [Flushing a `Stream` into a `Sink`](#flushing-a-stream-into-a-sink)
4. [Streams from scratch](#streams-from-scratch)
   1. [Iterators from imperative generators](#iterators-from-imperative-generators)
   2. [Stable stream generators (imperative)](#stable-stream-generators-imperative)
   3. [Nightly stream generators](#nightly-stream-generators)
   4. [Simple declarative streams](#simple-declarative-streams)
   5. [Complicated declarative streams](#complicated-declarative-streams)
   6. [Creation through custom combinators](#creation-through-custom-combinators)
5. [Review of low-level move-prevention](#review-of-low-level-move-prevention)
   1. [Immoveable / `Unpin`](#immoveable--unpin)
   2. [`Pin` as an `Unpin` consumer](#pin-as-an-unpin-consumer)
   3. [Interpeting `Pin` as a barrier](#interpeting-pin-as-a-barrier)
   4. [Future trait](#future-trait)
   5. [Examples of `!Unpin` types](#examples-of-unpin-types)
   6. [Immoveable async blocks](#immoveable-async-blocks)
   7. [Streams as futures](#streams-as-futures)
6. [Streams and coroutines](#streams-and-coroutines)
   1. [Coroutine as a concept](#coroutine-as-a-concept)
   2. [Coroutines in nightly Rust](#coroutines-in-nightly-rust)
   3. [Streams as a type of coroutine](#streams-as-a-type-of-coroutine)
   4. [Synchronous vs. asynchronous things](#synchronous-vs-asynchronous-things)
7. [Advanced stream creation](#advanced-stream-creation)
   1. [Stupid example: `Future -> Stream`](#stupid-example-future---stream)
   2. [How is `futures::Map` implemented?](#how-is-futuresmap-implemented)
   3. [Aggregated declarative stream combinators](#aggregated-declarative-stream-combinators)
   4. [Aggregation examples: flattening nested streams](#aggregation-examples-flattening-nested-streams)
   5. [Aggregation examples: monitoring streams](#aggregation-examples-monitoring-streams)


---

## Introduction

Start with a simple example that shows:

- How does an imperative approach look?
- How does a functional approach look?
- What are the disadvantages/advantages of each?

---

### Connecting channels

In user applications we might have to connect two channels. (Don't think about whether this is a good idea.)

Imperative version (with variable assignments):

```rust
let (_, in_receiver) = watch::channel(1);
let (out_sender, _) = broadcast::channel(123);
let forward_task = spawn(async move {
    loop {
        let result = in_receiver.changed().await;
        if let Err(e) = result { break };
        let input = *in_receiver.borrow();
        let output = get_output(input);
        out_sender.send(output);
    }
});
```

Declarative version (using streams and sinks):

```rust
let in_receiver = WatchStream::new(in_receiver);
let out_sender = BroadcastSink::new(out_sender);

let forward_task = spawn(
    in_receiver
    .map(Result::ok)
    .filter_map(ready)
    .map(get_output)
    .map(Ok)
    .forward(out_sender)
)
```

---

### Imperative aync: +/-

```rust
let (_, in_receiver) = watch::channel(1);
let (out_sender, _) = broadcast::channel(123);
let forward_task = spawn(async move {
    loop {
        let result = in_receiver.changed().await;
        if let Err(e) = result { 
            break 
        };
        let input = *in_receiver.borrow();
        let output = get_output(input);
        out_sender.send(output);
    }
});
```

Advantages:

- Imperative code is more mainstream.
- No need to know much about futures, poll or pin.

Disadvantages:

- Seemingly arbitrary channel configuration
- More characters, more chances of typos
- Manual declaration and naming of intermediate state
- Non-linear source code execution because of control flow keywords: `break`, `continue`, ...

---

### Declarative async: +/-

```rust
let in_receiver = WatchStream::new(in_receiver);
let out_sender = BroadcastSink::new(out_sender);

let forward_task = spawn(
    in_receiver
    .map(Result::ok)
    .filter_map(ready)
    .map(get_output)
    .map(Ok)
    .forward(out_sender)
)
```

Advantages:

- Moving / streaming data modeled naturally by streams
- Operators on `Streams` are similar to `Iterator`, easy to remember
- No discussions about the naming of intermediate variables
- Better interoperability, less reliance on external channel implementations on core libraries. (`impl Stream`)
- No explicit control flow statements like `break`, `continue`, `return`.

Disadvantages:

- We need to know about `ready` to convert into a future
- I need to use `Ok` to convert `Stream` into `TryStream`
- Extra dependency on `tokio-stream` for stream wrappers
- `tokio` channels do not implement `Stream` out-of-the-box
- We needed to know about `Sink` and implement it.
- Need to know the basics of futures.
- Need dependency on `futures`

---

## Basic usage of existing streams

To be able to quickly get started:

- Iterating streams
- Consuming streams
- Splitting streams
- Mapping streams
- Filtering streams
- Boolean operators on streams

For more see [docs](https://docs.rs/futures/latest/futures/prelude/stream/trait.StreamExt.html).

Very similar to familiar methods on `Iterator`.

---

### Iterating streams

A stream is an async iterator: `next` returns a `Future<Output = Option<_>>`

```rust
let stream = UserStream::new();
assert_eq!(stream.next().await, Some(_));
```

Important distinction with iterators:

- An iterator that ends is a `FusedIterator` continues to yield `None` after completion
- A fused stream that ends is a `FusedStream` that has a method `is_terminated`. `None` does not mean the `Stream` has ended.

Most common streams are `FusedStream` or convert standard `Stream`s into `FusedStream` with `stream.fuse()`.


---

### Consuming streams with `for_each`

Use `futures::StreamExt::for_each` to act on each item.

```rust
let mut x = 0;

{
    let fut = stream::repeat(1).take(3).for_each(|item| {
        x += item;
        future::ready(())
    });
    fut.await;
}

assert_eq!(x, 3);
```

---


### Mapping streams

Most important operator.

```rust
use futures::{stream, StreamExt};

let stream = stream::iter(1..=3);
let stream = stream.map(|x| x + 3);
```

If the closure is asynchronous, use `then` (as in `Future::then`).

```rust
let stream = stream::iter(1..=3);
let stream = stream.then(|x| async move { convert(x).await });
```

The futures will not overlap in execution.

Feel free to use async closures `async |_| {}` or `AsyncFn` in recent Rust versions. 

I prefer to stick to the good-old `async move {}` blocks.

**Important**: In previous major version releases of `futures`, `then` and `map` were a single function. The crate `futures-preview` is an old fork such an old version. Avoid it's documentation to prevent confusion. (Everything you need for the rest of this presentation is available in the recent official release of `futures`.)

---

### Filtering streams

```rust
use std::future::ready;
use futures::{stream, StreamExt};

let stream = stream::iter(1..=10);
let events = stream.filter(|x| ready(x % 2 == 0));
```

Notice the `ready` function. It maps sync values into async values / futures **which are `Unpin`**.

Because the closure is `Unpin`, the resulting  `Stream` called `events` is also `Upin`.


#### Misleading messages compiler

Remark: the following would be an `Unpin` stream:

```rust
stream.filter(|x| async move { x % 2 == 0});
```

The compiler messages will lead you to pinning and you will do something like this:

```rust
stream.filter(|x| Box::pin(async move { x % 2 == 0}));
Box::pin(stream.filter(|x| async move { x % 2 == 0}));
```

However, this is not necessary and involves unnecessary heap allocations. Use the `std::future::ready` function instead.

---

### Filter map

The `filter_map` function can also filters out `None` values.

```rust
let stream = stream::iter(1..=10);
let events = stream.filter_map(|x| async move {
    if x % 2 == 0 { Some(x + 1) } else { None }
});
```

---

### Boolean operators

There are also analogues for all boolean operators from `Iterator`: any, all, ...

---


## Intermediate usage of streams

We will see:

- Merging
- Splitting
- Forwarding


---

### Merging of streams

We also want to **combine streams**.

The input streams need to be of the same type.

This may be annoying whent you:

- build software with streams from different third-party crates 
- use different streams with different backend / transport.

Solution: use a `&dyn Stream` **behind a pointer** such as `Box` (heap-allocation).

References to streams in local variables on the stack are also possible, but then you do not have ownership. Ownership is typically needed.

---


### Homogenous stream merging

A user of streams does not just want to redirect or map streams.


Merge normal iterator of streams into one stream with `futures::stream::select_all`.

To keep track of the origin of the values in the merged stream, do this:

```rust
let stream_a = stream::repeat(1).map(|n| ('a', 1));
let stream_b = stream::repeat(2).map(|n| ('b', 2));

let merged_tagged = stream::select_all([stream_a, stream_b]);
```

Merge two homegenous streams with `tokio_stream::StreamExt::merge`. Disadvantage: dependency on `tokio-stream`.

https://docs.rs/futures/latest/futures/stream/fn.select_all.html

---
### Inhomogenous stream merging


Merge two inhomogenous streams with `futures::StreamExt::zip` into a stream of tuples.

Or use trait objects and streams of type `Stream<Item: Box<dyn Trait>>`.

See later for more advanced types of merging.


---

### Splitting streams

What if you need to use the same output of a stream in several places and the items are `Clone`?

Most streams are **not `Clone`**, even if the items are `Clone`. 

The `Stream` trait is very basic and does not say how to clone.

You can hack together a loop and some manual cloning.

#### Advanced clone-able streams

In the end something will have to:

- listen on the input stream to be split 
- save the last received value for who is not awaiting yet.
- notify consumers of the split streams for new values 

If you know how to implement the `poll` functions, you can try to do it yourself. 

However, you have to  keep track of all consumers and whether they have seen the latest value yet.

#### Simple channels

If implementing `poll` sounds like over-kill you can use a channel.

The simplest solution is to use the **backend of the input stream** which may have `resubscribe` functions.

If the receiver is not clone you can spawn threads/tasks that take input, clone the input and send it.


---

### Cloning stream backends

A very simple approach to cloning streams is just cloning the receiver on the backend:

```rust
struct CloneableStream<Item>(sync::Receiver)

impl<Item> CloneableStream<Item> {
    fn create(receiver: sync::Receiver) -> (TaskHandle, Self) {
        let (tx, rx) = channel();
        let task_handle = spawn(async move {
            loop {
                let input = receiver.rcv().await.unwrap();
                tx.send(input).unwrap();
            }
        });
        (task_handle, Self(rx))
    }

    fn stream(self) -> impl Stream {}
}

impl<Item> Clone for CloneableStream<Item> {}
```

Usage:

```rust
let (tx, rx) = channel();
let (_, cloneable_stream) = CloneableStream::create(rx);
let new_stream = cloneable_stream.clone().stream().map(|_| {});
let clone_stream = cloneable_stream.clone();
```



---

### Dual of streams: `Sink`s

You can forward a stream into a sink.

The `futures::Sink` trait is the opposite of `Stream`.


| stage    | name       | method             | meaning                | remark          |
| -------- | ---------- | ------------------ | ---------------------- | --------------- |
| creation | new        |                    | Initial state          |                 |
| send     | ready      | `ready().await`    | Wait until cache ready | may be full     |
| send     | start send | `start_send(item)` | Load into cache        | not actual send |
| send     | flush      | `flush().await`    | Send items from cache  |                 |
| close    | close      | `close().await`    | Close the `Sink`       | not automatic   |

The opposite for `map` for sinks is `with`.


If a `Sink` becomes full easily, you can allocate a buffer with `buffer()`.

---

### Flushing a `Stream` into a `Sink`

A stream can be **sent into a sink** with `futures::SinkExt::forward`.

If you don't want to close the `Sink` after stream returned `None`, use `send_all`.

Third-party crates rarely have `impl` for `futures::Sink`.


```rust
let (output,_) = tokio::sync::mpsc::channel();
let output = tokio_util::PollSender::new(output);

let input = stream::repeat(1).map(Ok);
input.forward(tx).await.unwrap();
```

Important: 

- `StreamExt::forward` takes a `TryStream` (items are `Result`)
- returns future of `Result` (need to ignore error).


When you have one input stream and know `n` output sinks **at compile-time**, you can use `fanout`.

Otherwise you will have to do book-keeping yourself and spawn helper threads/tasks.


---

## Streams from scratch

We will see:

- Creating streams imperatively
- Creating streams declaratively
- Creating streams through custom combinators

---

### Iterators from imperative generators

In computer science, functions that may return more than one value are called **generators**.

(They are common in JavaScript and Python.)

On Rust 2024, generators are part of the core language through `gen` blocks. 

They **return an invisible iterator** of type `impl Iterator`.

```rust
gen {
    yield 1;
    yield 2;
    yield 3;
}
```

Generators are a kind of **imperative iterator construction**. 

Generators are a type of coroutines, see later.

---

### Stable stream generators (imperative)

We need a macro, because `gen` blocks are **not in edition 2021 or stable yet**.

Use crate `async-stream`.

```rust
use async_stream::stream;

use futures_util::pin_mut;
use futures_util::stream::StreamExt;

let s = stream! {
    for i in 0..3 {
        yield i;
    }
};

pin_mut!(s); 

while let Some(value) = s.next().await {
    println!("got {}", value);
}
```

Notice that the stream returned by this macro is not pinned yet.

Streams generated by async generators  such as `async_stream::stream!` suffer from the same limitations as `async {}` blocks and most futures. They are `!Unpin`.


---

### Nightly stream generators

Writing `async` in front of the `gen` keyword turns the output into a `Stream`, under the **new official name `AsyncIterator`**.

```rust
fn create_my_generator() -> impl AsyncIterator<Item = i32> {
    async gen {
      yield 1;
      yield 2;
      yield 3;
    }
}

let mut my_generator = create_my_generator();
assert_eq!(my_generator.next(), Some(1));
```


---

### Simple declarative streams

You can use one of the methods

- enumerate
- skip_while
- peekable
- take

Example:

```rust
let stream = stream::iter(vec!['a', 'b', 'c']);

let mut stream = stream.enumerate();

assert_eq!(stream.next().await, Some((0, 'a')));
assert_eq!(stream.next().await, Some((1, 'b')));
assert_eq!(stream.next().await, Some((2, 'c')));
assert_eq!(stream.next().await, None);
```

---

### Complicated declarative streams

Use crate `futures`

```rust
use futures::{stream, StreamExt};

let stream = stream::unfold(0, |state| async move {
    if state <= 2 {
        let next_state = state + 1;
        let yielded = state * 2;
        Some((yielded, next_state))
    } else {
        None
    }
});

let result = stream.collect::<Vec<i32>>().await;
assert_eq!(result, vec![0, 2, 4]);
```

---

### Creation through custom combinators

You can build your own stream combinators.

Such **combinators** may take several input streams and produce a single output stream.

```rust
let stream_a = stream::iter([1,2]);
let stream_b = stream::iter([3,4]);

let custom_merge_stream = MergedStream::new(
  [
    ("tag_a", stream_a),
    ("tag_b", stream_b)
  ], 
  |v| *v > 2
);
```



---

## Review of low-level move-prevention

This chapter reviews the low-level basics of asynchronous programming in Rust.

- What is `Unpin`?
- What is the role of `Pin`?
- What is a future low-level?
- Example of `!Unpin` type
- What is a stream low-level?

If you really want to know what `await` is, you can continue reading this chapter.


---

### Immoveable / `Unpin`

Rust has **move semantics**. Assigning variables likely moves the content.

Self-referencing data types are dangerous to move. A move will invalidate the content without updating self-references.

The solution in Rust is to not update references, but mark self-referencing types as **not `Unpin`** / `!Unpin`.

(The double negation makes it a bit hard to understand.)

My interpretation of `Unpin` types: 

> All types for which the compiler can see that it is safe to move by **quickly looking at fields**.

Or in other words:

> Immoveable = `!Unpin`
> Moveable = `Unpin`

Remark: `Unpin` cannot be implemented manually, it's an auto-trait reserved for the compiler (on stable).


---

### `Pin` as an `Unpin` consumer

`Pin` is nothing but a wrapper with no intrinsic value.

However, the most important safe functions of `Pin` require `item: Unpin`

- `Pin::new(item)`: pin a move-able object by telling the compiler not to move it 
- `Pin::get_mut(self)`: get mutable access to the object but no ownership

Edit access / mutable reference is dangerous when `Type: !Unpin` because you could still move the content with `std::mem::replace`.

Pin has `unsafe` counterparts to the above which do not have checks for `Unpin`.

Beware of the destructor in `Drop` for pinned types. It is still called.

---

### Interpeting `Pin` as a barrier


The `Pin` type is a **barrier that protects us from moving types** that are `!Unpin` (types explicitly marked as not `Unpin` by the compiler).

| Metaphor   | Type state                 | Ownership event     |
| ---------- | -------------------------- | ------------------- |
| undressed  | `Type`                     | moveable  / free    |
| dress-up   | `Pin::new(Type)`           | give up ownership   |
| dressed up | `Pin<Type>`                | stuck in memory     |
| dress-down | `Pin::new(Type).get_mut()` | acquire edit access |


This means that `Pin`:
- is nothing more than a barrier. 
- does not have physical or type meaning on itself. 

`Pin` only has meaning when you interact with it through it's methods `new` and `get_mut`.



Why so complicated? 

I don't see a simpler alternative. Updating references manually would have a large overhead ...

---



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

---

### Examples of `!Unpin` types


There a couple of examples of common types that are not safe to move:

- (async) generators, for example `async_stream::stream! {}` streams
- futures returned by `async {}` blocks (the compiler is lazy)
- self-referencing data structures such as trees

Why are `async {}` futures unsafe to move and `Future` does not have this requirement?

When a future with **self-referencing variables** has been polled and was supended, it should not be moved by anyone anymore to prevent invalidation.

---

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


---


### Streams as futures

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


---

## Streams and coroutines


More theoretical chapter.

- What is a coroutine?
- What is the relationship between streams and coroutines?

---

### Coroutine as a concept

Normal functions just take input and return output (immediately).

**Coroutines** are functions that can be suspended.

1. Upon being suspended a coroutine **yields a value**.
2. Then the caller can continue with other functions.
3. Later the caller may decide to resume the suspended coroutine with resumption data input
4. If the coroutine ends, it returns (not yield) a final value 

**Important**: the `Coroutine` trait in Rust is unstable.

---

### Coroutines in nightly Rust

The trait definition is a super-set of `Future`:

```rust
pub trait Coroutine<R = ()> {
    type Yield;
    type Return;

    fn resume(
        self: Pin<&mut Self>,
        arg: R,
    ) -> CoroutineState<Self::Yield, Self::Return>;
}
```

Notice the `R` stands for `Resume`, is a type generic and is different from `Coroutine::Return`. 

This means that one same type may behave as different coroutines depending on the resume input, but can only have one `Return` type.


The following coroutine (in nightly Rust) has resume data type `R = ()`:

```rust
let mut coroutine = #[coroutine] || {
    yield 1;
    "foo"
};

match Pin::new(&mut coroutine).resume(()) {
    CoroutineState::Yielded(1) => {}
    _ => panic!("unexpected return from resume"),
}
match Pin::new(&mut coroutine).resume(()) {
    CoroutineState::Complete("foo") => {}
    _ => panic!("unexpected return from resume"),
}
```


---

### Streams as a type of coroutine

We can classify everything seen in this presentation up until now:

|          | _YIELDS_      | _RESUMES_ | _RETURNS_     |
| -------- | ------------- | --------- | ------------- |
| ITERATOR | option        | !         | !             |
| GEN      | item          | !         | !             |
| FUTURE   | ()            | waker     | future output |
| STREAM   | future option | waker     | !             |

Remark: `GEN` stands for Rust `gen` blocks. In general, in other languages, generators can also return values.

Table inspired by [post by without.boats](https://without.boats/blog/poll-next/).

---

### Synchronous vs. asynchronous things

Coroutines are part of a bigger classification of functions.

Synchronous functions:

|                      | _TAKES_ | _CAPTURES_ | _YIELDS_ | _RESUMES_ | _RETURNS_ |
| -------------------- | ------- | ---------- | -------- | --------- | --------- |
| Imperative `loop {}` | !       | !          | !        | !         | !         |
| Blocks `{}`          | !       | captured   | !        | !         | output    |
| Function items `fn`  | input   | !          | !        | !         | output    |
| Closures `Fn`        | input   | captured   | !        | !         | output    |
| `Iterator`           | !       | !          | option   | !         | !         |
| Generators `gen {}`  | input   | !          | item     | !         | any       |
| `#[coroutine]`       | input   | !          | item     | any       | any       |

Asynchronous functions:

|            | _TAKES_ | _CAPTURES_ | _YIELDS_      | _RESUMES_ | _RETURNS_     |
| ---------- | ------- | ---------- | ------------- | --------- | ------------- |
| `Future`   | !       | !          | ()            | waker     | future output |
| `async {}` | !       | `'static`  | ()            | waker     | future output |
| `Stream`   | !       | !          | future option | waker     | !             |


---

## Advanced stream creation

We will now look on how to create useful stream combinators that help to write functional/declarative async code.

- Simplest stream from future.
- General approach for combinators
- Example of stream combinator

---

### Stupid example: `Future -> Stream`

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


---

### How is `futures::Map` implemented?

One of the simplest stream combinators is in the semi-standard library `futures`.

It is used to map a stream to a new stream by mapping each value.

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

    fn poll_next(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Option<Self::Item>> {
        let mut this = self.project();
        let res = ready!(this.stream.as_mut().poll_next(cx));
        Poll::Ready(res.map(|x| this.f.call_mut(x)))
    }
}
```

The `#[pin]` attribute implements a method `Pin<&mut Map> -> Pin<&mut St>`.

It **projects** the pinned mutable reference to a pinned reference to the inner stream.

This macro uses `unsafe` and assumes the writer knows which fields are realy `Unpin` / safe-to-move. **Not recommended.**

You can also declare a field of type `Pin<Box<<Stream>>` and forget about the macro.

<https://docs.rs/futures/latest/futures/stream/struct.Map.html>

---

### Aggregated declarative stream combinators

Usually when you create an aggregate stream, you have to follow these steps:

1. Convert high-level functional description into a stream state object
2. Come up with a method that updates the stream state
3. Implement the `Stream::poll_next` method using 
  - First **project the pins** that you need into mutable references
  - Reconstruct pins from the mutable references of the parts
  - Pass-through to the `poll_next` or `poll` methods of underlying futures
  - call the previously mutable state update method

Often you can put most of your logic in the state update method.

Do not forget to store the waker in case the underlying input data types are not only based on futures. The waker needs to be stored near a place where the IO-bound operation completes. (Most of the time this is not needed.)

---


### Aggregation examples: flattening nested streams


The `futures` crate provides flatten functions for `Stream<Item: Stream>`:

- sequentially `futures::StreamExt::flatten`
- concurrently `futures::StreamExt::flatten_unordered(None)`

When you are looking for these functions, you are probably doing something nasty. There will often be a simpler approach to the underlying problem.

You can also implement your own aggregated streams.

One type of stream aggregator that I couldn't find is a `forgetful` nested Stream.

I implemented my own with `forgetful_flatten`, it rolls out nested streams and drops previous stream when a new stream arrives on the outer stream.


---

### Aggregation examples: monitoring streams

The `tokio_stream` crate provides [`StreamMap`](https://docs.rs/tokio-stream/latest/tokio_stream/struct.StreamMap.html)

However, I need some more logic and created `merge_check_initialized`.

It monitors whether the required streams have yielded an initial value yet

TODO: discuss implementation