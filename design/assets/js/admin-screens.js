/* ============================================================
   InsightXI Admin — Subscriptions · Predictions · Fixtures · Content
   ============================================================ */
(function () {
  const A = () => window.AdminData;
  const M = () => window.Admin;
  const D = () => window.IXData;
  const crest = (c, s) => D().crest(c, s || 'xs');
  const tag = (t, cls) => `<span class="tag ${cls}">${t}</span>`;

  function statCard(lab, val, delta, dc, icon, bg, fg) {
    return `<div class="stat-card"><div class="lab"><span class="ic-sq" style="background:${bg};color:${fg}">${M().I[icon]}</span>${lab}</div><div class="val">${val}</div><div class="delta ${dc || 'up'}">${delta}</div></div>`;
  }

  /* =============== SUBSCRIPTIONS =============== */
  function render_subscriptions(host) {
    const d = A(), k = d.kpis, I = M().I;
    const txns = d.txns.map(t => Object.assign({ _name: t.user.name, _email: t.user.email }, t));
    host.innerHTML = `
      <div class="ph-head">
        <div><div class="ph-eyebrow">Billing & revenue</div><h1>Subscriptions</h1><div class="sub">${k.premium.toLocaleString()} active subscribers · £${(k.mrr / 1000).toFixed(1)}k MRR · £${(k.arr / 1000).toFixed(1)}k ARR</div></div>
        <button class="btn btn-primary" id="subExport">${I.download} Export revenue</button>
      </div>
      <div class="grid" style="grid-template-columns:repeat(4,1fr)">
        ${statCard('MRR', '£' + (k.mrr / 1000).toFixed(1) + 'k', '▲ 8.8% MoM', 'up', 'money', 'rgba(39,224,138,.12)', 'var(--green-2)')}
        ${statCard('ARR', '£' + (k.arr / 1000).toFixed(1) + 'k', '▲ 11.2% YoY', 'up', 'card', 'rgba(46,125,255,.12)', 'var(--blue-2)')}
        ${statCard('ARPU', '£' + k.arpu.toFixed(2), '▲ £0.40', 'up', 'users', 'rgba(155,123,255,.12)', 'var(--violet)')}
        ${statCard('Churn (30d)', k.churn + '%', '▼ 0.3pts', 'up', 'refresh', 'rgba(232,194,112,.12)', 'var(--gold)')}
      </div>

      <div class="grid" style="grid-template-columns:1.6fr 1fr;margin-top:16px">
        <div class="panel"><div class="panel-hd"><h3><span class="ic">${I.money}</span>Revenue Trend</h3><span class="tag ok">+8.8%</span></div><div class="panel-bd"><div id="subRev"></div></div></div>
        <div class="panel"><div class="panel-hd"><h3><span class="ic">${I.card}</span>Plans</h3></div><div class="panel-bd" id="subPlans" style="display:flex;flex-direction:column;gap:10px"></div></div>
      </div>

      <div style="margin-top:22px"><div class="flex aic jcb" style="margin-bottom:14px"><h3 style="font-size:16px;font-weight:700">Recent Transactions</h3><div class="f-search">${I.search}<input id="txSearch" placeholder="Search customer…"></div></div><div id="txTable"></div></div>`;

    document.getElementById('subPlans').innerHTML = [
      ['Free', '£0', (k.totalUsers - k.premium - k.trialing).toLocaleString() + ' users', 'neutral'],
      ['Monthly', '£9.99', Math.round(k.premium * 0.55).toLocaleString() + ' subs', 'info'],
      ['Annual', '£79', Math.round(k.premium * 0.45).toLocaleString() + ' subs', 'pro'],
    ].map(p => `<div class="flex aic gap-12" style="padding:12px 14px;border:1px solid var(--line);border-radius:12px;background:var(--surface-1)"><div class="grow"><div style="font-weight:700;font-size:14px">${p[0]}</div><div class="muted" style="font-size:11.5px">${p[2]}</div></div><div class="mono" style="font-weight:700;font-size:16px">${p[1]}</div>${tag(p[0] === 'Free' ? 'Active' : 'Selling', p[3])}</div>`).join('');

    const txStatTag = s => tag(s, s === 'Paid' ? 'ok' : s === 'Failed' ? 'bad' : 'warn');
    const t = M().DataTable(document.getElementById('txTable'), {
      rows: txns, pageSize: 8, searchKeys: ['_name', '_email', 'id'],
      sortKey: 'date', sortDir: 'desc',
      columns: [
        { key: 'id', label: 'Invoice', render: r => `<span class="mono" style="font-size:12px;color:var(--text-2)">${r.id}</span>` },
        { key: '_name', label: 'Customer', sortable: true, render: r => `<div class="cell-user"><span class="av-sq sm" style="background:linear-gradient(150deg,${r.user.color},${r.user.color}aa)">${r.user.avatar}</span><div><div class="nm">${r.user.name}</div><div class="em">${r.user.email}</div></div></div>` },
        { key: 'plan', label: 'Plan', sortable: true, render: r => tag(r.plan, r.plan === 'Annual' ? 'pro' : 'info') },
        { key: 'amount', label: 'Amount', sortable: true, align: 'right', render: r => `<span class="cell-num">£${r.amount.toFixed(2)}</span>` },
        { key: 'method', label: 'Method', render: r => `<span class="muted" style="font-size:12px">${r.method}</span>` },
        { key: 'status', label: 'Status', sortable: true, render: r => txStatTag(r.status) },
        { key: 'date', label: 'Date', sortable: true, render: r => `<span class="mono" style="font-size:12px;color:var(--text-2)">${d.fmtDate(r.date)}</span>`, sortVal: r => r.date.getTime() },
        { key: 'act', label: '', render: r => `<div class="row-actions"><span class="mini-btn" title="Refund">${M().I.money}</span></div>` },
      ],
      rowClick: r => M().toast(r.status === 'Refunded' ? 'Already refunded' : 'Refund issued for ' + r.id),
    });
    document.getElementById('txSearch').addEventListener('input', e => t.setSearch(e.target.value));
    document.getElementById('subExport').onclick = () => M().toast('Revenue export started');
    const X = window.IXChart, C = X.C;
    X.line('#subRev', { w: 620, h: 200, yLabels: true, yMax: 32, gy: 4, xLabels: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'], xMax: 11, series: [{ color: C.green, area: true, endDot: true, data: d.series.revenue.map((y, x) => ({ x, y })) }] });
  }

  /* =============== PREDICTIONS & MODEL =============== */
  function render_predictions(host) {
    const d = A(), I = M().I;
    const hits = d.picks.filter(p => p.result === 'Hit').length;
    const miss = d.picks.filter(p => p.result === 'Miss').length;
    const pending = d.picks.filter(p => p.result === 'Pending').length;
    const hitRate = Math.round(hits / (hits + miss) * 100);
    const avgConf = Math.round(d.picks.reduce((s, p) => s + p.conf, 0) / d.picks.length);
    host.innerHTML = `
      <div class="ph-head">
        <div><div class="ph-eyebrow">Model performance</div><h1>Predictions & Model</h1><div class="sub">Engine v4.2 · ${d.picks.length} picks audited · ${hitRate}% hit rate this window</div></div>
        <button class="btn" id="prRetrain">${I.refresh} Retrain model</button>
      </div>
      <div class="grid" style="grid-template-columns:repeat(4,1fr)">
        ${statCard('Model Accuracy', d.kpis.accuracy + '%', '▲ 0.8pts', 'up', 'preds', 'rgba(25,211,227,.12)', 'var(--cyan)')}
        ${statCard('Hit Rate (settled)', hitRate + '%', hits + ' of ' + (hits + miss), 'up', 'shield', 'rgba(39,224,138,.12)', 'var(--green-2)')}
        ${statCard('Avg Confidence', avgConf + '%', 'calibrated', 'muted', 'activity', 'rgba(46,125,255,.12)', 'var(--blue-2)')}
        ${statCard('Pending Picks', '' + pending, 'awaiting results', 'muted', 'fixtures', 'rgba(232,194,112,.12)', 'var(--gold)')}
      </div>
      <div class="grid" style="grid-template-columns:1.5fr 1fr;margin-top:16px">
        <div class="panel"><div class="panel-hd"><h3><span class="ic">${I.preds}</span>Accuracy Trend</h3><span class="tag">Last 12 weeks</span></div><div class="panel-bd"><div id="prAcc"></div></div></div>
        <div class="panel"><div class="panel-hd"><h3><span class="ic">${I.activity}</span>Confidence Calibration</h3></div><div class="panel-bd"><div id="prCal"></div><div class="muted center" style="font-size:11.5px;margin-top:8px">Predicted vs actual win rate by confidence bucket</div></div></div>
      </div>
      <div style="margin-top:22px"><div class="flex aic jcb wrap gap-12" style="margin-bottom:14px"><h3 style="font-size:16px;font-weight:700">Picks Audit</h3><select class="f-sel" id="prFilter"><option value="">All results</option><option>Hit</option><option>Miss</option><option>Pending</option></select></div><div id="prTable"></div></div>`;

    const resTag = r => tag(r, r === 'Hit' ? 'ok' : r === 'Miss' ? 'bad' : 'warn');
    const t = M().DataTable(document.getElementById('prTable'), {
      rows: d.picks, pageSize: 8, sortKey: 'date', sortDir: 'desc',
      columns: [
        { key: 'match', label: 'Fixture', render: r => `<span class="flex aic gap-7" style="font-weight:600;color:var(--text)">${crest(r.home)} ${D().CLUBS[r.home].short} <span class="dim" style="font-weight:400">v</span> ${D().CLUBS[r.away].short} ${crest(r.away)}</span>` },
        { key: 'market', label: 'Market', sortable: true, render: r => `<span class="muted" style="font-size:12.5px">${r.market}</span>` },
        { key: 'pick', label: 'Pick', render: r => tag(r.pick, 'info') },
        { key: 'conf', label: 'Confidence', sortable: true, align: 'right', render: r => `<span class="flex aic gap-8" style="justify-content:flex-end"><span style="width:46px"><span class="meter ${r.conf >= 70 ? 'green' : ''}" style="height:5px"><i style="width:${r.conf}%"></i></span></span><span class="cell-num">${r.conf}%</span></span>` },
        { key: 'result', label: 'Result', sortable: true, render: r => resTag(r.result) },
        { key: 'model', label: 'Model', render: r => `<span class="mono" style="font-size:11.5px;color:var(--muted)">${r.model}</span>` },
        { key: 'date', label: 'Published', sortable: true, render: r => `<span class="mono" style="font-size:12px;color:var(--text-2)">${d.fmtDate(r.date)}</span>`, sortVal: r => r.date.getTime() },
      ],
      rowClick: r => M().toast(`${D().CLUBS[r.home].short} v ${D().CLUBS[r.away].short} · ${r.market} · ${r.result}`, true),
    });
    document.getElementById('prFilter').onchange = e => t.setFilter(v => !e.target.value || v.result === e.target.value);
    document.getElementById('prRetrain').onclick = () => M().toast('Model retrain queued · v4.3 candidate');
    const X = window.IXChart, C = X.C;
    X.line('#prAcc', { w: 600, h: 200, yLabels: true, yDec: 0, yMax: 80, yMin: 60, gy: 4, xLabels: ['W1', 'W4', 'W8', 'W12'], xMax: 11, series: [{ color: C.cyan, area: true, endDot: true, data: d.series.accuracy.map((y, x) => ({ x, y })) }] });
    X.bars('#prCal', [{ label: '55-60', v: 57, color: C.blue }, { label: '60-65', v: 63, color: C.blue }, { label: '65-70', v: 69, color: C.cyan }, { label: '70-75', v: 73, color: C.green }, { label: '75+', v: 79, color: C.green }], { w: 360, h: 170, max: 90 });
  }

  /* =============== FIXTURES & MATCHES =============== */
  function render_fixtures(host) {
    const d = A(), I = M().I, DD = D();
    host.innerHTML = `
      <div class="ph-head">
        <div><div class="ph-eyebrow">Match data</div><h1>Fixtures & Matches</h1><div class="sub">Manage scheduling, model coverage and the featured Match of the Day</div></div>
        <button class="btn btn-primary" id="fxAdd">${I.plus} Add fixture</button>
      </div>
      <div class="seg-tabs" id="fxTabs" style="max-width:320px;margin-bottom:16px"><div class="t active" data-t="upcoming">Upcoming</div><div class="t" data-t="live">Live</div><div class="t" data-t="results">Results</div></div>
      <div id="fxTable"></div>`;

    function buildRows(kind) {
      if (kind === 'live') return DD.NOW_LIVE.map(m => ({ id: m.id, home: m.home, away: m.away, comp: m.comp, when: `LIVE ${m.min}'`, score: `${m.hs}–${m.as}`, status: 'Live', conf: m.conf }));
      if (kind === 'results') return DD.RESULTS.map((m, i) => ({ id: 'res' + i, home: m.home, away: m.away, comp: m.comp, when: m.date, score: `${m.hs}–${m.as}`, status: m.verdict === 'hit' ? 'Pick hit' : 'Pick miss', conf: null, verdict: m.verdict }));
      return DD.UPCOMING.map(m => ({ id: m.id, home: m.home, away: m.away, comp: m.comp, when: `${m.date} ${m.time}`, score: '—', status: 'Scheduled', conf: m.conf }));
    }
    // first build
    const t = M().DataTable(document.getElementById('fxTable'), {
      rows: buildRows('upcoming'), pageSize: 8,
      columns: [
        { key: 'match', label: 'Fixture', render: r => `<span class="flex aic gap-7" style="font-weight:600;color:var(--text)">${crest(r.home)} ${DD.CLUBS[r.home].short} <span class="dim" style="font-weight:400">v</span> ${DD.CLUBS[r.away].short} ${crest(r.away)}</span>` },
        { key: 'comp', label: 'Competition', render: r => `<span class="muted" style="font-size:12.5px">${r.comp}</span>` },
        { key: 'when', label: 'Kickoff', render: r => `<span class="mono" style="font-size:12px;color:var(--text-2)">${r.when}</span>` },
        { key: 'score', label: 'Score', align: 'center', render: r => `<span class="cell-num">${r.score}</span>` },
        { key: 'status', label: 'Status', render: r => tag(r.status, r.status === 'Live' ? 'bad' : r.status === 'Scheduled' ? 'info' : r.status === 'Pick hit' ? 'ok' : r.verdict === 'miss' ? 'bad' : 'neutral') },
        { key: 'conf', label: 'Model', align: 'right', render: r => r.conf ? `<span class="tag info">AI ${r.conf}%</span>` : '<span class="dim">—</span>' },
        { key: 'act', label: '', render: r => `<div class="row-actions"><span class="mini-btn" title="Feature">${I.flag}</span><span class="mini-btn" title="Edit">${I.edit}</span></div>` },
      ],
      rowClick: r => M().toast(`${DD.CLUBS[r.home].short} v ${DD.CLUBS[r.away].short}`, true),
    });
    document.querySelectorAll('#fxTabs .t').forEach(tab => tab.onclick = () => {
      document.querySelectorAll('#fxTabs .t').forEach(x => x.classList.remove('active')); tab.classList.add('active');
      t.setRows(buildRows(tab.dataset.t));
    });
    document.getElementById('fxAdd').onclick = () => M().toast('New fixture form — opening');
  }

  /* =============== CONTENT =============== */
  function render_content(host) {
    const d = A(), I = M().I;
    host.innerHTML = `
      <div class="ph-head">
        <div><div class="ph-eyebrow">Editorial</div><h1>Content</h1><div class="sub">${d.posts.filter(p => p.status === 'Published').length} published · ${d.posts.filter(p => p.status === 'Draft').length} drafts · ${d.posts.filter(p => p.status === 'Scheduled').length} scheduled</div></div>
        <button class="btn btn-primary" id="ctNew">${I.plus} New post</button>
      </div>
      <div class="dt-toolbar"><div class="f-search">${I.search}<input id="ctSearch" placeholder="Search posts…"></div><select class="f-sel" id="ctStatus"><option value="">All statuses</option><option>Published</option><option>Scheduled</option><option>Draft</option></select></div>
      <div id="ctTable"></div>`;
    const stTag = s => tag(s, s === 'Published' ? 'ok' : s === 'Scheduled' ? 'warn' : 'neutral');
    const t = M().DataTable(document.getElementById('ctTable'), {
      rows: d.posts, pageSize: 8, searchKeys: ['title', 'author', 'category'], sortKey: 'date', sortDir: 'desc',
      columns: [
        { key: 'title', label: 'Title', sortable: true, render: r => `<div style="max-width:360px;white-space:normal"><div style="font-weight:600;color:var(--text);font-size:13.5px;line-height:1.35">${r.title}</div></div>` },
        { key: 'category', label: 'Category', sortable: true, render: r => tag(r.category, 'violet') },
        { key: 'author', label: 'Author', render: r => `<span class="muted" style="font-size:12.5px">${r.author}</span>` },
        { key: 'status', label: 'Status', sortable: true, render: r => stTag(r.status) },
        { key: 'views', label: 'Views', sortable: true, align: 'right', render: r => `<span class="cell-num">${r.views ? r.views.toLocaleString() : '—'}</span>` },
        { key: 'date', label: 'Date', sortable: true, render: r => `<span class="mono" style="font-size:12px;color:var(--text-2)">${d.fmtDate(r.date)}</span>`, sortVal: r => r.date.getTime() },
        { key: 'act', label: '', render: r => `<div class="row-actions"><span class="mini-btn" title="Edit">${I.edit}</span><span class="mini-btn" title="${r.status === 'Published' ? 'Unpublish' : 'Publish'}">${r.status === 'Published' ? I.eye : I.check}</span></div>` },
      ],
      rowClick: r => M().toast('Editing · ' + r.title, true),
    });
    document.getElementById('ctSearch').oninput = e => t.setSearch(e.target.value);
    document.getElementById('ctStatus').onchange = e => t.setFilter(v => !e.target.value || v.status === e.target.value);
    document.getElementById('ctNew').onclick = () => M().toast('New post composer — opening');
  }

  window.AdminScreens = Object.assign(window.AdminScreens || {}, { render_subscriptions, render_predictions, render_fixtures, render_content });
})();
