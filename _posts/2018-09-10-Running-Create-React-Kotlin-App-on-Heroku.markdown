---
layout: post
title:  "Running Create-React-Kotlin-App on Heroku"
date:   2018-09-10T19:33:57+02:00
categories: general
typora-copy-images-to: ../assets/crka-heroku
typora-root-url: ../../my-blog
---

_(This post is a tutorialized version of the workarounds that I worked out together with Andrey Skladchikov in [this YouTrack issue](https://youtrack.jetbrains.com/issue/CRKA-88) for CRKA.)_

As the name might suggest, `create-react-kotlin-app` is the Kotlin equivalent of JavaScript's `create-react-app`: A wonderful little tool to automate all the webpack and configuration stuff for your React/Kotlin applictation, having you focus completely on the actual application logic.

**Getting create-react-kotlin-app to run on Heroku**, however, is not without its pitfalls. After having struggled through it myself, I'll run you through how you can deploy your CRKA application on Heroku, proper production builds and all.

### Prerequisites

I assume that you already have a `create-react-kotlin-app` set up and are just wondering how to deploy it right now. If that's not the case, check the official [README](https://github.com/JetBrains/create-react-kotlin-app/blob/master/README.md#quick-overview) on how to set up your app, and check the excellent [Heroku DevCenter](https://devcenter.heroku.com/articles/creating-apps) for instructions how to initialize your application.

### The Issue

Without the right configuration, you are met with a variety of error messages when executing `git push heroku master`. For example:

#### ENOENT Issues with IML files

```
remote:        > react-scripts-kotlin gen-idea-libs
remote:        
remote:        fs.js:646
remote:        return binding.open(pathModule._makeLong(path), stringToFlags(flags), mode);
remote:        ^
remote:        
remote:        Error: ENOENT: no such file or directory, open '/tmp/build_9563fc6e00a90c3546f23ef114418ef3/build_9563fc6e00a90c3546f23ef114418ef3.iml'
remote:        at Object.fs.openSync (fs.js:646:18)
remote:        at Object.fs.readFileSync (fs.js:551:33)
```

(this is referenced in [CRKA-89](https://youtrack.jetbrains.com/issue/CRKA-89))

### Proper Set-Up

Let's first resolve the `ENOENT` issues by opening our `package.json` and removing the line that says `"postinstall": "npm run gen-idea-libs"`, leaving you with a config looking similar to this:

```json
{
  "name": "blogexample",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "core-js": "^2.5.7",
    "react": "^16.5.0",
    "react-dom": "^16.5.0"
  },
  "devDependencies": {
    "react-scripts-kotlin": "2.1.12"
  },
  "scripts": {
    "start": "react-scripts-kotlin start",
    "build": "react-scripts-kotlin build",
    "eject": "react-scripts-kotlin eject",
    "gen-idea-libs": "react-scripts-kotlin gen-idea-libs",
    "get-types": "react-scripts-kotlin get-types --dest=src/types"
  }
}
```

**Don't forget to remove the trailing comma on the line above the one you deleted, otherwise you will be left with invalid JSON!**

After a `git add .` and respectively a `git commit`, the build actually succeeds. But when accessing the site, you are greeted with a compile error!

```
Failed to compile.
multi ./node_modules/react-dev-utils/webpackHotDevClient.js ./node_modules/react-scripts-kotlin/config/polyfills.js kotlinApp
Module not found: Can't resolve 'kotlinApp' in '/app'
```

![compile_error-6602472](/assets/crka-heroku/compile_error-6602472.png)

_<center>Things you don't want to see</center>_

Despite the cryptic error message, this is actually because there is **no JDK installed on Heroku** by default! (See also [this related issue](https://github.com/mars/create-react-app-buildpack/issues/85)).

This is solved by performing

```bash
heroku buildpacks:add -i 1 https://github.com/heroku/heroku-buildpack-jvm-common.git
```

**Attention! It might be tempting to just quit the tutorial here as the app is technically running, BUT** as the output of `heroku logs --tail` will tell you:

```
Compiled successfully!

You can now view blogexample in the browser.
Local:            http://localhost:18186/
On Your Network:  http://172.18.XX.XX:18186/

Note that the development build is not optimized.
To create a production build, use npm run build.
```

### Automatic Production Builds

Thankfully, replacing this development server with an actual production server is rather simple on Heroku when using the [create-react-app-buildpack](https://elements.heroku.com/buildpacks/mars/create-react-app-buildpack)! To use it as a drop-in-replacement for the default `nodejs` buildpack shipped by Heroku, run:

```bash
heroku buildpacks:add https://github.com/mars/create-react-app-buildpack.git
heroku buildpacks:remove heroku/nodejs
```

Perform a new commit and push, and you will immediatly notice that the build takes a lot longer. This is because an actual production build is now created once, speeding up all subsequent pageloads immensely (yes, even on the dynos that go to sleep, like in Heroku's free tier!).

**Congratulations, you now have a properly configured Create-React-Kotlin-App deployment on Heroku!** It will behave exactly as you would like from a Heroku application, rebuilding whenever you push a new commit, and always keeping the production build optimized.

### What to do when further issues arise

I am deeply grateful to the people in the [official YouTrack issue tracker](https://youtrack.jetbrains.com/issues/CRKA) answering questions with such dedication. If you run into problems, use the YouTrack search bar and try to see if there is an issue that already solves your problem.

**If you're excited about these technologies, why not also drop me a line or a tweet?** I'd love to hear how you are using CRKA to build cool applications!



As a footnote, here's a somewhat relevant excerpt of the (now succeeding) build log in all its glory:

```
remote: =====> Downloading Buildpack: https://github.com/mars/create-react-app-inner-buildpack.git
remote: =====> Detected Framework: React.js (create-react-app)
remote:        Writing `static.json` to support create-react-app
remote:        Enabling runtime environment variables
remote: 
remote: > blogexample@0.1.0 build /tmp/build_c677b5a5cd4e5915e884848517a4231e
remote: > react-scripts-kotlin build
remote: 
remote: Creating an optimized production build...
remote: Compiled successfully.
remote: 
remote: File sizes after gzip:
remote: 
remote:   78.53 KB  build/static/js/main.bf1ecf02.js
remote:   441 B     build/static/css/main.25153e8e.css
remote: 
remote: The project was built assuming it is hosted at the server root.
remote: You can control this with the homepage field in your package.json.
remote: For example, add this to build it for GitHub Pages:
remote: 
remote:   "homepage" : "http://myname.github.io/myapp",
remote: 
remote: The build folder is ready to be deployed.
remote: You may serve it with a static server:
remote: 
remote:   npm install -g serve
remote:   serve -s build
remote: 
remote: Find out more about deployment here:
remote: 
remote:   http://bit.ly/2vY88Kr
remote: 
remote: =====> Downloading Buildpack: https://github.com/heroku/heroku-buildpack-static.git
remote: =====> Detected Framework: Static HTML
remote:   % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
remote:                                  Dload  Upload   Total   Spent    Left  Speed
remote: 100  838k  100  838k    0     0  6112k      0 --:--:-- --:--:-- --:--:-- 6121k
remote: -----> Installed directory to /app/bin
remote: Using release configuration from last framework (Static HTML).
remote: -----> Discovering process types
remote:        Procfile declares types     -> (none)
remote:        Default types for buildpack -> web
remote: 
remote: -----> Compressing...
remote:        Done: 124.4M
remote: -----> Launching...
remote:        Released v5

```

