+++
title = "Logging with defmt over RTT"
description = "How to use the defmt crate to log messages from a Raspberry Pi Pico 2 W over RTT."
draft = false
weight = 9
[taxonomies]
tags = [ "defmt", "RTT", "SWD", "Rust", "GDB" ]
+++


## Simple Logging

RTT (Real-Time Transfer) is a logging protocol that can be used on top of an SWD connection. It does not require specifying the baud rate, etc.

The `defmt` crate is the most popular crate for logging from embedded Rust programs. It exports macros like `info!` and `debug!`, similar to the macros in the standard `log` or `tracing` crates in Rust.

For the debug probe to actually show the log output from the target, you need to enable a "transport". In the case of `defmt`, it is usually the `RTT` transport using the `defmt-rtt` crate. The `defmt-rtt` crate could be compared to `tracing-subscriber` or other mainstream log consumers.

1. Add `defmt` and `defmt-rtt` as a dependency to your `Cargo.toml` file. Also, enable the `defmt` features for all existing dependencies that have it.

2. Import the `defmt-rtt` module in your binary or library:

    ```rust
    use defmt_rtt as _;
    ```

    This may seem useless, but it enables the setup of data necessary to link the binary against the `defmt-rtt` crate.

3. Add a compiler flag under the current target in the `.cargo/config.toml` file: `-C link-arg=-Tdefmt.x`.

    ```toml
    [target.thumbv8m.main-none-eabihf]
    rustflags = [
      "-C",
      "link-arg=--nmagic",
      "-C",
      "link-arg=-Tlink.x",
      "-C",
        "link-arg=-Tdefmt.x",
        "-C",
        "target-cpu=cortex-m33",
    ]
    ```

4. Specify the log level for `defmt` in the `.cargo/config.toml` file:

    ```toml
    [env]
    DEFMT_LOG = "debug"
    ```

5. Enable `rtt` in the `Embed.toml` file:

    ```toml
    [default.rtt]
    enabled = true
    ```

6. Add invocations of the `defmt` macros throughout your library or binary code (as necessary). For example, you could write:

    ```rust
    use defmt::info;

    async fn main(_spawner: Spawner) -> ! {
       loop {
          info!("A new iteration of the loop has started.");
       }
    }
    ```

    There is nothing stopping you from adding such statements to library code.

7. Compile, flash, and run your binary on the target Pico 2 W:

    ```bash
    cargo ru
    ```

    This should open an RTT console that shows the log messages emitted by the `defmt` statements in your code.
