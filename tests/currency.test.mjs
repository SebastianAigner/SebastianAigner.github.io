import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { BUNDLED_RATES, convert, formatAmount, groupEditableAmount, normalizeLatestRates, parseAmount, ungroupForEdit, validRates } from '../static/currency/converter.mjs';

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

test('live grouping keeps caret, typed decimals, and invalid paste intact', () => {
    assert.deepEqual(groupEditableAmount('15000', 5), { text: '15\u202f000', start: 6, end: 6 });
    assert.deepEqual(groupEditableAmount('123456.00', 4, 6), { text: '123\u202f456.00', start: 5, end: 7 });
    assert.deepEqual(groupEditableAmount('-00015,00', 6), { text: '-00\u202f015,00', start: 7, end: 7 });
    assert.deepEqual(groupEditableAmount('1000,', 5), { text: '1\u202f000,', start: 6, end: 6 });
    assert.deepEqual(groupEditableAmount('+.', 2), { text: '+.', start: 2, end: 2 });
    assert.deepEqual(groupEditableAmount('12 34', 5), { text: '12 34', start: 5, end: 5 });
    assert.deepEqual(groupEditableAmount('1,234.56', 8), { text: '1,234.56', start: 8, end: 8 });

    // Mirror the browser's edit sequence: generated spaces disappear before the
    // native edit, then grouping is reapplied after the input event.
    function edit(grouped, start, end, inserted) {
        const raw = ungroupForEdit(grouped, start, end);
        return groupEditableAmount(raw.text.slice(0, raw.start) + inserted + raw.text.slice(raw.end),
            raw.start + inserted.length);
    }
    let value = '';
    for (const digit of '15000') value = edit(value, value.length, value.length, digit).text;
    assert.equal(value, '15\u202f000');
    assert.deepEqual(ungroupForEdit(value, 3), { text: '15000', start: 2, end: 2 });
    const backspace = ungroupForEdit(value, 3);
    assert.equal(groupEditableAmount(backspace.text.slice(0, backspace.start - 1) +
        backspace.text.slice(backspace.start), backspace.start - 1).text, '1\u202f000');
    assert.equal(edit('12\u202f345', 2, 2, '9').text, '129\u202f345', 'mid-string insertion regroups');
    assert.equal(edit('12\u202f345', 2, 5, '6').text, '1\u202f265', 'range replacement regroups');
    assert.equal(edit('', 0, 0, '12 34').text, '12 34', 'malformed pasted spaces remain invalid');
});

test('bad data never qualifies as stored or fetched rates', () => {
    assert.equal(validRates(BUNDLED_RATES), true);
    assert.equal(validRates({ ...BUNDLED_RATES, date: '2026-02-30' }), false);
    assert.equal(validRates({ ...BUNDLED_RATES, date: '2099-01-01' }), false);
    assert.equal(validRates({ ...BUNDLED_RATES, rates: { ...BUNDLED_RATES.rates, USD: null } }), false);
    assert.equal(validRates({ ...BUNDLED_RATES, rates: { ...BUNDLED_RATES.rates, SEK: -1 } }), false);
    assert.equal(validRates({ ...BUNDLED_RATES, base: 'USD' }), false);
});

