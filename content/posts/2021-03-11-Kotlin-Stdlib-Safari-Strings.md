---
categories: general
cover_image: https://dev-to-uploads.s3.amazonaws.com/i/k63zdegwyfw2b3o8bq3n.png
date: "2021-03-11T19:33:57Z"
description: Exploring string related APIs in the Kotlin standard library. Companion
  blogpost for the first episode of our YouTube series.
series: Kotlin Standard Library Safari
tags: [kotlin, programming, learning, productivity]
title: 'Kotlin Standard Library Safari: Strings'
---

This blog post accompanies the first episode of our **YouTube series** "Kotlin Standard Library Safari", which you can find on the [official Kotlin YouTube channel](https://www.youtube.com/channel/UCP7uiEZIqci43m22KDl0sNw), or watch here directly!

<iframe width="560" height="315" src="https://www.youtube.com/embed/n4WBip822A8?si=L5Dx9yTsiXXXS9hW" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

## What's Kotlin Standard Library Safari?

In the "Kotlin Standard Library Safari" series, we’re going  through the **useful functionality** the standard library in Kotlin has to offer, one subject at a time. In the process, we’re hopefully going to unearth some **hidden gems** together, which will come in handy the next time _you_ write Kotlin code. Because if you know how to wield it, the [Kotlin standard library](https://kotlinlang.org/api/latest/jvm/stdlib/) is a **powerful tool** which can help you be **more productive solving your problems**, and be **more expressive in your code**.

This episode is all about **strings** – how we manipulate them, extract information, compare them, and much more. Let's get going!

## Creating strings

Strings are one of the most prevalent data types that you’re probably familiar with. After all, all kinds of information get stored in the form of text strings, one way or another. Probably even in your first ever Kotlin program, you had a **[string literal](https://kotlinlang.org/docs/basic-types.html#string-literals)** saying “Hello, World”, or something similar:

```kotlin
println("Hello, World!") // Hello, World!
```

But, as you may know, even [string literals](https://kotlinlang.org/docs/basic-types.html#string-literals) can do a bit more in Kotlin than just statically storing some text.

With **[string interpolation](https://kotlinlang.org/docs/basic-types.html#string-templates)** (also called "string templates"), we can enrich our strings by referencing variables, calling functions, or even evaluating complex expressions:

```kotlin
val name = "Johnathan"
println("Hello, $name!") // Hello, Johnathan
println("Your name is ${name.count()} long!") // Your name is 9 long!
```

When our strings contain multiple lines of text or special characters that are usually reserved, like quotation marks or backslashes, we can use **[multiline strings](https://kotlinlang.org/docs/basic-types.html#string-literals)**, which are denoted by triple-quotes. Everything will still behave as expected:

```kotlin
val name = """
Johnathan,
The Great,
The "Knowledgeable"
""".trimIndent()
println("Hello, $name!")
println("Your name is ${name.count()} long!")

/* Prints:
Hello, Johnathan,
The Great,
The "Knowledgeable"!
Your name is 41 long!
*/
```

When you type out these triple-quoted "raw" strings in [IntelliJ IDEA](https://www.jetbrains.com/idea/), you can notice that a call to [`trimIndent()`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.text/trim-indent.html) is automatically added to the string. This function **removes the _common_ indent of all input lines**, and also removes the first and the last lines if they are blank. This means that if we have some XML or JSON stored in a string, for example, we can keep its nice formatting without having to worry that we might introduce additional characters. Note how, in this example, the printed output is not indented, and doesn't begin or end with an unnecessary empty line:

```kotlin
fun main() {
    val myJson = """
    {
        "name": "jane",
        "lastname": "doe",
        "age": 29
    }
    """.trimIndent()
    println(myJson)
}

/* Prints:
{
    "name": "jane",
    "lastname": "doe",
    "age": 29
}
*/
```

If you are worried about performance when invoking an extra function during string creation, fear not. For constant strings, this transformation is [evaluated at compile time **with no runtime overhead**](https://blog.jetbrains.com/kotlin/2019/06/kotlin-1-3-40-released/#trimIndent) since Kotlin 1.3.40.

Of course, there are tons of other places where strings could come from. For example, Kotlin can **read terminal input** via the [`readLine()`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.io/read-line.html) function. Or, we could **read text from a file**, to name just two examples:

```kotlin
val fromStdIn = readLine()
val fromFile = File("input.txt").readText()
```

Another neat way of creating Kotlin strings yourself is via the [`buildString`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.text/build-string.html) function. We can give this function a code block which populates a [StringBuilder](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.text/-string-builder/), which offers us functions like [`append`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.text/-string-builder/append.html) and [`appendLine`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.text/append-line.html). This is particularly useful if you are **crafting large strings**, and performance is a concern.

```kotlin
val name = "Jane"
val myString = buildString {
    repeat(10) {
        append("Hello, ")
        append(name)
        appendLine("!")
    }
}
println(myString)

/* Prints:
Hello, Jane!
Hello, Jane!
Hello, Jane!
Hello, Jane!
Hello, Jane!
Hello, Jane!
Hello, Jane!
Hello, Jane!
Hello, Jane!
Hello, Jane!
*/
```

And there is a lot we can do with all these strings! Next to some functionality like upper- and lowercasing a string, Kotlin also comes with some functions that are particularly useful when we want to **extract information** out of them.

## Extracting information from strings
Extracting information usually means removing anything that isn’t useful. For example, we might want to detect strings that don’t contain any real information at all – so **empty strings**, that have no characters in them, or **blank strings**, that only contain whitespace.

To check whether we have this kind of string, we can use the [`isBlank`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.text/is-blank.html) and [`isEmpty`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.text/is-empty.html) functions:

```kotlin
println("   ".isBlank()) // true
println("".isEmpty()) // true
```

We can also conveniently replace those empty and blank strings with **default values** via the [`ifBlank`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.text/if-blank.html) and [`ifEmpty`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.text/if-empty.html) functions. Here, we can add a block which generates a default value for our strings if the corresponding condition is met:

```kotlin
val neverBlankString = " ".ifBlank {
    "Never blank!"
}
println(neverBlankString) // Never blank!
```

When we have a string with meaningful content, but that information is surrounded by whitespace we can use the [`trim`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.text/trim.html) function to **remove empty space** from the beginning and end of our string, like so:

```kotlin
val input = "    valuable info "
println(input.trim()) // valuable info
```

If there are some other characters or maybe a common phrase which we don’t really care about on the sides of the text, there’s three more functions which are our allies: [`removePrefix`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.text/remove-prefix.html), [`removeSuffix`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.text/remove-suffix.html), and [`removeSurrounding`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.text/remove-surrounding.html). With those, we can **get rid of characters** in the front, the back, and enclosing the text respectively:

```kotlin
val input = "##placeholder##"
println(input.removePrefix("##")) // placeholder##
println(input.removeSuffix("##")) // ##placeholder
println(input.removeSurrounding("##")) // placeholder
```

Another big way of extracting information from strings is via **[regular expressions](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.text/-regex/)**, or short regexes. But this is a bit of a bigger topic, so those will have to wait for a future episode.

## Comparing strings
Now that we know some tricks of how to get strings containing only the information we really care about, we can do things like compare those strings with each other.

**Equality checks** are easy enough, with the double-equals sign checking whether two strings are identical:

```kotlin
val stringA = "astring"
if(stringA == "astring") {
    println("Everything cool!")
}

// Everything cool!
```

But did you know that you can also compare two strings based on their **alphabetical order**? This can be done by using the less-than and greater-than signs.

```kotlin
println("a" < "b") // true
println("c" < "a") // false
```

In situations where we want to compare two strings **regardless of how their text is capitalized**, we can use the [`compareTo`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.text/compare-to.html) and [`equals`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.text/equals.html) functions with the `ignoreCase` parameter set to `true`. Not only does this look nicer than calling [`toLowerCase`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.text/to-lower-case.html) on both strings separately it also has better performance:

```kotlin
val input = "QuICK brOWN fox"
println(input.equals("Quick Brown Fox", ignoreCase = true)) // true
```

## Turning strings into collections
But often strings also contain multiple pieces of information which we would like to work with individually. To **rip apart a string** into pieces, there’s a number of options.

Most generally, the [`split`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.text/split.html) function is our friend here: we can specify a character, word or other string which will be used as a splitter, and the function gives us a nice list of the **individual string pieces cut up by our delimiter**. Consider, for example, the following `input` string, which contains 5 letters, all separated by `; `:

```kotlin
val input = "A; B; C; D; E"
println(input.split("; ")) // A, B, C, D, E
```
The output is a list with five elements.

And if we only want to make a **limited number of cuts**, we could also pass a `limit` to the split function. And then we’ll only get three pieces of text as a result, for example, with the last piece being the remainder of the string which wasn’t split any further. Let's consider the previous example once more, this time with a limit:

```kotlin
val input = "A; B; C; D; E"
println(input.split("; ", limit = 3)) // A, B, C; D; E
```
The output is a list with three elements: `A`, `B`, and `C; D; E`.

For the special case of **splitting a string up by lines**, there’s the very accurately named [`lines`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.text/lines.html) function which, as you may have guessed, gives you back your text line-by-line. The nice part here is that we don’t have to remember what the escape sequence for newlines are. Was it `\n`? `\r\n`? Who cares, we have the lines function!

```kotlin
val input = """
Well this is crazy
I'm a multiline string
So split me maybe?
""".trimIndent()
println(input.lines())
// [Well this is crazy, I'm a multiline string, So split me maybe?]
```

And of course, we can do all sorts of fancy things once we have a collection.

## Treating strings as collections of characters
And, to be exact, even an individual string behaves like a collection – since it's a **collection of characters**! On the one hand, this means that we can use the array operator to pick out characters at specific indexes, which can prove quite useful. But it also means that stuff like [`map`ping](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/map.html), [`filter`ing](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/filter.html), and friends all work directly on strings as well.

```kotlin
val input = "Hello, World"
println(input[1]) // e
println(input.filter { it.isUpperCase() }) // HW
```

We will tackle those **collection operations** in a future episode of "Kotlin Standard Library Safari". **Subscribe** to [the official YouTube channel](https://www.youtube.com/channel/UCP7uiEZIqci43m22KDl0sNw) to get updates on when a new episode is available!

## Conclusion
That's all for this first segment on the Kotlin standard library. I hope that you enjoyed this brief overview of _things to do with strings_ in Kotlin. There is, of course, still more stuff you can do. A great starting point for your **own exploration** of the string APIs available is the [documentation on text](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.text/)!

If you know of some tips you'd like to see featured in a future episode, make sure to **share them on Twitter** and tag [@sebi_io](https://twitter.com/sebi_io) and [@kotlin](https://twitter.com/kotlin) – and maybe we'll see your tip in a future part of this series!

I hope you learned something new, and that you will go and explore some more Kotlin!