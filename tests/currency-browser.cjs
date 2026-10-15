// Native WebKit regression for grouping and editing. For example:
// npm install --prefix /tmp/currency-webkit-qa playwright
// npx playwright install webkit
// python3 -m http.server 8765 --directory public
// NODE_PATH=/tmp/currency-webkit-qa/node_modules node tests/currency-browser.cjs http://127.0.0.1:8765/currency/
const assert = require('node:assert/strict');
const { webkit, devices } = require('playwright');

const url = process.argv[2];
if (!url) {
    console.error('Usage: node tests/currency-browser.cjs <local /currency/ URL>');
    process.exit(2);
}

(async () => {
    const browser = await webkit.launch();
    try {
        const page = await browser.newPage({ ...devices['iPhone 13'] });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        const date = new Date().toISOString().slice(0, 10);
        await page.route('**/v2/providers/ecb/rates?*', route => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
                { date, base: 'EUR', quote: 'JPY', rate: 177.39 },
                { date, base: 'EUR', quote: 'USD', rate: 1.1195 },
                { date, base: 'EUR', quote: 'SEK', rate: 11.158 }
            ])
        }));
        await page.goto(url);
        await page.waitForFunction(() => document.querySelector('#rate-status').textContent.startsWith('Rates '));

        const yen = page.locator('#amount-jpy');
        const expectYen = async (value, label) => assert.equal(await yen.inputValue(), value, label);
        const clear = async () => {
            await page.locator('#clear-button').click();
            await expectYen('', 'Clear');
        };
        const group = value => value.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f');

        await clear();
        let digits = '';
        for (const key of '150001234') {
            await page.keyboard.press(key);
            digits += key;
            await expectYen(group(digits), `type ${digits}`);
        }
        while (digits.length) {
            await page.keyboard.press('Backspace');
            digits = digits.slice(0, -1);
            await expectYen(group(digits), `backspace ${digits}`);
        }

        for (let i = 0; i < 3; i++) {
            await clear();
            await page.keyboard.type('1000');
            await expectYen('1\u202f000', '1000');
            await page.keyboard.press('Backspace');
            await expectYen('100', '100');
            await page.keyboard.press('0');
            await expectYen('1\u202f000', '1000 again');
        }

        await clear();
        await page.keyboard.type('1234567');
        await yen.evaluate(input => input.setSelectionRange(4, 4));
        await page.keyboard.press('9');
        await expectYen('12\u202f394\u202f567', 'middle insertion');
        await page.keyboard.press('Backspace');
        await expectYen('1\u202f234\u202f567', 'middle backspace');
        await yen.evaluate(input => input.setSelectionRange(2, 2));
        await page.keyboard.press('Backspace');
        if (await yen.inputValue() === '1\u202f234\u202f567') {
            assert.ok(await yen.evaluate(input => input.selectionStart < 2), 'Backspace moves past separator');
            await page.keyboard.press('Backspace');
        }
        await expectYen('234\u202f567', 'backspace after separator');

        await clear();
        await page.keyboard.type('1234567');
        await yen.evaluate(input => input.setSelectionRange(1, 1));
        await page.keyboard.press('Delete');
        if (await yen.inputValue() === '1\u202f234\u202f567') {
            assert.ok(await yen.evaluate(input => input.selectionStart > 1), 'Delete moves past separator');
            await page.keyboard.press('Delete');
        }
        await expectYen('134\u202f567', 'delete before separator');

        await clear();
        await page.keyboard.type('12345,6700');
        await expectYen('12\u202f345.6700', 'decimal comma and trailing zeros');
        await page.keyboard.press('Backspace');
        await expectYen('12\u202f345.670', 'decimal backspace');
        await yen.selectText();
        await page.keyboard.type('1500');
        await expectYen('1\u202f500', 'replace selection');
        await yen.selectText();
        await page.keyboard.type('15000');
        await expectYen('15\u202f000', 'replace grouped selection');

        await page.locator('#amount-eur').click();
        await page.keyboard.type('1000');
        assert.equal(await page.locator('#amount-eur').inputValue(), '1\u202f000', 'new field replaces converted amount');
        await expectYen('177\u202f390', 'new field conversion');
        assert.deepEqual(errors, [], 'no page errors');
        console.log('PASS native WebKit currency editing');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exit(1); });
