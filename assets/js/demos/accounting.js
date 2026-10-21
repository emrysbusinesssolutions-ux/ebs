/* ==========================================================================
   Accounting & finance demo — sample ledger, USD base, display currency
   ========================================================================== */
(() => {
  'use strict';

  const { $, $$, ready, money, status, esc, toast, openDrawer, closeDrawer, exportCSV, chartBars, onCurrency } = window.EBSApp;

  /* ── sample state (all money in USD) ─────────────────────────────────── */
  const state = {
    tab: 'invoices',
    query: '',
    filter: 'all',
    revenue: 412800,
    expenses: 241650,
    cogs: 138900,
    cashOnHand: 186400,
    unlinkedPayments: 0,
    invoices: [
      { no: 'INV-1049', party: 'Aurora Retail', due: '30 Oct 2025', amount: 24000, status: 'Unpaid', bucket: 'current', terms: 'Net 30' },
      { no: 'INV-1042', party: 'Nova Clinics', due: '28 Oct 2025', amount: 16700, status: 'Unpaid', bucket: 'current', terms: 'Net 30' },
      { no: 'INV-1048', party: 'Golden Gate Foods', due: '10 Oct 2025', amount: 18600, status: 'Overdue', bucket: '1-30', terms: 'Net 15' },
      { no: 'INV-1046', party: 'Pearl Hospitality', due: '5 Sep 2025', amount: 9800, status: 'Overdue', bucket: '31-60', terms: 'Net 30' },
      { no: 'INV-1045', party: 'Brightline Media', due: '12 Aug 2025', amount: 15200, status: 'Overdue', bucket: '61-90', terms: 'Net 30' },
      { no: 'INV-1047', party: 'Saga Logistics', due: '22 Oct 2025', amount: 12400, status: 'Paid', bucket: '', terms: 'Net 30' },
      { no: 'INV-1044', party: 'Summit Trading', due: '15 Oct 2025', amount: 4300, status: 'Paid', bucket: '', terms: 'Net 15' },
      { no: 'INV-1043', party: 'Delta Works', due: '12 Oct 2025', amount: 9600, status: 'Paid', bucket: '', terms: 'Net 30' }
    ],
    bills: [
      { no: 'BILL-2041', party: 'CloudGate Hosting', due: '24 Oct 2025', amount: 3200, status: 'Due', terms: 'Net 15' },
      { no: 'BILL-2038', party: 'Meridian Utilities', due: '18 Oct 2025', amount: 2150, status: 'Overdue', terms: 'Net 7' },
      { no: 'BILL-2037', party: 'Fleet Fuel', due: '28 Oct 2025', amount: 1480, status: 'Scheduled', terms: 'Net 15' },
      { no: 'BILL-2040', party: 'Office Mart', due: '21 Oct 2025', amount: 1850, status: 'Paid', terms: 'Net 15' },
      { no: 'BILL-2039', party: 'Payroll Services Co', due: '20 Oct 2025', amount: 6400, status: 'Paid', terms: 'Net 7' }
    ],
    activity: [
      { time: '11:04', html: 'Invoice <b>INV-1047</b> marked paid — Saga Logistics', amount: 12400 },
      { time: '10:32', html: 'Payroll accrual posted for <b>October 2025</b>', amount: 18650 },
      { time: '09:48', html: 'Bill <b>BILL-2040</b> recorded — Office Mart', amount: 1850 },
      { time: '09:10', html: 'Invoice <b>INV-1042</b> issued — Nova Clinics', amount: 16700 }
    ]
  };

  const TONES = { Paid: 'ok', Unpaid: 'warn', Due: 'warn', Overdue: 'bad', Scheduled: 'info', Draft: 'neutral' };

  const entries = () => (state.tab === 'invoices' ? state.invoices : state.bills);
  const openInvoices = () => state.invoices.filter(item => item.status !== 'Paid');
  const openBills = () => state.bills.filter(item => item.status !== 'Paid');
  const receivables = () => Math.max(0, openInvoices().reduce((sum, item) => sum + item.amount, 0) - state.unlinkedPayments);
  const netProfit = () => state.revenue - state.expenses;
  const grossProfit = () => state.revenue - state.cogs;
  const margin = () => (state.revenue ? (netProfit() / state.revenue) * 100 : 0);

  function visibleEntries() {
    const query = state.query.trim().toLowerCase();
    return entries().filter(item => {
      if (state.filter === 'paid' && item.status !== 'Paid') return false;
      if (state.filter === 'overdue' && item.status !== 'Overdue') return false;
      if (state.filter === 'open' && item.status === 'Paid') return false;
      if (!query) return true;
      return `${item.no} ${item.party}`.toLowerCase().includes(query);
    });
  }

  function pushActivity(html, amount) {
    const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    state.activity.unshift({ time, html, amount });
    if (state.activity.length > 12) state.activity.pop();
  }

  /* ── renderers ───────────────────────────────────────────────────────── */
  function renderKpis() {
    $('[data-kpi="revenue"]').textContent = money(state.revenue, { compact: true });
    $('[data-kpi="expenses"]').textContent = money(state.expenses, { compact: true });
    $('[data-kpi="net"]').textContent = money(netProfit(), { compact: true });
    $('[data-kpi="receivables"]').textContent = money(receivables(), { compact: true });
    $('[data-kpi-meta="net"]').textContent = `Margin ${margin().toFixed(1)}% · sample ledger`;
    $('[data-kpi-meta="receivables"]').textContent = `${openInvoices().length} open invoices · sample ledger`;
    $('[data-margin-badge]').textContent = `Margin ${margin().toFixed(1)}%`;
  }

  function renderTable() {
    const rows = visibleEntries();
    const tbody = $('[data-rows]');
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="app-table__empty">No entries match this search and filter.</td></tr>';
    } else {
      tbody.innerHTML = rows.map(item => {
        const isInvoice = state.tab === 'invoices';
        const settled = item.status === 'Paid';
        let action;
        if (settled) {
          action = '<span class="muted">Settled</span>';
        } else if (isInvoice) {
          action = `<button class="link-btn" type="button" data-action="pay" data-id="${esc(item.no)}">Record payment</button>`;
        } else {
          action = `<button class="link-btn" type="button" data-action="settle" data-id="${esc(item.no)}">Mark paid</button>`;
        }
        return `<tr>
          <td class="strong">${esc(item.no)}</td>
          <td>
            <div class="app-person__name">${esc(item.party)}</div>
            <div class="app-person__sub">${isInvoice ? 'Receivable' : 'Payable'} · ${esc(item.terms)}</div>
          </td>
          <td class="muted">${esc(item.due)}</td>
          <td class="num">${money(item.amount)}</td>
          <td>${status(item.status, TONES[item.status] || 'neutral')}</td>
          <td class="actions">${action}</td>
        </tr>`;
      }).join('');
    }

    const count = rows.length;
    const total = entries().length;
    $('[data-ledger-count]').textContent = `${state.tab === 'invoices' ? '8' : '5'} entries`;
    $('[data-tab-count="invoices"]').textContent = String(state.invoices.length);
    $('[data-tab-count="bills"]').textContent = String(state.bills.length);
    $('[data-table-foot]').textContent = `${count} ${state.tab} shown of ${total} · sample data`;
  }

  function renderPnl() {
    const rows = [
      ['Revenue', state.revenue],
      ['Cost of goods sold', -state.cogs],
      ['Gross profit', grossProfit()],
      ['Operating expenses', -(state.expenses - state.cogs)],
      ['Net profit', netProfit()]
    ];
    $('[data-pnl]').innerHTML = rows.map(([label, value]) =>
      `<div class="app-row"><span>${label}</span><b class="num">${value < 0 ? '−' : ''}${money(Math.abs(value))}</b></div>`).join('');
  }

  function renderCash() {
    const values = [142000, 151800, 148600, 162400, 174900, state.cashOnHand];
    $('[data-cash-chart]').innerHTML = chartBars(values, ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct']);
    $('[data-cash-note]').textContent = money(state.cashOnHand);
    $('[data-cash-move]').textContent = `+${money(11500)}`;
  }

  function renderAging() {
    const buckets = [
      ['Current', 'current'],
      ['1–30 days', '1-30'],
      ['31–60 days', '31-60'],
      ['61–90 days', '61-90'],
      ['90+ days', '90+']
    ];
    let currentOffset = state.unlinkedPayments;
    $('[data-aging]').innerHTML = buckets.map(([label, key]) => {
      let value = openInvoices().filter(item => item.bucket === key).reduce((sum, item) => sum + item.amount, 0);
      if (key === 'current') {
        value = Math.max(0, value - currentOffset);
        currentOffset = 0;
      }
      return `<div class="app-row"><span>${label}</span><b class="num">${money(value)}</b></div>`;
    }).join('') +
      `<div class="app-row"><span>Total receivables</span><b class="num">${money(receivables())}</b></div>`;

    $('[data-open-count]').textContent = `${openInvoices().length} open invoices`;
  }

  function renderActivity() {
    $('[data-activity]').innerHTML = state.activity.slice(0, 7).map(item => `<div class="app-activity__item">
      <span class="app-activity__dot"></span>
      <div>${item.html}${item.amount != null ? ` · <b>${money(item.amount)}</b>` : ''}</div>
      <span class="app-activity__time">${esc(item.time)}</span>
    </div>`).join('');
  }

  function render() {
    renderKpis();
    renderTable();
    renderPnl();
    renderCash();
    renderAging();
    renderActivity();
  }

  /* ── drawer workflow ─────────────────────────────────────────────────── */
  function openEntryDrawer(prefill) {
    const invoice = prefill && prefill.invoice ? prefill.invoice : null;
    const today = '2025-10-21'; // sample period date
    openDrawer({
      title: invoice ? `Record payment — ${invoice.party}` : 'Record journal entry',
      body: `
        <p class="app-sub">${invoice
          ? `Settle <b>${esc(invoice.no)}</b> (<span data-usd="${invoice.amount}">${money(invoice.amount)}</span>) or post a manual entry. Marking it paid reduces receivables.`
          : 'Post a sample journal entry to the demo ledger. It updates the P&amp;L and receivables figures instantly.'}</p>
        <div class="app-form">
          <label class="app-field">
            <span class="app-label">Entry type</span>
            <select class="app-select" data-entry-type>
              <option value="expense"${invoice ? '' : ' selected'}>Expense</option>
              <option value="income">Income</option>
              <option value="payment"${invoice ? ' selected' : ''}>Payment received</option>
            </select>
          </label>
          <label class="app-field">
            <span class="app-label">Account</span>
            <select class="app-select" data-entry-account>
              <option>Accounts receivable</option>
              <option>Sales income</option>
              <option>Operating expenses</option>
              <option>Software &amp; subscriptions</option>
              <option>Payroll</option>
            </select>
          </label>
          <label class="app-field">
            <span class="app-label">Party</span>
            <input class="app-input" type="text" data-entry-party value="${invoice ? esc(invoice.party) : ''}" placeholder="Sample customer or supplier">
          </label>
          <label class="app-field">
            <span class="app-label">Amount (USD)</span>
            <input class="app-input" type="number" min="0" step="0.01" data-entry-amount value="${invoice ? invoice.amount : ''}" placeholder="0.00">
          </label>
          <label class="app-field">
            <span class="app-label">Entry date</span>
            <input class="app-input" type="date" data-entry-date value="${today}">
          </label>
          <label class="app-field">
            <span class="app-label">Reference</span>
            <input class="app-input" type="text" data-entry-ref value="${invoice ? esc(invoice.no) : ''}" placeholder="INV-0000 or memo ref">
          </label>
          <label class="app-field app-field--full">
            <span class="app-label">Memo</span>
            <textarea class="app-textarea" data-entry-memo placeholder="e.g. Bank transfer received · sample entry"></textarea>
          </label>
        </div>
        <p class="app-note"><b>Sample ledger only.</b> No accounting period is closed and no bank file is produced.</p>
      `,
      footer: `
        <button class="app-btn app-btn--secondary" type="button" data-drawer-cancel>Cancel</button>
        <button class="app-btn app-btn--primary" type="button" data-drawer-post>Post entry</button>
      `,
      onMount(overlay) {
        $('[data-drawer-cancel]', overlay).addEventListener('click', closeDrawer);
        $('[data-drawer-post]', overlay).addEventListener('click', () => {
          const type = $('[data-entry-type]', overlay).value;
          const amount = Number($('[data-entry-amount]', overlay).value);
          const party = $('[data-entry-party]', overlay).value.trim() || 'Unspecified party';
          const reference = $('[data-entry-ref]', overlay).value.trim();
          const memo = $('[data-entry-memo]', overlay).value.trim();

          if (!(amount > 0)) {
            toast('Enter an amount greater than zero to post the entry.', 'warn');
            return;
          }

          if (type === 'expense') state.expenses += amount;
          else if (type === 'income') state.revenue += amount;
          else if (invoice) invoice.status = 'Paid';
          else state.unlinkedPayments += amount;

          const labels = { payment: 'Payment received', expense: 'Expense', income: 'Income' };
          const detail = reference ? ` · ${esc(reference)}` : '';
          const note = memo ? ` · ${esc(memo)}` : '';
          pushActivity(`${labels[type] || 'Entry'} · <b>${esc(party)}</b>${detail}${note}`, amount);
          toast(`${labels[type] || 'Entry'} posted — sample ledger and KPIs updated.`, 'ok');
          closeDrawer();
          render();
        });
      }
    });
  }

  function settleBill(no) {
    const bill = state.bills.find(item => item.no === no);
    if (!bill || bill.status === 'Paid') return;
    bill.status = 'Paid';
    pushActivity(`Bill <b>${esc(bill.no)}</b> marked paid — ${esc(bill.party)}`, bill.amount);
    toast(`${bill.no} marked as paid in the sample ledger.`, 'ok');
    render();
  }

  function exportLedger() {
    const rows = [['Type', 'Number', 'Party', 'Due date', 'Amount (USD)', 'Status']];
    visibleEntries().forEach(item => {
      rows.push([state.tab === 'invoices' ? 'Invoice' : 'Bill', item.no, item.party, item.due, item.amount, item.status]);
    });
    exportCSV(`accounting-${state.tab}-sample.csv`, rows);
    pushActivity(`Exported <b>${rows.length - 1} ${state.tab}</b> to CSV`);
    render();
  }

  /* ── wiring ──────────────────────────────────────────────────────────── */
  function syncFilters(value) {
    state.filter = value;
    $('[data-status]').value = value;
    $$('[data-status-chips] .app-chip').forEach(chip => chip.classList.toggle('is-active', chip.dataset.filter === value));
    renderTable();
  }

  function init() {
    $('[data-search]').addEventListener('input', event => {
      state.query = event.target.value;
      renderTable();
    });

    $('[data-status]').addEventListener('change', event => syncFilters(event.target.value));

    $('[data-status-chips]').addEventListener('click', event => {
      const chip = event.target.closest('[data-filter]');
      if (chip) syncFilters(chip.dataset.filter);
    });

    $('[data-tabs]').addEventListener('click', event => {
      const tab = event.target.closest('[data-tab]');
      if (!tab) return;
      state.tab = tab.dataset.tab;
      state.query = '';
      state.filter = 'all';
      $('[data-search]').value = '';
      $('[data-status]').value = 'all';
      $$('[data-tabs] .app-tab').forEach(item => {
        const active = item === tab;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-selected', String(active));
      });
      $$('[data-status-chips] .app-chip').forEach(chip => chip.classList.toggle('is-active', chip.dataset.filter === 'all'));
      render();
    });

    $('[data-rows]').addEventListener('click', event => {
      const button = event.target.closest('[data-action]');
      if (!button) return;
      if (button.dataset.action === 'settle') settleBill(button.dataset.id);
      if (button.dataset.action === 'pay') {
        const invoice = state.invoices.find(item => item.no === button.dataset.id);
        if (invoice) openEntryDrawer({ invoice });
      }
    });

    $('[data-entry]').addEventListener('click', () => openEntryDrawer());
    $('[data-export-csv]').addEventListener('click', exportLedger);

    onCurrency(render);
    render();
  }

  ready(init);
})();
