import { BUNDLED_RATES, CURRENCIES, convert, formatAmount, normalizeLatestRates, parseAmount, validRates } from './converter.mjs';

const RATE_URL = 'https://api.frankfurter.dev/v2/providers/ecb/rates?base=EUR&quotes=JPY,USD,SEK';
const STORAGE_KEY = 'currency-rates-v1';
const RESTORE_KEY = 'currency-update-input-v1';
const SHELL_CACHE = 'currency-shell-v9';
const fields = Object.fromEntries(CURRENCIES.map(code => [code, document.querySelector(`[data-currency="${code}"]`)]));
const status = document.getElementById('rate-status');
const clearButton = document.getElementById('clear-button');
const applyUpdateButton = document.getElementById('apply-update-button');
const appUpdateMessage = document.getElementById('app-update-message');
let ratesNotSaved = false;

function readStoredRates() {
    try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return validRates(stored) && stored.date >= BUNDLED_RATES.date ? stored : null;
    } catch {
        ratesNotSaved = true;
        return null;
    }
}

let rates = readStoredRates() || BUNDLED_RATES;
let isBundled = rates === BUNDLED_RATES;
let lastTyped = { code: 'JPY', text: '', amount: null };
let offlineReady = false;
let offlineInstallFailed = false;
let statusNote = navigator.onLine ? '' : 'Offline';
let invalidAmount = false;
let restoredCode = null;

function setAppUpdateMessage(message) {
    appUpdateMessage.textContent = message;
    appUpdateMessage.hidden = false;
    applyUpdateButton.hidden = true;
}

function showReadyUpdate(retry = false) {
    applyUpdateButton.textContent = retry ? 'Couldn’t apply update — tap to retry' : 'Update available — tap to update';
    applyUpdateButton.disabled = false;
    applyUpdateButton.hidden = false;
    appUpdateMessage.hidden = true;
}

try {
    const saved = JSON.parse(sessionStorage.getItem(RESTORE_KEY));
    sessionStorage.removeItem(RESTORE_KEY);
    if (saved && CURRENCIES.includes(saved.code) && typeof saved.text === 'string' && saved.text.length <= 100) {
        lastTyped = { code: saved.code, text: saved.text, amount: parseAmount(saved.text) };
        invalidAmount = lastTyped.amount === null && saved.text.trim() !== '';
        fields[saved.code].value = saved.text;
        fields[saved.code].setAttribute('aria-invalid', invalidAmount ? 'true' : 'false');
        restoredCode = saved.code;
    }
} catch { /* Session storage may be unavailable. */ }

function showStatus() {
    const parts = [isBundled ? 'Approx. rates' : 'Rates', rates.date];
    if (Date.now() - Date.parse(`${rates.date}T00:00:00Z`) > 7 * 86400000) parts.push('Old rates');
    if (statusNote) parts.push(statusNote);
    if (invalidAmount) parts.push('Check amount');
    if (ratesNotSaved) parts.push('Updates not saved');
    if (offlineReady) parts.push('Offline ready');
    else if (offlineInstallFailed) parts.push('Offline setup unavailable');
    status.textContent = parts.join(' · ');
}

function updateOthers() {
    for (const code of CURRENCIES) {
        if (code === lastTyped.code) continue;
        const amount = lastTyped.amount;
        const converted = amount === null ? '' : formatAmount(convert(amount, lastTyped.code, code, rates), code);
        const focused = document.activeElement === fields[code];
        fields[code].value = focused ? converted.replace(/\u202f/g, '') : converted;
        fields[code].setAttribute('aria-invalid', 'false');
        if (focused) fields[code].select();
    }
}