test('Frankfurter v2 rows must be complete, unique, and from one EUR date', () => {
    const rows = [
        { date: '2026-10-14', base: 'EUR', quote: 'JPY', rate: 177.39 },
        { date: '2026-10-14', base: 'EUR', quote: 'SEK', rate: 11.158 },
        { date: '2026-10-14', base: 'EUR', quote: 'USD', rate: 1.1195 }
    ];
    assert.deepEqual(normalizeLatestRates(rows), {
        base: 'EUR', date: '2026-10-14', rates: { JPY: 177.39, SEK: 11.158, USD: 1.1195 }
    });
    assert.equal(normalizeLatestRates(rows.slice(0, 2)), null);
    assert.equal(normalizeLatestRates([...rows.slice(0, 2), rows[0]]), null);
    assert.equal(normalizeLatestRates(rows.map((row, i) => i === 1 ? { ...row, date: '2026-10-13' } : row)), null);
    assert.equal(normalizeLatestRates(rows.map((row, i) => i === 1 ? { ...row, base: 'USD' } : row)), null);
    assert.equal(normalizeLatestRates(rows.map((row, i) => i === 1 ? { ...row, rate: null } : row)), null);
    assert.equal(normalizeLatestRates([...rows, { date: '2026-10-14', base: 'EUR', quote: 'GBP', rate: .9 }]), null);
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
        async keys() { return ['currency-shell-v10']; },
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
        value: '', selectionStart: 0, selectionEnd: 0, listeners: {},
        addEventListener(type, listener) { this.listeners[type] = listener; },
        setAttribute() {},
        setSelectionRange(start, end) { this.selectionStart = start; this.selectionEnd = end; },
        select() { this.setSelectionRange(0, this.value.length); },
        focus() { document.activeElement = this; this.listeners.focus?.(); }
    }]));
    const buttons = Object.fromEntries(['clear-button', 'apply-update-button'].map(id => [id, {
        addEventListener(type, listener) { this[type] = listener; }
    }]));
    const clear = buttons['clear-button'];
    const status = { textContent: '' };
    const updateMessage = { textContent: '', hidden: false };
    const body = {};
    const document = {
        body, activeElement: body, hidden: false,
        querySelector(selector) { return fields[selector.match(/"([A-Z]+)"/)[1]]; },
        getElementById(id) { return id === 'rate-status' ? status : id === 'app-update-message' ? updateMessage : buttons[id]; },
        addEventListener() {}
    };
    let completeFetch;
    const fetched = new Promise(resolve => { completeFetch = resolve; });
    const windowListeners = {};
    const stored = { base: 'EUR', date: '2026-10-14', rates: { JPY: 100, USD: 2, SEK: 10 } };
    const replacements = {
        document,
        navigator: { onLine: true },
        window: { addEventListener(type, listener) { windowListeners[type] = listener; } },
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
            return [
                { date: '2026-10-15', base: 'EUR', quote: 'JPY', rate: 200 },
                { date: '2026-10-15', base: 'EUR', quote: 'USD', rate: 3 },
                { date: '2026-10-15', base: 'EUR', quote: 'SEK', rate: 20 }
            ];
        } });
        await new Promise(resolve => setImmediate(resolve));
        assert.deepEqual(Object.fromEntries(Object.entries(fields).map(([code, field]) => [code, field.value])), {
            JPY: '100', EUR: '0.5', USD: '1.51', SEK: '10.05'
        });
        assert.match(status.textContent, /Updates not saved/);
        fields.JPY.focus();
        assert.equal(fields.JPY.value, '100.49', 'original input precision returns for editing');
        fields.JPY.value = '15000,00';
        fields.JPY.listeners.input();
        assert.equal(fields.JPY.value, '15\u202f000,00', 'source groups while typing without dropping trailing zeros');
        fields.JPY.listeners.blur();
        fields.JPY.focus();
        assert.equal(fields.JPY.value, '15\u202f000,00', 'focus restores the precise grouped source');
        fields.JPY.value = '1\u202f234';
        fields.JPY.setSelectionRange(5, 5);
        fields.JPY.listeners.compositionstart();
        assert.equal(fields.JPY.value, '1234', 'IME starts on ungrouped text');
        assert.equal(fields.JPY.selectionStart, 4);
        fields.JPY.value += '5';
        fields.JPY.setSelectionRange(5, 5);
        fields.JPY.listeners.input({ isComposing: true });
        fields.JPY.listeners.compositionend();
        assert.equal(fields.JPY.value, '12\u202f345', 'committed composition regroups');
        const undoKey = { key: 'z', metaKey: true, altKey: false, shiftKey: false, preventDefault() {} };
        fields.JPY.listeners.keydown(undoKey);
        assert.equal(fields.JPY.value, '1\u202f234', 'Undo restores the text before composition');
        fields.JPY.listeners.keydown({ ...undoKey, shiftKey: true });
        assert.equal(fields.JPY.value, '12\u202f345', 'Redo restores grouped composition');
        fields.USD.focus();
        fields.USD.listeners.compositionstart();
        fields.USD.value = '2';
        fields.USD.listeners.input({ isComposing: true });
        windowListeners.online();
        await new Promise(resolve => setImmediate(resolve));
        assert.equal(fields.USD.value, '2', 'rate refresh leaves an in-progress IME edit untouched');
        fields.USD.listeners.compositionend();
        assert.equal(fields.JPY.value, '133', 'committed IME edit uses the latest rates');
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
    const updateMessage = { textContent: '', hidden: false };
    const buttons = Object.fromEntries(['clear-button', 'apply-update-button'].map(id => [id, {
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
            getElementById(id) { return id === 'rate-status' ? status : id === 'app-update-message' ? updateMessage : buttons[id]; },
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
        assert.match(updateMessage.textContent, /Offline setup unavailable/);
        assert.doesNotMatch(status.textContent, /Offline ready/);
    } finally {
        for (const [name, descriptor] of Object.entries(original)) {
            if (descriptor) Object.defineProperty(globalThis, name, descriptor);
            else delete globalThis[name];
        }
    }
});

test('automatic checks show one status line, throttle foreground checks, and offer a ready update on reconnect', async () => {
    const names = ['document', 'navigator', 'window', 'localStorage', 'sessionStorage', 'caches', 'fetch', 'requestAnimationFrame'];
    const original = Object.fromEntries(names.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
    const fields = Object.fromEntries(['JPY', 'EUR', 'USD', 'SEK'].map(code => [code, {
        value: '', listeners: {},
        addEventListener(type, listener) { this.listeners[type] = listener; },
        setAttribute() {}, select() {}, focus() {}
    }]));
    const buttons = Object.fromEntries(['clear-button', 'apply-update-button'].map(id => [id, {
        hidden: id === 'apply-update-button', disabled: false,
        addEventListener(type, listener) { this[type] = listener; }
    }]));
    const status = { textContent: '' };
    const updateMessage = { textContent: '', hidden: false };
    const swListeners = {};
    const windowListeners = {};
    const documentListeners = {};
    const sent = [];
    const waiting = { postMessage(message) { sent.push(message); } };
    let updateCalls = 0;
    let finishFirstCheck;
    const firstCheck = new Promise(resolve => { finishFirstCheck = resolve; });
    const registration = {
        active: {}, waiting: null, installing: null,
        addEventListener() {},
        async update() {
            updateCalls++;
            if (updateCalls === 1) return firstCheck;
            if (updateCalls === 2) throw Error('Offline');
            if (updateCalls === 3) this.waiting = waiting;
        }
    };
    const storage = new Map();
    let reloads = 0;
    const replacements = {
        document: {
            body: {}, activeElement: null, hidden: false,
            querySelector(selector) { return fields[selector.match(/"([A-Z]+)"/)[1]]; },
            getElementById(id) { return id === 'rate-status' ? status : id === 'app-update-message' ? updateMessage : buttons[id]; },
            addEventListener(type, listener) { documentListeners[type] = listener; }
        },
        navigator: {
            onLine: true,
            serviceWorker: {
                controller: {},
                async register() { return registration; },
                addEventListener(type, listener) { swListeners[type] = listener; },
                ready: Promise.resolve(registration)
            }
        },
        window: {
            caches: {}, location: { reload() { reloads++; } },
            addEventListener(type, listener) { (windowListeners[type] ??= []).push(listener); }
        },
        caches: {
            async keys() { return ['currency-shell-v10']; },
            async open() { return { async match() { return {}; } }; }
        },
        fetch: async () => { throw Error('Rates offline'); },
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
        assert.equal(updateCalls, 1, 'startup checks automatically');
        assert.equal(updateMessage.textContent, 'Checking for updates…');
        finishFirstCheck();
        await new Promise(resolve => setImmediate(resolve));
        assert.equal(updateMessage.textContent, 'App is current');
        assert.equal(buttons['apply-update-button'].hidden, true);
        fields.JPY.value = '12 345,67';
        fields.JPY.listeners.input();
        swListeners.controllerchange();
        assert.equal(reloads, 0, 'ordinary controller changes do not reload');
        documentListeners.visibilitychange();
        assert.equal(updateCalls, 1, 'foreground checks are throttled');
        navigator.onLine = false;
        windowListeners.offline.forEach(listener => listener());
        assert.equal(updateMessage.textContent, 'Offline — using saved app');
        navigator.onLine = true;
        await Promise.all(windowListeners.online.map(listener => listener()));
        assert.equal(updateCalls, 2, 'reconnect retries despite throttle');
        assert.equal(buttons['apply-update-button'].hidden, true);
        assert.equal(updateMessage.textContent, 'Couldn’t check for updates');
        assert.equal(fields.JPY.value, '12\u202f345,67', 'failed check does not alter grouped input');
        await Promise.all(windowListeners.online.map(listener => listener()));
        assert.equal(updateCalls, 3);
        assert.equal(buttons['apply-update-button'].hidden, false);
        assert.match(buttons['apply-update-button'].textContent, /Update available/);
        assert.equal(updateMessage.hidden, true);
        assert.equal(reloads, 0);
        buttons['apply-update-button'].click();
        assert.deepEqual(sent, [{ type: 'SKIP_WAITING' }]);
        assert.equal(updateMessage.textContent, 'Applying update…');
        assert.equal(storage.has('currency-update-input-v1'), false, 'input is saved only when reload is imminent');
        assert.equal(reloads, 0, 'button waits for the new controller');
        swListeners.controllerchange();
        assert.equal(reloads, 1);
        assert.deepEqual(JSON.parse(storage.get('currency-update-input-v1')), { code: 'JPY', text: '12\u202f345,67', amount: 12345.67 });
    } finally {
        for (const [name, descriptor] of Object.entries(original)) {
            if (descriptor) Object.defineProperty(globalThis, name, descriptor);
            else delete globalThis[name];
        }
    }
});
