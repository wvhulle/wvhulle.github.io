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

Imagine you would not want to do any kind of functional asynchronous programming. What would that look like? 

It would just look like asynchronous programming and the `async`, `await` keywords with imperative keywords like `while`, `loop` or `continue`.


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

In this example I use `Tokio` "watch" and "broadcast" channels.

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
- Replace the channel sender with a type implementing the  `Sink` trait from `futures`. A **sink** is something that receives data, agnostic from the transport or channel used.
- **Redirect** the stream into the sink with `forward`. This process could be seen as "flushing" the stream into the sink. However, the `flush` name is already taken by the `flush` method of the `Sink` trait.


A side effect of this is that we replace N intermediate variables in the loop by N-1 `map` functional operations. This is where the functional aspect comes in.

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

One problem with this code is that it has a lot of indentation and different branches, even though it is quite simple. It also requires the maintainer to maintain a little more variable names. 

Translating this to functional asynchronous Rust:

```rust
let mut target_temperature = sink(21.0);
slider.value
    .filter(acceptable)
    .map(some_op)
    .forward(target_temperature);
```

In mainstream web-frameworkds the `sink` will be called a "signal" or "writable observable".


## First observations

Instead naming the inputs and outputs, we focus on naming the transformations itself. The successive application of the transformations/functions is slightly easier to read for me. 

Another benefit of the functional approach is that it does not rely on a concrete type. `Stream` and `Sink` are universal traits (or interfaces). If you make use of these traits, which describe a common behaviour, and implement them for your own types, you make your code more interoperable with the rest of the world.

On the other hand, on the consumer side, a consumer of a functional library using these traits does not need to know the implementation details. It is not required how the data exactly moves in the dependency. I like to think of it as:

- The **trait**-level: describes the invariants and properties of inputs and outputs
- The **concrete type** level: describes the transport, the speed, the efficiency, the logic
  

**Important**: It is important to know while using Rust that it is not required to know everything about `Pin` or `Poll`. You can just use the high-level methods provided by the standard library and `futures` crate.


## Simple building blocks 

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


This is longer and more complicated than a normal iterator. An async iterator requires an `await` before a value is yielded. 

As you can see in the last table, streams may yield `None` at first and later on still yield a `Some`. This is very different from iterators. Keep this in mind, especially further on, when creating your own streams. If you do not like this behaviour, you have to restrict your focus to `FusedStream`.


## Basic usage of streams

Before we dive into how streams are actually built in Rust, I would like to show you how to use a stream. You will notice that the methods on a stream are very similar to `Iterator`.

The most basic operation is of course `st.next()`. This will create a future that references the stream and evaluates to a next item or `None`.


