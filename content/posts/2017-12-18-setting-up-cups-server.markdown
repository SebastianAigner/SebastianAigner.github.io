---
categories: jekyll update
date: "2017-12-18T00:00:00Z"
title: Setting up a CUPS / AirPrint Server on Raspberry Pi
---

Even though I've switched almost my whole office experience to paperless, my parents are still very much heavy users of the printer. However, with the recent diversification of even their technology, and the growing need to print from a Windows machine, a Macbook and an iPad, I knew it was necessary to find a unified way to print from all those devices. The answer proved to be a _CUPS (formerly Common UNIX Printing System)_ server on a Raspberry Pi that I had lying around.

### Prerequisites
I set up my Raspberry Pi with the latest version of Raspbian. I made sure the packages `vim` and `git` are installed on the device (if they are not, you can simply install them via your old friend `apt-get`).

### Installation
First, we check whether our printer is actually being recognized by the system (the main prerequisite for the rest of the tutorial to work)

{{< highlight bash >}}
lsusb
{{< / highlight >}}

Now that we've verified this, we can run
{{< highlight bash >}}
sudo apt-get install cups
{{< / highlight >}}
and install the CUPS server and its dependencies. This can take a while.

Next, we modify the user account to properly function with the CUPS authentication:
{{< highlight bash >}}
sudo usermod -aG lpadmin pi
{{< / highlight >}}

This concludes the installation. Now all we need to do is to configure the web frontend to be accessible.

### Configuration
Now, it's time to set up the cofiguration of your CUPS service to be available outside of localhost. So, fire up your favorite text editor (in my case `vim`, but feel free to go full `emacs` or `nano` if you prefer), and open `/etc/cups/cupsd.conf`.

Find the line that says

```
Listen localhost:631
```

and replace it with

```
Port 631
```

At the first block, set

```
WebInterface Yes
ServerAlias *
```

afterwards, set all the `Allow @local` annotations for the locations block, like so:

```
< Location / >
	# Restrict access to the server...
	Order allow,deny
	Allow @local
	< /Location >
	
	< Location /admin >
	# Restrict access to the admin pages...
	Order allow,deny
	Allow @local
	< /Location >
	
	< Location /admin/conf >
	AuthType Default
	Require user @SYSTEM
	
	# Restrict access to the configuration files...
	Order allow,deny
	Allow @local
	< /Location >
```

If you've followed the steps above, you're pretty much done with your installation; restart the CUPS server by invoking `sudo /etc/init.d/cups restart`.

You can now add the printer via the webinterface; the login will be the same as it is for your Raspbian installation.

### But what about AirPrint?

To setup AirPrint, we need to install another package called `avahi-discover`:

{{< highlight bash >}}
sudo apt-get install avahi-discover
{{< / highlight >}}

And we are done... kind of.

### Troubleshooting RGB Printer Issues

In my case, when printing some documents, the printer would just not run. A short investigation in the web interface would reveal the issue:

```
"(urftopdf) die(Invalid ColorSpace, only RGB 24BIT type 1 is supported) [Success]"
```
Nothing like a `[Success]` error message, am I right? I dug deep into some ancient forums and figured out that the `urftopdf` that comes bundled with CUPS apparently is not the most current version, and that it lacks the support for the color space I was requiring. So, I decided to _compile my own urftopdf_! What might sound daunting at first is actually quite straightforward and can be done with the few commands below:

First, we grab ourselves a version of urftopdf which actually supports the colorspace we need:
{{< highlight bash >}}
git clone https://github.com/superna9999/urftopdf
{{< / highlight >}}
Then, we install a few dependencies without which the compilation is destined to fail:

{{< highlight bash >}}
sudo apt-get install libhpdf-dev libcups2-dev libcupsimage2-dev g++ cups-client
{{< / highlight >}}

Now, we `cd` into the `urftopdf` folder and execute the `make` command. Now, all that is left is to back up our old `urftopdf` installation and replace it with the new one, which is merely two lines to enter:

{{< highlight bash >}}
sudo mv /usr/lib/cups/filter/urftopdf /usr/lib/cups/filter/urftopdf.old
sudo cp urftopdf /usr/lib/cups/filter
{{< / highlight >}}

This should take effect immediately - if it doesn't, restart CUPS using the command mentioned above, and everything should be great.

Installing the printers under Windows and Mac should be a breeze, iOS devices should autodiscover the devices.

### Advantages and Drawbacks
After having deployed this solution for a while, I've noticed a few drawbacks, but also advantages. Printing from a Windows machine _flies_, it is the same speed as if you would just have the printer attached to the machine directly. From Apple based devices, the CUPS server has to do some recomputations, which take a long time. When printing a page that is only 5 pages long and does not have too many complex SVG shapes, this is fine - so if your main use case is just printing out an email or an excerpt from Wikipedia. However, when printing very complex documents (e.g. a mindmap you drew on your iPad) that has a lot of small individual shapes, or a document that is very long (if you're on a tree killing spree and print out your ebooks), you'll have an unfeasibly long wait time.
