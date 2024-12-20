---
title: "Pooling multiple drives on my Raspberry Pi with mergerfs"
draft: false
date: 2024-12-20T00:00:01Z
---

My homelab setup is a bit of a mix-and-match of whatever hardware I happen to have lying around. Likewise, since I mostly run strange little experiments in my home setup, my requirements change frequently. Here's one such requirement:

**An app I built needs more storage than I have on the external HDD that's currently attached to my Raspberry Pi.**

I did have another, smaller HDD that wasn't seeing any use, so I looked into ways of somehow fusing the two drives together, essentially extending storage across two heterogeneous drives.

This took a bit of research: [MinIO](https://min.io/docs/minio/linux/operations/install-deploy-manage/deploy-minio-single-node-multi-drive.html) can do single-node multi-drive, but then I would first of all have to move my app to use object storage instead of just writing to disk -- and that's just extra work. Additionally, MinIO doesn't like mixed drives.

I looked around for a bit further, taking a look at [seaweedfs](https://seaweedfs.com/) for example, but I didn't quite feel the vibe.

## Enter `mergerfs`

[`mergerfs`](https://github.com/trapexit/mergerfs) self-describes as a "union filesystem". Understandably, because that's exactly what it is: It allows you to create a mount that acts as a single drive, but actually distributes data on however many underlying drives you have configured. What's more, it allows this even when the drives already have data!

This was exactly what I needed for my case. Admittedly, the README is a bit intimidating (it's extremely well documented), but I still took a stab at it. Together with the easily digestible description over at [perfectmediaserver.com](https://perfectmediaserver.com/02-tech-stack/mergerfs/), it was pretty simple to actually configure the entire thing. The full process for my Raspberry Pi 4:

- Find out what OS I'm running: `cat /etc/os-release`
- Pick the appropriate package from the [release page](https://github.com/trapexit/mergerfs/releases) (partially collapsed list!) -- for me, it was `mergerfs_2.40.2.debian-bullseye_arm64.deb`
- `wget` it from the Raspberry Pi
- Install via `sudo dpkg -i mergerfs_2.40.2.debian-bullseye_arm64.deb`
- Remember that my drives get automounted into `/media/pi/...`
- Drop a line into `/etc/fstab`:

`/media/pi/89648fb1-9098-4086-8ed2-ae23c0990592:/media/pi/cdbaad22-2440-4f37-ba73-d5a12ca47ba3 /mnt/extdrivesuperset mergerfs cache.files=auto-full,dropcacheonclose=true,category.create=mfs 0 0`

- Make doubly and triply sure that there is no trailing slash in the path for the two drives.
- Reboot & enjoy!

This uses the flags recommended by the README for `sqlite` support (`mmap`). So far, that's been going great, and I've been enjoying a little bit more extra space! If I happen to stumble onto another drive that doesn't have much use, I might also just plug it into my `mergerfs` setup!