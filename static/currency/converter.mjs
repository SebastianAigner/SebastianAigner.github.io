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

export function parseAmount(value) {
    const trimmed = value.trim();
    if (!/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(trimmed)) return null;
    const parsed = Number(trimmed.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
}

export function convert(amount, from, to, data) {
    if (!CURRENCIES.includes(from) || !CURRENCIES.includes(to) || !validRates(data)) return null;
    const perEuro = code => code === 'EUR' ? 1 : data.rates[code];
    return amount / perEuro(from) * perEuro(to);
}

export function formatAmount(amount, code) {
    if (!Number.isFinite(amount)) return '';
    return new Intl.NumberFormat('en-US', {
        useGrouping: false,
        maximumFractionDigits: code === 'JPY' ? 2 : 4
    }).format(amount);
}
