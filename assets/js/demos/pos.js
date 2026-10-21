/* POS demo — sample data, USD base, display currency conversion. */
(() => {
  'use strict';
  const { money, onCurrency, toast, openDrawer, closeDrawer, chartBars } = window.EBSApp;

  const products = [
    { id: 'rice50', name: 'Rice · 50 kg bag', unit: 'bag', price: 100, cat: 'staples' },
    { id: 'rice25', name: 'Rice · 25 kg bag', unit: 'bag', price: 52, cat: 'staples' },
    { id: 'beans', name: 'Beans · 1 pyi', unit: 'pyi', price: 13.5, cat: 'staples' },
    { id: 'palm', name: 'Palm oil · 1 viss', unit: 'viss', price: 20, cat: 'oils' },
    { id: 'cook', name: 'Cooking oil · 1 L', unit: 'bottle', price: 4.6, cat: 'oils' },
    { id: 'sugar', name: 'Sugar · 1 kg', unit: 'kg', price: 2, cat: 'grocery' },
    { id: 'salt', name: 'Salt · 1 kg', unit: 'kg', price: 1.2, cat: 'grocery' },
    { id: 'delivery', name: 'Delivery · local', unit: 'service', price: 2.5, cat: 'service' }
  ];

  const recent = [
    { id: '1042', time: '09:48', items: 2, amount: 104, payment: 'Cash', status: 'Paid' },
    { id: '1041', time: '09:32', items: 4, amount: 162.5, payment: 'Bank transfer', status: 'Paid' },
    { id: '1040', time: '09:18', items: 1, amount: 20, payment: 'Cash', status: 'Paid' },
    { id: '1039', time: '09:02', items: 6, amount: 238, payment: 'Credit', status: 'Credit' }
  ];

  const state = { category: 'all', cart: new Map(), sales: 8420, tx: 142, refunds: 124, recent };

  const $ = sel => document.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const cartList = $('#posCartList');
  const cartCount = $('#posCartCount');
  const totalEl = $('#posTotal');
  const productGrid = $('#posProducts');

  const totals = () => {
    let qty = 0;
    let sum = 0;
    state.cart.forEach(item => { qty += item.qty; sum += item.price * item.qty; });
    return { qty, sum };
  };

  function renderProducts() {
    const list = products.filter(p => state.category === 'all' || p.cat === state.category);
    productGrid.innerHTML = list.map(p => `
      <button class="pos-tile" type="button" data-id="${p.id}">
        <span class="pos-tile__name">${p.name}</span>
        <span class="pos-tile__unit">${p.unit}</span>
        <span class="pos-tile__price">${money(p.price)}</span>
      </button>`).join('');
  }

  function renderCart() {
    const { qty, sum } = totals();
    cartCount.textContent = `${qty} ${qty === 1 ? 'item' : 'items'}`;
    totalEl.textContent = money(sum);
    if (!state.cart.size) {
      cartList.innerHTML = '<div class="pos-cart__empty">Tap a product to start a sale.</div>';
      return;
    }
    cartList.innerHTML = '';
    state.cart.forEach((item, id) => {
      const row = document.createElement('div');
      row.className = 'pos-cart__row';
      row.innerHTML = `<span class="pos-cart__name">${item.name}</span>
        <span class="pos-cart__qty"><button type="button" data-act="dec" data-id="${id}" aria-label="Decrease ${item.name}">−</button><span>${item.qty}</span><button type="button" data-act="inc" data-id="${id}" aria-label="Increase ${item.name}">+</button></span>
        <span class="pos-cart__line">${money(item.price * item.qty)}</span>`;
      cartList.appendChild(row);
    });
  }

  function renderRecent() {
    const body = $('#recentSalesBody');
    body.innerHTML = state.recent.map(s => `
      <tr>
        <td class="strong">#${s.id}</td>
        <td class="muted">${s.time}</td>
        <td>${s.items}</td>
        <td class="num">${money(s.amount)}</td>
        <td>${s.payment}</td>
        <td>${window.EBSApp.status(s.status === 'Paid' ? 'Paid' : s.status, s.status === 'Paid' ? 'ok' : 'info')}</td>
      </tr>`).join('');
    $('#shiftTotal').textContent = `Shift total ${money(state.recent.reduce((sum, s) => sum + s.amount, 0))}`;
  }

  function renderKpis() {
    $('#kpiSales').textContent = money(state.sales, { compact: true });
    $('#kpiTx').textContent = state.tx;
    $('#kpiAvg').textContent = money(state.sales / state.tx);
    $('#kpiRefunds').textContent = money(state.refunds);
  }

  function renderShift() {
    const cash = state.recent.filter(s => s.payment === 'Cash').reduce((sum, s) => sum + s.amount, 0);
    const bank = state.recent.filter(s => s.payment === 'Bank transfer').reduce((sum, s) => sum + s.amount, 0);
    const card = state.recent.filter(s => s.payment === 'Card').reduce((sum, s) => sum + s.amount, 0);
    $('#shiftRows').innerHTML = `
      <div class="app-row"><span>Opening float</span><b class="num">${money(200)}</b></div>
      <div class="app-row"><span>Cash sales</span><b class="num">${money(cash)}</b></div>
      <div class="app-row"><span>Bank / card</span><b class="num">${money(bank + card)}</b></div>
      <div class="app-row"><span>Expected drawer</span><b class="num">${money(200 + cash)}</b></div>`;
    $('#shiftChart').innerHTML = chartBars([28, 46, 38, 62, 54, 76, 60, 84], ['9a', '10a', '11a', '12p', '1p', '2p', '3p', '4p']);
  }

  function receipt(lines, sum) {
    openDrawer({
      title: 'Receipt · demo',
      body: `<div class="pos-receipt">
        <div class="pos-receipt__line"><span>EBS Demo Store</span><span>${new Date().toLocaleDateString('en-GB')}</span></div>
        <div class="pos-receipt__line"><span>Counter 1 · demo</span><span>Cashier: sample</span></div>
        <div class="pos-receipt__line" style="border-top:1px dashed var(--app-line-2);padding-top:8px;margin-top:8px"><span>${lines}</span></div>
        <div class="pos-receipt__total"><span>Total</span><span>${money(sum)}</span></div>
        <div class="pos-receipt__line"><span>Payment</span><span>${$('#posPayment').value}</span></div>
        <div class="pos-receipt__line"><span>Currency</span><span>${window.EBSMoney.get()} · display only</span></div>
      </div>`,
      footer: '<button class="app-btn app-btn--secondary" type="button" data-close>Close</button><button class="app-btn app-btn--primary" type="button" id="printReceipt">Print receipt</button>',
      onMount(overlay) {
        overlay.querySelector('[data-close]').addEventListener('click', closeDrawer);
        overlay.querySelector('#printReceipt').addEventListener('click', () => toast('Print is simulated in this demo.', 'ok'));
      }
    });
  }

  function charge() {
    const { qty, sum } = totals();
    if (!qty) { toast('Add a product to the sale first.', 'warn'); return; }
    const lines = Array.from(state.cart.values()).map(item => `${item.qty} × ${item.name} — ${money(item.price * item.qty)}`).join('<br>');
    const next = String(Math.max(...state.recent.map(s => Number(s.id))) + 1);
    state.recent.unshift({ id: next, time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), items: qty, amount: sum, payment: $('#posPayment').value, status: $('#posPayment').value === 'Credit' ? 'Credit' : 'Paid' });
    state.sales += sum;
    state.tx += 1;
    state.cart.clear();
    renderAll();
    receipt(lines, sum);
    toast(`Sale complete · ${money(sum)} · receipt #${next}`, 'ok');
  }

  function renderAll() {
    renderProducts();
    renderCart();
    renderRecent();
    renderKpis();
    renderShift();
  }

  $$('[data-cat]').forEach(button => {
    button.addEventListener('click', () => {
      state.category = button.dataset.cat;
      $$('[data-cat]').forEach(b => b.classList.toggle('is-active', b === button));
      renderProducts();
    });
  });

  productGrid.addEventListener('click', event => {
    const tile = event.target.closest('[data-id]');
    if (!tile) return;
    const product = products.find(p => p.id === tile.dataset.id);
    if (!product) return;
    const item = state.cart.get(product.id) || { ...product, qty: 0 };
    item.qty += 1;
    state.cart.set(product.id, item);
    renderCart();
  });

  cartList.addEventListener('click', event => {
    const button = event.target.closest('[data-act]');
    if (!button) return;
    const item = state.cart.get(button.dataset.id);
    if (!item) return;
    if (button.dataset.act === 'inc') item.qty += 1;
    else item.qty -= 1;
    if (item.qty <= 0) state.cart.delete(button.dataset.id);
    renderCart();
  });

  $('#chargeBtn').addEventListener('click', charge);
  $('#clearCartBtn').addEventListener('click', () => { state.cart.clear(); renderCart(); toast('Sale cleared.', 'ok'); });
  $('#newSaleBtn').addEventListener('click', () => { state.cart.clear(); renderCart(); toast('New sale started.', 'ok'); });
  $('#printShiftBtn').addEventListener('click', () => {
    const cash = state.recent.filter(s => s.payment === 'Cash').reduce((sum, s) => sum + s.amount, 0);
    openDrawer({
      title: 'Shift summary · demo',
      body: `<div class="app-rows">
        <div class="app-row"><span>Sales today</span><b>${money(state.sales)}</b></div>
        <div class="app-row"><span>Transactions</span><b>${state.tx}</b></div>
        <div class="app-row"><span>Cash in drawer</span><b>${money(200 + cash)}</b></div>
        <div class="app-row"><span>Refunds</span><b>${money(state.refunds)}</b></div>
      </div><p class="app-note" style="margin-top:12px">Shift summary is sample data for demonstration only.</p>`,
      footer: '<button class="app-btn app-btn--secondary" type="button" data-close>Close</button>'
    });
    document.querySelector('.app-overlay [data-close]').addEventListener('click', closeDrawer);
    toast('Shift summary opened.', 'ok');
  });

  onCurrency(renderAll);
  renderAll();
})();
