/* ==========================================================================
   E-commerce & orders demo — sample orders, no live records or payments.
   Base amounts are USD; every money value is rendered through EBSApp.money.
   ========================================================================== */
(() => {
  'use strict';

  const App = window.EBSApp;
  const { ready, money, status, toast, openDrawer, closeDrawer, exportCSV, esc } = App;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const NEXT = { Paid: 'Packing', Packing: 'Shipped', Shipped: 'Delivered' };
  const AWAITING = ['Paid', 'Packing'];
  const STATUS_TONE = { Paid: 'info', Packing: 'warn', Shipped: 'neutral', Delivered: 'ok', Returned: 'bad' };
  const CHANNEL_TONE = { Website: 'info', Facebook: 'neutral', Shop: 'warn' };
  const CHANNELS = [
    { name: 'Website', usd: 18400, share: '42%' },
    { name: 'Facebook', usd: 11400, share: '26%' },
    { name: 'Shop', usd: 7900, share: '18%' },
    { name: 'Other', usd: 6100, share: '14%' }
  ];
  const LOW_STOCK = [
    { name: 'Cold brew bottle', qty: 0, tone: 'bad', label: 'Out of stock' },
    { name: 'Ceramic cup', qty: 4, tone: 'warn', label: 'Low stock' },
    { name: 'Filter papers', qty: 9, tone: 'warn', label: 'Low stock' }
  ];

  const orders = [
    { id: 1048, channel: 'Website', customer: 'Thiri Win', city: 'Yangon', time: 'Today · 09:42', day: 'today', status: 'Paid', payment: 'Card', items: [
      { name: 'Espresso beans 1kg', qty: 2, price: 22 }, { name: 'Ceramic cup', qty: 1, price: 14 }, { name: 'Filter papers', qty: 1, price: 6 }] },
    { id: 1047, channel: 'Facebook', customer: 'Aung Min', city: 'Mandalay', time: 'Today · 09:18', day: 'today', status: 'Paid', payment: 'Transfer', items: [
      { name: 'Grinder', qty: 1, price: 65 }, { name: 'Espresso beans 1kg', qty: 1, price: 22 }] },
    { id: 1046, channel: 'Shop', customer: 'Daw Mya Mya', city: 'Yangon', time: 'Today · 08:55', day: 'today', status: 'Packing', payment: 'Cash', items: [
      { name: 'Tea sampler', qty: 2, price: 26 }, { name: 'Tote bag', qty: 1, price: 12 }] },
    { id: 1045, channel: 'Website', customer: 'U Soe Win', city: 'Naypyidaw', time: 'Today · 08:31', day: 'today', status: 'Paid', payment: 'Card', items: [
      { name: 'Ceramic cup', qty: 4, price: 14 }, { name: 'Filter papers', qty: 2, price: 6 }] },
    { id: 1044, channel: 'Facebook', customer: 'Hnin Su', city: 'Yangon', time: 'Today · 08:02', day: 'today', status: 'Packing', payment: 'Transfer', items: [
      { name: 'Cold brew bottle', qty: 3, price: 9 }, { name: 'Milk pitcher', qty: 1, price: 18 }] },
    { id: 1043, channel: 'Shop', customer: 'Kyaw Zin', city: 'Mandalay', time: 'Today · 07:40', day: 'today', status: 'Shipped', payment: 'Cash', items: [
      { name: 'Espresso beans 1kg', qty: 1, price: 22 }, { name: 'Grinder', qty: 1, price: 65 }] },
    { id: 1042, channel: 'Website', customer: 'Daw Khin Mar', city: 'Yangon', time: 'Today · 07:12', day: 'today', status: 'Shipped', payment: 'Card', items: [
      { name: 'Milk pitcher', qty: 2, price: 18 }, { name: 'Filter papers', qty: 3, price: 6 }, { name: 'Tote bag', qty: 1, price: 12 }] },
    { id: 1041, channel: 'Facebook', customer: 'Thiri Win', city: 'Yangon', time: 'Yesterday · 16:20', day: 'yesterday', status: 'Delivered', payment: 'Card', items: [
      { name: 'Tea sampler', qty: 1, price: 26 }, { name: 'Espresso beans 1kg', qty: 1, price: 22 }, { name: 'Ceramic cup', qty: 2, price: 14 }] },
    { id: 1040, channel: 'Website', customer: 'U Min Thu', city: 'Yangon', time: 'Yesterday · 14:05', day: 'yesterday', status: 'Delivered', payment: 'Card', items: [
      { name: 'Grinder', qty: 1, price: 65 }, { name: 'Cold brew bottle', qty: 2, price: 9 }] },
    { id: 1039, channel: 'Shop', customer: 'Daw Sandar Aye', city: 'Mandalay', time: 'Yesterday · 11:48', day: 'yesterday', status: 'Returned', payment: 'Cash', items: [
      { name: 'Espresso beans 1kg', qty: 3, price: 22 }, { name: 'Filter papers', qty: 1, price: 6 }] }
  ];

  const state = { search: '', status: 'All' };

  const orderTotal = order => order.items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const initials = name => String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2)
    .map(word => word.replace(/[^A-Za-z]/g, '').charAt(0)).join('').toUpperCase() || '?';

  function avatarClass(index) {
    return index % 4 === 0 ? '' : ` app-avatar--${(index % 4) + 1}`;
  }

  function orderRow(order) {
    const index = orders.indexOf(order);
    const next = NEXT[order.status];
    const first = order.items[0];
    return `<tr>
      <td>
        <div class="app-person__name">#${order.id}</div>
        <div class="app-person__sub">${esc(order.time)}</div>
      </td>
      <td>${status(order.channel, CHANNEL_TONE[order.channel] || 'neutral')}</td>
      <td>
        <div class="app-person">
          <span class="app-avatar${avatarClass(index)}">${esc(initials(order.customer))}</span>
          <div>
            <div class="app-person__name">${esc(order.customer)}</div>
            <div class="app-person__sub">${esc(order.city)}</div>
          </div>
        </div>
      </td>
      <td>
        <div class="app-person__name">${order.items.length} item${order.items.length === 1 ? '' : 's'}</div>
        <div class="app-person__sub">${esc(first.name)}${order.items.length > 1 ? ` +${order.items.length - 1}` : ''}</div>
      </td>
      <td class="num">${money(orderTotal(order))}</td>
      <td>${status(order.status, STATUS_TONE[order.status] || 'neutral')}</td>
      <td class="actions">
        <button class="link-btn" type="button" data-open="${order.id}">Open</button>
        ${next ? `<button class="link-btn" type="button" data-fulfil="${order.id}">Fulfil</button>` : ''}
      </td>
    </tr>`;
  }

  function renderKpis() {
    const today = orders.filter(order => order.day === 'today');
    const revenue = today.reduce((sum, order) => sum + orderTotal(order), 0);
    const awaiting = orders.filter(order => AWAITING.includes(order.status));
    const paid = awaiting.filter(order => order.status === 'Paid').length;
    const packing = awaiting.filter(order => order.status === 'Packing').length;

    $('#kpiOrders').textContent = String(today.length);
    $('#kpiOrdersMeta').innerHTML = '<span class="app-delta">+16.7%</span> vs yesterday';
    $('#kpiRevenue').textContent = money(revenue, { compact: true });
    $('#kpiRevenueMeta').innerHTML = `avg ${money(revenue / Math.max(1, today.length))} per order`;
    $('#kpiAwaiting').textContent = String(awaiting.length);
    $('#kpiAwaitingMeta').textContent = `${paid} paid · ${packing} packing`;
    $('#kpiReturn').textContent = '4.8%';
    $('#kpiReturnMeta').textContent = '30-day rolling · 3 returns';

    $('#orderCount').textContent = `${orders.length} records`;
    $('#lowStockCount').textContent = `${LOW_STOCK.length} SKUs`;
    $('#channelRows').innerHTML = CHANNELS.map(channel =>
      `<div class="app-row"><span>${esc(channel.name)} · ${esc(channel.share)}</span><b class="num">${money(channel.usd, { compact: true })}</b></div>`).join('');
    $('#lowStockRows').innerHTML = LOW_STOCK.map(product =>
      `<div class="app-row"><span>${esc(product.name)}<br>${status(product.label, product.tone)}</span><b>${product.qty === 0 ? 'Out' : `${product.qty} left`}</b></div>`).join('');
  }

  function renderTable() {
    const query = state.search.trim().toLowerCase();
    const filtered = orders.filter(order => {
      const statusOk = state.status === 'All' || order.status === state.status;
      if (!statusOk) return false;
      if (!query) return true;
      const itemNames = order.items.map(item => item.name).join(' ');
      return `#${order.id} ${order.customer} ${order.city} ${order.channel} ${order.status} ${itemNames}`.toLowerCase().includes(query);
    });
    $('#orderBody').innerHTML = filtered.length
      ? filtered.map(orderRow).join('')
      : '<tr><td colspan="7" class="app-table__empty">No orders match this search and status filter.</td></tr>';
    $('#orderResult').textContent = `Showing ${filtered.length} of ${orders.length} orders`;
    $$('#statusFilters .app-chip').forEach(chip => {
      const active = chip.dataset.status === state.status;
      chip.classList.toggle('is-active', active);
      chip.setAttribute('aria-pressed', String(active));
    });
  }

  function render() {
    renderKpis();
    renderTable();
  }

  function fulfilOrder(id, fromDrawer = false) {
    const order = orders.find(item => item.id === id);
    if (!order) return;
    const next = NEXT[order.status];
    if (!next) {
      toast(`Order #${order.id} has no further fulfilment step.`, 'warn');
      return;
    }
    order.status = next;
    if (fromDrawer) closeDrawer();
    render();
    toast(`Order #${order.id} marked ${next} · ${money(orderTotal(order))}`, 'ok');
  }

  function drawerMoney(value) {
    return `<b data-usd="${value}">${money(value)}</b>`;
  }

  function openOrder(id) {
    const order = orders.find(item => item.id === id);
    if (!order) return;
    const subtotal = orderTotal(order);
    const timeline = ['Order placed', 'Payment captured'];
    if (['Packing', 'Shipped', 'Delivered'].includes(order.status)) timeline.push('Packing started');
    if (['Shipped', 'Delivered'].includes(order.status)) timeline.push('Handed to courier');
    if (order.status === 'Delivered') timeline.push('Delivered');
    if (order.status === 'Returned') timeline.push('Return requested');
    const times = [order.time.replace(' · ', ' '), 'sample', 'sample', 'sample', 'sample', 'sample'];

    const body = `
      <div class="app-rows">
        <div class="app-row"><span>Customer</span><b>${esc(order.customer)} · ${esc(order.city)}</b></div>
        <div class="app-row"><span>Channel</span><b>${status(order.channel, CHANNEL_TONE[order.channel] || 'neutral')}</b></div>
        <div class="app-row"><span>Status</span><b>${status(order.status, STATUS_TONE[order.status] || 'neutral')}</b></div>
        <div class="app-row"><span>Placed</span><b>${esc(order.time)}</b></div>
        <div class="app-row"><span>Payment</span><b>${esc(order.payment)} · sample</b></div>
      </div>
      <div class="app-panel__title">Items <small>${order.items.length}</small></div>
      <div class="app-rows">
        ${order.items.map(item => `<div class="app-row"><span>${esc(item.name)} × ${item.qty}</span>${drawerMoney(item.qty * item.price)}</div>`).join('')}
      </div>
      <div class="app-rows">
        <div class="app-row"><span>Subtotal</span>${drawerMoney(subtotal)}</div>
        <div class="app-row"><span>Shipping</span><b>Free · sample</b></div>
        <div class="app-row"><span>Total</span>${drawerMoney(subtotal)}</div>
      </div>
      <div class="app-panel__title">Fulfilment</div>
      <div class="app-activity">
        ${timeline.map((step, index) => `<div class="app-activity__item"><span class="app-activity__dot"></span><div>${esc(step)}</div><span class="app-activity__time">${esc(times[index] || 'sample')}</span></div>`).join('')}
      </div>
      <div class="app-note"><b>Sample only.</b> Order details and payments are illustrative; no order is charged or shipped.</div>`;

    const next = NEXT[order.status];
    openDrawer({
      title: `Order #${order.id} · ${order.customer}`,
      body,
      footer: `<button class="app-btn app-btn--secondary" type="button" data-close>Close</button>
               ${next ? `<button class="app-btn app-btn--primary" type="button" data-drawer-fulfil>${next === 'Delivered' ? 'Mark delivered' : `Mark ${next.toLowerCase()}`}</button>` : ''}`,
      onMount(overlay) {
        $('[data-close]', overlay).addEventListener('click', closeDrawer);
        const fulfilBtn = $('[data-drawer-fulfil]', overlay);
        if (fulfilBtn) fulfilBtn.addEventListener('click', () => fulfilOrder(order.id, true));
      }
    });
  }

  function exportOrders() {
    const rows = [['Order', 'Channel', 'Customer', 'City', 'Items', 'Total (USD)', 'Status', 'Payment', 'Placed']];
    orders.forEach(order => rows.push([
      `#${order.id}`, order.channel, order.customer, order.city,
      order.items.map(item => `${item.name} x${item.qty}`).join('; '),
      orderTotal(order), order.status, order.payment, order.time
    ]));
    exportCSV('ecommerce-orders.csv', rows);
  }

  function wire() {
    $('#orderSearch').addEventListener('input', event => {
      state.search = event.target.value;
      renderTable();
    });
    $('#statusFilters').addEventListener('click', event => {
      const chip = event.target.closest('[data-status]');
      if (!chip) return;
      state.status = chip.dataset.status;
      renderTable();
    });
    $('[data-export-orders]').addEventListener('click', exportOrders);
    $('#orderBody').addEventListener('click', event => {
      const openBtn = event.target.closest('[data-open]');
      if (openBtn) { openOrder(Number(openBtn.dataset.open)); return; }
      const fulfilBtn = event.target.closest('[data-fulfil]');
      if (fulfilBtn) fulfilOrder(Number(fulfilBtn.dataset.fulfil));
    });
  }

  ready(() => {
    wire();
    render();
    App.onCurrency(render);
  });
})();
