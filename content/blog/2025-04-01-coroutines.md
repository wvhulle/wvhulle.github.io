+++
title = "Understanding coroutines"
description = "An overview of the relationship between simple functions, coroutines and streams."
weight = 3
draft = false
[taxonomies]
tags = [ "functional", "Rust", "coroutine", "Future", "Poll", "Pin"]
+++

In some other posts on this site, you will find ways to create streams from scratch and how to combine them. This post will be about the relationship between the concept of a `Stream` (or asynchronous iterator) and the other, more familiar, functions present in most programming languages.

Most of this post was inspired by a [post by without.boats](https://without.boats/blog/poll-next/).

## Simple coroutines

### Concept of a coroutine

Normal functions return output (immediately). They do it only once (or never).

A **coroutine** is a special kind functions that can:

- be suspended multiple times
- be resumed multiple times
- return once

More specifically, at runtime, coroutines go through a process (with specific terminology):

1. When a coroutine suspends, it **yield**s a value to the caller. This is a kind of intermediate return value.
2. After observing (or ignoring) the yielded value, the caller can safely forget about the suspended coroutine (temporarily) and continue with other functions.
3. Later the caller can return to this suspended coroutine. The caller needs to resume the suspended coroutine to wake it up. This step is called **resumption**. For resumption some resumption data may need to be provided.

These steps may repeat forever or until the coroutine ends by returning. Returning is distinct from yielding, since it is final. The return value is the last value that can be observed by the caller.

_**Remark**: Coroutines are used internally by the Rust compiler while compiling asynchronous code. The compiler implements a form of "stack-less" co-routines for `async {}` code-blocks. These blocks are compiled implicitly into coroutines that yield at every `await`-point._

### Directly constructing coroutines

The `Coroutine` trait definition is an extension of the `Future` trait:

```rust
pub trait Coroutine<Resume = ()> {
    type Yield;
    type Return;

    fn resume(
        self: Pin<&mut Self>,
        resumption: Resume,
    ) -> CoroutineState<Self::Yield, Self::Return>;
}
```

Notice that we need `Pin`, similarly to `Future`. This is because coroutines may be self-referential. The `resume` function should only be called on coroutines that may move (are `Unpin`). The reason is probably that they should extend the behaviour of `Future`s which do require `Pin`.

_**Important**: The `Coroutine` trait in Rust is unstable and only available on nightly as of April 2025._

If you look carefully at the `Coroutine` trait you could see that (in pseudo-code):

```rust
type Future<Output> = Coroutine<
    Resume = Context, 
    Yield = (), 
    Return = Output
>;
```

More precisely, a future is a coroutine that yields nothing when suspended. A future needs a `Context` (containing a `Waker`) to be resumed or woken.

_**Remark**: The resumption data is provided by a asynchronous run-time to schedule `resume`s in an efficient way._

### Example of a coroutine

The Rust docs contain an example of a coroutine. The coroutine does not need any resumption data, but it yields a number and returns a string on completion:

```rust
let mut coroutine = #[coroutine] || {
    yield 1;
    "foo"
};
```

To use this `coroutine`, we have to provide an initial chunk of resumption data. By default this is the empty tuple `()`. The resumption data is passed to the `resume` function and used to anticipate the first yield. The first (and last) yield is `yield 1`.

```rust
match Pin::new(&mut coroutine).resume(()) {
    CoroutineState::Yielded(1) => {}
    _ => panic!("unexpected return from resume"),
}
```

The next time `resume` is called, no yield is encountered and the final return value is returned (a string).

```rust
match Pin::new(&mut coroutine).resume(()) {
    CoroutineState::Returned("foo") => {}
    _ => panic!("unexpected return from resume"),
}
```

If our coroutine was a `Future`, then `resume` would expect a `Context` with a `Waker`.

## Classification of coroutines

Reflecting on the concepts of an iterator, future and stream, we can say that:

- An **iterator** is coroutine that yields an `Option`.
- A **future** is a coroutine that resumes with a `Waker`.
- A **stream** is an iterator that yields futures.

Coroutines are a generalisation of these cases, which can be layed-out in a table:

|                     | _YIELDS_                  | _RESUMES_ | _RETURNS_ |
| ------------------- | ------------------------- | --------- | --------- |
| `Iterator`          | `Option`                  | `!`       | `!`       |
| `Future`, `AsyncFn` | `()`                      | `Waker`   | `Any`     |
| `Stream`            | `Future<Output = option>` | `!`       | `!`       |
| `Coroutine`         | `Any`                     | `Any`     | `Any`     |

In this table, the `!` symbol stands for `never`, the type in Rust that does not exist, because it is never returned.

Notice that a `Stream` does not need a `Waker` for resumption directly, but the yielded items are `Future<Output = Option>` which are coroutines themselves (and need a `Waker`).

For a practical introduction to coroutines in Rust, I recommend [Asynchronous Programming in Rust](https://github.com/PacktPublishing/Asynchronous-Programming-in-Rust).
