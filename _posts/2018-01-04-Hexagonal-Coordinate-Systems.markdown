---
layout: post
title:  "Hexagonal Grids"
date:   2018-01-04T01:23:43+01:00
categories: general
---

Amidst what seems like a heavy outage on the internet (with a very spotty connection), I managed to glue together a small demo after today's coding session together with Alex in the Loretta Bar here in Munich. I was infatuated with the last task we worked on, the [Day 11](http://adventofcode.com/2017/day/11) challenge from Advent of Code 2017. I had already read a few articles regarding hexagonal grids, but none of them really made me understand the topic as well as just looking at a piece of paper (or even a napkin), scribbling around and trying to figure things out.

After I had managed to build an (albeit inefficient) solution for myself, I set out to understand more about the topic. When I managed to have somewhat of a breakthrough in understanding, and felt a lot better reasoning about the topic, I decided it would be time to improve upon the visualisations that I had seen on other blogs like [Redblobgames](https://www.redblobgames.com/grids/hexagons/). They're still a great read any heavily recommended, but I thought I'd try my hand at one of these as well.

### Interactive demo
<script src="{{ "assets/unity_hexagons/TemplateData/UnityProgress.js" | absolute_url }}"></script>  
<script src="{{ "assets/unity_hexagons/Build/UnityLoader.js" | absolute_url }}"></script>  
<script>
  var gameInstance = UnityLoader.instantiate("gameContainer", "{{ "assets/unity_hexagons/Build/newbuilds.json" | absolute_url}}", {onProgress:UnityProgress});
</script>
<div class="webgl-content">
  <div id="gameContainer" style="width: 100%; height: 423px"></div>
</div>
This demo was built on one evening after being kept awake by one too many please-allow-me-to-stay-here-longer-espressos in the café. Thanks for letting us stay!

**TODO: FIX RENDERING ISSUE WITH CROPPED UI**

### On Hexagonal Grids
#### Coordinates (and Constraints)
- Important constraint: x+y+z = 0 (also defines the plane)
- Play around for movement
- Switch the camera around
- Note that the equation x+y+z = 0 is always correct

#### Distances
- 3D representation allows us to easily reason about distances
- You can see that to each neighbouring cube the manhattan distance is 2 -> the grid distance is 1.
- Formula |x|+|y|+|z|/2 = gridDist

#### The obsolete third axis
- The formula x+y+z=0 holds.
- Therefore, z = -(x+y)
- Works even for the distance: |x|+|y| + |-(x+y)| / 2 = gridDist

#### Further reading
- [Redblobgames](https://www.redblobgames.com/grids/hexagons/)
- [this](http://keekerdc.com/2011/03/hexagon-grids-coordinate-systems-and-distance-calculations/)
- a few others, just google

### How this demo is made
- Unity
- Boxes
- Changing materials when mousing over
- Drawing linerenderer in the correct positions
- Switching around axes because I don't agree with Unitys Y axis
- Easter egg: my old hiwi office as backdrop

### Challenges in building the demo
- Line renderer wouldn't render color in WebGL export -> change material
- UI doesn't properly scale on all devices (beginner's problem in Unity)