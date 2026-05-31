/* ============================================================
   InsightXI Admin — Overview command center
   ============================================================ */
(function () {
  const A = () => window.AdminData;
  const M = () => window.Admin;

  function render_overview(host) {
    const d = A(), k = d.kpis, I = M().I;
    const free = k.totalUsers - k.premium - k.trialing;
    const kpis = [
      { lab: 'Total Users', ic: 'users', col: 'blue', bg: 'rgba(46,125,255,.12)', fg: 'var(--blue-2)', val: k.totalUsers.toLocaleString(), delta: '▲ 10.6%', dc: 'up', sp: d.series.userGrowth.map(p => p.y) },
      { lab: 'Premium Subscribers', ic: 'shield', col: 'gold', bg: 'rgba(232,194,112,.12)', fg: 'var(--gold)', val: k.premium.toLocaleString(), delta: '▲ 6.2%', dc: 'up', sp: [2.6, 2.7, 2.8, 2.9, 3.0, 3.05, 3.1, 3.15, 3.18, 3.2, 3.21].map(x => x * 1000) },
      { lab: 'Monthly Recurring Rev', ic: 'money', col: 'green', bg: 'rgba(39,224,138,.12)', fg: 'var(--green-2)', val: '£' + (k.mrr / 1000).toFixed(1) + 'k', delta: '▲ 8.8%', dc: 'up', sp: d.series.revenue },
      { lab: 'Model Accuracy', ic: 'preds', col: 'cyan', bg: 'rgba(25,211,227,.12)', fg: 'var(--cyan)', val: k.accuracy + '%', delta: '▲ 0.8pts', dc: 'up', sp: d.series.accuracy },
      { lab: 'Active Now', ic: 'activity', col: 'red', bg: 'rgba(255,91,107,.12)', fg: '#ff8a95', val: k.activeNow.toLocaleString(), delta: 'live', dc: 'muted', sp: d.series.activeHourly },
      { lab: 'Churn (30d)', ic: 'refresh', col: 'violet', bg: 'rgba(155,123,255,.12)', fg: 'var(--violet)', val: k.churn + '%', delta: '▼ 0.3pts', dc: 'up', sp: [2.8, 2.7, 2.6, 2.5, 2.4, 2.3, 2.2, 2.1] },
    ];
    const sparkIds = kpis.map((_, i) => 'ovsp' + i);

    host.innerHTML = `
      <div class="ph-head">
        <div><div class="ph-eyebrow">Command center</div><h1>Overview</h1><div class="sub">Sunday, 31 May 2026 · platform health, growth and model performance at a glance</div></div>
        <div class="flex gap-10 aic wrap">
          <button class="btn" id="ovBroadcast">${I.broadcast} Broadcast</button>
          <button class="btn btn-primary" id="ovReport">${I.download} Export report</button>
        </div>
      </div>

      <div class="grid" style="grid-template-columns:repeat(3,1fr)">
        ${kpis.map((c, i) => `
          <div class="stat-card">
            <div class="lab"><span class="ic-sq" style="background:${c.bg};color:${c.fg}">${I[c.ic]}</span>${c.lab}</div>
            <div class="val">${c.val}</div>
            <div class="delta ${c.dc}">${c.delta} <span class="dim" style="font-weight:500">${c.dc === 'muted' ? '' : 'vs last month'}</span></div>
            <div class="spark" id="${sparkIds[i]}"></div>
          </div>`).join('')}
      </div>

      <div class="grid" style="grid-template-columns:1.5fr 1fr;margin-top:16px">
        <div class="panel"><div class="panel-hd"><h3><span class="ic">${I.users}</span>User Growth</h3><span class="tag">Last 12 weeks</span></div><div class="panel-bd"><div id="ovGrowth"></div></div></div>
        <div class="panel"><div class="panel-hd"><h3><span class="ic">${I.card}</span>Plan Distribution</h3></div><div class="panel-bd flex aic gap-16"><div style="width:150px;flex-shrink:0" id="ovDonut"></div><div style="flex:1" id="ovLegend"></div></div></div>
      </div>

      <div class="grid" style="grid-template-columns:1fr 1.5fr;margin-top:16px">
        <div class="panel"><div class="panel-hd"><h3><span class="ic">${I.money}</span>Revenue</h3><span class="tag ok">£28.4k MRR</span></div><div class="panel-bd"><div id="ovRev"></div></div></div>
        <div class="panel"><div class="panel-hd"><h3><span class="ic">${I.activity}</span>Recent Activity</h3><span class="tag" id="ovAuditMore" style="cursor:pointer">View log →</span></div><div class="panel-bd" id="ovAudit" style="padding:8px 18px"></div></div>
      </div>

      <div class="grid" style="grid-template-columns:1fr 1fr;margin-top:16px">
        <div class="panel"><div class="panel-hd"><h3><span class="ic">${I.users}</span>Recent Signups</h3><span class="tag info" id="ovUsersMore" style="cursor:pointer">All users →</span></div><div class="panel-bd" id="ovSignups" style="padding:6px 8px"></div></div>
        <div class="panel"><div class="panel-hd"><h3><span class="ic">${I.shield}</span>System Health</h3><span class="tag ok"><span class="dt"></span>Operational</span></div><div class="panel-bd" id="ovHealth" style="padding:6px 18px"></div></div>
      </div>`;

    // signups
    const recent = [...d.users].sort((a, b) => a.signupDays - b.signupDays).slice(0, 6);
    document.getElementById('ovSignups').innerHTML = recent.map(u => `
      <div class="flex aic gap-10" style="padding:9px 10px;border-radius:10px" onmouseover="this.style.background='var(--surface-2)'" onmouseout="this.style.background=''">
        <span class="av-sq sm" style="background:linear-gradient(150deg,${u.color},${u.color}aa)">${u.avatar}</span>
        <div class="grow" style="min-width:0"><div style="font-weight:600;font-size:13px;color:var(--text)">${u.name}</div><div class="muted" style="font-size:11px">${u.email}</div></div>
        <span class="tag ${u.plan === 'Premium' ? 'pro' : u.plan === 'Trial' ? 'info' : 'neutral'}">${u.plan}</span>
      </div>`).join('');
    document.getElementById('ovUsersMore').onclick = () => M().route('users');

    // health
    const health = [
      ['Model API', '<span class="tag ok"><span class="dt"></span>200 OK</span>'],
      ['Prediction latency', '<span class="v mono">142 ms</span>'],
      ['Live data feed', '<span class="tag ok"><span class="dt"></span>Connected</span>'],
      ['Background jobs', '<span class="v mono">3 running</span>'],
      ['Last model run', '<span class="v">v4.2 · 2h ago</span>'],
      ['Error rate (24h)', '<span class="v mono up">0.04%</span>'],
    ];
    document.getElementById('ovHealth').innerHTML = health.map(h => `<div class="kv"><span class="k">${h[0]}</span><span class="v">${h[1]}</span></div>`).join('');

    // audit feed
    document.getElementById('ovAudit').innerHTML = d.audit.slice(0, 6).map(a => `
      <div class="flex aic gap-10" style="padding:8px 0;border-bottom:1px solid var(--line)">
        <span class="av-sq sm" style="width:28px;height:28px;font-size:11px;background:linear-gradient(150deg,#2a3550,#1a2236)">${a.actor.split(' ').map(x => x[0]).join('')}</span>
        <div class="grow" style="font-size:12.5px;color:var(--text-2)"><b style="color:var(--text)">${a.actor.split(' ')[0]}</b> ${a.action} <span class="mono" style="color:var(--blue-2)">${a.target}</span></div>
        <span class="dim mono" style="font-size:11px">${d.relTime(a.mins)}</span>
      </div>`).join('');
    document.getElementById('ovAuditMore').onclick = () => M().route('audit');
    document.getElementById('ovBroadcast').onclick = () => M().toast('Broadcast composer — opening');
    document.getElementById('ovReport').onclick = () => M().toast('Generating platform report…');

    // charts
    const X = window.IXChart, C = X.C;
    kpis.forEach((c, i) => X.spark('#' + sparkIds[i], c.sp, { w: 130, h: 36, area: true, color: C[c.col] }));
    X.line('#ovGrowth', { w: 640, h: 220, yLabels: true, yMax: 2700, gy: 4, xLabels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'], xMax: 11, series: [{ color: C.blue, area: true, endDot: true, data: d.series.userGrowth }] });
    X.line('#ovRev', { w: 420, h: 200, yLabels: true, yDec: 0, yMax: 32, gy: 4, xLabels: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'], xMax: 11, series: [{ color: C.gold, area: true, endDot: true, data: d.series.revenue.map((y, x) => ({ x, y })) }] });
    const pPrem = Math.round(k.premium / k.totalUsers * 100), pTrial = Math.round(k.trialing / k.totalUsers * 100), pFree = 100 - pPrem - pTrial;
    X.donut('#ovDonut', [{ v: pPrem, color: C.gold }, { v: pTrial, color: C.blue }, { v: pFree, color: '#54607a' }], { size: 150, stroke: 18, centerTop: pPrem + '%', centerBot: 'Premium' });
    document.getElementById('ovLegend').innerHTML = [
      ['Premium', pPrem, k.premium, 'var(--gold)'], ['Trial', pTrial, k.trialing, 'var(--blue)'], ['Free', pFree, free, '#54607a'],
    ].map(r => `<div class="flex aic gap-10" style="padding:7px 0;border-bottom:1px solid var(--line)"><span style="width:10px;height:10px;border-radius:3px;background:${r[3]};flex-shrink:0"></span><span class="grow" style="font-size:13px;font-weight:600">${r[0]}</span><span class="muted mono" style="font-size:12px">${r[2].toLocaleString()}</span><span class="mono" style="font-size:13px;font-weight:700;width:38px;text-align:right">${r[1]}%</span></div>`).join('');
  }

  window.AdminScreens = Object.assign(window.AdminScreens || {}, { render_overview });
})();
