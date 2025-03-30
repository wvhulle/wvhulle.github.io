---
title: Functional async programming
sub_title: Mostly in Rust
author: Willem Vanhulle
theme:
  name: catppuccin-latte
options:
  end_slide_shorthand: true
---


## Imperative async programming

A typical binary

```rust
async fn main() -> () {
  let (_, in_receiver) = watch::channel(1);
  let (out_sender, _) = broadcast::channel(123);
  let forward_task = spawn(async move {
      loop {
          let result = in_receiver.changed().await;
          if let Err(e) = result { 
            warn!("Receiver closed ...{}", e);
            break 
          };
          let input = *in_receiver.borrow();
          let output = get_output(input);
          debug!("Sending ...: {:?}", output);
          out_sender.send(output);
      }
  });
  ...
  forward_task.abort();
}
```

Questions a maintainer might ask:

- Why is the cache of the channels 1?
- Why was a broadcast/mpsc/watch/... channel chosen? Why do I need to know?
- Shouldn't initialisation happen at the start of the loop?
- I don't like the naming of the variables in the loop.
- Why is the error handling like this? Is it sufficient?

---

## Functional async programming

```rust
async fn main() {
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
  ...
  forward_task.abort();
}
```

Changes:

1. Convert receiver into stream
2. Convert sender into sink
3. No variable assignments,
4. No await (looks like iterator)
5. No explicit loop, break, control flow

Same:

- Need for a `spawn` to **drive the stream**.
- Usage of Tokio channel primitives

Possible complaints:

- I just ignore errors with `Result::ok`
- I need `ready` to get a future
- I need to use `Ok` to convert `Stream` into `TryStream`

---

## Benefits of streams/sinks

Streams model things like streaming video naturally.

## Easier to maintain

Implementing UI is easier, because you can

- listen directly to updates on input streams 
- only act on changes

Operators on `Streams` are similar to `Iterator`

- Developers do not need to learn new concepts
- Developers do not need to remember a sequence of instructions

All the benefits of functional/declarative code

- No discussions about the naming of intermediate variables
- No discussion about what is input or output
- Better interoperability (`impl Stream`)

## Less important benefits of streams

Lower tendency to off-load to new threads/tasks

- Result in less spawns and join handles
- Results in linear code exection path

No explicit control flow statements like `break`, `continue`, `return`.

No reliance on external channel implementations on core libraries.

---

## How to work with streams

## Basics

A stream is an async iterator: `next` returns a `Future<Output = Option<_>>`

```rust
use futures::{Stream, StreamExt};

let stream = UserStream::new();
assert_eq!(stream.next().await, Some(_));
```

When `.next().await` is `None` the `Stream` has ended.

Most streams are **not `Clone`**. Separate the `Stream` trait from the transport-specific clone / subscribe functions.

## Mapping

Most important combinator or operator.

```rust
use futures::{stream, StreamExt};

let stream = stream::iter(1..=3);
let stream = stream.map(|x| x + 3);
```

Is it an async map? Use `then`.

```rust
let stream = stream::iter(1..=3);
let stream = stream.then(|x| async move { x + 3 });
```

**Important**: In older versions of `futures`, `then` and `map` were a single function. The crate `futures-preview` is such an old version.

---

## Operators

Operators take a stream, some data and return a new stream.

## Filter

```rust
use std::future::ready;
use futures::{stream, StreamExt};

let stream = stream::iter(1..=10);
let events = stream.filter(|x| ready(x % 2 == 0));
```

Notice the `ready` function. It maps sync values into async values / futures **which are `Unpin`**.

## Filtermap

Filter out None values.

```rust
let stream = stream::iter(1..=10);
let events = stream.filter_map(|x| async move {
    if x % 2 == 0 { Some(x + 1) } else { None }
});
```

## Other common operators

- Analogues for all boolean operators from `Iterator`: any, all, 
- Other well-known operators (return modified streams): enumerate, skip_while, peekable, collect ...

