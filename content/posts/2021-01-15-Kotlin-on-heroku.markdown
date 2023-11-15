---
categories: general
date: "2021-01-15T09:16:31Z"
title: Kotlin, Ktor and Exposed on Heroku
typora-root-url: ../../my-blog
---

Getting an application into the hands of the first users is the best feeling. Seeing them try out an app for the first time and collecting feedback from them for future improvement has always felt very rewarding to me. For server-side apps, this usually means getting the app deployed somewhere – published on the web.

Today I want to share one quick way to get Kotlin applications built with Ktor onto the web: Using **Heroku**.

As a PaaS (Platform as a Service), Heroku takes care of most administrative tasks so that we don't have to. Stuff like keeping their platform up-to-date and secure, managing the networking stack, and more.

I personally enjoy Heroku because their **free tier** means I can publish apps at no upfront cost. Plus, I also get to say that my application runs _in the cloud_ from day one! 😉🌩

If you also want to learn how to deploy your Kotlin app directly from a local Git repository, take **10 minutes** and let me guide you through the steps for getting your first Kotlin app online on Heroku!

### Signing up for Heroku & Setting up the Heroku CLI 🛠

Before we even create our demo Kotlin application, it's a good idea to set up our environment – starting with setting up a Heroku account. We can do that by simply visiting their signup page at [http://signup.heroku.com/](http://signup.heroku.com/). The [free plan](https://www.heroku.com/free) which is provided by default is more than enough for our purposes (even with its [limitations](https://devcenter.heroku.com/articles/free-dyno-hours)), so we don't need to add any payment information.

![Heroku Signup Page](/assets/kotlin_on_heroku/uo8kcg1wy91v2otti1wo.png)

