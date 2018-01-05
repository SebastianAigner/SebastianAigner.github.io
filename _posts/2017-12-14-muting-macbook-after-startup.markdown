---
layout: post
title:  "Muting Macbook after Restart"
date:   2017-12-14 16:52:34 +0100
categories: jekyll update
---
### 1. Install sleepwatcher & set up as service
{% highlight bash %}
brew install sleepwatcher
{% endhighlight %}

{% highlight bash %}
brew services start sleepwatcher
{% endhighlight %}

### 2. Configure mute on wake

{% highlight bash %}
echo "osascript -e 'set volume output muted true'" > ~/.wakeup &&
chmod +x ~/.wakeup
{% endhighlight %}

Heavily inspired by [a post on kodiakskorner][kodiakskorner]


[kodiakskorner]: https://www.kodiakskorner.com/log/258
