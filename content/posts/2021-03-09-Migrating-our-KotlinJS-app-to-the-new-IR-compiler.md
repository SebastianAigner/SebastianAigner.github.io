---
cover_image: https://dev-to-uploads.s3.amazonaws.com/uploads/articles/n9aal63qn2c2g8skwmjb.jpg
date: "2021-03-09T00:00:00Z"
description: The IR compiler for Kotlin/JS comes with a lot of benefits for your apps,
  but also comes with more restrictions to make sure your code is correct. Let's look
  at some of the changes we had to make to our example app.
published: true
tags: [kotlin, javascript]
title: Migrating our Kotlin/JS app to the new IR compiler
---

Together with some colleagues, I maintain a small **full-stack web application** called CodeQuiz, which we built during a [48-hour hackathon at JetBrains](https://blog.jetbrains.com/blog/2019/11/22/jetbrains-7th-annual-hackathon/), and use at [events](https://www.youtube.com/watch?v=_AM5VbPTKeg) to gamify learning about Kotlin. I recently **migrated its frontend** which you can see below (and which is using the [`kotlin-react` wrappers](https://github.com/JetBrains/kotlin-wrappers/tree/master/kotlin-react)) to the **new Kotlin/JS IR compiler backend**.

![CodeQuiz in action](/assets/migrating-kotlin-js-ir/7bteuocjmnzyj2fi3ovm.gif)

The new compiler made a bunch of issues in our code visible, so I wanted to **share my experience** of migrating a Kotlin/JS app, and provide some **hints** on where to look when your app behaves unexpectedly after moving to the IR compiler.

## What's the Kotlin/JS IR compiler?

The [Kotlin/JS IR compiler](https://kotlinlang.org/docs/js-ir-compiler.html) is currently in development (with alpha stability) and on its way to become **the new default** way of compiling Kotlin to JavaScript. It's a completely re-engineered infrastructure for all things Kotlin/JS. This switch comes with a **number of benefits** for Kotlin/JS applications!

![](/assets/migrating-kotlin-js-ir/jsirtweet.png)

Using it allows you to already **test drive** a bunch of **new features**, including [**TypeScript declaration generation**](https://kotlinlang.org/docs/js-ir-compiler.html#preview-generation-of-typescript-declaration-files-d-ts), and profit from **new optimizations** like stronger DCE (and, as a result, **smaller generated artifacts**).

But it also means that you have to embrace its **more strict rules** regarding **interoperation** between Kotlin and JavaScript. This might **require some adjustment** at first, but will help write more predictable code that interoperates between Kotlin and JavaScript.

## Why doesn't my code _just work_? 😱
Especially with code at the "boundary" between Kotlin and JavaScript, **the legacy compiler was quite lenient** – for example how it exported all symbols (e.g. a `data class`) from Kotlin code to the JavaScript world.

Unfortunately, this means that it was easy to rely on compiler-specific internal behavior – **some things just _happened_ to work, even though the compiler gave no guarantees that these things _were supposed to work_**.

When using the IR compiler these **mistakes become visible** – it enforces **proper, explicit interoperation** between the world of Kotlin and the world of JavaScript (we call this the **"Closed World" model**). This stricter and more explicit control will help the compiler **optimize your code** more aggressively.

But, due to the nature of JavaScript being a dynamic runtime environment, some of these changes in behavior only appear **during execution time**. In the case of CodeQuiz, a number of modifications were necessary to get everything working. We'll look at them in detail in the next sections.

Ultimately, it boiled down to **running and testing** the application (both in `development` and `production` mode), and keeping an eye on the following:

- Helping Kotlin's DCE via `@JsExport` (e.g. React components)
- Using `external interface` to define React properties (`RProps`) and state (`RState`) (instead of (`data`) `class`es) and other areas of interoperation
- Creating plain JavaScript objects for interaction with external components
- Fixing npm dependencies that use `export default`
- Making sure our Kotlin dependencies support Kotlin/JS IR

## Turning on IR

To use the IR compiler for our project, we make a small change to our `build.gradle(.kts)` file. In the `kotlin` configuration block, change `js` to `js(IR)`, and enable the generation of JavaScript artifacts via `binaries.executable()`:

```kotlin
js(IR) {
    binaries.executable()
    browser {
        commonWebpackConfig {
            cssSupport.enabled = true
        }
        testTask {
            useKarma {
                useChromeHeadless()
            }
        }
    }
}
```

(Alternatively, the compiler type can also be set in the `gradle.properties` file, with the key `kotlin.js.compiler=ir`, which might be easier if you have a more complex project.)

We can now cross our fingers and execute the `browserDevelopmentRun` Gradle task to **start our application**.

Let's look at some of **the symptoms** our CodeQuiz app exhibited when first running the application with IR, and let's **correct the related code**.

## Make JS- and React-related classes external interfaces

The [`external` modifier](https://kotlinlang.org/docs/js-interop.html#declare-static-members-of-a-class) helps Kotlin understand that a certain **declaration is pure JavaScript**. This prevents problems like `ClassCastException`s that would arise from the **false assumption** that something is a Kotlin object (like a `data class`) – even though in reality, we are dealing with a plain JavaScript object.

When using `react-kotlin`, this can often be observed regarding definitions of `RState` and `RProps` – with React, **state and properties are pure JavaScript objects** managed by the framework for us.

### Turn RState into an external interface

When running my application with IR enabled for the first time, I got the following `ClassCastException` in regards to some React components' `init` method:

```javascript
codequiz-server.js?20e3:19131 Uncaught 
ClassCastException {message: undefined, cause: undefined, name: "ClassCastException", stack: "ClassCastException↵    at THROW_CCE (webpack-inter…s/react-dom/cjs/react-dom.development.js:4056:31)"}
cause: undefined
message: undefined
name: "ClassCastException"
stack: "ClassCastException↵    at THROW_CCE (webpack-internal:///./kotlin/codequiz-server.js:19101:11)↵    at App.init (webpack-internal:///./kotlin/codequiz-server.js:101164:69)↵    at RComponent_init_$Init$ (webpack-internal:///./kotlin/codequiz-server.js:31545:11)↵    at new App (webpack-internal:///./kotlin/codequiz-server.js:101148:5)↵    at constructClassInstance (webpack-internal:///../../node_modules/react-dom/cjs/react-dom.development.js:12716:18)↵    at updateClassComponent (webpack-internal:///../../node_modules/react-dom/cjs/react-dom.development.js:17425:5)↵    at beginWork (webpack-internal:///../../node_modules/react-dom/cjs/react-dom.development.js:19073:16)↵    at HTMLUnknownElement.callCallback (webpack-internal:///../../node_modules/react-dom/cjs/react-dom.development.js:3945:14)↵    at Object.invokeGuardedCallbackDev (webpack-internal:///../../node_modules/react-dom/cjs/react-dom.development.js:3994:16)↵    at invokeGuardedCallback (webpack-internal:///../../node_modules/react-dom/cjs/react-dom.development.js:4056:31)"
__proto__: RuntimeException
THROW_CCE	@	codequiz-server.js?20e3:19131
App.init	@	codequiz-server.js?20e3:101224

```

The stack trace suggests the `init` method of my `App` component. Since here, only application state is initialized, it was quite easy to pinpoint the underlying problem.

The **offending code** for the application state looks like this:

```kotlin
interface AppState : RState {
    var isPresenter: Boolean
    var lastMessage: Content?
    var isConnected: Boolean
    var chosenName: String?
}
```

This code _happened_ to work with the legacy compiler, but the IR compiler marks our problem: if our interface **describes the exact shape of a _JavaScript object_**, we need to **mark the interface as `external`**.

The refactored code looks like this:

```kotlin
external interface AppState : RState {
    // . . .
```

I made sure that all interfaces implementing `RState` in my application were annotated with `external` by using a [**structural search and replace**](https://www.jetbrains.com/help/idea/structural-search-and-replace.html). If you're using IntelliJ IDEA 2021.1, you can copy an [SSR template I prepared](https://gist.github.com/SebastianAigner/62119536f24597e630acfdbd14001b98) into your clipboard. To use it, open SSR via File | Find | Find Structurally [or Replace Structurally], click on the wrench icon, and select "Import Template from Clipboard". You can then click "Find" and "Replace All" to annotate all interfaces properly.

### Turn RProps into an external interface

`RState` isn't the only type that is affected by this change – similar problems appear when React properties (`RProps`) aren't marked as external:

```javascript
codequiz-server.js?20e3:100446 Uncaught TypeError: $this$attrs._set_presenterStartGameHandler_ is not a function
    at _no_name_provided__346.invoke_547 (codequiz-server.js?20e3:100446)
    at eval (codequiz-server.js?20e3:101430)
    at RElementBuilder.attrs_0 (codequiz-server.js?20e3:31443)
```

Analogously, this results from the `RProps` definition being just a Kotlin `interface`:

```kotlin
interface LobbyProps : RProps {
    var isPresenter: Boolean
    var presenterStartGameHandler: () -> Unit
    var playerLoginHandler: (String) -> Unit
    var playerList: PlayerList?
    var isDisabled: Boolean
}
```

The IR-approved versions of this code uses an `external interface`:

```kotlin
external interface LobbyProps : RProps {
    // . . .
```

Once again, this change can just be repeated for all components defining `RProps` interfaces in the Kotlin/JS application. This is easily automated via **structural search and replace**, as described in the previous section. [Here is a template](https://gist.github.com/SebastianAigner/a47a77f5e519fc74185c077ba12624f9) for auto-annotating your `RProps` as `external` – instructions for using SSR can be found in the previous section.

### Use external interfaces over data classes!

If you've been using Kotlin's `class` or `data class` to create your `RProps` or `RState`s, you will need to do a similar refactoring. Code like this is invalid when using Kotlin/JS IR:

```kotlin
data class CustomComponentState(
   var name: String
) : RState
```

Instead, use the following, refactored version.

```kotlin
external interface CustomComponentState: RState {
   var name: String
}
```

### Address limitations of external interfaces
Compared to a Kotlin `interface` or `class`, there are a few **limitations** when using `external interface`.

If you want to **instantiate the interface from Kotlin code**, you will have to mark your properties as `var` (`val` will not work here). Also, certain Kotlin-specific constructs, such as **function types with receivers, are prohibited** in external declarations.

In our codebase, the latter showed up as a **compile error** in an interface called `ButtonProps`. Here, we define a property `inside` which takes an extension function on the `StyledDOMBuilder` type to define any components that should be rendered in the button:

```kotlin
external interface ButtonProps : RProps {
    var inside: StyledDOMBuilder<BUTTON>.() -> Unit
    // . . .
}
```

Since these functions with receivers are just **syntactic sugar** for a function with an (implicitly named) parameter of the same type, we can refactor the `external interface` and pass the `StyledDOMBuilder` explicitly, resolving this problem:

```kotlin
var inside: (StyledDOMBuilder<BUTTON>) -> Unit
```

As luck would have it, our **callsite** was already structured so that this slightly changed style of function definition just works, so no change was needed there:

```kotlin
styledButton {
    props.inside(this)

    attrs {
        // . . .
    }
}
```

## Create plain JS objects for interoperability

Inside the definition of a React component, objects implementing `RState` and `RProps` **already exist**, and we simply **modify their properties**.

When we **create these objects** ourselves, we (currently still) need to be a bit careful. In CodeQuiz, we had the following problem passing values to an external [`react-minimal-pie-chart`](https://www.npmjs.com/package/react-minimal-pie-chart) component:

```kotlin
PieChart.default {
    attrs {
        data = props.statistics.answers.mapIndexed { index, (_, answerCounts) ->
            object: PiePoint {
                override var title = "Number $index"
                override var value = answerCounts
                // . . .
            }
        }.toTypedArray()
    }
}
```

...and that even though `PiePoint` is correctly specified as an `external interface`. The specific issue here turned out to be a bit finicky:

As of now, properties on a Kotlin `object` implementing an `external interface` are **_accessible_** from JavaScript, but, for example, they are [**not _enumberable_**](https://youtrack.jetbrains.com/issue/KT-31876). `react-minimal-pie-chart` internally uses [`Object.assign`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign) to copy around some of the data we pass as props. **It loses our non-enumerable properties** in the process, which leads to some unexpected `undefined`s at runtime. 

Until this problem is resolved (see the [corresponding YouTrack issue](https://youtrack.jetbrains.com/issue/KT-17683)), the safe route right now is to **generate plain JavaScript objects** ourselves.

The `kotlin-wrappers` actually include a **helper function** called [`jsObject<T>`](https://github.com/JetBrains/kotlin-wrappers/blob/master/kotlin-extensions/src/main/kotlin/kotlinext/js/Helpers.kt) which is useful for creating such objects. The same snippet using these plain JavaScript objects looks like this:

```kotlin
PieChart.default {
    attrs {
        data = props.statistics.answers.mapIndexed { index, (_, answerCounts) ->
            jsObject<PiePoint> {
                title = "Number $index"
                value = answerCounts
                // . . .
            }
        }.toTypedArray()
    }
}
```

Since in a plain JavaScript object, all properties are enumerable, our charting library now works properly.

## Help the DCE via @JsExport!

Dead Code Elimination (DCE) is the part of the Kotlin/JS IR compiler that helps **keep your compiled production artifacts small**. It's responsible for analyzing the Kotlin code for any pieces of code that aren't being used anywhere, and subsequently deleting them.

When packaging our application for production (which is when DCE is executed, e.g. via `browserProductionRun` or `jsBrowserDistribution`), this can present a **problem** for our **React components**.

Consider the following `Evaluation` class from our project:

```kotlin
class Evaluation(l: EvaluationProps) : RComponent<EvaluationProps, RState>(l) {
    override fun RBuilder.render() {
```

The only way this class is ever referenced via its [`KClass`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.reflect/-k-class/), when we tell React to render this component:

```kotlin
child(Evaluation::class) {
    attrs {
            // . . .
```

As of now, the IR DCE tries to be a bit too clever for its own good. **It removes the contents of our class** practically entirely (from its perspective, none of it, besides the type itself, is being used after all!). This causes the (unfortunately quite cryptic) error `TypeError: r.render is not a function` (or something similar).

To turn this error message into something a bit more actionable, we can (temporarily!) **enable webpack's development mode** in our Gradle build file (`build.gradle(.kts)`), which turns off the name minification:

```kotlin
browser {
    commonWebpackConfig {
        // . . .
        mode = org.jetbrains.kotlin.gradle.targets.js.webpack.KotlinWebpackConfig.Mode.DEVELOPMENT
    }
}
```

For now, we need to make sure our component doesn't get removed, we can **mark the class** with `@JsExport`. Then, DCE will not touch it:

```kotlin
@JsExport
class Evaluation(l: EvaluationProps) : RComponent<EvaluationProps, RState>(l) {
    override fun RBuilder.render() {
```
(As a small sidenote: declarations marked as `external`, such as an `external interface`, are always treated as reachable by DCE, and don't need this treatment. [Functional components](https://github.com/JetBrains/kotlin-wrappers/blob/master/kotlin-react/README.md#creating-a-react-function-component-with-kotlin) are also not affected, because their usage site doesn't refer to the `::class`, but to the variable holding the component directly.)

In the case of `kotlin-react`, there are still **some rough edges**, like the warning `Exported declaration uses non-exportable super type: RComponent`. Together with making this kind of "workaround" obsolete, these are topics that still need addressing before the IR compiler becomes the default choice.

You can find a Structural Search and Replace template for this change [right here](https://gist.github.com/SebastianAigner/b06f50b1448f6466775b0df14fb2b35f). Find instructions on how to apply this automated replacement to your project in one of the previous paragraphs.

This is definitely one of the trickier issues to find, because it **only manifests in production artifacts** (when DCE is actually executed). For this reason, it's important to **test your production artifacts**!

## Fixing dependencies on default exports

Our app uses a few external React components which we get from npm, including `react-minimal-pie-chart`. 

```javascript
Module parse failed: Unexpected keyword 'default' (35:6)
File was processed with these loaders:
 * ../../node_modules/source-map-loader/dist/cjs.js
You may need an additional loader to handle the result of these loaders.
|   var render = $module$react_dom.render;
|   var createGlobalStyle = $module$styled_components.createGlobalStyle;
>   var default = $module$react_minimal_pie_chart.default;
|   var default = $module$react_player.default;
|   'use strict';
```

We wrote the following external declaration for the component provided by this package, which worked for our used version, `5.0.2`, beforehand, but not with IR:
 
```kotlin
@file:JsModule("react-minimal-pie-chart")
@file:JsNonModule
external interface PieChartProps: RProps {
    // . . .
}

@JsName("default")
external val PieChart: RClass<PieChartProps>
```

Here, we actually hit **a bug in the IR compiler**! It currently does not treat [`default`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export#description) as a reserved identifier. This causes a conflict when the library uses this identifier for its exports:

```javascript
import Chart from './Chart';
export default Chart;
```

[An issue](https://youtrack.jetbrains.com/issue/KT-41650) exists to turn `default` into a reserved identifier, and this point will hopefully be addressed soon. Until then, the **workaround** is to wrap the definition in an external object, like so:

```kotlin
external interface PieChartProps : RProps {
    // . . .
}

@JsModule("react-minimal-pie-chart")
@JsNonModule
external object PieChart {
    val default: RClass<PieChartProps>
}
```

At the usage site for the component, we now use the `PieChart.default` value instead of the `PieChart` value previously:

```kotlin
PieChart.default {
    attrs {
        // . . .
    }
}
```

## Fix library code
After fixing all of the other problems, I noticed a special case where the app would throw the following error:
```javascript
Uncaught Error: `props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. Please visit https://reactjs.org/link/dangerously-set-inner-html for more information.
```

It took me a while to find the culprit, but I remembered that there was a place where we explicitly allowed HTML-formatted rich text in our application, and are using `unsafe`:

```kotlin
val label: RBuilder.() -> Unit = {
    span {
        attrs.unsafe {
            +answerText
        }
    }
}
```

It turns out that `kotlin-wrappers` actually [**contained a small mistake**](https://github.com/JetBrains/kotlin-wrappers/pull/416) in its own interoperation code: it used a `class` instead of an `external interface` for their `InnerHTML` object – which is used to implement `attrs.unsafe`.

This was a great point to **make a small open-source contribution** in the form of a pull request (and get the code improved further just [hours later](https://github.com/JetBrains/kotlin-wrappers/pull/418))!

## Petition library authors to support IR

Luckily, all the libraries we are using in the project (including [Ktor Clients](https://ktor.io/) and [kotlinx.serialization](https://github.com/Kotlin/kotlinx.serialization)) already support the Kotlin/JS IR compiler, and they provide artifacts that work with both backends. And there is a number of other libraries that already offer artifacts compatible with the IR compiler, like [fritz2](https://www.fritz2.dev/), [KorGE](https://github.com/korlibs/korge), [Kodein-DI](https://github.com/Kodein-Framework/Kodein-DI), and more.

If you're using a Kotlin/JS library that currently does not ship IR-compatible artifacts, it might be a good idea to **catch the maintainer's attention**, and maybe **help out** yourself to ensure that your favorite libraries work well with the new compiler infrastructure. To make sure libraries can support both legacy and IR backends at the same time, there is also a mechanism for [authoring libraries with backwards compatibility](https://kotlinlang.org/docs/js-ir-compiler.html#authoring-libraries-for-the-ir-compiler-with-backwards-compatibility).

If you're a **library author**, and want to learn more about supporting the Kotlin/JS IR backend, please do not hesitate to reach out on the [Kotlinlang Slack](http://kotl.in/slack). You can either contact me directly, or get input from the team and community in the `#javascript` channel.

## Closing thoughts
The new IR compiler introduces some changes that might require action from you – especially in places where Kotlin code meets the JavaScript platform. I hope this post helps diagnose some of these behavior changes, so that you can experience all the **exciting stuff** the new compiler brings as soon as possible.

If you encounter issues during your migration to the IR backend, share them with the team. We're happy to help, and rely on your feedback to make sure we can iron out any remaining problems as soon as possible. The easiest way to do this is to log your problems in the official Kotlin [issue tracker](http://kotl.in/issue).

Give the Kotlin/JS IR compiler a try in your projects, and prepare yourself for the future! 