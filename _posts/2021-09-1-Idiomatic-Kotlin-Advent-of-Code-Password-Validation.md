---
title: "Idiomatic Kotlin: Solving Advent of Code Puzzles, Passport Validation"
published: true
description: Input sanitization and validation feels like a problem as old as programming itself. We'll take a closer look today, as part of the Idiomatic Kotlin series.
tags: kotlin, adventofcode, codenewbie, 100daysofcode
canonical_url: https://blog.jetbrains.com/kotlin/2021/09/validating-input-advent-of-code-in-kotlin/
cover_image: /assets/idiomatic-kotlin-aoc-password/cbbzu9czcw77cmma8xfs.png
---

Today in “Idiomatic Kotlin”, we’re looking at [day 4 of the Advent of Code 2020 challenges](https://adventofcode.com/2020/day/4), in which we tackle a problem that feels as old as programming itself: input sanitization and validation.

<iframe width="560" height="315" src="https://www.youtube.com/embed/-kltG4Ztv1s?si=qzN8HpNJOgM0Ih47" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

## Day 4. Passport processing

We need to build a passport scanner that, given a batch of input text, can count how many passports are _valid._ You can find the complete task description at [https://adventofcode.com/2020/day/4](https://adventofcode.com/2020/day/4*).

Like many challenges, we first inspect our input:


```
ecl:gry pid:860033327 eyr:2020 hcl:#fffffd
byr:1937 iyr:2017 cid:147 hgt:183cm

iyr:2013 ecl:amb cid:350 eyr:2023 pid:028048884
hcl:#cfa07d byr:1929

hcl:#ae17e1 iyr:2013
eyr:2024
ecl:brn pid:760753108 byr:1931
hgt:179cm
```


The input is a batch of travel documents in a text file, separated by blank lines. Each _passport_ is represented as a sequence of key-colon-value pairs separated by spaces or newlines. _Our_ challenge is finding out how many passports are valid. For part one, “valid” means that they need to have all the required fields outlined by the security personnel: `byr`, `iyr`, `eyr`, `hgt`, `hcl`, `ecl` and `pid` (we conveniently ignore their request to validate the `cid` field).


## Solving Day 4, Part 1

Like many challenges, we start by reading our puzzle input as text and trim off any extraneous whitespace at the beginning and the end of the file. As per the description, passports are always separated by blank lines. A blank line is just two “returns”, or newlines, in a row, so we’ll use this to split our input string into the individual passports:


```kotlin
val passports = File("src/day04/input.txt")
    .readText()
    .trim()
    .split("\n\n", "\r\n\r\n")
```


(Note that depending on your operating system, the line separator in text files is different: On Windows, it is `\r\n`, on Linux and macOS, it’s `\n`. Kotlin’s `split` method takes an arbitrary number of delimiters, allowing us to cover both cases directly.)

We now have a list of passport strings. However, working with lists of raw strings can quickly get confusing. Let’s use Kotlin’s expressive type system to improve the situation and encapsulate the string in a very basic `Passport` class.


```kotlin
class Passport(private val text: String) {

}
```


We then just map the results of our split-up input to `Passport` objects:


```kotlin
// . . .
.map { Passport(it) }
```


From the problem description, we remember that key-value pairs are either separated by spaces or newlines within a single passport. Therefore, to get the individual pairs, we once again split our input. The delimiters, in this case, are either a space or one of the newline sequences.


```kotlin
fun hasAllRequiredFields(): Boolean {
    val fieldsWithValues = text.split(" ", "\n", "\r\n")
}
```


We then extract the key from each passport entry. We can do so by mapping our combined `fieldsWithValues` to _only_ the substring that comes before the colon:


```kotlin
fun hasAllRequiredFields(): Boolean {
    val fieldsWithValues = text.split(" ", "\n", "\r\n")
    val fieldNames = fieldsWithValues.map { it.substringBefore(":") }
    return fieldNames.containsAll(requiredFields)
}
```


The result of our function will be whether the `fieldNames` we extracted contain all required fields. The `requiredFields` collection can be taken directly from the problem statement and translated into a list:


```kotlin
private val requiredFields = listOf("byr", "iyr", "eyr", "hgt", "hcl", "ecl", "pid" /*"cid"*/)
```


To calculate our final number, and get our first gold star for the challenge, we need to count the passports for which our function `hasAllRequiredFields` returns true:


```kotlin
fun main() {
    println(passports.count(Passport::hasAllRequiredFields))
}
```


With that, we have successfully solved the first part of the challenge and can set our sights on the next star in our journey.

Find the full code for the first part of the challenge on [GitHub](https://github.com/kotlin-hands-on/advent-of-code-2020/blob/master/src/day04/day4_1.kt).


## Solving Day 4, Part 2

In part two of the challenge, we also need to ensure that each field on the passport contains a valid value. We are given an additional list of rules to accomplish this task, which you can again find in the [problem description](https://adventofcode.com/2020/day/4). Years need to fall into specific ranges, as does a person's height depending on the unit of measurement. Colors need to come from a prespecified list or follow certain patterns, and numbers must be correctly formatted.


### A refactoring excursion

Before we start building the solution for part 2, let’s briefly reflect on our code and find possible changes that will make adding this functionality easier for us. At this point in the challenge, we _know_ that our `Passport` class will need access to the different field names and their associated values. The classical data structure to store such kind of associative-dictionary information is a map. Let’s refactor our code to store passport information in a map instead of a string.

Because turning an input string into a map is still a process that’s associated with the `Passport`, I like encapsulating such logic in a companion object “factory” function. In this case, we can aptly call it `fromString`:


```kotlin
companion object {
    fun fromString(s: String): Passport {
```


The implementation for `fromString` partially reuses the normalization logic we had previously used in the first part of this challenge and expands it to create a map directly via Kotlin’s <code>[associate](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.sequences/associate.html)</code> function:


```kotlin
fun fromString(s: String): Passport {
    val fieldsAndValues = s.split(" ", "\n", "\r\n")
    val map = fieldsAndValues.associate {
        val (key, value) = it.split(":")
        key to value
    }
    return Passport(map)
}
```


A `Passport` object now encapsulates a map of string keys and string values:


```kotlin
class Passport(private val map: Map<String, String>) {
```


Interestingly enough, this change makes the implementation of the first part of our challenge trivial. We can simply check that the key set of our map contains all required fields:


```kotlin
fun hasAllRequiredFields() = map.keys.containsAll(requiredFields)
```



### Returning to solving part 2

For the second part of the challenge, we consider a passport valid if it contains all the required fields and has values that correspond to the official rules.

To ensure that all fields have valid values, we can use the `all` function to assert that a predicate holds true for every single key-value pair in our map:


```kotlin
fun hasValidValues(): Boolean =
    map.all { (key, value) ->
```


We can distinguish the different types of fields using a `when` expression. In this first step, we distinguish the different cases based on the keys in our map:


```kotlin
when (key) {
```


Each key we know gets a branch in this when statement. They all need to return a boolean value – `true` if the field is okay, `false` if the field violates the rules. The surrounding `all` predicate will then use those results to determine whether the passport as a whole is valid.

The `byr` (Birth Year), `iyr` (Issue Year), and `eyr` (Expiration Year) fields all require their value to be a 4-digit number falling into a particular range:


```kotlin
"byr" -> value.length == 4 && value.toIntOrNull() in 1920..2002
"iyr" -> value.length == 4 && value.toIntOrNull() in 2010..2020
"eyr" -> value.length == 4 && value.toIntOrNull() in 2020..2030
```


Note that our combined use of `toIntOrNull` together with the infix function `in` allows us to discard any non-numeric values, and ensure that they fall in the correct range.

We can apply a very similar rule to the `pid` (Passport ID) field. We ensure that the length of the value is correct and ensure that all characters belong to the set of digits:


```kotlin
"pid" -> value.length == 9 && value.all(Char::isDigit)
```


Validating `ecl` (eye color) just requires us to check whether the input is in a certain set of values, similar to the first part of our challenge:


```kotlin
"ecl" -> value in setOf("amb", "blu", "brn", "gry", "grn", "hzl", "oth")
```


At this point, we have two more fields to validate: `hgt` (Height) and `hcl` (Hair Color). Both of them are a bit more tricky. Let’s look at the `hgt` field first.

The `hgt` (Height) field can contain a measurement either in centimeters or inches. Depending on the unit used, different values are allowed. Thankfully, both “cm” and “in” are two-character suffixes. This means we can again use Kotlin’s `when` function, grab the last two characters in the field value and differentiate the validation logic for centimeters and inches. Like our other number-validation logic, we parse the integer and check whether it belongs to a specific range. To do so, we also remove the unit suffix:


```kotlin
"hgt" -> when (value.takeLast(2)) {
    "cm" -> value.removeSuffix("cm").toIntOrNull() in 150..193
    "in" -> value.removeSuffix("in").toIntOrNull() in 59..76
    else -> false
}
```


The last field to validate is `hcl` (Hair Color), which expects a `#` followed by exactly six hexadecimal digits – digits from `0` through `9`, and `a` through `f`. While Kotlin can parse base-16 numbers, we can use this case to show off the sledgehammer method for validating patterns – regular expressions. Those can be defined as Kotlin strings and converted using the `toRegex` function. Triple-quoted strings can help with escape characters:


```kotlin
"hcl" -> value matches """#[0-9a-f]{6}""".toRegex()
```


Our hand-crafted pattern matches exactly one hashtag, then six characters from the group of `0` through `9`, `a` through `f`.

As a short aside for performance enthusiasts: `toRegex` is a relatively expensive function, so it may be worth moving this function call into a constant. The same also applies to the set used in the validation for `ecl` – currently, it is initialized on each test.

Because the whole `when`-block is used as an expression, we need to ensure that all possible branches are covered. In our case, that just means adding an `else` branch, which simply returns `true` – just because a passport has a field we don’t know about doesn’t mean it can’t still be valid.


```kotlin
else -> true
```


With that, we have covered every rule outlined to us by the problem statement. To get our reward, we can now just count the passports that contain all required fields and have valid values:


```kotlin
fun partTwo() {
    println(passports.count { it.hasAllRequiredFields() && it.hasValidValues() })
}
```


We end up with a resulting number, which we can exchange for the second star. We’re clear for boarding our virtual flight. Though this was probably not the last challenge that awaits us…

Find the complete solution for the second part of the challenge on [GitHub](https://github.com/kotlin-hands-on/advent-of-code-2020/blob/master/src/day04/day4.kt).


## Conclusion

For today’s challenge, we came up with an elegant solution to validate specific string information, which we extracted using utility functions offered by the Kotlin standard library. As the challenge continued, we reflected on our code, identified more fitting data structures, and changed our logic to accommodate it. Using Kotlin’s `when` statement, we were able to keep the validation logic concise and all in one place. We saw multiple different ways of how to validate input – working with ranges, checking set membership, or matching a particular regular expression, for example.

Many real-world applications have similar requirements for input validation. Hopefully, some of the tips and tricks you’ve seen in the context of this little challenge will also be helpful when you need to write some validation logic on your own.

To continue puzzling yourself, check out [adventofcode.com](https://adventofcode.com/), whose organizers kindly permitted us to use their problem statements for this series.

If you want to see more solutions for Advent of Code challenges in the form of videos, subscribe to our [YouTube channel](https://www.youtube.com/kotlin) and hit the bell to get notified when we continue our idiomatic journey. More puzzle solutions are coming your way!
