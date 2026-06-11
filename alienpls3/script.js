function removeEmote(event) {
    event.target.remove();
    window.alienpls3Recompose();
}

function createEmote(className) {
    const container = document.getElementById('container');
    const img = document.createElement('img');
    img.className = className;
    if (window.alienpls3State.globalRainbow) {
        if (img.classList.contains('rainbow')) img.classList.add('had-rainbow');
        img.classList.add('rainbow');
    }
    img.src = 'https://cdn.frankerfacez.com/emoticon/750593/animated/4';
    img.alt = 'Emote';
    img.addEventListener('click', removeEmote);
    container.appendChild(img);
    window.alienpls3Recompose();
}

function openDJPopup() {
    const name = 'alienpls3-dj';
    const existing = window.open('', name);
    if (existing && !existing.closed && existing.location.href.indexOf('dj.html') !== -1) {
        existing.focus();
    } else {
        window.open('dj.html', name, 'popup,width=420,height=420');
    }
}

window.alienpls3State = {
    spinning: false,
    spinAlt: false,
    rotateRPS: 1,
    ySpinning: false,
    ySpinAlt: false,
    spinRPS: 1,
    globalRainbow: false,
    globalSpinningRainbow: false,
    globalSpinningRainbowRPS: 1,
    emoteSpinningRainbow: false,
    emoteSpinningRainbowAlt: false,
    emoteSpinningRainbowRPS: 1
};

window.alienpls3ApplyGlobalRainbow = function(active) {
    window.alienpls3State.globalRainbow = active;
    document.querySelectorAll('.emote').forEach(function(el) {
        if (active) {
            if (el.classList.contains('rainbow')) {
                el.classList.add('had-rainbow');
            }
            el.classList.add('rainbow');
        } else {
            if (!el.classList.contains('had-rainbow')) {
                el.classList.remove('rainbow');
            }
            el.classList.remove('had-rainbow');
        }
    });
};

window.alienpls3ApplyGlobalSpinningRainbow = function(active) {
    var s = window.alienpls3State;
    s.globalSpinningRainbow = active;

    var container = document.getElementById('container');
    var canvas = document.getElementById('rainbowOverlay');

    if (active) {
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'rainbowOverlay';
            container.appendChild(canvas);
        }
        if (canvas._animId) return;
        startRainbowAnimation(canvas, container);
    } else {
        if (canvas) {
            if (canvas._animId) cancelAnimationFrame(canvas._animId);
            canvas._animId = null;
            canvas.remove();
        }
    }
};

function startRainbowAnimation(canvas, container) {
    var ctx = canvas.getContext('2d');

    var stops = [
        [0,       'rgb(255, 0, 0)'],
        [1 / 6,   'rgb(255, 0, 255)'],
        [2 / 6,   'rgb(0, 0, 255)'],
        [3 / 6,   'rgb(0, 255, 255)'],
        [4 / 6,   'rgb(0, 255, 0)'],
        [5 / 6,   'rgb(255, 255, 0)'],
        [1,       'rgb(255, 0, 0)']
    ];

    var startTime = null;

    function draw(timestamp) {
        if (!startTime) startTime = timestamp;
        var elapsed = (timestamp - startTime) / 1000;
        var rotation = elapsed * window.alienpls3State.globalSpinningRainbowRPS * 2 * Math.PI;

        var w = container.scrollWidth;
        var h = container.scrollHeight;
        var dpr = window.devicePixelRatio || 1;

        if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width = w + 'px';
            canvas.style.height = h + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        var cx = w / 2;
        var cy = h / 2;
        var gradient = ctx.createConicGradient(-Math.PI / 2 + rotation, cx, cy);
        for (var i = 0; i < stops.length; i++) {
            gradient.addColorStop(stops[i][0], stops[i][1]);
        }

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        canvas._animId = requestAnimationFrame(draw);
    }

    canvas._animId = requestAnimationFrame(draw);
}

window.alienpls3ApplyEmoteSpinningRainbow = function(active) {
    window.alienpls3State.emoteSpinningRainbow = active;
    if (active) window.alienpls3State.emoteSpinningRainbowAlt = false;
    window.alienpls3Recompose();
};

window.alienpls3ApplyEmoteSpinningRainbowAlt = function(active) {
    window.alienpls3State.emoteSpinningRainbowAlt = active;
    if (active) window.alienpls3State.emoteSpinningRainbow = false;
    window.alienpls3Recompose();
};

window._emoteRainbowAnimId = null;

