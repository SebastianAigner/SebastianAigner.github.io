---
layout: post
title:  "Hosting Kotlin/JS on GitHub Pages via GitHub Actions"
date:   2021-02-05T19:33:57+02:00
categories: general
published: true
description: How to get your Kotlin/JS application available on the web, with free Continuous Integration and hosting via GitHub Actions and Pages.
tags: kotlin, javascript, github, webdev
cover_image: /assets/kotlin-js-on-gh-pages/sfpjyr968bufv673zlfg.jpg
---

[GitHub Pages](https://pages.github.com/) is an easy way to **host your Kotlin/JS application** - and in combination with the **continuous integration** service [GitHub Actions](https://github.com/features/actions), you can easily set up a smooth development (and deployment!) experience for your projects. Read on to learn how you can **build and test your application on GitHub's CI**, and get your **Kotlin/JS web apps published for free**.

In this post, we are going to configure GitHub Actions and Pages so that **new code** pushed to our repository or added via pull request **is automatically validated** (by having the project built and our tests run on GitHub's servers), and code pushed to the main branch of our project is automatically made **available to the public** (by generating and publishing production artifacts of our app).

To achieve this, we are going to:

- [Set up a quick Kotlin/JS project](#sample-setup)
- [Share its code on GitHub](#github-integration) (via IntelliJ IDEA's Git integration)
- [Set up GitHub Actions' workflow YAML](#gh-action-setup)
- [Set up GitHub pages to work with the result of our Actions workflow](#gh-pages-setup)

**If you already know the basics, and want to skip straight to the configuration section, [click here](#gh-action-setup) – or [find the sample project directly on GitHub](https://github.com/SebastianAigner/kotlin-js-on-gh-pages)**

## Setting up our sample Kotlin/JS application <a name="sample-setup">

To _deploy_ a project, we must first _have_ a project. For this demo, I will use an **example generated via project wizard** – if you already have a Kotlin/JS application you would like to deploy, feel free to skip ahead and use it instead.

A boilerplate Kotlin/JS project is quickly generated in [IntelliJ IDEA](https://www.jetbrains.com/idea/) by navigating to File \| New \| Project..., selecting "Kotlin" in the sidebar, and choosing a **project template** in the "Kotlin/JS" section (I'm choosing a React project). We just need to make sure that a Project JDK is selected. For everything else, the default settings are fine and don't need to be adjusted:

![new-project-wizard](/assets/kotlin-js-on-gh-pages/1nzk5keyrms4u7bh619e.png)

Now that we have a basic project, let's start by **getting it on GitHub** - creating a repository and pushing our code.

## Putting our code on GitHub <a name="github-integration"></a>

We could, of course, use [GitHub's web interface](https://guides.github.com/activities/hello-world/#repository) to set up our repository, and wire up our local repository manually – but **[IntelliJ IDEA's Version Control Integration](https://www.jetbrains.com/help/idea/version-control-integration.html)** makes it **even smoother** to move our project code into a new GitHub Repository. We simply select "**Share Project on GitHub**" in the "VCS" tab.

![share project on github](/assets/kotlin-js-on-gh-pages/e5y09kdv0ube2dmztwq9.png)

If this is your first time using this feature, IntelliJ IDEA might ask you to **authenticate** using your GitHub account. You then get to specify your repository name, its visibility (private/public), and can provide a short description that will show up on GitHub:

![share proj](/assets/kotlin-js-on-gh-pages/i42fc1w8jug5l95wafiv.png)

Once confirmed, IntelliJ IDEA will create a GitHub project for you, and show you the "Add Files For Initial Commit" window, which we can simply accept by pressing "Add":

![initial commit including gitignore](/assets/kotlin-js-on-gh-pages/29g49u26awwu8ebz8ig3.png)

As you might have noticed, IntelliJ IDEA makes our life a bit easier here by **auto-generating** a default set of `.gitignore` files, making sure that any files which shouldn't be checked into source control (such as build artifacts or local configurations) are **correctly ignored**.

Once the commit is finished, we see a small notification bubble containing a **link to our GitHub repository**:

![success](/assets/kotlin-js-on-gh-pages/st0uwzx0v3qi9s66k4w6.png)


## Setting up GitHub Actions <a name="gh-action-setup"></a>

Time to set up GitHub Actions! Actions will be responsible for **building and testing** our project – turning our Kotlin source files into `.js` and `.html` artifacts, running any unit tests we might have, and copying files into the right location for deployment on GitHub Pages (a branch called `gh-pages` by convention). We configure Actions using so-called [**workflows**](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions), which are YAML configuration files containing instructions on how to transform and build code.

GitHub looks for workflows in the `.github/workflows` directory, so let's create this directory structure at our project's root. Inside, let's create a new file called `build-and-publish-kjs.yml`, and add the following configuration to it:

```yaml
name: Build and Publish
on: [ push, pull_request ]
jobs:
build:
name: Test and Build
runs-on: ubuntu-latest
steps:

# Setup Java 1.8 environment for the next steps
- name: Setup Java
uses: actions/setup-java@v1
with:
java-version: 1.8

# Check out current repository
- name: Fetch Sources
uses: actions/checkout@v2

# Build application
- name: Test and Build
run: ./gradlew build

# If main branch update, deploy to gh-pages
- name: Deploy
if: github.ref == 'refs/heads/master' || github.ref == 'refs/heads/main'
uses: JamesIves/github-pages-deploy-action@3.7.1
with:
GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
BRANCH: gh-pages # The branch the action should deploy to.
FOLDER: build/distributions # The folder the action should deploy.
CLEAN: true # Automatically remove deleted files from the deploy branch
```

### Understanding our Action YAML

We could just use this configuration as is, and move on to the next step – but it's always good to try and understand what's going on in our project. And while the YAML configuration reads quite naturally, I still want to quickly look at this configuration file section by section (Additionally, feel free to consult the [GitHub Actions documentation](https://docs.github.com/en/actions/learn-github-actions) for more information):

- We first give our workflow a `name` – in this case, `Build and Publish`.
- Next, we define the triggers for this workflow – what events **kick off** this process. Because we want to make sure that pushed code always compiles, and that pull requests are also fine, we set the value to `push` and `pull_request`.
- Next, we define a `job`, which **groups** the different steps we want to run in a given environment (in our case, `ubuntu-latest`).
- Now, we define the different `steps` our build needs to go through:
- The Kotlin compiler needs Java to be present, so we use a [predefined GitHub Action](https://github.com/actions/setup-java) to **install Java `1.8`**.
- We use [another predefined Action](https://github.com/actions/checkout) to **check out the code** for our project.
- We run the `./gradlew build` command. `build` is a **standard lifecycle** task for Kotlin/JS projects which installs all dependencies from npm and Gradle, compiles the application, and runs any tests included in the project.
- Lastly, we use [another Action](https://github.com/JamesIves/github-pages-deploy-action) to **deploy our project** to GitHub Pages – but **only if the workflow is running on the `master` or `main` branch** (we don't want development branches to be deployed to the public!). We point this action to the `build/distributions` folder, which is where building a Kotlin/JS project creates the final `.js` and `.html` artifacts.

**TL;DR**: This workflow **builds and tests all commits and pull requests** – if the commit is on the `master` or `main` branch, the changes are prepared for **publishing via Pages**.

### Committing the workflow file

To enable our newly created workflow in the GitHub project, we **commit and push** our new `build-and-publish-kjs.yml`.

If you do this via IntelliJ IDEA's "Commit and Push" functionality, please note that, depending on how your GitHub account is authenticated, you may encounter the following error when pushing a commit containing workflow files to your GitHub repository:

```
error: failed to push some refs to 'https://github.com/SebastianAigner/kotlin-js-on-github-pages.git'
To https://github.com/SebastianAigner/kotlin-js-on-github-pages.git
!	refs/heads/master:refs/heads/master	[remote rejected] (refusing to allow an OAuth App to create or update workflow `.github/workflows/build-and-publish-kjs.yml` without `workflow` scope)
Done
```

This is because of an OAuth issue with GitHub requiring a specific scope to push workflow-modifying commits. You can find more info on it and [vote on it here](https://youtrack.jetbrains.com/issue/IDEA-247361). Instead, you can commit the code via the terminal integrated in IntelliJ IDEA, using `git push origin master`:

![git-push-origin-master](/assets/kotlin-js-on-gh-pages/h3rijixf4qmhfsezqpc4.png)

Once the push has finished, we can watch the progress of our Kotlin/JS application being built and prepared for publishing in the "Actions" tab of our GitHub repository.

![action_running](/assets/kotlin-js-on-gh-pages/ztnb7qdc5qpk4phezuqa.png)

## Setting up GitHub Pages <a name="gh-pages-setup"></a>

After it finished, the workflow we created and triggered in the previous section put our final `.js` and `.html` artifacts on the `gh-pages` branch of our repository, just as we planned:

![gh-pages-branch](/assets/kotlin-js-on-gh-pages/r6lhyhlsxutuk9tux4oh.png) 

It's time to **enable the GitHub Pages feature** of our repository, and point it to this branch. We can do this using the "Settings" tab.

Somewhere close to the bottom, we can find a section labelled "GitHub Pages". We select the `gh-pages` branch and `/ (root)` (default) and hit "Save":

![github-pages-enable](/assets/kotlin-js-on-gh-pages/66pf58m8og9xrbnzg01z.png)

After saving our changes, scrolling back to this section reveals the **URL under which our application is available**. (I have previously set up a custom domain for GitHub pages, so this one is used by default.) If you don't have a [custom configuration](https://docs.github.com/en/github/working-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site), the URL of your application usually takes the shape of `<username>.github.io/<reponame>`. Visiting this URL shows our Kotlin/JS application in all its glory, and for the world to see:

![ready to be published](/assets/kotlin-js-on-gh-pages/xr3ooqc9l4rgrpjia265.png) 

You can use this link to **share your Kotlin/JS application** with friends and colleagues, or post it on your favorite news aggregator and wait for the upvotes to roll in! 😉

(If your project is located in a private repository, you might want to change the GitHub Pages visibility. You can find more info on this in the [GitHub docs](https://docs.github.com/en/github/working-with-github-pages/changing-the-visibility-of-your-github-pages-site).)

## Take your project for a spin!

We're done! From now on, whenever you push code, your project will automatically be built on GitHub's CI servers. If a commit is faulty, you can see so on the web interface – and you will even be reminded via email!

![checks failed](/assets/kotlin-js-on-gh-pages/hvu8r28kptsqq99ys2rd.png)

Pushing to the main branch of the repository means your page (which is reachable at `<username>.github.io/<reponame>`) will **automatically** be updated.

And when somebody makes a pull request, build and test status is also shown **directly in context**:

![pr failed](/assets/kotlin-js-on-gh-pages/u3wl5tcsahepdma6pbbq.png)

## Thank you!

I hope you found this post useful. [GitHub Actions](https://github.com/features/actions) is a **powerful, but also complex tool**, and I hope that these instructions make it a bit easier to get started together with Kotlin/JS. You can find the [sample project I used](https://github.com/SebastianAigner/kotlin-js-on-gh-pages) to create the screenshots for this tutorial on GitHub as well, and use it as a source of inspiration or template for a future project.

If you're interested in similar content, consider **giving me a follow** to stay up to date.

_Special thanks to [Jakub Chrzanowski](https://twitter.com/hszanowski) for sharing some of his CI wisdom with me for this blog post._!