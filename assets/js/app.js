/* ==========================================================================
   EBS Enterprise Demo — shared application helpers
   ========================================================================== */
(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const esc = value => String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  }

  function money(usd, opts) { return window.EBSMoney.formatMoney(usd, opts); }
  function currency() { return window.EBSMoney.get(); }
  function onCurrency(fn) { document.addEventListener('ebs:currency', event => fn(event.detail.code)); }

  let toastTimer = 0;
  function toast(message, tone = 'ok') {
    let el = $('.app-toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'app-toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.className = `app-toast app-toast--${tone} is-visible`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-visible'), 3200);
  }

  function closeDrawer() {
    const overlay = $('.app-overlay');
    if (!overlay) return;
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(() => overlay.remove(), 220);
  }

  function openDrawer({ title, body, footer = '', onMount }) {
    closeDrawer();
    const overlay = document.createElement('div');
    overlay.className = 'app-overlay';
    overlay.innerHTML = `
      <aside class="app-drawer" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <div class="app-drawer__head">
          <span class="app-drawer__title">${esc(title)}</span>
          <button class="app-drawer__close" type="button" aria-label="Close">×</button>
        </div>
        <div class="app-drawer__body">${body}</div>
        <div class="app-drawer__foot">${footer}</div>
      </aside>`;
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => overlay.classList.add('is-open'));
    $('.app-drawer__close', overlay).addEventListener('click', closeDrawer);
    overlay.addEventListener('click', event => { if (event.target === overlay) closeDrawer(); });
    document.addEventListener('keydown', function onKey(event) {
      if (event.key === 'Escape') { closeDrawer(); document.removeEventListener('keydown', onKey); }
    });
    if (typeof onMount === 'function') onMount(overlay);
    const first = $('input, select, textarea, button', overlay);
    if (first) first.focus();
    return overlay;
  }

  function status(text, tone = 'neutral') {
    return `<span class="app-badge app-badge--${tone}">${esc(text)}</span>`;
  }

  function chartBars(values, labels = [], accentLast = true) {
    const max = Math.max(...values, 1);
    const bars = values.map((value, index) => {
      const accent = accentLast && index === values.length - 1 ? ' is-accent' : '';
      return `<span class="app-chart__bar${accent}" style="height:${Math.max(2, (value / max) * 100)}%"></span>`;
    }).join('');
    const axes = labels.length
      ? `<div class="app-chart__labels">${labels.map(label => `<span>${esc(label)}</span>`).join('')}</div>`
      : '';
    return `<div class="app-chart">${bars}</div>${axes}`;
  }

  function sparkline(values, toneClass = '') {
    const max = Math.max(...values, 1);
    return `<div class="app-spark ${toneClass}">${values.map(value => `<i style="height:${Math.max(8, (value / max) * 100)}%"></i>`).join('')}</div>`;
  }

  function exportCSV(filename, rows) {
    const content = rows.map(row => row.map(cell => {
      const text = String(cell == null ? '' : cell);
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    }).join(',')).join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast('Export prepared — sample data only.', 'ok');
  }

  function initShell() {
    const body = document.body;
    const active = body.dataset.module || '';
    $$('[data-nav]').forEach(link => {
      link.classList.toggle('is-active', link.dataset.nav === active);
      if (link.dataset.nav === active) link.setAttribute('aria-current', 'page');
    });

    const side = $('.app-side');
    const menu = $('[data-app-menu]');
    if (side && menu) {
      menu.addEventListener('click', () => {
        side.classList.toggle('is-open');
        menu.setAttribute('aria-expanded', String(side.classList.contains('is-open')));
      });
      $$('.app-nav', side).forEach(link => link.addEventListener('click', () => side.classList.remove('is-open')));
    }

    if (window.EBSMoney) {
      window.EBSMoney.initSelectors(document);
      onCurrency(() => {
        $$('[data-currency-label]').forEach(el => { el.textContent = window.EBSMoney.get(); });
      });
    }

    $$('[data-export]').forEach(button => {
      button.addEventListener('click', () => {
        const table = $(button.dataset.export);
        if (!table) return;
        const rows = Array.from(table.querySelectorAll('tr')).map(tr =>
          Array.from(tr.querySelectorAll('th,td')).map(cell => cell.textContent.trim())
        );
        exportCSV(`${active || 'ebs'}-export.csv`, rows);
      });
    });
  }

  window.EBSApp = {
    $, $$, ready, money, currency, onCurrency, toast, status,
    openDrawer, closeDrawer, chartBars, sparkline, exportCSV, initShell,
    esc
  };

  ready(initShell);
})();
