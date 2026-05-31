/* ============================================================
   InsightXI — Team Intelligence logic
   ============================================================ */
window.addEventListener('DOMContentLoaded', function () {
  const D = IXData, X = IXChart, C = IXChart.C, I = window.IXIcons || {};
  document.querySelectorAll('[data-icon]').forEach(e => { e.innerHTML = I[e.dataset.icon] || ''; });

  document.getElementById('teamForm').innerHTML = ['W', 'W', 'D', 'W', 'W'].map(r => `<span class="fdot ${r.toLowerCase()}">${r}</span>`).join('');

  // Team radar
  X.radar('#teamRadar', {
    size: 280,
    axes: ['Attack', 'Defense', 'Possession', 'Pressing', 'Transition', 'Set-piece', 'Discipline', 'Pace'],
    series: [
      { color: '#54607a', values: [62, 60, 55, 58, 60, 54, 62, 59] },
      { color: C.blue, values: [88, 81, 86, 84, 70, 72, 68, 75] },
    ],
  });

  // Season trend (xG per matchday)
  const xgData = [];
  for (let i = 0; i < 30; i++) { xgData.push({ x: i, y: 1.4 + Math.sin(i / 3) * 0.4 + i * 0.025 + (D.rnd(i * 7) * 0.3) }); }
  X.line('#seasonTrend', {
    w: 600, h: 200, yLabels: true, yDec: 1, yMax: 3, gy: 4,
    xLabels: ['MD1', 'MD8', 'MD15', 'MD22', 'MD30'], xMax: 29,
    series: [{ color: C.green, area: true, endDot: true, data: xgData }],
  });

  // Lineup formation
  const home433 = [
    { num: 1, x: .5, y: .92, name: 'Reed' }, { num: 2, x: .84, y: .74, name: 'Holt' }, { num: 5, x: .62, y: .79, name: 'Bauer' }, { num: 6, x: .38, y: .79, name: 'Kovac' }, { num: 3, x: .16, y: .74, name: 'Walsh' },
    { num: 8, x: .72, y: .52, name: 'Petrov' }, { num: 4, x: .5, y: .56, name: 'Reed' }, { num: 10, x: .28, y: .52, name: 'Mendez' },
    { num: 7, x: .82, y: .26, name: 'Costa' }, { num: 9, x: .5, y: .18, name: 'Vance' }, { num: 11, x: .18, y: .26, name: 'Traoré' },
  ];
  X.formation('#teamForm433', home433, { w: 280, h: 380, color: C.blue });

  // Squad table
  const squad = D.makeSquad('RVS');
  document.getElementById('squadBody').innerHTML = squad.map(p => {
    const rc = p.rating >= 85 ? 'var(--green-2)' : p.rating >= 78 ? 'var(--blue-2)' : 'var(--text-2)';
    return `<tr>
      <td class="mono dim">${p.num}</td>
      <td><div class="flex aic gap-8">${p.starter ? '<span class="badge-dot" style="box-shadow:none;width:6px;height:6px"></span>' : '<span style="width:6px"></span>'}<span style="color:var(--text);font-weight:500">${p.name}</span></div></td>
      <td><span class="badge" style="font-size:10px">${p.pos}</span></td>
      <td class="muted">${p.age}</td>
      <td class="num">${p.goals}</td>
      <td class="num">${p.xg}</td>
      <td class="num" style="color:${rc};font-weight:700">${p.rating}</td>
    </tr>`;
  }).join('');

  // Possession metrics
  X.bars('#possMetrics', [
    { label: 'Avg poss.', v: 61, disp: '61%', color: 'linear-gradient(90deg,var(--blue),var(--blue-2))' },
    { label: 'Pass acc.', v: 88, disp: '88%' },
    { label: 'Final 3rd', v: 73, disp: '73%', color: 'linear-gradient(90deg,var(--green),var(--green-2))' },
    { label: 'PPDA', v: 70, disp: '8.4', color: 'linear-gradient(90deg,var(--red),#ff8a95)' },
    { label: 'Build-up', v: 66, disp: 'High' },
  ], { horiz: true, labelW: 80, valW: 40, max: 100 });

  // Touch heatmap
  X.heatmap('#touchHeat', [
    [.85, .9, .8], [.65, .75, .68], [.5, .58, .52], [.35, .42, .38],
  ], { w: 200, h: 280 });

  // Performance timeline
  const perf = [];
  for (let i = 0; i < 30; i++) { perf.push({ x: i, y: 6.2 + Math.sin(i / 4) * 0.6 + i * 0.035 }); }
  X.line('#perfTimeline', {
    w: 460, h: 150, yLabels: true, yDec: 1, yMax: 9, yMin: 5, gy: 3,
    xLabels: ['MD1', 'MD10', 'MD20', 'MD30'], xMax: 29,
    series: [{ color: C.blue, area: true, endDot: true, data: perf }],
  });
});
