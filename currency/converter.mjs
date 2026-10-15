export const CURRENCIES = ['JPY', 'EUR', 'USD', 'SEK'];

// Frankfurter EUR rates captured on 2026-10-15. Approximate until an online refresh succeeds.
export const BUNDLED_RATES = Object.freeze({
    base: 'EUR',
    date: '2026-10-14',
    rates: Object.freeze({ JPY: 177.39, USD: 1.1195, SEK: 11.158 })
});

export function validRates(data, today = new Date()) {
    if (!data || data.base !== 'EUR' || !data.rates || typeof data.rates !== 'object') return false;
    if (typeof data.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) return false;
    const parsedDate = new Date(`${data.date}T00:00:00Z`);
    if (!Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== data.date) return false;
    if (parsedDate.getTime() > today.getTime() + 86400000) return false;
    return ['JPY', 'USD', 'SEK'].every(code =>
        typeof data.rates[code] === 'number' && Number.isFinite(data.rates[code]) &&
        data.rates[code] > 0 && data.rates[code] < 1000000
    );
}

export function normalizeLatestRates(rows) {
    if (!Array.isArray(rows) || rows.length !== 3) return null;
    const date = rows[0]?.date;
    const rates = {};
    for (const row of rows) {
        if (!row || row.base !== 'EUR' || row.date !== date ||
            !['JPY', 'USD', 'SEK'].includes(row.quote) || row.quote in rates) return null;
        rates[row.quote] = row.rate;
    }
    const normalized = { base: 'EUR', date, rates };
    return validRates(normalized) ? normalized : null;
}

export function parseAmount(value) {
    const trimmed = value.trim().replace(/[\u00a0\u202f]/g, ' ');
    // A single comma is always a decimal mark: 1,234 means 1.234, never 1234.
    // Spaces are accepted as thousands separators only in complete groups of three.
    if (!/^[+-]?(?:\d+|\d{1,3}(?: \d{3})+)?(?:[.,]\d*)?$/.test(trimmed) ||
        !/\d/.test(trimmed)) return null;
    const parsed = Number(trimmed.replace(/ /g, '').replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
}

const GROUP_SPACES = /[ \u00a0\u202f]/g;

function positionWithoutGeneratedSpaces(value, position) {
    return value.slice(0, position).replace(/\u202f/g, '').length;
}

// Remove only separators the app generated before a native edit. In particular,
// Backspace immediately after a separator must delete a digit, not the separator.
export function ungroupForEdit(value, start, end = start) {
    return {
        text: value.replace(/\u202f/g, ''),
        start: positionWithoutGeneratedSpaces(value, start),
        end: positionWithoutGeneratedSpaces(value, end)
    };
}

function positionInGroupedText(value, logicalPosition) {
    if (logicalPosition === 0) return 0;
    let seen = 0;
    for (let i = 0; i < value.length; i++) {
        if (value[i] !== '\u202f') seen++;
        if (seen === logicalPosition) return i + 1;
    }
    return value.length;
}

// Preserve exactly what was typed after the decimal mark, including a trailing
// mark or zeros. Bad pasted grouping stays visible and invalid for correction.
export function groupEditableAmount(value, start = value.length, end = start) {
    const match = /^([+-]?)(\d+|\d{1,3}(?:[ \u00a0\u202f]\d{3})+)?([.,]\d*)?$/.exec(value);
    if (!match) return { text: value, start, end };
    const integer = (match[2] || '').replace(GROUP_SPACES, '');
    const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f');
    const text = match[1] + grouped + (match[3] || '');
    const map = position => positionInGroupedText(text, value.slice(0, position).replace(GROUP_SPACES, '').length);
    return { text, start: map(start), end: map(end) };
}

export function convert(amount, from, to, data) {
    if (!CURRENCIES.includes(from) || !CURRENCIES.includes(to) || !validRates(data)) return null;
    const perEuro = code => code === 'EUR' ? 1 : data.rates[code];
    return amount / perEuro(from) * perEuro(to);
}

export function formatAmount(amount, code) {
    if (!Number.isFinite(amount)) return '';
    const small = amount !== 0 && Math.abs(amount) < (code === 'JPY' ? .5 : .005);
    return new Intl.NumberFormat('en-US', {
        useGrouping: true,
        ...(small ? { maximumSignificantDigits: 2 } : { maximumFractionDigits: code === 'JPY' ? 0 : 2 })
    }).format(amount).replace(/,/g, '\u202f');
}
