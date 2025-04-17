+++
title = "Async generators"
description = "Simple ways to generate streams or asynchronous iterators."
weight = 2
[taxonomies]
tags = [ "stream", "iterator", "generator", "functional", "Rust", "declarative", "operator"]
+++

## Introduction

Something you may wonder about is _whether there is a simple way to create streams?_ You might come from a programming language that supports the `yield` keyword. Yielding values is a process used by **generator functions** to return intermediate values. A generator function, in fact, allows programmers to create an iterator in an imperative way. 



## Imperative synchronous

Let's first look at the simple case of synchronous (non-asynchronous), normal, standard Rust iterators. This case can then be generalised to the asynchronous case.

### Stable synchronous iterators 

In computer science, functions that may return more than one value are called **generators**.



For simple synchronous, blocking iterators, you can use the [`genawaiter`](https://docs.rs/genawaiter/latest/genawaiter/) crate.

```rust
let generator = gen!({
    yield_!(10);
});
let xs: Vec<_> = generator.into_iter().collect();
assert_eq!(xs, [10]);
```

The object that is returned by the `gen` macro is a concrete type that implements the `IntoIter` trait. In other words, it _is_ an iterator. More precisely it's retunr type is `impl IntoIter`.

### Nightly synchronous generators

On Rust 2024, April 25 nightly, generators are part of the core language through `gen` blocks. 

```rust
gen {
    yield 1;
    yield 2;
    yield 3;
}
```

## Imperative asynchronous

### Stable asynchronous iterators

If you have some await points in between the yields of your generator, you can construct a `Stream` (asynchronous iterator in Rust) with a macro provided by an external crate. One possible crate is `async-stream`.

A simple example from the documentation looks like:

```rust
use async_stream::stream;

use futures_util::pin_mut;
use futures_util::stream::StreamExt;

let s = stream! {
    for i in 0..3 {
        sleep(_).await;
        yield i;
    }
};

pin_mut!(s); 

while let Some(value) = s.next().await {
    println!("got {}", value);
}
```

Notice that the stream returned by this macro is not pinned yet. You have to call the `pin_mut` macro to pin it on the stack. The reason for this is that `next()` requires the stream to be `Unpin`.

However, streams create through an async generator like the one produced by `async_stream::stream!` suffer from the same limitations as `async {}` blocks and most futures and are `!Unpin`: explicitly marked **not `Unpin`**.

### Nightly stream generators

On Rust edition 2024 and a nightly toolchain (after April 25), you can just add the `async` keyword in front of the `gen` keyword to create a `Stream`.



```rust
fn create_my_generator() -> impl AsyncIterator<Item = i32> {
    async gen {
      sleep(_).await
      yield 1;
      yield 2;
      yield 3;
    }
}

let mut my_generator = create_my_generator();
assert_eq!(my_generator.next(), Some(1));
```


**Important**: In future version of Rust, the name `Stream` seems to have been renamed to `AsyncIterator`. However, the standard library does not include any helper methods for `AsyncIterator` yet, so it is recommended to stick with `Stream` from `futures`.

## Declarative synchronous

This topic is covered in the Rust standard library documentation. See the constructor  functions in [`std::iter`](https://doc.rust-lang.org/std/iter/index.html).


## Declarative asynchronous 

The opposite of an imperative approach to creating iterators or streams would be a declarative approach. A declarative approach does not make use of the `yield` keyword. A declaratively defined stream or generator is build using primitive constructor functions provided by the `stream` module in `futures`.


### Primitives

The simplest way to create a stream is:

- From any future with `into_stream` from the `FuturesExt` trait in `futures`. This function is equivalent to the constructor function `stream::once`. The returned stream yields just one element, immediately.
- Convert any cloneable Rust value into an infinite stream with `stream::repeat`.
- Convert any blocking iterator into a stream with `stream::iter`.

These are of course not the most useful kind of streams. Usually, when you are looking for one of these simple methods you are either doing something wrong or you are writing silly unit tests.

### Declarative operators

The most common way to construct streams is by mapping, flattening, merging or filtering existing streams. See my other posts for more examples.


### More complicated cases

If you also have to keep track of some kind of asynchronous state while mapping, but you don't want the asynchronous state to be part of the stream, you can use `unfold`.

The `unfold` stream constructor takes an initial state, and an async closure that modifies the state asynchronously.

The following example has a closure without any await points, but in practice you would have some await points:

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

However, the `unfold` approach (which  was suggested by ChatGPT to me the first time I touched this subject) has some limitations. You are essentially moving all your state inside of the struct. This means you have to use the explicit `move` keyword, but you don't have a nice `struct` definition with named fields to disambiguate different parts of your state.


The best way forward, is to introduce a concrete type to capture your intermediate "stream state" properly. Then you can implement the required stream methods for this struct to be able to treat it as a real stream and actually use (or share) it in projects that make use of the universal `Stream` trait.



See other posts on this site for example on how to proceed on this path.