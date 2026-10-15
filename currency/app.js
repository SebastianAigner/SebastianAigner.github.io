import { BUNDLED_RATES, CURRENCIES, convert, formatAmount, parseAmount, validRates } from './converter.mjs';

const RATE_URL = 'https://api.frankfurter.dev/v1/latest?base=EUR&symbols=JPY,USD,SEK';
const STORAGE_KEY = 'currency-rates-v1';
const fields = Object.fromEntries(CURRENCIES.map(code => [code, document.querySelector(`[data-currency="${code}"]`)]));
const status = document.getElementById('rate-status');

function readStoredRates() {
    try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return validRates(stored) && stored.date >= BUNDLED_RATES.date ? stored : null;
    } catch { return null; }
}

let rates = readStoredRates() || BUNDLED_RATES;
let isBundled = rates === BUNDLED_RATES;
let activeCode = 'JPY';

function showStatus(message = '') {
    const type = isBundled ? 'Approximate bundled rates' : 'Rates';
    status.textContent = `${type} · ${rates.date}${message ? ` · ${message}` : ''}`;
}

function updateOthers() {
    const amount = parseAmount(fields[activeCode].value);
    for (const code of CURRENCIES) {
        if (code === activeCode) continue;
        fields[code].value = amount === null ? '' : formatAmount(convert(amount, activeCode, code, rates), code);
    }
}

for (const code of CURRENCIES) {
    const field = fields[code];
    field.addEventListener('input', () => {
        activeCode = code;
        updateOthers();
    });
}

showStatus(navigator.onLine ? 'Checking for updates…' : 'Offline');

let refreshing = false;
async function refreshRates() {
    if (refreshing || !navigator.onLine) return;
    refreshing = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
        const response = await fetch(RATE_URL, { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const candidate = await response.json();
        if (!validRates(candidate) || candidate.date < rates.date) throw new Error('Invalid or older rates');
        const next = { base: 'EUR', date: candidate.date, rates: {
            JPY: candidate.rates.JPY, USD: candidate.rates.USD, SEK: candidate.rates.SEK
        } };
        rates = next;
        isBundled = false;
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* Private mode: current session still works. */ }
        updateOthers();
        showStatus();
    } catch {
        showStatus('Update unavailable');
    } finally {
        clearTimeout(timeout);
        refreshing = false;
    }
}

refreshRates();
window.addEventListener('online', refreshRates);
window.addEventListener('offline', () => showStatus('Offline'));
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshRates();
});

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/currency/sw.js', { scope: '/currency/' }).catch(() => {
        showStatus('Offline install unavailable');
    });
}

// iOS may require a direct tap before it opens the keyboard, even when installed.
requestAnimationFrame(() => {
    if (!document.activeElement || document.activeElement === document.body) fields.JPY.focus();
});
