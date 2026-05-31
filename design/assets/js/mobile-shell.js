/* ============================================================
   InsightXI Mobile — app shell
   Nav stack, header, theme, pull-to-refresh, haptics, icons.
   ============================================================ */
(function () {
  const I = {
    home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>',
    homeF:'<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5V21H3z"/></svg>',
    live:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="3"/><path d="M5.6 5.6a9 9 0 0 0 0 12.8M18.4 5.6a9 9 0 0 1 0 12.8"/></svg>',
    target:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/></svg>',
    fixtures:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>',
    more:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
    grid:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    results:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 19V5M4 19h16"/><path d="M8 16v-5M12 16V8M16 16v-3"/></svg>',
    leagues:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 3h12v4a6 6 0 0 1-12 0z"/><path d="M6 5H3v2a3 3 0 0 0 3 3M18 5h3v2a3 3 0 0 1-3 3M9 21h6M12 13v4"/></svg>',
    teams:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3l8 4v5c0 4.5-3.2 7.7-8 9-4.8-1.3-8-4.5-8-9V7z"/></svg>',
    players:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.9 3.1-6 7-6s7 2.1 7 6"/></svg>',
    history:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 8v4l3 2"/></svg>',
    doc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h6"/></svg>',
    premium:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m12 2 2.4 6.9H22l-6 4.4 2.3 7-6.3-4.6L5.7 20 8 13.3 2 8.9h7.6z"/></svg>',
    bell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
    search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
    sun:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    bolt:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
    match:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9"/><path d="m12 7 2.9 2.1-1.1 3.4h-3.6L9.1 9.1z"/></svg>',
    back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 19l-7-7 7-7"/></svg>',
    chev:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>',
    settings:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 0 1 0-4h.1A1.6 1.6 0 0 0 4.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.7-1.1V1a2 2 0 0 1 4 0v.1A1.6 1.6 0 0 0 17 4.6a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H23a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/></svg>',
    user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>',
    shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6z"/></svg>',
    star:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m12 3 2.6 5.6L20 9.4l-4 4 1 5.6-5-2.8-5 2.8 1-5.6-4-4 5.4-.8z"/></svg>',
    info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
    logout:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>',
    refresh:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 12a9 9 0 1 1-2.6-6.4M21 4v4h-4"/></svg>',
    logo:'<svg viewBox="0 0 24 24" fill="none"><path d="M12 2 3 6.5v6C3 18 7 21.5 12 23c5-1.5 9-5 9-10.5v-6z" fill="rgba(255,255,255,.18)"/><path d="M8.5 12.5 11 15l5-5.5" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    flame:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3c1 3 4 4 4 8a4 4 0 0 1-8 0c0-1 .5-2 1-2.5C9.5 11 12 10 12 3z"/><path d="M12 21a5 5 0 0 0 5-5c0-2-1-3.5-2.5-5"/></svg>',
  };

  // ---- Theme (shared with desktop via ix-theme) ----
  document.documentElement.setAttribute('data-theme', localStorage.getItem('ix-theme') || 'dark');
  function setTheme(t) {
    const root = document.documentElement;
    root.setAttribute('data-theme', t);
    root.style.display = 'none'; void root.offsetHeight; root.style.display = '';
    localStorage.setItem('ix-theme', t);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'light' ? '#eef1f7' : '#070b14');
    document.querySelectorAll('[data-theme-toggle]').forEach(b => { b.innerHTML = t === 'light' ? I.moon : I.sun; });
    document.querySelectorAll('[data-theme-switch]').forEach(s => s.classList.toggle('on', t === 'dark'));
    if (window.IXChart && IXChart.redrawAll) IXChart.redrawAll();
  }
  function toggleTheme() { setTheme((localStorage.getItem('ix-theme') || 'dark') === 'dark' ? 'light' : 'dark'); }

  function haptic(ms) { try { if (navigator.vibrate) navigator.vibrate(ms || 8); } catch (e) {} }

  // ---- Screen registry / nav stack ----
  const TABS = ['home', 'live', 'predictions', 'fixtures', 'more'];
  const TITLES = { home: 'InsightXI', live: 'Live Center', predictions: 'Sure Win', fixtures: 'Fixtures', more: 'More', match: 'Match Intel', board: 'Confidence Board', premium: 'Premium' };
  const rendered = {};
  let stack = ['home'];

  function screenEl(id) { return document.getElementById('scr-' + id); }
  function ensureRendered(id, arg) {
    const fn = (window.MXScreens || {})['render_' + id];
    const el = screenEl(id);
    if (!el || !fn) return;
    if (id === 'match') { fn(el, arg); }          // match re-renders per fixture
    else if (!rendered[id]) { fn(el); rendered[id] = true; }
  }

  function activate(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = screenEl(id);
    el.classList.add('active');
    bindScroll(el);
    updateHeader(id, el);
  }

  function showTab(id) {
    if (stack[stack.length - 1] === id && stack.length === 1) { screenEl(id).scrollTo({ top: 0, behavior: 'smooth' }); return; }
    stack = [id];
    ensureRendered(id);
    activate(id);
    const el = screenEl(id);
    el.classList.remove('push-in', 'tab-in'); void el.offsetWidth; el.classList.add('tab-in');
    el.scrollTop = 0;
    setActiveNav(id);
    haptic(8);
  }

  function pushScreen(id, arg) {
    ensureRendered(id, arg);
    const el = screenEl(id);
    stack.push(id);
    activate(id);
    el.classList.remove('tab-in', 'push-out'); void el.offsetWidth; el.classList.add('push-in');
    el.scrollTop = 0;
    haptic(10);
  }

  function popScreen() {
    if (stack.length <= 1) return;
    const cur = stack.pop();
    const curEl = screenEl(cur);
    const backTo = stack[stack.length - 1];
    const backEl = screenEl(backTo);
    backEl.classList.add('active');
    updateHeader(backTo, backEl);
    setActiveNav(TABS.includes(backTo) ? backTo : null);
    curEl.classList.remove('push-in');
    void curEl.offsetWidth;
    curEl.classList.add('push-out');
    bindScroll(backEl);
    setTimeout(() => { curEl.classList.remove('active', 'push-out'); }, 300);
    haptic(8);
  }

  function setActiveNav(id) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === id));
  }

  // ---- Header ----
  const header = () => document.getElementById('appHeader');
  function updateHeader(id, el) {
    const h = header();
    const isDetail = !TABS.includes(id);
    h.querySelector('.hdr-back').style.display = isDetail ? 'grid' : 'none';
    h.querySelector('.hdr-brand').style.display = isDetail ? 'none' : 'flex';
    const t = h.querySelector('.hdr-title');
    t.textContent = TITLES[id] || '';
    if (isDetail) { h.classList.add('solid'); t.classList.add('show'); }
    else { applyScrollState(el); }
  }
  function applyScrollState(el) {
    const h = header();
    if (TABS.includes(stack[stack.length - 1]) === false) return;
    const y = el.scrollTop;
    h.classList.toggle('solid', y > 6);
    const t = h.querySelector('.hdr-title');
    const brand = h.querySelector('.hdr-brand');
    if (y > 58) { t.classList.add('show'); brand.classList.add('hide'); }
    else { t.classList.remove('show'); brand.classList.remove('hide'); }
  }

  // ---- Scroll + pull-to-refresh binding (per active screen) ----
  let boundEl = null;
  function bindScroll(el) {
    if (boundEl === el) return;
    boundEl = el;
    el.onscroll = () => { if (el.classList.contains('active')) applyScrollState(el); };
  }

  // Pull to refresh — single delegated touch handler on the screens area
  function initPTR() {
    const ptr = document.getElementById('ptr');
    const spin = ptr.querySelector('.ptr-spin');
    let startY = 0, pulling = false, dist = 0, active = null, refreshing = false;
    const THRESH = 72;
    const area = document.getElementById('screens');

    area.addEventListener('touchstart', e => {
      active = document.querySelector('.screen.active');
      if (!active || refreshing) return;
      if (active.scrollTop <= 0) { startY = e.touches[0].clientY; pulling = true; dist = 0; }
    }, { passive: true });

    area.addEventListener('touchmove', e => {
      if (!pulling || !active || refreshing) return;
      dist = e.touches[0].clientY - startY;
      if (dist > 0 && active.scrollTop <= 0) {
        e.preventDefault();
        const d = Math.min(dist * 0.45, 96);
        active.style.transform = `translateY(${d}px)`;
        ptr.style.height = d + 'px';
        spin.style.opacity = Math.min(1, d / THRESH);
        spin.style.transform = `rotate(${d * 3}deg)`;
      }
    }, { passive: false });

    function end() {
      if (!pulling || !active) return;
      pulling = false;
      const trigger = dist * 0.45 >= THRESH * 0.62;
      active.style.transition = 'transform .3s cubic-bezier(.3,1,.4,1)';
      if (trigger && !refreshing) {
        refreshing = true;
        haptic(14);
        active.style.transform = 'translateY(54px)';
        ptr.style.height = '54px'; ptr.classList.add('spinning');
        setTimeout(() => {
          if (window.IXChart && IXChart.redrawAll) IXChart.redrawAll();
          active.style.transform = 'translateY(0)';
          ptr.style.height = '0'; ptr.classList.remove('spinning');
          setTimeout(() => { refreshing = false; active.style.transition = ''; }, 320);
        }, 950);
      } else {
        active.style.transform = 'translateY(0)';
        ptr.style.height = '0';
        setTimeout(() => { active.style.transition = ''; }, 320);
      }
    }
    area.addEventListener('touchend', end, { passive: true });
    area.addEventListener('touchcancel', end, { passive: true });
  }

  // Global haptic on key controls
  function initHaptics() {
    document.addEventListener('pointerdown', e => {
      if (e.target.closest('.tappable, .nav-tab, .seg, .icon-btn-m, .menu-row, .menu-item, .btn')) haptic(7);
    }, { passive: true });
  }

  function init() {
    // logos / icons
    document.querySelectorAll('[data-logo]').forEach(e => e.innerHTML = I.logo);
    document.querySelectorAll('[data-ic]').forEach(e => { e.insertAdjacentHTML('afterbegin', I[e.dataset.ic] || ''); });
    setTheme(localStorage.getItem('ix-theme') || 'dark');
    document.querySelectorAll('[data-theme-toggle]').forEach(b => b.addEventListener('click', toggleTheme));

    // bottom nav
    document.querySelectorAll('.nav-tab').forEach(t => {
      t.querySelector('.ic').innerHTML = I[t.dataset.icon];
      t.addEventListener('click', () => showTab(t.dataset.tab));
    });
    // back button
    header().querySelector('.hdr-back').addEventListener('click', popScreen);

    // header actions
    const bs = document.getElementById('btnSearch');
    if (bs) bs.addEventListener('click', () => window.MXToast && window.MXToast('Search teams, players, matches…'));
    const bb = document.getElementById('btnBell');
    if (bb) bb.addEventListener('click', () => window.MXToast && window.MXToast('3 new model alerts today'));

    // render first tab
    ensureRendered('home');
    activate('home');
    screenEl('home').classList.add('tab-in');
    setActiveNav('home');

    initPTR();
    initHaptics();
    document.body.classList.add('anim-on');
  }

  window.MX = { I, setTheme, toggleTheme, showTab, pushScreen, popScreen, haptic };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
