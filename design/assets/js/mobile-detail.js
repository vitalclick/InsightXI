/* ============================================================
   InsightXI Mobile — detail screens
   Match Intel · Confidence Board · Premium
   ============================================================ */
(function () {
  const D = () => window.IXData;
  const X = () => window.IXChart;
  const I = () => window.MX.I;
  const H = () => window.MXScreens._helpers;

  function norm(m) {
    const D_ = D();
    const hC = D_.CLUBS[m.home], aC = D_.CLUBS[m.away];
    let hp, dp, ap, conf;
    if (m.pred) { hp = m.pred.home; dp = m.pred.draw; ap = m.pred.away; conf = m.pred.conf; }
    else if (typeof m.hp === 'number') { hp = m.hp; dp = m.dp; ap = m.ap; conf = m.conf; }
    else { conf = m.conf || 66; hp = m.momentum === 'home' ? 52 : 41; ap = m.momentum === 'away' ? 47 : 30; dp = 100 - hp - ap; }
    return {
      home: m.home, away: m.away, hC, aC, hp, dp, ap, conf,
      o15: m.pred ? m.pred.o15 : 84, o25: m.pred ? m.pred.o25 : 50 + (conf % 14), btts: m.pred ? m.pred.btts : 48 + (m.home.charCodeAt(0) % 16),
      comp: m.comp || 'Premier League', round: m.round || 'Matchday 31',
      live: m.status === 'live', hs: m.hs, as: m.as, min: m.min,
      kickoff: m.status === 'live' ? `LIVE · ${m.min}'` : `${m.date || 'Today'} · ${m.time || '17:30'}`,
      stadium: m.stadium || (hC.city + ' Stadium'),
      hForm: m.hForm || hC.form, aForm: m.aForm || aC.form,
    };
  }

  /* =================== MATCH INTEL =================== */
  function render_match(el, m) {
    const { crest, tribar, formDots, confCol, nid, paint } = H();
    const D_ = D();
    m = m || D_.FEATURE_MATCH;
    const n = norm(m);
    const gid = nid('mg'), wid = nid('wp'), rid = nid('rd'), xid = nid('mx');
    const fav = n.hp >= n.dp && n.hp >= n.ap ? 'h' : n.ap >= n.dp ? 'a' : 'd';

    const insights = [
      { ic: 'pos', t: `${n.hC.short} press recovers the ball <b>14.2× per 90</b> — 38% above ${n.aC.short}'s build-up tolerance.`, w: '+18' },
      { ic: 'neu', t: `Expected goals model leans <b>${n.hp}%</b> home off a +1.2 xG differential.`, w: 'xG' },
      { ic: 'neg', t: `${n.aC.short} concede <b>1.6 xGA</b> away to top-6 — vulnerable in transition.`, w: '−9' },
      { ic: 'pos', t: `Set-piece edge: <b>${(n.btts)}%</b> BTTS probability with both attacks in form.`, w: 'SP' },
    ];

    // synth win-prob path drifting to current split
    const wp = []; const steps = 13;
    for (let i = 0; i < steps; i++) {
      const k = i / (steps - 1);
      const h = Math.round(33 + (n.hp - 33) * k + Math.sin(i * 1.3) * 4);
      const a = Math.round(33 + (n.ap - 33) * k + Math.cos(i * 1.1) * 3);
      const d = Math.max(8, 100 - h - a);
      wp.push({ m: i, h, d, a });
    }

    el.innerHTML = `
      <div class="block" style="padding-top:14px">
        <div class="m-card pad" style="background:radial-gradient(440px 220px at 50% -10%,rgba(46,125,255,.14),transparent 62%),linear-gradient(180deg,var(--surface-1),var(--card-grad-2))">
          <div class="flex aic jcb" style="margin-bottom:16px">
            <span class="badge blue">${n.comp}</span>
            <span class="dim" style="font-size:11px">${n.round}</span>
          </div>
          <div class="flex aic jcb">
            <div class="flex col aic gap-9" style="flex:1">${crest(n.home, 'xl')}<div style="font-weight:700;font-size:13.5px;text-align:center">${n.hC.short}</div><div class="dim" style="font-size:10.5px">${n.hC.pos}${ord(n.hC.pos)}</div></div>
            <div class="flex col aic" style="padding:0 6px">
              ${n.live ? `<div class="live-score">${n.hs}–${n.as}</div><span class="live-pill" style="margin-top:6px"><span class="pulse"></span>${n.min}'</span>`
        : `<div class="mono dim" style="font-size:14px;letter-spacing:.14em">VS</div><div class="badge blue" style="margin-top:8px">AI ${n.conf}%</div>`}
            </div>
            <div class="flex col aic gap-9" style="flex:1">${crest(n.away, 'xl')}<div style="font-weight:700;font-size:13.5px;text-align:center">${n.aC.short}</div><div class="dim" style="font-size:10.5px">${n.aC.pos}${ord(n.aC.pos)}</div></div>
          </div>
          <div class="flex aic jcc gap-16" style="margin-top:16px;padding-top:13px;border-top:1px solid var(--line);font-size:11.5px" class="muted">
            <span class="muted">${n.kickoff}</span><span class="dim">·</span><span class="muted">${n.stadium}</span>
          </div>
        </div>
      </div>

      <div class="block">
        <div class="block-hd"><h2><span class="ic">${I().target}</span>Match Prediction</h2></div>
        <div class="m-card pad">
          <div style="margin-bottom:14px">${tribar(n.hp, n.dp, n.ap)}</div>
          <div class="flex gap-8">
            <div class="prob-pill ${fav === 'h' ? 'fav' : ''}" style="flex-direction:column;gap:3px;padding:11px 4px">${crest(n.home, 'xs')}<b class="mono" style="font-size:16px">${n.hp}%</b><span class="dim" style="font-size:10px">Home</span></div>
            <div class="prob-pill ${fav === 'd' ? 'fav' : ''}" style="flex-direction:column;gap:3px;padding:11px 4px"><span class="pickb d" style="width:26px;height:26px;font-size:11px">X</span><b class="mono" style="font-size:16px">${n.dp}%</b><span class="dim" style="font-size:10px">Draw</span></div>
            <div class="prob-pill ${fav === 'a' ? 'fav' : ''}" style="flex-direction:column;gap:3px;padding:11px 4px">${crest(n.away, 'xs')}<b class="mono" style="font-size:16px">${n.ap}%</b><span class="dim" style="font-size:10px">Away</span></div>
          </div>
          <div class="flex gap-8" style="margin-top:10px">
            ${miniStat('Over 1.5', n.o15 + '%')}${miniStat('Over 2.5', n.o25 + '%')}${miniStat('BTTS', n.btts + '%')}
          </div>
        </div>
      </div>

      <div class="block">
        <div class="block-hd"><h2><span class="ic">${I().bolt}</span>Confidence & Win Probability</h2></div>
        <div class="m-card pad">
          <div class="flex aic gap-16">
            <div style="width:120px;flex-shrink:0;text-align:center"><div id="${gid}"></div><div class="label-xs" style="font-size:9.5px;margin-top:2px">Model confidence</div></div>
            <div class="grow" style="min-width:0">
              <div class="label-xs" style="font-size:9.5px;margin-bottom:6px">Win-prob over time</div>
              <div id="${wid}"></div>
              <div class="flex gap-12" style="margin-top:8px;font-size:10.5px">
                <span class="flex aic gap-5"><i style="width:9px;height:9px;border-radius:3px;background:var(--blue)"></i>Home</span>
                <span class="flex aic gap-5"><i style="width:9px;height:9px;border-radius:3px;background:#6b7689"></i>Draw</span>
                <span class="flex aic gap-5"><i style="width:9px;height:9px;border-radius:3px;background:var(--green)"></i>Away</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="block">
        <div class="block-hd"><h2><span class="ic">${I().teams}</span>Tactical Profile</h2></div>
        <div class="m-card pad">
          <div class="flex aic gap-10" style="margin-bottom:6px"><span style="width:10px;height:10px;border-radius:3px;background:var(--blue)"></span><b style="font-size:13px">${n.hC.short}</b><span class="dim" style="font-size:11px">possession press</span></div>
          <div class="flex aic gap-10" style="margin-bottom:8px"><span style="width:10px;height:10px;border-radius:3px;background:var(--green)"></span><b style="font-size:13px">${n.aC.short}</b><span class="dim" style="font-size:11px">direct transition</span></div>
          <div style="max-width:280px;margin:0 auto" id="${rid}"></div>
        </div>
      </div>

      <div class="block">
        <div class="block-hd"><h2><span class="ic">${I().match}</span>Key Insights</h2><span class="badge violet">AI</span></div>
        <div class="m-card pad">
          ${insights.map(r => `<div class="xai"><span class="ic ${r.ic}">${r.ic === 'pos' ? '↑' : r.ic === 'neg' ? '↓' : r.w === 'xG' ? 'xG' : 'AI'}</span><span class="bd">${r.t}</span><span class="w" style="color:${r.ic === 'pos' ? 'var(--green-2)' : r.ic === 'neg' ? '#ff8a95' : 'var(--blue-2)'}">${r.w}</span></div>`).join('')}
        </div>
      </div>

      <div class="block">
        <div class="block-hd"><h2><span class="ic">${I().results}</span>Recent Form</h2></div>
        <div class="m-card pad">
          <div class="flex aic jcb" style="padding:6px 0"><div class="flex aic gap-9">${crest(n.home, 'xs')}<b style="font-size:13px">${n.hC.short}</b></div>${formDots(n.hForm)}</div>
          <div class="flex aic jcb" style="padding:10px 0 6px;border-top:1px solid var(--line)"><div class="flex aic gap-9">${crest(n.away, 'xs')}<b style="font-size:13px">${n.aC.short}</b></div>${formDots(n.aForm)}</div>
        </div>
      </div>

      <div class="block">
        <button class="btn btn-primary tappable" id="matchPrem" style="width:100%">${I().premium} See full Premium report</button>
      </div>`;

    el.querySelector('#matchPrem').addEventListener('click', () => window.MX.pushScreen('premium'));

    paint(() => {
      const Xc = X();
      Xc.gauge('#' + gid, n.conf, { size: 120, stroke: 12, label: n.conf >= 70 ? 'High' : 'Medium' });
      Xc.winprob('#' + wid, wp, { w: 230, h: 96 });
      Xc.radar('#' + rid, { size: 280, axes: ['Press', 'Tempo', 'Width', 'Direct', 'Poss', 'Trans'], series: [
        { color: Xc.C.blue, values: [n.hC.def, n.hC.mid, n.hC.poss, n.hC.att, n.hC.poss, n.hC.mid].map(v => Math.min(98, v)) },
        { color: Xc.C.green, values: [n.aC.def - 6, n.aC.mid + 4, n.aC.att, n.aC.att + 2, n.aC.poss - 8, n.aC.mid + 6].map(v => Math.min(98, Math.max(30, v))) },
      ] });
    });
  }
  function ord(p) { return p === 1 ? 'st' : p === 2 ? 'nd' : p === 3 ? 'rd' : 'th'; }
  function miniStat(lab, val) { return `<div style="flex:1;text-align:center;padding:10px 4px;border-radius:11px;background:var(--surface-1);border:1px solid var(--line)"><div class="mono" style="font-weight:700;font-size:16px">${val}</div><div class="dim" style="font-size:9.5px;margin-top:2px">${lab}</div></div>`; }

  /* =================== CONFIDENCE BOARD =================== */
  function render_board(el) {
    const { crest, confCol } = H();
    const D_ = D();
    const days = [['Thu', '28 May'], ['Fri', '29 May'], ['Today', '30 May'], ['Sun', '1 Jun'], ['Mon', '2 Jun']];
    const today = [
      { h: 'CLF', a: 'FNL', conf: 73, pk: 'h', t: '12:30' }, { h: 'MRD', a: 'STG', conf: 61, pk: 'h', t: '14:00' },
      { h: 'NTH', a: 'BRK', conf: 58, pk: 'a', t: '15:00' }, { h: 'RVS', a: 'KGT', conf: 74, pk: 'h', t: '17:30' },
      { h: 'HRT', a: 'ASH', conf: 64, pk: 'h', t: '19:45' }, { h: 'WLM', a: 'PRT', conf: 60, pk: 'h', t: '20:00' },
    ];

    el.innerHTML = `
      <div class="lg-head" style="padding-top:14px">
        <div class="lg-eyebrow">Today's intelligence board</div>
        <div class="lg-title">Confidence Board</div>
        <div class="lg-sub">Matches by date with AI picks, confidence-ranked.</div>
      </div>
      <div class="seg-row" id="bdDays" style="margin-top:14px">
        ${days.map((d, i) => `<button class="seg day ${d[0] === 'Today' ? 'active' : ''}" data-d="${d[0]}">${d[0]}<small>${d[1]}</small></button>`).join('')}
      </div>

      <div class="block">
        <div class="block-hd"><h2><span class="ic">${I().star}</span>Match of the Day</h2></div>
        <div class="m-card pad tappable" id="bdMotd">
          <div class="flex aic jcb" style="margin-bottom:14px">
            <div class="flex col aic gap-8" style="flex:1">${crest('RVS', 'lg')}<div style="font-weight:700;font-size:13px">Riverside FC</div></div>
            <div class="flex col aic" style="padding:0 8px"><span class="mono dim" style="font-size:12px;letter-spacing:.12em">VS</span><span class="badge blue" style="margin-top:8px">AI 74%</span></div>
            <div class="flex col aic gap-8" style="flex:1">${crest('KGT', 'lg')}<div style="font-weight:700;font-size:13px">Kingsgate</div></div>
          </div>
          <div class="flex gap-8">
            <div class="prob-pill fav" style="flex-direction:column;gap:3px;padding:11px 4px">${crest('RVS', 'xs')}<b class="mono" style="font-size:15px">47%</b><span class="dim" style="font-size:10px">Home</span></div>
            <div class="prob-pill" style="flex-direction:column;gap:3px;padding:11px 4px"><span class="pickb d" style="width:24px;height:24px;font-size:10px">X</span><b class="mono" style="font-size:15px">27%</b><span class="dim" style="font-size:10px">Draw</span></div>
            <div class="prob-pill" style="flex-direction:column;gap:3px;padding:11px 4px">${crest('KGT', 'xs')}<b class="mono" style="font-size:15px">26%</b><span class="dim" style="font-size:10px">Away</span></div>
          </div>
        </div>
      </div>

      <div class="block">
        <div class="block-hd"><h2><span class="ic">${I().grid}</span>AI Picks</h2><span class="badge">Premier League</span></div>
        <div class="m-card" id="bdList"></div>
      </div>

      <div class="block">
        <div class="list-sec" style="padding-left:0"><span class="badge gold" style="font-size:9px">CC</span> Continental Cup <span class="badge gold" style="margin-left:auto">${I().premium} Premium</span></div>
        <div class="m-card pad" style="text-align:center;background:radial-gradient(360px 200px at 50% 0%,rgba(232,194,112,.1),transparent 62%),var(--surface-1);border-color:rgba(232,194,112,.22)">
          <div style="color:var(--gold);margin-bottom:8px">${I().premium}</div>
          <div style="font-weight:700;font-size:14px">3 elite-confidence picks locked</div>
          <div class="muted" style="font-size:12px;margin-top:5px;margin-bottom:14px">Unlock the full cross-competition board with Premium.</div>
          <button class="btn btn-gold tappable" id="bdUnlock">Unlock Premium →</button>
        </div>
      </div>`;

    function renderList(rows) {
      const wrap = el.querySelector('#bdList');
      wrap.innerHTML = rows.map(r => `
        <div class="match-row tappable" data-pair="${r.h}-${r.a}">
          <div class="match-time"><div class="t">${r.t}</div></div>
          <div class="mr-teams">
            <div class="mr-team">${crest(r.h, 'xs')}<span class="nm">${D_.CLUBS[r.h].short}</span></div>
            <div class="mr-team">${crest(r.a, 'xs')}<span class="nm">${D_.CLUBS[r.a].short}</span></div>
          </div>
          <div class="mr-conf"><div class="pct" style="color:${confCol(r.conf)}">${r.conf}%</div></div>
          <div class="pickb ${r.pk}">${r.pk === 'h' ? '1' : r.pk === 'a' ? '2' : 'X'}</div>
        </div>`).join('');
      wrap.querySelectorAll('[data-pair]').forEach(node => node.addEventListener('click', () => {
        const [h, a] = node.dataset.pair.split('-');
        const up = D_.UPCOMING.find(x => x.home === h && x.away === a);
        window.MX.pushScreen('match', up || { home: h, away: a, comp: 'Premier League', hp: 46, dp: 28, ap: 26, conf: 70, pick: D_.CLUBS[h].short, time: '17:30', date: 'Today' });
      }));
    }
    function makeDay(key) {
      if (key === 'Today') return today;
      const codes = D_.list, seed = key.charCodeAt(0) + key.length;
      return [0, 1, 2, 3, 4].map(i => {
        const h = codes[(seed * 3 + i * 5) % codes.length]; let a = codes[(seed * 7 + i * 3 + 2) % codes.length];
        if (a === h) a = codes[(seed + i + 1) % codes.length];
        const conf = 54 + ((seed * 5 + i * 11) % 28);
        const pk = conf % 3 === 0 ? 'a' : conf % 5 === 0 ? 'd' : 'h';
        return { h, a, conf, pk, t: ['12:30', '15:00', '17:30', '19:45', '20:00'][i] };
      });
    }
    el.querySelectorAll('#bdDays .seg').forEach(b => b.addEventListener('click', () => {
      el.querySelectorAll('#bdDays .seg').forEach(x => x.classList.remove('active'));
      b.classList.add('active'); renderList(makeDay(b.dataset.d));
    }));
    el.querySelector('#bdMotd').addEventListener('click', () => window.MX.pushScreen('match', D_.FEATURE_MATCH));
    el.querySelector('#bdUnlock').addEventListener('click', () => window.MX.pushScreen('premium'));
    renderList(today);
  }

  /* =================== PREMIUM =================== */
  function render_premium(el) {
    const feats = [
      ['Tactical AI reports', 'Full pressing maps, attack zones & momentum'],
      ['Fatigue & lineup impact', 'Squad-load modelling and projected XIs'],
      ['Hidden-trend detection', 'Cross-season patterns the model surfaces'],
      ['Cross-competition board', 'Every league, all confidence picks unlocked'],
      ['Priority live intel', 'Real-time alerts the moment edges appear'],
    ];
    el.innerHTML = `
      <div class="block" style="padding-top:14px">
        <div class="prem-hero">
          <span class="badge gold" style="margin-bottom:12px">${I().premium} Premium Intelligence</span>
          <div style="font-family:var(--font-display);font-weight:800;font-size:26px;letter-spacing:-.03em;line-height:1.06">Unlock the elite analytics layer</div>
          <div class="muted" style="font-size:13px;margin-top:10px;line-height:1.5">The tools the pros use — tactical AI reports, fatigue analysis, lineup-impact modelling and hidden-trend detection.</div>
          <div class="flex gap-16" style="margin-top:18px">
            <div><div class="mono" style="font-size:22px;font-weight:800;color:var(--gold)">73%</div><div class="dim" style="font-size:11px">model accuracy</div></div>
            <div><div class="mono" style="font-size:22px;font-weight:800">120+</div><div class="dim" style="font-size:11px">competitions</div></div>
            <div><div class="mono" style="font-size:22px;font-weight:800;color:var(--green)">2.4M</div><div class="dim" style="font-size:11px">matches modelled</div></div>
          </div>
        </div>
      </div>

      <div class="block">
        <div class="block-hd"><h2>Choose your plan</h2></div>
        <div class="flex col gap-12">
          <div class="plan-card featured tappable" id="planAnnual">
            <div class="flex aic jcb"><div class="flex aic gap-8"><b style="font-size:15px">Annual</b><span class="badge gold">Save 34%</span></div><div class="flex aic gap-6" style="color:var(--gold)">${I().star}</div></div>
            <div class="flex aic gap-6" style="margin:10px 0 4px"><span class="mono" style="font-size:28px;font-weight:800">£79</span><span class="muted" style="font-size:12px">/ year</span></div>
            <div class="dim" style="font-size:11.5px">£6.58 / month · billed annually</div>
            <button class="btn btn-gold" style="width:100%;margin-top:13px">Start Annual</button>
          </div>
          <div class="plan-card tappable" id="planMonthly">
            <div class="flex aic jcb"><b style="font-size:15px">Monthly</b><span class="badge">Flexible</span></div>
            <div class="flex aic gap-6" style="margin:10px 0 4px"><span class="mono" style="font-size:28px;font-weight:800">£9.99</span><span class="muted" style="font-size:12px">/ month</span></div>
            <div class="dim" style="font-size:11.5px">Cancel anytime</div>
            <button class="btn" style="width:100%;margin-top:13px;background:var(--surface-3);border-color:var(--line-2)">Start Monthly</button>
          </div>
        </div>
      </div>

      <div class="block">
        <div class="block-hd"><h2>Everything in Premium</h2></div>
        <div class="m-card pad">
          ${feats.map(f => `<div class="prem-feat"><span class="pf-ic">✓</span><div><div style="font-weight:600;font-size:13.5px">${f[0]}</div><div class="muted" style="font-size:11.5px;margin-top:2px">${f[1]}</div></div></div>`).join('')}
        </div>
      </div>

      <div class="block">
        <div class="center muted" style="font-size:11px;line-height:1.5;font-family:var(--font-mono)">Cancel anytime · For analytical use only<br>Not a betting service</div>
      </div>`;

    el.querySelector('#planAnnual').addEventListener('click', () => window.MXToast('Annual plan — checkout (demo)'));
    el.querySelector('#planMonthly').addEventListener('click', () => window.MXToast('Monthly plan — checkout (demo)'));
  }

  window.MXScreens = Object.assign(window.MXScreens || {}, { render_match, render_board, render_premium });
})();
