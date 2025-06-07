+++
title = "Functional async"
description = "How to start with the basics of functional asynchronous programming in Rust with streams and sinks."
weight = 1
[taxonomies]
tags = ["functional", "asynchronous", "declarative", "Rust", "Stream", "Sink"]
+++


## Introduction

Let's get started with some definitions you may have heard about already.

**Declarative programming** is when you write code and make sure that the inputs and outputs of sub-modules behave predictably according to fixed invariants. Logic or constraint solver languages like Prolog or [ManyWorlds](https://manyworlds.site/) (written by my friend [Jo Devriendt](https://jodevriendt.com)) are part of this family.

**Functional programming** is building the majority of your code from well-defined and side-effect-free functions. It is a sub-set of declarative programming. Languages like ML, Haskell, OCaml, Lisp are part of this family. They are all extensions of Lambda Calculus.

**Asynchronous programming** is a kind of programming where you not only have functions that evaluate immediately, but there are also functions that _may evaluate in the future_. Such functions are called asynchronous functions. JavaScript, C#, and Rust are examples.

In the following, I will show how declarative, functional, and asynchronous programming can be combined in the Rust programming language with the semi-standard library crate `futures`.


## Use-cases

Normal imperative asynchronous programming contains a combination of the `async`, `await` keywords with imperative keywords like `while`, `loop`, or `continue`.

To illustrate where functional asynchronous programming would be useful, I will give a few examples.


### Channels


One approach that you might take when dealing with different sub-modules in a large project is using channels to communicate between the different modules.

This could look like this:

```rust
let (tx, rx) = channel::new();
let (broadcast_tx, broadcast_rx) = broadcast_channel();
let forward_task = spawn(async move {
   loop {
       let result = rx.recv().await;
       match result {
           Ok(input) => {
               let output = get_output(input);
               broadcast_tx.send(output).unwrap();
           }
           Err(_) => break,
       }
   }
});
```

In this example, I use "watch" and "broadcast" channels from the Tokio crate.

If we would translate this to a functional asynchronous version, we get:

```rust
let (sender, receiver) = channel::new();
let (broadcast_sender, broadcast_receiver) = broadcast_channel();

let forward_task = spawn(
   async move {
       receiver
           .map(Result::ok)
           .filter_map(|result| result.ok())
           .map(get_output)
           .forward(broadcast_sender)
   }
);
```

So what happened during the translation?

- Replace the channel receiver with an implementor of the trait `Stream` from `futures`. A **stream** is just something that produces data at possibly irregular intervals. A channel receiver is an example of this.
- Replace the channel sender with a type implementing the `Sink` trait from `futures`. A **sink** is something that receives data, agnostic from the transport or channel used. An implementor of the `Sink` is something in which you can put data and flush it.
- **Redirect** the stream into the sink with `forward`. This process could be seen as "flushing" the stream into the sink. However, the `flush` name is already taken by the `flush` method of the `Sink` trait.



By shifting the focus from input, intermediate, and output variables to transformations with `map`, we replaced N imperative variables in the loop by N-1 **functional** closures passed to `map`. You could still argue that the variables did not really disappear, but they are now hidden in the closures and the code is more readable.

_Remark: JavaScript frameworks for building web-apps usually call `sink` a "signal" or "writable observable". The `gstremar-rs` crate also has "sinks" but they are not directly related to the "sinks" in `futures`_

### Reactive UI input

Another place where functional asynchronous programming is useful is on the frontend.

An imperative version might look like this:

```rust
let mut target_temperature = 21.0;
slider.on_slide(move |new_t| {
   if acceptable(new_t) {
       let new_target = some_op(new_t);
       target_temperature = new_target;
   }
});
```

Although this particular example is small, writing large amounts of a large codebase in this style could introduce problems:

- It introduces a lot of indentation. A developer who is new to the codebase might feel intimidated by the indentation. After careful consideration, he might decide to add his own logic on top of the existing code and then split the whole thing up into smaller chunks, thinking he improves readability, but actually breaking sequential readability.
- By using an `if` statement, you also create multiple branches. The reader or maintainer has to know that the `else` branch is irrelevant in this particular case. A call to `StreamExt::filter` already conveys the message that the `true` branch is the only one that matters.
- A maintainer also has to keep track of one more variable `new_t` (the argument to the closure). The naming of intermediate variables (variables for data that appears before or after a computation) is hard, and names like `old_t`, `new_t`, or `updated_t` are not helpful for the reader.

The imperative version can be translated to a functional version like this:

```rust
let mut target_temperature = MySink::new(21.0);
slider.value
   .filter(acceptable)
   .map(some_op)
   .forward(target_temperature);
```

The `MySink::new(21.0)` is a call to the constructor of `MySink`, an imaginary object that implements the `Sink` trait. 




### Clear benefits

Instead of exposing variables names for input, intermediate, and output variables, we omit them and focus on naming the transformations themselves. This way of dealing with computation is closer to how we communicate in natural language using verbs.

Another benefit of the functional approach is that it does not rely on a concrete type. If you are stuck in the middle of writing a module to provide a `Stream` but you also have to write something that consumes it, you can just continue with the last one. 

```rust
struct MyStream {
   // ...
}

impl MyStream {
   fn new() -> Self {
       unimplemented!()
   }
}

impl Stream for MyStream {
   type Item = i32;
   fn poll_next(self) -> Poll<Option<Self::Item>> {
       unimplemented!()
   }
}
```

You could then already start with another module that consumes it. But instead of directly depending on `MyStream`, you can just depend on the `Stream` trait. This way, you can write your code without having to know the implementation details of `MyStream`.

```rust
struct MyConsumer {
   // ...
}

impl MyConsumer {
   fn consume(stream: impl Stream<Item = i32>) {
       // We can start already!
       // ...
   }
}
```

The important part is `impl Stream<Item = i32>`. This means that the `consume` function can take any type that implements the `Stream` trait and produces `i32` items.

We have separated the problem into two levels of abstraction that can be dealt with independently and simultaneously:

- The **trait** level: describes the invariants and properties of inputs and outputs. Working on this level in Rust is accomplished using the `impl Trait` syntax.
- The **concrete type** level: describes the transport, the speed, the efficiency, the logic. For a concrete type, you will have to either:
 - Pick an implementor from a public crate (like `futures` or `tokio`).
 - Write your own implementor of the `Stream` trait. This is a bit more work, but it is not that hard. I will show you how to do this later on.


As of April 2025, the traits `Stream` and `Sink` are used universally by crates published on [crates.io](crates.io). If you make use of these traits, which describe a common behavior, and implement them for your own types, you make your code more interoperable with the rest of the world.
  

**Important**: It is important to know while using Rust that it is not required to know everything about `Pin` or `Poll`. You can just use the high-level methods provided by the standard library and `futures` crate.


### Streams

### Relationship with iterators

The main thing that is added in functional asynchronous programming is the `Stream` trait. You are supposed to use it everywhere. There are other things of course, but this is the main concept that you will need.

So what is a **stream**? It is just something that implements the `Stream` trait from the `futures` crate. It nothing more than an asynchronous iterator.

A rough conceptual definition of a stream would be:

> A function that returns multiple values at unpredictable times.

First, remember that the life-time of an iterator (a normal synchronous blocking one) looks like this:

| T  | create    | iterate    | yield    |
| --- | ---------- | ----------- | --------- |
| 1  | `(1..=10)` |            |          |
| 2  |            | `next()`   |          |
| 3  |            |            | `Some(1)` |
| 4  |            | `next()`   |          |
| 5  |            |  ...      |          |
| 6  |            | `next()`   |          |
| 7  |            |            | `None`  |
| 8  |            | `next()`   |          |
| 9 | | | `Some(2)` |

Notice that calling `next` after the iterator yielded `None` may result in a new `Some`. If you do not want that, apply `fuse` to the iterator to obtain a `FusedIterator` that will keep yielding `None` after the first `None`.

The life-time of a stream/async iterator during usage looks like this:

| **T** | **Creation** | **Iteration** | **Yielted** |
| --- | ----------- | ----------- | --------- |
| 1  | `St::new()` |            |          |
| 2  |            | `next()`   |          |
| 3  |            | `await`    |          |
| 4  |            |            | `Some(1)` |
| 5  |            | `next()`   |          |
| 6  |            |  ...      |          |
| 7  |            | `await`    |          |
| 8  |            |            | `Some(2)` |
| 9  |            | `next()`   |          |
| 10 | | | `None` |

The lifecycle of an async iterator (stream) is longer than a normal iterator since it requires an `await` before a value is yielded. 

A `FusedStream` is the async analogue of `FusedIterator` and will yield `None` after the first `None`. In addition, it has a non-async method `is_terminated` that says whether the stream is exhausted already.

```rust
pub trait FusedStream: Stream {
   fn is_terminated(&self) -> bool;
}
```

Usually a `FusedStream` will yield `Poll::Ready(None)` after the first `Poll::Ready(None)` and it's `is_terminated` method will be positive. However, the implementor has the freedom to break these conventions.



### Consuming streams

_**Remark**: As of April 2025, all the methods you need for streams are in [`StreamExt`](https://docs.rs/futures/latest/futures/stream/trait.StreamExt.html) from `futures`. For the rest of this article, almost all `Stream`-related methods come from this trait._

The simplest case would be the case where you just want to perform an operation for each element that is yielded by the stream. For this, you should use the `for_each` method to act on each item in `Some(item)`.

```rust
let mut x = 0;
let fut = stream::repeat(1).take(3).for_each(|item| {
   x += item;
    future::ready(())
});
fut.await;
assert_eq!(x, 3);
```


Observe that the argument for the closure in `for_each` does not take an `Option`. The stream returned by `for_each` is fused; it is an implementor of `FusedStream`. A `FusedStream` is a special type of stream that terminates as soon as one item yielded by the input stream is `None`.

**Important**: 

- The futures that are evaluated while consuming the `for_each` will not overlap in execution. They will happen sequentially. 
- The `for_each` will not do any work, unless it is **driven** by an asynchronous executor. The reason is that streams are _lazy_, just like normal iterators in Rust.


Very often we just have to apply one blocking, synchronous operation to every output item from an input stream and return a new stream with the mapped items. The `map` stream operator is the right tool for this:

```rust
let stream = stream::iter(1..=3);
let stream = stream.map(|x| x + 3);
```

When the operation in the closure is asynchronous you should use `then` (as in `Future::then`).

```rust
let stream = stream::iter(1..=3);
let stream = stream.then(|x| async move { convert(x).await });
```

Feel free to use async closures `async |_| {}` or `AsyncFn` in recent Rust versions. Asynchronous closures were only recently stabilized as of April 2025. Since I do not understand the implementation of async closures very well, I prefer to keep using the old syntax: `|x| async move {}` for now. This syntax works better with older versions of Rust.

_**Remark**: In previous major version releases of `futures`, `then` and `map` were a single function. The crate `futures-preview` an old version. Avoid reading the documentation of `futures-preview` to prevent confusion. (Everything you need for the rest of this presentation is available in `futures >= 0.3.31`.)_


### Stream test helpers

While implementing your own streams (maybe not now but later on), you will run into situations where you need consume the streams as if you were a typical consumer. The `futures` crate provides helpers for tests that are analogous to the ones in `Iterator`. The only thing that distinguishes them is being **operators on asynchronous iterators**:

The following `Stream` helpers / operators take a stream and perform some simple actions on it without changing the values:

- `skip_while`: Drops items from a stream while a condition is met (provided as a boolean closure on the items of the input stream).
- `peekable`: Adds a `peek` method that can be used to preview a **reference to the next item** without consuming it (yet). This is useful when you don't want to _step too fast_ through the stream.
- `take`: Simply skip a number of items from the beginning of the stream.
- `enumerate`: Adds an increasing index to the items of stream, starting from the beginning.

For example, you can use `enumerate` as follows:

```rust
let stream = stream::iter(vec!['a', 'b', 'c']);

let mut stream = stream.enumerate();

assert_eq!(stream.next().await, Some((0, 'a')));
assert_eq!(stream.next().await, Some((1, 'b')));
assert_eq!(stream.next().await, Some((2, 'c')));
assert_eq!(stream.next().await, None);
```


### Filtering streams

You can filter a stream of numbers to only keep the even numbers as follows:

```rust
use std::future::ready;
use futures::{stream, StreamExt};

let stream = stream::iter(1..=10);
let events = stream.filter(|x| ready(x % 2 == 0));
```

Notice the `ready` function. This function maps primitive Rust values __into the async world__. The output of `ready` is a minimal `Future` that can be moved: it is **`Unpin`**. 

_**Remark**: Don't try to implement `ready` yourself, just import it from `std::future::ready`._


### Boolean operators

The `futures` crate also provides analogues for the boolean operators shipped with the standard library `Iterator` such as `any`, `all`, ... :

```rust
let number_stream = stream::repeat(1).map(|n| n);
let less_then_twenty = number_stream.all(|i| async move { i < 20 });
assert_eq!(less_then_twenty.await, true);
```

Notice here that we don't have to "pin" the `less_then_twenty` stream, because `Unpin` is not a requirement for `all`.

### Sinks

### Dual of streams

Up until now we have only seen detailed usage of the `Stream` trait. But the opposite of a stream, a "sink", is also shipped by the `futures` crate as the `Sink` trait. A `Sink` is **something that receives data, agnostic from the transport** or channel used. 



The different life-cycle stages of a `Sink` can be summarized as follows:

| stage   | name      | method            | meaning               | remark         |
| -------- | ---------- | ------------------ | ---------------------- | --------------- |
| creation | new       |                   | Initial state         |                |
| send    | ready     | `ready().await`   | Wait until cache ready | may be full    |
| send    | start send | `start_send(item)` | Load into cache       | not actual send |
| send    | flush     | `flush().await`   | Send items from cache |                |
| close   | close     | `close().await`   | Close the `Sink`      | not automatic  |


The analogue of the map function for streams `StreamExt::map` for `Sink`s is the sink operator `SinkExt::with`. Instead mapping the output items of a stream, it applies a mapping function to all items that are going to be flushed into the sink.

If a `Sink` becomes full easily and you depend on the concrete underlying type (such as for example a sink derived from a particular type of sender of a Tokio channel), you can allocate an extra buffer with `StreamExt::buffer()` to cache elements that don's fit in the sink.

_Remark: The `Sink` trait is not as common as the `Stream` trait in the crates that I have used. It is, however, very easy to implement yourself._

### Flushing a `Stream` into a `Sink`

A `Sink` may appear in combination with a `Stream`. In that case, it is possible to create a fully functional pipeline that takes a stream and flushes it into a sink. This is done with the `forward` method of the `Sink` trait.

```rust
let (output,_) = channel::new();
let output = PollSender::new(output);

let input = stream::repeat(1).map(Ok);
input.forward(output).await.unwrap();
```

Important: 

- `StreamExt::forward` takes a `TryStream` (items are `Result`)
- returns future of `Result` (need to ignore error).

### More `Sink` operators

The `forward` method will also close the `Sink` upon termination of the input stream. If you don't want to close the `Sink` after stream returned `None`, use the sink operator `SinkExt::send_all`.

When you have one input stream and know `n` output sinks **at compile-time**, you can use `StreamExt::fanout`. Otherwise you will need a mechanism to `Clone` the input stream at run-time.

### Splitting streams

### Collapsing an iterable of streams

Given an iterable of streams, you can collapse the whole iterable into one stream with `select_all`. This function will just emit the stream items from all the streams (assuming the iterator is finite) as they arrive.

A simple example would look like this:

```rust
let stream_a = stream::repeat(1);
let stream_b = stream::repeat(2);

let merged = stream::select_all([stream_a, stream_b]);
```

In practice, you would typically pass large vectors, compile-time-sized arrays or other iterable collections to the `select_all` function.

### Filtering streams

You can filter a stream of numbers to only keep the even numbers as follows:

```rust
use std::future::ready;
use futures::{stream, StreamExt};

let stream = stream::iter(1..=10);
let events = stream.filter(|x| ready(x % 2 == 0));
```

Notice the `ready` function. This function maps primitive Rust values __into the async world__. The output of `ready` is a minimal `Future` that can be moved: it is **`Unpin`**. 

_**Remark**: Don't try to implement `ready` yourself, just import it from `std::future::ready`._

### Boolean operators

The `futures` crate also provides analogues for the boolean operators shipped with the standard library `Iterator` such as `any`, `all`, ... :

```rust
let number_stream = stream::repeat(1).map(|n| n);
let less_then_twenty = number_stream.all(|i| async move { i < 20 });
assert_eq!(less_then_twenty.await, true);
```

Notice here that we don't have to "pin" the `less_then_twenty` stream, because `Unpin` is not a requirement for `all`.