After creating our account, we next install the [Heroku Command Line Interface (CLI)](https://devcenter.heroku.com/articles/heroku-cli), which will allow us to create and manage our Heroku applications.

Installation instructions for the Heroku CLI vary slightly between operating systems, so it’s best to follow the official and up-to-date [instructions](https://devcenter.heroku.com/articles/heroku-cli) on Heroku’s website for their setup.

To verify that our installation was successful and to authenticate the CLI with our account which we created a few paragraphs ago, we run the `heroku` command on our terminal once and follow the on-screen instructions.

With this one-time setup step out of the way, we are ready to prepare our application!

![Heroku CLI](/assets/kotlin_on_heroku/0sk91tjmxtmmykcf6zjt.png)

### Creating our Ktor application ✨

Let’s create a quick sample application which we will afterward configure to be deployed. If you already have your own Ktor project which you want to get deployed to Heroku, you can move directly to the next section.

There are multiple easy ways to create a new Kotlin project with Ktor. For example, we can use the online [Ktor Project Generator](https://start.ktor.io/), or the [Ktor IntelliJ IDEA plugin](https://plugins.jetbrains.com/plugin/10823-ktor) – and in fact, both tools even expose the same configuration options. For this example, we are going to configure our project via the [Ktor IntelliJ IDEA plugin](https://plugins.jetbrains.com/plugin/10823-ktor), which can be accessed through File \| New… \| Project after it has been installed.

To follow along with the code snippets, enable the “Gradle Kotlin DSL” option for the project, and add the “Routing” feature.

![Ktor Project Wizard](/assets/kotlin_on_heroku/hp1phtyh9sc1nnxcv6av.png)

On the pages that follow, we input a project name and artifact ID of our choice.

After the Gradle import has finished, we actually already have a ready-to-run “Hello World” project powered by Ktor. We can inspect its source code by navigating to the `Application.kt` file in our `src` directory, where we should see something like this:

```kotlin
fun main(args: Array<String>): Unit = io.ktor.server.netty.EngineMain.main(args)

@Suppress("unused") // Referenced in application.conf
@kotlin.jvm.JvmOverloads
fun Application.module(testing: Boolean = false) {
    routing {
        get("/") {
            call.respondText("HELLO WORLD!", contentType = ContentType.Text.Plain)
        }
    }
}
```

As we can see, this simple Ktor program defines one [route](https://ktor.io/docs/routing.html), `/`, which responds to HTTP `GET` requests with the words `HELLO WORLD!`.

By pressing the and pressing the “Run” button in the gutter next to the main function, and navigating to `http://localhost:8080/`, we can try the application out locally:

![Hello World](/assets/kotlin_on_heroku/kgeanwt5nm3jrr5aln3a.png)

Now, it's time to set get our little application configured for running on Heroku's cloud!

### Configuring our Ktor application for Heroku deployment ⚙️

To deploy our application to Heroku, our application needs to do three things:

*   It should **respect the `PORT` environment variable**: When starting our app, Heroku [assigns our application a port](https://devcenter.heroku.com/articles/runtime-principles#web-servers) on which to listen for incoming requests, and [Heroku’s routers](https://devcenter.heroku.com/articles/http-routing) then take care of bringing the HTTP traffic to our application on that port.
*   It should **provide a `stage` task**: When we deploy our application, Heroku runs the Gradle task called `stage` to turn our program into an executable.
*   It should **provide a `Procfile`**: When Heroku starts our application to handle incoming requests, this file specifies the command(s) which will be run – in our case, starting the compiled application.


#### The PORT environment variable

We're in luck here – the application generated by the Ktor wizard already configures our application to respect the `PORT` environment variable. We can see this in the `application.conf` in the `resources` directory of our project. This [HOCON](https://github.com/lightbend/config/blob/master/HOCON.md) file is responsible for the basic behavior of our application. And, as we can see, it sets the default port of our application to 8080, optionally overriding it with the content of the `PORT` environment variable when it is present:


```hocon
ktor {
   deployment {
       port = 8080
       port = ${?PORT}
   }
   application {
       modules = [ io.sebi.ApplicationKt.module ]
   }
}
```


This is exactly what we want: When developing locally, our application is always assigned the same port (`8080`), and when deploying to a system where a `PORT` environment variable is set, like Heroku, the platform settings are respected.

#### The `stage` Gradle task

When deploying any type of application to Heroku, the platform runs a so-called [buildpack](https://devcenter.heroku.com/articles/buildpacks) – a tool that turns the source code of our project into the executable which eventually gets run on Heroku’s platform. For [Gradle](https://devcenter.heroku.com/articles/deploying-gradle-apps-on-heroku#verify-that-your-build-file-is-set-up-correctly) applications, Heroku’s buildpack looks for a `stage` task to create executable artifacts from our code. Luckily for us, the already preconfigured Gradle [application plugin](https://docs.gradle.org/current/userguide/application_plugin.html) already comes with a task called `installDist` which does exactly that.

All we need to do is create an alias for the `installDist` task called `stage`. If you have picked the Gradle Kotlin DSL as was suggested earlier in the tutorial, you can simply add this snippet at the bottom of the project's `build.gradle.kts` file:


```kotlin
tasks.create("stage") {
   dependsOn("installDist")
}
```

#### The Procfile

Heroku’s [Procfile mechanism](https://devcenter.heroku.com/articles/procfile) tells the platform which application should be executed when our application is started.

Essentially, we want to point this file at the output generated by the `stage` task, which we set up in the previous step. At the point when the Procfile gets invoked, our `stage` task will have built our application and created a launch script in `build/install/projectName/bin/projectName`. We can simply point to this script to get our application running.

In the root of our project, let’s create a file called `Procfile` and add the following content to it (substituting `projectName` for, you guessed it, the name of our project):

```
web: ./build/install/projectName/bin/projectName
```

(If you don't remember the exact name you gave your project, you can peek into `settings.gradle.kts`, or run the `stage` task once, and investigate the folder structure inside `build/install`.)

Our application is now set up for deployment on Heroku! At this point, the only thing standing between us and a published app is the actual deployment process itself.


### Actually deploying our application 📦


#### Setting up a local Git repository

The primary method for getting the source code of our application onto Heroku is via Git. The simplest way for this is to use a local Git repository. Using the Heroku CLI, we can then link it to a special `heroku` remote repository, which will trigger the build and deployment process in the cloud.

To link everything up, we first need to create a local repository for our project, which can do directly from IntelliJ IDEA with the command VCS > Enable Version Control Integration...

![Enable VCS integration](/assets/kotlin_on_heroku/bl3hhxyrvh26z8e4y7ty.png)

Next, we commit our project locally. In IntelliJ IDEA, Navigate to the “Commit” tool window on the left side, and commit all unversioned files. (Don’t worry about manually excluding the `/build` or `/idea` folders – the Ktor project wizard already auto-generated a `.gitignore` file for us which takes care of them.)

![IntelliJ IDEA Commit window](/assets/kotlin_on_heroku/69i3yy8vsd41wygjdpu9.png)

#### Creating the Heroku application & Deploying! 🚀

Almost there! The only thing remaining is to create a [Heroku app](https://devcenter.heroku.com/articles/creating-apps) in which our new application will live. We use the Heroku CLI from the builtin terminal in IntelliJ IDEA (or a terminal of our choice) to set up the application, by executing the following command in the root folder of our project:

```
heroku create myprojectname
```

After a few seconds, the terminal command should exit and confirm the successful creation of our project – including a preview of the URL at which our project will be visible in just a few minutes.

```
Creating ⬢ myprojectname... done
https://myprojectname.herokuapp.com/ | https://git.heroku.com/myprojectname.git
```

In the background, this command did two things which we should care about:

*   It created a new Heroku application, which we can inspect in our [web dashboard](https://dashboard.heroku.com/apps/)
*   It added a new [Git remote](https://git-scm.com/book/en/v2/Git-Basics-Working-with-Remotes) called `heroku` to our local Git repository.

Now, we can kick off our deployment: we push the commit we made in the previous section to the newly added `heroku` Git remote. In IntelliJ IDEA, we can do this via VCS | Git | Push….

![Push window in IntelliJ IDEA](/assets/kotlin_on_heroku/jpmvlo4x42f3e99hw7pw.png)

After confirming the push, we can sit back and watch our application ascend to the cloud!

This push is going to take longer than you might be used to, because Heroku actually builds our application remotely while pushing. If you’re interested in following along with the progress, you can open the “Git” tool window at the bottom of IntelliJ IDEA to see what is happening in the background.

If everything has gone according to plan, you will see a confirming message in the logs:


```
remote:        BUILD SUCCESSFUL in 1m 34s
remote:        6 actionable tasks: 6 executed
remote: -----> Discovering process types
remote:        Procfile declares types -> web
remote:
remote: -----> Compressing...
remote:        Done: 64.3M
remote: -----> Launching...
remote:        Released v3
remote:        https://myprojectname.herokuapp.com/ deployed to Heroku
remote:
remote: Verifying deploy... done.
```

We can see the URL for our project in this log. When navigating to this link, we see our application in all its glory, running in the cloud. Grab your friends, open the link on your phone, and tell your relatives who live across the country to click the link – you’ve just successfully deployed your Kotlin application to the world wide web!

![Hello, Heroku!](/assets/kotlin_on_heroku/9cmpkp8lveowc9mm9wi1.png)

### What’s next?

Now that we are done with setting up our Ktor application for deployment on Heroku, we have a simple workflow for publishing new changes to the web:

- Make the change
- Commit the change
- Push the change to `heroku master`

...and after just a minute or two, our changes will be published.

If we’re planning to collaborate with others, we might want to share our project on GitHub. In this case, we can simply create an empty repository on GitHub, [add it as a remote](https://docs.github.com/en/free-pro-team@latest/github/using-git/adding-a-remote), and push our changes to it, just as we would normally do.

If we’re feeling particularly fancy, we can use [Heroku’s GitHub integration](https://devcenter.heroku.com/articles/github-integration) to make the deployment of our Kotlin applications happen automatically whenever we push our commits to GitHub. With this, we actually have a convenient way of doing **continuous delivery (CD)**.

And of course, there is a lot more to explore around the Heroku platform and our server-side Kotlin application. Heroku’s [“Add-ons”](https://elements.heroku.com/addons) page allows us to add a ton of different services to your app, which we can use from our code. While many of them are paid add-ons, many popular services also offer a free “developer” tier, so you can experiment to your heart’s content. If you want to explore more fine-grained control about the JVM execution environment available on the platform, you can explore JDK- and JVM related adjustments, such as providing a `system.properties` file to specify a differing Java version to run your app on.


### Thank you for reading!

Thanks for sticking around until the end! I hope you found this tutorial helpful. If you have any questions or ideas about what to cover next, please let me know!