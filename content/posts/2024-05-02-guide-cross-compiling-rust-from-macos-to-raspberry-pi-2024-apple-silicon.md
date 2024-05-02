---
title: "Guide: Cross-compiling Rust from macOS to Raspberry Pi (2024, Apple Silicon)"
draft: false
date: 2024-05-02T23:31:00Z
---

> This guide builds
> on [the guide from Amarit Rathie](https://amritrathie.vercel.app/posts/2020/03/06/cross-compiling-rust-from-macos-to-raspberry-pi/#getting-a-linker),
> which has been an indispensible resource in getting me started with cross-compilation at all.
> Mine has been updated for the latest versions of macOS at the time, and I've tried it on an M2 Mac -- here, I'm the
> steps (and workarounds) required to get it to work for me -- explanations are kept short, and I encourage you to reference the original blogpost to get a better understanding of what's going on.

## Adding the compilation target

I'm on a 32-Bit Raspberry Pi 3, so I did the following:

```bash
rustup target add armv7-unknown-linux-musleabihf
```

I assume that a 64-bit Raspberry Pi needs a different cross-compilation setup. If you have info on this, drop me a line,
and I'll happily edit it here!

## Setup linker

```bash
brew install arm-linux-gnueabihf-binutils
```

## Setup musl cross compilation toolchain

```bash
brew install FiloSottile/musl-cross/musl-cross
brew reinstall musl-cross --without-x86_64 --without-aarch64 --with-arm-hf
```

(This is a workaround
for the [brew issue](https://github.com/FiloSottile/homebrew-musl-cross/issues/45) `invalid option: --without-x86_64`)

Using a cross-compilation toolchain fixes issues
like ``error occurred: Failed to find tool. Is `arm-linux-musleabihf-gcc` installed?``, which I encountered on my first
attempts.

## Setup linker

Put this in your `.cargo/config`:

```
[target.armv7-unknown-linux-musleabihf]
linker = "arm-linux-gnueabihf-ld"
ar = "arm-linux-gnueabihf-ar" # optional
```

As Amirit mentions
in [his guide](https://amritrathie.vercel.app/posts/2020/03/06/cross-compiling-rust-from-macos-to-raspberry-pi/#connecting-components),
you can either do this for the current project (the option I went for), or alternatively specify it globally
in `~/.cargo/config`.

## Build your app

```bash
cargo build --target armv7-unknown-linux-musleabihf
```

## OpenSSL issues

Encountered issue with
OpenSSL: ``Could not find directory of OpenSSL installation, and this `-sys` crate cannot proceed without this knowledge.``
I don't have a fix for it, but there is a workaround: use a different SSL implementation. `reqwest`, for example,
supports `rustls` out of the box. Remember to turn off `default-features`, otherwise this won't work!

```toml
reqwest = { version = "0.11.23", features = ["json", "rustls"], default-features = false }
```

Enjoy building some oxidized binaries for your Raspberry!
