import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { BUNDLED_RATES, convert, formatAmount, parseAmount, validRates } from '../static/currency/converter.mjs';

test('comma and dot decimals convert from any field', () => {
    assert.equal(parseAmount('1,5'), 1.5);
    assert.equal(parseAmount('.5'), .5);
    assert.equal(parseAmount('  12.75  '), 12.75);
    assert.equal(parseAmount('12 345,67'), 12345.67);
    assert.equal(parseAmount('12\u202f345.67'), 12345.67);
    assert.equal(parseAmount('12\u00a0345.67'), 12345.67);
    assert.equal(parseAmount('1,234'), 1.234);
    assert.equal(parseAmount('1,234.56'), null);
    assert.equal(parseAmount('1.234,56'), null);
    assert.equal(parseAmount('12 34'), null);
    assert.equal(parseAmount('1,2.3'), null);
    assert.equal(parseAmount(''), null);
    assert.equal(convert(177.39, 'JPY', 'EUR', BUNDLED_RATES), 1);
    assert.equal(convert(1, 'EUR', 'USD', BUNDLED_RATES), 1.1195);
    assert.ok(Math.abs(convert(1, 'USD', 'SEK', BUNDLED_RATES) - 11.158 / 1.1195) < 1e-10);
    assert.equal(formatAmount(177.39, 'JPY'), '177');
    assert.equal(formatAmount(12345.67, 'EUR'), '12\u202f345.67');
    assert.equal(formatAmount(.001, 'EUR'), '0.001');
    assert.equal(formatAmount(.001, 'JPY'), '0.001');
    assert.equal(formatAmount(.00000001, 'EUR'), '0.00000001');
});

test('bad data never qualifies as stored or fetched rates', () => {
    assert.equal(validRates(BUNDLED_RATES), true);
    assert.equal(validRates({ ...BUNDLED_RATES, date: '2026-02-30' }), false);
    assert.equal(validRates({ ...BUNDLED_RATES, date: '2099-01-01' }), false);
    assert.equal(validRates({ ...BUNDLED_RATES, rates: { ...BUNDLED_RATES.rates, USD: null } }), false);
    assert.equal(validRates({ ...BUNDLED_RATES, rates: { ...BUNDLED_RATES.rates, SEK: -1 } }), false);
    assert.equal(validRates({ ...BUNDLED_RATES, base: 'USD' }), false);
});

test('the scoped service worker caches the entire shell for offline navigation', async () => {
    const appSource = readFileSync(new URL('../static/currency/app.js', import.meta.url), 'utf8');
    const workerSource = readFileSync(new URL('../static/currency/sw.js', import.meta.url), 'utf8');
    assert.equal(appSource.match(/SHELL_CACHE = '([^']+)'/)[1], workerSource.match(/CACHE_NAME = '([^']+)'/)[1]);
    const listeners = {};
    const entries = new Map();
    let skipWaitingCalls = 0;
    const cache = {
        async addAll(requests) {
            requests.forEach(request => {
                assert.equal(request.cache, 'reload');
                entries.set(request.url, { url: request.url });
            });
        },
        async match(request) { return entries.get(typeof request === 'string' ? request : new URL(request.url).pathname); }
    };
    const caches = {
        async open() { return cache; },
        async match() { throw Error('global cache lookup would mix versions'); },
        async keys() { return ['currency-shell-v8']; },
        async delete() { return true; }
    };
    const self = {
        location: { origin: 'https://sebi.io' },
        addEventListener(type, listener) { listeners[type] = listener; },
        skipWaiting() { skipWaitingCalls++; },
        clients: { claim() {} }
    };
    runInNewContext(workerSource, {
        self, caches, URL, Promise,
        Request: class { constructor(url, options) { this.url = url; this.cache = options.cache; } },
        fetch() { throw Error('Network is offline'); }
    });
    let installation;
    listeners.install({ waitUntil(promise) { installation = promise; } });
    await installation;
    assert.equal(skipWaitingCalls, 0, 'install does not replace a running version');
    for (const path of ['/currency/', '/currency/style.css', '/currency/app.js', '/currency/converter.mjs', '/currency/manifest.webmanifest', '/currency/icon-192.png', '/currency/icon-512.png']) {
        assert.ok(entries.has(path), `${path} is cached`);
    }
    let response;
    listeners.fetch({ request: { url: 'https://sebi.io/currency/', method: 'GET', mode: 'navigate' }, respondWith(promise) { response = promise; } });
    assert.equal((await response).url, '/currency/');
    response = null;
    listeners.fetch({ request: { url: 'https://sebi.io/timer/', method: 'GET', mode: 'navigate' }, respondWith(promise) { response = promise; } });
    assert.equal(response, null, 'other site routes are untouched');
    listeners.message({ data: { type: 'SKIP_WAITING' } });
    assert.equal(skipWaitingCalls, 1, 'only an explicit update message activates the waiting worker');
});

