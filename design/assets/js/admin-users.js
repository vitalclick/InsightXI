/* ============================================================
   InsightXI Admin — Users module (centerpiece)
   Table · filters · bulk actions · detail drawer · inline edits
   ============================================================ */
(function () {
  const A = () => window.AdminData;
  const M = () => window.Admin;
  let table = null;

  const planTag = p => `<span class="tag ${p === 'Premium' ? 'pro' : p === 'Trial' ? 'info' : 'neutral'}"><span class="dt"></span>${p}</span>`;
  const statusTag = s => `<span class="tag ${s === 'Active' ? 'ok' : s === 'Pending' ? 'warn' : 'bad'}"><span class="dt"></span>${s}</span>`;
  const roleTag = r => `<span class="tag ${r === 'Admin' ? 'violet' : r === 'Analyst' ? 'info' : 'neutral'}">${r}</span>`;
  const avatar = (u, sz) => `<span class="av-sq ${sz || 'sm'}" style="background:linear-gradient(150deg,${u.color},${shade(u.color)})">${u.avatar}</span>`;
  function shade(hex) { return hex.replace('#', '#').length ? hex + 'aa' : hex; }

  function userCell(u) {
    return `<div class="cell-user">${avatar(u)}<div><div class="nm">${u.name} ${u.flagged ? `<span class="cell-flag" title="Flagged">${M().I.flag}</span>` : ''}</div><div class="em">${u.email}</div></div></div>`;
  }

  function render_users(host) {
    const d = A();
    host.innerHTML = `
      <div class="ph-head">
        <div>
          <div class="ph-eyebrow">User management</div>
          <h1>Users</h1>
          <div class="sub">${d.kpis.totalUsers.toLocaleString()} total accounts · ${d.kpis.premium.toLocaleString()} premium · ${d.kpis.trialing} trialing</div>
        </div>
        <div class="flex gap-10 aic wrap">
          <button class="btn" id="uExport">${M().I.download} Export CSV</button>
          <button class="btn btn-primary" id="uInvite">${M().I.plus} Invite user</button>
        </div>
      </div>

      <div class="dt-toolbar">
        <div class="f-search">${M().I.search}<input id="uSearch" placeholder="Search name, email, country…"></div>
        <select class="f-sel" id="fPlan"><option value="">All plans</option><option>Premium</option><option>Trial</option><option>Free</option></select>
        <select class="f-sel" id="fStatus"><option value="">All statuses</option><option>Active</option><option>Pending</option><option>Suspended</option></select>
        <select class="f-sel" id="fRole"><option value="">All roles</option><option>User</option><option>Analyst</option><option>Admin</option></select>
        <select class="f-sel" id="fFlag"><option value="">Any</option><option value="flag">Flagged only</option></select>
        <span class="muted" id="uShown" style="margin-left:auto;font-size:12.5px"></span>
      </div>

      <div id="uTable"></div>`;

    const cols = [
      { key: 'name', label: 'User', sortable: true, render: userCell, sortVal: u => u.name.toLowerCase() },
      { key: 'plan', label: 'Plan', sortable: true, render: u => planTag(u.plan) },
      { key: 'status', label: 'Status', sortable: true, render: u => statusTag(u.status) },
      { key: 'role', label: 'Role', sortable: true, render: u => roleTag(u.role) },
      { key: 'country', label: 'Country', sortable: true, render: u => `<span class="flex aic gap-8"><span class="tag neutral" style="height:19px;padding:0 6px">${u.cc}</span><span class="muted" style="font-size:12px">${u.country}</span></span>` },
      { key: 'predictions', label: 'Usage', sortable: true, align: 'right', render: u => `<span class="cell-num">${u.predictions}</span> <span class="dim" style="font-size:11px">picks</span>`, sortVal: u => u.predictions },
      { key: 'lastMins', label: 'Last active', sortable: true, render: u => `<span class="muted">${u.last}</span>`, sortVal: u => u.lastMins },
      { key: 'signupDays', label: 'Joined', sortable: true, render: u => `<span class="mono" style="font-size:12px;color:var(--text-2)">${d.fmtDate(u.signup)}</span>`, sortVal: u => -u.signupDays },
      { key: 'act', label: '', render: u => `<div class="row-actions"><span class="mini-btn">${M().I.chevr}</span></div>` },
    ];

    table = M().DataTable(document.getElementById('uTable'), {
      rows: d.users, columns: cols, pageSize: 10, selectable: true,
      sortKey: 'lastMins', sortDir: 'asc',
      searchKeys: ['name', 'email', 'country', 'id'],
      rowClick: openUserDrawer,
      onSelect: updateBulk,
      emptyText: 'No users match your filters.',
    });
    updateShown();

    // filters
    const apply = () => {
      const plan = val('fPlan'), status = val('fStatus'), role = val('fRole'), flag = val('fFlag');
      table.setFilter(u => (!plan || u.plan === plan) && (!status || u.status === status) && (!role || u.role === role) && (flag !== 'flag' || u.flagged));
      updateShown();
    };
    ['fPlan', 'fStatus', 'fRole', 'fFlag'].forEach(id => document.getElementById(id).addEventListener('change', apply));
    document.getElementById('uSearch').addEventListener('input', e => { table.setSearch(e.target.value); updateShown(); });
    document.getElementById('uInvite').addEventListener('click', inviteUser);
    document.getElementById('uExport').addEventListener('click', () => exportCSV(table.selected().length ? table.selected() : table.state.rows));
    function val(id) { return document.getElementById(id).value; }
    function updateShown() { setTimeout(() => { document.getElementById('uShown').textContent = `${table.state.rows.length} of ${d.users.length} users`; }, 0); }
  }

  // ---- bulk action bar ----
  function updateBulk(ids) {
    const bar = document.getElementById('admBulk');
    if (!bar) return;
    if (!ids.length) { bar.classList.remove('show'); bar.innerHTML = ''; return; }
    const I = M().I;
    bar.innerHTML = `
      <span class="cnt"><b>${ids.length}</b> selected</span>
      <span class="sep"></span>
      <button class="btn btn-sm" data-b="email">${I.mail} Email</button>
      <button class="btn btn-sm" data-b="plan">${I.card} Change plan</button>
      <button class="btn btn-sm" data-b="suspend">${I.ban} Suspend</button>
      <button class="btn btn-sm" data-b="export">${I.download} Export</button>
      <button class="btn btn-sm btn-danger" data-b="delete">${I.trash} Delete</button>
      <span class="sep"></span>
      <button class="mini-btn" data-b="clear">${I.x}</button>`;
    bar.classList.add('show');
    bar.querySelectorAll('[data-b]').forEach(btn => btn.onclick = () => bulkAction(btn.dataset.b));
  }
  function bulkAction(kind) {
    const rows = table.selected(); const n = rows.length;
    if (kind === 'clear') { table.clearSel(); return; }
    if (kind === 'export') { exportCSV(rows); return; }
    if (kind === 'email') { M().toast(`Broadcast queued to ${n} user${n > 1 ? 's' : ''}`); }
    else if (kind === 'plan') { rows.forEach(u => { if (u.plan === 'Free') u.plan = 'Premium'; }); M().toast(`Upgraded ${n} user${n > 1 ? 's' : ''} to Premium`); }
    else if (kind === 'suspend') { rows.forEach(u => u.status = 'Suspended'); M().toast(`Suspended ${n} account${n > 1 ? 's' : ''}`); }
    else if (kind === 'delete') { const ids = new Set(rows.map(r => r.id)); const arr = A().users; for (let i = arr.length - 1; i >= 0; i--) if (ids.has(arr[i].id)) arr.splice(i, 1); table.setRows(A().users); M().toast(`Deleted ${n} account${n > 1 ? 's' : ''}`); return; }
    table.clearSel();
  }

  // ---- CSV export ----
  function exportCSV(rows) {
    const cols = ['id', 'name', 'email', 'plan', 'status', 'role', 'country', 'predictions', 'logins', 'spend'];
    const head = cols.join(',');
    const body = rows.map(u => cols.map(c => `"${('' + u[c]).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([head + '\n' + body], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'insightxi-users.csv'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    M().toast(`Exported ${rows.length} user${rows.length > 1 ? 's' : ''} to CSV`);
  }

  // ---- invite ----
  function inviteUser() {
    const body = `
      <div class="field"><label>Email address</label><input class="ipt" id="invEmail" placeholder="name@email.com"></div>
      <div class="field"><label>Plan</label><select id="invPlan"><option>Free</option><option>Trial</option><option>Premium</option></select></div>
      <div class="field"><label>Role</label><select id="invRole"><option>User</option><option>Analyst</option><option>Admin</option></select></div>
      <div class="muted" style="font-size:12.5px;line-height:1.5">An invitation email with a magic sign-in link will be sent. The account stays <b>Pending</b> until they accept.</div>`;
    const foot = `<button class="btn grow" id="invCancel">Cancel</button><button class="btn btn-primary grow" id="invSend">Send invite</button>`;
    M().openDrawer(`<div class="flex aic gap-10">${M().I.mail}<span>Invite user</span></div>`, body, foot);
    document.getElementById('invCancel').onclick = M().closeDrawer;
    document.getElementById('invSend').onclick = () => {
      const email = (document.getElementById('invEmail').value || '').trim();
      if (!email) { M().toast('Enter an email address', true); return; }
      const d = A(); const nm = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      d.users.unshift({ id: 'usr_' + (2000 + Math.floor(Math.random() * 900)), name: nm || 'New User', email, avatar: (nm[0] || 'N').toUpperCase(), color: '#5a9bff', plan: document.getElementById('invPlan').value, status: 'Pending', role: document.getElementById('invRole').value, cc: 'GB', country: 'United Kingdom', signup: new Date('2026-05-31'), signupDays: 0, lastMins: 0, last: 'just now', predictions: 0, logins: 0, devices: 1, spend: 0, flagged: false, verified: false });
      table.setRows(d.users); M().closeDrawer(); M().toast('Invitation sent to ' + email);
    };
  }

  // ---- user detail drawer ----
  function openUserDrawer(u) {
    if (!u) return;
    const I = M().I, d = A();
    const edit = { plan: u.plan, status: u.status, role: u.role, notes: u.notes || '' };
    const acts = [
      ['changed plan to ' + u.plan, '14d ago'], ['logged in from ' + u.country, u.last], ['viewed ' + (u.predictions) + ' predictions', 'this month'],
      ['opened Match Intel · RVS v KGT', '2d ago'], ['account created', d.fmtDate(u.signup)],
    ];
    const invoices = u.plan === 'Premium' ? [['£9.99', 'Paid', '2 May 2026'], ['£9.99', 'Paid', '2 Apr 2026'], ['£9.99', 'Paid', '2 Mar 2026']] : [];

    const title = `<div class="cell-user">${avatar(u, 'md')}<div><div class="nm" style="font-size:15px">${u.name}</div><div class="em">${u.email}</div></div></div>`;
    const body = `
      <div class="flex gap-6 wrap" style="margin-bottom:16px">${planTag(u.plan)}${statusTag(u.status)}${roleTag(u.role)}${u.verified ? '<span class="tag ok">Verified</span>' : '<span class="tag warn">Unverified</span>'}${u.flagged ? '<span class="tag bad">Flagged</span>' : ''}</div>

      <div class="seg-tabs" id="udTabs"><div class="t active" data-t="profile">Profile</div><div class="t" data-t="activity">Activity</div><div class="t" data-t="billing">Billing</div></div>

      <div data-pane="profile" style="margin-top:16px">
        <div class="field"><label>Plan</label><select id="edPlan"><option ${sel(u.plan, 'Free')}>Free</option><option ${sel(u.plan, 'Trial')}>Trial</option><option ${sel(u.plan, 'Premium')}>Premium</option></select></div>
        <div class="field"><label>Status</label><select id="edStatus"><option ${sel(u.status, 'Active')}>Active</option><option ${sel(u.status, 'Pending')}>Pending</option><option ${sel(u.status, 'Suspended')}>Suspended</option></select></div>
        <div class="field"><label>Role</label><select id="edRole"><option ${sel(u.role, 'User')}>User</option><option ${sel(u.role, 'Analyst')}>Analyst</option><option ${sel(u.role, 'Admin')}>Admin</option></select></div>
        <div class="field"><label>Internal notes</label><textarea class="ipt" id="edNotes" placeholder="Add a note about this account…">${edit.notes}</textarea></div>

        <div class="panel" style="margin-top:6px"><div class="panel-bd" style="padding:6px 16px">
          <div class="kv"><span class="k">Account ID</span><span class="v mono" style="font-size:12px">${u.id}</span></div>
          <div class="kv"><span class="k">Country</span><span class="v">${u.country}</span></div>
          <div class="kv"><span class="k">Signed up</span><span class="v">${d.fmtDate(u.signup)}</span></div>
          <div class="kv"><span class="k">Last active</span><span class="v">${u.last}</span></div>
          <div class="kv"><span class="k">Predictions viewed</span><span class="v mono">${u.predictions}</span></div>
          <div class="kv"><span class="k">Total logins</span><span class="v mono">${u.logins}</span></div>
          <div class="kv"><span class="k">Devices</span><span class="v mono">${u.devices}</span></div>
          <div class="kv"><span class="k">Lifetime spend</span><span class="v mono">£${u.spend.toFixed(2)}</span></div>
        </div></div>

        <div class="danger-zone" style="margin-top:16px">
          <div style="font-weight:700;font-size:13px;color:#ff8a95;margin-bottom:4px">Danger zone</div>
          <div class="muted" style="font-size:12px;margin-bottom:12px">Account-level actions. Some are irreversible.</div>
          <div class="flex gap-8 wrap">
            <button class="btn btn-sm" id="daImpersonate">${I.impersonate} Impersonate</button>
            <button class="btn btn-sm" id="daReset">${I.refresh} Reset password</button>
            <button class="btn btn-sm" id="daSuspend">${I.ban} ${u.status === 'Suspended' ? 'Reactivate' : 'Suspend'}</button>
            <button class="btn btn-sm btn-danger" id="daDelete">${I.trash} Delete</button>
          </div>
        </div>
      </div>

      <div data-pane="activity" style="margin-top:16px;display:none">
        <div class="tl">${acts.map(a => `<div class="tl-i"><div class="tt"><b>${u.name.split(' ')[0]}</b> ${a[0]}</div><div class="tm">${a[1]}</div></div>`).join('')}</div>
      </div>

      <div data-pane="billing" style="margin-top:16px;display:none">
        <div class="panel"><div class="panel-bd" style="padding:6px 16px">
          <div class="kv"><span class="k">Current plan</span><span class="v">${planTag(u.plan)}</span></div>
          <div class="kv"><span class="k">Billing status</span><span class="v">${u.plan === 'Premium' ? '<span class="tag ok">Active</span>' : u.plan === 'Trial' ? '<span class="tag info">Trialing</span>' : '<span class="tag neutral">No subscription</span>'}</span></div>
          <div class="kv"><span class="k">Next renewal</span><span class="v">${u.plan === 'Premium' ? '2 Jun 2026' : '—'}</span></div>
          <div class="kv"><span class="k">Payment method</span><span class="v">${u.plan === 'Free' ? '—' : 'Visa ··4291'}</span></div>
          <div class="kv"><span class="k">Lifetime value</span><span class="v mono">£${u.spend.toFixed(2)}</span></div>
        </div></div>
        ${invoices.length ? `<div style="font-size:11px;color:var(--muted);font-weight:600;letter-spacing:.04em;text-transform:uppercase;margin:16px 0 8px">Recent invoices</div>
          <div class="panel"><div class="panel-bd" style="padding:4px 16px">${invoices.map(iv => `<div class="kv"><span class="k mono">${iv[2]}</span><span class="flex aic gap-10"><span class="tag ok">${iv[1]}</span><span class="v mono">${iv[0]}</span></span></div>`).join('')}</div></div>
          <button class="btn btn-sm" id="biRefund" style="margin-top:12px">${I.money} Issue refund</button>` : `<div class="muted" style="font-size:13px;margin-top:14px">No billing history — this account is on the Free plan.</div>`}
      </div>`;

    const foot = `<button class="btn grow" id="udClose">Close</button><button class="btn btn-primary grow" id="udSave">Save changes</button>`;
    M().openDrawer(title, body, foot);

    // tabs
    document.querySelectorAll('#udTabs .t').forEach(t => t.onclick = () => {
      document.querySelectorAll('#udTabs .t').forEach(x => x.classList.remove('active')); t.classList.add('active');
      document.querySelectorAll('[data-pane]').forEach(p => p.style.display = p.dataset.pane === t.dataset.t ? 'block' : 'none');
    });
    // inline edit live
    document.getElementById('edPlan').onchange = e => edit.plan = e.target.value;
    document.getElementById('edStatus').onchange = e => edit.status = e.target.value;
    document.getElementById('edRole').onchange = e => edit.role = e.target.value;
    document.getElementById('edNotes').oninput = e => edit.notes = e.target.value;

    const save = () => { u.plan = edit.plan; u.status = edit.status; u.role = edit.role; u.notes = edit.notes; table.render(); };
    document.getElementById('udSave').onclick = () => { save(); M().closeDrawer(); M().toast('Saved changes to ' + u.name); };
    document.getElementById('udClose').onclick = M().closeDrawer;
    document.getElementById('daImpersonate').onclick = () => { M().closeDrawer(); M().toast('Impersonating ' + u.name + ' — opening session', true); };
    document.getElementById('daReset').onclick = () => M().toast('Password reset link sent to ' + u.email);
    document.getElementById('daSuspend').onclick = () => { u.status = edit.status = u.status === 'Suspended' ? 'Active' : 'Suspended'; table.render(); M().closeDrawer(); M().toast(u.status === 'Suspended' ? 'Suspended ' + u.name : 'Reactivated ' + u.name); };
    document.getElementById('daDelete').onclick = () => { const arr = A().users, i = arr.indexOf(u); if (i >= 0) arr.splice(i, 1); table.setRows(A().users); M().closeDrawer(); M().toast('Deleted ' + u.name); };
    const ref = document.getElementById('biRefund'); if (ref) ref.onclick = () => M().toast('Refund issued to ' + u.name);
  }
  function sel(a, b) { return a === b ? 'selected' : ''; }

  window.AdminScreens = Object.assign(window.AdminScreens || {}, { render_users });
})();
