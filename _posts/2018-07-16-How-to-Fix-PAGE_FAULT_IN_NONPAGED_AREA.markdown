---
layout: post
title:  "Fixing PAGE_FAULT_IN_NONPAGED_AREA after Windows 10 Creators Update"
date:   2018-07-16T21:26:55+02:00
categories: general
---

After the last unsolicited update from Microsoft, the Creators Update for 2018, instead of a seamless upgrade, I was greeted by

> PAGE_FAULT_IN_NONPAGED AREA. Cause of Error: SbieDrv.Sys

This was combined with Windows frantically trying to restart multiple times, trying to roll back the changes it had made, all to no avail. As I was sitting in front of the computer, beeping with every restart, I started researching on my phone in order to take matters into my own hands.

### SbieDrv.sys
> Sandboxie is a sandbox-based program that provides an isolated environment for applications to run. SbieDrv.sys is a kernel-mode driver that belongs to the Sandboxie program. This is not an essential Windows process and can be disabled if known to create problems.
– file.net

So, I had found the culprit! However, Windows on its own, with all its self-repair measures, couldn't quite figure out that not loading the problematic kernel driver for once might be a good idea.

### The oldest fix in the book
After Windows gave up on another iteration of the self-fix marathon, it presented me with the restoration options. Here's what I did to get my machine back up running.

- Click on "Advanced Options" until you see an option to open up the Command Prompt. Execute it.
- You will find that the default drive that is mounted is `X:/Windows`. Since this is kind of a "live" system running from RAM, the drive lettering is going to be different.
- Type `C:`, `D:`, `...` until you find the drive that actually has your Windows installation (or more importantly, your `Program Files` folder on it). Type `dir` to see contents of the drive.
- Once you know which one is your drive, navigate to `:/Program Files/Sandboxie/` and locate `SbieDrv.sys`. Use `ren SbieDrv.sys SbieDrv.sys.bad` to rename the problematic driver.
- Restart your machine. It will now boot up properly.
- Uninstall the Sandboxie version you have currently running. If you are an active user of Sandboxie, consider installing a new version afterwards.