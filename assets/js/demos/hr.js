/* ==========================================================================
   HR & payroll demo — sample data, USD base, display currency via EBSApp
   ========================================================================== */
(() => {
  'use strict';

  const { $, $$, ready, money, status, esc, toast, openDrawer, closeDrawer, exportCSV, chartBars, onCurrency } = window.EBSApp;

  /* ── sample state (all money in USD) ─────────────────────────────────── */
  const state = {
    query: '',
    dept: 'all',
    att: 'all',
    headcount: 48,
    counters: { present: 36, remote: 5, late: 1, leave: 4, absent: 2 },
    approvedThisWeek: 2,
    payroll: {
      period: 'October 2025',
      gross: 128400,
      deductions: 18650,
      net: 109750,
      payDate: '31 Oct 2025',
      lastRun: null,
      runs: 0
    },
    employees: [
      { id: 'EMP-1042', name: 'Aye Chan Moe', dept: 'Engineering', role: 'Senior engineer', att: 'present', leave: 12, salary: 4200, request: { type: 'Annual leave', days: 3, start: '27 Oct', end: '29 Oct', status: 'pending' } },
      { id: 'EMP-1043', name: 'Min Htet Aung', dept: 'Engineering', role: 'Frontend engineer', att: 'remote', leave: 8, salary: 3400, request: null },
      { id: 'EMP-1044', name: 'Su Myat Noe', dept: 'Sales', role: 'Account executive', att: 'present', leave: 15, salary: 2900, request: { type: 'Sick leave', days: 1, start: '24 Oct', end: '24 Oct', status: 'pending' } },
      { id: 'EMP-1045', name: 'Thura Aung', dept: 'Finance', role: 'Accountant', att: 'late', leave: 6, salary: 3100, request: null },
      { id: 'EMP-1046', name: 'Nandar Win', dept: 'Operations', role: 'Operations lead', att: 'present', leave: 10, salary: 3800, request: { type: 'Annual leave', days: 4, start: '3 Nov', end: '6 Nov', status: 'pending' } },
      { id: 'EMP-1047', name: 'Kyaw Zin Oo', dept: 'Support', role: 'Support specialist', att: 'present', leave: 14, salary: 2300, request: null },
      { id: 'EMP-1048', name: 'Ei Phyu Sin', dept: 'Sales', role: 'Sales manager', att: 'present', leave: 9, salary: 4600, request: null },
      { id: 'EMP-1049', name: 'Hnin Wai Lwin', dept: 'Engineering', role: 'QA engineer', att: 'leave', leave: 2, salary: 3200, request: null },
      { id: 'EMP-1050', name: 'Zaw Lin Htut', dept: 'Operations', role: 'Warehouse coordinator', att: 'present', leave: 11, salary: 2500, request: null },
      { id: 'EMP-1051', name: 'May Thu Kyaw', dept: 'Finance', role: 'Payroll officer', att: 'remote', leave: 13, salary: 3000, request: null },
      { id: 'EMP-1052', name: 'Sai Htun', dept: 'Engineering', role: 'DevOps engineer', att: 'present', leave: 7, salary: 4800, request: null },
      { id: 'EMP-1053', name: 'Phyu Sin Khine', dept: 'Support', role: 'Support lead', att: 'present', leave: 16, salary: 3300, request: null },
      { id: 'EMP-1054', name: 'Thet Naing', dept: 'Sales', role: 'Business development', att: 'present', leave: 5, salary: 3600, request: { type: 'Annual leave', days: 2, start: '30 Oct', end: '31 Oct', status: 'pending' } },
      { id: 'EMP-1055', name: 'Yamin Oo', dept: 'Engineering', role: 'Engineering manager', att: 'present', leave: 12, salary: 6400, request: null }
    ],
    deptCounts: [
      { name: 'Engineering', value: 16 },
      { name: 'Sales', value: 12 },
      { name: 'Operations', value: 9 },
      { name: 'Finance', value: 5 },
      { name: 'Support', value: 6 }
    ],
    upcoming: [
      { name: 'Ei Phyu Sin', dept: 'Sales', type: 'Annual leave', range: '30 Oct – 1 Nov', days: 3, tone: 'ok' },
      { name: 'Phyu Sin Khine', dept: 'Support', type: 'Medical leave', range: '24 Oct', days: 1, tone: 'ok' }
    ],
    activity: [
      { time: '10:40', html: 'New starter onboarded to <b>Support</b> — sample record' },
      { time: '10:05', html: '<b>Su Myat Noe</b> requested sick leave (1 day)' },
      { time: '09:15', html: 'Payroll draft prepared for <b>October 2025</b>', amount: 109750 },
      { time: '08:40', html: 'Attendance sync completed — <b>42 present</b> of 48' }
    ]
  };

  const ATT = {
    present: { label: 'Present', tone: 'ok' },
    remote: { label: 'Remote', tone: 'info' },
    late: { label: 'Late', tone: 'warn' },
    leave: { label: 'On leave', tone: 'neutral' },
    absent: { label: 'Absent', tone: 'bad' }
  };

  const initials = name => name.split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase();

  const counts = () => ({
    pending: state.employees.filter(employee => employee.request && employee.request.status === 'pending').length,
    approved: state.employees.filter(employee => employee.request && employee.request.status === 'approved').length
  });

  /* ── renderers ───────────────────────────────────────────────────────── */
  function renderKpis() {
    const { pending } = counts();
    $('[data-kpi="headcount"]').textContent = String(state.headcount);
    $('[data-kpi="present"]').textContent = String(state.counters.present + state.counters.remote + state.counters.late);
    $('[data-kpi="pending"]').textContent = String(pending);
    $('[data-kpi="payroll"]').textContent = money(state.payroll.gross, { compact: true });

    $('[data-kpi-meta="present"]').textContent =
      `${state.counters.present} office · ${state.counters.remote} remote · ${state.counters.late} late`;
    $('[data-kpi-meta="pending"]').textContent = pending
      ? `${state.approvedThisWeek} approved this week`
      : 'All requests reviewed';
    $('[data-kpi-meta="payroll"]').textContent =
      `Net ${money(state.payroll.net, { compact: true })} · pay date ${state.payroll.payDate}`;
  }

  function visibleEmployees() {
    const query = state.query.trim().toLowerCase();
    return state.employees.filter(employee => {
      if (state.dept !== 'all' && employee.dept !== state.dept) return false;
      if (state.att === 'pending' && !(employee.request && employee.request.status === 'pending')) return false;
      if (state.att !== 'all' && state.att !== 'pending' && employee.att !== state.att) return false;
      if (!query) return true;
      return `${employee.name} ${employee.role} ${employee.dept} ${employee.id}`.toLowerCase().includes(query);
    });
  }

  function requestCell(employee) {
    const request = employee.request;
    if (!request) return '<span class="muted">—</span>';
    if (request.status === 'pending') {
      return `<button class="link-btn" type="button" data-action="approve" data-id="${esc(employee.id)}">Approve</button>
        <button class="link-btn" type="button" data-action="decline" data-id="${esc(employee.id)}">Decline</button>`;
    }
    if (request.status === 'approved') return status('Approved', 'ok');
    return status('Declined', 'bad');
  }

  function renderTable() {
    const rows = visibleEmployees();
    const body = $('[data-rows]');
    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="7" class="app-table__empty">No employees match this search and filter combination.</td></tr>';
    } else {
      body.innerHTML = rows.map((employee, index) => {
        const att = ATT[employee.att] || ATT.present;
        const tone = index % 4 === 0 ? '' : ` app-avatar--${(index % 4) + 1}`;
        const request = employee.request;
        const requestLine = request
          ? `${request.type} · ${request.days} d`
          : 'No request';
        return `<tr>
          <td>
            <div class="app-person">
              <span class="app-avatar${tone}" aria-hidden="true">${esc(initials(employee.name))}</span>
              <div>
                <div class="app-person__name">${esc(employee.name)}</div>
                <div class="app-person__sub">${esc(employee.id)}</div>
              </div>
            </div>
          </td>
          <td class="muted">${esc(employee.dept)}</td>
          <td class="muted">${esc(employee.role)}</td>
          <td>${status(att.label, att.tone)}<div class="app-person__sub">${esc(requestLine)}</div></td>
          <td class="num">${employee.leave} d</td>
          <td class="num">${money(employee.salary)}</td>
          <td class="actions">${requestCell(employee)}</td>
        </tr>`;
      }).join('');
    }
    $('[data-roster-count]').textContent = `${rows.length} of ${state.employees.length} roster entries`;
    $('[data-table-foot]').textContent = `Showing ${rows.length} of ${state.employees.length} roster entries`;
  }

  function renderAttendance() {
    const rows = [
      ['Present in office', state.counters.present],
      ['Remote', state.counters.remote],
      ['Late arrival', state.counters.late],
      ['On leave', state.counters.leave],
      ['Absent', state.counters.absent]
    ];
    $('[data-attendance]').innerHTML = rows.map(([label, value]) =>
      `<div class="app-row"><span>${esc(label)}</span><b>${value}</b></div>`).join('') +
      `<div class="app-row"><span>On site right now</span><b>${state.counters.present + state.counters.late} / ${state.headcount}</b></div>`;
  }

  function renderUpcoming() {
    const list = state.upcoming.slice(0, 4);
    $('[data-upcoming]').innerHTML = list.map(item => `<div class="app-activity__item">
      <span class="app-activity__dot"></span>
      <div><b>${esc(item.name)}</b> · ${esc(item.type)}<br>${esc(item.range)} · ${item.days} d</div>
      <span class="app-activity__time">${esc(item.dept)}</span>
    </div>`).join('');
    $('[data-upcoming-count]').textContent = `${state.upcoming.length} approved`;
  }

  function renderDeptChart() {
    const values = state.deptCounts.map(item => item.value);
    const labels = state.deptCounts.map(item => item.name);
    $('[data-dept-chart]').innerHTML = chartBars(values, labels);
  }

  function renderActivity() {
    $('[data-activity]').innerHTML = state.activity.slice(0, 6).map(item => `<div class="app-activity__item">
      <span class="app-activity__dot"></span>
      <div>${item.html}${item.amount != null ? ` · <b>${money(item.amount)}</b>` : ''}</div>
      <span class="app-activity__time">${esc(item.time)}</span>
    </div>`).join('');
  }

  function renderPayrollSnapshot() {
    const payroll = state.payroll;
    const rows = [
      ['Pay period', esc(payroll.period)],
      ['Gross payroll', `<b class="num">${money(payroll.gross)}</b>`],
      ['Deductions', `<b class="num">${money(payroll.deductions)}</b>`],
      ['Net pay', `<b class="num">${money(payroll.net)}</b>`],
      ['Pay date', esc(payroll.payDate)],
      ['Last run', payroll.lastRun ? esc(payroll.lastRun) : '<span class="muted">Not run in this session</span>'],
      ['Runs recorded', String(payroll.runs)]
    ];
    $('[data-payroll-rows]').innerHTML = rows.map(([label, value]) =>
      `<div class="app-row"><span>${label}</span><b>${value}</b></div>`).join('');
  }

  function render() {
    renderKpis();
    renderTable();
    renderAttendance();
    renderUpcoming();
    renderDeptChart();
    renderActivity();
    renderPayrollSnapshot();
  }

  /* ── mutations ───────────────────────────────────────────────────────── */
  function pushActivity(html, amount) {
    const now = new Date();
    const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    state.activity.unshift({ time, html, amount });
    if (state.activity.length > 12) state.activity.pop();
  }

  function reviewLeave(id, decision) {
    const employee = state.employees.find(item => item.id === id);
    if (!employee || !employee.request || employee.request.status !== 'pending') return;
    const request = employee.request;
    request.status = decision === 'approve' ? 'approved' : 'declined';
    if (decision === 'approve') {
      employee.leave = Math.max(0, employee.leave - request.days);
      state.approvedThisWeek += 1;
      state.upcoming.unshift({
        name: employee.name,
        dept: employee.dept,
        type: request.type,
        range: `${request.start} – ${request.end}`,
        days: request.days,
        tone: 'ok'
      });
      pushActivity(`Approved <b>${request.type}</b> for <b>${esc(employee.name)}</b> (${request.days} d)`);
      toast(`Leave approved for ${employee.name} — balance updated.`, 'ok');
    } else {
      pushActivity(`Declined <b>${request.type}</b> request from <b>${esc(employee.name)}</b>`);
      toast(`Leave request declined for ${employee.name}.`, 'warn');
    }
    render();
  }

  function openPayrollDrawer() {
    const payroll = state.payroll;
    openDrawer({
      title: `Payroll summary — ${payroll.period}`,
      body: `
        <p class="app-sub">Review the sample payroll run before posting. Amounts are illustrative and never leave this browser.</p>
        <div class="app-rows">
          <div class="app-row"><span>Employees in run</span><b>${state.headcount}</b></div>
          <div class="app-row"><span>Gross payroll</span><b class="num" data-usd="${payroll.gross}">${money(payroll.gross)}</b></div>
          <div class="app-row"><span>Tax &amp; social contributions</span><b class="num" data-usd="${payroll.deductions}">${money(payroll.deductions)}</b></div>
          <div class="app-row"><span>Net pay</span><b class="num" data-usd="${payroll.net}">${money(payroll.net)}</b></div>
          <div class="app-row"><span>Pay date</span><b>${esc(payroll.payDate)}</b></div>
          <div class="app-row"><span>Payment method</span><b>Bank transfer · Main account</b></div>
        </div>
        <label class="app-field">
          <span class="app-label">Pay date</span>
          <select class="app-select" data-pay-date>
            <option>31 Oct 2025</option>
            <option>1 Nov 2025</option>
          </select>
        </label>
        <label class="app-field">
          <span class="app-label">Run note (optional)</span>
          <textarea class="app-textarea" placeholder="e.g. October run — approved by Finance"></textarea>
        </label>
        <p class="app-note"><b>Sample only.</b> No bank files are created and no money moves. Running the summary records a sample run in the activity feed.</p>
      `,
      footer: `
        <button class="app-btn app-btn--secondary" type="button" data-drawer-cancel>Cancel</button>
        <button class="app-btn app-btn--primary" type="button" data-drawer-run>Run payroll</button>
      `,
      onMount(overlay) {
        $('[data-drawer-cancel]', overlay).addEventListener('click', closeDrawer);
        $('[data-drawer-run]', overlay).addEventListener('click', () => {
          const now = new Date();
          const label = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
          const dateField = $('[data-pay-date]', overlay);
          if (dateField) payroll.payDate = dateField.value;
          payroll.lastRun = `Today · ${label}`;
          payroll.runs += 1;
          pushActivity(`Payroll run posted for <b>${esc(payroll.period)}</b>`, payroll.net);
          toast('Payroll run recorded — sample ledger updated.', 'ok');
          closeDrawer();
          render();
        });
      }
    });
  }

  function exportRoster() {
    const rows = [['Employee ID', 'Name', 'Department', 'Role', 'Attendance', 'Leave balance (days)', 'Monthly salary (USD)']];
    visibleEmployees().forEach(employee => {
      const att = ATT[employee.att] || ATT.present;
      rows.push([employee.id, employee.name, employee.dept, employee.role, att.label, employee.leave, employee.salary]);
    });
    exportCSV('hr-roster-sample.csv', rows);
    pushActivity(`Exported <b>${rows.length - 1} roster rows</b> to CSV`);
    render();
  }

  /* ── wiring ──────────────────────────────────────────────────────────── */
  function init() {
    $('[data-search]').addEventListener('input', event => {
      state.query = event.target.value;
      renderTable();
    });

    $('[data-dept]').addEventListener('change', event => {
      state.dept = event.target.value;
      renderTable();
    });

    $('[data-att-chips]').addEventListener('click', event => {
      const chip = event.target.closest('[data-att]');
      if (!chip) return;
      state.att = chip.dataset.att;
      $$('[data-att-chips] .app-chip').forEach(item => item.classList.toggle('is-active', item === chip));
      renderTable();
    });

    $('[data-rows]').addEventListener('click', event => {
      const button = event.target.closest('[data-action]');
      if (!button) return;
      reviewLeave(button.dataset.id, button.dataset.action);
    });

    $$('[data-payroll]').forEach(button => button.addEventListener('click', openPayrollDrawer));
    $('[data-export-csv]').addEventListener('click', exportRoster);

    onCurrency(render);
    render();
  }

  ready(init);
})();
