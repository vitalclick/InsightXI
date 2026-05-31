/* ============================================================
   InsightXI — Today Confidence Board (full page)
   ============================================================ */
window.addEventListener('DOMContentLoaded', function () {
  const D = IXData, I = window.IXIcons || {};
  document.querySelectorAll('[data-icon]').forEach(e => { e.innerHTML = I[e.dataset.icon] || ''; });
  const LOCK = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>';
  const days = [
    { k: 'Thu', d: '2026.05.28', s: 11, dow: '28 May' }, { k: 'Fri', d: '2026.05.29', s: 23, dow: '29 May' },
    { k: 'Today', d: '2026.05.30', s: 7, dow: '30 May' }, { k: 'Sun', d: '2026.05.31', s: 41, dow: '31 May' },
    { k: 'Mon', d: '2026.06.01', s: 59, dow: '1 Jun' },
  ];
  const times = ['12:30', '14:00', '15:00', '17:30', '19:45', '20:00', '13:00', '16:00', '18:00'];
  function pick(seed) { return D.list[Math.floor(D.rnd(seed) * D.list.length)]; }
  function makeDay(seed) {
    const used = new Set(), fx = []; let s = seed, guard = 0;
    while (fx.length < 9 && guard++ < 400) {
      const h = pick(s * 3.1 + 1), a = pick(s * 7.3 + 13); s++;
      if (h === a || used.has(h + '-' + a) || used.has(a + '-' + h)) continue; used.add(h + '-' + a);
      const hp = 28 + Math.floor(D.rnd(s * 5 + 2) * 44); const conf = 55 + Math.floor(D.rnd(s * 9 + 4) * 31);
      const pk = hp > 46 ? 'h' : (hp < 34 ? 'a' : (D.rnd(s * 2 + 1) > .5 ? 'a' : 'd'));
      fx.push({ h, a, conf, pk, t: times[fx.length] });
    }
    return fx;
  }
  function makeToday() {
    return [
      { h: 'CLF', a: 'FNL', conf: 73, pk: 'h', t: '12:30' }, { h: 'MRD', a: 'STG', conf: 61, pk: 'h', t: '14:00' },
      { h: 'NTH', a: 'BRK', conf: 58, pk: 'a', t: '15:00' }, { h: 'RVS', a: 'KGT', conf: 74, pk: 'h', t: '17:30' },
      { h: 'HRT', a: 'ASH', conf: 64, pk: 'h', t: '19:45' }, { h: 'WLM', a: 'PRT', conf: 60, pk: 'h', t: '20:00' },
      { h: 'ASH', a: 'CLF', conf: 67, pk: 'h', t: '13:00' }, { h: 'KGT', a: 'NTH', conf: 71, pk: 'h', t: '16:00' },
      { h: 'BRK', a: 'WLM', conf: 56, pk: 'd', t: '18:00' },
    ];
  }
  function probs(pk, conf) {
    let hp = pk === 'h' ? 40 + Math.round(conf * 0.18) : pk === 'a' ? 22 : 32;
    let ap = pk === 'a' ? 40 + Math.round(conf * 0.18) : pk === 'h' ? 24 : 30;
    let dp = 100 - hp - ap; if (dp < 14) { dp = 14; const ov = hp + ap + dp - 100; if (pk === 'h') hp -= ov; else ap -= ov; }
    return { hp, dp, ap };
  }
  function confColor(c) { return c >= 70 ? 'var(--green)' : c >= 60 ? 'var(--blue-2)' : 'var(--gold)'; }

  function render(day) {
    const fx = day.k === 'Today' ? makeToday() : makeDay(day.s);
    document.getElementById('boardDate').textContent = day.d;
    const top = fx.slice().sort((a, b) => b.conf - a.conf)[0];
    const m = day.k === 'Today' ? { h: 'RVS', a: 'KGT', conf: 74, pk: 'h' } : top;
    const pr = day.k === 'Today' ? { hp: 47, dp: 27, ap: 26 } : probs(m.pk, m.conf);
    const fav = pr.hp >= pr.dp && pr.hp >= pr.ap ? 'h' : pr.ap >= pr.dp ? 'a' : 'd';
    document.getElementById('motd').innerHTML = `
      <div class="flex jcb aic" style="margin:6px 0 20px">
        <div class="flex col aic gap-10" style="flex:1">${D.crest(m.h, 'lg')}<div style="font-weight:700;text-align:center;font-size:14px">${D.CLUBS[m.h].name}</div></div>
        <div class="flex col aic" style="flex-shrink:0;padding:0 10px"><span class="dim mono" style="font-size:12px;letter-spacing:.1em">VS</span><span class="badge blue" style="margin-top:8px">AI ${m.conf}%</span></div>
        <div class="flex col aic gap-10" style="flex:1">${D.crest(m.a, 'lg')}<div style="font-weight:700;text-align:center;font-size:14px">${D.CLUBS[m.a].name}</div></div>
      </div>
      <div class="flex gap-8">
        <div class="prob-pill ${fav === 'h' ? 'fav' : ''}">${D.crest(m.h, 'xs')}<b>${pr.hp}%</b><span class="lbl">Home</span></div>
        <div class="prob-pill ${fav === 'd' ? 'fav' : ''}"><span class="pick-badge d" style="width:22px;height:22px;font-size:10px;border-radius:6px">X</span><b>${pr.dp}%</b><span class="lbl">Draw</span></div>
        <div class="prob-pill ${fav === 'a' ? 'fav' : ''}">${D.crest(m.a, 'xs')}<b>${pr.ap}%</b><span class="lbl">Away</span></div>
      </div>
      <div class="flex jcb aic" style="margin-top:18px;padding-top:16px;border-top:1px solid var(--line)">
        <div class="flex aic gap-9"><div class="tb-avatar" style="width:30px;height:30px;font-size:11px;border-radius:9px">IX</div><div style="font-size:12px"><span class="dim">Analysis by</span> <b>Model v4.2</b></div></div>
        <a href="match.html" class="btn btn-sm btn-primary">View Intel →</a>
      </div>`;

    const leagues = [
      { name: 'Premier League', code: 'PL', rows: fx.slice(0, 4), locked: false },
      { name: 'Continental Cup', code: 'CC', rows: fx.slice(4, 7), locked: false },
      { name: 'Domestic Cup', code: 'DC', rows: fx.slice(7), locked: true },
    ];
    document.getElementById('boardList').innerHTML = leagues.map(lg => `
      <div class="league-row"><span class="badge blue" style="font-size:9px">${lg.code}</span>${lg.name}${lg.locked ? '<span class="badge gold" style="font-size:9px;margin-left:6px">Premium</span>' : ''}</div>
      ${lg.rows.map(r => `
        <div class="board-row">
          <span class="mono dim" style="width:46px;font-size:12px;flex-shrink:0">${r.t}</span>
          <div class="flex aic gap-7" style="flex:1;justify-content:flex-end;font-size:13px;font-weight:600;min-width:0"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${D.CLUBS[r.h].name}</span>${D.crest(r.h, 'xs')}</div>
          <span class="dim" style="font-size:11px;flex-shrink:0">:</span>
          <div class="flex aic gap-7" style="flex:1;font-size:13px;font-weight:600;min-width:0">${D.crest(r.a, 'xs')}<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${D.CLUBS[r.a].name}</span></div>
          ${lg.locked
        ? `<a href="premium.html" class="lock-btn">Unlock ${LOCK}</a>`
        : `<span class="mono" style="font-size:11px;color:${confColor(r.conf)};width:34px;text-align:right;flex-shrink:0">${r.conf}%</span><a href="match.html" class="pick-badge ${r.pk}" title="AI predicted outcome">${r.pk === 'h' ? '1' : r.pk === 'a' ? '2' : 'X'}</a>`}
        </div>`).join('')}
    `).join('');

    // Top confidence ranked
    const ranked = fx.slice().sort((a, b) => b.conf - a.conf).slice(0, 6);
    document.getElementById('topConf').innerHTML = ranked.map((r, i) => `
      <a href="match.html" class="flex aic gap-10" style="padding:9px 0;${i < 5 ? 'border-bottom:1px solid var(--line)' : ''}">
        <span class="mono dim" style="width:14px">${i + 1}</span>
        <div class="flex aic gap-6" style="flex:1;font-size:12.5px;font-weight:600">${D.crest(r.h, 'xs')}${D.CLUBS[r.h].short} <span class="dim">v</span> ${D.CLUBS[r.a].short}${D.crest(r.a, 'xs')}</div>
        <span class="pick-badge ${r.pk}" style="width:24px;height:24px;font-size:11px;border-radius:7px">${r.pk === 'h' ? '1' : r.pk === 'a' ? '2' : 'X'}</span>
        <span class="mono" style="font-weight:700;width:34px;text-align:right;color:${confColor(r.conf)}">${r.conf}%</span>
      </a>`).join('');
  }

  const dt = document.getElementById('dayTabs');
  dt.innerHTML = days.map((d, i) => `<div class="day-pill ${d.k === 'Today' ? 'active' : ''}" data-i="${i}">${d.k}<small>${d.dow}</small></div>`).join('');
  dt.querySelectorAll('.day-pill').forEach(p => p.addEventListener('click', () => {
    dt.querySelectorAll('.day-pill').forEach(x => x.classList.remove('active')); p.classList.add('active'); render(days[+p.dataset.i]);
  }));
  render(days[2]);
});