For more see [docs](https://docs.rs/futures/latest/futures/prelude/stream/trait.StreamExt.html).

---

## Merging streams

A user of streams does not just want to redirect or map streams.

We also want to **combine streams**.

## Basic

Binary:  

- In-homogenous `futures::StreamExt::zip` gives stream of tuples
- Homogenous `tokio_stream::StreamExt::merge` merges into one

Iterator or vector:

- homogenous `futures::stream::select_all`
- vector of streams, sequentially exchaustive `futures::StreamExt::flatten`

## Advanced

Or make your own.

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

The input streams need to have the same type, so `MergedStream` has to

- take streams of the same type (not possible when combining different stream modules)
- a dyn object of streams **behind a pointer** (use `Box::pin`)

---

## Ways to construct streams

## Declarative

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

## Imperative

Use crate `async-stream` 

```rust
fn double<S: Stream<Item = u32>>(input: S)
    -> impl Stream<Item = u32>
{
    stream! {
        for await value in input {
            yield value * 2;
        }
    }
}
```

---

## Consumption of streams

## Common ways

What to do with a stream?

- Use `futures::StreamExt::for_each` to act on each item.
- Redirect into a channel sender.

## Sending in sink

The `futures::Sink` trait is the opposite of `Stream`. Member methods:

- async ready: can we start sending?
- start send item: prepare an item to be flushed
- async flush: send all cached items
- async close: close the sink

A stream can be **sent into a sink** with `futures::SinkExt::forward`.

The opposite for `map` for sinks is `with`.

---

## Main problems

## Missing from stable standard library

The `Stream` trait is not in official stable Rust standard library.

## Important methods external

The `Stream` trait is called `AsyncIterator` in nightly Rust, but it **does not have helper methods**.

We need helper / function programming methods:

- map, filter, filter_map
- flatten, flatten_unordered

Semi-official `futures::StreamExt` provides them.

## Lack of stream implementors

Not all structs from third-party crates implement `Stream`.

Solutions:
- For Tokio channel users: use semi-official crate `tokio-stream` or 
- implement `Stream` yourself.


## Lack of sink implementors

Sinks are not as commonly used as streams:

- Third-party crates have their own kind of sinks.
  - For example, a binary sink in Tokio implements the trait `AsyncWrite`
- It is less common for third-party crates to export structs that implement `Sink`.


Solutions:

- Tokio channel users: use `tokio_util::sync::PollSender` or 
- implement the `Sink` trait yourself.

---

## Fixing stream annoyances

## Closure for filter needs async

When you have `stream.filter(|r| r.ok())` you will get a **compile-time error** because the return type of the closure is not a future.

If you use `stream.filter(|r| async { r.ok() })` and you do not pin the returned async block, the output stream will be marked `!Unpin`.

The `Box::pin` functions takes anything which is `!Unpin` and gives `Unpin`.

```rust
stream.filter(|r| Box::pin(async { r.ok() }))
```

- unreadable, complicated, scary
- unnecessary extra heap allocation.

## Why did we have to do all this?

Signature of `futures::StreamExt::filter`:

```rust
fn filter<Fut, F>(self, f: F) -> Filter<Self, Fut, F>
where
    F: FnMut(&Self::Item) -> Fut,
    Fut: Future<Output = bool>,
```

The closure `f` needs to return a `Future`. No known work-around.

The returned stream is only `Unpin` if the closure is returning an `Unpin` future.

---

## Creating `Unpin` futures

Yes, we can use `std::future::ready` .

The `ready` function maps sync values into async values / futures **which are `Unpin`**.

```rust
stream.map(Result::ok).filter_map(ready)
```

Compare this with the original

```rust
stream.filter(|r| Box::pin(async { r.ok() }))
```

Real problem: `async {}` blocks are always marked `!Unpin`.

The `ready` functions returns an `Option<T>` that implements `Future`.

## Not happy?

Make your own `StreamExt` and implement `filter` as function that returns `IntoFuture`.

---

## More annoyances

`StreamExt::forward` takes a `TryStream` and returns future of `Result`.



---

## Understanding streams better

Streams are an extension of coroutines.


## Coroutines

Normal functions just take input and return output.

**Coroutines** are functions that can be suspended.

Before a coroutine is suspended it **yields a value**.

## Creating a coroutine

Most coroutines are made with generators.

<!-- column_layout: [1, 1] -->

<!-- column: 0 -->

JavaScript:

```javascript
function* coroutine() {
  yield 1;
  yield 2;
  yield 3;
}


const gen = coroutine();
console.log(gen.next()); // { value: 1, done: false }
```


<!-- column: 1 -->

Rust:

```rust
fn coroutine() -> impl Iterator<Item = i32> {
    gen {
      yield 1;
      yield 2;
      yield 3;
    }
}

let mut gen = coroutine();
assert_eq!(gen.next(), Some(1));
```


---

## Streams

Coroutines that yield a future instead of a value are also called async iterators or `Stream`s (in Rust).

## Definition

Definition from `futures`:

```rust
pub trait Stream {
    type Item;

    // Required method
    fn poll_next(
        self: Pin<&mut Self>,
        cx: &mut Context<'_>,
    ) -> Poll<Option<Self::Item>>;
}
```

## Reminder: futures

The simplest future possible:

```rust
pub struct Ready<T>(Option<T>);

impl<T> Future for Ready<T> {
    type Output = T;

    fn poll(mut self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<T> {
        Poll::Ready(self.0.take().expect("Ready polled after completion"))
    }
}
```

---

## Streams as a type of coroutine

## Classification


We can classify all coroutines in a table:

|          | _YIELDS_      | _RESUMES_ | _RETURNS_     |
| -------- | ------------- | --------- | ------------- |
| FUTURE   | ()            | waker     | future output |
| ITERATOR | option        | !         | ()            |
| STREAM   | future option | waker     | ()            |

Table inspired by [Post](https://without.boats/blog/poll-next/).


Streams have the benefits from futures:

- They do not have to be ready.
- May be suspended and resumed at any time.


## Disadvantages

Streams have the disadvantages of futures:

- They might be self-referential and unmovable, in Rust = `!Unpin`.
- They are not `Clone`. 
 
Cloneability is accomplished with channels.


---

## Coroutines as a type of function

Coroutines are part of a bigger classification of functions.


|             | _TAKES_ | _CAPTURES_ | _YIELDS_      | _RESUMES_ | _RETURNS_     |
| ----------- | ------- | ---------- | ------------- | --------- | ------------- |
| LOOP        | !       | !          | !             | !         | !             |
| BLOCK       | !       | captured   | !             | !         | output        |
| FUNCTION    | input   | !          | !             | !         | output        |
| CLOSURE     | input   | captured   | !             | !         | output        |
| FUTURE      | !       | !          | ()            | waker     | future output |
| ASYNC BLOCK | !       | captured   | ()            | waker     | future output |
| ITERATOR    | !       | !          | option        | !         | ()            |
| STREAM      | !       | !          | future option | waker     | ()            |
| COROUTINE   | !       | !          | any           | any       | any           |

**Important**: the `Coroutine` trait in Rust is unstable.


---

## Streams from futures

Every future can be converted into a stream.

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

Streams are just things that

- can be polled multiple times and
- their ready type is `Option<T>`.

---

##  Declarative stream creation

The most optimal way to create streams. 

How does it work?

- Convert high-level functional description into a stream state object
- Generate `poll_next` method implementation

Common versions of this are `map` and `filter` operators.

See the beginning of this presentation.

---

## Custom declarative stream combinator

An example on how to create a custom stream combinator.

We have to know how `Pin` and `Poll` interact.

Determine the state of the output stream.

Determine how state should be updated.


```rust
pub struct SelectAll<St> {
    inner: FuturesUnordered<StreamFuture<St>>,
}

impl<St: Stream + Unpin> Stream for SelectAll<St> {
    type Item = St::Item;

    fn poll_next(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Option<Self::Item>> {
        loop {
            match ready!(self.inner.poll_next_unpin(cx)) {
                Some((Some(item), remaining)) => {
                    self.push(remaining);
                    return Poll::Ready(Some(item));
                }
                Some((None, _)) => {}
                None => return Poll::Ready(None),
            }
        }
    }
}
```

---

## Imperative stream creation

Helpers to:

- Convert high-level imperative description into a stream state object
- Generate `poll_next` method implementation

Usage:

```rust
let mut stream = create_stream();
assert_eq!(stream.next().await, Some(1));
```

## Stable Rust

```rust
fn create_stream(addr: SocketAddr)
    -> impl Stream<Item = io::Result<TcpStream>>
{
    try_stream! {
        let mut listener = TcpListener::bind(addr).await?;

        loop {
            let (stream, addr) = listener.accept().await?;
            println!("received on {:?}", addr);
            yield stream;
        }
    }
}
```

## Nightly Rust

Called `AsyncIterator`.

```rust
fn create_stream() -> impl AsyncIterator<Item = i32> {
    async gen {
      yield 1;
      sleep(Duration::from_secs(1)).await;
      yield 2;
      yield 3;
    }
}
```