test('focus, blur rounding, and rate refresh keep the last typed amount', async () => {
    const original = Object.fromEntries(['document', 'navigator', 'window', 'localStorage', 'fetch', 'requestAnimationFrame']
        .map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
    const fields = Object.fromEntries(['JPY', 'EUR', 'USD', 'SEK'].map(code => [code, {
        value: '', listeners: {},
        addEventListener(type, listener) { this.listeners[type] = listener; },
        setAttribute() {}, select() {},
        focus() { document.activeElement = this; this.listeners.focus?.(); }
    }]));
    const buttons = Object.fromEntries(['clear-button', 'check-update-button', 'apply-update-button'].map(id => [id, {
        addEventListener(type, listener) { this[type] = listener; }
    }]));
    const clear = buttons['clear-button'];
    const status = { textContent: '' };
    const body = {};
    const document = {
        body, activeElement: body, hidden: false,
        querySelector(selector) { return fields[selector.match(/"([A-Z]+)"/)[1]]; },
        getElementById(id) { return id === 'rate-status' ? status : buttons[id]; },
        addEventListener() {}
    };
    let completeFetch;
    const fetched = new Promise(resolve => { completeFetch = resolve; });
    const stored = { base: 'EUR', date: '2026-10-14', rates: { JPY: 100, USD: 2, SEK: 10 } };
    const replacements = {
        document,
        navigator: { onLine: true },
        window: { addEventListener() {} },
        localStorage: { getItem() { return JSON.stringify(stored); }, setItem() { throw Error('Storage blocked'); } },
        fetch: () => fetched,
        requestAnimationFrame: callback => callback()
    };
    try {
        for (const [name, value] of Object.entries(replacements)) {
            Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
        }
        await import(`../static/currency/app.js?focus-refresh=${Date.now()}`);
        fields.JPY.value = '100.49';
        fields.JPY.listeners.input();
        assert.equal(fields.USD.value, '2.01');
        fields.JPY.listeners.blur();
        assert.equal(fields.JPY.value, '100');
        fields.USD.focus();
        completeFetch({ ok: true, async json() {
            return { base: 'EUR', date: '2026-10-15', rates: { JPY: 200, USD: 3, SEK: 20 } };
        } });
        await new Promise(resolve => setImmediate(resolve));
        assert.deepEqual(Object.fromEntries(Object.entries(fields).map(([code, field]) => [code, field.value])), {
            JPY: '100', EUR: '0.5', USD: '1.51', SEK: '10.05'
        });
        assert.match(status.textContent, /Updates not saved/);
        fields.JPY.focus();
        assert.equal(fields.JPY.value, '100.49', 'original input precision returns for editing');
        clear.click();
        assert.ok(Object.values(fields).every(field => field.value === ''), 'Clear empties all amounts');
        assert.equal(document.activeElement, fields.JPY, 'Clear returns focus to yen');
    } finally {
        for (const [name, descriptor] of Object.entries(original)) {
            if (descriptor) Object.defineProperty(globalThis, name, descriptor);
            else delete globalThis[name];
        }
    }
});

test('a failed first service-worker install is reported after registration succeeds', async () => {
    const names = ['document', 'navigator', 'window', 'localStorage', 'requestAnimationFrame'];
    const original = Object.fromEntries(names.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
    const fields = Object.fromEntries(['JPY', 'EUR', 'USD', 'SEK'].map(code => [code, {
        value: '', addEventListener() {}, select() {}, focus() {}, setAttribute() {}
    }]));
    const status = { textContent: '' };
    const buttons = Object.fromEntries(['clear-button', 'check-update-button', 'apply-update-button'].map(id => [id, {
        addEventListener() {}
    }]));
    let stateChange;
    const worker = {
        state: 'installing',
        addEventListener(type, listener) { if (type === 'statechange') stateChange = listener; }
    };
    const replacements = {
        document: {
            body: {}, activeElement: null, hidden: false,
            querySelector(selector) { return fields[selector.match(/"([A-Z]+)"/)[1]]; },
            getElementById(id) { return id === 'rate-status' ? status : buttons[id]; },
            addEventListener() {}
        },
        navigator: {
            onLine: false,
            serviceWorker: {
                controller: null,
                async register() { return { installing: worker, addEventListener() {} }; },
                addEventListener() {},
                ready: new Promise(() => {})
            }
        },
        window: { addEventListener() {} },
        localStorage: { getItem() { return null; } },
        requestAnimationFrame: callback => callback()
    };
    try {
        for (const [name, value] of Object.entries(replacements)) {
            Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
        }
        await import(`../static/currency/app.js?install-failure=${Date.now()}`);
        await Promise.resolve();
        assert.equal(typeof stateChange, 'function');
        worker.state = 'redundant';
        stateChange();
        assert.match(status.textContent, /Offline setup unavailable/);
        assert.doesNotMatch(status.textContent, /Offline ready/);
    } finally {
        for (const [name, descriptor] of Object.entries(original)) {
            if (descriptor) Object.defineProperty(globalThis, name, descriptor);
            else delete globalThis[name];
        }
    }
});

test('failed update leaves inputs intact, ready update waits for click, and reload follows controller change', async () => {
    const names = ['document', 'navigator', 'window', 'localStorage', 'sessionStorage', 'caches', 'requestAnimationFrame'];
    const original = Object.fromEntries(names.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
    const fields = Object.fromEntries(['JPY', 'EUR', 'USD', 'SEK'].map(code => [code, {
        value: '', listeners: {},
        addEventListener(type, listener) { this.listeners[type] = listener; },
        setAttribute() {}, select() {}, focus() {}
    }]));
    const buttons = Object.fromEntries(['clear-button', 'check-update-button', 'apply-update-button'].map(id => [id, {
        hidden: id === 'apply-update-button', disabled: false,
        addEventListener(type, listener) { this[type] = listener; }
    }]));
    const status = { textContent: '' };
    const swListeners = {};
    const sent = [];
    const waiting = { postMessage(message) { sent.push(message); } };
    let failUpdate = true;
    const registration = {
        active: {}, waiting: null, installing: null,
        addEventListener() {},
        async update() {
            if (failUpdate) { failUpdate = false; throw Error('Offline'); }
            this.waiting = waiting;
        }
    };
    const storage = new Map();
    let reloads = 0;
    const replacements = {
        document: {
            body: {}, activeElement: null, hidden: false,
            querySelector(selector) { return fields[selector.match(/"([A-Z]+)"/)[1]]; },
            getElementById(id) { return id === 'rate-status' ? status : buttons[id]; },
            addEventListener() {}
        },
        navigator: {
            onLine: false,
            serviceWorker: {
                controller: {},
                async register() { return registration; },
                addEventListener(type, listener) { swListeners[type] = listener; },
                ready: Promise.resolve(registration)
            }
        },
        window: { caches: {}, location: { reload() { reloads++; } }, addEventListener() {} },
        caches: {
            async keys() { return ['currency-shell-v8']; },
            async open() { return { async match() { return {}; } }; }
        },
        localStorage: { getItem() { return null; } },
        sessionStorage: {
            getItem(key) { return storage.get(key) ?? null; },
            setItem(key, value) { storage.set(key, value); },
            removeItem(key) { storage.delete(key); }
        },
        requestAnimationFrame: callback => callback()
    };
    try {
        for (const [name, value] of Object.entries(replacements)) {
            Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
        }
        await import(`../static/currency/app.js?update-flow=${Date.now()}`);
        await new Promise(resolve => setImmediate(resolve));
        fields.JPY.value = '12 345,67';
        fields.JPY.listeners.input();
        swListeners.controllerchange();
        assert.equal(reloads, 0, 'ordinary controller changes do not reload');
        await buttons['check-update-button'].click();
        assert.match(status.textContent, /Check when online/);
        assert.equal(buttons['check-update-button'].disabled, false);
        navigator.onLine = true;
        await buttons['check-update-button'].click();
        assert.equal(buttons['check-update-button'].disabled, false);
        assert.equal(buttons['apply-update-button'].hidden, true);
        assert.match(status.textContent, /App update unavailable/);
        assert.equal(fields.JPY.value, '12 345,67', 'failed check does not alter input');
        await buttons['check-update-button'].click();
        assert.equal(buttons['apply-update-button'].hidden, false);
        assert.match(status.textContent, /Update ready/);
        assert.equal(reloads, 0);
        buttons['apply-update-button'].click();
        assert.deepEqual(sent, [{ type: 'SKIP_WAITING' }]);
        assert.equal(storage.has('currency-update-input-v1'), false, 'input is saved only when reload is imminent');
        assert.equal(reloads, 0, 'button waits for the new controller');
        swListeners.controllerchange();
        assert.equal(reloads, 1);
        assert.deepEqual(JSON.parse(storage.get('currency-update-input-v1')), { code: 'JPY', text: '12 345,67', amount: 12345.67 });
    } finally {
        for (const [name, descriptor] of Object.entries(original)) {
            if (descriptor) Object.defineProperty(globalThis, name, descriptor);
            else delete globalThis[name];
        }
    }
});
