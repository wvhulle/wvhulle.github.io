+++
title = "Pico 2 as debugprobe"
description = "How to use the Raspberry Pi Pico 2 as a hardware debugger."
draft = false
weight = 7
[taxonomies]
tags = [  "Raspberry Pi", "Pico", "SWD", "declarative", "Rust", "probe-rs", "cargo-embed" ]
+++

On most popular microcontrollers used for educational purposes, there is already some hardware debugging support (also called a **hardware debug probe**) on the board itself, such as on the [Micro:bit](https://microbit.org/) or the [ESP32](https://www.espressif.com/en/products/socs/esp32).

Having this debug probe allows you to debug the code running on the target Pico using GDB or other debugging tools.

A debug probe comes in the form of a small secondary chip that can be used to debug the main microcontroller on the board.

The Pico family of microcontrollers does not have this feature built-in. You have two options for debugging a Pico:

* It is possible to turn a spare Raspberry Pico into a hardware debugging probe for another Pico.
* You buy (or borrow) an official Rasberry Pi hardware debug probe.
* You manually force the target into BOOTSELF mode and flash with `picotool`. In that case, you will not be able to debug as easily (you will need a serial monitor).

In this workshop, we will pursue the first option. If you get stuck, feel free to ask for a pre-made hardware debugger.

### Turning a Pico 2 into a debugger Pico

The Raspberry Pi Foundation provides images for Picos that can be flashed to turn a Pico into a hardware debugger.

1. Download the latest `debugprobe_on_pico.uf2` flash image from the official [`debugprobe`](https://github.com/raspberrypi/debugprobe/releases)releases.
2. Attach the Pico to your laptop while holding the white BOOTSEL button. A mass storage device will appear in your file manager. It will be called something like `RP2350`.
3. Drop the downloaded `.uf2` file onto the mass storage drive emulated by the Pico. Wait for a fraction of a second while the Pico unmounts and reboots as a fresh `debugprobe`.

Now you have successfully made a cheap hardware debugging probe.

### Wire target to debugger

Let's make some aliases:

* Assume **D** is the homemade debug probe (a Pico).
* Assume **T** is the target Pico.

Right now, there is no cabling between the debug probe and the target Pico. The cables should be connected such that **D** can detect **T** over the SWD debugging protocol.

***Important**: For this step, you need to have a JST-SH cable. You can find them on [Kiwi](https://www.kiwi-electronics.com/en/jst-sh-1mm-pitch-3-pin-to-male-headers-cable-100mm-long-19930), but they can be hard to find.*

1. Plug the white connector of the JST cable into the SWD socket of **D**.

2. Place **T** and **D** in parallel with their USB ports facing upwards (to prevent confusion).

3. Connect the male jumper pins. The three male header pins from **T**'s JST cable should be connected to **D** as follows:

      * **T** left (yellow) \<-\> **D** pin 5
      * **T** middle (black) \<-\> **D** pin 3
      * **T** right (orange) \<-\> **D** pin 4

    Instead of pin numbers, you can also use the pin names:

      * **T** SWCLK \<-\> **D** GP3
      * **T** SWDIO \<-\> **D** GP2
      * **T** GND \<-\> **D** GND

4. Provide power to **T** using a single USB cable by forwarding power from **D**:

      * **T** GND pin 38 \<-\> **D** pin 38 (Connect ground)
      * **T** VSYS pin 39 \<-\> **D** pin 39 (Connect power supply)

*Remark: You can also connect **T** to **D** for UART communication. However, I have not needed it so far.*

### Configure flashing from laptop

There is still one step remaining: we have to configure our laptop's development environment to enable flashing (this applies to any microcontroller with an onboard or external debugger).

1. Install `cargo-embed`, which is included in the `probe-rs` tool suite.

    ```bash
    cargo install probe-rs-tools
    ```

2. Verify that `cargo-embed` is available in your shell's `PATH` (`cargo-[CMD]` can be called with `cargo [CMD]`):

    ```bash
    cargo embed --version
    ```

3. Add `udev` rules for `probe-rs` as described in the [probe-rs documentation](https://probe.rs/docs/getting-started/probe-setup/).

    ```bash
    sudo curl --output /etc/udev/rules.d/69-probe-rs.rules "https://probe.rs/files/69-probe-rs.rules"
    sudo udevadm control --reload-rules
    sudo udevadm trigger
    ```

Now you can flash changes in the source code directly to the target Pico (without re-plugging it or holding the BOOTSEL button). The debug probe Pico will function as an intermediary between your laptop and the target Pico.

```bash
cargo run
```

You should see two progress bars running to completion in your terminal. As soon as the flash process is finished:

* **T** will start running the new code.
* A debug server will be started on **D** so that you can step through your code while it runs on **T**.

While the Pico has a generous amount of flash memory, Embassy-produced binaries can sometimes be large. For microcontrollers with less memory, the [Min-sized Rust](https://github.com/johnthagen/min-sized-rust) guide provides tips for reducing binary size.
