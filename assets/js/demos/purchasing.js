/* ==========================================================================
   EBS Enterprise Demo — Purchasing & suppliers (sample data, USD base)
   ========================================================================== */
(() => {
  'use strict';

  const {
    $, ready, money, esc, status: badge, toast,
    openDrawer, closeDrawer, exportCSV, chartBars, onCurrency
  } = window.EBSApp;

  const SUPPLIERS = [
    'Golden Harvest Foods',
    'Delta Packaging Ltd.',
    'Mandalay Wholesale Co.',
    'Yangon Trade Supply',
    'CleanPro Distribution',
    'Ayeyar Logistics'
  ];

  /* ── sample state (all amounts USD) ───────────────────────────────────── */
  const purchaseOrders = [
    { no: 'PO-2492', supplier: 'Golden Harvest Foods', item: 'Jasmine rice 5kg', qty: 60, unitCost: 6.4, date: '20 Oct 2026', expected: '24 Oct 2026', status: 'Open' },
    { no: 'PO-2491', supplier: 'Delta Packaging Ltd.', item: 'Kraft cups 8oz (50)', qty: 200, unitCost: 2.8, date: '19 Oct 2026', expected: '22 Oct 2026', status: 'Approved' },
    { no: 'PO-2490', supplier: 'Mandalay Wholesale Co.', item: 'Bottled water 600ml (24)', qty: 90, unitCost: 4.2, date: '18 Oct 2026', expected: '21 Oct 2026', status: 'Overdue' },
    { no: 'PO-2489', supplier: 'Yangon Trade Supply', item: 'Surface cleaner 1L', qty: 40, unitCost: 5.6, date: '17 Oct 2026', expected: '20 Oct 2026', status: 'Received' },
    { no: 'PO-2488', supplier: 'CleanPro Distribution', item: 'Cleaning supplies (mixed)', qty: 25, unitCost: 12.5, date: '16 Oct 2026', expected: '19 Oct 2026', status: 'Received' },
    { no: 'PO-2487', supplier: 'Golden Harvest Foods', item: 'Palm sugar 1kg', qty: 150, unitCost: 1.1, date: '15 Oct 2026', expected: '18 Oct 2026', status: 'Approved' },
    { no: 'PO-2486', supplier: 'Delta Packaging Ltd.', item: 'Paper bags medium (100)', qty: 120, unitCost: 3.1, date: '14 Oct 2026', expected: '17 Oct 2026', status: 'Draft' },
    { no: 'PO-2485', supplier: 'Ayeyar Logistics', item: 'Delivery crates (sample)', qty: 20, unitCost: 47, date: '13 Oct 2026', expected: '16 Oct 2026', status: 'Received' },
    { no: 'PO-2484', supplier: 'Mandalay Wholesale Co.', item: 'Green tea 500g', qty: 75, unitCost: 3.2, date: '12 Oct 2026', expected: '15 Oct 2026', status: 'Received' },
    { no: 'PO-2483', supplier: 'Yangon Trade Supply', item: 'Arabica coffee beans 1kg', qty: 48, unitCost: 8.5, date: '11 Oct 2026', expected: '14 Oct 2026', status: 'Received' },
    { no: 'PO-2482', supplier: 'Golden Harvest Foods', item: 'Chili sauce 300g', qty: 96, unitCost: 1.9, date: '10 Oct 2026', expected: '13 Oct 2026', status: 'Received' },
    { no: 'PO-2481', supplier: 'Ayeyar Logistics', item: 'Shipping labels (roll)', qty: 18, unitCost: 7, date: '9 Oct 2026', expected: '12 Oct 2026', status: 'Open' }
  ];

  const activity = [
    { time: '09:48', text: '<b>PO-2491</b> approved · Delta Packaging Ltd.' },
    { time: '09:21', text: '<b>PO-2489</b> received · Yangon Trade Supply' },
    { time: '08:54', text: '<b>PO-2492</b> created · Golden Harvest Foods' },
    { time: '08:12', text: '<b>PO-2490</b> flagged overdue · Mandalay Wholesale Co.' },
    { time: '07:40', text: '<b>PO-2488</b> received · CleanPro Distribution' }
  ];

  const WEEKLY_BASE_SPEND = [1240, 2380, 1960];
  const state = { query: '', status: 'all' };
  const el = {};

  const poAmount = po => po.qty * po.unitCost;
  const TONES = { Draft: 'neutral', Open: 'info', Approved: 'ok', Received: 'neutral', Overdue: 'bad' };
  const initials = name => name.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0].toUpperCase()).join('');
  const isPending = po => po.status === 'Draft' || po.status === 'Open';
  const isOpen = po => isPending(po) || po.status === 'Approved';

  function cache() {
    el.open = $('#kpiOpen');
    el.openMeta = $('#kpiOpenMeta');
    el.overdue = $('#kpiOverdue');
    el.overdueMeta = $('#kpiOverdueMeta');
    el.spend = $('#kpiSpend');
    el.suppliers = $('#kpiSuppliers');
    el.suppliersMeta = $('#kpiSuppliersMeta');
    el.poCount = $('#poCount');
    el.pendingBadge = $('#pendingBadge');
    el.body = $('#poBody');
    el.footNote = $('#footNote');
    el.supplierRows = $('#supplierRows');
    el.supplierBadge = $('#supplierBadge');
    el.approvalList = $('#approvalList');
    el.approvalBadge = $('#approvalBadge');
    el.activityList = $('#activityList');
    el.spendChart = $('#spendChart');
    el.spendRows = $('#spendRows');
    el.search = $('#searchInput');
    el.statusFilter = $('#statusFilter');
  }

  function visibleOrders() {
    const query = state.query.trim().toLowerCase();
    return purchaseOrders.filter(po => {
      if (state.status !== 'all' && po.status !== state.status) return false;
      if (!query) return true;
      return [po.no, po.supplier, po.item, po.status].join(' ').toLowerCase().includes(query);
    });
  }

  function renderRows(list) {
    if (!list.length) {
      el.body.innerHTML = '<tr><td class="app-table__empty" colspan="7">No purchase orders match this search or status. Try “All statuses”.</td></tr>';
      return;
    }
    el.body.innerHTML = list.map(po => {
      let action = '<span class="muted">—</span>';
      if (po.status === 'Draft' || po.status === 'Open') {
        action = `<button class="link-btn" type="button" data-po="${esc(po.no)}" data-action="approve">Approve</button>`;
      } else if (po.status === 'Approved' || po.status === 'Overdue') {
        action = `<button class="link-btn" type="button" data-po="${esc(po.no)}" data-action="receive">Receive</button>`;
      }
      return `<tr>
        <td><div class="app-person__name">${esc(po.no)}</div></td>
        <td><div class="app-person"><span class="app-avatar app-avatar--${(SUPPLIERS.indexOf(po.supplier) % 4) + 2}">${esc(initials(po.supplier))}</span><div><div class="app-person__name">${esc(po.supplier)}</div><div class="app-person__sub">${esc(po.item)}</div></div></div></td>
        <td class="muted"><span class="app-person__sub">${esc(po.date)}</span></td>
        <td class="muted"><span class="app-person__sub">${esc(po.expected)}</span></td>
        <td class="num">${money(poAmount(po))}</td>
        <td>${badge(po.status, TONES[po.status] || 'neutral')}</td>
        <td class="actions">${action}</td>
      </tr>`;
    }).join('');
  }

  function renderKpis(list) {
    const openCount = purchaseOrders.filter(isOpen).length;
    const overdueCount = purchaseOrders.filter(po => po.status === 'Overdue').length;
    const spend = purchaseOrders.filter(po => po.status === 'Received')
      .reduce((sum, po) => sum + poAmount(po), 0);
    const receivedCount = purchaseOrders.filter(po => po.status === 'Received').length;
    const activeSuppliers = new Set(purchaseOrders.map(po => po.supplier)).size;

    el.open.textContent = String(openCount);
    el.openMeta.textContent = '3';
    el.overdue.textContent = String(overdueCount);
    el.overdueMeta.textContent = overdueCount ? 'Supplier follow-up needed' : 'Nothing overdue';
    el.spend.textContent = money(spend, { compact: true });
    el.suppliers.textContent = String(activeSuppliers);
    el.suppliersMeta.textContent = `${receivedCount} POs received this month`;
    el.poCount.textContent = `${list.length} of ${purchaseOrders.length}`;
    el.pendingBadge.textContent = `${purchaseOrders.filter(isPending).length} pending approval`;
  }

  function renderSuppliers() {
    const totals = new Map();
    purchaseOrders.forEach(po => totals.set(po.supplier, (totals.get(po.supplier) || 0) + poAmount(po)));
    const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    el.supplierRows.innerHTML = ranked.map(([supplier, total]) =>
      `<div class="app-row"><span>${esc(supplier)}</span><b class="num">${money(total)}</b></div>`
    ).join('');
    el.supplierBadge.textContent = `${totals.size} active`;
  }

  function renderApprovals() {
    const pending = purchaseOrders.filter(isPending);
    el.approvalBadge.textContent = `${pending.length} waiting`;
    if (!pending.length) {
      el.approvalList.innerHTML = '<div class="app-activity__item"><span class="app-activity__dot"></span><div>No purchase orders awaiting approval.</div></div>';
      return;
    }
    el.approvalList.innerHTML = pending.slice(0, 5).map(po =>
      `<div class="app-activity__item"><span class="app-activity__dot"></span><div><b>${esc(po.no)}</b> · ${esc(po.supplier)}<br>${money(poAmount(po))} · ${esc(po.status.toLowerCase())}</div><span class="app-activity__time">${esc(po.date.split(' ').slice(0, 2).join(' '))}</span></div>`
    ).join('');
  }

  function renderSpend() {
    const received = purchaseOrders.filter(po => po.status === 'Received');
    const thisWeek = received.reduce((sum, po) => sum + poAmount(po), 0);
    const values = [...WEEKLY_BASE_SPEND, thisWeek];
    const labels = ['W1', 'W2', 'W3', 'W4'];
    el.spendChart.innerHTML = chartBars(values, labels);
    el.spendRows.innerHTML = values.map((value, index) =>
      `<div class="app-row"><span>${labels[index]} · received</span><b class="num">${money(value)}</b></div>`
    ).join('');
  }

  function renderActivity() {
    el.activityList.innerHTML = activity.slice(0, 6).map(entry =>
      `<div class="app-activity__item"><span class="app-activity__dot"></span><div>${entry.text}</div><span class="app-activity__time">${esc(entry.time)}</span></div>`
    ).join('');
  }

  function render() {
    const list = visibleOrders();
    renderKpis(list);
    renderRows(list);
    renderSuppliers();
    renderApprovals();
    renderSpend();
    renderActivity();
    el.footNote.textContent = `Showing ${list.length} of ${purchaseOrders.length} purchase orders · sample ledger`;
  }

  /* ── status transitions ───────────────────────────────────────────────── */
  function approvePo(no) {
    const po = purchaseOrders.find(entry => entry.no === no);
    if (!po || !isPending(po)) return;
    po.status = 'Approved';
    activity.unshift({ time: 'just now', text: `<b>${esc(po.no)}</b> approved · ${esc(po.supplier)}` });
    render();
    toast(`${po.no} approved — supplier notified (sample).`, 'ok');
  }

  function receivePo(no) {
    const po = purchaseOrders.find(entry => entry.no === no);
    if (!po || (po.status !== 'Approved' && po.status !== 'Overdue')) return;
    po.status = 'Received';
    activity.unshift({ time: 'just now', text: `<b>${esc(po.no)}</b> received · ${esc(po.supplier)}` });
    render();
    toast(`${po.no} received — ${po.qty} units added to sample stock.`, 'ok');
  }

  /* ── drawer: create purchase order ────────────────────────────────────── */
  const nextPoNumber = () => `PO-${Math.max(...purchaseOrders.map(po => Number(po.no.replace('PO-', '')))) + 1}`;

  function formatDate(iso) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const [year, month, day] = iso.split('-').map(Number);
    if (!year || !month || !day) return iso;
    return `${day} ${months[month - 1]} ${year}`;
  }

  function openCreate() {
    const poNo = nextPoNumber();
    const options = SUPPLIERS.map(supplier => `<option>${esc(supplier)}</option>`).join('');
    openDrawer({
      title: 'Create purchase order',
      body: `
        <form class="app-form" id="poForm">
          <div class="app-field app-field--full">
            <label class="app-label" for="poSupplier">Supplier</label>
            <select class="app-select" id="poSupplier">${options}</select>
          </div>
          <div class="app-field app-field--full">
            <label class="app-label" for="poItem">Item</label>
            <input class="app-input" id="poItem" type="text" placeholder="e.g. Kraft cups 8oz (50)" autocomplete="off">
          </div>
          <div class="app-field">
            <label class="app-label" for="poQty">Quantity</label>
            <input class="app-input" id="poQty" type="number" min="1" step="1" value="12" inputmode="numeric">
          </div>
          <div class="app-field">
            <label class="app-label" for="poCost">Unit cost (USD)</label>
            <input class="app-input" id="poCost" type="number" min="0.01" step="0.01" value="2.8" inputmode="decimal">
          </div>
          <div class="app-field app-field--full">
            <label class="app-label" for="poExpected">Expected delivery</label>
            <input class="app-input" id="poExpected" type="date" value="2026-10-24">
          </div>
          <p class="app-hint app-field--full" id="poHint">—</p>
        </form>`,
      footer: `
        <button class="app-btn app-btn--secondary" type="button" data-close>Cancel</button>
        <button class="app-btn app-btn--primary" type="submit" form="poForm">Create ${esc(poNo)}</button>`,
      onMount(overlay) {
        const form = $('#poForm', overlay);
        const supplier = $('#poSupplier', overlay);
        const item = $('#poItem', overlay);
        const qty = $('#poQty', overlay);
        const cost = $('#poCost', overlay);
        const expected = $('#poExpected', overlay);
        const hint = $('#poHint', overlay);

        const updateHint = () => {
          const amount = Math.max(0, Number(qty.value) || 0) * Math.max(0, Number(cost.value) || 0);
          hint.textContent = `${poNo} · order amount ${money(amount)} · display currency only.`;
        };
        qty.addEventListener('input', updateHint);
        cost.addEventListener('input', updateHint);
        updateHint();

        $('[data-close]', overlay).addEventListener('click', closeDrawer);

        form.addEventListener('submit', event => {
          event.preventDefault();
          const itemName = item.value.trim();
          const quantity = Math.floor(Number(qty.value));
          const unitCost = Number(cost.value);
          if (!itemName) { toast('Add the item you are ordering.', 'warn'); item.focus(); return; }
          if (!quantity || quantity < 1) { toast('Quantity must be at least 1.', 'warn'); qty.focus(); return; }
          if (!unitCost || unitCost <= 0) { toast('Unit cost must be greater than zero (USD).', 'warn'); cost.focus(); return; }
          if (!expected.value) { toast('Choose an expected delivery date.', 'warn'); expected.focus(); return; }

          const po = {
            no: poNo,
            supplier: supplier.value,
            item: itemName,
            qty: quantity,
            unitCost,
            date: '21 Oct 2026',
            expected: formatDate(expected.value),
            status: 'Open'
          };
          purchaseOrders.unshift(po);
          activity.unshift({ time: 'just now', text: `<b>${esc(po.no)}</b> created · ${esc(po.supplier)}` });
          closeDrawer();
          render();
          toast(`${po.no} created — ${quantity} × ${itemName} (${money(poAmount(po))}).`, 'ok');
        });
      }
    });
  }

  /* ── export ───────────────────────────────────────────────────────────── */
  function exportPurchasing() {
    const rows = [[
      'PO no', 'Supplier', 'Item', 'Quantity', 'Unit cost (USD)',
      'Amount (USD)', 'Order date', 'Expected', 'Status'
    ]];
    visibleOrders().forEach(po => {
      rows.push([
        po.no, po.supplier, po.item, po.qty, po.unitCost.toFixed(2),
        poAmount(po).toFixed(2), po.date, po.expected, po.status
      ]);
    });
    exportCSV('ebs-purchasing-sample.csv', rows);
  }

  /* ── wiring ───────────────────────────────────────────────────────────── */
  function init() {
    cache();

    el.search.addEventListener('input', event => {
      state.query = event.target.value;
      render();
    });

    el.statusFilter.addEventListener('change', event => {
      state.status = event.target.value;
      render();
    });

    el.body.addEventListener('click', event => {
      const button = event.target.closest('[data-action]');
      if (!button) return;
      if (button.dataset.action === 'approve') approvePo(button.dataset.po);
      if (button.dataset.action === 'receive') receivePo(button.dataset.po);
    });

    $('#createBtn').addEventListener('click', openCreate);
    $('#exportBtn').addEventListener('click', exportPurchasing);

    render();
    onCurrency(render);
  }

  ready(init);
})();
