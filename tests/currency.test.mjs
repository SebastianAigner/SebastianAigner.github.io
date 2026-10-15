import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { BUNDLED_RATES, convert, formatAmount, parseAmount, validRates } from '../static/currency/converter.mjs';

test('comma and dot decimals convert from any field', () => {
    assert.equal(parseAmount('1,5'), 1.5);
    assert.equal(parseAmount('.5'), .5);
    assert.equal(parseAmount('  12.75  '), 12.75);
    assert.equal(parseAmount('1,2.3'), null);
    assert.equal(parseAmount(''), null);
    assert.equal(convert(177.39, 'JPY', 'EUR', BUNDLED_RATES), 1);
    assert.equal(convert(1, 'EUR', 'USD', BUNDLED_RATES), 1.1195);
    assert.ok(Math.abs(convert(1, 'USD', 'SEK', BUNDLED_RATES) - 11.158 / 1.1195) < 1e-10);
    assert.equal(formatAmount(177.39, 'JPY'), '177.39');
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
    const listeners = {};
    const entries = new Map();
    const cache = {
        async addAll(urls) { urls.forEach(url => entries.set(url, { url })); },
        async match(request) { return entries.get(typeof request === 'string' ? request : new URL(request.url).pathname); }
    };
    const caches = {
        async open() { return cache; },
        async match(request) { return cache.match(request); },
        async keys() { return ['currency-shell-v2']; },
        async delete() { return true; }
    };
    const self = {
        location: { origin: 'https://sebi.io' },
        addEventListener(type, listener) { listeners[type] = listener; },
        skipWaiting() {},
        clients: { claim() {} }
    };
    runInNewContext(readFileSync(new URL('../static/currency/sw.js', import.meta.url), 'utf8'), {
        self, caches, URL, Promise,
        fetch() { throw Error('Network is offline'); }
    });
    let installation;
    listeners.install({ waitUntil(promise) { installation = promise; } });
    await installation;
    for (const path of ['/currency/', '/currency/style.css', '/currency/app.js', '/currency/converter.mjs', '/currency/manifest.webmanifest', '/currency/icon-192.png', '/currency/icon-512.png']) {
        assert.ok(entries.has(path), `${path} is cached`);
    }
    let response;
    listeners.fetch({ request: { url: 'https://sebi.io/currency/', method: 'GET', mode: 'navigate' }, respondWith(promise) { response = promise; } });
    assert.equal((await response).url, '/currency/');
    response = null;
    listeners.fetch({ request: { url: 'https://sebi.io/timer/', method: 'GET', mode: 'navigate' }, respondWith(promise) { response = promise; } });
    assert.equal(response, null, 'other site routes are untouched');
});

test('focusing another field does not change the amount used after a rate refresh', async () => {
    const original = Object.fromEntries(['document', 'navigator', 'window', 'localStorage', 'fetch', 'requestAnimationFrame']
        .map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
    const fields = Object.fromEntries(['JPY', 'EUR', 'USD', 'SEK'].map(code => [code, {
        value: '', listeners: {},
        addEventListener(type, listener) { this.listeners[type] = listener; },
        focus() { document.activeElement = this; this.listeners.focus?.(); }
    }]));
    const body = {};
    const document = {
        body, activeElement: body, hidden: false,
        querySelector(selector) { return fields[selector.match(/"([A-Z]+)"/)[1]]; },
        getElementById() { return { textContent: '' }; },
        addEventListener() {}
    };
    let completeFetch;
    const fetched = new Promise(resolve => { completeFetch = resolve; });
    const stored = { base: 'EUR', date: '2026-10-14', rates: { JPY: 100, USD: 2, SEK: 10 } };
    const replacements = {
        document,
        navigator: { onLine: true },
        window: { addEventListener() {} },
        localStorage: { getItem() { return JSON.stringify(stored); }, setItem() {} },
        fetch: () => fetched,
        requestAnimationFrame: callback => callback()
    };
    try {
        for (const [name, value] of Object.entries(replacements)) {
            Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
        }
        await import(`../static/currency/app.js?focus-refresh=${Date.now()}`);
        fields.JPY.value = '100';
        fields.JPY.listeners.input();
        assert.equal(fields.USD.value, '2');
        fields.USD.focus();
        completeFetch({ ok: true, async json() {
            return { base: 'EUR', date: '2026-10-15', rates: { JPY: 200, USD: 3, SEK: 20 } };
        } });
        await new Promise(resolve => setImmediate(resolve));
        assert.deepEqual(Object.fromEntries(Object.entries(fields).map(([code, field]) => [code, field.value])), {
            JPY: '100', EUR: '0.5', USD: '1.5', SEK: '10'
        });
    } finally {
        for (const [name, descriptor] of Object.entries(original)) {
            if (descriptor) Object.defineProperty(globalThis, name, descriptor);
            else delete globalThis[name];
        }
    }
});
