/* ============================================================
   InsightXI — Sure Win Predictions logic
   ============================================================ */
window.addEventListener('DOMContentLoaded', function () {
  const D = IXData, X = IXChart, C = IXChart.C, I = window.IXIcons || {};
  document.querySelectorAll('[data-icon]').forEach(e => { e.innerHTML = I[e.dataset.icon] || ''; });

  // Banker gauge + reasons
  X.gauge('#bankerGauge', 88, { size: 200, label: 'confidence' });
  document.getElementById('bankerReasons').innerHTML = [
    'Pressing structure exploits Kingsgate\'s slow build-up (+9%)',
    'Riverside unbeaten in 14 at home · 2.3 goals/game',
    'Two Kingsgate centre-backs doubtful — defence disrupted',
  ].map(r => `<div class="flex aic gap-9" style="padding:5px 0;font-size:13px;color:var(--text-2)"><span class="up" style="font-size:13px">✓</span>${r}</div>`).join('');

  // Prediction cards
  const preds = [
    { h: 'RVS', a: 'KGT', market: '1x2', pick: 'Riverside win', conf: 88, xs: '2–1', reasons: ['Superior xG trend', 'Home fortress form'], col: C.green },
    { h: 'CLF', a: 'FNL', market: '1x2', pick: 'Cliffton win', conf: 84, xs: '2–0', reasons: ['Fenlow leak 1.9 xGA away', 'Wing overloads'], col: C.green },
    { h: 'RVS', a: 'KGT', market: 'ou', pick: 'Over 1.5 goals', conf: 86, xs: '2–1', reasons: ['Both attacks in form', '84% O1.5 hit rate H2H'], col: C.blue },
    { h: 'HRT', a: 'ASH', market: 'btts', pick: 'Both teams to score', conf: 79, xs: '2–1', reasons: ['Open defensive lines', 'BTTS in 6 of 8'], col: C.gold },
    { h: 'KGT', a: 'NTH', market: '1x2', pick: 'Kingsgate win', conf: 81, xs: '2–0', reasons: ['Northfield away fragility', 'Pivot control'], col: C.green },
    { h: 'BRK', a: 'WLM', market: 'ou', pick: 'Under 2.5 goals', conf: 77, xs: '1–0', reasons: ['Two low-tempo sides', 'Combined 1.0 xG/game'], col: C.blue },
  ];
  const marketLabel = { '1x2': 'Match result', ou: 'Over / Under', btts: 'BTTS' };

  function render(filter) {
    const list = preds.filter(p => filter === 'all' || p.market === filter);
    document.getElementById('countTag').textContent = list.length + ' picks';
    const grid = document.getElementById('predGrid');
    grid.innerHTML = '';
    list.forEach((p, i) => {
      const card = document.createElement('div');
      card.className = 'card card-hover reveal';
      card.style.cssText = 'padding:18px';
      const ringId = 'pr' + i;
      card.innerHTML = `
        <div class="flex jcb aic" style="margin-bottom:14px">
          <span class="badge ${p.market === '1x2' ? 'blue' : p.market === 'ou' ? 'cyan' : 'gold'}">${marketLabel[p.market]}</span>
          <span class="mono" style="font-size:11px;color:var(--dim)">exp. ${p.xs}</span>
        </div>
        <div class="flex aic gap-16">
          <div style="width:84px;flex-shrink:0" id="${ringId}"></div>
          <div style="flex:1;min-width:0">
            <div class="flex aic gap-7" style="margin-bottom:7px;font-size:13px;font-weight:700">${D.crest(p.h, 'xs')}${D.CLUBS[p.h].short}<span class="dim">v</span>${D.CLUBS[p.a].short}${D.crest(p.a, 'xs')}</div>
            <div style="font-size:14px;font-weight:600;color:#fff">${p.pick}</div>
          </div>
        </div>
        <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--line)">
          ${p.reasons.map(r => `<div class="flex aic gap-8" style="padding:3px 0;font-size:12px;color:var(--muted)"><span class="up" style="font-size:11px">✓</span>${r}</div>`).join('')}
        </div>
        <a href="match.html" class="btn btn-sm btn-ghost" style="width:100%;margin-top:14px">Why this pick →</a>`;
      grid.appendChild(card);
      X.ring('#' + ringId, p.conf, { size: 84, color: p.col, label: 'conf' });
    });
  }
  render('all');

  document.querySelectorAll('#marketTabs .tab').forEach(t => t.addEventListener('click', () => {
    document.querySelectorAll('#marketTabs .tab').forEach(x => x.classList.remove('active'));
    t.classList.add('active'); render(t.dataset.m);
  }));
});
