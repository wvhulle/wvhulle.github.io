+++
title = "Understanding coroutines"
description = "An overview of the relationship between normal functions, coroutines and streams."
[taxonomies]
tags = [ "functional", "Rust", "coroutine", "future", "async", "poll", "pin"]
+++

## Introduction

In some other posts on this site, I discuss how to create streams from scratch and how to combine them into new aggregated streams. This post puts them in perspective in relation with the other common types of functions you already know.


## Coroutines


### Conceptual

Normal functions just take input and return output (immediately).

**Coroutines** are functions that can be suspended.

1. Upon being suspended a coroutine **yields a value**.
2. Then the caller can continue with other functions.
3. Later the caller may decide to resume the suspended coroutine with resumption data input
4. If the coroutine ends, it returns (not yield) a final value 

### Implicit coroutines

Coroutines are used internally by the compiler when creating state machines from `async` blocks.

### Directly constructing coroutines

You may want to construct a coroutine yourself. However, the `Coroutine` trait in Rust is unstable and only available on nightly as of April 25.

The `Coroutine` trait definition is an extension of the standard libraries `Future` trait:

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



### Example of Rust coroutine


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


## Classification of coroutines

### Streams as a type of coroutine

We can classify everything seen in this presentation up until now:

|          | _YIELDS_      | _RESUMES_ | _RETURNS_     |
| -------- | ------------- | --------- | ------------- |
| ITERATOR | option        | !         | !             |
| FUTURE   | ()            | waker     | future output |
| STREAM   | future option | waker     | !             |

Remark: `GEN` stands for Rust `gen` blocks. In general, in other languages, generators can also return values.

Table inspired by [post by without.boats](https://without.boats/blog/poll-next/).

<!-- end_slide -->

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
| `#[coroutine]`       | input   | !          | item     | any       | any       |

Asynchronous functions:

|                    | _TAKES_ | _CAPTURES_ | _YIELDS_      | _RESUMES_ | _RETURNS_     |
| ------------------ | ------- | ---------- | ------------- | --------- | ------------- |
| `Future`           | !       | !          | ()            | waker     | future output |
| `async {}`         | !       | `'static`  | ()            | waker     | future output |
| Closures `AsyncFn` | input   | captured   | !             | !         | future output |
| `Stream`           | !       | !          | future option | waker     | !             |


