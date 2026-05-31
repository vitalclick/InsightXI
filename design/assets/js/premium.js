/* ============================================================
   InsightXI — Premium Intelligence logic
   ============================================================ */
window.addEventListener('DOMContentLoaded', function () {
  const D = IXData, X = IXChart, C = IXChart.C, I = window.IXIcons || {};
  document.querySelectorAll('[data-icon]').forEach(e => { e.innerHTML = I[e.dataset.icon] || ''; });

  // Elite confidence insights
  const elite = [
    { h: 'RVS', a: 'KGT', conf: 88, pick: 'RVS & Over 1.5', edge: '+14%', note: 'Pressing mismatch + xG trend converge — highest-conviction read of the round.' },
    { h: 'CLF', a: 'FNL', conf: 84, pick: 'CLF win', edge: '+11%', note: 'Fenlow conceding 1.9 xGA away; Cliffton overload the wings.' },
    { h: 'HRT', a: 'ASH', conf: 81, pick: 'HRT & BTTS', edge: '+9%', note: 'Set-piece edge meets two open defensive lines.' },
  ];
  document.getElementById('eliteList').innerHTML = elite.map(e => `
    <div style="padding:14px 0;border-bottom:1px solid var(--line)">
      <div class="flex jcb aic" style="margin-bottom:8px">
        <div class="flex aic gap-8">${D.crest(e.h, 'xs')}<span style="font-weight:600;font-size:13px">${e.h}</span><span class="dim">v</span>${D.crest(e.a, 'xs')}<span style="font-weight:600;font-size:13px">${e.a}</span></div>
        <span class="mono" style="font-weight:700;color:var(--gold)">${e.conf}%</span>
      </div>
      <div class="flex aic gap-8" style="margin-bottom:7px"><span class="badge gold">${e.pick}</span><span class="badge green">edge ${e.edge}</span></div>
      <div style="font-size:12px;color:var(--muted);line-height:1.45">${e.note}</div>
    </div>`).join('');

  // Tactical AI report
  document.getElementById('tacticalReport').innerHTML = `
    <div style="font-size:13.5px;color:var(--text-2);line-height:1.65">
      <p style="margin:0 0 12px"><b style="color:#fff">Executive read.</b> Riverside enter as 47% favourites, but the model's conviction comes from <b style="color:var(--green-2)">structural matchup advantage</b> rather than form alone.</p>
      <div style="height:1px;background:var(--line);margin:12px 0"></div>
      <div class="xai-row" style="padding:10px 0"><div class="xai-ic neu">1</div><div class="xai-txt"><b>Press vs build-up.</b> Riverside's 8.4 PPDA directly attacks Kingsgate's patient 12.1 — expect turnovers in the middle third.</div></div>
      <div class="xai-row" style="padding:10px 0"><div class="xai-ic neu">2</div><div class="xai-txt"><b>Half-space overloads.</b> 44% of shots come centrally; Kingsgate's double pivot is vulnerable between the lines.</div></div>
      <div class="xai-row" style="padding:10px 0;border:none"><div class="xai-ic">3</div><div class="xai-txt"><b>Key battle.</b> Vance vs a disrupted centre-back pairing — a <b style="color:var(--green-2)">+0.3 xG</b> swing if injuries hold.</div></div>
      <div style="margin-top:8px;padding:12px;border-radius:11px;background:rgba(232,194,112,.06);border:1px solid rgba(232,194,112,.18);font-size:12.5px;color:var(--text-2)"><b style="color:var(--gold)">Verdict:</b> Lean Riverside to win and both teams to register 1.5+ goals. Confidence: <b style="color:#fff">High (88%)</b>.</div>
    </div>`;

  // Correct score matrix (RVS rows 0-4 top->? , KGT cols 0-4)
  const probs = [
    [3.1, 4.0, 2.6, 1.1, 0.4],
    [5.2, 9.1, 6.0, 2.5, 0.9],
    [4.4, 11.4, 7.8, 3.2, 1.1],
    [2.1, 5.6, 4.0, 1.7, 0.6],
    [0.8, 2.0, 1.4, 0.6, 0.2],
  ];
  document.getElementById('scoreRowLabels').innerHTML = [4, 3, 2, 1, 0].map(n => `<span>RVS ${n}</span>`).join('');
  const max = 11.4;
  let cells = '';
  for (let r = 4; r >= 0; r--) for (let cc = 0; cc <= 4; cc++) {
    const v = probs[r][cc], int = v / max;
    const bg = `rgba(${v >= 9 ? '39,224,138' : v >= 5 ? '46,125,255' : '90,100,128'}, ${0.12 + int * 0.6})`;
    cells += `<div class="score-cell" style="background:${bg};color:${int > 0.4 ? '#fff' : 'var(--text-2)'}">${v.toFixed(1)}</div>`;
  }
  document.getElementById('scoreMatrix').innerHTML = cells;

  // Lineup impact
  const impact = [
    { n: 'M. Vance', pos: 'ST', v: 0.34, status: 'in' },
    { n: 'A. Petrov', pos: 'CM', v: 0.18, status: 'in' },
    { n: 'L. Kovac (KGT)', pos: 'CB', v: -0.22, status: 'doubt' },
    { n: 'S. Bauer (KGT)', pos: 'CB', v: -0.16, status: 'out' },
    { n: 'D. Costa', pos: 'RW', v: 0.12, status: 'in' },
  ];
  const maxImp = 0.4;
  document.getElementById('lineupImpact').innerHTML = impact.map(p => {
    const pos = p.v >= 0;
    const w = Math.abs(p.v) / maxImp * 50;
    const stCls = p.status === 'in' ? 'green' : p.status === 'out' ? 'red' : 'amber';
    const stTxt = p.status === 'in' ? 'Starting' : p.status === 'out' ? 'Out' : 'Doubt';
    return `<div class="flex aic gap-12" style="padding:9px 0;border-bottom:1px solid var(--line)">
      <div style="width:130px"><div style="font-weight:600;font-size:13px">${p.n}</div><div class="dim" style="font-size:10px">${p.pos} · <span style="color:var(--${stCls === 'green' ? 'green' : stCls === 'red' ? 'red' : 'amber'})">${stTxt}</span></div></div>
      <div style="flex:1;display:flex;align-items:center"><div style="width:50%;display:flex;justify-content:flex-end">${!pos ? `<div style="height:8px;width:${w}%;background:linear-gradient(90deg,#ff8a95,var(--red));border-radius:20px 0 0 20px"></div>` : ''}</div><div style="width:1px;height:14px;background:var(--line-2)"></div><div style="width:50%">${pos ? `<div style="height:8px;width:${w}%;background:linear-gradient(90deg,var(--green),var(--green-2));border-radius:0 20px 20px 0"></div>` : ''}</div></div>
      <div class="mono" style="width:48px;text-align:right;font-weight:700;font-size:13px;color:${pos ? 'var(--green)' : 'var(--red)'}">${pos ? '+' : ''}${p.v.toFixed(2)}</div>
    </div>`;
  }).join('');

  // Fatigue analysis
  const fat = [
    { n: 'Riverside FC', load: 62, days: 6, risk: 'low' },
    { n: 'Kingsgate Utd', load: 84, days: 3, risk: 'high' },
    { n: 'Ashford City', load: 71, days: 4, risk: 'mid' },
    { n: 'Hartwell Town', load: 58, days: 7, risk: 'low' },
  ];
  document.getElementById('fatigue').innerHTML = fat.map(t => {
    const col = t.risk === 'high' ? 'var(--red)' : t.risk === 'mid' ? 'var(--amber)' : 'var(--green)';
    const cls = t.risk === 'high' ? '' : t.risk === 'mid' ? 'gold' : 'green';
    return `<div style="margin-bottom:13px">
      <div class="flex jcb aic" style="margin-bottom:6px"><span style="font-size:13px;font-weight:600">${t.n}</span><span style="font-size:11px;color:${col};font-family:var(--font-mono)">${t.days}d rest · ${t.risk} risk</span></div>
      <div class="meter ${cls}" style="height:7px"><i data-w="${t.load}" style="width:0;${t.risk === 'high' ? 'background:linear-gradient(90deg,var(--red),#ff8a95)' : ''}"></i></div></div>`;
  }).join('');
  setTimeout(() => document.querySelectorAll('#fatigue [data-w]').forEach(i => i.style.width = i.dataset.w + '%'), 300);

  // Hidden trends
  const trends = [
    { t: 'Riverside score 71% of goals after 60′', tag: 'Late surge', cls: 'green' },
    { t: 'Kingsgate concede first in 4 of last 5 aways', tag: 'Slow starts', cls: 'red' },
    { t: 'This fixture: BTTS in 6 of last 8 meetings', tag: 'Goals pattern', cls: 'gold' },
    { t: 'Referee Atkins averages 4.8 cards — high for the league', tag: 'Official bias', cls: 'amber' },
  ];
  document.getElementById('hiddenTrends').innerHTML = trends.map(t => `
    <div class="flex aic gap-12" style="padding:11px 0;border-bottom:1px solid var(--line)">
      <div class="xai-ic neu" style="background:rgba(155,123,255,.1);color:var(--violet);border-color:rgba(155,123,255,.2)">⌕</div>
      <div style="flex:1;font-size:13px;color:var(--text-2)">${t.t}</div>
      <span class="badge ${t.cls}">${t.tag}</span>
    </div>`).join('');
});
