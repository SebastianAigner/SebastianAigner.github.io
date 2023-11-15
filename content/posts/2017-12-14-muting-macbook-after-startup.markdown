---
categories: jekyll update
date: "2017-12-14T16:52:34Z"
title: Muting Macbook after Restart
---
### 1. Install sleepwatcher & set up as service
{{< highlight bash >}}
brew install sleepwatcher
{{< / highlight >}}

{{< highlight bash >}}
brew services start sleepwatcher
{{< / highlight >}}

### 2. Configure mute on wake

{{< highlight bash >}}
echo "osascript -e 'set volume output muted true'" > ~/.wakeup &&
chmod +x ~/.wakeup
{{< / highlight >}}

Heavily inspired by [a post on kodiakskorner][kodiakskorner]


[kodiakskorner]: https://www.kodiakskorner.com/log/258
