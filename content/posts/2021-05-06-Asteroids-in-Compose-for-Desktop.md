---
cover_image: https://dev-to-uploads.s3.amazonaws.com/uploads/articles/it978npuczaugkhr1e2y.jpg
date: "2021-05-06T00:00:00Z"
description: '...and how you can get started building your own games on top of this
  modern framework.'
published: true
series: Building a game with Compose for Desktop
tags: [gamedev, kotlin, jetpackcompose, android]
title: How I built an "Asteroids" game using Compose for Desktop (Part 1/2)
---

A while ago, I [tweeted](https://twitter.com/sebi_io/status/1382668779377762305) about a small game I had created on top of [**Compose for Desktop**](https://www.jetbrains.com/lp/compose/): A small clone of the **classic arcade game** [**Asteroids**](https://en.wikipedia.org/wiki/Asteroids_(video_game)), in which you control a space ship with your mouse, and navigate the vastness of space, avoiding and breaking asteroids in the process.

<video controls src="/assets/asteroids-cfd/tweet.mp4"></video>

Today, it's time to take a look under the hood and understand how I built a basic version of this game, and how **Compose for Desktop helped me achieve it in just one evening**!

We will take a look at parts and structures in the code that I find the most interesting. To see how it all fits together, I suggest exploring the [**whole code on GitHub**](https://github.com/SebastianAigner/asteroids-compose-for-desktop). The whole implementation is **only 300 lines of code**, which I hope makes studying and understanding it easy.

### The Game

If you're not caught up on your 80s arcade trivia, [Asteroids](https://en.wikipedia.org/wiki/Asteroids_(video_game)) was a  popular arcade game where you try to steer your space ship through space, avoiding and destroying asteroids with your ship.

Because of the limitations of the hardware at the time, the game is quite simplistic in appearance: a triangular spaceship moves across a plain background and avoids simple displays of asteroids on a 2D surface.

What makes this a challenge is the _interia_: Just like a real space ship, your spaceship moves along its course in a straight line at constant speed, and you need to make corrective maneuvers by turning your ship and directing your thrust.

**Asteroids has achieved cult status in the arcade game scene.** Because of that, I wanted to see what it would take to recreate this experience using Compose for Desktop!

### The Building Blocks

I have roughly divided the project into a few building blocks that make up the project, and that we will talk about. Namely, those are:

- [**The Game Loop**](#the-game-loop)
- [**Game State Management**](#state)
- [**Rendering to the Screen**](#rendering)

In the **second part** of this series on building a game with Compose for Desktop, we will also look at additional **rendering details**, the **geometry and linear algebra** behind the game, and **frame-independent movement**.

Let's dive right in!

## The Game Loop <a name="the-game-loop"></a>

At the center of most games stands the **game loop**. It acts as the **entry point** that calls the game logic code. This is a fundamental difference between implementing typical declarative user interfaces and building games:

- **Declarative UI** is usually mostly static, and reacts to user actions (clicking, dragging) or other events (new data, computation progress...)
- **Games** run their logic many times per second, simulating the game world and its entities one frame at a time.

That is not to say that these two approaches are incompatible! All we need to run a main "game loop" is to get our **function to execute** once per frame. In Compose, we have the `withFrame` family of functions (`withFrameMillis`, `withFrameNanos`), which can help us achieve exactly that.

Let's assume we already have a `game` object – we will talk about state management shortly. We can then create a `LaunchedEffect` which asks Compose for Desktop to **call our `update` function whenever a new frame is rendered**:

```kotlin
LaunchedEffect(Unit) {
    while (true) {
        withFrameNanos {
            game.update(it)
        }
    }
}
```

`withFrameNanos` is a suspending method. Its exact implementation is described in the [documentation](https://developer.android.com/reference/kotlin/androidx/compose/runtime/package-summary#withframemillis):

> `withFrameNanos` suspends until a new frame is requested, immediately invokes `onFrame` with the frame time in nanoseconds in the calling context of frame dispatch, then resumes with the result from `onFrame`.

The frame time, which it provides us with, will also come in handy, as we will see in the second part of this blog post series, when we talk about _frame-independent movement_.

## Game State Management <a name="state"></a>

**Compose is excellent at managing state**, and when building a game like Asteroids, we can use the same mechanisms to keep track of the data attached to game objects or the current play session, to name just two examples.

As suggested in the previous section, my Asteroids game has a `Game` class, an instance of which is wrapped in a `remember` call in the main composition.

```kotlin
val game = remember { Game() }
```

It acts as a container for all game-related data. For example:

- Game object information (in a `mutableStateListOf`)
- The current game phase (`RUNNING` / `STOPPED`)
- The size of the playing field (based on window dimensions)

Inside the `Game` object, we treat the state data as mutable, and make any state changes as we see fit.

### Game Objects

Individual game objects once again group the state belonging to an individual game entity: a spaceship, an asteroid, or a bullet, and provide methods to modify their state, spawn new game objects, or check their relation to other game objects.

In my implementation of Asteroids, all game objects share a lot of behavior, from the way they move through the environment to how they check their collision – we'll talk about the geometry and linear algebra that goes into that a bit later.

The `GameObject` class provides implementations for these shared behaviors:

```kotlin
sealed class GameObject(speed: Double = 0.0, angle: Double = 0.0, position: Vector2 = Vector2.ZERO) {
    var speed by mutableStateOf(speed)
    var angle by mutableStateOf(angle)
    var position by mutableStateOf(position)
    var movementVector /* ... */
    abstract val size: Double

    fun update(realDelta: Float, game: Game) {
        val velocity = movementVector * realDelta.toDouble()
        position += velocity
        position = position.mod(Vector2(game.width.value.toDouble(), game.height.value.toDouble()))
    }

    fun overlapsWith(other: GameObject): Boolean {
        return this.position.distanceTo(other.position) < (this.size / 2 + other.size / 2)
    }
}
``` 

For example, the `ShipData` class inherits `speed`, `angle`, `position` and its `update` method from `GameObject`, but defines its own size, angle, and a function to fire a bullet:

```kotlin
class ShipData : GameObject() {
    override var size: Double = 40.0
    var visualAngle: Double = 0.0

    fun fire(game: Game) {
        val ship = this
        game.gameObjects.add(BulletData(ship.speed * 4.0, ship.visualAngle, ship.position))
    }
}
```

Note that the `ShipData` (or even a `GameObject` in general) does not include any logic on how to render this item to the display – **with Compose, keeping state and presentation separated is quite easy**.

Because a lot of behavior is shared between all types of entities in the game, our main game loop can treat them as the supertype `GameObject` for the most part, and only specific interactions between certain types of objects, like bullet-asteroid or asteroid-player collisions, need to be handled specifically.

## Rendering to the Screen <a name="rendering"></a>
I found that in Compose, **separating game data from the visual representation comes quite naturally**. Game objects like a ship, an asteroid, or a bullet are all represented in two parts:

- A class holding the state associated with the game object (in terms of "Compose state" – via `mutableStateOf` and friends) – We briefly talked about this in the previous section.
- A `@Composable`, defining the rendering based on the game object's data.

To illustrate the latter, here's the minimal visual representation of the `Asteroid` composable. It receives `asteroidData`, which is the container for all information regarding the state of this particular game object:

```kotlin
@Composable
fun Asteroid(asteroidData: AsteroidData) {
    val asteroidSize = asteroidData.size.dp
    Box(
    Modifier
    .offset(asteroidData.xOffset, asteroidData.yOffset)
    .size(asteroidSize)
    .rotate(asteroidData.angle.toFloat())
    .clip(CircleShape)
    .background(Color(102, 102, 153))
    )
}
```

This code snippet is enough to **describe the whole visual representation** of an asteroid.

We start with a [`Box`](https://developer.android.com/jetpack/compose/layout) – one of Compose's most basic layout primitives, which allows us to have entities overlap (which is useful since we manually take care of placing the individual entities). We then use Compose's [`Modifier`s](https://developer.android.com/reference/kotlin/androidx/compose/ui/Modifier) to specify the position of the asteroid in the form of an `offset`, its size, rotation angle, shape (by clipping a `CircleShape`), and background color.

Note that Compose offers quite **high-level APIs even for these basic shapes** – for example, we can use `.rotate` directly, without having to manually do geometry work to figure out how to get our entities facing the right way.

To keep this snippet as concise as possible, I've also introduced some extension functions on `GameObject` that make it possible to reuse the logic of computing the offset of a game object based on its position and size, called `xOffset` and `yOffset`, which I've snuck into the previous code snippet already. Their implementation is relatively straightforward:

```kotlin
val GameObject.xOffset: Dp get() = position.x.dp - (size.dp / 2)
val GameObject.yOffset: Dp get() = position.y.dp - (size.dp / 2)
```

A slightly more complicated composable would be the `Ship` component, which combines the shapes of a triangle and circle to create a minimalistic spaceship:

```kotlin
@Composable
fun Ship(shipData: ShipData) {
    val shipSize = shipData.size.dp
    Box(
    Modifier
    .offset(shipData.xOffset, shipData.yOffset)
    .size(shipSize)
    .rotate(shipData.visualAngle.toFloat())
    .clip(CircleShape)
    .background(Color.Black)
    ) {
        Canvas(modifier = Modifier.fillMaxSize(), onDraw = {
            drawPath(
            color = Color.White,
            path = Path().apply {
                val size = shipSize.toPx()
                moveTo(0f, 0f) // Top-left corner...
                lineTo(size, size / 2f) // ...to right-center...
                lineTo(0f, size) // ... to bottom-left corner.
            }
            )
        })
    }
}
```

The `Box` defining the ship is quite similar to the one we saw for an `Asteroid`, but we additionally add a `Canvas` to draw some additional shapes on top of our spaceship – in this case, a triangle path. In typical Compose fashion, we just add this `Canvas` in the lambda block following our `Box`, meaning the `Canvas` will inhert the coordinate system of its parent, including its offset and rotation.

These composables are then just rendered to a _play surface_ – nothing more than a `Box` with a locked aspect ratio of `1.0f` (to keep it quadratic). Of course, applying some artistic talent to these visual representations of the game is also possible, but we're keeping it minimal for now.

## Continued in Part 2
There's still a bit more work to do until we can call our game done. In part 2 of this blog post series, we will look at additional rendering details, the geometry and linear algebra behind the game's simple physics simulation, as well as frame-independent movement.