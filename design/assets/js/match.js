/* ============================================================
   InsightXI — Match Intelligence page logic
   ============================================================ */
window.addEventListener('DOMContentLoaded', function () {
  const D = IXData, X = IXChart, C = IXChart.C, I = window.IXIcons || {};
  const main = document.querySelector('main.page');

  // token replace $ICON:name
  main.innerHTML = main.innerHTML.replace(/\$ICON:(\w+)/g, (m, n) => `<span class="ico">${I[n] || ''}</span>`);
  document.querySelectorAll('[data-icon]').forEach(e => { e.innerHTML = I[e.dataset.icon] || ''; });

  // Form dots
  function formDots(arr, el) { el.innerHTML = arr.map(r => `<span class="fdot ${r.toLowerCase()}">${r}</span>`).join(''); }
  formDots(['W', 'W', 'D', 'W', 'W'], document.getElementById('hForm'));
  formDots(['W', 'W', 'W', 'D', 'W'], document.getElementById('aForm'));

  // Win/Draw/Loss donut
  X.donut('#wdlDonut', [
    { v: 47, color: C.blue }, { v: 27, color: '#54607a' }, { v: 26, color: C.green },
  ], { size: 160, stroke: 18, centerTop: '47%', centerBot: 'RVS win' });
  document.getElementById('wdlLegend').innerHTML = [
    ['Riverside win', 47, C.blue], ['Draw', 27, '#8390a8'], ['Kingsgate win', 26, C.green],
  ].map(([l, v, c]) => `<div class="flex jcb aic" style="padding:7px 0;border-bottom:1px solid var(--line)">
      <div class="flex aic gap-8"><span style="width:10px;height:10px;border-radius:3px;background:${c}"></span><span style="font-size:13px;color:var(--text-2)">${l}</span></div>
      <span class="mono" style="font-weight:700;font-size:15px">${v}%</span></div>`).join('');

  // Rings
  X.ring('#ringO15', 84, { size: 96, color: C.green, label: '' });
  X.ring('#ringO25', 58, { size: 96, color: C.blue });
  X.ring('#ringBTTS', 61, { size: 96, color: C.gold });

  // Confidence gauge
  X.gauge('#confGauge', 74, { size: 180, label: 'Confidence' });
  document.getElementById('subModels').innerHTML = [
    ['Form model', 78], ['xG model', 81], ['Tactical model', 72], ['Market model', 69], ['Injury model', 66], ['Historical', 71],
  ].map(([l, v]) => `<div class="flex aic gap-10" style="margin:6px 0"><span style="width:90px;font-size:11.5px;color:var(--muted)">${l}</span><div class="meter ${v >= 75 ? 'green' : ''}" style="flex:1;height:5px"><i data-w="${v}" style="width:0"></i></div><span class="mono" style="font-size:11.5px;width:30px;text-align:right;color:var(--text-2)">${v}%</span></div>`).join('');
  setTimeout(() => document.querySelectorAll('#subModels [data-w]').forEach(i => i.style.width = i.dataset.w + '%'), 300);

  // Explainable AI list
  const factors = [
    { t: 'Superior xG trend', d: 'Averaging <b>1.84 xG</b> across last 6 vs Kingsgate\'s 1.21 — a widening gap.', w: '+21%', cls: '' },
    { t: 'Stronger home form', d: '<b>14 unbeaten</b> at Riverside Park; 2.3 goals/game scored at home.', w: '+16%', cls: '' },
    { t: 'Opponent defensive injuries', d: 'Two first-choice centre-backs doubtful — partnership disrupted.', w: '+12%', cls: '' },
    { t: 'Tactical pressing advantage', d: 'High press (14.2 recoveries/90) targets Kingsgate\'s slow build-up.', w: '+9%', cls: '' },
    { t: 'Kingsgate away resilience', d: 'Unbeaten in 5 on the road — a genuine counter-signal.', w: '−7%', cls: 'neg' },
  ];
  document.getElementById('xaiList').innerHTML = factors.map(f => `
    <div class="xai-row">
      <div class="xai-ic ${f.cls}">${f.cls === 'neg' ? '↓' : '↑'}</div>
      <div class="xai-txt"><b>${f.t}</b><br>${f.d}</div>
      <div class="xai-w" style="color:${f.cls === 'neg' ? 'var(--red)' : 'var(--green-2)'}">${f.w}</div>
    </div>`).join('');

  X.bars('#factorBars', [
    { label: 'xG trend', v: 21, disp: '21' }, { label: 'Home form', v: 16, disp: '16' },
    { label: 'Injuries', v: 12, disp: '12' }, { label: 'Pressing', v: 9, disp: '9' },
    { label: 'Set pieces', v: 7, disp: '7', color: 'linear-gradient(90deg,var(--gold),#f0cf80)' },
  ], { horiz: true, labelW: 76, valW: 26, max: 24 });

  // Formations
  const home433 = [
    { num: 1, x: .5, y: .92 }, { num: 2, x: .84, y: .74 }, { num: 5, x: .62, y: .79 }, { num: 6, x: .38, y: .79 }, { num: 3, x: .16, y: .74 },
    { num: 8, x: .72, y: .52 }, { num: 4, x: .5, y: .56 }, { num: 10, x: .28, y: .52 },
    { num: 7, x: .82, y: .26 }, { num: 9, x: .5, y: .18 }, { num: 11, x: .18, y: .26 },
  ];
  const away4231 = [
    { num: 1, x: .5, y: .92 }, { num: 2, x: .84, y: .74 }, { num: 5, x: .62, y: .79 }, { num: 6, x: .38, y: .79 }, { num: 3, x: .16, y: .74 },
    { num: 6, x: .62, y: .58 }, { num: 8, x: .38, y: .58 },
    { num: 7, x: .8, y: .38 }, { num: 10, x: .5, y: .4 }, { num: 11, x: .2, y: .38 }, { num: 9, x: .5, y: .18 },
  ];
  X.formation('#formHome', home433, { w: 260, h: 360, color: C.blue });
  X.formation('#formAway', away4231, { w: 260, h: 360, color: C.green });

  // Pressing heatmap
  X.heatmap('#pressHeat', [
    [.9, .85, .8], [.7, .65, .6], [.45, .4, .35], [.3, .25, .2],
  ], { w: 170, h: 230 });
  document.getElementById('pressStats').innerHTML = [
    ['PPDA', '8.4', 'Riverside', C.blue], ['PPDA', '12.1', 'Kingsgate', C.green], ['High turnovers', '14.2', 'per 90', C.text],
  ].map(([l, v, s, c]) => `<div style="margin-bottom:12px"><div class="mono" style="font-size:21px;font-weight:700;color:${c}">${v}</div><div class="stat-lab">${l} · ${s}</div></div>`).join('');

  // Attack zones (3 vertical zones with %)
  document.getElementById('attackZones').innerHTML = `
    <div class="flex gap-8" style="height:90px;align-items:flex-end">
      ${[['Left', 28, C.blue], ['Central', 44, C.green], ['Right', 28, C.blue]].map(([l, v, c]) => `
        <div style="flex:1;text-align:center">
          <div style="height:${v * 1.6}px;background:linear-gradient(180deg,${c},${c}44);border-radius:6px 6px 0 0;margin-bottom:6px;transition:height .8s"></div>
          <div class="mono" style="font-size:13px;font-weight:700">${v}%</div>
          <div class="stat-lab">${l}</div>
        </div>`).join('')}
    </div>
    <div style="margin-top:14px;font-size:12px;color:var(--muted);line-height:1.5"><b style="color:var(--text)">44%</b> of Riverside's shots originate centrally — they overload the half-spaces between Kingsgate's double pivot.</div>`;

  // xG trend (last 8)
  X.line('#xgTrend', {
    w: 560, h: 200, yLabels: true, yDec: 1, yMax: 3, gy: 3,
    xLabels: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8'], xMax: 7,
    series: [
      { color: C.blue, area: true, endDot: true, dots: true, data: [1.4, 1.7, 1.5, 2.1, 1.8, 2.0, 1.9, 2.2].map((y, x) => ({ x, y })) },
      { color: C.green, endDot: true, dots: true, data: [1.6, 1.3, 1.8, 1.2, 1.5, 1.1, 1.4, 1.2].map((y, x) => ({ x, y })) },
    ],
  });

  // Momentum stats
  document.getElementById('momStats').innerHTML = `
    ${momRow('Riverside FC', 'RVS', '#c8102e', '#7a0a1d', 92, '+5', [60, 66, 64, 72, 70, 78, 80, 92], C.blue)}
    <div style="height:1px;background:var(--line);margin:14px 0"></div>
    ${momRow('Kingsgate Utd', 'KGT', '#0b3d91', '#06224f', 78, '+2', [70, 72, 68, 74, 71, 76, 75, 78], C.green)}
    <div class="grid" style="grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:16px;text-align:center">
      <div><div class="mono" style="font-size:18px;font-weight:700;color:var(--green)">5</div><div class="stat-lab">RVS clean sheets</div></div>
      <div><div class="mono" style="font-size:18px;font-weight:700">2.3</div><div class="stat-lab">RVS goals/game</div></div>
      <div><div class="mono" style="font-size:18px;font-weight:700;color:var(--gold)">+0.6</div><div class="stat-lab">xG edge</div></div>
    </div>`;
  document.querySelectorAll('[data-spark]').forEach(el => {
    X.spark(el, JSON.parse(el.dataset.spark), { w: 110, h: 30, area: true, color: el.dataset.col });
  });

  // H2H list
  const h2h = [
    { h: 'RVS', a: 'KGT', hs: 2, as: 1, r: 'h' }, { h: 'KGT', a: 'RVS', hs: 1, as: 1, r: 'd' },
    { h: 'RVS', a: 'KGT', hs: 3, as: 0, r: 'h' }, { h: 'KGT', a: 'RVS', hs: 2, as: 0, r: 'a' },
    { h: 'RVS', a: 'KGT', hs: 1, as: 1, r: 'd' },
  ];
  document.getElementById('h2hList').innerHTML = h2h.map(m => {
    const col = m.r === 'h' ? C.blue : m.r === 'a' ? C.green : '#8390a8';
    return `<div class="flex jcb aic" style="padding:7px 0;border-bottom:1px solid var(--line);font-size:12.5px">
      <span style="color:var(--text-2)">${m.h} v ${m.a}</span>
      <span class="mono" style="font-weight:700;color:${col}">${m.hs}–${m.as}</span></div>`;
  }).join('');

  // Goals history bar
  X.bars('#goalsHist', [
    { label: 'S21', v: 3 }, { label: 'S22', v: 2 }, { label: 'S23', v: 4 }, { label: 'S24', v: 2 },
    { label: 'S25', v: 1 }, { label: 'S26', v: 4 }, { label: 'H1', v: 3 }, { label: 'H2', v: 2 },
  ], { w: 560, h: 150, max: 4.5 });

  function momRow(name, code, c1, c2, idx, delta, spark, col) {
    return `<div class="flex aic gap-12">
      <div class="crest sm" style="background:linear-gradient(150deg,${c1},${c2})">${code}</div>
      <div style="flex:1"><div style="font-weight:600;font-size:13.5px">${name}</div>
        <div class="meter" style="height:5px;margin-top:5px"><i data-w="${idx}" style="width:0"></i></div></div>
      <div data-spark='${JSON.stringify(spark)}' data-col="${col}" style="width:110px"></div>
      <div style="text-align:right"><div class="mono" style="font-size:17px;font-weight:700">${idx}</div><div class="stat-delta up">▲ ${delta}</div></div>
    </div>`;
  }
  setTimeout(() => document.querySelectorAll('#momStats [data-w]').forEach(i => i.style.width = i.dataset.w + '%'), 300);

  // smooth-scroll subnav + active state
  document.querySelectorAll('.tabs a.tab').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('.tabs a.tab').forEach(x => x.classList.remove('active'));
    a.classList.add('active');
    const t = document.querySelector(a.getAttribute('href'));
    if (t) window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 160, behavior: 'smooth' });
  }));
});
