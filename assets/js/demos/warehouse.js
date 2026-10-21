/* ==========================================================================
   EBS Enterprise Demo — Warehouse & logistics (sample data, USD base)
   ========================================================================== */
(() => {
  'use strict';

  const {
    $, $$, ready, money, esc, status: badge, toast,
    openDrawer, closeDrawer, exportCSV, chartBars, onCurrency
  } = window.EBSApp;

  const ZONES = ['Zone A', 'Zone B', 'Cold store', 'Bulk floor'];
  const ZONE_SHORT = { 'Zone A': 'Zone A', 'Zone B': 'Zone B', 'Cold store': 'Cold', 'Bulk floor': 'Bulk' };
  const SAMPLE_TODAY = Date.UTC(2026, 9, 21);

  /* ── sample state (all amounts USD) ───────────────────────────────────── */
  const rows = [
    { id: 'L01', loc: 'A-01-01', zone: 'Zone A', item: 'Arabica coffee beans 1kg', qty: 320, capacity: 800, batch: 'B-2410-17', expiry: '12 Dec 2026', cost: 8.5 },
    { id: 'L02', loc: 'A-01-02', zone: 'Zone A', item: 'Jasmine rice 5kg', qty: 640, capacity: 700, batch: 'B-2409-08', expiry: '18 Dec 2026', cost: 6.4 },
    { id: 'L03', loc: 'A-02-01', zone: 'Zone A', item: 'Green tea 500g', qty: 90, capacity: 400, batch: 'B-2408-22', expiry: '22 Jan 2027', cost: 3.2 },
    { id: 'L04', loc: 'A-03-01', zone: 'Zone A', item: 'Surface cleaner 1L', qty: 110, capacity: 300, batch: 'B-2407-09', expiry: '26 Jan 2027', cost: 5.6 },
    { id: 'L05', loc: 'B-01-01', zone: 'Zone B', item: 'Kraft cups 8oz (50)', qty: 720, capacity: 900, batch: 'B-2410-03', expiry: '10 Mar 2027', cost: 2.8 },
    { id: 'L06', loc: 'B-01-02', zone: 'Zone B', item: 'Paper bags medium (100)', qty: 210, capacity: 600, batch: 'B-2407-14', expiry: '04 Feb 2027', cost: 3.1 },
    { id: 'L07', loc: 'B-02-03', zone: 'Zone B', item: 'Bottled water 600ml (24)', qty: 480, capacity: 520, batch: 'B-2410-21', expiry: '30 Apr 2027', cost: 4.2 },
    { id: 'L08', loc: 'C-01-01', zone: 'Cold store', item: 'Fresh milk 1L', qty: 96, capacity: 240, batch: 'B-2410-26', expiry: '28 Oct 2026', cost: 2.9 },
    { id: 'L09', loc: 'C-01-02', zone: 'Cold store', item: 'Butter 250g', qty: 40, capacity: 160, batch: 'B-2410-25', expiry: '02 Nov 2026', cost: 4.1 },
    { id: 'L10', loc: 'C-02-01', zone: 'Cold store', item: 'Frozen fruit mix 1kg', qty: 130, capacity: 200, batch: 'B-2409-30', expiry: '15 Jun 2027', cost: 5.4 },
    { id: 'L11', loc: 'D-01-01', zone: 'Bulk floor', item: 'Palm sugar 1kg (sack)', qty: 1400, capacity: 1800, batch: 'B-2406-02', expiry: '20 May 2027', cost: 1.1 },
    { id: 'L12', loc: 'D-01-02', zone: 'Bulk floor', item: 'Cooking oil 2L (carton)', qty: 260, capacity: 700, batch: 'B-2408-11', expiry: '12 Jul 2027', cost: 4.5 },
    { id: 'L13', loc: 'D-02-01', zone: 'Bulk floor', item: 'Instant noodles (30)', qty: 340, capacity: 480, batch: 'B-2409-19', expiry: '28 Feb 2027', cost: 6.8 }
  ];

  const activity = [
    { time: '09:36', text: '<b>Transfer</b> 24 × Kraft cups 8oz (50) · B-01-01 → A-01-02' },
    { time: '09:12', text: '<b>Stock count</b> C-01-01 · Fresh milk 1L · variance −2' },
    { time: '08:48', text: '<b>Transfer</b> 60 × Jasmine rice 5kg · D-01-01 → A-01-02' },
    { time: '08:20', text: '<b>Inbound</b> 240 × Bottled water 600ml (24) · B-02-03' },
    { time: '07:55', text: '<b>Stock count</b> D-01-01 · no variance' }
  ];

  let transfersToday = 4;
  let lastTransfer = '09:36';
  let nextRowNumber = 14;
  const state = { query: '', zone: 'all' };
  const el = {};

  const valueOf = row => row.qty * row.cost;
  const fillOf = row => (row.capacity ? row.qty / row.capacity : 0);
  const zoneOf = loc => {
    const existing = rows.find(row => row.loc === loc);
    if (existing) return existing.zone;
    if (loc.startsWith('A-')) return 'Zone A';
    if (loc.startsWith('B-')) return 'Zone B';
    if (loc.startsWith('C-')) return 'Cold store';
    return 'Bulk floor';
  };
  const daysToExpiry = row => Math.round((Date.parse(row.expiry) - SAMPLE_TODAY) / 86400000);

  function rowStatus(row) {
    if (daysToExpiry(row) <= 30) return { key: 'expiring', label: 'Expiring', tone: 'warn' };
    if (row.qty <= 0) return { key: 'empty', label: 'Empty', tone: 'neutral' };
    if (fillOf(row) >= 0.9) return { key: 'full', label: 'Full', tone: 'warn' };
    if (fillOf(row) <= 0.3) return { key: 'low', label: 'Low fill', tone: 'neutral' };
    return { key: 'ok', label: 'Available', tone: 'ok' };
  }

  function cache() {
    el.locations = $('#kpiLocations');
    el.locationsMeta = $('#kpiLocationsMeta');
    el.units = $('#kpiUnits');
    el.unitsMeta = $('#kpiUnitsMeta');
    el.transfers = $('#kpiTransfers');
    el.transfersMeta = $('#kpiTransfersMeta');
    el.fill = $('#kpiFill');
    el.fillMeta = $('#kpiFillMeta');
    el.binCount = $('#binCount');
    el.expiryBadge = $('#expiryBadge');
    el.body = $('#binBody');
    el.footNote = $('#footNote');
    el.chart = $('#zoneChart');
    el.zoneRows = $('#zoneRows');
    el.zoneBadge = $('#zoneBadge');
    el.zoneFoot = $('#zoneFoot');
    el.activityList = $('#activityList');
    el.search = $('#searchInput');
    el.zoneFilter = $('#zoneFilter');
  }

  function visibleRows() {
    const query = state.query.trim().toLowerCase();
    return rows.filter(row => {
      if (state.zone !== 'all' && row.zone !== state.zone) return false;
      if (!query) return true;
      return [row.loc, row.zone, row.item, row.batch].join(' ').toLowerCase().includes(query);
    });
  }

  function renderRows(list) {
    if (!list.length) {
      el.body.innerHTML = '<tr><td class="app-table__empty" colspan="7">No bins match this search or zone filter. Try “All zones”.</td></tr>';
      return;
    }
    el.body.innerHTML = list.map(row => {
      const st = rowStatus(row);
      return `<tr>
        <td><div class="app-person__name">${esc(row.loc)}</div><div class="app-person__sub">${esc(row.zone)}</div></td>
        <td><span class="app-person__name">${esc(row.item)}</span></td>
        <td class="num">${row.qty.toLocaleString('en-US')} <span class="muted">/ ${row.capacity.toLocaleString('en-US')}</span></td>
        <td><div class="app-person__sub">${esc(row.batch)}</div><div class="app-person__sub">Exp ${esc(row.expiry)}</div></td>
        <td class="num">${money(valueOf(row))}</td>
        <td>${badge(st.label, st.tone)}</td>
        <td class="actions">
          <button class="link-btn" type="button" data-transfer-row="${esc(row.id)}">Transfer</button>
          <button class="link-btn" type="button" data-count-row="${esc(row.id)}">Count</button>
        </td>
      </tr>`;
    }).join('');
  }

  function renderKpis() {
    const units = rows.reduce((sum, row) => sum + row.qty, 0);
    const capacity = rows.reduce((sum, row) => sum + row.capacity, 0);
    const value = rows.reduce((sum, row) => sum + valueOf(row), 0);
    const locations = new Set(rows.map(row => row.loc)).size;
    const fill = capacity ? Math.round((units / capacity) * 100) : 0;
    const expiring = rows.filter(row => daysToExpiry(row) <= 30).length;

    el.locations.textContent = String(locations);
    el.locationsMeta.textContent = `${ZONES.length} zones · ${rows.length} stock lines`;
    el.units.textContent = units.toLocaleString('en-US');
    el.unitsMeta.textContent = `${money(value, { compact: true })} at cost`;
    el.transfers.textContent = String(transfersToday);
    el.transfersMeta.textContent = `Last transfer ${lastTransfer}`;
    el.fill.textContent = `${fill}%`;
    el.fillMeta.textContent = `Capacity ${capacity.toLocaleString('en-US')} units`;
    el.binCount.textContent = `${rows.length} lines`;
    el.expiryBadge.textContent = expiring ? `${expiring} expiring soon` : 'No expiry risk';
    el.expiryBadge.className = `app-badge app-badge--${expiring ? 'warn' : 'ok'}`;
  }

  function renderZones() {
    const stats = ZONES.map(zone => {
      const lines = rows.filter(row => row.zone === zone);
      const units = lines.reduce((sum, row) => sum + row.qty, 0);
      const capacity = lines.reduce((sum, row) => sum + row.capacity, 0);
      return { zone, units, capacity, percent: capacity ? Math.round((units / capacity) * 100) : 0 };
    });
    el.chart.innerHTML = chartBars(stats.map(stat => stat.percent), stats.map(stat => ZONE_SHORT[stat.zone]));
    el.zoneRows.innerHTML = stats.map(stat =>
      `<div class="app-row"><span>${esc(stat.zone)} · ${stat.capacity.toLocaleString('en-US')} cap.</span><b class="num">${stat.percent}%</b></div>`
    ).join('');
    const units = stats.reduce((sum, stat) => sum + stat.units, 0);
    const capacity = stats.reduce((sum, stat) => sum + stat.capacity, 0);
    el.zoneBadge.textContent = `${ZONES.length} zones`;
    el.zoneFoot.textContent = `${units.toLocaleString('en-US')} of ${capacity.toLocaleString('en-US')} units utilised`;
  }

  function renderActivity() {
    el.activityList.innerHTML = activity.slice(0, 7).map(entry =>
      `<div class="app-activity__item"><span class="app-activity__dot"></span><div>${entry.text}</div><span class="app-activity__time">${esc(entry.time)}</span></div>`
    ).join('');
  }

  function render() {
    const list = visibleRows();
    renderKpis();
    renderRows(list);
    renderZones();
    renderActivity();
    el.footNote.textContent = `Showing ${list.length} of ${rows.length} bin lines · last sync 09:40`;
  }

  /* ── drawer: transfer stock ───────────────────────────────────────────── */
  function transferRowOptions(selectedId) {
    return rows.map(row =>
      `<option value="${esc(row.id)}"${row.id === selectedId ? ' selected' : ''}>${esc(row.loc)} · ${esc(row.item)} (${row.qty})</option>`
    ).join('');
  }

  function destinationOptions(excludeLoc, selectedLoc) {
    const locations = [...new Set(rows.map(row => row.loc))].filter(loc => loc !== excludeLoc).sort();
    return locations.map(loc =>
      `<option value="${esc(loc)}"${loc === selectedLoc ? ' selected' : ''}>${esc(loc)} · ${esc(zoneOf(loc))}</option>`
    ).join('');
  }

  function openTransfer(preferredId) {
    const first = rows.find(row => row.id === preferredId) || rows.find(row => row.qty > 0) || rows[0];
    if (!first) return;

    openDrawer({
      title: 'Transfer stock',
      body: `
        <form class="app-form" id="transferForm">
          <div class="app-field app-field--full">
            <label class="app-label" for="tfFrom">From bin</label>
            <select class="app-select" id="tfFrom">${transferRowOptions(first.id)}</select>
          </div>
          <div class="app-field app-field--full">
            <label class="app-label" for="tfTo">To bin</label>
            <select class="app-select" id="tfTo">${destinationOptions(first.loc)}</select>
          </div>
          <div class="app-field">
            <label class="app-label" for="tfQty">Quantity</label>
            <input class="app-input" id="tfQty" type="number" min="1" step="1" value="10" inputmode="numeric">
          </div>
          <div class="app-field">
            <label class="app-label" for="tfRef">Reference</label>
            <input class="app-input" id="tfRef" type="text" placeholder="e.g. move task 318" autocomplete="off">
          </div>
          <p class="app-hint app-field--full" id="tfHint">—</p>
        </form>`,
      footer: `
        <button class="app-btn app-btn--secondary" type="button" data-close>Cancel</button>
        <button class="app-btn app-btn--primary" type="submit" form="transferForm">Transfer stock</button>`,
      onMount(overlay) {
        const form = $('#transferForm', overlay);
        const from = $('#tfFrom', overlay);
        const to = $('#tfTo', overlay);
        const qty = $('#tfQty', overlay);
        const reference = $('#tfRef', overlay);
        const hint = $('#tfHint', overlay);

        const updateHint = () => {
          const row = rows.find(entry => entry.id === from.value);
          if (!row) { hint.textContent = ''; return; }
          hint.textContent = `${row.loc} holds ${row.qty.toLocaleString('en-US')} units of ${row.item} · batch ${row.batch}.`;
        };
        from.addEventListener('change', () => {
          const row = rows.find(entry => entry.id === from.value);
          if (row) to.innerHTML = destinationOptions(row.loc);
          updateHint();
        });
        updateHint();

        $('[data-close]', overlay).addEventListener('click', closeDrawer);

        form.addEventListener('submit', event => {
          event.preventDefault();
          const source = rows.find(entry => entry.id === from.value);
          if (!source) return;
          const amount = Math.floor(Number(qty.value));
          const destination = to.value;
          if (!amount || amount < 1) { toast('Quantity must be at least 1.', 'warn'); qty.focus(); return; }
          if (destination === source.loc) { toast('Choose a different destination bin.', 'warn'); to.focus(); return; }
          if (amount > source.qty) { toast(`Only ${source.qty} units in ${source.loc}.`, 'bad'); qty.focus(); return; }

          const existing = rows.find(entry => entry.loc === destination && entry.item === source.item);
          if (existing) {
            existing.qty += amount;
            existing.batch = source.batch;
            existing.expiry = source.expiry;
          } else {
            rows.push({
              id: `L${nextRowNumber++}`,
              loc: destination,
              zone: zoneOf(destination),
              item: source.item,
              qty: amount,
              capacity: Math.max(100, amount * 2),
              batch: source.batch,
              expiry: source.expiry,
              cost: source.cost
            });
          }
          source.qty -= amount;
          transfersToday += 1;
          lastTransfer = 'just now';
          const note = reference.value.trim();
          activity.unshift({
            time: 'just now',
            text: `<b>Transfer</b> ${amount} × ${esc(source.item)} · ${esc(source.loc)} → ${esc(destination)}${note ? ` · ${esc(note)}` : ''}`
          });
          closeDrawer();
          render();
          toast(`${amount} × ${source.item} moved ${source.loc} → ${destination}.`, 'ok');
        });
      }
    });
  }

  /* ── drawer: stock count ──────────────────────────────────────────────── */
  function openCount(preferredId) {
    const first = rows.find(row => row.id === preferredId) || rows[0];
    if (!first) return;

    openDrawer({
      title: 'Stock count',
      body: `
        <form class="app-form" id="countForm">
          <div class="app-field app-field--full">
            <label class="app-label" for="ctBin">Bin line</label>
            <select class="app-select" id="ctBin">${transferRowOptions(first.id)}</select>
          </div>
          <div class="app-field app-field--full">
            <label class="app-label" for="ctQty">Counted quantity</label>
            <input class="app-input" id="ctQty" type="number" min="0" step="1" value="${first.qty}" inputmode="numeric">
          </div>
          <p class="app-hint app-field--full" id="ctHint">—</p>
        </form>`,
      footer: `
        <button class="app-btn app-btn--secondary" type="button" data-close>Cancel</button>
        <button class="app-btn app-btn--primary" type="submit" form="countForm">Save count</button>`,
      onMount(overlay) {
        const form = $('#countForm', overlay);
        const bin = $('#ctBin', overlay);
        const qty = $('#ctQty', overlay);
        const hint = $('#ctHint', overlay);

        const updateHint = () => {
          const row = rows.find(entry => entry.id === bin.value);
          hint.textContent = row ? `System quantity in ${row.loc}: ${row.qty.toLocaleString('en-US')} units · batch ${row.batch}.` : '';
        };
        bin.addEventListener('change', () => {
          const row = rows.find(entry => entry.id === bin.value);
          if (row) qty.value = String(row.qty);
          updateHint();
        });
        updateHint();

        $('[data-close]', overlay).addEventListener('click', closeDrawer);

        form.addEventListener('submit', event => {
          event.preventDefault();
          const row = rows.find(entry => entry.id === bin.value);
          if (!row) return;
          const counted = Math.floor(Number(qty.value));
          if (Number.isNaN(counted) || counted < 0) { toast('Enter a counted quantity of 0 or more.', 'warn'); qty.focus(); return; }
          const variance = counted - row.qty;
          row.qty = counted;
          activity.unshift({
            time: 'just now',
            text: `<b>Stock count</b> ${esc(row.loc)} · ${esc(row.item)} · ${variance === 0 ? 'no variance' : `variance ${variance > 0 ? '+' : '−'}${Math.abs(variance)}`}`
          });
          closeDrawer();
          render();
          toast(variance === 0
            ? `Count saved for ${row.loc} — no variance.`
            : `Count saved for ${row.loc} — variance ${variance > 0 ? '+' : ''}${variance} units.`,
            variance === 0 ? 'ok' : 'warn');
        });
      }
    });
  }

  /* ── export ───────────────────────────────────────────────────────────── */
  function exportWarehouse() {
    const rowsToWrite = [[
      'Bin', 'Zone', 'Item', 'Qty', 'Capacity', 'Fill %',
      'Batch', 'Expiry', 'Unit cost (USD)', 'Value (USD)', 'Status'
    ]];
    visibleRows().forEach(row => {
      rowsToWrite.push([
        row.loc, row.zone, row.item, row.qty, row.capacity,
        Math.round(fillOf(row) * 100), row.batch, row.expiry,
        row.cost.toFixed(2), valueOf(row).toFixed(2), rowStatus(row).label
      ]);
    });
    exportCSV('ebs-warehouse-sample.csv', rowsToWrite);
  }

  /* ── wiring ───────────────────────────────────────────────────────────── */
  function init() {
    cache();

    el.search.addEventListener('input', event => {
      state.query = event.target.value;
      render();
    });

    el.zoneFilter.addEventListener('change', event => {
      state.zone = event.target.value;
      render();
    });

    el.body.addEventListener('click', event => {
      const transfer = event.target.closest('[data-transfer-row]');
      if (transfer) { openTransfer(transfer.dataset.transferRow); return; }
      const count = event.target.closest('[data-count-row]');
      if (count) openCount(count.dataset.countRow);
    });

    $('#transferBtn').addEventListener('click', () => openTransfer());
    $('#countBtn').addEventListener('click', () => openCount());
    $('#exportBtn').addEventListener('click', exportWarehouse);

    render();
    onCurrency(render);
  }

  ready(init);
})();
