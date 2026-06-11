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
        window.open('dj.html', name, 'width=420,height=420');
    }
}

window.alienpls3State = {
    spinning: false,
    spinAlt: false,
    rotateRPS: 1,
    ySpinning: false,
    ySpinAlt: false,
    spinRPS: 1,
    globalRainbow: false
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
