/* ============================================================
   InsightXI — app shell (topbar, ticker, collapsible sidebar)
   Each app page: <body data-page="dashboard"> with <main class="page">
   ============================================================ */
(function () {
  const I = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>',
    live: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="3"/><path d="M5.6 5.6a9 9 0 0 0 0 12.8M18.4 5.6a9 9 0 0 1 0 12.8"/></svg>',
    fixtures: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>',
    results: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 19V5M4 19h16"/><path d="M8 16v-5M12 16V8M16 16v-3"/></svg>',
    leagues: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 3h12v4a6 6 0 0 1-12 0z"/><path d="M6 5H3v2a3 3 0 0 0 3 3M18 5h3v2a3 3 0 0 1-3 3M9 21h6M12 13v4"/></svg>',
    teams: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3l8 4v5c0 4.5-3.2 7.7-8 9-4.8-1.3-8-4.5-8-9V7z"/></svg>',
    players: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.9 3.1-6 7-6s7 2.1 7 6"/></svg>',
    analytics: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg>',
    premium: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m12 2 2.4 6.9H22l-6 4.4 2.3 7-6.3-4.6L5.7 20 8 13.3 2 8.9h7.6z"/></svg>',
    match: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9"/><path d="m12 7 2.9 2.1-1.1 3.4h-3.6L9.1 9.1z"/></svg>',
    history: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 8v4l3 2"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h6"/></svg>',
    logo: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 2 3 6.5v6C3 18 7 21.5 12 23c5-1.5 9-5 9-10.5v-6z" fill="rgba(255,255,255,.18)"/><path d="M8.5 12.5 11 15l5-5.5" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };

  // path prefix: app pages live in /app/, landing in root
  const inApp = location.pathname.includes('/app/');
  const P = inApp ? '' : 'app/';
  const ROOT = inApp ? '../' : '';

  // Apply saved theme as early as possible (reduces flash)
  document.documentElement.setAttribute('data-theme', localStorage.getItem('ix-theme') || 'dark');
  function setTheme(t) {
    const root = document.documentElement;
    root.setAttribute('data-theme', t);
    // Force a synchronous full restyle so every custom-property-dependent
    // color recomputes (works around an attribute-change invalidation bug).
    root.style.display = 'none'; void root.offsetHeight; root.style.display = '';
    localStorage.setItem('ix-theme', t);
    document.querySelectorAll('[data-theme-toggle]').forEach(b => { b.innerHTML = t === 'light' ? I.moon : I.sun; b.title = t === 'light' ? 'Switch to dark' : 'Switch to light'; });
    if (window.IXChart && IXChart.redrawAll) IXChart.redrawAll();
  }

  const TOPNAV = [
    ['Home', P + 'dashboard.html', 'dashboard'],
    ['Today Confidence Board', P + 'board.html', 'board'],
    ['Sure Win Prediction', P + 'predictions.html', 'predictions'],
    ['Fixtures', P + 'fixtures.html', 'fixtures'],
    ['Results', P + 'results.html', 'results'],
    ['Leagues', P + 'leagues.html', 'leagues'],
    ['Blog', P + 'blog.html', 'blog'],
  ];

  const SIDENAV = [
    { sec: 'Intelligence' },
    ['Home', P + 'dashboard.html', 'home', 'dashboard'],
    ['Confidence Board', P + 'board.html', 'grid', 'board', 'AI'],
    ['Sure Win Picks', P + 'predictions.html', 'target', 'predictions', 'HOT'],
    ['Live Center', P + 'live.html', 'live', 'live', 'LIVE'],
    { sec: 'Explore' },
    ['Fixtures', P + 'fixtures.html', 'fixtures', 'fixtures'],
    ['Results', P + 'results.html', 'results', 'results'],
    ['Leagues', P + 'leagues.html', 'leagues', 'leagues'],
    ['Teams', P + 'team.html', 'teams', 'team'],
    ['Players', P + 'player.html', 'players', 'player'],
    { sec: 'Analysis' },
    ['Match Intel', P + 'match.html', 'match', 'match', 'AI'],
    ['Historical', P + 'historical.html', 'history', 'historical'],
    ['Blog', P + 'blog.html', 'doc', 'blog'],
    ['Premium', P + 'premium.html', 'premium', 'premium', 'PRO'],
  ];

  function tickerItems() {
    const D = window.IXData; if (!D) return '';
    const live = D.NOW_LIVE.map(m => `<span class="ticker-item"><b>${m.home}</b> ${m.hs}–${m.as} <b>${m.away}</b> <span class="min">${m.min}'</span></span>`);
    const xg = D.NOW_LIVE.map(m => `<span class="ticker-item">${m.home}–${m.away} <span style="color:var(--blue-2)">xG ${m.hxg.toFixed(2)}–${m.axg.toFixed(2)}</span></span>`);
    const up = D.UPCOMING.slice(0, 4).map(m => `<span class="ticker-item">${m.time} <b>${m.home}</b> v <b>${m.away}</b> <span style="color:var(--gold)">${m.conf}% ${m.pick}</span></span>`);
    const all = [...live, ...xg, ...up];
    return (all.join('') + all.join(''));
  }

  function buildSidebar(page) {
    const items = SIDENAV.map(it => {
      if (it.sec) return `<div class="sb-sec-label">${it.sec}</div>`;
      const [label, href, icon, key, tag] = it;
      const active = key === page ? ' active' : '';
      const badge = tag === 'LIVE' ? '<span class="live-pill" style="margin-left:auto;height:18px;padding:0 6px;font-size:9px"><span class="pulse"></span>LIVE</span>'
        : tag === 'AI' ? '<span class="badge blue" style="margin-left:auto;height:18px;font-size:9px">AI</span>'
        : tag === 'HOT' ? '<span class="badge gold" style="margin-left:auto;height:18px;font-size:9px;color:var(--amber);border-color:rgba(255,177,61,.3);background:rgba(255,177,61,.1)">HOT</span>'
        : tag === 'PRO' ? '<span class="badge gold" style="margin-left:auto;height:18px;font-size:9px">PRO</span>' : '';
      return `<a class="nav-i${active}" href="${href}">${I[icon]}<span>${label}</span>${badge}</a>`;
    }).join('');
    return `<aside class="sidebar">
      <div class="sb-brand">
        <div class="sb-logo">${I.logo}</div>
        <div class="sb-brand-name">Insight<b>XI</b></div>
      </div>
      <nav class="sb-nav">${items}</nav>
      <div class="sb-foot">
        <a href="${P}premium.html" class="nav-i" style="background:linear-gradient(135deg,rgba(232,194,112,.14),rgba(232,194,112,.03));border:1px solid rgba(232,194,112,.2)">
          ${I.premium}<span class="sb-foot-txt" style="color:var(--gold);font-weight:600">Upgrade Premium</span>
        </a>
      </div>
    </aside>`;
  }

  function buildTopbar(page) {
    const nav = TOPNAV.map(([l, h, k]) => `<a href="${h}" class="${k === page ? 'active' : ''}">${l}</a>`).join('');
    return `<header class="topbar">
      <button class="sb-toggle" id="sbToggle" aria-label="Toggle sidebar">${I.menu}</button>
      <nav class="topnav">${nav}</nav>
      <div class="tb-search">${I.search}<input placeholder="Search teams, players, matches…"><kbd>⌘K</kbd></div>
      <button class="tb-icon" data-theme-toggle aria-label="Toggle theme">${I.sun}</button>
      <button class="tb-icon" title="AI Assistant">${I.bolt}</button>
      <button class="tb-icon" title="Notifications">${I.bell}<span class="dot-n"></span></button>
      <div class="tb-avatar">AM</div>
    </header>`;
  }

  function init() {
    const page = document.body.getAttribute('data-page');
    const main = document.querySelector('main.page');
    if (!main) return;
    // Build layout wrapper
    const layout = document.createElement('div');
    layout.className = 'layout';
    layout.innerHTML = buildSidebar(page);
    const content = document.createElement('div');
    content.className = 'content';
    content.innerHTML = buildTopbar(page) +
      `<div class="ticker"><div class="ticker-label">${I.bolt}LIVE</div><div class="ticker-track">${tickerItems()}</div></div>`;
    document.body.insertBefore(layout, main);
    layout.appendChild(content);
    content.appendChild(main);

    // Sidebar collapse
    const saved = localStorage.getItem('ix-sb-collapsed') === '1';
    if (saved) layout.classList.add('collapsed');
    document.getElementById('sbToggle').addEventListener('click', () => {
      if (window.innerWidth <= 860) { layout.classList.toggle('mobile-open'); return; }
      layout.classList.toggle('collapsed');
      localStorage.setItem('ix-sb-collapsed', layout.classList.contains('collapsed') ? '1' : '0');
    });
    // close mobile sidebar on nav
    layout.querySelectorAll('.sidebar a').forEach(a => a.addEventListener('click', () => layout.classList.remove('mobile-open')));

    // Theme toggle
    setTheme(localStorage.getItem('ix-theme') || 'dark');
    document.querySelectorAll('[data-theme-toggle]').forEach(b => b.addEventListener('click', () => {
      setTheme((localStorage.getItem('ix-theme') || 'dark') === 'dark' ? 'light' : 'dark');
    }));
  }

  window.IXIcons = I;
  function armAnim(){ if (document.visibilityState === 'visible') document.body.classList.add('anim-on'); }
  document.addEventListener('visibilitychange', armAnim);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ init(); armAnim(); });
  else { init(); armAnim(); }
})();