function startEmoteRainbowAnimation() {
    if (window._emoteRainbowAnimId) return;

    var container = document.getElementById('container');

    var stops = [
        [0,       'rgb(255, 0, 0)'],
        [1 / 6,   'rgb(255, 0, 255)'],
        [2 / 6,   'rgb(0, 0, 255)'],
        [3 / 6,   'rgb(0, 255, 255)'],
        [4 / 6,   'rgb(0, 255, 0)'],
        [5 / 6,   'rgb(255, 255, 0)'],
        [1,       'rgb(255, 0, 0)']
    ];

    var startTime = null;

    function draw(timestamp) {
        if (!startTime) startTime = timestamp;
        var s = window.alienpls3State;
        var elapsed = (timestamp - startTime) / 1000;
        var baseRotation = elapsed * s.emoteSpinningRainbowRPS * 2 * Math.PI;

        var cRect = container.getBoundingClientRect();
        var dpr = window.devicePixelRatio || 1;
        var emotes = document.querySelectorAll('.emote');

        emotes.forEach(function(el, i) {
            var canvas = el._spinningRainbowCanvas;
            if (!canvas) {
                canvas = document.createElement('canvas');
                canvas.className = 'emote-rainbow-overlay';
                container.appendChild(canvas);
                el._spinningRainbowCanvas = canvas;
            }

            var r = el.getBoundingClientRect();
            var left = r.left - cRect.left;
            var top = r.top - cRect.top;
            var w = r.width;
            var h = r.height;

            if (canvas._w !== w || canvas._h !== h) {
                canvas._w = w;
                canvas._h = h;
                canvas.width = w * dpr;
                canvas.height = h * dpr;
            }
            canvas.style.left = left + 'px';
            canvas.style.top = top + 'px';
            canvas.style.width = w + 'px';
            canvas.style.height = h + 'px';

            var ctx = canvas.getContext('2d');
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            var dir = (s.emoteSpinningRainbowAlt && i % 2 === 1) ? -1 : 1;
            var rotation = baseRotation * dir;

            var cx = w / 2;
            var cy = h / 2;
            var gradient = ctx.createConicGradient(-Math.PI / 2 + rotation, cx, cy);
            for (var j = 0; j < stops.length; j++) {
                gradient.addColorStop(stops[j][0], stops[j][1]);
            }

            ctx.clearRect(0, 0, w, h);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, w, h);
        });

        // Clean up orphaned canvases
        var allCanvases = container.querySelectorAll('.emote-rainbow-overlay');
        for (var k = 0; k < allCanvases.length; k++) {
            var orphan = true;
            emotes.forEach(function(el) {
                if (el._spinningRainbowCanvas === allCanvases[k]) orphan = false;
            });
            if (orphan) allCanvases[k].remove();
        }

        window._emoteRainbowAnimId = requestAnimationFrame(draw);
    }

    window._emoteRainbowAnimId = requestAnimationFrame(draw);
}

function stopEmoteRainbowAnimation() {
    if (window._emoteRainbowAnimId) {
        cancelAnimationFrame(window._emoteRainbowAnimId);
        window._emoteRainbowAnimId = null;
    }
    var canvases = document.querySelectorAll('.emote-rainbow-overlay');
    for (var i = 0; i < canvases.length; i++) {
        canvases[i].remove();
    }
    var emotes = document.querySelectorAll('.emote');
    for (var j = 0; j < emotes.length; j++) {
        delete emotes[j]._spinningRainbowCanvas;
    }
}

window.alienpls3TriggerWave = function() {
    var emotes = document.querySelectorAll('.emote');
    var sorted = Array.from(emotes).sort(function(a, b) {
        var ra = a.getBoundingClientRect();
        var rb = b.getBoundingClientRect();
        if (Math.abs(ra.top - rb.top) < 10) return ra.left - rb.left;
        return ra.top - rb.top;
    });

    sorted.forEach(function(el, i) {
        el.animate(
            [
                { scale: '1' },
                { scale: '1.5' },
                { scale: '1' }
            ],
            {
                duration: 400,
                delay: i * 100,
                easing: 'ease-in-out'
            }
        );
    });
};

window.alienpls3Recompose = function() {
    var s = window.alienpls3State;
    var emotes = document.querySelectorAll('.emote');

    emotes.forEach(function(el, i) {
        el.classList.remove('spinning', 'y-spinning');

        if (el._motionAnim) { el._motionAnim.cancel(); el._motionAnim = null; }

        var hasSpin = s.spinning || s.spinAlt;
        var hasYSpin = s.ySpinning || s.ySpinAlt;

        if (!hasSpin && !hasYSpin) return;

        var spinDir = (s.spinAlt && i % 2 === 1) ? -1 : 1;
        var ySpinDir = (s.ySpinAlt && i % 2 === 1) ? -1 : 1;

        var fromParts = [];
        var toParts = [];

        if (hasSpin) {
            fromParts.push('rotate(0deg)');
            toParts.push('rotate(' + (360 * spinDir) + 'deg)');
        }

        if (hasYSpin) {
            fromParts.push('rotateY(0deg)');
            toParts.push('rotateY(' + (360 * ySpinDir) + 'deg)');
        }

        el._motionAnim = el.animate(
            [
                { transform: fromParts.join(' ') },
                { transform: toParts.join(' ') }
            ],
            { duration: 1000 / (hasSpin ? s.rotateRPS : s.spinRPS), iterations: Infinity }
        );
    });

    var hasEmoteRainbow = s.emoteSpinningRainbow || s.emoteSpinningRainbowAlt;
    if (hasEmoteRainbow && !window._emoteRainbowAnimId) {
        startEmoteRainbowAnimation();
    } else if (!hasEmoteRainbow && window._emoteRainbowAnimId) {
        stopEmoteRainbowAnimation();
    }
};

document.addEventListener('DOMContentLoaded', function() {
    const initialEmote = document.querySelector('.emote');
    if (initialEmote) {
        initialEmote.addEventListener('click', removeEmote);
    }

    document.getElementById('addButton').addEventListener('click', function() {
        const isGolden = Math.random() < 0.01;
        createEmote(isGolden ? 'emote golden' : 'emote');
    });

    document.getElementById('addRainbowButton').addEventListener('click', function() {
        createEmote('emote rainbow');
    });

    document.getElementById('addGoldenButton').addEventListener('click', function() {
        createEmote('emote golden');
    });

    document.getElementById('djButton').addEventListener('click', openDJPopup);
});
