/* ==========================================================================
   Analytics & BI demo — sample dataset, USD base, display currency via EBSApp
   ========================================================================== */
(() => {
  'use strict';

  const { $, $$, ready, money, status, esc, toast, openDrawer, closeDrawer, exportCSV, chartBars, sparkline, onCurrency } = window.EBSApp;

  /* ── sample period datasets (all money in USD) ───────────────────────── */
  const PERIODS = {
    '7': {
      days: '7 days',
      compare: 'previous 7 days',
      bucket: 'day',
      revenue: 286400,
      orders: 1042,
      margin: 39.2,
      deltas: { revenue: 8.4, margin: 0.6, orders: 5.2, aov: 3.1 },
      series: [34800, 36200, 38100, 39400, 42600, 46800, 48500],
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      channels: [
        { name: 'Direct sales', revShare: 0.42, orderShare: 0.44, conversion: '3.4%' },
        { name: 'Partner resellers', revShare: 0.31, orderShare: 0.30, conversion: '2.8%' },
        { name: 'Website store', revShare: 0.19, orderShare: 0.20, conversion: '1.9%' },
        { name: 'Field team', revShare: 0.08, orderShare: 0.06, conversion: '4.1%' }
      ]
    },
    '30': {
      days: '30 days',
      compare: 'previous 30 days',
      bucket: 'week',
      revenue: 1284600,
      orders: 4820,
      margin: 38.4,
      deltas: { revenue: 12.6, margin: 1.4, orders: 9.8, aov: 2.6 },
      series: [232400, 248600, 256800, 268400, 278400],
      labels: ['W1', 'W2', 'W3', 'W4', 'W5'],
      channels: [
        { name: 'Direct sales', revShare: 0.42, orderShare: 0.44, conversion: '3.2%' },
        { name: 'Partner resellers', revShare: 0.31, orderShare: 0.30, conversion: '2.7%' },
        { name: 'Website store', revShare: 0.19, orderShare: 0.20, conversion: '1.8%' },
        { name: 'Field team', revShare: 0.08, orderShare: 0.06, conversion: '3.9%' }
      ]
    },
    '90': {
      days: '90 days',
      compare: 'previous 90 days',
      bucket: 'week',
      revenue: 3742000,
      orders: 14240,
      margin: 37.6,
      deltas: { revenue: 18.2, margin: 1.9, orders: 16.4, aov: 1.5 },
      series: [278400, 286200, 294800, 302400, 298600, 306800, 312400, 318600, 324200, 331800, 338400, 349400],
      labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'],
      channels: [
        { name: 'Direct sales', revShare: 0.41, orderShare: 0.43, conversion: '3.0%' },
        { name: 'Partner resellers', revShare: 0.32, orderShare: 0.31, conversion: '2.6%' },
        { name: 'Website store', revShare: 0.19, orderShare: 0.20, conversion: '1.7%' },
        { name: 'Field team', revShare: 0.08, orderShare: 0.06, conversion: '3.7%' }
      ]
    }
  };

  const CATEGORY_COLORS = {
    Software: '#1e40af',
    Hardware: '#2563eb',
    Services: '#60a5fa',
    Subscriptions: '#93c5fd'
  };

  const PRODUCTS = [
    {
      id: 'printer', name: 'Thermal printer TP-80', category: 'Hardware', watched: false,
      spark: [42, 51, 47, 58, 62, 71, 68],
      m: { '7': { units: 156, revenue: 62400, margin: 33.5 }, '30': { units: 671, revenue: 268400, margin: 33.1 }, '90': { units: 1956, revenue: 782400, margin: 32.4 } }
    },
    {
      id: 'scanner', name: 'Barcode scanner BS-2', category: 'Hardware', watched: false,
      spark: [38, 44, 49, 46, 52, 57, 61],
      m: { '7': { units: 191, revenue: 38200, margin: 36.2 }, '30': { units: 824, revenue: 164800, margin: 35.8 }, '90': { units: 2423, revenue: 484600, margin: 35.1 } }
    },
    {
      id: 'pos-core', name: 'EBS POS Core licence', category: 'Software', watched: true,
      spark: [58, 62, 60, 68, 72, 75, 79],
      m: { '7': { units: 106, revenue: 84800, margin: 54.6 }, '30': { units: 483, revenue: 386200, margin: 54.1 }, '90': { units: 1409, revenue: 1126800, margin: 53.6 } }
    },
    {
      id: 'inventory', name: 'EBS Inventory add-on', category: 'Software', watched: false,
      spark: [44, 48, 52, 50, 57, 61, 64],
      m: { '7': { units: 104, revenue: 41600, margin: 49.2 }, '30': { units: 482, revenue: 192600, margin: 48.8 }, '90': { units: 1403, revenue: 561200, margin: 48.1 } }
    },
    {
      id: 'installation', name: 'On-site installation', category: 'Services', watched: false,
      spark: [31, 35, 33, 39, 42, 44, 48],
      m: { '7': { units: 109, revenue: 21800, margin: 44.8 }, '30': { units: 492, revenue: 98400, margin: 44.2 }, '90': { units: 1442, revenue: 288400, margin: 43.5 } }
    },
    {
      id: 'training', name: 'Staff training workshop', category: 'Services', watched: false,
      spark: [22, 25, 24, 28, 30, 31, 34],
      m: { '7': { units: 84, revenue: 12600, margin: 46.1 }, '30': { units: 379, revenue: 56800, margin: 45.6 }, '90': { units: 1099, revenue: 164800, margin: 44.9 } }
    },
    {
      id: 'care-std', name: 'Care plan — Standard', category: 'Subscriptions', watched: true,
      spark: [48, 52, 51, 55, 59, 62, 66],
      m: { '7': { units: 164, revenue: 16400, margin: 61.4 }, '30': { units: 746, revenue: 74600, margin: 60.8 }, '90': { units: 2186, revenue: 218600, margin: 60.1 } }
    },
    {
      id: 'care-prem', name: 'Care plan — Premium', category: 'Subscriptions', watched: false,
      spark: [26, 28, 30, 29, 33, 36, 39],
      m: { '7': { units: 43, revenue: 8600, margin: 65.2 }, '30': { units: 214, revenue: 42800, margin: 64.6 }, '90': { units: 576, revenue: 115200, margin: 63.8 } }
    }
  ];

  const state = { period: '30', query: '', category: 'all', activity: [
    { time: '10:18', html: 'Weekly revenue report generated · <b>30 days</b>' },
    { time: '09:52', html: 'Margin alert reviewed — <b>Hardware</b> category' },
    { time: '09:20', html: 'Sample dataset refreshed from the demo catalogue' }
  ] };

  const period = () => PERIODS[state.period];
  const aov = () => (period().orders ? period().revenue / period().orders : 0);

  function visibleProducts() {
    const query = state.query.trim().toLowerCase();
    return PRODUCTS.filter(product => {
      if (state.category !== 'all' && product.category !== state.category) return false;
      if (!query) return true;
      return `${product.name} ${product.category}`.toLowerCase().includes(query);
    });
  }

  function categoryMix() {
    const groups = new Map();
    PRODUCTS.forEach(product => {
      const revenue = product.m[state.period].revenue;
      groups.set(product.category, (groups.get(product.category) || 0) + revenue);
    });
    const total = Array.from(groups.values()).reduce((sum, value) => sum + value, 0) || 1;
    return Array.from(groups.entries())
      .map(([name, value]) => ({ name, value, share: (value / total) * 100, color: CATEGORY_COLORS[name] || '#93c5fd' }))
      .sort((a, b) => b.value - a.value);
  }

  function donutSvg(mix) {
    let offset = 0;
    const segments = mix.map(item => {
      const dash = item.share;
      const circle = `<circle cx="21" cy="21" r="15.915" fill="none" stroke="${item.color}" stroke-width="6.5" stroke-dasharray="${dash.toFixed(2)} ${(100 - dash).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}"/>`;
      offset += dash;
      return circle;
    }).join('');
    return `<svg viewBox="0 0 42 42" width="132" height="132" role="img" aria-label="Revenue share by category" ><g transform="rotate(-90 21 21)">${segments}</g></svg>`;
  }

  function legendSwatch(color) {
    return `<svg viewBox="0 0 10 10" width="9" height="9" aria-hidden="true"><rect width="10" height="10" rx="2" fill="${color}"/></svg>`;
  }

  function pushActivity(html) {
    const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    state.activity.unshift({ time, html });
    if (state.activity.length > 10) state.activity.pop();
  }

  const deltaText = (value, suffix) => `${value >= 0 ? '+' : ''}${value}${suffix}`;

  /* ── renderers ───────────────────────────────────────────────────────── */
  function renderKpis() {
    const data = period();
    $('[data-kpi="revenue"]').textContent = money(data.revenue, { compact: true });
    $('[data-kpi="margin"]').textContent = `${data.margin.toFixed(1)}%`;
    $('[data-kpi="orders"]').textContent = data.orders.toLocaleString('en-US');
    $('[data-kpi="aov"]').textContent = money(aov());

    $('[data-kpi-label="revenue"]').textContent = `Revenue · ${data.days}`;
    $('[data-kpi-label="orders"]').textContent = `Orders · ${data.days}`;
    $('[data-delta="revenue"]').textContent = deltaText(data.deltas.revenue, '%');
    $('[data-delta="margin"]').textContent = deltaText(data.deltas.margin, ' pts');
    $('[data-delta="orders"]').textContent = deltaText(data.deltas.orders, '%');
    $('[data-delta="aov"]').textContent = deltaText(data.deltas.aov, '%');
    $$('[data-compare]').forEach(element => {
      element.textContent = `vs ${data.compare}`;
    });
    $$('[data-period-badge]').forEach(element => { element.textContent = data.days; });
    $$('[data-period-label]').forEach(element => { element.textContent = `last ${data.days}`; });
    $('[data-watch-count]').textContent = `${PRODUCTS.filter(product => product.watched).length} watched`;
  }

  function renderTable() {
    const rows = visibleProducts();
    const tbody = $('[data-rows]');
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="app-table__empty">No products match this search and category filter.</td></tr>';
    } else {
      tbody.innerHTML = rows.map(product => {
        const metrics = product.m[state.period];
        return `<tr>
          <td>
            <div class="app-person__name">${esc(product.name)}</div>
            <div class="app-person__sub">${esc(product.category)}</div>
          </td>
          <td class="num">${metrics.units.toLocaleString('en-US')}</td>
          <td class="num">${money(metrics.revenue)}</td>
          <td class="num">${metrics.margin.toFixed(1)}%</td>
          <td>${sparkline(product.spark)}</td>
          <td class="actions">
            <button class="link-btn" type="button" data-action="watch" data-id="${esc(product.id)}" aria-pressed="${product.watched}">${product.watched ? 'Watching' : 'Watch'}</button>
            <button class="link-btn" type="button" data-action="details" data-id="${esc(product.id)}">Details</button>
          </td>
        </tr>`;
      }).join('');
    }
    const total = PRODUCTS.length;
    $('[data-table-foot]').textContent = `${rows.length} of ${total} products · ${period().days} · sample catalogue`;
    $('[data-watch-count]').textContent = `${PRODUCTS.filter(product => product.watched).length} watched`;
  }

  function renderChart() {
    const data = period();
    $('[data-chart]').innerHTML = chartBars(data.series, data.labels);
    const bestValue = Math.max(...data.series);
    const bestLabel = data.labels[data.series.indexOf(bestValue)];
    $('[data-chart-rows]').innerHTML = `
      <div class="app-row"><span>Total revenue</span><b class="num">${money(data.revenue)}</b></div>
      <div class="app-row"><span>Best ${data.bucket}</span><b>${esc(bestLabel)} · ${money(bestValue)}</b></div>
      <div class="app-row"><span>Growth · ${data.compare}</span><b class="app-delta">${deltaText(data.deltas.revenue, '%')}</b></div>`;
  }

  function renderMix() {
    const mix = categoryMix();
    $('[data-donut]').innerHTML = donutSvg(mix);
    $('[data-legend]').innerHTML = mix.map(item =>
      `<div class="app-row">
        <div class="app-person">${legendSwatch(item.color)}<span>${esc(item.name)} · ${item.share.toFixed(1)}%</span></div>
        <b class="num">${money(item.value, { compact: true })}</b>
      </div>`).join('');
    $('[data-mix-badge]').textContent = `${mix.length} categories`;
    $('[data-mix-badge]').setAttribute('title', `Top category: ${mix[0] ? mix[0].name : 'n/a'}`);
  }

  function renderChannels() {
    const data = period();
    $('[data-channels]').innerHTML = data.channels.map(channel => {
      const revenue = Math.round(data.revenue * channel.revShare);
      const orders = Math.round(data.orders * channel.orderShare);
      return `<div class="app-row">
        <span>${esc(channel.name)} · ${orders.toLocaleString('en-US')} orders ${status(channel.conversion, 'neutral')}</span>
        <b class="num">${money(revenue)}</b>
      </div>`;
    }).join('');
  }

  function renderActivity() {
    $('[data-activity]').innerHTML = state.activity.slice(0, 6).map(item => `<div class="app-activity__item">
      <span class="app-activity__dot"></span>
      <div>${item.html}</div>
      <span class="app-activity__time">${esc(item.time)}</span>
    </div>`).join('');
  }

  function render() {
    renderKpis();
    renderTable();
    renderChart();
    renderMix();
    renderChannels();
    renderActivity();
  }

  /* ── mutations & drawer ──────────────────────────────────────────────── */
  function toggleWatch(product) {
    product.watched = !product.watched;
    if (product.watched) {
      pushActivity(`Added <b>${esc(product.name)}</b> to the watchlist`);
      toast(`Added ${product.name} to the watchlist.`, 'ok');
    } else {
      pushActivity(`Removed <b>${esc(product.name)}</b> from the watchlist`);
      toast(`Removed ${product.name} from the watchlist.`, 'warn');
    }
    render();
  }

  function openProductDrawer(product) {
    const data = period();
    const metrics = product.m[state.period];
    const asp = metrics.units ? metrics.revenue / metrics.units : 0;
    openDrawer({
      title: product.name,
      body: `
        <p class="app-sub">${esc(product.category)} · ${data.days} · sample product record</p>
        <div class="app-rows">
          <div class="app-row"><span>Units sold</span><b>${metrics.units.toLocaleString('en-US')}</b></div>
          <div class="app-row"><span>Revenue</span><b class="num" data-usd="${metrics.revenue}">${money(metrics.revenue)}</b></div>
          <div class="app-row"><span>Gross margin</span><b>${metrics.margin.toFixed(1)}%</b></div>
          <div class="app-row"><span>Average selling price</span><b class="num" data-usd="${asp.toFixed(2)}">${money(asp)}</b></div>
          <div class="app-row"><span>Watchlist</span><b>${product.watched ? status('Watching', 'info') : status('Not watched', 'neutral')}</b></div>
        </div>
        <p class="app-label">Weekly trend</p>
        ${sparkline(product.spark)}
        <p class="app-note"><b>Sample product.</b> Figures belong to the illustrative dataset and do not represent a real catalogue.</p>
      `,
      footer: `
        <button class="app-btn app-btn--secondary" type="button" data-drawer-cancel>Close</button>
        <button class="app-btn app-btn--primary" type="button" data-watch-toggle>${product.watched ? 'Remove from watchlist' : 'Add to watchlist'}</button>
      `,
      onMount(overlay) {
        $('[data-drawer-cancel]', overlay).addEventListener('click', closeDrawer);
        $('[data-watch-toggle]', overlay).addEventListener('click', () => {
          toggleWatch(product);
          closeDrawer();
        });
      }
    });
  }

  function exportProducts() {
    const rows = [['Product', 'Category', 'Units', 'Revenue (USD)', 'Gross margin %', 'Watchlist']];
    visibleProducts().forEach(product => {
      const metrics = product.m[state.period];
      rows.push([product.name, product.category, metrics.units, metrics.revenue, metrics.margin, product.watched ? 'Yes' : 'No']);
    });
    exportCSV(`analytics-products-${state.period}d.csv`, rows);
    pushActivity(`Exported <b>${rows.length - 1} product rows</b> · ${period().days}`);
    render();
  }

  /* ── wiring ──────────────────────────────────────────────────────────── */
  function init() {
    $('[data-period-chips]').addEventListener('click', event => {
      const chip = event.target.closest('[data-period]');
      if (!chip || chip.dataset.period === state.period) return;
      state.period = chip.dataset.period;
      $$('[data-period-chips] .app-chip').forEach(item => item.classList.toggle('is-active', item === chip));
      render();
    });

    $('[data-search]').addEventListener('input', event => {
      state.query = event.target.value;
      renderTable();
    });

    $('[data-category-chips]').addEventListener('click', event => {
      const chip = event.target.closest('[data-category]');
      if (!chip) return;
      state.category = chip.dataset.category;
      $$('[data-category-chips] .app-chip').forEach(item => item.classList.toggle('is-active', item === chip));
      renderTable();
    });

    $('[data-rows]').addEventListener('click', event => {
      const button = event.target.closest('[data-action]');
      if (!button) return;
      const product = PRODUCTS.find(item => item.id === button.dataset.id);
      if (!product) return;
      if (button.dataset.action === 'watch') toggleWatch(product);
      if (button.dataset.action === 'details') openProductDrawer(product);
    });

    $('[data-export-csv]').addEventListener('click', exportProducts);

    onCurrency(render);
    render();
  }

  ready(init);
})();
