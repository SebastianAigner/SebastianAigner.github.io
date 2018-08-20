---
layout: post
title:  "Kotlin, Ktor and Exposed on Heroku"
date:   2018-08-15T09:16:31+02:00
categories: general
typora-root-url: ../../my-blog
---

When developing web applications, be it at a hackathon, as a side project or as a business venture, **_getting the application into the hands of people_** and onto the web is one of the key steps for **early success**.

Today, I want to show you how you can get your **Kotlin app** powered by **Ktor** and **Exposed** running on the Heroku PaaS in no time, **without having to worry** about updating your JVM, configuring your HTTP server, operating security updates, or doing complex database maintenance tasks. And the best thing: **It's free**.

If you haven't heard of **Ktor** and **Exposed** before, they're a way of building server-side applications in a similar fashion as you would in, say, Python using [Flask](http://flask.pocoo.org/), or Ruby using [Sinatra](http://sinatrarb.com/). Ktor being powered by Kotlin however has the wonderful advantage of **static typing** and **sensible error messages**, and with it, some extremely **powerful IDE integration**.

Coupled with the simplicity and convenience offered by Heroku's platform and database offerings, we get a wonderful **synergy** that allows you to get **stable and fast web applications** into the hands of your users quickly.

So, grab a [free Heroku account](https://signup.heroku.com/), grab your [IntelliJ](https://www.jetbrains.com/idea/) installation and let's dive in!

![final_app_screenshot](/assets/kotlin_on_heroku/final_app_screenshot.png)

![log_tail](/assets/kotlin_on_heroku/log_tail.png)
_<center>The final app chugging along</center>_

#### Mini Disclaimer

This is **not** supposed to be **a tutorial on** how to use **Ktor or Exposed**, but _how to deploy your application to the cloud_. You should be able to follow along this tutorial even if you haven't used Ktor and Exposed before, but you are not going to walk away an expert in the two frameworks. I do hope to whet the appetite for these frameworks though, and prove to you that they're worth having an in-depth look at.

I strongly encourage you to check out the **great documentation** you can find for [Ktor](http://ktor.io/), and familiarise yourself with the [Exposed Readme](https://github.com/JetBrains/Exposed/blob/master/README.md) as well as their [Wiki](https://github.com/JetBrains/Exposed/wiki/DAO).

Also, for conciseness, imports are left out when presenting code snippets in this post. When you follow the instructions, all your problems should go away by pressing `⌥⏎` (Alt-Enter) until everything has been auto-resolved by IntelliJ.

### What will we build?

We will build a **super-simple CRUD app**, the classic _Guestbook_ application that many a PHP developer has built for their first exercise: A simple page with an input form that allows people to submit comments that are then shown in order. This will serve as an example on how to provision an application on the Heroku platform and connect a PostgreSQL database.

### Intro to Heroku

Quick and painless deployment and provisioning have made Heroku my platform of choice when it comes to deploying applications in the cloud. Gone are the days of manually configuring `nginx` or `lighttpd` and manually keeping your linux box up to date (power to those who do, but I find it a bit tedious after having gone through it for a few times.)

Heroku offers a [**free plan**](https://www.heroku.com/free) to get started, which is more than enough to build your app and deploy it to the cloud – all without adding a credit card or giving up some other payment information. It does come with some [limitations](https://devcenter.heroku.com/articles/limits), especially in regards to the [Free Dyno Hours](https://devcenter.heroku.com/articles/free-dyno-hours). Should your application require more resources than allotted on a free account, upgrading to paid instances is still relatively inexpensive (though you'll obviously pay a slight premium for the no-fuss PaaS in comparison to, say, a self-managed virtual server).

A wide variety of [Add-ons](https://elements.heroku.com/addons) is available on the Heroku platform that allow you to **plug-and-play functionality** like OAuth, databases and analytics into your app. Many of these add-ons offer a free tier which is more than enough if you're building an application for a small user base.

### Set up

#### Heroku Command Line Tools

In order to work with Heroku locally, we first install the command line tools. Follow the super quick instructions at the [Heroku CLI page](https://devcenter.heroku.com/articles/heroku-cli#download-and-install) to **install the tools locally**. This slightly differs from operating system to operating system, but should be rather straightforward all in all.

Execute the `heroku` command **at least once** so that you get a chance to enter your credentials.

#### Local PostgreSQL Database

Since we are going to be building an application that uses a PostgreSQL database, we need to run a **development database instance** on our local machine. The easiest way to achieve this on macOS is to download and run [Postgres.app](https://postgresapp.com/).

Alternative ways include using [Docker](https://hub.docker.com/_/postgres/) (if you are familiar with it) or the [Windows installers](https://www.postgresql.org/download/windows/) available on the official PostgreSQL website – though I have not tried these, so you may have to adapt things like the JDBC connection to your platform.

Once we have a database setup locally, we can finally start by setting up our IntelliJ for success.

#### The Project

The easiest way to create a new Ktor project is by using the [Ktor plugin for IntelliJ](https://plugins.jetbrains.com/plugin/10823-ktor). If you haven't yet, download and install it on your machine. Create a new project using the wizard in IntelliJ. Make sure to **check _HTML DSL_** for templating, as we will be using it later.

![new_project](/assets/kotlin_on_heroku/new_project.png)

I have named my application `herokuBook`. When you see this name, you know it's referring to the project name.

When you finish up, check _Use auto-import_ (you can read what it does [here](https://blog.jetbrains.com/idea/2013/04/gradle-improvements-at-121/)). Wait for the Gradle daemon to set up your application, and launch the app by clicking the green arrow.

![run_app](/assets/kotlin_on_heroku/run_app.png)

Give the application a few moments to start up and be hypnotized by the debug information scrolling by in the console window. Open your local address [http://0.0.0.0:8080](http://0.0.0.0:8080), and marvel at the beauty of what you have just created 🤩:

![hello_world](/assets/kotlin_on_heroku/hello_world.png)

Congratulations, we now have a Ktor web application running on our local machine. Now, it's time to **ascend** into the cloud! 🌥

### Running Ktor in the Cloud

Heroku uses `git` as its primary mechanism to deploy applications. This also means that our **local application** should be **inside a git repository**.

We can use the integrated Version Control functionality of IntelliJ to set up our git repository without ever having to leave our IDE! Simply select "VCS" – "**Enable Version Control Integration**":

![enable_vcs](/assets/kotlin_on_heroku/enable_vcs.png)

We can also directly **commit** our current state. We first add our files and then commit using the context menu:

![commit_directory](/assets/kotlin_on_heroku/commit_directory.png)

![finish_commit](/assets/kotlin_on_heroku/finish_commit.png)

If you'd like to learn more about how to use **git integration in IntelliJ**, I suggest checking out the [official documentation](https://www.jetbrains.com/help/idea/set-up-a-git-repository.html)!

Now that our project has a git repo attached to it, we can finally **create our Heroku application**. Open the built-in terminal (either by clicking _Terminal_  in the bottom of the IDE or hitting `⌥F12` on Mac) or navigate to your project folder using a terminal emulator of your choice. We execute

```bash
$ heroku create
```

If you have a name for your project, feel free to execute `heroku create yourName` instead. Keep in mind that **your application will be reachable** at `yourName.herokuapp.com`, though.

If everything went well, you'll see your application on your personal [dashboard](https://dashboard.heroku.com/).

To move your code up into the cloud, all you have to do is _push_ your local repository to _heroku_. You can do this directly from within IntelliJ by hitting `⇧⌘K`, or navigating to "VCS" – "Git" - "Push...". (Alternatively, you can run `git push heroku master` in a terminal):

![initial_push](/assets/kotlin_on_heroku/initial_push.png)

However, due to the nature Heroku handles applications, this push will be **rejected**. We can see what went wrong by opening the **Version Control Tool Window** via the "View" – "Tool Windows" option or by hitting `⌘9`. The error message indicates a missing Gradle `stage` task. If you want to learn more about it, check out the [Heroku DevCenter article](https://devcenter.heroku.com/articles/deploying-gradle-apps-on-heroku#overview) about it.

![unsuccessful_deploy](/assets/kotlin_on_heroku/unsuccessful_deploy.png)

#### Staging Task & Procfile

So, we still need to make small adjustments to our application for it to run in the cloud. The **stage task must exist**, which is why we add the following line to our `build.gradle`:

```groovy
task stage(dependsOn: ['installDist'])
```

Would you commit and push this change, you'd still be faced with an error. This is because Heroku doesn't know **what file to execute as a web process**. To communicate this to the platform, Heroku uses a so-called [Procfile](https://devcenter.heroku.com/articles/procfile), which is pretty simple in our case.

Create a new file named `Procfile` (and also add it to Version Control) in the root of the project and fill it with

```bash
web: ./build/install/herokuBook/bin/herokuBook
```

This path is not chosen randomly; if you execute the `stage` task by opening the Gradle Tool Window and selecting "Other" – "**stage**", you can see that this task generates a **startup script** in this exact location:

![stage_script](/assets/kotlin_on_heroku/stage_script.png)

Now, it is time for another commit and push. Back in the Version Control Console, we can see that our build was **successfully deployed** ✅:

![successful_deploy](/assets/kotlin_on_heroku/successful_deploy.png)

Clicking the link will bring us just about as much joy as that first **magical** `HELLO WORLD` **moment** just five minutes ago:

![hello_cloud](/assets/kotlin_on_heroku/hello_cloud.png)

This concludes the first part of this excursion into Kotlin and Ktor on Heroku. 👌🏼 Next, we will cover usage of the **Exposed framework** in conjunction with **Heroku Postgres**.

### Setting up the Exposed SQL Framework

> *Exposed* is a prototype for a lightweight SQL library written over JDBC driver for [Kotlin](https://github.com/JetBrains/kotlin) language. It does have two layers of database access: typesafe SQL wrapping DSL and lightweight data access objects.

We will use the Data Access Objects (DAO) API in this example, hook it up to our local and later on remote PostgreSQL database. This way, we can easily persist data in a structured manner.

#### Required Dependencies

In order to use Exposed with PostgreSQL, we need to add the **Exposed repository**, **Exposed** **itself** as well as the **PostgreSQL JDBC** **driver**. So, in your `build.gradle`, add

```groovy
repositories {
    ...
	maven {
        url "https://dl.bintray.com/kotlin/exposed"
    }
	...
}

...
    
dependencies {
    ...
    compile 'org.jetbrains.exposed:exposed:0.10.4'
    compile 'org.postgresql:postgresql:42.2.4.jre7'
    ...
}
```

_Make sure you grab the **freshest version** of Exposed:_ ![Download](https://api.bintray.com/packages/kotlin/exposed/exposed/images/download.svg)_, and check for any updates of the JDBC driver [here](https://mvnrepository.com/artifact/org.postgresql/postgresql)._

#### Database Connection

For now, we will keep it simple and run on a **single database connection**. This could potentially become a bottleneck once your application has hundreds of users. If you're interested in tackling this issue, let me refer you to [Connection Pooling](https://github.com/JetBrains/Exposed/issues/135).

To connect to the database, we simply add the following line to the top of our `Application.module()` (substituting our own username):

```kotlin
Database.connect(System.getenv("JDBC_DATABASE_URL"), driver = "org.postgresql.Driver")
```

**Configure local environment variables**

While Heroku will eventually take care of the **JDBC Database URL** in *production*, we still have to set up the **environment variable** for our local *development* machine.

Select the run configuration corresponding to the `main` function (not the one relating to the _stage_ task!) in the top right corner and click `Edit Configuration`. Under `Environment Variables`, add the following.

```
JDBC_DATABASE_URL		jdbc:postgresql:sebastian?user=sebastian
```

This environment variable will be set by Heroku once we deploy to production and attach their database backend.

![environment_variables](/assets/kotlin_on_heroku/environment_variables.png)

#### Defining our Database Model

What follows is some basic code for Exposed using the [DAO](https://github.com/JetBrains/Exposed/wiki/DAO) API. I do not want to go to deep into detail here, but: We create a simple **typesafe data model** for our guestbook entries with two columns.

On the top level of our `application.kt` (or in a separate file, if you prefer), add:

```kotlin
object GuestbookEntries: IntIdTable() {
	val text = varchar("text", 255)
	val creation = date("creation")
}

class GuestbookEntry(id: EntityID<Int>): IntEntity(id) {
	companion object: IntEntityClass<GuestbookEntry>(GuestbookEntries)
	var text by GuestbookEntries.text
	var creation by GuestbookEntries.creation
}
```

If you'd like to **understand more** about how Exposed works, check out [their repository](https://github.com/JetBrains/Exposed/).

#### Automatic Database Setup

When we first run the application, we want to **make sure** that our database **schema already exists**. We can do this by adding a simple transaction to our `Application.module()` function (after the database connection has been established), which creates and fills the table with demo data:

```kotlin
transaction {
	create(GuestbookEntries)
	if(GuestbookEntry.count() == 0) {
		GuestbookEntry.new {
			text = "Thank you for stopping by!"
			creation = DateTime.now()
		}
	}
}
```

When running the application now, it'll be hard to spot a difference with all the debug info flowing by in the console. However, a keen eye can now spot entries such as the one below, indicating that our **connection and transaction were successful**.

```sql
10:34:19.064 [main] DEBUG Exposed - SELECT COUNT(guestbookentries.id) FROM guestbookentries
```

#### Inspecting the Schema

We can check that our database schema has actually been generated correctly by having a look at our local PostgreSQL database. And here's the craziest thing: **We don't even have to leave IntelliJ to do that.**

> Database Tools are an IntelliJ IDEA Ultimate feature. If you're a student, check out [jetbrains.com/student](https://www.jetbrains.com/student/) and grab a free Ultimate license! 👨🏻‍🎓

Let's wire up the local Postgres database. To do this, open the "Database" Tool Window by clicking "View" – "Tool Windows" – "**Database**". Select the context menu option to add a **PostgreSQL database**:

![add_database](/assets/kotlin_on_heroku/add_database.png)

If you haven't used this functionality before, IntelliJ might prompt you to **download missing driver files**, which only takes a single click. Directly plug in the **JDBC connection URL** `jdbc:postgresql:sebastian?user=sebastian` and hit `Test Connection` before closing the window with an `OK` press. Fold open the hierarchy on the right-hand side until you strike gold, and double click!

![database_inspection](/assets/kotlin_on_heroku/database_inspection.png)

As you can see, we have successfully **defined and autogenerated the SQL schema** from a **class definition in Kotlin**. You can from now on use the Data Sources tab to check what your application is doing inside your database 🕵🏻‍♂️

### Making the App Interactive

Before we move our database functionality to the cloud, instead of just rendering a plain `HELLO WORLD` text, let's actually plug in the functionality that allows users to **submit a new guest book entry**. We also want to  **show the existing guest book entries** from the database.

We use **Typesafe HTML Builders** provided by [kotlinx.html](https://github.com/Kotlin/kotlinx.html) to construct our little more complex HTML response. This topic is a bit too large to explain in passing, but the format of the code snippets should be clear enough to read and understand what's going on.

These Typesafe HTML Builders ensure that only properties that are actually valid in their context can be used in our Markup – essentially giving us **all the benefits of a statically typed language for HTML**. Note that it is the typesafety of our HTML templates that **immediately prevent XSS attacks** on our application, as every string is **automatically escaped** instead of being interpreted as HTML.

For more reasoning about why an HTML **DSL in Kotlin** makes sense, check out two minutes of [this talk](https://youtu.be/gPH9XnvpoXE?t=4m6s) by Eugene Petrenko, and read the article on [Type-Safe Builders](https://kotlinlang.org/docs/reference/type-safe-builders.html).

Within `application.kt`, **replace** the existing `routing { ... } ` block with the following:

```kotlin
routing {
	get("/") {
		val entries = transaction { GuestbookEntry.all().toList() }
		call.respondHtml {
			body {
					form("/", FormEncType.multipartFormData, FormMethod.post) {
					acceptCharset = "utf-8"
					p {
						label { +"Add a new entry!" }
						textInput { name = "entry" }
					}
					input {
						type = InputType.submit
					}
				}
				for(i in entries) {
				p {
					+"At ${i.creation}: ${i.text}"
				}
			}
		}
	}
}

	post("/") {
		val multipart = call.receiveMultipart()
		val formItems = multipart.readAllParts().filterIsInstance<PartData.FormItem>()
		val myMap = formItems.map { it.name to it.value }.toMap()
		myMap["entry"]?.let { ent ->
			transaction {
				GuestbookEntries.insert {
					it[text] = ent
					it[creation] = DateTime.now()
				}
			}
		}
		call.respondRedirect("/")
	}
}
```

Take a moment to ponder the code above before moving on. 

Since we encode the form using `multipart`, its handling looks a bit odd when you see it the first time. If you would like to learn more about it, check out the [forms example](http://ktor.io/samples/post.html) on the Ktor homepage.

To make the typesafe HTML DSL more readable for those folks who haven't gotten in touch with it yet, this is the analogous code that the final site renders:

```html
<!DOCTYPE html>
<html>
  <body>
    <form action="/" enctype="multipart/form-data" method="post" accept-charset="utf-8">
      <p><label>Add a new entry!</label><input type="text" name="entry"></p>
<input type="submit"></form>
    <p>At 2018-08-15T00:00:00.000Z: Thank you for stopping by!</p>
    <p>At 2018-08-15T00:00:00.000Z: Welcome to my page!</p>
  </body>
</html>
```
![final_app_screenshot](/assets/kotlin_on_heroku/final_app_screenshot.png)

_Besides the lack of angle brackets, it becomes obvious pretty quickly that one of them was generated by the other._

### Working with Heroku Postgres

Now, let's make our application work with Heroku Postgres.

[Heroku Postgres](https://www.heroku.com/postgres) is an easy way to **attach a database to your application running on Heroku**. The free tier does come with some [limitations](https://elements.heroku.com/addons/heroku-postgresql#pricing), most notably a **maximum of 10'000 rows** within the database. For your average hackathon project or private experiment, ten thousand rows should probably still be enough – unless you're scraping all of [Reddit's cat pictures](https://old.reddit.com/r/CatsInSinks/top/?sort=top&t=all). If you're willing to spend $9/mo, you can up yourself to the _Hobby Basic_ tier and store up to 10 million rows – and I'd argue that's enough feline imagery.

Getting the database to play nice with our application only requires **a few clicks** on the [dashboard](https://dashboard.heroku.com/apps).

#### Provisioning & Connecting to the Database

Select your application in the dashboard, and click on "Configure Add-ons" in the left column. In the bottom search bar, type and select `Heroku Postgres`. Keep the selection at `Hobby Dev – Free` for now and hit the big **_Provision_ button**.

![provision_db](/assets/kotlin_on_heroku/provision_db.png)

**And boom, you're done!** Thanks to us not hardcoding the JDBC connection, but instead using environment variables, our application needs no further setup – and thanks to Exposed, the SQL schema is automatically set up on deployment! 🚀🎉

### Bonus: Using GitHub for Automatic Deployments 🤖

When you are **working in a team**, you usually wouldn't host your repository on your local machine. Instead, you would use a service like **GitHub** where the efforts of the team can flow together.

Awesomely enough, we can use **GitHub in conjunction with Heroku** to automate our deployments even when **multiple people** are working on the project!

If you've followed along so far and would like to make the conversion to **GitHub**, the **integration in IntelliJ** will make this a breeze. Simply select "VCS" – "Import into Version Control" – "**Share Project on GitHub**". Authenticate yourself against the GitHub platform and create the new repository as prompted in the dialogue. If you're not ready to share your repository with the public yet, make sure to tick _Private_ in the settings.

> If you didn't know yet, you can grab **free private repositories** and much more by getting [GitHub Education](https://education.github.com/pack)!

![share_on_github](/assets/kotlin_on_heroku/share_on_github.png)

Now, all that is left is to tell Heroku that upon a **new commit** to the `master` branch, the application should be **redeployed** with the new version. You can do this by navigating to the "Deploy" tab for your application in the dashboard, and switching from _Heroku Git_ to _GitHub_. If you have few GitHub repositories, pressing Enter when searching for a repo name will show you all your repositories.

Click "Connect" for the correct repository. You can now perform a manual deploy, or **enable automatic deploys** whenever a new commit lands on the `master` branch or a branch of your choice.

> **Important!** As the Heroku page suggests: "be sure that this branch is always in a deployable state and any tests have passed before you push."
>
> Now would be a great time to introduce and adhere to a **proper branching model** such as [Git Flow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow) – or a [simplified version](https://medium.com/goodtogoat/simplified-git-flow-5dc37ba76ea8).

### Conclusion

So, these instructions might seem long and daunting – but: the final program is **less than 100 lines of code, though**. Throughout this crash course, we've seen:

- How to setup Ktor and Exposed locally
- How to configure the JDBC connection using environment variables so that they can get used by Heroku
- How we can use type-safe builders to declare HTML while reaping the benefits of static typing
- How IntelliJ provides:
  - Graphical integration with databases
  - Graphical integration with git
  - Simple "Publish to GitHub" functionality
- And of course: How we can use Heroku to deliver value quickly and with high iteration speed to customers and users.

If you don't feel like walking through all the steps above yourself, the **final project** can be found on my GitHub. You can run it on Heroku by cloning it, creating the application as described in the article, and executing a `git push heroku master`.

There are a lot of topics that were just mentioned in passing, and not fully expanded upon. I hope that this article was interesting enough to make you **seek out more information** about this and adjacent topics.

### Nano Cheat Sheet

1. Run `heroku create` on your local git repo containing your Ktor app
2. Add staging task: `task stage(dependsOn: ['installDist'])`
3. Add procfile: `web ./build/install/ktorio/bin/ktorio`
4. Use `System.getenv("JDBC_DATABASE_URL")` in order to connect to Postgres database.

### Questions? Comments? Hit me up!

Whoa, what a long article. There's a good chance you're not leaving here without a **few questions**. While I of course encourage you to **go out and explore**, if you have any questions regarding my article, or would like to just have a chat, please feel free to **shoot me a Tweet** [@TrueSebi](https://twitter.com/TrueSebi) or **contact me via email**. Cheers! 🙌🏼