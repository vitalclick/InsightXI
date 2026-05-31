/* ============================================================
   InsightXI Admin — shell: nav, router, theme, drawer, toast,
   and a reusable DataTable engine.
   ============================================================ */
(function () {
  const I = {
    logo:'<svg viewBox="0 0 24 24" fill="none"><path d="M12 2 3 6.5v6C3 18 7 21.5 12 23c5-1.5 9-5 9-10.5v-6z" fill="rgba(255,255,255,.18)"/><path d="M8.5 12.5 11 15l5-5.5" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    overview:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
    users:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><path d="M16 5.2a3 3 0 0 1 0 5.6M18 20c0-2.6-1-4.3-2.5-5.3"/></svg>',
    subs:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 9.5h19M6.5 15h4"/></svg>',
    preds:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 17l5-5 3 3 5-6 5 5"/><circle cx="8" cy="12" r="1.3" fill="currentColor"/><circle cx="16" cy="9" r="1.3" fill="currentColor"/></svg>',
    fixtures:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>',
    content:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h6"/></svg>',
    support:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 11.5a8.5 8.5 0 0 1-12.2 7.6L3 21l1.9-5.8A8.5 8.5 0 1 1 21 11.5z"/><path d="M9 10h6M9 13.5h4"/></svg>',
    audit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 8v4l3 2"/></svg>',
    settings:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="3"/><path d="M19.4 13.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 0 1-4 0a1.7 1.7 0 0 0-1.1-1.6a1.7 1.7 0 0 0-1.9.4l-.1.1A2 2 0 1 1 4 18.1l.1-.1a1.7 1.7 0 0 0-1.2-2.9H2.8a2 2 0 0 1 0-4a1.7 1.7 0 0 0 1.6-1.1a1.7 1.7 0 0 0-.4-1.9L4 7.9A2 2 0 1 1 6.9 5l.1.1A1.7 1.7 0 0 0 9.9 4V3.8a2 2 0 0 1 4 0a1.7 1.7 0 0 0 1.1 1.6a1.7 1.7 0 0 0 1.9-.4l.1-.1A2 2 0 1 1 20 7.9l-.1.1a1.7 1.7 0 0 0-.4 1.9a1.7 1.7 0 0 0 1.6 1.1H21a2 2 0 0 1 0 4z"/></svg>',
    search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
    bell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
    sun:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    menu:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
    check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5L20 6"/></svg>',
    chevd:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>',
    chevr:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>',
    dots:'<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
    x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    edit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
    trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5"/></svg>',
    mail:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    ban:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/></svg>',
    download:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>',
    plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
    filter:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 5h18l-7 8v6l-4-2v-4z"/></svg>',
    flag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 22V4M4 4h13l-2 4 2 4H4"/></svg>',
    impersonate:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M15 3h6v6M21 3l-9 9"/><path d="M10 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/></svg>',
    broadcast:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15.5 8.5a4 4 0 0 1 0 7M18.5 6a7 7 0 0 1 0 12"/></svg>',
    refresh:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 12a9 9 0 1 1-2.6-6.4M21 4v4h-4"/></svg>',
    globe:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18A14 14 0 0 1 12 3z"/></svg>',
    eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>',
    shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6z"/></svg>',
    card:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 9.5h19"/></svg>',
    activity:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 12h4l3 8 4-16 3 8h4"/></svg>',
    money:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5a2 2 0 0 1 2-1.5h1a1.8 1.8 0 0 1 .3 3.6l-1.6.3a1.8 1.8 0 0 0 .3 3.6h1a2 2 0 0 0 2-1.5"/></svg>',
    logout:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>',
  };

  const A = () => window.AdminData;
  function kfmt(n) { return n >= 1000 ? (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'k' : '' + n; }

  function navConfig() {
    const d = A();
    const open = d.tickets.filter(t => t.status !== 'Closed').length;
    return [
      { sec: 'Insights' },
      ['overview', 'Overview', 'overview'],
      ['users', 'Users', 'users', kfmt(d.kpis.totalUsers)],
      ['subscriptions', 'Subscriptions', 'subs'],
      ['predictions', 'Predictions', 'preds'],
      { sec: 'Operations' },
      ['fixtures', 'Fixtures & Matches', 'fixtures'],
      ['content', 'Content', 'content'],
      ['support', 'Support', 'support', '' + open],
      { sec: 'System' },
      ['audit', 'Audit Log', 'audit'],
      ['settings', 'Settings & Team', 'settings'],
    ];
  }

  const TITLES = { overview: 'Overview', users: 'Users', subscriptions: 'Subscriptions', predictions: 'Predictions & Model', fixtures: 'Fixtures & Matches', content: 'Content', support: 'Support', audit: 'Audit Log', settings: 'Settings & Team' };

  // ---- theme ----
  document.documentElement.setAttribute('data-theme', localStorage.getItem('ix-theme') || 'dark');
  function setTheme(t) {
    const r = document.documentElement;
    r.setAttribute('data-theme', t); r.style.display = 'none'; void r.offsetHeight; r.style.display = '';
    localStorage.setItem('ix-theme', t);
    document.querySelectorAll('[data-theme-toggle]').forEach(b => b.innerHTML = t === 'light' ? I.moon : I.sun);
    document.querySelectorAll('[data-theme-sw]').forEach(s => s.classList.toggle('on', t === 'dark'));
    if (window.IXChart && IXChart.redrawAll) IXChart.redrawAll();
  }
  function toggleTheme() { setTheme((localStorage.getItem('ix-theme') || 'dark') === 'dark' ? 'light' : 'dark'); }

  // ---- toast ----
  let toastT;
  function toast(msg, plain) {
    let el = document.getElementById('admToast');
    if (!el) { el = document.createElement('div'); el.id = 'admToast'; el.className = 'toast'; document.body.appendChild(el); }
    el.innerHTML = (plain ? '' : `<span class="tk">${I.check}</span>`) + `<span>${msg}</span>`;
    requestAnimationFrame(() => el.classList.add('show'));
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2200);
  }

  // ---- drawer ----
  function openDrawer(title, bodyHTML, footHTML) {
    const scrim = document.getElementById('admScrim'), dr = document.getElementById('admDrawer');
    dr.querySelector('.drawer-hd .dh-title').innerHTML = title;
    dr.querySelector('.drawer-bd').innerHTML = bodyHTML;
    dr.querySelector('.drawer-ft').innerHTML = footHTML || '';
    dr.querySelector('.drawer-ft').style.display = footHTML ? 'flex' : 'none';
    scrim.classList.add('show'); dr.classList.add('show');
    return dr;
  }
  function closeDrawer() { document.getElementById('admScrim').classList.remove('show'); document.getElementById('admDrawer').classList.remove('show'); }

  // ---- router ----
  let current = null;
  function route(key) {
    if (!TITLES[key]) key = 'overview';
    current = key;
    document.querySelectorAll('.adm-i').forEach(i => i.classList.toggle('active', i.dataset.key === key));
    document.getElementById('admCrumb').innerHTML = `Admin <span class="dim">/</span> <b>${TITLES[key]}</b>`;
    const host = document.getElementById('admPage');
    host.innerHTML = '';
    closeDrawer();
    const fn = (window.AdminScreens || {})['render_' + key];
    if (fn) fn(host);
    document.getElementById('admScroll').scrollTop = 0;
    location.hash = key;
  }

  // ---- build chrome ----
  function buildSidebar() {
    const items = navConfig().map(it => {
      if (it.sec) return `<div class="adm-sec">${it.sec}</div>`;
      const [key, label, icon, cnt] = it;
      return `<div class="adm-i" data-key="${key}">${I[icon]}<span>${label}</span>${cnt ? `<span class="cnt">${cnt}</span>` : ''}</div>`;
    }).join('');
    return `<aside class="adm-sb">
      <div class="adm-brand"><div class="lg">${I.logo}</div><div class="nm">Insight<span>XI</span><small>Admin Console</small></div></div>
      <nav class="adm-nav">${items}</nav>
      <div class="adm-sb-foot">
        <div class="adm-me" id="admMe"><div class="av" style="background:linear-gradient(135deg,#2e7dff,#1b54c9)">AM</div><div class="mt"><b>Alex Mercer</b><span>Owner · Super Admin</span></div></div>
      </div>
    </aside>`;
  }
  function buildTopbar() {
    return `<div class="adm-top">
      <button class="adm-toggle" id="admToggle" aria-label="Toggle sidebar">${I.menu}</button>
      <div class="adm-crumb" id="admCrumb"></div>
      <div class="adm-search"><span>${I.search}</span><input id="admGlobalSearch" placeholder="Search users, invoices, tickets…"><kbd>⌘K</kbd></div>
      <div class="env-pill"><span class="d"></span>Production</div>
      <button class="icon-b" data-theme-toggle aria-label="Theme"></button>
      <button class="icon-b" id="admBell" aria-label="Alerts">${I.bell}<span class="dot-n"></span></button>
    </div>`;
  }

  /* ============================================================
     DataTable engine
     cfg: { columns:[{key,label,sortable,align,render(row),sortVal(row),width,th}],
            rows, pageSize, selectable, getId(row), searchKeys, rowClick(row),
            onSelect(ids), emptyText }
     ============================================================ */
  function DataTable(mount, cfg) {
    const st = { rows: cfg.rows.slice(), all: cfg.rows.slice(), sortKey: cfg.sortKey || null, sortDir: cfg.sortDir || 'asc', page: 1, pageSize: cfg.pageSize || 10, sel: new Set(), search: '', filterFn: null };
    const getId = cfg.getId || (r => r.id);

    function matchSearch(r) {
      if (!st.search) return true;
      const q = st.search.toLowerCase();
      return (cfg.searchKeys || []).some(k => ('' + (r[k] ?? '')).toLowerCase().includes(q));
    }
    function compute() {
      let rows = st.all.filter(r => matchSearch(r) && (!st.filterFn || st.filterFn(r)));
      if (st.sortKey) {
        const col = cfg.columns.find(c => c.key === st.sortKey);
        const sv = col && col.sortVal ? col.sortVal : (r => r[st.sortKey]);
        rows.sort((a, b) => { const x = sv(a), y = sv(b); const r = x < y ? -1 : x > y ? 1 : 0; return st.sortDir === 'asc' ? r : -r; });
      }
      st.rows = rows;
      const maxPage = Math.max(1, Math.ceil(rows.length / st.pageSize));
      if (st.page > maxPage) st.page = maxPage;
      return rows;
    }
    function render() {
      const rows = compute();
      const start = (st.page - 1) * st.pageSize;
      const pageRows = rows.slice(start, start + st.pageSize);
      const cols = cfg.columns;
      const selectable = cfg.selectable;
      const pageIds = pageRows.map(getId);
      const allSel = pageIds.length && pageIds.every(id => st.sel.has(id));
      const someSel = pageIds.some(id => st.sel.has(id));

      let html = `<div class="dt-wrap"><div class="dt-scroll"><table class="dt"><thead><tr>`;
      if (selectable) html += `<th style="width:42px"><span class="cbx ${allSel ? 'on' : someSel ? 'mixed' : ''}" data-all>${I.check}</span></th>`;
      cols.forEach(c => {
        const dir = st.sortKey === c.key ? st.sortDir : '';
        html += `<th class="${c.sortable ? 'sortable ' : ''}${dir}" data-sort="${c.sortable ? c.key : ''}" style="${c.width ? 'width:' + c.width + ';' : ''}${c.align ? 'text-align:' + c.align : ''}">${c.label}${c.sortable ? `<span class="arr">${I.chevd}</span>` : ''}</th>`;
      });
      html += `</tr></thead><tbody>`;
      if (!pageRows.length) html += `<tr class="empty-row"><td colspan="${cols.length + (selectable ? 1 : 0)}">${cfg.emptyText || 'No records match your filters.'}</td></tr>`;
      pageRows.forEach(r => {
        const id = getId(r), sel = st.sel.has(id);
        html += `<tr data-id="${id}" class="${sel ? 'sel' : ''}">`;
        if (selectable) html += `<td><span class="cbx ${sel ? 'on' : ''}" data-row-cb>${I.check}</span></td>`;
        cols.forEach(c => { html += `<td style="${c.align ? 'text-align:' + c.align : ''}">${c.render ? c.render(r) : (r[c.key] ?? '')}</td>`; });
        html += `</tr>`;
      });
      html += `</tbody></table></div>`;
      // pagination
      const total = rows.length, from = total ? start + 1 : 0, to = Math.min(start + st.pageSize, total);
      const maxPage = Math.max(1, Math.ceil(total / st.pageSize));
      html += `<div class="dt-pag"><div class="info">Showing <b style="color:var(--text)">${from}–${to}</b> of <b style="color:var(--text)">${total}</b></div><div class="pag-btns">`;
      html += `<button data-pg="prev" ${st.page === 1 ? 'disabled' : ''}>‹</button>`;
      const pages = pageList(st.page, maxPage);
      pages.forEach(p => { html += p === '…' ? `<button disabled>…</button>` : `<button data-pg="${p}" class="${p === st.page ? 'active' : ''}">${p}</button>`; });
      html += `<button data-pg="next" ${st.page === maxPage ? 'disabled' : ''}>›</button></div></div></div>`;
      mount.innerHTML = html;
      bind();
      if (cfg.onSelect) cfg.onSelect([...st.sel]);
    }
    function pageList(cur, max) {
      if (max <= 7) return Array.from({ length: max }, (_, i) => i + 1);
      const s = new Set([1, 2, max - 1, max, cur - 1, cur, cur + 1]);
      const arr = [...s].filter(p => p >= 1 && p <= max).sort((a, b) => a - b);
      const out = []; let prev = 0;
      arr.forEach(p => { if (p - prev > 1) out.push('…'); out.push(p); prev = p; });
      return out;
    }
    function bind() {
      mount.querySelectorAll('th[data-sort]').forEach(th => { if (!th.dataset.sort) return; th.onclick = () => { const k = th.dataset.sort; if (st.sortKey === k) st.sortDir = st.sortDir === 'asc' ? 'desc' : 'asc'; else { st.sortKey = k; st.sortDir = 'asc'; } render(); }; });
      const allcb = mount.querySelector('[data-all]');
      if (allcb) allcb.onclick = e => { e.stopPropagation(); const ids = st.rows.slice((st.page - 1) * st.pageSize, st.page * st.pageSize).map(getId); const allSel = ids.every(id => st.sel.has(id)); ids.forEach(id => allSel ? st.sel.delete(id) : st.sel.add(id)); render(); };
      mount.querySelectorAll('tr[data-id]').forEach(tr => {
        const id = tr.dataset.id; const row = st.all.find(r => getId(r) === id);
        const cb = tr.querySelector('[data-row-cb]');
        if (cb) cb.onclick = e => { e.stopPropagation(); st.sel.has(id) ? st.sel.delete(id) : st.sel.add(id); render(); };
        tr.onclick = () => { if (cfg.rowClick) cfg.rowClick(row); };
      });
      mount.querySelectorAll('[data-pg]').forEach(b => b.onclick = () => { const v = b.dataset.pg; const maxPage = Math.max(1, Math.ceil(st.rows.length / st.pageSize)); if (v === 'prev') st.page = Math.max(1, st.page - 1); else if (v === 'next') st.page = Math.min(maxPage, st.page + 1); else st.page = +v; render(); });
    }
    const api = {
      el: mount, state: st, render,
      setSearch(v) { st.search = v; st.page = 1; render(); },
      setFilter(fn) { st.filterFn = fn; st.page = 1; render(); },
      setRows(rows) { st.all = rows.slice(); st.sel.clear(); st.page = 1; render(); },
      selected() { return st.all.filter(r => st.sel.has(getId(r))); },
      clearSel() { st.sel.clear(); render(); },
    };
    render();
    return api;
  }

  function init() {
    document.body.classList.add('adm-body');
    const root = document.getElementById('adm');
    root.insertAdjacentHTML('afterbegin', buildSidebar());
    const main = document.createElement('div'); main.className = 'adm-main';
    main.innerHTML = buildTopbar() + `<div class="adm-scroll" id="admScroll" style="position:relative"><div class="adm-page" id="admPage"></div><div class="bulkbar" id="admBulk"></div></div>`;
    root.appendChild(main);

    // drawer + scrim
    document.body.insertAdjacentHTML('beforeend', `
      <div class="scrim" id="admScrim"></div>
      <aside class="drawer" id="admDrawer">
        <div class="drawer-hd"><div class="dh-title" style="flex:1;font-weight:700;font-size:15px"></div><button class="icon-b" id="admDrawerClose">${I.x}</button></div>
        <div class="drawer-bd"></div><div class="drawer-ft"></div>
      </aside>`);

    setTheme(localStorage.getItem('ix-theme') || 'dark');
    document.querySelectorAll('[data-theme-toggle]').forEach(b => b.addEventListener('click', toggleTheme));
    document.getElementById('admDrawerClose').addEventListener('click', closeDrawer);
    document.getElementById('admScrim').addEventListener('click', closeDrawer);
    document.getElementById('admToggle').addEventListener('click', () => root.classList.toggle('collapsed'));
    document.getElementById('admBell').addEventListener('click', () => toast('No critical alerts · all systems nominal', true));
    document.getElementById('admMe').addEventListener('click', () => route('settings'));
    document.querySelectorAll('.adm-i').forEach(i => i.addEventListener('click', () => route(i.dataset.key)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });

    route((location.hash || '').replace('#', '') || 'overview');
  }

  window.Admin = { I, route, setTheme, toggleTheme, toast, openDrawer, closeDrawer, DataTable, kfmt };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
