---
title: "Generating thumbnails 3.8x faster by using ffmpeg seeking instead of fps filtering"
draft: false
date: 2024-12-21T00:00:01Z
---

![](feature.jpg)

As part of tinkering with [reelchest](https://github.com/SebastianAigner/reelchest), one of the tasks I need to tackle is thumbnail generation.

A few ways to do that are described in the official [ffmpeg documentation](https://trac.ffmpeg.org/wiki/Create%20a%20thumbnail%20image%20every%20X%20seconds%20of%20the%20video). Since I want to create more than one thumbnail per media file (hopefully, so that I can do some kind of cool crossfade effect that makes the entire application feel a bit more lively), I opted for the `fps` video filter. Here's the snippet in my code that creates a thumbnail every 10 seconds into the video. (The snippet here is Kotlin, but they're the literal CLI flags passed to the `ffmpeg` process, so this should be comprehensible.)


```kotlin
val task = FfmpegTask(
    "-y",
    "-i",
    videoFile.name,
    "-q:v",
    "5",
    "-vf",
    "fps=1/10",
    "thumb%04d.jpg"
)
```

This process takes 10.34s for my example input file (a ~4-minute-long vacation video) on an M2 Max. That feels _slow_. Since I intend `reelchest` to also work decently on low-powered devices like a Raspberry Pi, there's a simple question that pops up here: **Can we go faster?**

As it turns out, we can.

## Time to seek in a fast manner

The reason why this approach is slow is that it essentially decodes the entire video and spits out a new, filtered "video" with the framerate of "one frame every 10 seconds". Instead of creating one combined video file, it instead exports the frames of that new video as individual images, and tada, we have our thumbnails.

However, **this requires the entire video to be decoded, even though we only look at a single frame every 10 seconds!** That's pretty wasteful, and especially noticeable on e.g. a Raspberry Pi, where this process will happily saturate all CPU cores for a few minutes per input video.

So, what's a better way of extracting these frames, then? The answer is _seeking_: jumping to each relevant timestamp and extracting the frame then-and-there. A seeking-based solution is actually the first one on the [ffmpeg wiki](https://trac.ffmpeg.org/wiki/Create%20a%20thumbnail%20image%20every%20X%20seconds%20of%20the%20video):

```bash
ffmpeg -i input.flv -ss 00:00:14.435 -frames:v 1 out.png
```

However, this is described as "Output a single frame from the video into an image file" -- not what we want! However, with a bit of craftiness, we can twist this solution into something that does work for our use case. Here's the game plan:

- Figure out the length of the video
- Programmatically craft one seek command per timestamp every ten seconds
- Join all of them together as one mega-`ffmpeg` incantation.

First, we need to figure out how many thumbnails we can actually generate. We do that by figuring out how long our video is. Enter [`ffprobe`](https://ffmpeg.org/ffprobe.html), sibling to `ffmpeg` and designed to "gather information from multimedia streams". Duration is one of those pieces of information! Here's how I extract the duration -- again in Kotlin, but the CLI arguments continue to be language-independent:

```kotlin
val durationRegex = """(\d+\.?\d*)""".toRegex()
fun getVideoDuration(inputFile: File): Duration {
    val lines = ProcessBuilder(
        "ffprobe",
        "-v",
        "quiet",
        "-print_format",
        "json=c=1", // I don't know why the output isn't compacted even though I'm passing c=1, but we'll move along
        "-show_entries",
        "format=duration",
        inputFile.absolutePath
    ).start().inputStream.bufferedReader().readText()
    val (durationStr) = durationRegex.find(lines)?.destructured
        ?: error("ffprobe on $inputFile didn't return a duration")
    return durationStr.toDouble().seconds
}
```

With the video duration in our hands, we can now move on to crafting the mega-`ffmpeg` incantation. There's a few things that we want to pay attention to here:

Firstly, we really want to make sure we specify the seek flag `-ss` before the input flag `-i`! That's because we want to do _input seeking_: Parsing the input by keyframe, [which is very fast](https://trac.ffmpeg.org/wiki/Seeking). Weirdly enough, this isn't used by the [thumbnail wiki entry](https://trac.ffmpeg.org/wiki/Create%20a%20thumbnail%20image%20every%20X%20seconds%20of%20the%20video).

Secondly, we'll create a large command that will look like this:

```bash
ffmpeg -y -ss 65 -i invideo.mp4 -q:v 5 -frames:v 1 -map 0:v:0 out.jpg \
 -ss 00:00:20.0 -i invideo.mp4 -q:v 5 -frames:v 1 -map 1:v:0 out2.jpg
```

Since we do _input seeking_, we need to specify the video we're operating on for each invocation (note `invideo.mp4` is present in both lines). It also means that when we get out the images, we need to make sure we refer to the correct input source -- in the second line, we want to access the _first video stream in the second file (0-indexed, so with ID 1)_, which is expressed by `1:v:0`.

We can now craft our list of ffmpeg arguments by creating one set of arguments of shape `-ss 00:00:20.0 -i invideo.mp4 -q:v 5 -frames:v 1 -map 1:v:0 out2.jpg` per line. Here's how I do that in Kotlin:

```kotlin
val dur = getVideoDuration(videoFile)
val ffmpegParameters = buildList<String> {
    var streamId = 0
    add("-y")
    for (timestamp in 0..dur.inWholeSeconds step 10) {
        add("-ss")
        add(timestamp.toString())
        add("-i")
        add(videoFile.absolutePath)
        add("-q:v")
        add("5")
        add("-frames:v")
        add("1")
        add("-map")
        add("$streamId:v:0")
        add("out$streamId.jpg")
        streamId++
    }
}
```

With this new approach, the generation now takes 2.68s -- **that's a cool 3.8x improvement** over `fps`-filtering the entire video!

A _slightly_ less involved version of this would be to spawn one `ffmpeg` process per 10-second segment, but since I'm already programmatically crafting the CLI arguments anyway, I don't see a reason to take that detour at this point -- if you see one, let me know. Happy thumbnailing!  