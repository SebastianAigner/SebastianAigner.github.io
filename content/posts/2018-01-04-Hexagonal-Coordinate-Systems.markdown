---
categories: general
date: "2018-01-04T01:23:43Z"
title: Hexagonal Grids
---
<script src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.0/MathJax.js?config=TeX-AMS-MML_HTMLorMML" type="text/javascript"></script>

I was spending one of the recent days in the Loretta Bar here in Munich together with Alex, and we worked on a few tasks of the 2017 edition of Advent of Code. I was infatuated with the last task we worked on, the [Day 11](http://adventofcode.com/2017/day/11) challenge. You are supposed to find the distance of a position in a [Hex Grid](https://en.wikipedia.org/wiki/Hexagonal_tiling) based on a path description. I had already read a few articles regarding hexagonal grids, because I feel it is one of the less intuitive data structures, but none of them really made me understand the topic extremely well. I decided to just grab a pen and doodle away at a napkin and (later on) a few pieces of paper, scribbling around and trying to figure things out. After I had managed to build an (albeit inefficient) solution for myself, I set out to understand more about the topic. When I managed to have somewhat of a personal breakthrough in understanding, and felt a lot better reasoning about the topic, I decided it would be time to improve upon the visualisations that I had seen on other blogs like [Redblobgames](https://www.redblobgames.com/grids/hexagons/). They're still a great read any heavily recommended, but I thought I'd try my hand at one of these as well. So, amidst what seems like a heavy outage on the internet (with a very spotty connection), I managed to glue together a small demo. Because we all love interactivity, I'm going to throw the demo in first, and the rest of the text later.

### Interactive demo
<script src="/assets/unity_hexagons/TemplateData/UnityProgress.js"></script>  
<script src="/assets/unity_hexagons/Build/UnityLoader.js"></script>  
<script>
  var gameInstance = UnityLoader.instantiate("gameContainer", "/assets/unity_hexagons/Build/newbuilds.json", {onProgress:UnityProgress});
</script>
<div class="webgl-content">
  <div id="gameContainer" style="width: 100%; height: 423px"></div>
</div>
This demo was built on one evening after being kept awake by one too many please-allow-me-to-stay-here-longer-espressos in the café. Thanks for letting us stay!

### On Hexagonal Grids
Unlike regular grids, I've struggled a bit at first with understanding how I would map hexagons to arrays. I've since realised that you can easily map hexagons into 3 dimensions, and even two dimensions isn't a problem. The general idea that this approach is following is cube coordinates. If you play around with the demo (and maybe switch the camera), you'll quickly see that looked at from the right angle, a diagonal "plane" of 3d cubes looks an awful lot like a hex grid. This is what we are going to use to reason about how to distribute coordinates, measure distances, and so on.
#### Coordinates (and Constraints)
To make our lives a little easier, we choose the plane that satisfies the basic constraint

$$x + y + z = 0$$

If you play around with the interactive widget up there, you'll quickly realize that all coordinates on the plane displayed fulfill exactly that equation. It should also give you an intuitive idea what parameters should change when you perform a move in a direction.

#### Distances
The 3D representation allows us to easily reason about distances in the grid. You can see that to each neighbouring _cube_, the manhattan distance is 2. In the _hex grid_, the distance would be one. Check for yourself that this is correct for all neighbours of the initial \\(0,0,0\\) coordinate.

Thus, we quickly arrive at a concise formula for determining distances of hexagons in the grid in relation to the origin:

$$d = \frac{|x|+|y|+|z|}{2}$$

#### The obsolete third axis
But, we can go even further. If we can assume that the formula \\(x+y+z = 0\\) holds for all our cubes, can simply do some middle school maths and arrive at

$$z = -(x+y)$$

So what does this tell us? Since the \\(z\\) coordinate is merely a function of \\(x\\) and \\(y\\), it does not need to be saved in memory, but can be calculated on demand (when it makes sense). This also means that our distance is only dependent on the values of \\(x\\) and \\(y\\):

$$d = \frac{|x|+|y|+ |-(x+y)|}{2} = \frac{|x|+|y|+ |x+y|}{2}$$

If we go back to the graphical representation again (after having developed some intuition for it), we can see that this makes an extreme amount of sense. Observe how each \\(x,y\\) coordinate pair already uniquely identifies a cube on our plane. The formula for \\(z\\) also holds; again, staring intently at the cubes and axis offsets should give you an intuitive understanding to why that is (_Looking at it from the default camera perspective, you should realise that moving one cube away from the camera (into the space) always has to increment the \\(z\\) coordinate by one due to the staircase like nature of our plane; conversely, you need to decrease your \\(z\\) coordinate whenever you move towards the camera_)

So, we can store all grid coordinates in only two dimensions - that's going to make building implementations a lot easier!

#### A demo implementation
In my [Advent of Code](https://github.com/SebastianAigner/advent-of-code-2017-ocaml/blob/master/day11/Day11.kt) repository, you can find two implementations for the `HexVector` interface which I decided needed to be implemented in order to solve the task given by the AoC challenge. The first version, `HexVector3`, is a quite low performance prototype that I came up with then and there in the café. It uses a process of _coordinate normalisation_ (leveraging the fact that certain pairs of distances can be fused together into other coordinates, as to always obtain the correct manhattan distance).

The second version, `HexVector2`, implements the same interface using only two coordinates, while also allowing a conversion to `HexVector3`.

It's coding challenge code, so it's not the most polished thing in the world, but I'm sure it'll get the point across 😁

#### Further reading
This is by no means a complete guide on how to work with hex grids, and it's obviously not supposed to be. It should merely serve as some additional material for those who enjoy interactive visualisations. Hope it helps some of you! If you want to know more about hexagonal grids, I suggest you have a look at these two resources (amongst whatever else you will find on your quest):
- [Redblobgames](https://www.redblobgames.com/grids/hexagons/)
- [Keekerdc](http://keekerdc.com/2011/03/hexagon-grids-coordinate-systems-and-distance-calculations/)

### How this Demo is made
I first wanted to have a non-interactive 3D model so I could just have a look at it properly (looking on crumpled papers with lines all over the place trying to indicate the third dimension got tiring after a while), so I fired up blender, which is when I had the idea that I could also use a realtime 3D game engine to visualise what I had in mind. I'd already played around with Unity a bit beforehand, and a demo world was quickly assembled. I grabbed myself a camera controller script that allows orbiting and zooming, and built a script that would highlight the cube/hex that the mouse is currently resting on. I've had some trouble getting the line renderer to work (which is responsible for drawing the coordinates), but after a short change in the materials setting, that worked as well. After that, I only had to figure out how to properly scale the UI, and was able to export once and for all!

Unity is probably a bit overkill for the amount of things that are actually happening in the demo, but it allowed me to do some very rapid and caffeine driven prototyping. ☕

Also, as a small easter egg: the backdrop/skybox is my old office where I worked at TUM - just if anybody is interested in that 😊.