+++
title = "Introduction to Embassy"
description = "Overview of the Embassy framework."
draft = false
weight = 8
[taxonomies]
tags = [  "Rust", "Embassy" ]
+++

## Minimal Embassy example

It can be useful to start with a minimal Embassy program. The following does nothing but can serve as a template for future programs.

```rust
#![no_std]
#![no_main]

use defmt_rtt as _;
use embassy_executor::{Spawner, main};
use embassy_rp::config::Config;
use panic_probe as _;
use embassy_rp::bind_interrupts;

bind_interrupts!(struct Irqs {
    PIO0_IRQ_0 => InterruptHandler<PIO0>;
});

#[main]
async fn main(_spawner: Spawner) -> ! {
   let p = embassy_rp::init(Config::default());
   loop {
      embassy_futures::yield_now().await;
   }
}
```

As you can see, there are two notable attributes at the top of the file.

* `#![no_std]` means that the program does not use the standard library. Embedded systems are too small for the standard library. Instead of using `std::String`, you would a statically allocated `heapless::String`. Most `std` heap allocated container types have an analogue in `heapless`.
* `#![no_main]` means that the program does not have a typical `main` function (with arguments or an exit code) as on a typical operating system. Instead, calling and creating the `main` function is completely handled by the Embassy framework.

Then there are two `use x as _;` lines. These crates don't expose functions or public modules to be used, but they contain setup code that should be included at least once in your embedded program.

* The `panic_probe` crate provides a panic handler that is compatible with Embassy. Panics are **fatal errors**. Every embedded program needs a panic handler because traditional panics would unwind or abort and yield control back to the operating system. This operating system is absent, so we have to tell the compiler how to handle panics. Usually, this means going into an infinite loop.
* The `defmt_rtt` is not useful for the moment, but once you have configured a hardware debugger, it will allow you to log messages to the debugger console. This is useful for debugging your program.

There is a macro call `embassy_rp::bind_interrupts!` that binds hardware interrupts with the Embassy framework. This is necessary to be able to use hardware interrupts in your program. Hardware interrupts can stop the current ongoing computation and jump execution to some handler code elsewhere. Examples of hardware interrupt bindings available on the Pico 2 are:

* `PIO0_IRQ_0` is an interrupt coming from the PIO peripheral.
* `USBCTRL_IRQ` for USB interrupts (relevant in USB serial communication).
* `ADC_IRQ_FIFO` for ADC interrupts (relevant for reading data from the analog-to-digital converter in the moisture sensor).

The `spawner` argument allows users to spawn asynchronous tasks. Keep in mind, however, that each task should be non-generic and completely specified at compile time. This is because the Embassy framework does not support dynamic task creation at runtime.

The last line `loop { yield_now().await }` may seem unnecessary. The reason I have to write it is because the return type of `main` is "never" (written as `!`). The `never` return type is the type for a function that never returns.

Because of the signature of `main`, we cannot simply escape the `main` function. Running this program is the only thing that happens on the microcontroller. So we have to keep looping, even if we have already finished our work.

## Levels of Abstraction in Embedded Rust

This section provides an overview of the different levels of abstraction that can be used when programming microcontrollers in Rust.

### Low Level

The lowest level of software abstraction provides direct access to the microcontroller's hardware registers.

* **Core Support Crate**: Enables access to the core processor's features, like interrupts and system timers. See [Cortex-M](https://crates.io/crates/cortex-m).
* **Peripheral Access Crate (PAC)**: Built on top of the core support crate, the PAC contains auto-generated code for accessing hardware peripherals (like GPIO, ADC, etc.) based on SVD files from the chip manufacturer. See [RP235X-PAC](https://crates.io/crates/rp235x-pac).

The Embassy framework builds on top of the PAC and HAL to provide a more intuitive and convenient API for accessing the hardware.

### Medium Level

If the Embassy framework doesn't suit your needs, you can fall back to a more conventional level of abstraction without `async/await`.

The **Hardware Abstraction Layer (HAL)** is a more convenient way to access the hardware. It provides a higher level of abstraction than the PAC but still allows direct hardware access.

The Pico 2 has [rp235x-hal](https://crates.io/crates/rp235x-hal) as its HAL crate. You can view the [examples](https://github.com/rp-rs/rp-hal/tree/main/rp235x-hal-examples), which were used as a reference for this workshop.

*Remark: If you need to preempt tasks (i.e., interrupt a lower-priority task to run a higher-priority one), you should consider using [RTIC](https://github.com/rtic-rs/rtic). RTIC provides a different concurrency model based on preemption and priorities, which may be required for real-time applications.*

### High Level

For commonly used microcontrollers, there is often at least one good **Board Support Package (BSP)**. These are crates that provide a convenient, board-specific API, though they are sometimes less customizable than a HAL. For example, in the case of the Micro:bit controller, the BSP is called [microbit](https://crates.io/crates/microbit) and it allows you to draw shapes on the on-board LED array.

For the Raspberry Pi Pico 2 W, `embassy` (and its `embassy-rp` plugin) come the closest to a full-featured BSP.

## More Reading Material

Interesting books about embedded Rust:

* There is a book for beginners in embedded Rust: [The Discovery Book](https://docs.rust-embedded.org/discovery-mb2/). It assumes you have a Micro:bit v2 (\~€20).
* There is also a book about embedded Rust using an STM32 chip: [The Embedded Rust Book](https://docs.rust-embedded.org/book/).
* Another book about Rust and the Raspberry Pi Pico 2 is [Pico, In-Depth](https://pico.implrust.com/).
