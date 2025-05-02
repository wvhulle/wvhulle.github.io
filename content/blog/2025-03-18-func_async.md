+++
title = "Functional asynchronous Rust"
description = "Declarative/functional asynchronous programming in Rust with streams and sinks."
weight = 1
[taxonomies]
tags = ["functional", "asynchronous", "declarative", "Rust", "stream", "sink"]
+++


## Introduction

Let's get started with some definitions you may have heard about already.

**Declarative programming** is when you write code and make sure  that the inputs and outputs of sub-modules behave predictably according to fixed invariants. Logic or constraint solver languages like Prolog or [ManyWorlds](https://manyworlds.site/) (written by my friend [Jo Devriendt](https://jodevriendt.com)) are part of this family.

**Functional programming** is building the majority of your code from wel-defined and side-effect-free functions. It is a sub-set of declarative programming. Languages like ML, Haskell, OCaml, Lisp are part of this family. They are all extensions of Lambda Calculus.

**Asynchronous programming** is a kind of programming where you not only have functions that evaluate immediately, but there are also functions that _may evaluate in the future_. Such functions are called asynchronous functions. JavaScript, C# and Rust are examples.

In the following I will show how declarative, functional and asynchronous programming can be combined in the Rust programming language with the semi-standard library crate `futures`.


## Use-cases

Normal imperative asynchronous programming contains a combination of the `async`, `await` keywords with imperative keywords like `while`, `loop` or `continue`.

To illustrate where functional asynchronous programming would be useful, I will give a few examples.


### Channels


One approach that you might take when dealing with different sub-modules in a large project is using channels to communicate between the different modules.

This could look like this:

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

In this example I use "watch" and "broadcast" channels from the Tokio crate.

If we would translate this to a functional asynchronous version, we get:

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

So what happened during the translation? 

- Replace the channel receiver with an implementor of the trait `Stream` from `futures`. A **stream** is just something to produces data at possibly irregular intervals. A channel receiver is an example of this. 
- Replace the channel sender with a type implementing the  `Sink` trait from `futures`. A **sink** is something that receives data, agnostic from the transport or channel used. An implementor of the `Sink` is something in which you can put data and flush it.
- **Redirect** the stream into the sink with `forward`. This process could be seen as "flushing" the stream into the sink. However, the `flush` name is already taken by the `flush` method of the `Sink` trait.



By shifting the focus from input, intermediate and output variables to transformations with `map` we replaced N imperative variables in the loop by N-1 **functional** closures passed to `map`. You could still argue that the variables did not really disappear, but they are now hidden in the closures and the code is more readable.

_Remark: JavaScript frameworks for building web-apps usually call `sink` a "signal" or "writable observable". The `gstreamer-rs` crate also has "sinks" but they are not directly related to the "sinks" in `futures`_

### Reactive UI input

Another place where functional asynchronous programming is useful, is on the frontend. 

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

- It introduces a lot of indentation. A developer who is new to the codebase might feel intimidated by the indentation. After careful consideration he might decide add his own logic on top of the existing code en then split the whole thing up in smaller chunks, thinking he improves readability, but actually breaking sequential readability. 
- By using an `if` statement you also create multiple branches. The reader or maintainer has to know that the `else` branch is irrelevant in this particular case. A call to `StreamExt::filter` already conveys the message that the `true` branch is the only one that matters. 
- A maintainer also has to keep track of one more variable `new_t` (the argument to the closure). The naming of "intermediate" variables (variables for data that appears before or after a computation) is hard and names like `old_t`, `new_t` or `updated_t` are not helpful for the reader.

The imperative version can be translated to a functional version like this:

```rust
let mut target_temperature = MySink::new(21.0);
slider.value
    .filter(acceptable)
    .map(some_op)
    .forward(target_temperature);
```

The `MySink::new(21.0)` is a call to the constructor of `MySink`, an imaginary object that implements the `Sink` trait. 





## First observations

Instead of exposing variables names for input, intermediate and output variables, we omit them and focus on naming the transformations themselves. This way of dealing with computation is closer to how we communicate in natural language using verbs.

Another benefit of the functional approach is that it does not rely on a concrete type. If you are stuck in the middle of writing a module to provides a `Stream` but you also have to write something that consumes it, you can just continue with the last one. 

```rust
struct MyStream {
    ...
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

You could then already start with another module that consumes `MyStream`. But instead of directly depending on `MyStream`, you can just depend on the `Stream` trait. This way, you can write your code without having to know the implementation details of `MyStream`.

```rust
struct MyConsumer {
    ...
}

impl MyConsumer {
    fn consume(stream: impl Stream<Item = i32>) {
        // We can start already!
        ...
    }
}
```

The important part is `impl Stream<Item = i32>`. This means that the `consume` function can take any type that implements the `Stream` trait and produces `i32` items.

We have separated the problem into two levels of abstraction that can be dealt with independently and simultaneously:

- The **trait**-level: describes the invariants and properties of inputs and outputs. Working on this level in Rust is accomplished using the `impl Trait` syntax.
- The **concrete type** level: describes the transport, the speed, the efficiency, the logic. For a concrete type, you will have to either:
  - Pick an implementor from a public crate (like `futures` or `tokio`).
  - Write your own implementor of the `Stream` trait. This is a bit more work, but it is not that hard. I will show you how to do this later on.


As of April 2025, the traits `Stream` and `Sink` are used universally by crates published on [crates.io](crates.io). If you make use of these traits, which describe a common behavior, and implement them for your own types, you make your code more interoperable with the rest of the world.
  

**Important**: It is important to know while using Rust that it is not required to know everything about `Pin` or `Poll`. You can just use the high-level methods provided by the standard library and `futures` crate.


## Streams

### Relationship with iterators

The main thing that is added in functional asynchronous program is the `Stream` trait. You are supposed to use it everywhere. There are other things of course, but this is the main concept that you will need.

So what is a **stream**? It is just something that implements the `Stream` trait from the `futures` crate. It nothing more than an asynchronous iterator.

A rough conceptual definition of a stream would be:

> A function that returns multiple values at unpredictable times.

First, remember that the life-time of an iterator (a normal synchronous blocking one) looks like this:

| T   | create     | iterate     | yield     | end    |
| --- | ---------- | ----------- | --------- | ------ |
| 1   | `(1..=10)` |             |           |        |
| 2   |            | `it.next()` |           |        |
| 3   |            |             | `Some(1)` |        |
| 4   |            | `it.next()` |           |        |
| 5   |            | `1+1`       |           |        |
| 6   |            | `it.next()` |           |        |
| 7   |            |             |           | `None` |

Here, I put the `1+1` to represent a random unrelated computation.

The life-time of a stream/async iterator during usage looks like this:

| T   | create      | iterate     | yield     | null   |
| --- | ----------- | ----------- | --------- | ------ |
| 1   | `St::new()` |             |           |        |
| 2   |             | `st.next()` |           |        |
| 3   |             | `await`     |           |        |
| 4   |             |             | `Some(1)` |        |
| 5   |             | `it.next()` |           |        |
| 6   |             | `1+1`       |           |        |
| 7   |             | `await`     |           |        |
| 8   |             |             | `Some(2)` |        |
| 9   |             | `it.next()` |           |        |
| 10  |             | `await`     |           |        |
| 11  |             |             |           | `None` |
| 12  |             | `it.next()` |           |        |
| 13  |             | `await`     |           |        |
| 14  |             |             | `Some(3)` |        |


The lifecycle of an async iterator (stream) is clearly longer and more complicated than a normal iterator. An async iterator requires an `await` before a value is yielded. 

_Remark: The `next()` method returns a future that evaluates to an `Option`. Or in Rust notation we express this with: `fn next() -> Impl Future<Output = Option<T>>`. The return type may or may not implement certain important traits. For example, it is **not guaranteed that it can be moved** once created._ 

As you can see in the last table, streams may yield `None` at first and later on still yield a `Some`. This is very different from iterators. Keep this in mind, especially further on, when creating your own streams. If you do not like this behavior, you have to restrict your focus to `FusedStream`.


### `Stream`s in the wild


The first place to look for `Stream`s is in the `futures::channel` module. It contains a concrete implementation of channels with receivers that implement `Sink` and senders that implement `Stream`.

If you need more advanced types of channels, you can look in the [`postage`](https://crates.io/crates/postage) or `tokio` crates.

**Important**: The channels in `tokio` are not directly usable with the `futures` crate. You need to:

-  wrap the receivers in wrappers provided by `tokio-stream` (with the `sync` crate feature enabled) to get a `Stream` and
-  wrap the senders in a wrapper `PollSender` provided by `tokio-util` to get a `Sink`.


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

Also notice that the output of the closure has to be a future. But it does not need to await anything, so we use the `ready` future, the simplest possible future without any await points (and consequently, also `Unpin`, see other blog posts).

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


### Why  `ready`? (optional intermezzo)

Sometimes the error messages emitted compiler may steer you on the wrong path. For example, the following would be an `Unpin` stream and the compiler will not allow you to call the `next` method on it:

```rust
let output_stream = stream.filter(|x| async move { x % 2 == 0});

// Compiler error: `output_stream` does not implement `Unpin`!
assert_eq!(output_stream.next().await, Some(2));
```

The compiler messages may lead you to pinning the whole stream or the closure on the heap with `Box::pin` and your hacky solution will look like some of the following:

```rust
stream.filter(|x| Box::pin(async move { x % 2 == 0}));
Box::pin(stream.filter(|x| async move { x % 2 == 0}));
stream.filter(|x| async move { x % 2 == 0}).boxed();
```

However, this is not necessary and involves **unnecessary heap allocations**. Use the `std::future::ready` function from above instead.

Because the output of the closure `ready(x % 2 == 0)` is an `Unpin` `Future`, the closure `|x| ready(x % 2 == 0)` itself is also `Unpin`.

Remember from the "auto-trait" rules of Rust that auto-traits such as `Unpin` are automatically implemented for all `struct`s for which all fields implement `Unpin`. This implies that if the closure is `Unpin`, the `Filter` stream will also be `Unpin`.

Each time you write `stream.filter(|x| {...})`, you create a new stream  that consumes the input `stream`. Internally, `.filter` constructs a `Filter` which looks (simplified) as follows:

```rust
pub struct Filter<St, Fut, F> where St: Stream {
    stream: St,
    f: F,
    pending_fut: Option<Fut>,
    pending_item: Option<St::Item>,
}
```

The resulting stream needs to keep in memory a reference to the closure (so that it can map future items). The easiest way to have such a reference is to just own it. So in practice, the output `Filter` stream is a struct with an extra field `f` for storing the closure. 

_Remark: The closure `f` does not have to be a real capturing closure, it can be any type that implements the `Fn` trait which includes function pointers or function items._


### Filter map

When you are working with a stream and need to extract some information from it, but this extraction is fallible, you can use `filter_map`.

The `filter_map` operator:
- takes a stream and a closure that returns an option
- maps each element of the input stream to an option
- removes any  `None` values in the output and unwrap all the `Some` values.



```rust
let stream = stream::iter(1..=10);
let events = stream.filter_map(|x| async move {
    if x % 2 == 0 { Some(x + 1) } else { None }
});
```

In case your closure returns `Result`, you can pass `Result::ok` to the `filter_map` operator to convert each `Result` item into an `Option` item. 

_**Important**: Don't forget to use the `try_*` operators from [`futures::TryStreamExt`](https://docs.rs/futures/latest/futures/stream/trait.TryStreamExt.html). I have not used them myself yet, but they seems quite useful when dealing with fallible streams._


### Boolean operators

The `futures` crate also provides analogues for the boolean operators shipped with the standard library `Iterator` such as `any`, `all`, ... :

```rust
let number_stream = stream::iter(0..10);
let less_then_twenty = number_stream.all(|i| async move { i < 20 });
assert_eq!(less_then_twenty.await, true);
```

## `Sink`s

### Dual of streams

Up until now we have only seen detailed usage of the `Stream` trait. But the opposite of a stream, a "sink", is also shipped by the `futures` crate as the `Sink` trait. A `Sink` is **something that receives data, agnostic from the transport** or channel used. 



The different life-cycle stages of a `Sink` can be summarized as follows:




| stage    | name       | method             | meaning                | remark          |
| -------- | ---------- | ------------------ | ---------------------- | --------------- |
| creation | new        |                    | Initial state          |                 |
| send     | ready      | `ready().await`    | Wait until cache ready | may be full     |
| send     | start send | `start_send(item)` | Load into cache        | not actual send |
| send     | flush      | `flush().await`    | Send items from cache  |                 |
| close    | close      | `close().await`    | Close the `Sink`       | not automatic   |


The analogue of the map function for streams `StreamExt::map` for `Sink`s is the sink operator  `SinkExt::with`. Instead mapping the output items of a stream, it applies a mapping function to all items that are going to be flushed into the sink.

If a `Sink` becomes full easily and you depend on the concrete underlying type (such as for example a sink derived from a particular type of sender of a Tokio channel), you can allocate an extra buffer with `StreamExt::buffer()` to cache elements that don't fit in the sink.

_Remark: The `Sink` trait is not as common as the `Stream` trait in the crates that I have used. It is, however, very easy to implement yourself._


### Flushing a `Stream` into a `Sink`

A `Sink` may appear in combination with a `Stream`. In that case, it is possible to create a fully functional pipeline that takes a stream and flushes it into a sink. This is done with the `forward` method of the `Sink` trait.

```rust
let (output,_) = tokio::sync::mpsc::channel();
let output = tokio_util::PollSender::new(output);

let input = stream::repeat(1).map(Ok);
input.forward(tx).await.unwrap();
```

Important: 

- `StreamExt::forward` takes a `TryStream` (items are `Result`)
- returns future of `Result` (need to ignore error).

### More `Sink` operators

The `forward` method will also close the `Sink` upon termination of the input stream. If you don't want to close the `Sink` after stream returned `None`, use the sink operator `SinkExt::send_all`.



When you have one input stream and know `n` output sinks **at compile-time**, you can use `StreamExt::fanout`. Otherwise you will need a mechanism to `Clone` the input stream at run-time. Cloning of streams will be discussed later on.

## Merging and splitting



### Collapsing an iterable of streams

Given an iterable of streams, you can collapse the whole iterable into one stream with [`select_all`](https://docs.rs/futures/latest/futures/stream/fn.select_all.html). This function will just emit the stream items from all the streams (assuming the iterator is finite) as they arrive.

A simple example would look like:

```rust
let stream_a = stream::repeat(1);
let stream_b = stream::repeat(2);

let merged_tagged = stream::select_all([stream_a, stream_b]);
```

In practice, you would typically pass large vectors, compile-time-sized arrays or other iterable collections to the `select_all` function.


Often, you will want to merge (a lot of) streams that come from a different underlying transport. This might be the case, for example, when you have input streams that are derived from channel receivers from different crates, internal or external. In that case, the input iterable of streams for `select_all` needs to be an interable over boxed stream trait objects `Pin<Box<dyn Stream>>`.

**Remark**: A special case of `select_all` for two input streams is the `merge` function from the Tokio helper crate `tokio-stream`. You can use it if you want, but the `select_all` function does the same thing and is more powerful and general.

### Tracking source

If you want to keep track of the origin of the values in the merged stream, the simplest solution you can come up will probably look like this:

```rust
let stream_a = stream::repeat(1).map(|n| ('a', 1));
let stream_b = stream::repeat(2).map(|n| ('b', 2));

let merged_tagged = stream::select_all([stream_a, stream_b]);
```

This is essentially just a homogeneous merge with `select_all` preceded by tagging each individual item with an identifier for the source stream.

**Remark**: in this simple case you might want to consider a simple custom combinator (see other posts on how to build one) or the one provided by `tokio_stream::MergeMap`.


### Inhomogeneous stream merging

If you feel like merging two streams with a different item type, you are probably doing something wrong. It is quite rare that you would want to wait for two items to be available from both streams (which are in practice usually emitted at unrelated times). However, it is possible using the `zip` function from the `futures` crate. 

```rust
let stream1 = stream::iter(1..=3);
let stream2 = stream::iter(5..=10);

let vec = stream1.zip(stream2)
                 .collect::<Vec<_>>()
                 .await;
assert_eq!(vec![(1, 5), (2, 6), (3, 7)], vec);
```


### Splitting streams

What if you need to use the same output of a stream in several places? You can do it with one of the following:

- Creating a broadcast channel, send the clone-able  items into the sender and  tell many async helper tasks (or threads) to actively pull each receiver. This would be an imperative approach and requires extra heap allocations for each task and output.
- Create a special kind of output clone-able stream that works cooperatively with any other sibling streams and wakes them up when necessary. This is a more functional approach and may require less heap allocations. It may also allow you to drop any dependency on a particular async runtime (to be verified).

In case you go for the last approach, there are a couple of crates available on [crates.io](crates.io) that turn a stream with clone-able items into a clone-able stream with the same items:


- [clone-stream](https://github.com/wvhulle/clone-stream): A library that I made in April 2025. It contains several tests and was benchmarked with thousands of clones.
- [fork_stream](https://crates.io/crates/fork_stream), slightly more complicated with a Waker queue. I tried something similar but then I moved away from tracking clones based on `Waker`s because it was hard to write unit tests for.
- [shared_stream](https://docs.rs/shared_stream/latest/shared_stream/): This crate uses a lot of `unsafe` Rust and does not contain tests.


Average usage of my crate `clone-stream` looks like:

```rust
use futures::{FutureExt, StreamExt, stream};
use clone_stream::ForkStream;

let un_clone_able_stream = stream::iter(0..10);
let clone_able_stream = un_clone_able_stream.fork();
let mut cloned_stream = clone_able_stream.clone();
```

In later posts I will show how the `clone-stream` works and the overall experience I had with implementing or creating your own `Stream` combinator (something that combines streams and returns a stream) in Rust.