---
cover_image: /assets/stdlib-collections/xaxcuqqhjnp77atfahyi.jpeg
date: "2021-03-29T00:00:00Z"
description: Kotlin's standard library provides awesome and versatile tools to manage
  groups of items. Let's take a closer look!
series: Kotlin Standard Library Safari
tags: [kotlin,programming,android,productivity]
title: Diving into Kotlin collections
---

This blog post accompanies a video from our **YouTube series** which you can find on our [Kotlin YouTube channel](https://kotl.in/video), or **watch here** directly!

<iframe width="560" height="315" src="https://www.youtube.com/embed/F8jj7e-_jFA?si=S6T19DAGNXhz-CyM" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

[Kotlin Collections](https://kotlinlang.org/docs/collections-overview.html)! You’ve heard of them, you’ve used them – so it makes sense to learn even more about them! Kotlin's standard library provides **awesome tools to manage groups of items**, and we’re going to take a closer look!

Let's see **what types of collections** the Kotlin standard library offers, and explore a **common subset of operations** that’s available for all of the collections you get in the standard library. Let’s get started.

In the Kotlin standard library, we have three big types of collections: **Lists**, **Sets**, and **Maps**. Just like many other parts of the standard library, these **collections are available anywhere you can write Kotlin**: on the JVM, but also in Kotlin/Native, Kotlin/JS, and common Kotlin code.

## Lists

Let’s start with the **most popular candidate** of a collection in Kotlin: a [`List`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/-list/). To rehearse:

A list is a collection of **ordered elements**. That means that you can access the elements of a list using **indices** – so you can say “give me the element at position two”. There’s also **no constraints on duplicate elements** in our list. We can just put in whatever elements we’d like. So, very few constraints on content, and maximum versatility in how we access the elements!

```kotlin
val aList = listOf(
    "Apple",
    "Banana",
    "Cherry",
    "Apple"
)

aList // [Apple, Banana, Cherry, Apple]

aList[2] // Banana
```


## Sets

Next up, we have the [`Set`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/-set/)! Sets are groups of objects where we don’t care about the order of elements. Instead, we want to make sure that our collection **never contains any duplicates**.

That’s the key property of a set: all of its **contents are unique**.

That makes sets a bit more of a specialized data structure, but there’s a good chance you want to use them in everyday scenarios anyway.

What are **typical things** you might want to store in a set? Tags, for example. Or, maybe you’re building a social network, and you want to store the IDs of all the friends that a certain user has. In both cases, you don't want to have duplicates in these collections, and probably don't care about the order.

A set can help you **enforce these constraints** without having to really think about it, and **without manual duplication checks**.

```kotlin
val emotions = setOf(
    "Happy",
    "Curious",
    "Joyful",
    "Happy", // even if we try to add duplicates...
    "Joyful" // ...to our set...
)

println(emotions) // ...the elements in our set stay unique!
// [Happy, Curious, Joyful]
```


Sets are actually also a **common mathematical abstraction**. Typical mathematical concepts, like [unions](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/union.html), [intersections](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/intersect.html), or the [set difference](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/subtract.html) also translate neatly into Kotlin code.

## Maps

Last, but certainly not least, we have [`Map`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/-map/). A map is a **set of key-value pairs**, where **each key is unique**. It’s also sometimes called a “dictionary” for that reason. You encounter maps whenever you’re **associating data** – storing a persons name and their favorite pizza topping, or associating a license plate with vehicle information.


```kotlin
val peopleToPizzaToppings = mapOf(
   "Ken" to "Pineapple",
   "Lou" to "Peperoni",
   "Ash" to "Ketchup"
)

println(peopleToPizzaToppings)
// {Ken=Pineapple, Lou=Peperoni, Ash=Ketchup}

println(toppings["Ash"])
// Ketchup
```

Key-value pairs are everywhere, and just like in many other languages, maps are the go-to way to manage them in Kotlin.

## Collections can be mutable

By default, these collections in Kotlin are **read-only**. This is in the spirit of **immutability** which accompanies typical functional paradigms – instead of changing the contents of a collection, you create a new collection with the changes applied, which you can then **safely pass around** in your application, ensuring that the **original collection stays unchanged**.

![image](/assets/stdlib-collections/3avccfflc4ugw7l0xykt.png)
 

But we also have **mutable flavors** of all of the collections in Kotlin: we have [`MutableList`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/-mutable-list/), [`MutableSet`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/-mutable-set/), and [`MutableMap`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/-mutable-map/). Those are modifiable, meaning you can **comfortably add and remove elements**. With data where you’re inherently expecting change, you’d probably use these mutable variants.

## Collections are iterable

Kotlin collections being _iterable_ means that the standard library provides a **common, standardized set of typical operations for collections**, for example, to retrieve their size, check if they contain a certain item, and more.

Lists and sets directly implement the Collection interface, which in turn implements the [`Iterable`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/-iterable/) interface. Maps have an [`iterator()`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/iterator.html) operator function, and provide iterable properties, like their set of keys, their list of values, as well as the entries of the map, so key-value pairs.

![image](/assets/stdlib-collections/h7j7a868lyz9dowlwnrn.png) 

Let’s learn about some **shared functionality of iterables**. The following examples are going to use a list, but really, we can just assume that we’re just working with an `Iterable` here – the concrete implementation does not matter. Also, all the functions discussed **leave the original collection unchanged**.

## Looping over collections ##

A core function of an `Iterable`, as its name suggests, is that it provides a mechanism to **access the elements** that our collection contains, one after the other – to iterate it.

The easiest way to go through all the elements in a collection is the basic Kotlin [`for`](https://kotlinlang.org/docs/control-flow.html#for-loops) loop. When we use the `for` loop with an `Iterable`, the `in` operator cleverly understands that we want to **go over the iterator**:


```kotlin
val fruits = listOf(
    "Apple",
    "Banana",
    "Cherry"
)

for(fruit in fruits) {
    println(fruit)
}

// Apple
// Banana
// Cherry
```


In a **more functional style**, we can also write this same snippet using the [`forEach`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/for-each.html) function:


```kotlin
fruits.forEach { fruit ->
    println(fruit)
}

// Apple
// Banana
// Cherry
```

In this case, `forEach` takes every element from our collection, and **calls a function** (which we provide) with the element as its argument.

## Transforming collections: map

Let's continue with a classic when it comes to **transforming collections**: the [`map`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/map.html) function! (Don’t be confused! The `map` function has nothing to do with the `Map` collection type. You can treat them as two completely different things.)

Just like the `forEach` function, the `map` function is of [higher order](https://kotlinlang.org/docs/lambdas.html). So, it:

- **Takes each element** from our collection, 
- **applies a function** to it, and
- **creates another collection**, containing the return values of those function applications.
  
The result of the map function doesn’t have to be the same type as the one of our input collection, either.

This makes the `map` function **very versatile** – whether you want to parse a collection of strings into a collection of integers, or resolve a list of user names to a list of full user profiles –– if you’re **transforming one collection into another**, it’s probably a good **first instinct** to think `map`.


```kotlin
val fruits = listOf(
    "Apple",
    "Banana",
    "Cherry"
)

val stiurf = fruits.map {
    it.reversed()
}
```


However, you might have a transformation inside your `map` function where you **can’t generate valid results** for all input elements. In this case, we can use the [`mapNotNull`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/map-not-null.html) function, and our resulting collection will only contain those function results that **evaluated to an actual value**. This also ensures that type of our resulting variable is **non-nullable**.


```kotlin
val strs = listOf(
    "1",
    "2",
    "three",
    "4",
    "V"
)

val nums: List<Int> = strs.mapNotNull {
    it.toIntOrNull()
}

println(nums)
// [1, 2, 4] 
```


If we need to **keep track of the index** of the element which we’re currently transforming, we can use the [`mapIndexed`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/map-indexed.html) function. It’s quite similar in how it works, but in this case, we get **two parameters in our transformation function**: the _index_ and the _value_:


```kotlin
val rank = listOf(
    "Gold",
    "Silver",
    "Bronze"
)

val ranking = rank.mapIndexed { idx, m ->
    "$m ($idx)"
}

println(ranking)
[Gold (0), Silver (1), Bronze (2)]
```


## Filtering collections: filter and partition

If we have a collection, but we’re only interested in **elements that fulfil a certain condition**, the [`filter`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/filter.html) function comes to the rescue!

Just like the previous examples, `filter` accepts **another function as its parameter**. This time, instead of defining a transformation, we’re defining what you can call a **predicate** here.

A predicate is a function that takes a collection element and **returns a boolean value**: `true` means that the given element matches the predicate, `false` means the opposite. So this predicate acts as the “**doorman**” – if the value is `true`, the collection item is let through to the result collection, otherwise, it is discarded.


```kotlin
open class Person(val name: String, val age: Int) {
    override fun toString() = name
}

class Cyborg(name: String) : Person(name, 99)

val people = listOf(
    Person("Joe", 15),
    Person("Agatha", 25),
    Person("Amber", 19),
    Cyborg("Rob")
)

val discoVisitors = people.filter {
    it.age >= 18
}

println(discoVisitors)
// [Agatha, Amber, Rob]
```


If you’re testing a **negative condition**, you can use the [`filterNot`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/filter-not.html) function instead, which behaves identically, but **inverts the condition**.


```kotlin
val students = people.filterNot {
    it.age >= 18
}

println(students)
// [Joe]
```


Note that both `filter` and `filterNot` **discard elements** where the condition doesn’t match. But maybe we don’t want to discard the “other half” of elements, and instead we want to put those into a separate list. This is where the `partition` function comes into play.

By using `partition`, we **combine the powers** of `filter` and `filterNot`. It returns a **pair of lists**, where the first list contains all the elements for which the predicate holds true, and the second contains all the elements that fail the test. So, in our doorman analogy, instead of sending people who fail the check away, we just send them to a different place. (Using parentheses, we can **destructure** this pair of lists directly into two independent variables.)


```kotlin
val (adults, children) = people.partition {
    it.age >= 18
}

println(adults)
// [Agatha, Amber, Rob]

println(children)
// [Joe]
```


If you’re bringing a **collection of nullable items** to the party, you can use the [`filterNotNull`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/filter-not-null.html) function which, as you may have guessed, **automatically discards any elements that are `null`**, and gives you a new collection with an adjusted, non-nullable type accordingly.

Speaking of adjusting types – if your collection contains multiple elements from a type hierarchy, but you’re only interested in **elements of a specific type**, you can use [`filterIsInstance`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/filter-is-instance.html), and specify the desired type as a generic parameter.


```kotlin
val people = listOf(
    Person("Joe", 15),
    null,
    Person("Agatha", 25),
    null,
    Person("Amber", 19),
    Cyborg("Rob"),
    null,
)

val actualPeople = people.filterNotNull()

println(actualPeople)
// [Joe, Agatha, Amber, Rob]

val cyborgs = people.filterIsInstance<Cyborg>()

println(cyborgs)
// [Rob]
```


## Retrieve collection parts: take and drop

Filtering allowed us to apply a predicate function, and create a new collection containing items that match. But what about the even simpler cases? Sometimes, we just want to **grab a few elements** from our collection.

For that, we have the [`take`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/take.html) and [`drop`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/drop.html) functions. You might already be able to guess what they do. `take` gives you a **collection of the first n elements** from your original collection. So `take(2)` is going to give you the first two elements. On the opposite hand, `drop(3)` is going to **leave out the first three elements** of your original collection, and only gives you everything that follows after those three elements. And you don’t have to be afraid to “overdrop” either – dropping more elements from a collection than it contains just gives you an empty list:


```kotlin
val objects = listOf("🌱", "🚀", "💡", "🐧", "⚙️")

val seedlingAndRocket = objects.take(2)

println(seedlingAndRocket)
// [🌱, 🚀]

val penguinAndGear = objects.drop(3)

println(penguinAndGear)
// [🐧, ⚙️]

val nothing = objects.drop(8)

println(nothing)
// []

println(objects) // remember, the original collection is not modified!
// [🌱, 🚀, 💡, 🐧, ⚙️]
```


One huge benefit of the functions we’ve seen so far is their **composability**: Because mapping, filtering, taking, dropping, and all their friends return a new collection, it’s easy to just take that result, and **immediately use it as an argument for the next collection function**, turning collection into collection into collection.

However, we should keep in mind that chaining a number of these functions together means we generate a bunch of **intermediate collections**. Now, this isn’t going to set your computer on fire immediately, but it is still something to be aware of, especially when you work with very large collections. For this case, Kotlin has a few aces up its sleeve as well, called [sequences](https://kotlinlang.org/docs/sequences.html), but we will dive into those at a later point.

## Aggregating collections: sums, averages, minimums, maximums, and counting

Once we’re done transforming our data, we might want to get a **single result value** out of it. If we have a collection of **numerical values** like integers or doubles, we get some nice functions called [`average`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/average.html) and [`sum`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/sum.html) out of the box, which help us calculate those values.


```kotlin
val randomNumbers = listOf(3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 6)

println(randomNumbers.average())
// 4.09090909090909091

println(randomNumbers.sum())
// 45
```


In some situations (...or, we might say, _sum_ situations...), we have a collection of more **complex objects**, and want to still **add them up** somehow, based on their properties. Of course, we could first use the `map` function to obtain a collection containing only numbers – but by using the [`sumOf`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/sum-of.html) function, we can do all of this in a single function call: we can pass a function that acts as a **selector** (so a function that gives us whatever number we want to associate with the element) and `sumOf` will use the **result of that selector function** to **add up** all our elements.

```kotlin
val randomNames = listOf("Dallas", "Kane", "Ripley", "Lambert")

val cumulativeLength = randomNames.sumOf { it.length }

println(cumulativeLength)
// 23
```

If we’re only interested in the **greatest or smallest value** contained in our collection of numbers, we can use the [`maxOrNull`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/max-or-null.html) and [`minOrNull`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/min-or-null.html) functions.


```kotlin
println(randomNumbers.minOrNull())
// 9

println(randomNumbers.maxOrNull())
// 1
```


And just like `sumBy`, we have the sibling functions [`maxOf`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/max-of.html) and [`minOf`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/min-of.html), where we once again pass a **selector function**, which is going to be used to **determine the maximum or minimum** of a collection.

```kotlin
val longestName = randomNames.maxOf { it.length }

println(longestName)
// 7

val shortestName = randomNames.minOf { it.length }

println(shortestName)
// 4
```

If we just care about the **number of elements** contained in our collection, we can use the [`count`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/count.html) function – either without any parameters, to just get the number of all elements, or using a **predicate**. So that’s like filtering the collection first, and then counting the elements. But again, all wrapped into one.


```
val digits = randomNumbers.count()

println(digits)
// 11

val bigDigits = randomNumbers.count { it > 5 }

println(bigDigits)
// 3
```


There’s also the powerful [`joinToString`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/join-to-string.html) function, which allows us to **turn all elements of our collection into a string**, complete with a metric ton of customization options like separators, prefixes and postfixes, limits or a placeholder if you have more elements than what your specified limit allows. And even `joinToString` accepts a **transformation function**, once again, so you don’t need to do some kind of separate mapping beforehand, it’s all built in. Truly powerful stuff to create a string from a collection.


```kotlin
val str = randomNumbers.joinToString (
    separator = "-",
    prefix = "pi://",
    limit = 5
) {
    "[$it]"
}

println(str)
// pi://[3]-[1]-[4]-[1]-[5]-...
```

That's it -- have a nice Kotlin!