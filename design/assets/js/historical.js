/* ============================================================
   InsightXI — Historical Analytics logic
   ============================================================ */
window.addEventListener('DOMContentLoaded', function () {
  const D = IXData, X = IXChart, C = IXChart.C, I = window.IXIcons || {};
  document.querySelectorAll('[data-icon]').forEach(e => { e.innerHTML = I[e.dataset.icon] || ''; });

  // Comparison radar
  X.radar('#cmpRadar', {
    size: 300,
    axes: ['Win %', 'Goals', 'Defense', 'xG', 'Possession', 'Form', 'Big games', 'Consistency'],
    series: [
      { color: C.green, values: [78, 82, 75, 80, 79, 84, 72, 81] },
      { color: C.blue, values: [82, 78, 84, 76, 86, 80, 78, 85] },
    ],
  });

  function statBlock(rows, align) {
    return rows.map(([l, v, c]) => `<div class="flex jcb aic" style="padding:8px 0;border-bottom:1px solid var(--line);${align === 'r' ? 'flex-direction:row-reverse' : ''}">
      <span class="muted" style="font-size:12.5px">${l}</span>
      <span class="mono" style="font-weight:700;font-size:14px;color:${c || 'var(--text)'}">${v}</span></div>`).join('');
  }
  document.getElementById('cmpHomeStats').innerHTML = statBlock([
    ['Avg points', '64', 'var(--blue-2)'], ['Win rate', '61%', 'var(--green)'], ['Goals/game', '2.1', ''], ['Clean sheets', '38%', ''], ['H2H wins', '4', 'var(--blue-2)'],
  ]);
  document.getElementById('cmpAwayStats').innerHTML = statBlock([
    ['Avg points', '61', 'var(--green)'], ['Win rate', '58%', ''], ['Goals/game', '1.9', ''], ['Clean sheets', '42%', 'var(--green)'], ['H2H wins', '3', ''],
  ], 'r');

  // 5-year trend (3 series)
  const seasons = ['S22', 'S23', 'S24', 'S25', 'S26'];
  X.line('#trend5', {
    w: 600, h: 220, yLabels: true, yDec: 1, yMax: 3, gy: 4, xLabels: seasons, xMax: 4,
    series: [
      { color: C.blue, area: false, endDot: true, dots: true, data: [2.6, 2.7, 2.75, 2.78, 2.81].map((y, x) => ({ x, y })) },
      { color: C.green, endDot: true, dots: true, data: [1.58, 1.61, 1.66, 1.72, 1.81].map((y, x) => ({ x, y })) },
      { color: C.gold, endDot: true, dots: true, data: [2.1, 2.0, 1.9, 1.85, 1.9].map((y, x) => ({ x, y })) },
    ],
  });

  // Home vs Away
  document.getElementById('homeAway').innerHTML = [
    ['Win rate', 61, 32], ['Goals/game', 1.74, 1.21], ['xG/game', 1.66, 1.28], ['Clean sheets', 44, 28], ['Points/game', 1.92, 1.18],
  ].map(([l, hv, av]) => {
    const max = Math.max(hv, av);
    return `<div style="margin-bottom:14px">
      <div class="flex jcb" style="font-size:12px;margin-bottom:6px"><span class="muted">${l}</span><span style="font-size:11px"><b class="mono" style="color:var(--green)">H ${hv}</b> · <b class="mono" style="color:var(--blue-2)">A ${av}</b></span></div>
      <div class="flex gap-6">
        <div class="meter green" style="flex:1;height:6px"><i data-w="${hv / max * 100}" style="width:0"></i></div>
        <div class="meter" style="flex:1;height:6px"><i data-w="${av / max * 100}" style="width:0"></i></div>
      </div></div>`;
  }).join('');
  setTimeout(() => document.querySelectorAll('#homeAway [data-w]').forEach(i => i.style.width = i.dataset.w + '%'), 300);

  // Seasonal evolution (points)
  X.bars('#seasonEvo', [
    { label: 'S22', v: 48 }, { label: 'S23', v: 52 }, { label: 'S24', v: 58, color: C.blue }, { label: 'S25', v: 61, color: C.blue }, { label: 'S26', v: 67, color: 'linear-gradient(180deg,var(--green),var(--green2,#27e08a)44)' },
  ], { w: 560, h: 180, max: 75 });

  // Managers
  const mgrs = [
    { n: 'T. Holloway', yr: '2024–now', wr: 64, badge: 'Current', cls: 'green' },
    { n: 'R. Castellan', yr: '2021–24', wr: 52, badge: '', cls: '' },
    { n: 'D. Marsh', yr: '2018–21', wr: 44, badge: '', cls: '' },
    { n: 'P. Eriksson', yr: '2015–18', wr: 49, badge: '', cls: '' },
  ];
  document.getElementById('managers').innerHTML = mgrs.map(m => `
    <div class="flex aic gap-12" style="padding:11px 0;border-bottom:1px solid var(--line)">
      <div class="crest sm" style="background:linear-gradient(150deg,#2a3550,#1a2236);color:var(--text-2)">${m.n.split(' ')[1][0]}</div>
      <div style="flex:1"><div class="flex aic gap-8"><span style="font-weight:600;font-size:13.5px">${m.n}</span>${m.badge ? `<span class="badge ${m.cls}" style="font-size:9px">${m.badge}</span>` : ''}</div><div class="dim" style="font-size:11px">${m.yr}</div></div>
      <div style="width:70px"><div class="meter ${m.wr >= 60 ? 'green' : ''}" style="height:5px"><i data-w="${m.wr}" style="width:0"></i></div></div>
      <div class="mono" style="width:36px;text-align:right;font-weight:700;font-size:13px;color:${m.wr >= 60 ? 'var(--green)' : 'var(--text-2)'}">${m.wr}%</div>
    </div>`).join('');
  setTimeout(() => document.querySelectorAll('#managers [data-w]').forEach(i => i.style.width = i.dataset.w + '%'), 300);
});
