/* ============================================================
   InsightXI — Live Command Center logic
   ============================================================ */
window.addEventListener('DOMContentLoaded', function () {
  const D = IXData, X = IXChart, C = IXChart.C, I = window.IXIcons || {};
  document.querySelectorAll('[data-icon]').forEach(e => { e.innerHTML = I[e.dataset.icon] || ''; });

  // Live match switcher
  document.getElementById('liveSwitch').innerHTML = D.NOW_LIVE.map((m, i) =>
    `<div class="tab ${i === 0 ? 'active' : ''}">${m.home}–${m.away} <span style="color:var(--red);font-family:var(--font-mono)">${m.min}'</span></div>`).join('');

  // Win probability tracker — minute by minute
  const wp = [];
  let h = 38, d = 30, a = 32;
  for (let m = 0; m <= 67; m += 3) {
    // RVS scored ~58' -> swing toward home
    if (m >= 58) { h = Math.min(64, h + 4); a = Math.max(18, a - 3); }
    else if (m >= 30) { h += 0.6; a -= 0.3; }
    const dd = Math.max(8, 100 - h - a);
    wp.push({ m, h: Math.round(h), d: Math.round(dd), a: Math.round(100 - h - dd) });
  }
  X.winprob('#winprob', wp, { w: 620, h: 170 });

  // Momentum wave (diverging, positive=home)
  X.momentum('#momentumWave', [10, 25, -15, 30, 45, -10, 20, 55, 40, 65, 50, 78, 70], { w: 420, h: 130, homeColor: C.blue, awayColor: C.green });

  // xG race
  const race = D.xgRace(82, 67);
  X.line('#xgRace', {
    w: 620, h: 220, yLabels: true, yDec: 1, yMax: 2.2, gy: 4,
    xLabels: ['0', '15', '30', 'HT', '60', '67'], xMax: 67,
    series: [
      { color: C.blue, area: true, endDot: true, data: race.a.map(p => ({ x: p.m, y: Math.min(1.84, p.v) })) },
      { color: C.green, endDot: true, data: race.b.map(p => ({ x: p.m, y: Math.min(0.91, p.v) })) },
    ],
  });

  // Possession quality ring + stats
  X.ring('#possRing', 63, { size: 108, color: C.blue, label: 'tilt' });
  document.getElementById('possStats').innerHTML = [
    ['Possession', 58, 42], ['Pass acc.', 87, 79], ['Final 3rd', 64, 36],
  ].map(([l, hv, av]) => `<div style="margin-bottom:11px"><div class="flex jcb" style="font-size:11.5px;margin-bottom:4px"><span class="mono" style="color:var(--blue-2)">${hv}%</span><span class="muted">${l}</span><span class="mono" style="color:var(--green)">${av}%</span></div><div style="display:flex;height:5px;border-radius:20px;overflow:hidden;background:var(--surface-3)"><i style="width:${hv}%;background:var(--blue)"></i><i style="flex:1;background:var(--green)"></i></div></div>`).join('');

  // Attack pressure bars
  X.bars('#pressBars', [
    { label: 'Shots', v: 14, disp: '14', color: 'linear-gradient(90deg,var(--red),#ff8a95)' },
    { label: 'On target', v: 6, disp: '6', color: 'linear-gradient(90deg,var(--amber),#ffc97a)' },
    { label: 'Corners', v: 8, disp: '8' },
    { label: 'Box touches', v: 31, disp: '31', color: 'linear-gradient(90deg,var(--green),var(--green-2))' },
  ], { horiz: true, labelW: 86, valW: 28, max: 34 });

  // Match stats (bidirectional)
  const stats = [
    ['Shots', 14, 6], ['On target', 6, 2], ['Possession %', 58, 42], ['Pass accuracy %', 87, 79],
    ['Corners', 8, 3], ['Big chances', 4, 1], ['xG', 1.84, 0.91], ['Tackles won', 18, 22],
  ];
  document.getElementById('matchStats').innerHTML = stats.map(([l, hv, av]) => {
    const tot = hv + av, hp = (hv / tot) * 100;
    return `<div style="margin-bottom:13px">
      <div class="flex jcb" style="font-size:13px;margin-bottom:5px"><span class="mono" style="font-weight:700;color:${hv >= av ? 'var(--blue-2)' : 'var(--text-2)'}">${hv}</span><span class="muted" style="font-size:11.5px">${l}</span><span class="mono" style="font-weight:700;color:${av > hv ? 'var(--green)' : 'var(--text-2)'}">${av}</span></div>
      <div style="display:flex;height:6px;border-radius:20px;overflow:hidden;background:var(--surface-3);gap:2px"><i style="width:${hp}%;background:var(--blue);border-radius:20px 0 0 20px"></i><i style="flex:1;background:var(--green);border-radius:0 20px 20px 0"></i></div>
    </div>`;
  }).join('');

  // Live feed
  const feed = [
    { m: 67, t: 'goal', txt: 'Big chance — Vance forces a save, corner Riverside', c: 'red' },
    { m: 64, t: 'sub', txt: 'Hartwell sub: Okafor on for Bauer', c: '' },
    { m: 61, t: 'card', txt: 'Yellow card — Kovac (Hartwell), tactical foul', c: 'amber' },
    { m: 58, t: 'goal', txt: 'GOAL! Riverside 2-1 — Vance finishes the press', c: 'green' },
    { m: 52, t: 'shot', txt: 'Shot off target — Mendez drags wide from 18 yards', c: '' },
    { m: 47, t: 'shot', txt: 'Hartwell threat — Larsson header saved', c: '' },
    { m: 45, t: 'half', txt: 'Second half underway', c: 'blue' },
  ];
  document.getElementById('liveFeed').innerHTML = feed.map(f =>
    `<div class="flex aic gap-10" style="padding:9px 0;border-bottom:1px solid var(--line)">
      <span class="mono" style="width:30px;font-size:12px;color:var(--dim)">${f.m}'</span>
      <span class="badge-dot" style="background:${f.c ? 'var(--' + f.c + ')' : 'var(--dim)'};box-shadow:none"></span>
      <span style="font-size:12.5px;color:var(--text-2)">${f.txt}</span></div>`).join('');

  // Subtle "live" tick — nudge dangerous attacks counters every few seconds
  const da = { h: 42, a: 17 };
  setInterval(() => {
    if (document.visibilityState !== 'visible') return;
    if (Math.random() > 0.5) da.h++; else if (Math.random() > 0.6) da.a++;
    document.getElementById('daHome').textContent = da.h;
    document.getElementById('daAway').textContent = da.a;
    document.getElementById('daTotal').textContent = da.h + da.a;
  }, 4000);
});
