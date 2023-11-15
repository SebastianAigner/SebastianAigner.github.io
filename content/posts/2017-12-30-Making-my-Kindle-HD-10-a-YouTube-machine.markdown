---
categories: general
date: "2017-12-30T22:53:34Z"
title: Making my Fire HD 10 a YouTube machine
---

T'was the night of the 24th of december, I was sitting together with my family at my grandparent's house and celebrated Christmas - and the [Christkind](https://en.wikipedia.org/wiki/Christkind) blessed me with a Fire HD 10 Tablet, freshly made by Amazon (or whoever manufactures these things). It should serve as a replacement device for my Sony Xperia Tablet Z which unfortunately had an unplanned rendezvous with the floor.

So I set out to make this thing my classic YouTube watching machine that I was used to before. Which is when I encountered...

### The Shock
Upon first booting the system, I was greeted with some familiar, some unfamiliar UI - While Amazons Fire HD 10 runs Android, it's heavily modified and limited by Amazon, comes with their own App Store, and doesn't have any support for any of the original apps. When I downloaded the YouTube app from the Amazon store, it looked as though it was an almost not-wrapped version of the mobile site. But I was used to a streamlined and proper mobile interface for the Android application. So I set out on a long-winded journey to **restore full YouTube access**!

### The Failure
So, I thought, hey, just grab yourself an `apk` file from one of the many mirrors and just install that - couldn't be too hard, right? Well, either the app just crashed on boot, or it claimed that it required _Google Play Services_ to function (even though I could see the actual app loaded in the background... 😡). I searched the Amazon store for an alternative YouTube client that would suit my needs, but to no avail.

So I realized: If we require Google Play Services, sounds like we need to... Provide Google Play Services.

### The Success
Through some Google-Fu I found a super fresh article that [describes how to googlify the Fire HD 8](https://liliputing.com/2017/07/making-amazons-fire-hd-8-2017-googley-play-store-third-party-launchers.html) - 8, 10, what does it matter! The main takeaway from the article is the [4 magic APKs](https://forum.xda-developers.com/amazon-fire/general/how-to-install-google-play-store-fire-t3486603) that will install the Google Play Services on your device. So I installed them, and arrived at a point where I could finally use the YouTube app.

But there was one problem that remained for me: **Ads**. I watch a lot of long-winded videos, sometimes to fall asleep to, or just to chill out. There is nothing worse than being interrupted by some loud noises (looking at you, ads for Instagram). So I decided to install [DNS66](https://f-droid.org/en/packages/org.jak_linux.dns66/), an ad blocker that does not require root, yet allows you to system-wide block ads. _However, it is incapable of blocking ads in the YouTube app_. So I set out on an even deeper journey, determined to get back my best viewing experience!

### The Cherry on Top
Somebody on XDA Devs was kind enough to upload a [patched APK](https://forum.xda-developers.com/moto-g4-plus/themes/app-youtube-red-background-screen-off-t3623852) which contains:

- Screen off playback
- No ads
- Dark mode

When I installed this APK, I really felt like I hit the jackpot.

**When installing, make sure not to skip over the installation instructions, and install [microG](http://www.mediafire.com/file/cn1b36jhjubgqhq/microG_for_YouTube_Vanced_0.2.4.apk)!**

The only thing left was to install [CF.lumen](https://play.google.com/store/apps/details?id=eu.chainfire.lumen&hl=en) for some warm tone colors. Even though it claims it needs some special accessibility options, it'll work just fine out of the box. However, the actual custom driver requires _root_ - which is the one thing I haven't gotten on my Fire HD 10 yet. Still holding out though!