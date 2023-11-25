---
date: "2023-11-16T01:53:34Z"
title: "Coroutines quirks: withTimeout might not do what you think it does"
draft: false
---

**TLDR**: The `withTimeout` function doesn't cancel the execution of the _block_ you pass it. It throws
a `TimeoutCancellationException`, which, when left uncaught, **cancels the invoking
coroutine**. The `withTimeoutOrNull` function does not exhibit this behavior.

The kotlinx.coroutines team is [aware of this issue](https://github.com/Kotlin/kotlinx.coroutines/issues/1374).

<hr>

In Kotlin coroutines,
the [`withTimeout` function](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/with-timeout.html)
can be used to constrain the execution of your code to a specific timeout. Its signature looks as follows:

```kotlin
withTimeout(timeMillis: Long, block: suspend CoroutineScope.() -> T): T
```

...you specify a timeout, and a suspending code block that is an extension on `CoroutineScope`. As you might correctly
guess, the timeout is realized via the regular cancellation mechanism in Kotlin: That is, after the timeout has expired,
the block throws as
a [`TimeoutCancellationException`](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-timeout-cancellation-exception/),
a subclass
of [`CancellationException`](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-cancellation-exception/).

However, you might see this `TimeoutCancellationException` appear in a place where you wouldn't expect it. Consider the
following code snippet and its output (in its entirety):

```kotlin
import kotlinx.coroutines.*

fun main() {
    runBlocking {
        this.coroutineContext.job.invokeOnCompletion {
            println("Job is completing: $it")
        }
        launch {
            while (true) {
                println("Alive!")
                delay(500)
            }
        }
        withTimeout(500) {
            println("Doing some too-long-running-task that will timeout")
            delay(2000)
            // won't reach here
        }
    }
}

// Doing some too-long-running-task that will time out
// Alive!
// Job is completing: kotlinx.coroutines.TimeoutCancellationException: Timed out waiting for 500 ms
// Exception in thread "main" kotlinx.coroutines.TimeoutCancellationException: Timed out waiting for 500 ms
```

This demonstrates the part that might clash with your intuition: **It's not the timeout block that gets canceled; it's
the coroutine scope in which `withTimeout` was called that is canceled.** In the case of this code snippet, that means
the application as a whole terminates. In the case of a larger application, you might just see your coroutines silently
cancelled.

## Fix #1: Catch the `TimeoutCancellationException`

You can remedy this by explicitly catching the `TimeoutCancellationException`:

```kotlin
try {
    withTimeout(500) {
        println("Doing some too-long-running-task that will time out")
        delay(2000)
        // won't reach here
    }
} catch (t: TimeoutCancellationException) {
    println("Timed out")
}
```

When catching the exception, other coroutines of the scope from which you called `withTimeout` will keep running, since
the `CancellationException` (or, more precisely, the `TimeoutCancellationException`) was prevented from reaching the
scope. Forgetting to wrap the `withTimeout` function in this try-catch block will cause the surrounding scope to be
canceled, which is not what you may have expected!

After repeating the mantra "don't catch `CancellationException` without rethrowing it" to myself for ages, it does feel
a little bit odd to now catch a subtype of `CancellationException` and not propagate it further. Hence, I prefer fix #2.

## Fix #2: Use the `withTimeoutOrNull` sibling function

Alternatively, you can use the sibling function `withTimeoutOrNull`. In the typical Kotlin pattern, where `withTimeout`
throws an exception, `withTimeoutOrNull` returns `null` if the timeout is exceeded. As such, it doesn't suffer from the
same trickiness that stems from `TimeoutCancellationException` being a subtype of `CancellationException`. If you look
into
the [implementation of `withTimeoutOrNull`](https://github.com/Kotlin/kotlinx.coroutines/blob/28ed2cd84a376ec191fd15626624eba1cbd9fe4f/kotlinx-coroutines-core/common/src/Timeout.kt#L103-L115),
you'll recognize that it does the exact same thing we've done in the
snippet above: It takes care of catching the `TimeoutCancellationException` to prevent it from propagating further, and
returns null:

```kotlin
public suspend fun <T> withTimeoutOrNull(timeMillis: Long, block: suspend CoroutineScope.() -> T): T? {
    if (timeMillis <= 0L) return null

    var coroutine: TimeoutCoroutine<T?, T?>? = null
    try {
        return suspendCoroutineUninterceptedOrReturn { uCont ->
            val timeoutCoroutine = TimeoutCoroutine(timeMillis, uCont)
            coroutine = timeoutCoroutine
            setupTimeout<T?, T?>(timeoutCoroutine, block)
        }
    } catch (e: TimeoutCancellationException) {
        // Return null if it's our exception, otherwise propagate it upstream (e.g., in case of nested withTimeouts)
        if (e.coroutine === coroutine) {
            return null
        }
        throw e
    }
}
```

Personally, I'd probably just opt for the `withTimeoutOrNull` function: It future-proofs me from any changes that might
be made to the `withTimeout` function regarding whether the thrown exception stays a subtype
of `CancellationException` or not, and it saves me having to manage a separate try-catch.

If you only look at the signature, it's tempting to interpret `withTimeout` as introducing its own coroutine scope that
will be canceled when the timeout expires, but that's not the actual behavior -- the chances are good that you'll have
an easier time just using `withTimeoutOrNull`. Something to look out for the next time
you're building timeouts into your concurrent code!