for (const code of CURRENCIES) {
    const field = fields[code];
    field.addEventListener('focus', () => {
        field.value = code === lastTyped.code ? lastTyped.text : field.value.replace(/\u202f/g, '');
        field.select();
    });
    field.addEventListener('input', () => {
        lastTyped = { code, text: field.value, amount: parseAmount(field.value) };
        invalidAmount = lastTyped.amount === null && field.value.trim() !== '';
        field.setAttribute('aria-invalid', invalidAmount ? 'true' : 'false');
        updateOthers();
        showStatus();
    });
    field.addEventListener('blur', () => {
        if (code === lastTyped.code && lastTyped.amount !== null) field.value = formatAmount(lastTyped.amount, code);
        else if (code !== lastTyped.code && lastTyped.amount !== null) {
            field.value = formatAmount(convert(lastTyped.amount, lastTyped.code, code, rates), code);
        }
    });
}

clearButton.addEventListener('click', () => {
    lastTyped = { code: 'JPY', text: '', amount: null };
    invalidAmount = false;
    for (const field of Object.values(fields)) {
        field.value = '';
        field.setAttribute('aria-invalid', 'false');
    }
    showStatus();
    try { sessionStorage.removeItem(RESTORE_KEY); } catch { /* Storage may be unavailable. */ }
    fields.JPY.focus();
});

if (restoredCode) updateOthers();
showStatus();
if (!navigator.onLine) setAppUpdateMessage('Offline — using saved app');

let refreshing = false;
async function refreshRates() {
    if (refreshing || !navigator.onLine) return;
    refreshing = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
        const response = await fetch(RATE_URL, { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const next = normalizeLatestRates(await response.json());
        if (!next || next.date < rates.date) throw new Error('Invalid or older rates');
        rates = next;
        isBundled = false;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            ratesNotSaved = false;
        } catch { ratesNotSaved = true; }
        updateOthers();
        statusNote = '';
        showStatus();
    } catch {
        statusNote = navigator.onLine ? 'Rate refresh unavailable' : 'Offline';
        showStatus();
    } finally {
        clearTimeout(timeout);
        refreshing = false;
    }
}

refreshRates();
window.addEventListener('online', refreshRates);
window.addEventListener('offline', () => { statusNote = 'Offline'; showStatus(); });
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshRates();
});

