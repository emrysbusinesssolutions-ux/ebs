/* ==========================================================================
   EBS — currency display layer
   Base currency: USD (invoices are issued in USD).
   Local currencies are indicative conversions for display only.
   ========================================================================== */
(() => {
  'use strict';

  const RATES = { USD: 1, MMK: 2100, THB: 36, CNY: 7.2 };
  const CURRENCIES = [
    { code: 'USD', label: 'USD $', prefix: '$', locale: 'en-US' },
    { code: 'MMK', label: 'MMK K', prefix: 'MMK ', locale: 'en-US' },
    { code: 'THB', label: 'THB ฿', prefix: '฿', locale: 'en-US' },
    { code: 'CNY', label: 'CNY ¥', prefix: '¥', locale: 'en-US' }
  ];
  const KEY = 'ebs-currency';

  const byCode = code => CURRENCIES.find(c => c.code === code) || CURRENCIES[0];

  function get() {
    try {
      const stored = localStorage.getItem(KEY);
      if (stored && byCode(stored).code === stored) return stored;
    } catch (_) {}
    return 'USD';
  }

  function set(code) {
    if (!RATES[code]) return;
    try { localStorage.setItem(KEY, code); } catch (_) {}
    document.querySelectorAll('[data-currency-select]').forEach(select => { select.value = code; });
    document.dispatchEvent(new CustomEvent('ebs:currency', { detail: { code } }));
  }

  const convert = usd => Number(usd || 0) * RATES[get()];

  function number(value, code) {
    const n = Number(value) || 0;
    if (code === 'MMK') return Math.round(n / 1000) * 1000;
    return Math.round(n);
  }

  function amount(value, code = get()) {
    const n = number(value, code);
    return n.toLocaleString('en-US');
  }

  function formatMoney(usd, opts = {}) {
    const code = get();
    const cur = byCode(code);
    const value = Number(usd) || 0;
    if (opts.compact) {
      const n = value * RATES[code];
      const units = [
        { limit: 1e9, suffix: 'B' },
        { limit: 1e6, suffix: 'M' },
        { limit: 1e3, suffix: 'K' }
      ];
      const unit = units.find(u => Math.abs(n) >= u.limit);
      if (unit) {
        const scaled = n / unit.limit;
        return `${cur.prefix}${scaled.toFixed(scaled >= 100 ? 0 : 1).replace(/\.0$/, '')}${unit.suffix}`;
      }
      return `${cur.prefix}${amount(n, code)}`;
    }
    return `${cur.prefix}${amount(value * RATES[code], code)}`;
  }

  function formatRange(min, max) {
    const code = get();
    const cur = byCode(code);
    const a = Number(min) * RATES[code];
    const b = Number(max) * RATES[code];
    if (code === 'USD') return `${cur.prefix}${amount(a, code)}–${cur.prefix}${amount(b, code)}`;
    return `${cur.prefix}${amount(a, code)}–${amount(b, code)}`;
  }

  function fill(select) {
    if (select.dataset.currencyReady === '1') return;
    select.innerHTML = CURRENCIES.map(c => `<option value="${c.code}">${c.label}</option>`).join('');
    select.dataset.currencyReady = '1';
    select.value = get();
    select.addEventListener('change', () => set(select.value));
  }

  function initSelectors(root = document) {
    root.querySelectorAll('[data-currency-select]').forEach(fill);
    applyPrices(root);
  }

  function applyPrices(root = document) {
    const local = get() !== 'USD';
    root.querySelectorAll('[data-usd]').forEach(el => {
      const value = parseFloat(el.dataset.usd);
      if (!Number.isNaN(value)) el.textContent = formatMoney(value);
      el.classList.toggle('is-local', local);
    });
    root.querySelectorAll('[data-usd-range]').forEach(el => el.classList.toggle('is-local', local));
    root.querySelectorAll('[data-usd-range]').forEach(el => {
      const [a, b] = String(el.dataset.usdRange).split(',').map(Number);
      if (!Number.isNaN(a) && !Number.isNaN(b)) el.textContent = formatRange(a, b);
    });
    document.querySelectorAll('[data-currency-label]').forEach(el => { el.textContent = get(); });
  }

  document.addEventListener('ebs:currency', () => applyPrices(document));

  window.EBSMoney = { RATES, CURRENCIES, get, set, convert, formatMoney, formatRange, initSelectors, applyPrices };
})();
