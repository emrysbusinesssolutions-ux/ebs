/* ==========================================================================
   EBS Enterprise Demo — Inventory & stock (sample data, USD base)
   ========================================================================== */
(() => {
  'use strict';

  const {
    $, $$, ready, money, esc, status: badge, toast,
    openDrawer, closeDrawer, exportCSV, chartBars, onCurrency
  } = window.EBSApp;

  const CATEGORIES = ['Beverages', 'Dry goods', 'Packaging', 'Cleaning', 'Cold chain'];
  const CATEGORY_SHORT = { Beverages: 'Bev', 'Dry goods': 'Dry', Packaging: 'Pack', Cleaning: 'Clean', 'Cold chain': 'Cold' };

  /* ── sample state (all amounts USD) ───────────────────────────────────── */
  const items = [
    { sku: 'EBS-COF-001', name: 'Arabica coffee beans 1kg', category: 'Beverages', location: 'Warehouse A', onHand: 46, reorder: 20, unit: 'kg', cost: 8.5 },
    { sku: 'EBS-TEA-002', name: 'Green tea 500g', category: 'Beverages', location: 'Shop floor', onHand: 12, reorder: 18, unit: 'pack', cost: 3.2 },
    { sku: 'EBS-RIC-003', name: 'Jasmine rice 5kg', category: 'Dry goods', location: 'Warehouse A', onHand: 84, reorder: 30, unit: 'bag', cost: 6.4 },
    { sku: 'EBS-SUG-004', name: 'Palm sugar 1kg', category: 'Dry goods', location: 'Warehouse B', onHand: 0, reorder: 25, unit: 'kg', cost: 1.1 },
    { sku: 'EBS-WAT-005', name: 'Bottled water 600ml (24)', category: 'Beverages', location: 'Warehouse B', onHand: 120, reorder: 40, unit: 'case', cost: 4.2 },
    { sku: 'EBS-CUP-006', name: 'Kraft cups 8oz (50)', category: 'Packaging', location: 'Warehouse B', onHand: 210, reorder: 80, unit: 'pack', cost: 2.8 },
    { sku: 'EBS-BAG-007', name: 'Paper bags medium (100)', category: 'Packaging', location: 'Shop floor', onHand: 18, reorder: 30, unit: 'pack', cost: 3.1 },
    { sku: 'EBS-CLN-008', name: 'Surface cleaner 1L', category: 'Cleaning', location: 'Warehouse A', onHand: 34, reorder: 10, unit: 'bottle', cost: 5.6 },
    { sku: 'EBS-MLK-009', name: 'Fresh milk 1L', category: 'Cold chain', location: 'Cold room', onHand: 22, reorder: 24, unit: 'carton', cost: 2.9 },
    { sku: 'EBS-OIL-010', name: 'Cooking oil 2L', category: 'Dry goods', location: 'Shop floor', onHand: 57, reorder: 15, unit: 'bottle', cost: 4.5 },
    { sku: 'EBS-CHL-011', name: 'Chili sauce 300g', category: 'Dry goods', location: 'Warehouse A', onHand: 9, reorder: 20, unit: 'bottle', cost: 1.9 },
    { sku: 'EBS-NDL-012', name: 'Instant noodles (30)', category: 'Dry goods', location: 'Warehouse B', onHand: 66, reorder: 25, unit: 'box', cost: 6.8 }
  ];

  const movements = [
    { time: '09:42', text: '<b>Received</b> 24 × Arabica coffee beans 1kg · Warehouse A' },
    { time: '09:18', text: '<b>Transfer</b> 12 × Kraft cups 8oz (50) → Shop floor' },
    { time: '08:55', text: '<b>Stock out</b> 6 × Fresh milk 1L · expiry check' },
    { time: '08:31', text: '<b>Received</b> 40 × Bottled water 600ml (24) · supplier delivery' },
    { time: '08:02', text: '<b>Stock count</b> Shop floor · 2 lines adjusted' },
    { time: '07:45', text: '<b>Stock out</b> 3 × Paper bags medium (100) · POS sales' }
  ];

  const state = { query: '', filter: 'all' };
  const el = {};

  const stockStatus = item => {
    if (item.onHand <= 0) return { key: 'out', label: 'Out of stock', tone: 'bad' };
    if (item.onHand <= item.reorder) return { key: 'low', label: 'Low stock', tone: 'warn' };
    return { key: 'ok', label: 'In stock', tone: 'ok' };
  };

  const itemValue = item => item.onHand * item.cost;
  const initials = name => name.split(/\s+/).filter(word => /^[A-Za-z0-9]/.test(word)).slice(0, 2).map(word => word[0].toUpperCase()).join('');

  function cache() {
    el.value = $('#kpiValue');
    el.valueDelta = $('#kpiValueDelta');
    el.skus = $('#kpiSkus');
    el.skusMeta = $('#kpiSkusMeta');
    el.low = $('#kpiLow');
    el.lowMeta = $('#kpiLowMeta');
    el.itemsCount = $('#itemsCount');
    el.lowBadge = $('#lowBadge');
    el.body = $('#stockBody');
    el.footNote = $('#footNote');
    el.chart = $('#categoryChart');
    el.categoryRows = $('#categoryRows');
    el.categoryBadge = $('#categoryBadge');
    el.valuationRows = $('#valuationRows');
    el.movementList = $('#movementList');
    el.search = $('#searchInput');
  }

  function visibleItems() {
    const query = state.query.trim().toLowerCase();
    return items.filter(item => {
      const key = stockStatus(item).key;
      if (state.filter === 'low' && key !== 'low') return false;
      if (state.filter === 'out' && key !== 'out') return false;
      if (!query) return true;
      return [item.name, item.sku, item.location, item.category, item.unit].join(' ').toLowerCase().includes(query);
    });
  }

  function renderRows(list) {
    if (!list.length) {
      el.body.innerHTML = '<tr><td class="app-table__empty" colspan="7">No stock lines match this search or filter. Try “All”.</td></tr>';
      return;
    }
    el.body.innerHTML = list.map((item, index) => {
      const st = stockStatus(item);
      return `<tr>
        <td><div class="app-person"><span class="app-avatar app-avatar--${(index % 4) + 2}">${esc(initials(item.name))}</span><div><div class="app-person__name">${esc(item.name)}</div><div class="app-person__sub">${esc(item.sku)} · ${esc(item.category)}</div></div></div></td>
        <td class="muted"><span class="app-person__sub">${esc(item.location)}</span></td>
        <td class="num">${item.onHand} <span class="muted">${esc(item.unit)}</span></td>
        <td class="num muted">${item.reorder}</td>
        <td class="num">${money(itemValue(item))}</td>
        <td>${badge(st.label, st.tone)}</td>
        <td class="actions"><button class="link-btn" type="button" data-adjust-sku="${esc(item.sku)}">Adjust</button></td>
      </tr>`;
    }).join('');
  }

  function renderKpis(list) {
    const totalValue = items.reduce((sum, item) => sum + itemValue(item), 0);
    const lowCount = items.filter(item => stockStatus(item).key !== 'ok').length;
    const outCount = items.filter(item => stockStatus(item).key === 'out').length;
    const locations = new Set(items.map(item => item.location)).size;

    el.value.textContent = money(totalValue, { compact: true });
    el.valueDelta.textContent = '+4.2%';
    el.skus.textContent = String(items.length);
    el.skusMeta.textContent = `Across ${locations} stock locations`;
    el.low.textContent = String(lowCount);
    el.lowMeta.textContent = `${outCount} out of stock · ${lowCount - outCount} low`;
    el.itemsCount.textContent = `${list.length} of ${items.length} lines`;

    el.lowBadge.textContent = lowCount ? `${lowCount} need reorder` : 'All above reorder';
    el.lowBadge.className = `app-badge app-badge--${lowCount ? 'warn' : 'ok'}`;
  }

  function renderCategory(list) {
    const totals = CATEGORIES.map(category =>
      items.filter(item => item.category === category).reduce((sum, item) => sum + itemValue(item), 0)
    );
    el.chart.innerHTML = chartBars(totals, CATEGORIES.map(category => CATEGORY_SHORT[category]));
    el.categoryRows.innerHTML = CATEGORIES.map((category, index) =>
      `<div class="app-row"><span>${esc(category)}</span><b class="num">${money(totals[index])}</b></div>`
    ).join('');
    el.categoryBadge.textContent = `${CATEGORIES.length} categories`;
  }

  function renderValuation() {
    const cost = items.reduce((sum, item) => sum + itemValue(item), 0);
    const units = items.reduce((sum, item) => sum + item.onHand, 0);
    const lowCount = items.filter(item => stockStatus(item).key !== 'ok').length;
    const locations = new Set(items.map(item => item.location)).size;
    el.valuationRows.innerHTML = `
      <div class="app-row"><span>Cost value</span><b class="num">${money(cost)}</b></div>
      <div class="app-row"><span>Retail value (est.)</span><b class="num">${money(cost * 1.38)}</b></div>
      <div class="app-row"><span>Units on hand</span><b class="num">${units.toLocaleString('en-US')}</b></div>
      <div class="app-row"><span>Lines below reorder</span><b class="num">${lowCount}</b></div>
      <div class="app-row"><span>Stock locations</span><b class="num">${locations}</b></div>`;
  }

  function renderMovements() {
    el.movementList.innerHTML = movements.slice(0, 7).map(movement =>
      `<div class="app-activity__item"><span class="app-activity__dot"></span><div>${movement.text}</div><span class="app-activity__time">${esc(movement.time)}</span></div>`
    ).join('');
  }

  function render() {
    const list = visibleItems();
    renderKpis(list);
    renderRows(list);
    renderCategory(list);
    renderValuation();
    renderMovements();
    el.footNote.textContent = `Showing ${list.length} of ${items.length} stock lines · last sync 09:48`;
  }

  /* ── drawer: adjust stock ─────────────────────────────────────────────── */
  function openAdjust(preferredSku) {
    const fallback = items.find(item => stockStatus(item).key !== 'ok') || items[0];
    const selected = preferredSku || fallback.sku;
    const options = items.map(item =>
      `<option value="${esc(item.sku)}"${item.sku === selected ? ' selected' : ''}>${esc(item.sku)} — ${esc(item.name)}</option>`
    ).join('');

    openDrawer({
      title: 'Adjust stock',
      body: `
        <form class="app-form" id="adjustForm">
          <div class="app-field app-field--full">
            <label class="app-label" for="afItem">Stock item</label>
            <select class="app-select" id="afItem">${options}</select>
          </div>
          <div class="app-field">
            <label class="app-label" for="afDir">Adjustment</label>
            <select class="app-select" id="afDir">
              <option value="in">Add stock (+)</option>
              <option value="out">Remove stock (−)</option>
            </select>
          </div>
          <div class="app-field">
            <label class="app-label" for="afQty">Quantity</label>
            <input class="app-input" id="afQty" type="number" min="1" step="1" value="1" inputmode="numeric">
          </div>
          <div class="app-field app-field--full">
            <label class="app-label" for="afReason">Reason</label>
            <select class="app-select" id="afReason">
              <option>Supplier delivery</option>
              <option>Stock count correction</option>
              <option>Damaged / expired</option>
              <option>Customer return</option>
              <option>Internal transfer</option>
            </select>
          </div>
          <div class="app-field app-field--full">
            <label class="app-label" for="afNote">Reference note <span class="app-hint">(optional)</span></label>
            <input class="app-input" id="afNote" type="text" placeholder="e.g. delivery note 8841" autocomplete="off">
          </div>
          <p class="app-hint app-field--full" id="afHint">—</p>
        </form>`,
      footer: `
        <button class="app-btn app-btn--secondary" type="button" data-close>Cancel</button>
        <button class="app-btn app-btn--primary" type="submit" form="adjustForm">Save adjustment</button>`,
      onMount(overlay) {
        const form = $('#adjustForm', overlay);
        const itemSelect = $('#afItem', overlay);
        const direction = $('#afDir', overlay);
        const quantity = $('#afQty', overlay);
        const reason = $('#afReason', overlay);
        const note = $('#afNote', overlay);
        const hint = $('#afHint', overlay);

        const updateHint = () => {
          const item = items.find(entry => entry.sku === itemSelect.value);
          if (!item) { hint.textContent = ''; return; }
          const st = stockStatus(item);
          hint.textContent = `On hand ${item.onHand} ${item.unit} · reorder point ${item.reorder} · currently ${st.label.toLowerCase()}.`;
        };
        itemSelect.addEventListener('change', updateHint);
        direction.addEventListener('change', updateHint);
        updateHint();

        $('[data-close]', overlay).addEventListener('click', closeDrawer);

        form.addEventListener('submit', event => {
          event.preventDefault();
          const item = items.find(entry => entry.sku === itemSelect.value);
          if (!item) return;
          const amount = Math.floor(Number(quantity.value));
          if (!amount || amount < 1) {
            toast('Enter a quantity of at least 1 unit.', 'warn');
            quantity.focus();
            return;
          }
          const delta = direction.value === 'in' ? amount : -amount;
          if (item.onHand + delta < 0) {
            toast(`Only ${item.onHand} ${item.unit} on hand — adjustment not saved.`, 'bad');
            return;
          }
          item.onHand = Math.max(0, item.onHand + delta);
          const label = direction.value === 'in' ? 'Received' : 'Stock out';
          const reference = note.value.trim();
          movements.unshift({
            time: 'just now',
            text: `<b>${label}</b> ${amount} × ${esc(item.name)} · ${esc(reason.value)}${reference ? ` · ${esc(reference)}` : ''}`
          });
          closeDrawer();
          render();
          const st = stockStatus(item);
          toast(`${item.sku} adjusted ${delta > 0 ? '+' : ''}${delta} — now ${st.label.toLowerCase()}.`, 'ok');
        });
      }
    });
  }

  /* ── export ───────────────────────────────────────────────────────────── */
  function exportInventory() {
    const rows = [[
      'SKU', 'Item', 'Category', 'Location', 'On hand', 'Reorder point',
      'Unit', 'Unit cost (USD)', 'Stock value (USD)', 'Status'
    ]];
    visibleItems().forEach(item => {
      rows.push([
        item.sku, item.name, item.category, item.location, item.onHand, item.reorder,
        item.unit, item.cost.toFixed(2), itemValue(item).toFixed(2), stockStatus(item).label
      ]);
    });
    exportCSV('ebs-inventory-sample.csv', rows);
  }

  /* ── wiring ───────────────────────────────────────────────────────────── */
  function init() {
    cache();

    el.search.addEventListener('input', event => {
      state.query = event.target.value;
      render();
    });

    $$('.app-chip[data-filter]').forEach(chip => {
      chip.addEventListener('click', () => {
        state.filter = chip.dataset.filter;
        $$('.app-chip[data-filter]').forEach(other => other.classList.toggle('is-active', other === chip));
        render();
      });
    });

    el.body.addEventListener('click', event => {
      const button = event.target.closest('[data-adjust-sku]');
      if (!button) return;
      openAdjust(button.dataset.adjustSku);
    });

    $('#adjustBtn').addEventListener('click', () => openAdjust());
    $('#exportBtn').addEventListener('click', exportInventory);

    render();
    onCurrency(render);
  }

  ready(init);
})();
