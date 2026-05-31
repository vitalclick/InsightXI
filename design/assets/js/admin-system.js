/* ============================================================
   InsightXI Admin — Support · Audit Log · Settings & Team
   ============================================================ */
(function () {
  const A = () => window.AdminData;
  const M = () => window.Admin;
  const tag = (t, cls) => `<span class="tag ${cls}">${t}</span>`;
  const prioTag = p => tag(p, p === 'High' ? 'bad' : p === 'Medium' ? 'warn' : 'neutral');
  const tstatTag = s => tag(s, s === 'Open' ? 'info' : s === 'Pending' ? 'warn' : 'ok');

  /* =============== SUPPORT =============== */
  function render_support(host) {
    const d = A(), I = M().I;
    const open = d.tickets.filter(t => t.status === 'Open').length;
    const pending = d.tickets.filter(t => t.status === 'Pending').length;
    const closed = d.tickets.filter(t => t.status === 'Closed').length;
    host.innerHTML = `
      <div class="ph-head">
        <div><div class="ph-eyebrow">Customer support</div><h1>Support</h1><div class="sub">${open} open · ${pending} pending · median first response 2h 14m</div></div>
        <button class="btn" id="spExport">${I.download} Export</button>
      </div>
      <div class="grid" style="grid-template-columns:repeat(4,1fr)">
        ${mini('Open', open, 'info', 'support')}${mini('Pending', pending, 'warn', 'refresh')}${mini('Closed (7d)', closed, 'ok', 'shield')}${mini('Avg response', '2h 14m', 'neutral', 'activity')}
      </div>
      <div class="seg-tabs" id="spTabs" style="max-width:380px;margin:18px 0 16px"><div class="t active" data-t="">All</div><div class="t" data-t="Open">Open</div><div class="t" data-t="Pending">Pending</div><div class="t" data-t="Closed">Closed</div></div>
      <div id="spTable"></div>`;

    const t = M().DataTable(document.getElementById('spTable'), {
      rows: d.tickets, pageSize: 9, sortKey: 'updatedMins', sortDir: 'asc',
      searchKeys: ['subject', 'id', 'category'],
      columns: [
        { key: 'id', label: 'Ticket', render: r => `<span class="mono" style="font-size:12px;color:var(--blue-2)">${r.id}</span>` },
        { key: 'subject', label: 'Subject', render: r => `<div style="max-width:320px;white-space:normal"><div style="font-weight:600;color:var(--text);font-size:13px;line-height:1.35">${r.subject}</div></div>` },
        { key: 'user', label: 'Requester', render: r => `<div class="cell-user"><span class="av-sq sm" style="background:linear-gradient(150deg,${r.user.color},${r.user.color}aa)">${r.user.avatar}</span><div class="nm">${r.user.name}</div></div>` },
        { key: 'category', label: 'Category', sortable: true, render: r => tag(r.category, 'neutral') },
        { key: 'priority', label: 'Priority', sortable: true, render: r => prioTag(r.priority), sortVal: r => ({ High: 0, Medium: 1, Low: 2 }[r.priority]) },
        { key: 'status', label: 'Status', sortable: true, render: r => tstatTag(r.status) },
        { key: 'assignee', label: 'Assignee', render: r => `<span class="muted" style="font-size:12px">${r.assignee}</span>` },
        { key: 'updatedMins', label: 'Updated', sortable: true, render: r => `<span class="dim mono" style="font-size:11.5px">${d.relTime(r.updatedMins)}</span>` },
      ],
      rowClick: openTicket,
    });
    document.querySelectorAll('#spTabs .t').forEach(tab => tab.onclick = () => {
      document.querySelectorAll('#spTabs .t').forEach(x => x.classList.remove('active')); tab.classList.add('active');
      t.setFilter(v => !tab.dataset.t || v.status === tab.dataset.t);
    });
    document.getElementById('spExport').onclick = () => M().toast('Tickets exported');

    function openTicket(tk) {
      const body = `
        <div class="flex aic gap-10" style="margin-bottom:14px"><span class="mono" style="font-size:12px;color:var(--blue-2)">${tk.id}</span>${prioTag(tk.priority)}${tstatTag(tk.status)}</div>
        <div class="panel" style="margin-bottom:16px"><div class="panel-bd" style="padding:6px 16px">
          <div class="kv"><span class="k">Requester</span><span class="v">${tk.user.name}</span></div>
          <div class="kv"><span class="k">Email</span><span class="v" style="font-size:12px">${tk.user.email}</span></div>
          <div class="kv"><span class="k">Category</span><span class="v">${tk.category}</span></div>
          <div class="kv"><span class="k">Assignee</span><span class="v">${tk.assignee}</span></div>
          <div class="kv"><span class="k">Opened</span><span class="v">${d.fmtDate(tk.date)}</span></div>
        </div></div>
        <div style="font-size:11px;color:var(--muted);font-weight:600;letter-spacing:.04em;text-transform:uppercase;margin-bottom:8px">Message</div>
        <div class="panel" style="margin-bottom:16px"><div class="panel-bd" style="font-size:13px;color:var(--text-2);line-height:1.55">Hi team — ${tk.subject.toLowerCase()}. This started happening recently and I'd appreciate a quick look. Account: ${tk.user.email}. Thanks!</div></div>
        <div class="field"><label>Reply</label><textarea class="ipt" id="tkReply" placeholder="Type your response…"></textarea></div>
        <div class="field"><label>Set status</label><select id="tkStatus"><option ${tk.status === 'Open' ? 'selected' : ''}>Open</option><option ${tk.status === 'Pending' ? 'selected' : ''}>Pending</option><option ${tk.status === 'Closed' ? 'selected' : ''}>Closed</option></select></div>`;
      const foot = `<button class="btn grow" id="tkClose">Cancel</button><button class="btn btn-primary grow" id="tkSend">${M().I.mail} Send reply</button>`;
      M().openDrawer(`<span style="font-size:14px">${tk.subject}</span>`, body, foot);
      document.getElementById('tkClose').onclick = M().closeDrawer;
      document.getElementById('tkStatus').onchange = e => { tk.status = e.target.value; t.render(); };
      document.getElementById('tkSend').onclick = () => { tk.status = document.getElementById('tkStatus').value; tk.updatedMins = 0; t.render(); M().closeDrawer(); M().toast('Reply sent · ' + tk.id); };
    }
  }
  function mini(lab, val, cls, icon) {
    const fg = cls === 'ok' ? 'var(--green-2)' : cls === 'warn' ? 'var(--amber)' : cls === 'info' ? 'var(--blue-2)' : 'var(--muted)';
    const bg = cls === 'ok' ? 'rgba(39,224,138,.12)' : cls === 'warn' ? 'rgba(255,177,61,.12)' : cls === 'info' ? 'rgba(46,125,255,.12)' : 'var(--surface-3)';
    return `<div class="stat-card"><div class="lab"><span class="ic-sq" style="background:${bg};color:${fg}">${M().I[icon]}</span>${lab}</div><div class="val">${val}</div></div>`;
  }

  /* =============== AUDIT LOG =============== */
  function render_audit(host) {
    const d = A(), I = M().I;
    const rows = d.audit.map(a => Object.assign({ _t: d.relTime(a.mins) }, a));
    host.innerHTML = `
      <div class="ph-head">
        <div><div class="ph-eyebrow">Security & compliance</div><h1>Audit Log</h1><div class="sub">Every administrative action across the platform, newest first</div></div>
        <button class="btn" id="auExport">${I.download} Export log</button>
      </div>
      <div class="dt-toolbar"><div class="f-search">${I.search}<input id="auSearch" placeholder="Search actor, action, target…"></div></div>
      <div id="auTable"></div>`;
    const t = M().DataTable(document.getElementById('auTable'), {
      rows, pageSize: 12, searchKeys: ['actor', 'action', 'target', 'ip'], sortKey: 'mins', sortDir: 'asc',
      columns: [
        { key: 'actor', label: 'Admin', render: r => `<div class="cell-user"><span class="av-sq sm" style="width:28px;height:28px;font-size:11px;background:linear-gradient(150deg,#2a3550,#1a2236)">${r.actor.split(' ').map(x => x[0]).join('')}</span><div class="nm" style="font-size:13px">${r.actor}</div></div>` },
        { key: 'action', label: 'Action', render: r => `<span style="color:var(--text-2)">${r.action}</span>` },
        { key: 'target', label: 'Target', render: r => `<span class="mono" style="font-size:12px;color:var(--blue-2)">${r.target}</span>` },
        { key: 'ip', label: 'IP address', render: r => `<span class="mono" style="font-size:12px;color:var(--muted)">${r.ip}</span>` },
        { key: 'mins', label: 'When', sortable: true, render: r => `<span class="dim mono" style="font-size:11.5px">${r._t}</span>` },
      ],
      rowClick: r => M().toast(`${r.actor} ${r.action} ${r.target}`, true),
    });
    document.getElementById('auSearch').oninput = e => t.setSearch(e.target.value);
    document.getElementById('auExport').onclick = () => M().toast('Audit log exported');
  }

  /* =============== SETTINGS & TEAM =============== */
  function render_settings(host) {
    const d = A(), I = M().I;
    host.innerHTML = `
      <div class="ph-head narrow"><div><div class="ph-eyebrow">Configuration</div><h1>Settings & Team</h1><div class="sub">Manage admin access, feature flags and platform configuration</div></div></div>

      <div class="grid" style="grid-template-columns:1fr;max-width:1180px;gap:16px">
        <div class="panel">
          <div class="panel-hd"><h3><span class="ic">${I.users}</span>Team Members</h3><button class="btn btn-sm btn-primary" id="stInvite">${I.plus} Invite teammate</button></div>
          <div class="panel-bd" id="stTeam" style="padding:6px 18px"></div>
        </div>

        <div class="panel">
          <div class="panel-hd"><h3><span class="ic">${I.flag}</span>Feature Flags</h3><span class="tag">${d.flags.filter(f => f.on).length}/${d.flags.length} on</span></div>
          <div class="panel-bd" id="stFlags" style="padding:6px 18px"></div>
        </div>

        <div class="grid" style="grid-template-columns:1fr 1fr;gap:16px">
          <div class="panel">
            <div class="panel-hd"><h3><span class="ic">${I.settings}</span>General</h3></div>
            <div class="panel-bd">
              <div class="field"><label>Platform name</label><input class="ipt" value="InsightXI"></div>
              <div class="field"><label>Support email</label><input class="ipt" value="support@insightxi.app"></div>
              <div class="field"><label>Default model version</label><select><option>v4.2 (stable)</option><option>v4.3 (candidate)</option><option>v4.1</option></select></div>
              <button class="btn btn-primary" id="stSave" style="width:100%;margin-top:4px">Save changes</button>
            </div>
          </div>
          <div class="panel">
            <div class="panel-hd"><h3><span class="ic">${I.eye}</span>Appearance & Region</h3></div>
            <div class="panel-bd" style="padding:6px 18px">
              <div class="kv"><span class="k">Dark theme</span><span class="sw" data-theme-sw id="stTheme"><i></i></span></div>
              <div class="kv"><span class="k">Compact tables</span><span class="sw on" data-sw><i></i></span></div>
              <div class="kv"><span class="k">Email digests</span><span class="sw on" data-sw><i></i></span></div>
              <div class="kv"><span class="k">Currency</span><span class="v">GBP (£)</span></div>
              <div class="kv"><span class="k">Timezone</span><span class="v">Europe/London</span></div>
              <div class="kv" style="border:none"><span class="k">Region</span><span class="v">United Kingdom</span></div>
            </div>
          </div>
        </div>

        <div class="panel" style="border-color:rgba(255,91,107,.28)">
          <div class="panel-hd"><h3 style="color:#ff8a95"><span class="ic" style="color:#ff8a95">${I.trash}</span>Danger Zone</h3></div>
          <div class="panel-bd flex aic jcb wrap gap-12">
            <div><div style="font-weight:600;font-size:13.5px">Purge model cache</div><div class="muted" style="font-size:12px">Forces a full recompute on next request.</div></div>
            <button class="btn" id="stPurge">${I.refresh} Purge cache</button>
          </div>
        </div>
      </div>`;

    // team
    document.getElementById('stTeam').innerHTML = d.team.map((m, i) => `
      <div class="flex aic gap-12" style="padding:11px 0;${i < d.team.length - 1 ? 'border-bottom:1px solid var(--line)' : ''}">
        <span class="av-sq md" style="background:linear-gradient(150deg,${m.color},${m.color}aa)">${m.name.split(' ').map(x => x[0]).join('')}</span>
        <div class="grow" style="min-width:0"><div style="font-weight:600;font-size:14px">${m.name}</div><div class="muted" style="font-size:12px">${m.email}</div></div>
        ${tag(m.role, m.role === 'Owner' ? 'pro' : m.role === 'Admin' ? 'violet' : m.role === 'Support' ? 'info' : 'neutral')}
        <span class="muted" style="font-size:11.5px;width:80px;text-align:right">${m.last}</span>
        <button class="mini-btn" title="Manage" data-tm="${i}">${I.dots}</button>
      </div>`).join('');
    document.querySelectorAll('[data-tm]').forEach(b => b.onclick = () => M().toast('Manage ' + d.team[+b.dataset.tm].name));

    // flags
    document.getElementById('stFlags').innerHTML = d.flags.map((f, i) => `
      <div class="flex aic gap-12" style="padding:12px 0;${i < d.flags.length - 1 ? 'border-bottom:1px solid var(--line)' : ''}">
        <div class="grow"><div style="font-weight:600;font-size:13.5px">${f.name} <span class="mono dim" style="font-size:11px">${f.key}</span></div><div class="muted" style="font-size:12px;margin-top:2px">${f.desc}</div></div>
        <span class="sw green ${f.on ? 'on' : ''}" data-flag="${i}"><i></i></span>
      </div>`).join('');
    document.querySelectorAll('[data-flag]').forEach(sw => sw.onclick = () => { const f = d.flags[+sw.dataset.flag]; f.on = !f.on; sw.classList.toggle('on', f.on); M().toast(`${f.name} ${f.on ? 'enabled' : 'disabled'}`, true); });

    // appearance toggles
    document.getElementById('stTheme').onclick = M().toggleTheme;
    document.querySelectorAll('[data-sw]').forEach(s => s.onclick = () => s.classList.toggle('on'));
    document.getElementById('stSave').onclick = () => M().toast('Settings saved');
    document.getElementById('stPurge').onclick = () => M().toast('Model cache purged', true);
    document.getElementById('stInvite').onclick = () => M().toast('Invite teammate — opening');
  }

  window.AdminScreens = Object.assign(window.AdminScreens || {}, { render_support, render_audit, render_settings });
})();
