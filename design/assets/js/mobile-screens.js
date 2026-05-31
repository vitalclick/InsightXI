/* ============================================================
   InsightXI Mobile — primary screens
   Home · Live · Predictions · Fixtures · More
   ============================================================ */
(function () {
  const D = () => window.IXData;
  const X = () => window.IXChart;
  const I = () => window.MX.I;
  let uid = 0; const nid = p => (p || 'c') + (++uid);
  const confCol = c => c >= 70 ? 'var(--green-2)' : c >= 60 ? 'var(--blue-2)' : 'var(--gold)';

  function crest(code, size) { return D().crest(code, size); }
  function tribar(hp, dp, ap) {
    return `<div class="tribar"><i style="width:${hp}%;background:var(--blue)"></i><i style="width:${dp}%;background:#54607a"></i><i style="width:${ap}%;background:var(--green)"></i></div>
      <div class="tri-legend"><span>H ${hp}%</span><span>D ${dp}%</span><span>A ${ap}%</span></div>`;
  }
  function formDots(arr) { return `<div class="form-row">${arr.map(f => `<span class="fdot ${f.toLowerCase()}">${f}</span>`).join('')}</div>`; }

  // transient toast
  function toast(msg) {
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:absolute;left:50%;bottom:calc(var(--m-nav-h) + var(--sa-bot) + 18px);transform:translateX(-50%) translateY(10px);background:var(--surface-4);color:var(--text);border:1px solid var(--line-2);padding:11px 18px;border-radius:13px;font-size:13px;font-weight:600;z-index:90;box-shadow:var(--shadow-2);opacity:0;transition:.22s;white-space:nowrap;max-width:88%;text-align:center';
    document.querySelector('.app').appendChild(t);
    requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)'; });
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(10px)'; setTimeout(() => t.remove(), 250); }, 1700);
  }
  window.MXToast = toast;

  // run chart calls after DOM paint
  function paint(fn) { requestAnimationFrame(() => requestAnimationFrame(fn)); }

  /* =================== HOME =================== */
  function render_home(el) {
    const D_ = D();
    const top = D_.UPCOMING.slice(0, 4);
    const ranked = [...D_.UPCOMING].sort((a, b) => b.conf - a.conf).slice(0, 5);
    const insights = [
      { t: 'Riverside pressing edge', d: 'High press recovers the ball <b>14.2× per 90</b> — top of the league and 38% above Kingsgate\'s build-up tolerance.', tag: 'Tactical', cls: 'blue' },
      { t: 'Ashford xG overperformance', d: 'Scoring <b>1.4 goals above xG</b> across 6 games — finishing regression likely.', tag: 'Trend', cls: 'amber' },
      { t: 'Hartwell set-piece threat', d: '<b>41%</b> of goals from set pieces this season — opponents concede 0.6 xG from corners.', tag: 'Pattern', cls: 'violet' },
      { t: 'Northfield away fragility', d: 'Conceding <b>1.9 xGA</b> on the road vs 1.0 at home — breaks down in transition.', tag: 'Risk', cls: 'red' },
    ];
    const kpis = [
      { lab: 'Matches Analyzed', val: '24', delta: '▲ 12%', dc: 'var(--green)', sp: [12, 16, 14, 20, 18, 24, 22, 28], col: 'blue' },
      { lab: 'Model Accuracy', val: '73%', delta: '▲ 2.1pts', dc: 'var(--green)', sp: [68, 70, 69, 72, 71, 73, 72, 73], col: 'green' },
      { lab: 'Avg Confidence', val: '64%', delta: '▲ Strong', dc: 'var(--blue-2)', sp: [55, 58, 60, 59, 62, 64, 63, 64], col: 'cyan' },
      { lab: 'Live Now', val: '3', delta: '3 high-intensity', dc: 'var(--muted)', sp: [1, 2, 1, 3, 2, 3, 2, 3], col: 'red' },
    ];
    const kpiIds = kpis.map(() => nid('sp'));

    el.innerHTML = `
      <div class="lg-head">
        <div class="lg-eyebrow">Intelligence Center</div>
        <div class="lg-title">Good evening,<br>Alex</div>
        <div class="lg-sub">Sat 31 May · 24 matches tracked across 6 competitions today.</div>
      </div>

      <div class="carousel" style="margin-top:14px">
        ${kpis.map((k, i) => `<div class="kpi-tile"><div class="lab">${k.lab}</div><div class="val">${k.val}</div><div class="delta" style="color:${k.dc}">${k.delta}</div><div class="spark-slot" id="${kpiIds[i]}"></div></div>`).join('')}
      </div>

      <div class="block">
        <div class="block-hd"><h2><span class="ic">${I().star}</span>Match of the Day</h2><span class="badge blue">AI 74%</span></div>
        <div class="m-card pad tappable" id="homeMotd">
          <div class="flex aic jcb" style="margin-bottom:14px">
            <div class="flex col aic gap-8" style="flex:1">${crest('RVS', 'lg')}<div style="font-weight:700;font-size:13px">Riverside</div></div>
            <div class="flex col aic" style="padding:0 8px"><span class="mono dim" style="font-size:12px;letter-spacing:.12em">VS</span><span class="badge" style="margin-top:8px;font-size:10px">17:30</span></div>
            <div class="flex col aic gap-8" style="flex:1">${crest('KGT', 'lg')}<div style="font-weight:700;font-size:13px">Kingsgate</div></div>
          </div>
          ${tribar(47, 27, 26)}
          <div class="flex aic jcb" style="margin-top:14px;padding-top:13px;border-top:1px solid var(--line)">
            <div class="flex aic gap-8"><div class="profile-av" style="width:28px;height:28px;border-radius:9px;font-size:11px">IX</div><div style="font-size:11.5px" class="muted">Model v4.2 · Premier League</div></div>
            <span class="flex aic gap-4" style="color:var(--blue-2);font-size:12px;font-weight:700">Intel ${I().chev}</span>
          </div>
        </div>
      </div>

      <div class="block">
        <div class="block-hd"><h2><span class="ic">${I().match}</span>Today's Top Matches</h2><span class="block-link" data-go="fixtures">All ${I().chev}</span></div>
        <div class="m-card" id="homeTop">
          ${top.map(m => `
            <div class="match-row tappable" data-match="${m.id}">
              <div class="match-time"><div class="t">${m.time}</div><div class="d">${m.date}</div></div>
              <div class="mr-teams">
                <div class="mr-team">${crest(m.home, 'xs')}<span class="nm">${D_.CLUBS[m.home].short}</span></div>
                <div class="mr-team">${crest(m.away, 'xs')}<span class="nm">${D_.CLUBS[m.away].short}</span></div>
              </div>
              <div class="grow" style="max-width:120px">${tribar(m.hp, m.dp, m.ap)}</div>
              <div class="mr-conf"><div class="pct" style="color:${confCol(m.conf)}">${m.conf}%</div><div class="cl">${m.pick}</div></div>
            </div>`).join('')}
        </div>
      </div>

      <div class="block">
        <div class="block-hd"><h2><span class="ic">${I().bolt}</span>AI Insights</h2><span class="badge violet">Auto</span></div>
      </div>
      <div class="carousel">
        ${insights.map(c => `<div class="insight-card"><div class="flex aic jcb"><span class="badge ${c.cls}">${c.tag}</span><span class="dim" style="font-size:10.5px;font-family:var(--font-mono)">98%</span></div><div class="ttl">${c.t}</div><div class="txt">${c.d}</div></div>`).join('')}
      </div>

      <div class="block">
        <div class="block-hd"><h2><span class="ic">${I().target}</span>Confidence Rankings</h2><span class="badge">Today</span></div>
        <div class="m-card pad">
          ${ranked.map((m, i) => `
            <div class="flex aic gap-12 tappable" data-match="${m.id}" style="padding:9px 0;${i < ranked.length - 1 ? 'border-bottom:1px solid var(--line)' : ''}">
              <div class="mono dim" style="width:14px;font-size:13px">${i + 1}</div>
              <div class="grow" style="font-size:13px;font-weight:600">${D_.CLUBS[m.home].short} <span class="dim" style="font-weight:400">v</span> ${D_.CLUBS[m.away].short}</div>
              <div class="badge" style="font-size:10px">${m.pick}</div>
              <div style="width:46px"><div class="meter ${m.conf >= 70 ? 'green' : ''}" style="height:5px"><i style="width:0" data-w="${m.conf}"></i></div></div>
              <div class="mono" style="width:30px;text-align:right;font-weight:700;font-size:13px;color:${confCol(m.conf)}">${m.conf}</div>
            </div>`).join('')}
        </div>
      </div>

      <div class="block">
        <div class="block-hd"><h2><span class="ic" style="color:var(--red)">${I().live}</span>Live Now</h2><span class="block-link" data-go="live">Watch ${I().chev}</span></div>
        <div class="flex col gap-12" id="homeLive"></div>
      </div>
    `;

    // wiring
    el.querySelector('#homeMotd').addEventListener('click', () => window.MX.pushScreen('match', D_.FEATURE_MATCH));
    el.querySelectorAll('[data-match]').forEach(r => r.addEventListener('click', () => {
      const m = D_.UPCOMING.find(x => x.id === r.dataset.match) || D_.FEATURE_MATCH;
      window.MX.pushScreen('match', m);
    }));
    el.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => window.MX.showTab(b.dataset.go)));

    // live mini cards
    const lv = el.querySelector('#homeLive');
    D_.NOW_LIVE.slice(0, 2).forEach(m => {
      const momCol = m.momentum === 'home' ? 'var(--blue)' : 'var(--green)';
      const c = document.createElement('div');
      c.className = 'live-card tappable';
      c.innerHTML = `
        <div class="flex aic jcb" style="margin-bottom:11px"><span class="live-pill"><span class="pulse"></span>${m.min}'</span><span class="badge blue">AI ${m.conf}%</span></div>
        <div class="flex aic jcb">
          <div class="flex aic gap-8" style="font-weight:700;font-size:14px">${crest(m.home, 'xs')}${m.home}</div>
          <div class="live-score">${m.hs} – ${m.as}</div>
          <div class="flex aic gap-8" style="font-weight:700;font-size:14px">${m.away}${crest(m.away, 'xs')}</div>
        </div>
        <div class="momentum-bar" style="margin-top:11px"><i style="width:${m.momentum === 'home' ? 64 : 38}%;background:${momCol}"></i></div>
        <div class="flex jcb" style="margin-top:6px;font-size:10.5px;color:var(--muted)"><span>xG ${m.hxg.toFixed(2)}</span><span style="color:${momCol}">▲ ${m.momentum}</span><span>xG ${m.axg.toFixed(2)}</span></div>`;
      c.addEventListener('click', () => window.MX.pushScreen('match', m));
      lv.appendChild(c);
    });

    paint(() => {
      const Xc = X();
      kpis.forEach((k, i) => Xc.spark('#' + kpiIds[i], k.sp, { w: 76, h: 30, area: true, color: Xc.C[k.col] }));
      el.querySelectorAll('[data-w]').forEach(i => i.style.width = i.dataset.w + '%');
    });
  }

  /* =================== LIVE =================== */
  function render_live(el) {
    const D_ = D();
    el.innerHTML = `
      <div class="lg-head">
        <div class="lg-eyebrow">Real-time intelligence</div>
        <div class="lg-title">Live Center</div>
        <div class="lg-sub">${D_.NOW_LIVE.length} matches live now · momentum, xG race and win probability updating live.</div>
      </div>
      <div class="block"><div class="flex col gap-14" id="liveList"></div></div>
      <div class="block">
        <div class="block-hd"><h2><span class="ic">${I().fixtures}</span>Starting Soon</h2></div>
        <div class="m-card" id="liveSoon"></div>
      </div>`;

    const list = el.querySelector('#liveList');
    const lineIds = [];
    D_.NOW_LIVE.forEach(m => {
      const momCol = m.momentum === 'home' ? 'var(--blue)' : 'var(--green)';
      const lid = nid('xg');
      lineIds.push({ id: lid, m });
      const c = document.createElement('div');
      c.className = 'm-card pad tappable';
      c.innerHTML = `
        <div class="flex aic jcb" style="margin-bottom:13px"><span class="live-pill"><span class="pulse"></span>LIVE ${m.min}'</span><span class="dim" style="font-size:11px">${m.comp}</span></div>
        <div class="flex aic jcb" style="margin-bottom:6px">
          <div class="flex aic gap-9" style="flex:1"><div>${crest(m.home, 'sm')}</div><div style="font-weight:700;font-size:14.5px">${D_.CLUBS[m.home].short}</div></div>
          <div class="live-score">${m.hs} – ${m.as}</div>
          <div class="flex aic gap-9" style="flex:1;justify-content:flex-end"><div style="font-weight:700;font-size:14.5px">${D_.CLUBS[m.away].short}</div><div>${crest(m.away, 'sm')}</div></div>
        </div>
        <div class="label-xs" style="margin:10px 0 4px;font-size:10px">xG race</div>
        <div id="${lid}"></div>
        <div class="momentum-bar" style="margin-top:10px"><i style="width:${m.momentum === 'home' ? 64 : 40}%;background:${momCol}"></i></div>
        <div class="flex jcb" style="margin-top:6px;font-size:11px;color:var(--muted)"><span>xG ${m.hxg.toFixed(2)}</span><span style="color:${momCol}">${m.momentum} momentum</span><span>xG ${m.axg.toFixed(2)}</span></div>
        <div class="flex aic gap-8" style="margin-top:12px;padding:10px;border-radius:11px;background:rgba(46,125,255,.06);border:1px solid rgba(46,125,255,.16)">
          <span class="badge blue" style="flex-shrink:0">AI ${m.conf}%</span>
          <span style="font-size:11.5px;color:var(--text-2)">Model favours <b style="color:#fff">${m.pick === 'Draw' ? 'the draw' : m.pick}</b> · tap for full live intel</span>
        </div>`;
      c.addEventListener('click', () => window.MX.pushScreen('match', m));
      list.appendChild(c);
    });

    // starting soon = first 3 upcoming
    const soon = el.querySelector('#liveSoon');
    D_.UPCOMING.slice(0, 3).forEach(m => {
      const r = document.createElement('div');
      r.className = 'match-row tappable';
      r.innerHTML = `
        <div class="match-time"><div class="t">${m.time}</div><div class="d">${m.date}</div></div>
        <div class="mr-teams"><div class="mr-team">${crest(m.home, 'xs')}<span class="nm">${D_.CLUBS[m.home].short}</span></div><div class="mr-team">${crest(m.away, 'xs')}<span class="nm">${D_.CLUBS[m.away].short}</span></div></div>
        <div class="mr-conf"><div class="pct" style="color:${confCol(m.conf)}">${m.conf}%</div><div class="cl">${m.pick}</div></div>
        <span class="dim" style="margin-left:2px">${I().chev}</span>`;
      r.addEventListener('click', () => window.MX.pushScreen('match', m));
      soon.appendChild(r);
    });

    paint(() => {
      const Xc = X();
      lineIds.forEach(({ id, m }) => {
        const r = D_.xgRace(m.home.charCodeAt(0), m.min);
        Xc.line('#' + id, { w: 340, h: 58, pad: { t: 6, r: 6, b: 6, l: 6 }, gy: 2, series: [
          { color: Xc.C.blue, area: true, data: r.a.map(p => ({ x: p.m, y: p.v })) },
          { color: Xc.C.green, data: r.b.map(p => ({ x: p.m, y: p.v })) },
        ], xMax: r.a[r.a.length - 1].m, yMax: Math.max(...r.a.map(p => p.v), ...r.b.map(p => p.v)) * 1.12 });
      });
    });
  }

  /* =================== PREDICTIONS =================== */
  function render_predictions(el) {
    const D_ = D();
    const markets = [['all', 'All markets'], ['1x2', 'Result'], ['ou', 'Over / Under'], ['btts', 'BTTS']];
    const reasons = [
      { ic: 'pos', t: 'Home xG differential <b>+1.22</b> over last 6 — league best.', w: '+18', wc: 'var(--green-2)' },
      { ic: 'pos', t: 'Kingsgate concede <b>1.6 xGA</b> away vs top-6 sides.', w: '+11', wc: 'var(--green-2)' },
      { ic: 'neu', t: 'Six sub-models agree on a home win (<b>5 of 6</b>).', w: 'AI', wc: 'var(--blue-2)' },
    ];
    const picks = [...D_.UPCOMING].sort((a, b) => b.conf - a.conf);

    el.innerHTML = `
      <div class="lg-head">
        <div class="lg-eyebrow">Highest-conviction picks</div>
        <div class="lg-title">Sure Win</div>
        <div class="lg-sub">The model's strongest reads of the day — each fully explained, never a number without a reason.</div>
      </div>

      <div class="seg-row" id="predMarkets" style="margin-top:14px">
        ${markets.map((m, i) => `<button class="seg ${i === 0 ? 'active' : ''}" data-m="${m[0]}">${m[1]}</button>`).join('')}
      </div>

      <div class="block">
        <div class="m-card pad" style="border-color:rgba(39,224,138,.24);background:radial-gradient(420px 240px at 12% 0%,rgba(39,224,138,.12),transparent 62%),linear-gradient(180deg,var(--surface-1),var(--card-grad-2))">
          <div class="flex aic gap-8" style="margin-bottom:13px"><span class="badge green">★ Banker of the Day</span><span class="badge blue">Match result</span></div>
          <div class="flex aic gap-14">
            <div class="grow">
              <div class="flex aic gap-11" style="margin-bottom:12px">${crest('RVS', 'md')}<div><div style="font-weight:700;font-size:15px">Riverside FC</div><div class="dim" style="font-size:11.5px">v Kingsgate · 17:30</div></div></div>
              <div class="label-xs" style="font-size:10px;margin-bottom:4px">Model pick</div>
              <div style="font-size:17px;font-weight:800;letter-spacing:-.02em;line-height:1.15">Riverside to win <span class="dim" style="font-weight:600;font-size:13px">· exp 2–1</span></div>
            </div>
            <div style="width:104px;flex-shrink:0;text-align:center"><div id="bankerGauge"></div><div class="badge green" style="margin-top:2px">Elite</div></div>
          </div>
          <div style="margin-top:14px;padding-top:6px;border-top:1px solid var(--line)">
            ${reasons.map(r => `<div class="xai"><span class="ic ${r.ic}">${r.ic === 'pos' ? '↑' : 'AI'}</span><span class="bd">${r.t}</span><span class="w" style="color:${r.wc}">${r.w}</span></div>`).join('')}
          </div>
          <button class="btn btn-green tappable" id="bankerGo" style="width:100%;margin-top:14px">Full match intel →</button>
        </div>
      </div>

      <div class="list-sec">${I().flame} High-Confidence Board <span class="badge" style="margin-left:auto">${picks.length} picks</span></div>
      <div class="block" style="padding-top:4px"><div class="flex col gap-12" id="predGrid"></div></div>

      <div class="block">
        <div class="m-card pad flex aic gap-11" style="background:var(--surface-1)">
          <span style="color:var(--blue-2);flex-shrink:0">${I().info}</span>
          <span class="muted" style="font-size:11.5px;line-height:1.45">Predictions reflect <b style="color:var(--text-2)">model confidence</b>, not guaranteed outcomes. For analytical use only — not a betting service.</span>
        </div>
      </div>`;

    const grid = el.querySelector('#predGrid');
    const ringIds = [];
    picks.forEach(m => {
      const rid = nid('pr');
      ringIds.push({ id: rid, m });
      const c = document.createElement('div');
      c.className = 'm-card pad tappable';
      c.innerHTML = `
        <div class="flex aic gap-12">
          <div style="width:62px;flex-shrink:0" id="${rid}"></div>
          <div class="grow" style="min-width:0">
            <div class="flex aic gap-7" style="font-weight:700;font-size:14px;margin-bottom:5px">${crest(m.home, 'xs')}${D_.CLUBS[m.home].short} <span class="dim" style="font-weight:400;font-size:12px">v</span> ${D_.CLUBS[m.away].short}${crest(m.away, 'xs')}</div>
            <div class="dim" style="font-size:11px">${m.comp} · ${m.date} ${m.time}</div>
            <div class="flex aic gap-7" style="margin-top:9px"><span class="badge blue">Pick · ${m.pick}</span><span class="badge ${m.conf >= 70 ? 'green' : ''}" style="font-size:10px">${m.conf >= 70 ? 'High' : 'Medium'} conf</span></div>
          </div>
          <span class="dim" style="flex-shrink:0">${I().chev}</span>
        </div>`;
      c.addEventListener('click', () => window.MX.pushScreen('match', m));
      grid.appendChild(c);
    });

    // market filter (visual)
    el.querySelectorAll('#predMarkets .seg').forEach(b => b.addEventListener('click', () => {
      el.querySelectorAll('#predMarkets .seg').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
    }));
    el.querySelector('#bankerGo').addEventListener('click', () => window.MX.pushScreen('match', D_.FEATURE_MATCH));

    paint(() => {
      const Xc = X();
      Xc.gauge('#bankerGauge', 74, { size: 104, stroke: 11, label: 'confidence' });
      ringIds.forEach(({ id, m }) => Xc.ring('#' + id, m.conf, { size: 62, stroke: 7, color: m.conf >= 70 ? Xc.C.green : m.conf >= 60 ? Xc.C.blue : Xc.C.gold, glow: false }));
    });
  }

  /* =================== FIXTURES =================== */
  function render_fixtures(el) {
    const D_ = D();
    const days = [['Today', 'Today'], ['Tomorrow', 'Tomorrow'], ['Sat', 'Sat'], ['Sun', '1 Jun'], ['Mon', '2 Jun']];
    el.innerHTML = `
      <div class="lg-head">
        <div class="lg-eyebrow">Schedule & model reads</div>
        <div class="lg-title">Fixtures</div>
        <div class="lg-sub">Every fixture with win probability, confidence and the model's pick.</div>
      </div>
      <div class="seg-row" id="fxDays" style="margin-top:14px">
        ${days.map((d, i) => `<button class="seg day ${i === 0 ? 'active' : ''}" data-d="${d[0]}">${d[0]}<small>${d[1]}</small></button>`).join('')}
      </div>
      <div id="fxBody"></div>`;

    function group(dayKey) {
      const fromData = D_.UPCOMING.filter(m => (dayKey === 'Today' && m.date === 'Today') || (dayKey === 'Tomorrow' && m.date === 'Tomorrow') || (dayKey === 'Sat' && m.date === 'Sat'));
      let list = fromData;
      if (!list.length) {
        // synthesize for Sun/Mon from clubs deterministically
        const codes = D_.list; const seed = dayKey.charCodeAt(0);
        list = [0, 1, 2, 3].map(i => {
          const h = codes[(seed + i * 3) % codes.length], a = codes[(seed + i * 5 + 4) % codes.length];
          const hh = h === a ? codes[(seed + i + 7) % codes.length] : h;
          const conf = 52 + ((seed * 7 + i * 13) % 26);
          const hp = 30 + (i * 6) % 22, ap = 26 + (i * 4) % 16, dp = 100 - hp - ap;
          return { id: 'syn' + dayKey + i, home: hh, away: a, time: ['12:30', '15:00', '17:30', '20:00'][i], date: dayKey, comp: 'Premier League', conf, pick: hp > ap ? D_.CLUBS[hh].short : D_.CLUBS[a].short, hp, dp, ap };
        });
      }
      const body = el.querySelector('#fxBody');
      body.innerHTML = `<div class="list-sec"><span class="badge blue" style="font-size:9px">PL</span> Premier League</div>
        <div class="block" style="padding-top:2px"><div class="m-card" id="fxList"></div></div>`;
      const wrap = body.querySelector('#fxList');
      list.forEach(m => {
        const r = document.createElement('div');
        r.className = 'match-row tappable';
        r.innerHTML = `
          <div class="match-time"><div class="t">${m.time}</div></div>
          <div class="mr-teams">
            <div class="mr-team">${crest(m.home, 'xs')}<span class="nm">${D_.CLUBS[m.home].short}</span></div>
            <div class="mr-team">${crest(m.away, 'xs')}<span class="nm">${D_.CLUBS[m.away].short}</span></div>
          </div>
          <div class="grow" style="max-width:104px">${tribar(m.hp, m.dp, m.ap)}</div>
          <div class="pickb ${m.hp >= m.dp && m.hp >= m.ap ? 'h' : m.ap >= m.dp ? 'a' : 'd'}">${m.hp >= m.dp && m.hp >= m.ap ? '1' : m.ap >= m.dp ? '2' : 'X'}</div>`;
        r.addEventListener('click', () => window.MX.pushScreen('match', m));
        wrap.appendChild(r);
      });
    }

    el.querySelectorAll('#fxDays .seg').forEach(b => b.addEventListener('click', () => {
      el.querySelectorAll('#fxDays .seg').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      group(b.dataset.d);
    }));
    group('Today');
  }

  /* =================== MORE =================== */
  function render_more(el) {
    const grid = [
      ['Confidence Board', 'AI picks by day', 'grid', () => window.MX.pushScreen('board')],
      ['Match Intel', 'Deep tactical read', 'match', () => window.MX.pushScreen('match', D().FEATURE_MATCH)],
      ['Predictions', 'Sure-win board', 'target', () => window.MX.showTab('predictions')],
      ['Premium', 'Elite analytics', 'premium', () => window.MX.pushScreen('premium')],
    ];
    const explore = [
      ['Results', 'results'], ['Leagues', 'leagues'], ['Teams', 'teams'], ['Players', 'players'], ['Historical', 'history'], ['Blog', 'doc'],
    ];

    el.innerHTML = `
      <div class="lg-head" style="padding-bottom:0"><div class="lg-title">More</div></div>

      <div class="block" style="padding-top:14px">
        <div class="profile-hd">
          <div class="profile-av">AM</div>
          <div class="grow"><div style="font-weight:700;font-size:17px">Alex Mercer</div><div class="muted" style="font-size:12.5px">alex@insightxi.app</div></div>
          <span class="badge gold">Free plan</span>
        </div>
      </div>

      <div class="block">
        <div class="prem-hero tappable" id="moreUpgrade">
          <div class="flex aic gap-8" style="margin-bottom:8px"><span class="badge gold">${I().premium} Premium</span></div>
          <div style="font-family:var(--font-display);font-weight:800;font-size:18px;letter-spacing:-.02em;line-height:1.15">Unlock the elite analytics layer</div>
          <div class="muted" style="font-size:12.5px;margin-top:6px">Tactical AI reports, fatigue modelling & hidden-trend detection.</div>
          <button class="btn btn-gold" style="margin-top:13px">Upgrade Premium →</button>
        </div>
      </div>

      <div class="block"><div class="block-hd"><h2>Intelligence</h2></div>
        <div class="menu-grid" id="moreGrid">
          ${grid.map(g => `<div class="menu-item tappable" data-g="${g[0]}"><div class="mi-ic">${I()[g[2]]}</div><div><div class="mi-t">${g[0]}</div><div class="mi-d">${g[1]}</div></div></div>`).join('')}
        </div>
      </div>

      <div class="block"><div class="block-hd"><h2>Explore</h2></div>
        <div class="menu-list">
          ${explore.map(e => `<div class="menu-row tappable" data-x="${e[0]}"><div class="mr-ic">${I()[e[1]]}</div><div style="font-weight:600;font-size:14px">${e[0]}</div><span class="chev">${I().chev}</span></div>`).join('')}
        </div>
      </div>

      <div class="block"><div class="block-hd"><h2>Settings</h2></div>
        <div class="menu-list">
          <div class="menu-row" id="rowTheme"><div class="mr-ic">${I().moon}</div><div style="font-weight:600;font-size:14px">Dark appearance</div><div class="switch" data-theme-switch><i></i></div></div>
          <div class="menu-row"><div class="mr-ic">${I().bell}</div><div style="font-weight:600;font-size:14px">Match alerts</div><div class="switch on" id="swAlerts"><i></i></div></div>
          <div class="menu-row tappable" data-x="Install"><div class="mr-ic">${I().refresh}</div><div style="font-weight:600;font-size:14px">Add to Home Screen</div><span class="chev">${I().chev}</span></div>
          <div class="menu-row"><div class="mr-ic">${I().info}</div><div style="font-weight:600;font-size:14px">Version</div><span class="mono dim" style="margin-left:auto;font-size:12px">4.2.0</span></div>
        </div>
      </div>

      <div class="block">
        <div class="menu-list"><div class="menu-row tappable" id="signout" style="border-radius:var(--r-md)"><div class="mr-ic" style="color:#ff8a95">${I().logout}</div><div style="font-weight:600;font-size:14px;color:#ff8a95">Sign out</div></div></div>
        <div class="center muted" style="font-size:11px;margin-top:16px;font-family:var(--font-mono)">InsightXI · True Football Intelligence</div>
      </div>`;

    el.querySelectorAll('#moreGrid [data-g]').forEach((node, i) => node.addEventListener('click', grid[i][3]));
    el.querySelector('#moreUpgrade').addEventListener('click', () => window.MX.pushScreen('premium'));
    el.querySelectorAll('[data-x]').forEach(n => n.addEventListener('click', () => {
      const k = n.dataset.x;
      if (k === 'Install') toast('Use your browser menu → Add to Home Screen');
      else toast(k + ' · full view on web');
    }));
    el.querySelector('#rowTheme').addEventListener('click', e => { if (!e.target.closest('.switch')) window.MX.toggleTheme(); });
    el.querySelector('[data-theme-switch]').addEventListener('click', window.MX.toggleTheme);
    el.querySelector('#swAlerts').addEventListener('click', function () { this.classList.toggle('on'); window.MX.haptic(8); });
    el.querySelector('#signout').addEventListener('click', () => toast('Signed out (demo)'));
  }

  window.MXScreens = Object.assign(window.MXScreens || {}, {
    render_home, render_live, render_predictions, render_fixtures, render_more,
    _helpers: { crest, tribar, formDots, confCol, nid, paint },
  });
})();