**Remark**: As of April 25, all the methods you need for streams are in [`StreamExt`](https://docs.rs/futures/latest/futures/stream/trait.StreamExt.html) from `futures`. For the rest of this article, almost all `Stream`-related methods come from this trait.


### Consuming streams

The simplest case would be the case where you just want to perform an operation for each element that is yielded by the stream. For this, you should use the `for_each` method to act on each `Some` item.

```rust
let mut x = 0;
let fut = stream::repeat(1).take(3).for_each(|item| {
    x += item;
    future::ready(())
});
fut.await;
assert_eq!(x, 3);
```


Observe that the argument for the closure in `for_each` does not take an `Option`. The stream returned by `for_each` is fused, it is an implementor of `FusedStream`. It terminates as soon as one output item from the input stream is a `None`.

Also notice that the output of the closure has to be a future. But it does not need to await anything, so we use the `ready` future, the simplest possible future without any await points.

**Important**: 

- The futures that are evaluated while consuming the `for_each` will not overlap in execution. They will happen sequentially. 
- The `for_each` will not do any work, unless it is **driven** by an asynchronous executor. The reason is that streams are _lazy_, just like normal iterators in Rust.


Very often we just have to apply one blocking, synchronous operation to every output item from an input stream and return a new stream with the mapped items.

```rust
let stream = stream::iter(1..=3);
let stream = stream.map(|x| x + 3);
```

When the operation in the closure is asynchronous you should use `then` (as in `Future::then`).

```rust
let stream = stream::iter(1..=3);
let stream = stream.then(|x| async move { convert(x).await });
```

Feel free to use async closures `async |_| {}` or `AsyncFn` in recent Rust versions. 

I prefer to stick to the good-old `async move {}` blocks.

**Important**: In previous major version releases of `futures`, `then` and `map` were a single function. The crate `futures-preview` is an old fork such an old version. Avoid it's documentation to prevent confusion. (Everything you need for the rest of this presentation is available in the recent official release of `futures`.)



### Stream test helpers

When you are testing a stream, you often want to use the following methods (which are completely identical to `Iterator` apart from being asynchronous):

- `skip_while`: drop items while a condition is met
- `peekable`: preview a reference to the next item
- `take`: skip a number of items
- `enumerate`: add an index to the items

An example of using `enumerate`:

```rust
let stream = stream::iter(vec!['a', 'b', 'c']);

let mut stream = stream.enumerate();

assert_eq!(stream.next().await, Some((0, 'a')));
assert_eq!(stream.next().await, Some((1, 'b')));
assert_eq!(stream.next().await, Some((2, 'c')));
assert_eq!(stream.next().await, None);
```



### Filtering streams

```rust
use std::future::ready;
use futures::{stream, StreamExt};

let stream = stream::iter(1..=10);
let events = stream.filter(|x| ready(x % 2 == 0));
```

Notice the `ready` function. It maps sync values into async values / futures **which are `Unpin`**.

Because the closure is `Unpin`, the resulting  `Stream` called `events` is also `Upin`.



**Important**: Sometimes the error messages emitted compiler may steer you on the wrong path. For example, the following would be an `Unpin` stream and the compiler will not allow you to call the `next` method on it:

```rust
stream.filter(|x| async move { x % 2 == 0});
```

The compiler messages may lead you to pinning the whole stream or the closure on the heap with `Box::pin` and your hacky solution will look like some of the following:

```rust
stream.filter(|x| Box::pin(async move { x % 2 == 0}));
Box::pin(stream.filter(|x| async move { x % 2 == 0}));
stream.filter(|x| async move { x % 2 == 0}).boxed();
```

However, this is not necessary and involves **unnecessary heap allocations**. Use the `std::future::ready` function from above instead.



### Filter map

The `filter_map` operator:
- takes a stream and a closure that returns an option
- removes `None` values, shortening the output stream

```rust
let stream = stream::iter(1..=10);
let events = stream.filter_map(|x| async move {
    if x % 2 == 0 { Some(x + 1) } else { None }
});
```

<!-- end_slide -->

### Boolean operators

There are also analogues for all boolean operators from `Iterator`: any, all, ...

```rust
let number_stream = stream::iter(0..10);
let less_then_twenty = number_stream.all(|i| async move { i < 20 });
assert_eq!(less_then_twenty.await, true);
```





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

<!-- end_slide -->

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


### Inhomogenous stream merging

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

- Creating a broadcast channel, send the cloneable  items into the sender and  tell many async helper tasks (or threads) to actively pull each receiver. This would be an imperative approach and requires extra heap allocations for each task and output.
- Create a special kind of output cloneable stream that works cooperatively with any other sibling streams and wakes them up when necessary. This is a more functional approach and may require less heap allocations. It may also allow you to drop any dependency on a particular async runtime (to be verified).

In case you go for the last approach, there are a couple of crates available on [crates.io](crates.io) that turn a stream with cloneable items into a cloneable stream with the same items:


- [my implementation](https://github.com/wvhulle/forked_stream): more tests, no Tokio dependency.
- [fork_stream](https://crates.io/crates/fork_stream), slightly more complicated with a Waker queue.
- [shared_stream](https://docs.rs/shared_stream/latest/shared_stream/): using `unsafe`, no tests.