if ('serviceWorker' in navigator) {
    const serviceWorker = navigator.serviceWorker;
    let registration = null;
    let watchedWorker = null;
    let reloadAfterUpdate = false;
    let reloadTimeout = null;
    let lastUpdateCheck = 0;
    let updateCheckInFlight = false;
    const UPDATE_CHECK_INTERVAL = 5 * 60 * 1000;

    const checkOfflineReady = async () => {
        if (!serviceWorker.controller) return;
        if (!('caches' in window)) {
            offlineInstallFailed = true;
            showStatus();
            return;
        }
        try {
            // Check this version's complete shell, never a match from an older worker's cache.
            if (!(await caches.keys()).includes(SHELL_CACHE)) return;
            const cache = await caches.open(SHELL_CACHE);
            const shell = ['/currency/', '/currency/style.css', '/currency/app.js',
                '/currency/converter.mjs', '/currency/manifest.webmanifest',
                '/currency/icon-192.png?v=2', '/currency/icon-512.png?v=2'];
            offlineReady = (await Promise.all(shell.map(path => cache.match(path)))).every(Boolean);
            if (offlineReady) offlineInstallFailed = false;
            showStatus();
        } catch {
            offlineInstallFailed = true;
            showStatus();
        }
    };

    const showWaitingUpdate = () => {
        const ready = Boolean(registration?.waiting && serviceWorker.controller);
        if (ready && !reloadAfterUpdate) showReadyUpdate();
        else if (!ready && appUpdateMessage.hidden) {
            setAppUpdateMessage(navigator.onLine ? 'App is current' : 'Offline — using saved app');
        }
    };

    const watchWorker = worker => {
        if (!worker || worker === watchedWorker) return;
        watchedWorker = worker;
        const onStateChange = () => {
            if (worker.state === 'installed') {
                showWaitingUpdate();
                if (!registration?.waiting && !serviceWorker.controller) checkOfflineReady();
                else if (!registration?.waiting && serviceWorker.controller) setAppUpdateMessage('App is current');
            } else if (worker.state === 'redundant') {
                if (!serviceWorker.controller) offlineInstallFailed = true;
                showWaitingUpdate();
                if (!registration?.waiting) setAppUpdateMessage(serviceWorker.controller ?
                    'Couldn’t check for updates' : 'Offline setup unavailable');
                showStatus();
            } else if (worker.state === 'activated') {
                checkOfflineReady();
            }
        };
        worker.addEventListener('statechange', onStateChange);
        onStateChange();
    };

    const checkForAppUpdate = async (force = false) => {
        if (!registration || !serviceWorker.controller || !navigator.onLine ||
            registration.waiting || updateCheckInFlight) return;
        const now = Date.now();
        if (!force && now - lastUpdateCheck < UPDATE_CHECK_INTERVAL) return;
        lastUpdateCheck = now;
        updateCheckInFlight = true;
        setAppUpdateMessage('Checking for updates…');
        let timeout;
        try {
            await Promise.race([
                registration.update(),
                new Promise((_, reject) => { timeout = setTimeout(() => reject(Error('Update timed out')), 12000); })
            ]);
            watchWorker(registration.installing);
            if (registration.waiting) showWaitingUpdate();
            else if (!registration.installing) setAppUpdateMessage('App is current');
        } catch {
            setAppUpdateMessage(navigator.onLine ? 'Couldn’t check for updates' : 'Offline — using saved app');
        } finally {
            clearTimeout(timeout);
            updateCheckInFlight = false;
        }
    };

    window.addEventListener('online', () => checkForAppUpdate(true));
    window.addEventListener('offline', () => {
        if (!registration?.waiting) setAppUpdateMessage('Offline — using saved app');
    });
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) checkForAppUpdate();
    });

    applyUpdateButton.addEventListener('click', () => {
        const waiting = registration?.waiting;
        if (!waiting || !serviceWorker.controller || reloadAfterUpdate) return;
        reloadAfterUpdate = true;
        setAppUpdateMessage('Applying update…');
        try {
            waiting.postMessage({ type: 'SKIP_WAITING' });
        } catch {
            reloadAfterUpdate = false;
            showReadyUpdate(true);
            return;
        }
        reloadTimeout = setTimeout(() => {
            if (!reloadAfterUpdate) return;
            reloadAfterUpdate = false;
            showReadyUpdate(true);
        }, 15000);
    });

    serviceWorker.addEventListener('controllerchange', () => {
        if (reloadAfterUpdate) {
            reloadAfterUpdate = false;
            clearTimeout(reloadTimeout);
            try { sessionStorage.setItem(RESTORE_KEY, JSON.stringify(lastTyped)); } catch { /* Best effort. */ }
            window.location.reload();
            return;
        }
        checkOfflineReady();
        showWaitingUpdate();
        checkForAppUpdate();
    });

    serviceWorker.register('/currency/sw.js', { scope: '/currency/', updateViaCache: 'none' }).then(result => {
        registration = result;
        registration.addEventListener('updatefound', () => watchWorker(registration.installing));
        watchWorker(registration.installing);
        if (!registration.installing && !registration.active && !registration.waiting && !serviceWorker.controller) {
            offlineInstallFailed = true;
        }
        showWaitingUpdate();
        serviceWorker.ready.then(checkOfflineReady).catch(() => {
            if (!serviceWorker.controller) offlineInstallFailed = true;
            if (!serviceWorker.controller) setAppUpdateMessage('Offline setup unavailable');
            showStatus();
        });
        checkOfflineReady();
        checkForAppUpdate();
    }).catch(() => {
        if (!serviceWorker.controller) offlineInstallFailed = true;
        setAppUpdateMessage(serviceWorker.controller ? 'Couldn’t check for updates' : 'Offline setup unavailable');
        showStatus();
    });
} else {
    setAppUpdateMessage('Offline setup unavailable');
}

// iOS may require a direct tap before it opens the keyboard, even when installed.
requestAnimationFrame(() => {
    if (!document.activeElement || document.activeElement === document.body) fields[restoredCode || 'JPY'].focus();
});
