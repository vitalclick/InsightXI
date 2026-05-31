/* ============================================================
   InsightXI — Player Intelligence logic
   ============================================================ */
window.addEventListener('DOMContentLoaded', function () {
  const D = IXData, X = IXChart, C = IXChart.C, I = window.IXIcons || {};
  document.querySelectorAll('[data-icon]').forEach(e => { e.innerHTML = I[e.dataset.icon] || ''; });

  // Radar
  X.radar('#playerRadar', {
    size: 260,
    axes: ['Finishing', 'Movement', 'Aerial', 'Hold-up', 'Pace', 'Dribble', 'Pressing', 'Passing'],
    series: [
      { color: '#54607a', values: [70, 68, 64, 60, 66, 58, 55, 62] },
      { color: C.green, values: [92, 88, 78, 74, 84, 71, 80, 69] },
    ],
  });

  // Goals vs xG (cumulative over season)
  const goals = [], xg = [];
  let g = 0, x = 0;
  for (let i = 0; i < 30; i++) { if (D.rnd(i * 5) > 0.42) g++; x += 0.45 + D.rnd(i * 3) * 0.2; goals.push({ x: i, y: g }); xg.push({ x: i, y: +x.toFixed(1) }); }
  X.line('#goalTrend', {
    w: 560, h: 200, yLabels: true, yDec: 0, yMax: 20, gy: 4,
    xLabels: ['MD1', 'MD10', 'MD20', 'MD30'], xMax: 29,
    series: [
      { color: C.green, area: true, endDot: true, data: goals },
      { color: C.blue, dash: false, data: xg },
    ],
  });

  X.ring('#influenceRing', 96, { size: 96, color: C.violet, label: 'infl.' });
  X.ring('#fitnessRing', 91, { size: 96, color: C.green, label: 'fit' });

  // Per 90
  X.bars('#per90', [
    { label: 'Goals', v: 82, disp: '0.71' },
    { label: 'Shots', v: 74, disp: '3.8' },
    { label: 'xG', v: 79, disp: '0.62', color: 'linear-gradient(90deg,var(--blue),var(--blue-2))' },
    { label: 'Touches/box', v: 88, disp: '6.4', color: 'linear-gradient(90deg,var(--green),var(--green-2))' },
    { label: 'Key passes', v: 61, disp: '1.9' },
    { label: 'Pressures', v: 70, disp: '14.1', color: 'linear-gradient(90deg,var(--violet),#b9a3ff)' },
  ], { horiz: true, labelW: 92, valW: 40, max: 100 });

  // Shot map (heatmap weighted to box / central)
  X.heatmap('#shotMap', [
    [.4, .7, .4], [.6, .95, .6], [.3, .5, .3], [.1, .2, .1],
  ], { w: 220, h: 300 });

  // Recent matches
  const opps = ['NTH', 'BRK', 'WLM', 'HRT', 'STG'];
  document.getElementById('recentBody').innerHTML = opps.map((o, i) => {
    const gl = [2, 1, 0, 1, 2][i], as = [0, 1, 1, 0, 0][i], xgv = [1.4, 0.8, 0.6, 1.1, 1.7][i], rt = [8.9, 7.6, 6.8, 7.9, 9.2][i];
    const rc = rt >= 8.5 ? 'var(--green-2)' : rt >= 7.5 ? 'var(--blue-2)' : 'var(--text-2)';
    return `<tr>
      <td><div class="flex aic gap-8">${D.crest(o, 'xs')}<span style="color:var(--text)">${o}</span></div></td>
      <td class="num">90</td><td class="num" style="color:${gl ? 'var(--green)' : 'var(--dim)'}">${gl}</td>
      <td class="num">${as}</td><td class="num">${xgv}</td>
      <td class="num" style="color:${rc};font-weight:700">${rt}</td></tr>`;
  }).join('');
});
