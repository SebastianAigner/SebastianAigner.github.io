---
cover_image: /assets/stdlibsafari5/gvw7ksfqlrv2ba8wg11f.jpeg
date: "2021-07-08T00:00:00Z"
description: Lists are the most popular collection type in the Kotlin standard library,
  and for a good reason! Learn all about them, and bring your Kotlin skills to the
  next level!
series: Kotlin Standard Library Safari
tags: [kotlin, programming, android, productivity]
title: Exploring Kotlin Lists
---

This blog post accompanies a video from our **YouTube series** which you can find on our [Kotlin YouTube channel](https://kotl.in/video), or **watch here** directly!

<iframe width="560" height="315" src="https://www.youtube.com/embed/CDWy16UDeLQ?si=-NrA7Nvn6KpkrsW5" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

**Today, we're talking all about lists!** Lists are the most popular collection type in Kotlin for a good reason, and we’ll find out why together.

## Lists

### What’s a list?

If you've written Kotlin code before, you've definitely seen a list – they're collections of ordered elements, where each element is accessible via an index. As such, they're one of the basic building blocks for a lot of Kotlin code.


### Creating lists

If you’re creating lists on your own, you’re most likely using the [`listOf`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/list-of.html) function, which takes a variable number of arguments, and those become the elements of your list. Even in this blog post series, we've created a list like that about a hundred times:

```kotlin
listOf(1, 2, 3, 4, 5)
// [1, 2, 3, 4, 5]
```

A little lesser known is the ability to create lists via the [`List`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/-list.html) constructor function. Here, we pass two parameters – the `size` of the list, and an `init` function that creates each of the elements in our list. That function we pass gets the element index as its parameter, which we can use to adjust the item content:

```kotlin
List(5) { idx -> "No. $idx" }
// [No. 0, No. 1, No. 2, No. 3, No. 4]
```

Of course, lists can come from other places as well: types like collections, iterables, and others often feature a [`toList`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/to-list.html) method.

For example, in the case of a string, we get a list of its characters:

```kotlin
"word-salad".toList()
// [w, o, r, d, -, s, a, l, a, d]
```

Given a map of placements and the associated medals, we can call `toList` on that to get a list of key-value pairs:

```kotlin
mapOf(
1 to "Gold",
2 to "Silver",
3 to "Bronze"
).toList()
// [(1, Gold), (2, Silver), (3, Bronze)]
```

Sequences, ranges, and progressions behave similarly. They materialize their values, and put them in a list when calling `toList`. As an example, we can consider a random sequence of numbers, or the inclusive integer range from zero to ten:

```kotlin
generateSequence {
    Random.nextInt(100).takeIf { it > 30 }
}.toList()
// [73, 77, 69, 79, 71, 64]

(0..10).toList()
// [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
```

An extra case worth mentioning is calling `toList` on something that already is a list. This creates brand-new copy of the original list. We can see this in the following example, where we create a mutable list with a few numbers. By calling `toList`, we obtain a new working copy:

```kotlin
val list = mutableListOf(1, 2, 3)
val otherList = list.toList()

list[0] = 5
println(list)
// [5, 2, 3]

println(otherList)
// [1, 2, 3]
```

As we can see, when the original list is changed, the working copy we just created does not contain any of the changes applied to the original collection.

### Accessing list items

To get items out of our lists, we have multiple options. The most basic way of doing so is using the [`get`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/-list/get.html) function, together with an index:


```kotlin
val myList = listOf("🍔", "🌭", "🍕")
myList.get(1) // 🌭
```

But if you ever type out `.get` manually, you’ll see that IntelliJ IDEA already gives you the helpful hint to use some much more popular syntactic sugar for it – the indexed access operator, denoted by the brackets with an index:

```kotlin
myList[1] // 🌭
```

There are also some additional flavors of the `get` function which we can explore. Two of those that come to mind are [`getOrElse`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/get-or-else.html) and [`getOrNull`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/get-or-null.html). They help us handle cases where we might be accessing an index that falls out of bounds (which can either be a negative index, or an index that’s larger than the last index in our collection.)

Using the default indexed access causes an [exception](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin/-index-out-of-bounds-exception/) when provided a parameter that's out of bounds:


```kotlin
myList[3]
// Index 3 out of bounds for length 3
```

We can use [`getOrNull`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/get-or-null.html) to short-circuit our return value to `null`. Alternatively, we can use [`getOrElse`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/get-or-else.html) to compute a default value to be used instead. The default value is computed based on a passed lambda, which also receives the index:

```kotlin
val myList = listOf("🍔", "🌭", "🍕")
myList.getOrNull(3)
// null

myList.getOrElse(3) {
    println("There's no index $it!")
    "😔"
}
// There's no index 3!
// 😔
```

These special functions are only necessary to work with indexes that might fall out of bounds, though. [Nullability](https://kotlinlang.org/docs/null-safety.html), for example, is handled the same way as you would in any other situation in Kotlin: using the power of the Elvis operator, smart-casts and friends.

```kotlin
val listOfNullableItems = listOf(1, 2, null, 4)
val x: Int = listOfNullableItems[0] ?: 0
```

### Slicing

Of course, we can go beyond getting individual items out of our list. Because a list is a collection like any other, we have access to the same [`take`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/take.html) and [`drop`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/drop.html) functions that were introduced in the _[Diving into Kotlin collections]({% post_url 2021-03-29-Diving-into-Kotlin-collections %})_ post.

But lists have a special way of retrieving multiple items - the [`slice`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/slice.html) function!

When we give this function a bunch of indexes, it returns the elements at those places in our collection. In this example, we’re passing a list with index `0, 2, 4`, and get those items from our list of letters:

```kotlin
val myList = listOf("a", "b", "c", "d", "e")
myList.slice(listOf(0, 2, 4))
// [a, c, e]
```

Instead of writing out all the indices by hand, we could also use `IntRange`s or progressions to specify the indexes. For example, we could request “all items from 0 through 3”, or specify a custom step-size of 2. We could even pull out some items in reverse order, if we create a progression that uses `downTo`:

```kotlin
myList.slice(0..3)
// [a, b, c, d]

myList.slice(0..myList.lastIndex step 2)
// [a, c, e]

myList.slice(2 downTo 0)
// [c, b, a]
```

As you may suspect, this _list_ of list features is not quite exhaustive – as always, there’s some more to explore even on this subject. But let’s put that on the back burner for a bit, and move on to a special kind of list – it's time to talk about _mutable lists_!

## Mutable Lists

What's so special about mutable lists? Well, you can _mutate_ them! That, of course, doesn’t mean that these lists will turn into zombies (🧟‍♂️), but that you can change their content. If we consult an excerpt of a class hierarchy, we can see that `MutableList` specializes `List`, meaning everything we’ve learned about lists so far also works for their mutable counterpart, plus some extra functionality.

![list-specialization](/assets/stdlibsafari5/nrg0js7pl6435klg2gm0.png) 

It's precisely that extra functionality that we’re interested in right now!

### Creating mutable lists

Once again, mutable lists are commonly created via the [`mutableListOf`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/mutable-list-of.html) function, with a bunch of values as arguments. And, wherever you were able to find a `toList` method, as discussed previously, you’ll probably also find a [`toMutableList`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/to-mutable-list.html). That also includes other lists and mutable lists – where you’ll get a fresh copy when calling `toMutableList`:

```kotlin
mutableListOf(1, 2, 3)
// [1, 2, 3]

(0..10).toMutableList()
// [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

listOf(1, 2, 3).toMutableList()
// [1, 2, 3]
```

### Add / Remove / Update

Let's move on to the core of this subject – the ability to change content. That starts with adding something to the collection. If we want to add an extra number to the end of our mutable list we can do so via the [`add`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/-mutable-list/add.html) function, or by using the `+=` operator shorthand, both of which append an item to the end of the list.

If we know _where_ in the collection we want our item to go, the `add` function also accepts an index, which inserts the new element at that position and moves the surrounding elements to accommodate it. In the same way, we can also add a whole other collection to our mutable list:


```kotlin
val m = mutableListOf(1, 2, 3)
m.add(4)
m += 4
println(m)
// [1, 2, 3, 4, 4]

m.add(2, 10)
println(m)
// [1, 2, 10, 3, 4, 4]

m += listOf(5, 6, 7)
println(m)
// [1, 2, 10, 3, 4, 4, 5, 6, 7]
```


We’re of course not constrained to just adding elements to our list – we can also remove them. If we know what element we want to get rid of, we can do that via the [`remove`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/-mutable-list/remove.html) function or the `-=` operator shorthand, which removes from our collection _a single instance_ of the element we provide. In this example, after calling -= and `remove`, we got rid of two of the 3s in our original collection – because each invocation removed one of them.

Alternatively, we can also pass the `-=` operator a collection of elements. In this case, the operator acts as a shorthand for the `removeAll` function. Here, it looks at every element in the collection we pass, and _removes all instances of them_ in our original, mutable collection. (This is an important distinction to make!) So, by passing 1 and 4 as a collection, we remove _all instances_ of those numbers from our mutable list, and we’re left with only 2 and 3 at the end.


```kotlin
val m = mutableListOf(1, 2, 3, 3, 3, 4, 4, 4)
m -= 3
m.remove(3)
println(m)
// [1, 2, 3, 4, 4, 4]

m -= listOf(1, 4)
println(m)
// [2, 3]
```

If we know the index where we want to kick an item out, we use the [`removeAt`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/-mutable-list/remove-at.html) function instead. For example, we could remove the second element in our list, which resides at index 1.

```kotlin
val m = mutableListOf(1, 2, 3, 3, 3)
m.removeAt(1)
println(m)
// [1, 3, 3, 3]
```

To update an item, we most commonly use the [_indexed access operator_](https://kotlinlang.org/docs/operator-overloading.html#indexed-access-operator) – so the brackets – together with an assignment. That one calls the [`set`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/-mutable-list/set.html) function with that index and element under the hood, and switches out the item at the specified index – in this case, trading a "b" for an "a".

```kotlin
val m = mutableListOf("a", "b", "c", "d", "e")
m[1] = "a"
println(m)
// [a, a, c, d, e]
```

### Fill and Clear

In certain situations, we might want to turn all elements of our list into the same element – like zeroing out a buffer before reusing it. This is something we can do using the [`fill`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/fill.html) function, which replaces each element with the same value we specify. If we look at a list of fruits, for example, and suddenly realize that all of them are really just sugar, we use fill to replace them with candy (🍬). While that metaphor may not be _entirely scientifically accurate_, it's tasty nonetheless!

And when we want to wipe our collection clean, the [`clear`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/-mutable-list/clear.html) function can help with removing all elements from a collection – in our case, getting rid of all the candy:

```kotlin
val fruits = mutableListOf("🍉", "🍊", "🥝")
// wait, it's all sugar?
fruits.fill("🍬")

println(fruits)
// [🍬, 🍬, 🍬]

// ... nom nom
fruits.clear()

println(fruits)
// []
```

Perhaps unsurprisingly, mutable lists grow and shrink automatically to accommodate all your items, so you can have an arbitrary number of elements in your collection. This might be obvious, but it’s so darn convenient, so I figured I’d mention it. The things we take for granted!

### In-place modifications

Thinking back to some of the previous entries of this series, we’ve seen a number of neat functions which we wouldn’t want to miss for mutable collections either – things like `sorted`, `shuffled`, and `reversed`. However, those don’t modify the original collection.

Luckily for us, these functions also have a mutable counterpart. So, when we want to sort, shuffle, or reverse a mutable list in place – instead of creating a new, separate copy with the effects applied – we use the [`sort()`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/sort.html) instead of `sorted()`, [`shuffle()`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/shuffle.html) instead of `shuffled()`, and [`reverse()`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/reverse.html) instead of `reversed()` functions:

```kotlin
val list = listOf(3, 1, 4, 1, 5, 9)
list.shuffled()
list.sorted()
list.reversed()

println(list)
// [3, 1, 4, 1, 5, 9]

val m = list.toMutableList()
m.shuffle()
println(m)
// [5, 1, 1, 3, 4, 9]

m.sort()
println(m)
// [1, 1, 3, 4, 5, 9]

m.reverse()
println(m)
// [9, 5, 4, 3, 1, 1]
```

Mutable lists also offer the possibility to remove or keep _all_ elements that fulfill a certain predicate. The [`removeAll`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/remove-all.html) function can remove all elements that match the predicate we specify. Let’s say we’re not a fan of small numbers in our collection, and only want to keep numbers that are 5 or above – `removeAll` helps us do exactly that.

```kotlin
val numbers = mutableListOf(3, 1, 4, 1, 5, 9)
numbers.removeAll { it < 5 }
println(numbers)
// [5, 9]
```

The [`retainAll`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/retain-all.html) function is the opposite, and only keeps those elements in the mutable list that match. If we want to retain every character in our collection that is a letter, we do that with the `retainAll` function:

```kotlin
val letters = mutableListOf('a', 'b', '3', 'd', '5')
letters.retainAll { it.isLetter() }
println(letters)
// [a, b, d]
```

This might feel a bit familiar to you, and rightfully so, because these are essentially the mutating equivalents of the [`filter`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/filter.html) and [`filterNot`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/filter-not.html) functions.

### Views on Lists

The last topic on today’s agenda is views on lists. That name already hints at what they allow us to do – they allow us to look at the elements in our list from a different perspective – let’s see what that means.

Let’s assume we have a collection of fruits. To create a view, we can use the [`subList`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/-list/sub-list.html) function, which takes a beginning and end index, which determines which elements should be “visible” in the view. By having a look at an example sublist, we can see that it contains the elements from our original collections based on the indices we specify (with the upper bound being exclusive):

```kotlin
val fruits = mutableListOf("🍉", "🍊", "🥝", "🍏")
val sub = fruits.subList(1, 4)
println(sub)
// [🍊, 🥝, 🍏]
```


Because this is only a _view_, and not a copy of our original collection, changes are automatically visible. That means if we change the orange to a banana in the underlying `fruits` list, then our sublist will reflect that change:

```kotlin
fruits[1] = "🍌"
println(sub)
// [🍌, 🥝, 🍏]
```

What may be even more interesting is that this sublist is in itself mutable, as well! If we change the green apple in our sublist to a pineapple, and have a look at our original fruits collection again, we see that the change is visible from here as well:

```kotlin
sub[2] = "🍍"
println(fruits)
// [🍉, 🍌, 🥝, 🍍]
```

Or, we can use the fill function which we’ve learned about earlier to turn an interval inside of our fruit-list back into candy, again:

```kotlin
sub.fill("🍬")
println(fruits)
// [🍉, 🍬, 🍬, 🍬]
```

To reiterate; all of that works because these aren’t two different collections – there is only one collection, and  `subList` has just given us a different perspective on that list!

**An important note on the topic of sublists:** They are only well-defined as long as the underlying, original list is _not structurally changed_. Changes affecting the size of the list, for example, automatically cause any views that were previously returned by invoking `subList` to have undefined behavior.

For a common case, which is looking at a list backwards, the Kotlin standard library also comes with the [`asReversed`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/as-reversed.html) function. It provides a backwards view of the underlying list. Once again, changes made in the view are visible in the original collection, and vice versa. As you can see in the following example, turning the orange into a banana in our original list also changes what we see in the reversed view. Altering it back to a pineapple via our reversed view also alters our original mutable list:

```kotlin
val fruits = mutableListOf("🍉", "🍊", "🥝", "🍏")
val stiurf = fruits.asReversed()

println(stiurf)
// [🍏, 🥝, 🍊, 🍉]

fruits[1] = "🍌"
println(stiurf)
// [🍏, 🥝, 🍌, 🍉]

stiurf[2] = "🍍"
println(fruits)
// [🍉, 🍍, 🥝, 🍏]
```

These types of “views” are actually available for non-mutable lists, as well, and allow you to pass around different sub-selections of your collections without having to create new copies every time – however, this seemed like a topic that would be nicer to illustrate with the mutable variant, to drive the point home that there really is only one underlying collection.

## Outro

With that, we have reached the end of today’s expedition! I hope some of the stuff you’ve seen today is helping you strengthen your understanding of Kotlin lists. When you’re  writing Kotlin code the next time, see if you can apply some of the stuff we’ve talked about today – whether it’s slicing a collection, using sub-lists, or handling out-of-bounds situations for lists elegantly with the `getOrNull` and `getOrElse` functions.

Now, it’s time for all of you to go and explore some more Kotlin! Take care, and see you in the next one!