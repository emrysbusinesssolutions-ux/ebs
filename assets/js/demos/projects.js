/* ==========================================================================
   Projects & services demo — sample delivery portfolio, no live records.
   Base amounts are USD; every money value is rendered through EBSApp.money.
   ========================================================================== */
(() => {
  'use strict';

  const App = window.EBSApp;
  const { ready, money, status, toast, openDrawer, closeDrawer, chartBars, exportCSV, esc } = App;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const DAY = 86400000;
  const RATE = 95;              // sample billable rate, USD per hour
  const TEAM_CAPACITY = 2400;   // sample monthly team hours
  const OWNERS = ['Aung Min', 'Thiri Win', 'Hnin Su', 'Kyaw Zin'];
  const STATUS_TONE = { 'On track': 'ok', 'At risk': 'warn', Behind: 'bad', Complete: 'info' };

  const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const isoOffset = offset => {
    const d = new Date(startOfToday().getTime() + offset * DAY);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const dayDiff = iso => {
    const parts = String(iso || '').split('-').map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return 0;
    return Math.round((new Date(parts[0], parts[1] - 1, parts[2]).getTime() - startOfToday().getTime()) / DAY);
  };
  const initials = name => String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2)
    .map(word => word.replace(/[^A-Za-z]/g, '').charAt(0)).join('').toUpperCase() || '?';
  const num = value => Number(value || 0).toLocaleString('en-US');
  const dueBadge = due => {
    const diff = dayDiff(due);
    if (diff < 0) return status(`${-diff}d overdue`, 'bad');
    if (diff === 0) return status('Due today', 'warn');
    if (diff === 1) return status('Due tomorrow', 'neutral');
    const d = new Date(`${due}T00:00:00`);
    return status(`Due ${d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}`, 'neutral');
  };

  let nextTaskId = 901;

  const projects = [
    { id: 1042, code: 'PRJ-1042', name: 'POS rollout — Phase 2', client: 'Bagan Foods', owner: 'Aung Min', status: 'On track', budget: 48000, spent: 27600, progress: 62, hoursLogged: 412, billableHours: 379, tasks: [
      { id: 1, name: 'UAT sign-off', due: isoOffset(-2), done: false },
      { id: 2, name: 'Staff training', due: isoOffset(5), done: false },
      { id: 3, name: 'Data migration', due: isoOffset(9), done: false }
    ] },
    { id: 1043, code: 'PRJ-1043', name: 'Warehouse audit', client: 'Rakhine Logistics', owner: 'Hnin Su', status: 'At risk', budget: 22000, spent: 17800, progress: 48, hoursLogged: 268, billableHours: 247, tasks: [
      { id: 4, name: 'Bin count reconciliation', due: isoOffset(-3), done: false },
      { id: 5, name: 'Variance report', due: isoOffset(2), done: false }
    ] },
    { id: 1044, code: 'PRJ-1044', name: 'CRM data cleanup', client: 'Shwe Taung Retail', owner: 'Thiri Win', status: 'On track', budget: 15000, spent: 6400, progress: 71, hoursLogged: 186, billableHours: 171, tasks: [
      { id: 6, name: 'De-duplicate contacts', due: isoOffset(3), done: false },
      { id: 7, name: 'Owner mapping', due: isoOffset(7), done: false }
    ] },
    { id: 1045, code: 'PRJ-1045', name: 'E-commerce build', client: 'Ayeyar Trading', owner: 'Kyaw Zin', status: 'Behind', budget: 36000, spent: 31500, progress: 39, hoursLogged: 402, billableHours: 370, tasks: [
      { id: 8, name: 'Payment gateway test', due: isoOffset(-4), done: false },
      { id: 9, name: 'Catalogue sync', due: isoOffset(6), done: false }
    ] },
    { id: 1046, code: 'PRJ-1046', name: 'Accounting migration', client: 'Mandalay Textiles', owner: 'Hnin Su', status: 'On track', budget: 28000, spent: 12900, progress: 55, hoursLogged: 205, billableHours: 189, tasks: [
      { id: 10, name: 'Opening balances', due: isoOffset(4), done: false },
      { id: 11, name: 'Chart of accounts', due: isoOffset(8), done: false }
    ] },
    { id: 1047, code: 'PRJ-1047', name: 'Onboarding portal', client: 'Inle Hospitality', owner: 'Thiri Win', status: 'Complete', budget: 9500, spent: 9500, progress: 100, hoursLogged: 148, billableHours: 136, tasks: [
      { id: 12, name: 'Client handover', due: isoOffset(-10), done: true },
      { id: 13, name: 'Support briefing', due: isoOffset(20), done: true }
    ] },
    { id: 1048, code: 'PRJ-1048', name: 'Route planning', client: 'Thanlwin Shipping', owner: 'Aung Min', status: 'At risk', budget: 42000, spent: 25100, progress: 44, hoursLogged: 330, billableHours: 304, tasks: [
      { id: 14, name: 'Depot data feed', due: isoOffset(-1), done: false },
      { id: 15, name: 'Driver app test', due: isoOffset(10), done: false }
    ] },
    { id: 1049, code: 'PRJ-1049', name: 'Retail POS pilot', client: 'Dagon Interiors', owner: 'Kyaw Zin', status: 'On track', budget: 18500, spent: 7200, progress: 33, hoursLogged: 112, billableHours: 103, tasks: [
      { id: 16, name: 'Pilot store setup', due: isoOffset(12), done: false }
    ] }
  ];

  const state = { search: '', status: 'All', sessionHours: 0 };

  const allTasks = () => projects.flatMap(project => project.tasks.map(task => ({ task, project })));
  const openTasks = () => allTasks().filter(entry => !entry.task.done);
  const isOverdue = task => !task.done && dayDiff(task.due) < 0;
  const totalHours = () => projects.reduce((sum, project) => sum + project.hoursLogged, 0);
  const billableHours = () => projects.reduce((sum, project) => sum + project.billableHours, 0);
  const billedValue = () => billableHours() * RATE;

  function avatarClass(index) {
    return index % 4 === 0 ? '' : ` app-avatar--${(index % 4) + 1}`;
  }

  function ownerCell(name) {
    const index = Math.max(0, OWNERS.indexOf(name));
    return `<div class="app-person"><span class="app-avatar${avatarClass(index)}">${esc(initials(name))}</span><div class="app-person__name">${esc(name)}</div></div>`;
  }

  function projectRow(project) {
    const index = projects.indexOf(project);
    const open = project.tasks.filter(task => !task.done).length;
    return `<tr>
      <td>
        <div class="app-person">
          <span class="app-avatar${avatarClass(index)}">${esc(initials(project.name))}</span>
          <div>
            <div class="app-person__name">${esc(project.name)}</div>
            <div class="app-person__sub">${esc(project.code)} · ${num(project.hoursLogged)} h logged</div>
          </div>
        </div>
      </td>
      <td>
        <div class="app-person__name">${esc(project.client)}</div>
        <div class="app-person__sub">${open} open task${open === 1 ? '' : 's'}</div>
      </td>
      <td>${ownerCell(project.owner)}</td>
      <td>
        <div class="app-progress"><span style="width:${project.progress}%"></span></div>
        <div class="muted">${project.progress}%</div>
      </td>
      <td class="num">${money(project.budget, { compact: true })}</td>
      <td>${status(project.status, STATUS_TONE[project.status] || 'neutral')}</td>
      <td class="actions">
        <button class="link-btn" type="button" data-log-time="${project.id}" title="Log time">Log</button>
        <button class="link-btn" type="button" data-tasks="${project.id}">Tasks</button>
      </td>
    </tr>`;
  }

  function renderKpis() {
    const active = projects.filter(project => project.status !== 'Complete');
    const overdue = openTasks().filter(entry => isOverdue(entry.task));
    const dueWeek = openTasks().filter(entry => {
      const diff = dayDiff(entry.task.due);
      return diff >= 0 && diff <= 7;
    });
    const activeBudget = active.reduce((sum, project) => sum + project.budget, 0);
    const hours = billableHours();
    const utilisation = Math.min(100, Math.round((totalHours() / TEAM_CAPACITY) * 100));

    $('#kpiActive').textContent = String(active.length);
    $('#kpiActiveMeta').innerHTML = `${money(activeBudget, { compact: true })} active budget`;
    $('#kpiHours').textContent = `${num(hours)} h`;
    $('#kpiHoursMeta').innerHTML = `${money(billedValue(), { compact: true })} billed @ ${money(RATE)}/h`;
    $('#kpiUtil').textContent = `${utilisation}%`;
    $('#kpiUtilMeta').innerHTML = '<span class="app-delta">+2.4 pts</span> vs last week';
    $('#kpiOverdue').textContent = String(overdue.length);
    $('#kpiOverdueMeta').textContent = overdue.length
      ? `${dueWeek.length} due in next 7 days · oldest ${overdue.reduce((max, entry) => Math.max(max, -dayDiff(entry.task.due)), 0)}d`
      : `All tasks on schedule · ${num(totalHours())} h logged`;

    $('#projectCount').textContent = `${projects.length} records`;
    $('#milestoneCount').textContent = `${openTasks().length} open`;

    const charts = [318, 342, 296, 361, 388, 354 + state.sessionHours];
    $('#hoursChart').innerHTML = chartBars(charts, ['W-5', 'W-4', 'W-3', 'W-2', 'W-1', 'This']);
    $('#hoursTotal').textContent = `${num(hours)} h billable`;
  }

  function renderTable() {
    const query = state.search.trim().toLowerCase();
    const filtered = projects.filter(project => {
      const statusOk = state.status === 'All' || project.status === state.status;
      if (!statusOk) return false;
      if (!query) return true;
      return `${project.code} ${project.name} ${project.client} ${project.owner} ${project.status}`.toLowerCase().includes(query);
    });
    $('#projectBody').innerHTML = filtered.length
      ? filtered.map(projectRow).join('')
      : '<tr><td colspan="7" class="app-table__empty">No projects match this search and status filter.</td></tr>';
    $('#projectResult').textContent = `Showing ${filtered.length} of ${projects.length} projects`;
    $$('#statusFilters .app-chip').forEach(chip => {
      const active = chip.dataset.status === state.status;
      chip.classList.toggle('is-active', active);
      chip.setAttribute('aria-pressed', String(active));
    });
  }

  function renderMilestones() {
    const upcoming = openTasks().sort((a, b) => a.task.due.localeCompare(b.task.due)).slice(0, 6);
    $('#milestoneList').innerHTML = upcoming.length
      ? upcoming.map(entry => `<div class="app-activity__item">
          <span class="app-activity__dot"></span>
          <div><b>${esc(entry.project.code)}</b> · ${esc(entry.task.name)}<br>${esc(entry.project.client)}</div>
          <span class="app-activity__time">${dueBadge(entry.task.due)}</span>
        </div>`).join('')
      : '<div class="app-activity__item"><span class="app-activity__dot"></span><div>No open tasks — sample portfolio is clear.</div></div>';
  }

  function render() {
    renderKpis();
    renderTable();
    renderMilestones();
  }

  /* ── drawers ─────────────────────────────────────────────────────────── */
  function openLogTime(projectId) {
    const options = projects.filter(project => project.status !== 'Complete').map(project =>
      `<option value="${project.id}"${project.id === projectId ? ' selected' : ''}>${esc(project.code)} · ${esc(project.client)}</option>`).join('');
    const body = `
      <form class="app-form" id="timeForm">
        <div class="app-field app-field--full">
          <label class="app-label" for="tProject">Project</label>
          <select class="app-select" id="tProject">${options}</select>
        </div>
        <div class="app-field">
          <label class="app-label" for="tHours">Hours</label>
          <input class="app-input" id="tHours" type="number" min="0.5" step="0.5" value="4">
        </div>
        <div class="app-field">
          <label class="app-label" for="tDate">Work date</label>
          <input class="app-input" id="tDate" type="date" value="${isoOffset(0)}">
        </div>
        <div class="app-field app-field--full">
          <label class="app-label" for="tBillable">Time type</label>
          <select class="app-select" id="tBillable"><option>Billable</option><option>Non-billable</option></select>
        </div>
        <div class="app-field app-field--full">
          <label class="app-label" for="tNote">Note</label>
          <textarea class="app-textarea" id="tNote" placeholder="Sample work summary — no real notes."></textarea>
        </div>
      </form>
      <div class="app-note"><b>Sample only.</b> Saving time updates hours, budget spend, progress and KPIs in this demo state.</div>`;

    openDrawer({
      title: 'Log time',
      body,
      footer: `<button class="app-btn app-btn--secondary" type="button" data-close>Cancel</button>
               <button class="app-btn app-btn--primary" type="submit" form="timeForm">Save time</button>`,
      onMount(overlay) {
        $('[data-close]', overlay).addEventListener('click', closeDrawer);
        $('#timeForm', overlay).addEventListener('submit', event => {
          event.preventDefault();
          const project = projects.find(item => item.id === Number($('#tProject', overlay).value));
          const hours = Number($('#tHours', overlay).value);
          if (!project || !(hours > 0)) {
            toast('Choose a project and enter hours above zero.', 'warn');
            $('#tHours', overlay).focus();
            return;
          }
          const billable = $('#tBillable', overlay).value === 'Billable';
          project.hoursLogged += hours;
          if (billable) {
            project.billableHours += hours;
            project.spent += hours * RATE;
            state.sessionHours += hours;
          }
          project.progress = Math.min(100, project.progress + Math.max(1, Math.round(hours / 8)));
          closeDrawer();
          render();
          toast(`${hours} h logged to ${project.code}${billable ? ` · ${money(hours * RATE)}` : ' · non-billable'}`, 'ok');
        });
      }
    });
  }

  function openProjectTasks(projectId) {
    const project = projects.find(item => item.id === projectId);
    if (!project) return;
    const rows = project.tasks.map(task => `<div class="app-row">
        <span>${esc(task.name)}<br>${dueBadge(task.due)}</span>
        ${task.done ? status('Done', 'ok') : `<button class="link-btn" type="button" data-complete-task="${task.id}">Complete</button>`}
      </div>`).join('');

    const body = `
      <div class="app-rows">
        <div class="app-row"><span>Client</span><b>${esc(project.client)}</b></div>
        <div class="app-row"><span>Owner</span><b>${esc(project.owner)}</b></div>
        <div class="app-row"><span>Status</span><b>${status(project.status, STATUS_TONE[project.status] || 'neutral')}</b></div>
        <div class="app-row"><span>Budget</span><b data-usd="${project.budget}">${money(project.budget)}</b></div>
        <div class="app-row"><span>Spent</span><b data-usd="${project.spent}">${money(project.spent)}</b></div>
        <div class="app-row"><span>Logged</span><b>${num(project.hoursLogged)} h · ${project.progress}%</b></div>
      </div>
      <div class="app-panel__title">Project tasks <small>${project.code}</small></div>
      <div class="app-rows">${rows}</div>
      <form class="app-form" id="taskForm">
        <div class="app-field">
          <label class="app-label" for="nTask">New task</label>
          <input class="app-input" id="nTask" type="text" placeholder="Task name" autocomplete="off">
        </div>
        <div class="app-field">
          <label class="app-label" for="nDue">Due date</label>
          <input class="app-input" id="nDue" type="date" value="${isoOffset(7)}">
        </div>
      </form>`;

    openDrawer({
      title: `${project.code} · ${project.name}`,
      body,
      footer: `<button class="app-btn app-btn--secondary" type="button" data-close>Close</button>
               <button class="app-btn app-btn--primary" type="submit" form="taskForm">Add task</button>`,
      onMount(overlay) {
        $('[data-close]', overlay).addEventListener('click', closeDrawer);
        $$('[data-complete-task]', overlay).forEach(button => {
          button.addEventListener('click', () => {
            const task = project.tasks.find(item => item.id === Number(button.dataset.completeTask));
            if (!task) return;
            task.done = true;
            project.progress = Math.min(100, project.progress + 3);
            render();
            button.outerHTML = status('Done', 'ok');
            toast(`Task completed — ${project.code}`, 'ok');
          });
        });
        $('#taskForm', overlay).addEventListener('submit', event => {
          event.preventDefault();
          const name = $('#nTask', overlay).value.trim();
          if (!name) {
            toast('Add a task name before saving.', 'warn');
            $('#nTask', overlay).focus();
            return;
          }
          project.tasks.push({ id: nextTaskId++, name, due: $('#nDue', overlay).value || isoOffset(7), done: false });
          closeDrawer();
          render();
          toast(`Task added — ${project.code}`, 'ok');
        });
      }
    });
  }

  function exportProjects() {
    const rows = [['Code', 'Project', 'Client', 'Owner', 'Status', 'Budget (USD)', 'Spent (USD)', 'Progress %', 'Hours logged', 'Billable hours', 'Open tasks']];
    projects.forEach(project => rows.push([
      project.code, project.name, project.client, project.owner, project.status,
      project.budget, project.spent, project.progress, project.hoursLogged, project.billableHours,
      project.tasks.filter(task => !task.done).length
    ]));
    exportCSV('projects-portfolio.csv', rows);
  }

  /* ── wiring ──────────────────────────────────────────────────────────── */
  function wire() {
    $('#projectSearch').addEventListener('input', event => {
      state.search = event.target.value;
      renderTable();
    });
    $('#statusFilters').addEventListener('click', event => {
      const chip = event.target.closest('[data-status]');
      if (!chip) return;
      state.status = chip.dataset.status;
      renderTable();
    });
    $('[data-log-time-btn]').addEventListener('click', () => openLogTime());
    $('[data-export-projects]').addEventListener('click', exportProjects);
    $('#projectBody').addEventListener('click', event => {
      const logBtn = event.target.closest('[data-log-time]');
      if (logBtn) { openLogTime(Number(logBtn.dataset.logTime)); return; }
      const tasksBtn = event.target.closest('[data-tasks]');
      if (tasksBtn) openProjectTasks(Number(tasksBtn.dataset.tasks));
    });
  }

  ready(() => {
    wire();
    render();
    App.onCurrency(render);
  });
})();
