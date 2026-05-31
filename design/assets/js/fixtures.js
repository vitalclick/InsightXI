/* ============================================================
   InsightXI — Fixtures logic
   ============================================================ */
window.addEventListener('DOMContentLoaded', function () {
  const D = IXData, X = IXChart, C = IXChart.C, I = window.IXIcons || {};
  document.querySelectorAll('[data-icon]').forEach(e => { e.innerHTML = I[e.dataset.icon] || ''; });

  const impMap = {
    high: { label: 'Title race', cls: 'red' }, mid: { label: 'Key clash', cls: 'amber' }, low: { label: 'Mid-table', cls: '' },
  };

  function confColor(c) { return c >= 70 ? 'var(--green)' : c >= 60 ? 'var(--blue-2)' : 'var(--gold)'; }

  function matchRow(m, live) {
    const imp = impMap[m.importance || 'low'];
    const left = live
      ? `<div style="width:52px;text-align:center;flex-shrink:0"><span class="live-pill"><span class="pulse"></span>${m.min}'</span></div>`
      : `<div style="width:52px;text-align:center;flex-shrink:0"><div class="mono" style="font-size:14px;font-weight:700">${m.time}</div><div class="dim" style="font-size:10px">${m.date}</div></div>`;
    const score = live
      ? `<div class="mono" style="width:54px;text-align:center;font-size:18px;font-weight:800">${m.hs}<span class="dim">-</span>${m.as}</div>`
      : '';
    const bars = !live ? `<div style="flex:1;min-width:90px;max-width:180px">
        <div style="display:flex;height:7px;border-radius:20px;overflow:hidden;background:var(--surface-3)"><i style="width:${m.hp}%;background:var(--blue)"></i><i style="width:${m.dp}%;background:#54607a"></i><i style="width:${m.ap}%;background:var(--green)"></i></div>
        <div class="flex jcb" style="margin-top:5px;font-family:var(--font-mono);font-size:10px;color:var(--muted)"><span>${m.hp}%</span><span>${m.dp}%</span><span>${m.ap}%</span></div>
      </div>` : `<div style="flex:1;min-width:90px;max-width:180px"><div class="label-xs" style="margin-bottom:4px">Live xG</div><div class="mono" style="font-size:13px;color:var(--text-2)">${m.hxg.toFixed(2)} – ${m.axg.toFixed(2)}</div></div>`;
    return `<a href="match.html" class="fix-row" style="display:flex;align-items:center;gap:16px;padding:14px 18px;border-bottom:1px solid var(--line);transition:background .15s">
      ${left}
      <div style="display:flex;align-items:center;gap:10px;width:230px;flex-shrink:0">
        ${D.crest(m.home, 'sm')}<span style="font-size:13.5px;font-weight:600;flex:1">${D.CLUBS[m.home].name}</span>
      </div>
      ${score}
      <div style="display:flex;align-items:center;gap:10px;width:230px;flex-shrink:0">
        ${D.crest(m.away, 'sm')}<span style="font-size:13.5px;font-weight:600;flex:1">${D.CLUBS[m.away].name}</span>
      </div>
      ${bars}
      <div class="badge ${imp.cls}" style="flex-shrink:0">${imp.label}</div>
      <div style="text-align:right;width:74px;flex-shrink:0">
        <div class="mono" style="font-size:16px;font-weight:700;color:${confColor(m.conf)}">${m.conf}%</div>
        <div class="dim" style="font-size:10px">${m.pick}</div>
      </div>
    </a>`;
  }

  function group(title, sub, rows) {
    return `<section class="card reveal" style="margin-bottom:18px">
      <div class="card-hd"><h3>${title} <span class="dim" style="font-weight:400;font-size:12px;margin-left:6px">${sub}</span></h3></div>
      <div>${rows}</div></section>`;
  }

  const live = D.NOW_LIVE.map(m => matchRow(m, true)).join('');
  const today = D.UPCOMING.filter(m => m.date === 'Today').map(m => matchRow(m, false)).join('');
  const tomorrow = D.UPCOMING.filter(m => m.date === 'Tomorrow').map(m => matchRow(m, false)).join('');
  const sat = D.UPCOMING.filter(m => m.date === 'Sat').map(m => matchRow(m, false)).join('');

  function render(filter) {
    let html = '';
    if (filter !== 'upcoming') html += group('Live Now', D.NOW_LIVE.length + ' in play', live);
    if (filter !== 'live') {
      html += group('Today', '31 May · ' + D.UPCOMING.filter(m => m.date === 'Today').length + ' fixtures', today);
      html += group('Tomorrow', '1 June', tomorrow);
      html += group('Saturday', '7 June', sat);
    }
    document.getElementById('fixtureGroups').innerHTML = html;
    document.querySelectorAll('.fix-row').forEach(r => {
      r.onmouseenter = () => r.style.background = 'var(--surface-1)';
      r.onmouseleave = () => r.style.background = '';
    });
  }
  render('all');

  document.querySelectorAll('#statusTabs .tab').forEach(t => t.addEventListener('click', () => {
    document.querySelectorAll('#statusTabs .tab').forEach(x => x.classList.remove('active'));
    t.classList.add('active'); render(t.dataset.f);
  }));
  document.querySelectorAll('#leagueChips .chip').forEach(c => c.addEventListener('click', () => {
    document.querySelectorAll('#leagueChips .chip').forEach(x => x.classList.remove('active')); c.classList.add('active');
  }));
});
