/* ============================================================
   InsightXI — Results logic
   ============================================================ */
window.addEventListener('DOMContentLoaded', function () {
  const D = IXData, X = IXChart, C = IXChart.C, I = window.IXIcons || {};
  document.querySelectorAll('[data-icon]').forEach(e => { e.innerHTML = I[e.dataset.icon] || ''; });

  X.countUp(document.getElementById('r1'), 42, '', 1100);
  X.countUp(document.getElementById('r2'), 73, '%', 1200);
  X.countUp(document.getElementById('r3'), 88, '%', 1200);
  X.countUp(document.getElementById('r4'), 6, '', 900);

  // Build a fuller results set
  const extra = [
    { home: 'NTH', away: 'STG', hs: 2, as: 2, hxg: 1.62, axg: 1.71, date: '5 days ago', verdict: 'miss' },
    { home: 'PRT', away: 'FNL', hs: 1, as: 0, hxg: 1.04, axg: 0.66, date: '5 days ago', verdict: 'hit' },
    { home: 'WLM', away: 'CLF', hs: 0, as: 1, hxg: 0.88, axg: 1.12, date: '6 days ago', verdict: 'hit' },
    { home: 'BRK', away: 'HRT', hs: 1, as: 3, hxg: 1.21, axg: 2.34, date: '6 days ago', verdict: 'hit' },
  ];
  const all = [...D.RESULTS, ...extra];

  document.getElementById('hitTag').textContent = '73% hit rate';

  document.getElementById('resultsList').innerHTML = all.map(m => {
    const res = m.hs > m.as ? 'H' : m.hs < m.as ? 'A' : 'D';
    const hit = m.verdict === 'hit';
    const totXg = (m.hxg + m.axg).toFixed(1);
    const xgEdge = m.hxg > m.axg ? 'RVS-style home edge' : 'away xG advantage';
    return `<a href="match.html" class="fix-row" style="display:flex;align-items:center;gap:16px;padding:15px 18px;border-bottom:1px solid var(--line);transition:background .15s">
      <div style="width:74px;flex-shrink:0"><div class="dim mono" style="font-size:11px">${m.date}</div><span class="badge" style="font-size:9px;margin-top:4px">${m.comp || 'Premier League'}</span></div>
      <div style="display:flex;align-items:center;gap:10px;width:210px;flex-shrink:0;justify-content:flex-end">
        <span style="font-size:13.5px;font-weight:600;text-align:right">${D.CLUBS[m.home].name}</span>${D.crest(m.home, 'sm')}
      </div>
      <div class="mono" style="width:56px;text-align:center;font-size:18px;font-weight:800">${m.hs}<span class="dim">-</span>${m.as}</div>
      <div style="display:flex;align-items:center;gap:10px;width:210px;flex-shrink:0">
        ${D.crest(m.away, 'sm')}<span style="font-size:13.5px;font-weight:600">${D.CLUBS[m.away].name}</span>
      </div>
      <div style="flex:1;min-width:110px">
        <div class="label-xs" style="margin-bottom:5px">xG summary · ${totXg} total</div>
        <div style="display:flex;height:6px;border-radius:20px;overflow:hidden;background:var(--surface-3)"><i style="width:${m.hxg / (m.hxg + m.axg) * 100}%;background:var(--blue)"></i><i style="flex:1;background:var(--green)"></i></div>
        <div class="flex jcb" style="margin-top:4px;font-family:var(--font-mono);font-size:10px;color:var(--muted)"><span>${m.hxg.toFixed(2)} xG</span><span>${m.axg.toFixed(2)} xG</span></div>
      </div>
      <div style="text-align:right;width:96px;flex-shrink:0">
        <div class="badge ${hit ? 'green' : 'red'}">${hit ? '✓ Predicted' : '✕ Upset'}</div>
        <div class="dim" style="font-size:10px;margin-top:5px">${res === 'H' ? 'Home win' : res === 'A' ? 'Away win' : 'Draw'}</div>
      </div>
    </a>`;
  }).join('');

  document.querySelectorAll('.fix-row').forEach(r => {
    r.onmouseenter = () => r.style.background = 'var(--surface-1)';
    r.onmouseleave = () => r.style.background = '';
  });
  document.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => {
    if (c.textContent.includes('Last 7')) return;
    document.querySelectorAll('.chip').forEach(x => { if (!x.textContent.includes('Last 7')) x.classList.remove('active'); }); c.classList.add('active');
  }));
});
