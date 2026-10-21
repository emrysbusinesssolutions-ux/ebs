/* ==========================================================================
   CRM & sales demo — sample pipeline data, no live records.
   Base amounts are USD; every money value is rendered through EBSApp.money.
   ========================================================================== */
(() => {
  'use strict';

  const App = window.EBSApp;
  const { ready, money, status, toast, openDrawer, closeDrawer, chartBars, exportCSV, esc } = App;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const DAY = 86400000;
  const OPEN_STAGES = ['Discovery', 'Qualified', 'Proposal', 'Negotiation'];
  const FLOW = ['Discovery', 'Qualified', 'Proposal', 'Negotiation', 'Won'];
  const OWNERS = ['Aung Min', 'Thiri Win', 'Hnin Su', 'Kyaw Zin'];
  const STAGE_TONE = {
    Discovery: 'neutral', Qualified: 'info', Proposal: 'info',
    Negotiation: 'warn', Won: 'ok', Lost: 'bad'
  };

  const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const isoOffset = offset => {
    const d = new Date(startOfToday().getTime() + offset * DAY);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const dayDiff = iso => {
    const parts = String(iso || '').split('-').map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return 0;
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return Math.round((d.getTime() - startOfToday().getTime()) / DAY);
  };
  const initials = name => String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2)
    .map(word => word.replace(/[^A-Za-z]/g, '').charAt(0)).join('').toUpperCase() || '?';

  let nextId = 1043;

  const deals = [
    { id: 1031, company: 'Bagan Foods', contact: 'U Kyaw Zin', sector: 'Food distribution', owner: 'Aung Min', stage: 'Negotiation', value: 28400, nextAction: 'Contract review', due: isoOffset(-2) },
    { id: 1032, company: 'Shwe Taung Retail', contact: 'Daw Khin Mar', sector: 'Retail chain', owner: 'Thiri Win', stage: 'Negotiation', value: 52100, nextAction: 'Pricing approval', due: isoOffset(1) },
    { id: 1033, company: 'Mandalay Textiles', contact: 'Daw Mya Mya', sector: 'Manufacturing', owner: 'Thiri Win', stage: 'Proposal', value: 46200, nextAction: 'Send revised quote', due: isoOffset(0) },
    { id: 1034, company: 'Inle Hospitality', contact: 'U Soe Win', sector: 'Hospitality', owner: 'Kyaw Zin', stage: 'Proposal', value: 35600, nextAction: 'Demo follow-up', due: isoOffset(-5) },
    { id: 1035, company: 'Ayeyar Trading', contact: 'Daw Sandar Aye', sector: 'Wholesale', owner: 'Hnin Su', stage: 'Qualified', value: 19700, nextAction: 'Site visit', due: isoOffset(4) },
    { id: 1036, company: 'Pago Agro', contact: 'U Min Thu', sector: 'Agriculture', owner: 'Thiri Win', stage: 'Qualified', value: 21500, nextAction: 'Follow-up completed', due: isoOffset(3), done: true },
    { id: 1037, company: 'Rakhine Logistics', contact: 'Ko Thet Naing', sector: 'Logistics', owner: 'Aung Min', stage: 'Discovery', value: 12800, nextAction: 'Discovery call', due: isoOffset(2) },
    { id: 1038, company: 'Dagon Interiors', contact: 'Daw Nu Nu', sector: 'Interior design', owner: 'Aung Min', stage: 'Discovery', value: 8400, nextAction: 'Qualify budget', due: isoOffset(6) },
    { id: 1039, company: 'Thanlwin Shipping', contact: 'U Aung Kyaw', sector: 'Freight', owner: 'Hnin Su', stage: 'Won', value: 24800, nextAction: 'Closed won', due: isoOffset(-9) },
    { id: 1040, company: 'Mawlamyine Cement', contact: 'Daw Ei Ei', sector: 'Building materials', owner: 'Hnin Su', stage: 'Won', value: 17300, nextAction: 'Closed won', due: isoOffset(-14) },
    { id: 1041, company: 'Yangon Printworks', contact: 'Ko Naing Lin', sector: 'Printing', owner: 'Kyaw Zin', stage: 'Won', value: 11200, nextAction: 'Closed won', due: isoOffset(-21) },
    { id: 1042, company: 'Taunggyi Farms', contact: 'U Sai Htun', sector: 'Agriculture', owner: 'Aung Min', stage: 'Lost', value: 15800, nextAction: 'Closed lost', due: isoOffset(-17) }
  ];

  const activity = [
    { time: '12m ago', text: 'Thiri Win logged a call with Mandalay Textiles.' },
    { time: '1h ago', text: 'Proposal sent to Inle Hospitality — awaiting feedback.' },
    { time: '3h ago', text: 'Deal advanced: Ayeyar Trading moved to Qualified.' },
    { time: 'Yesterday', text: 'Contract review scheduled with Bagan Foods.' },
    { time: 'Mon', text: 'New lead added: Dagon Interiors.' }
  ];

  const state = { search: '', stage: 'All', cleared: 0 };

  const isClosed = deal => deal.stage === 'Won' || deal.stage === 'Lost';
  const isOverdue = deal => !isClosed(deal) && !deal.done && dayDiff(deal.due) < 0;
  const dueBadge = due => {
    const diff = dayDiff(due);
    if (diff < 0) return status(`${-diff}d overdue`, 'bad');
    if (diff === 0) return status('Due today', 'warn');
    if (diff === 1) return status('Due tomorrow', 'neutral');
    const d = new Date(`${due}T00:00:00`);
    const label = d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
    return status(`Due ${label}`, 'neutral');
  };

  function addActivity(text) {
    activity.unshift({ time: 'just now', text });
    if (activity.length > 8) activity.length = 8;
  }

  function avatarClass(index) {
    return index % 4 === 0 ? '' : ` app-avatar--${(index % 4) + 1}`;
  }

  function ownerCell(name) {
    const index = Math.max(0, OWNERS.indexOf(name));
    return `<div class="app-person"><span class="app-avatar${avatarClass(index)}">${esc(initials(name))}</span><div class="app-person__name">${esc(name)}</div></div>`;
  }

  function nextActionCell(deal) {
    if (isClosed(deal)) {
      return `<span class="muted">${esc(deal.nextAction)}</span><br>${status('No action', 'neutral')}`;
    }
    if (deal.done) {
      return `<span class="muted">${esc(deal.nextAction)}</span><br>${status('Cleared', 'ok')}`;
    }
    return `<span class="muted">${esc(deal.nextAction)}</span><br>${dueBadge(deal.due)}`;
  }

  function dealRow(deal) {
    const index = deals.indexOf(deal);
    const open = !isClosed(deal);
    const actions = [
      open ? `<button class="link-btn" type="button" data-advance="${deal.id}">Advance</button>` : '',
      open && !deal.done ? `<button class="link-btn" type="button" data-done="${deal.id}">Done</button>` : '',
      `<button class="link-btn" type="button" data-log="${deal.id}">Log</button>`
    ].filter(Boolean).join('');
    return `<tr>
      <td>
        <div class="app-person">
          <span class="app-avatar${avatarClass(index)}">${esc(initials(deal.company))}</span>
          <div>
            <div class="app-person__name">${esc(deal.company)}</div>
            <div class="app-person__sub">${esc(deal.contact)} · ${esc(deal.sector)}</div>
          </div>
        </div>
      </td>
      <td>${status(deal.stage, STAGE_TONE[deal.stage] || 'neutral')}</td>
      <td>${ownerCell(deal.owner)}</td>
      <td class="num">${money(deal.value)}</td>
      <td>${nextActionCell(deal)}</td>
      <td class="actions">${actions}</td>
    </tr>`;
  }

  function renderKpis() {
    const open = deals.filter(deal => !isClosed(deal));
    const pipeline = open.reduce((sum, deal) => sum + deal.value, 0);
    const won = deals.filter(deal => deal.stage === 'Won').length;
    const lost = deals.filter(deal => deal.stage === 'Lost').length;
    const winRate = won + lost ? Math.round((won / (won + lost)) * 100) : 0;
    const overdue = open.filter(isOverdue);
    const dueToday = open.filter(deal => !deal.done && dayDiff(deal.due) === 0).length;
    const oldest = overdue.reduce((max, deal) => Math.max(max, -dayDiff(deal.due)), 0);

    $('#kpiPipeline').textContent = money(pipeline, { compact: true });
    $('#kpiPipelineMeta').innerHTML = `${open.length} open deals <span class="app-delta">+8.4%</span> vs last month`;
    $('#kpiWin').textContent = `${winRate}%`;
    $('#kpiWinMeta').innerHTML = `${won} won · ${lost} lost <span class="app-delta">+4.2 pts</span>`;
    $('#kpiOpen').textContent = String(open.length);
    $('#kpiOpenMeta').textContent = `${dueToday} due today · ${overdue.length} overdue`;
    $('#kpiOverdue').textContent = String(overdue.length);
    $('#kpiOverdueMeta').innerHTML = overdue.length
      ? `<span class="app-delta app-delta--down">${oldest}d</span> oldest wait · ${state.cleared} cleared today`
      : `All follow-ups on track · ${state.cleared} cleared today`;

    $('#pipelineCount').textContent = `${open.length} open`;
    $('#dealCount').textContent = `${deals.length} records`;

    const stages = OPEN_STAGES.map(stage => ({
      stage,
      deals: open.filter(deal => deal.stage === stage)
    }));
    const values = stages.map(entry => entry.deals.reduce((sum, deal) => sum + deal.value, 0));
    $('#pipelineChart').innerHTML = chartBars(values, OPEN_STAGES);
    $('#pipelineRows').innerHTML = stages.map(entry => `<div class="app-row"><span>${esc(entry.stage)}</span><b class="num">${entry.deals.length} · ${money(entry.deals.reduce((sum, deal) => sum + deal.value, 0), { compact: true })}</b></div>`).join('');
  }

  function renderTable() {
    const query = state.search.trim().toLowerCase();
    const filtered = deals.filter(deal => {
      const stageOk = state.stage === 'All' || deal.stage === state.stage;
      if (!stageOk) return false;
      if (!query) return true;
      return `${deal.company} ${deal.contact} ${deal.owner} ${deal.stage} ${deal.nextAction} ${deal.sector}`.toLowerCase().includes(query);
    });

    $('#dealBody').innerHTML = filtered.length
      ? filtered.map(dealRow).join('')
      : '<tr><td colspan="6" class="app-table__empty">No deals match this search and stage filter.</td></tr>';
    $('#dealResult').textContent = `Showing ${filtered.length} of ${deals.length} deals`;
    $$('#stageFilters .app-chip').forEach(chip => {
      const active = chip.dataset.stage === state.stage;
      chip.classList.toggle('is-active', active);
      chip.setAttribute('aria-pressed', String(active));
    });
  }

  function renderActivity() {
    $('#activityList').innerHTML = activity.map(item => `<div class="app-activity__item"><span class="app-activity__dot"></span><div>${esc(item.text)}</div><span class="app-activity__time">${esc(item.time)}</span></div>`).join('');
  }

  function render() {
    renderKpis();
    renderTable();
    renderActivity();
  }

  /* ── actions ─────────────────────────────────────────────────────────── */
  function advance(id) {
    const deal = deals.find(item => item.id === id);
    if (!deal) return;
    const index = FLOW.indexOf(deal.stage);
    if (index < 0 || deal.stage === 'Won') return;
    const next = FLOW[index + 1];
    deal.stage = next;
    deal.done = false;
    if (next === 'Won') {
      deal.done = true;
      deal.nextAction = 'Closed won';
      addActivity(`Deal won — ${deal.company} (sample).`);
      toast(`${deal.company} marked Won — ${money(deal.value)}`, 'ok');
    } else {
      addActivity(`Deal advanced — ${deal.company} moved to ${next}.`);
      toast(`${deal.company} moved to ${next}`, 'ok');
    }
    render();
  }

  function markDone(id) {
    const deal = deals.find(item => item.id === id);
    if (!deal) return;
    deal.done = true;
    deal.nextAction = 'Follow-up completed';
    state.cleared += 1;
    addActivity(`Follow-up completed — ${deal.company}.`);
    toast(`Follow-up marked done — ${deal.company}`, 'ok');
    render();
  }

  function exportDeals() {
    const rows = [['Company', 'Contact', 'Sector', 'Stage', 'Owner', 'Value (USD)', 'Next action', 'Follow-up date', 'Follow-up status']];
    deals.forEach(deal => rows.push([
      deal.company, deal.contact, deal.sector, deal.stage, deal.owner, deal.value,
      deal.nextAction, deal.due, isClosed(deal) ? 'Closed' : (deal.done ? 'Cleared' : (isOverdue(deal) ? 'Overdue' : 'Open'))
    ]));
    exportCSV('crm-pipeline.csv', rows);
  }

  /* ── drawers ─────────────────────────────────────────────────────────── */
  function openNewDeal() {
    const body = `
      <form class="app-form" id="dealForm">
        <div class="app-field app-field--full">
          <label class="app-label" for="fCompany">Company</label>
          <input class="app-input" id="fCompany" name="company" type="text" placeholder="Sample company name" autocomplete="off">
        </div>
        <div class="app-field">
          <label class="app-label" for="fContact">Contact</label>
          <input class="app-input" id="fContact" name="contact" type="text" placeholder="Sample contact" autocomplete="off">
        </div>
        <div class="app-field">
          <label class="app-label" for="fValue">Deal value (USD)</label>
          <input class="app-input" id="fValue" name="value" type="number" min="0" step="100" placeholder="12000">
        </div>
        <div class="app-field">
          <label class="app-label" for="fStage">Stage</label>
          <select class="app-select" id="fStage" name="stage">
            ${OPEN_STAGES.map(stage => `<option value="${stage}">${stage}</option>`).join('')}
          </select>
        </div>
        <div class="app-field">
          <label class="app-label" for="fOwner">Owner</label>
          <select class="app-select" id="fOwner" name="owner">
            ${OWNERS.map(owner => `<option value="${esc(owner)}">${esc(owner)}</option>`).join('')}
          </select>
        </div>
        <div class="app-field">
          <label class="app-label" for="fNext">Next action</label>
          <input class="app-input" id="fNext" name="next" type="text" placeholder="Schedule discovery call" autocomplete="off">
        </div>
        <div class="app-field">
          <label class="app-label" for="fDue">Follow-up date</label>
          <input class="app-input" id="fDue" name="due" type="date" value="${isoOffset(3)}">
        </div>
      </form>
      <div class="app-note"><b>Sample only.</b> Creating a deal updates this demo's local state — nothing is saved or sent.</div>`;

    openDrawer({
      title: 'New deal',
      body,
      footer: `<button class="app-btn app-btn--secondary" type="button" data-close>Cancel</button>
               <button class="app-btn app-btn--primary" type="submit" form="dealForm">Create deal</button>`,
      onMount(overlay) {
        $('[data-close]', overlay).addEventListener('click', closeDrawer);
        const form = $('#dealForm', overlay);
        form.addEventListener('submit', event => {
          event.preventDefault();
          const company = $('#fCompany', overlay).value.trim();
          const contact = $('#fContact', overlay).value.trim();
          const value = Number($('#fValue', overlay).value);
          if (!company || !(value > 0)) {
            toast('Add a company name and a deal value above zero.', 'warn');
            if (!company) $('#fCompany', overlay).focus(); else $('#fValue', overlay).focus();
            return;
          }
          const deal = {
            id: nextId++,
            company,
            contact: contact || 'Sample contact',
            sector: 'Sample sector',
            owner: $('#fOwner', overlay).value,
            stage: $('#fStage', overlay).value,
            value,
            nextAction: $('#fNext', overlay).value.trim() || 'Initial call',
            due: $('#fDue', overlay).value || isoOffset(3),
            done: false
          };
          deals.unshift(deal);
          addActivity(`New deal created — ${company} (${money(value)}).`);
          closeDrawer();
          render();
          toast(`Deal created — ${company} · ${money(value)}`, 'ok');
        });
      }
    });
  }

  function openActivityDrawer(id) {
    const deal = deals.find(item => item.id === id);
    if (!deal) return;
    const body = `
      <div class="app-rows">
        <div class="app-row"><span>Company</span><b>${esc(deal.company)}</b></div>
        <div class="app-row"><span>Stage</span><b>${esc(deal.stage)}</b></div>
        <div class="app-row"><span>Owner</span><b>${esc(deal.owner)}</b></div>
        <div class="app-row"><span>Value</span><b data-usd="${deal.value}">${money(deal.value)}</b></div>
      </div>
      <form class="app-form" id="activityForm">
        <div class="app-field app-field--full">
          <label class="app-label" for="aType">Activity type</label>
          <select class="app-select" id="aType">
            <option>Call</option><option>Email</option><option>Meeting</option><option>Note</option>
          </select>
        </div>
        <div class="app-field app-field--full">
          <label class="app-label" for="aNote">Note</label>
          <textarea class="app-textarea" id="aNote" placeholder="What was discussed? Sample text only."></textarea>
        </div>
        <div class="app-field app-field--full">
          <label class="app-label" for="aNext">Next action</label>
          <input class="app-input" id="aNext" type="text" value="${esc(deal.done ? 'Send follow-up' : deal.nextAction)}" autocomplete="off">
        </div>
        <div class="app-field app-field--full">
          <label class="app-label" for="aDue">Follow-up date</label>
          <input class="app-input" id="aDue" type="date" value="${esc(deal.due)}">
        </div>
      </form>
      <div class="app-note"><b>Sample only.</b> Logging an activity updates the table, KPI counts and the activity feed.</div>`;

    openDrawer({
      title: `Log activity · ${deal.company}`,
      body,
      footer: `<button class="app-btn app-btn--secondary" type="button" data-close>Cancel</button>
               <button class="app-btn app-btn--primary" type="submit" form="activityForm">Save activity</button>`,
      onMount(overlay) {
        $('[data-close]', overlay).addEventListener('click', closeDrawer);
        $('#activityForm', overlay).addEventListener('submit', event => {
          event.preventDefault();
          const type = $('#aType', overlay).value;
          const note = $('#aNote', overlay).value.trim();
          const next = $('#aNext', overlay).value.trim();
          const due = $('#aDue', overlay).value;
          deal.nextAction = next || 'Follow up';
          deal.due = due || isoOffset(3);
          deal.done = false;
          addActivity(`${type} logged — ${deal.company}${note ? `: ${note}` : '.'}`);
          closeDrawer();
          render();
          toast(`Activity saved for ${deal.company}`, 'ok');
        });
      }
    });
  }

  /* ── wiring ──────────────────────────────────────────────────────────── */
  function wire() {
    $('#dealSearch').addEventListener('input', event => {
      state.search = event.target.value;
      renderTable();
    });
    $('#stageFilters').addEventListener('click', event => {
      const chip = event.target.closest('[data-stage]');
      if (!chip) return;
      state.stage = chip.dataset.stage;
      renderTable();
    });
    $('[data-new-deal]').addEventListener('click', openNewDeal);
    $('[data-export-crm]').addEventListener('click', exportDeals);
    $('#dealBody').addEventListener('click', event => {
      const advanceBtn = event.target.closest('[data-advance]');
      if (advanceBtn) { advance(Number(advanceBtn.dataset.advance)); return; }
      const doneBtn = event.target.closest('[data-done]');
      if (doneBtn) { markDone(Number(doneBtn.dataset.done)); return; }
      const logBtn = event.target.closest('[data-log]');
      if (logBtn) openActivityDrawer(Number(logBtn.dataset.log));
    });
  }

  ready(() => {
    wire();
    render();
    App.onCurrency(render);
  });
})();
