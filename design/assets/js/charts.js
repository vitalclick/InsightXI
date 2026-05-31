/* ============================================================
   InsightXI — custom SVG chart library (no dependencies)
   IXChart.<type>(target, data, opts) -> renders animated SVG
   ============================================================ */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const C = {
    blue: '#2e7dff', blue2: '#5a9bff', green: '#27e08a', green2: '#54f0a6',
    cyan: '#19d3e3', gold: '#e8c270', red: '#ff5b6b', amber: '#ffb13d',
    violet: '#9b7bff', grid: 'rgba(255,255,255,.07)', line: 'rgba(255,255,255,.12)',
    text: '#b9c4d8', dim: '#5b6680', surf: '#18223a', fg: '#ffffff', pitch: 'rgba(39,224,138,.03)',
  };
  // Pull theme-dependent structural colors from CSS vars so charts adapt to light/dark.
  function refreshC() {
    const cs = getComputedStyle(document.documentElement);
    const g = k => (cs.getPropertyValue(k) || '').trim();
    if (g('--chart-grid')) C.grid = g('--chart-grid');
    if (g('--chart-line')) C.line = g('--chart-line');
    if (g('--chart-text')) C.text = g('--chart-text');
    if (g('--chart-dim')) C.dim = g('--chart-dim');
    if (g('--chart-surf')) C.surf = g('--chart-surf');
    if (g('--chart-fg')) C.fg = g('--chart-fg');
    if (g('--pitch-fill')) C.pitch = g('--pitch-fill');
  }
  function el(t, a) { const e = document.createElementNS(NS, t); if (a) for (const k in a) e.setAttribute(k, a[k]); return e; }
  function resolve(target) { return typeof target === 'string' ? document.querySelector(target) : target; }
  function uid() { return 'ix' + Math.random().toString(36).slice(2, 8); }
  function poly(cx, cy, r, n, a0) { const p = []; for (let i = 0; i < n; i++) { const a = a0 + (Math.PI * 2 * i) / n; p.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return p; }
  function path(pts, close) { return pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(2) + ' ' + p[1].toFixed(2)).join(' ') + (close ? ' Z' : ''); }
  function smooth(pts) {
    if (pts.length < 2) return path(pts);
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i ? i - 1 : 0], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
    }
    return d;
  }
  function svg(w, h) { const s = el('svg', { viewBox: `0 0 ${w} ${h}`, width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid meet' }); s.style.display = 'block'; s.style.overflow = 'visible'; return s; }
  function mount(target, s) { const t = resolve(target); if (!t) return; t.innerHTML = ''; t.appendChild(s); return s; }

  const IXChart = {};

  /* ---- Probability ring / radial gauge ---- */
  IXChart.ring = function (target, value, opts = {}) {
    const size = opts.size || 120, sw = opts.stroke || 11, r = (size - sw) / 2 - 2, cx = size / 2, cy = size / 2;
    const col = opts.color || C.blue, glow = opts.glow !== false;
    const s = svg(size, size);
    const id = uid();
    if (glow) { const f = el('filter', { id, x: '-50%', y: '-50%', width: '200%', height: '200%' }); f.appendChild(el('feGaussianBlur', { stdDeviation: '3', result: 'b' })); const m = el('feMerge'); m.appendChild(el('feMergeNode', { in: 'b' })); m.appendChild(el('feMergeNode', { in: 'SourceGraphic' })); f.appendChild(m); s.appendChild(f); }
    s.appendChild(el('circle', { cx, cy, r, fill: 'none', stroke: C.surf, 'stroke-width': sw }));
    const circ = 2 * Math.PI * r;
    const arc = el('circle', { cx, cy, r, fill: 'none', stroke: col, 'stroke-width': sw, 'stroke-linecap': 'round', transform: `rotate(-90 ${cx} ${cy})`, 'stroke-dasharray': circ, 'stroke-dashoffset': circ });
    if (glow) arc.setAttribute('filter', `url(#${id})`);
    s.appendChild(arc);
    const t1 = el('text', { x: cx, y: cy + (opts.label ? -2 : 6), 'text-anchor': 'middle', fill: opts.textColor || C.fg, 'font-family': 'JetBrains Mono, monospace', 'font-size': opts.fs || size * 0.26, 'font-weight': 700 });
    t1.textContent = '0' + (opts.suffix || '%');
    s.appendChild(t1);
    if (opts.label) { const t2 = el('text', { x: cx, y: cy + size * 0.16, 'text-anchor': 'middle', fill: C.dim, 'font-family': 'Inter, sans-serif', 'font-size': size * 0.1, 'font-weight': 600 }); t2.textContent = opts.label; s.appendChild(t2); }
    mount(target, s);
    animate(target, () => {
      arc.style.transition = 'stroke-dashoffset 1.3s cubic-bezier(.3,1,.4,1)';
      arc.setAttribute('stroke-dashoffset', circ * (1 - value / 100));
      countUp(t1, value, opts.suffix || '%', 1300);
    });
    return s;
  };

  /* ---- Multi-segment win/draw/loss donut ---- */
  IXChart.donut = function (target, segs, opts = {}) {
    const size = opts.size || 150, sw = opts.stroke || 16, r = (size - sw) / 2 - 2, cx = size / 2, cy = size / 2;
    const s = svg(size, size);
    s.appendChild(el('circle', { cx, cy, r, fill: 'none', stroke: C.surf, 'stroke-width': sw }));
    const circ = 2 * Math.PI * r, gap = opts.gap || 3;
    let off = 0; const arcs = [];
    segs.forEach((sg) => {
      const len = (sg.v / 100) * circ;
      const a = el('circle', { cx, cy, r, fill: 'none', stroke: sg.color, 'stroke-width': sw, 'stroke-linecap': 'butt', transform: `rotate(-90 ${cx} ${cy})`, 'stroke-dasharray': `0 ${circ}`, 'stroke-dashoffset': -off });
      s.appendChild(a); arcs.push({ a, len: Math.max(0, len - gap) }); off += len;
    });
    if (opts.centerTop) { const t1 = el('text', { x: cx, y: cy - 4, 'text-anchor': 'middle', fill: C.fg, 'font-family': 'JetBrains Mono, monospace', 'font-size': size * 0.2, 'font-weight': 700 }); t1.textContent = opts.centerTop; s.appendChild(t1); }
    if (opts.centerBot) { const t2 = el('text', { x: cx, y: cy + size * 0.12, 'text-anchor': 'middle', fill: C.dim, 'font-family': 'Inter', 'font-size': size * 0.085, 'font-weight': 600 }); t2.textContent = opts.centerBot; s.appendChild(t2); }
    mount(target, s);
    animate(target, () => arcs.forEach((o, i) => setTimeout(() => { o.a.style.transition = 'stroke-dasharray 1s cubic-bezier(.3,1,.4,1)'; o.a.setAttribute('stroke-dasharray', `${o.len} ${circ}`); }, i * 140)));
    return s;
  };

  /* ---- Radar chart (team/player attributes) ---- */
  IXChart.radar = function (target, opts = {}) {
    const size = opts.size || 240, cx = size / 2, cy = size / 2, r = size / 2 - 34;
    const axes = opts.axes, series = opts.series; const n = axes.length, a0 = -Math.PI / 2;
    const s = svg(size, size);
    for (let g = 1; g <= 4; g++) { s.appendChild(el('polygon', { points: poly(cx, cy, (r * g) / 4, n, a0).map(p => p.join(',')).join(' '), fill: 'none', stroke: C.grid, 'stroke-width': 1 })); }
    poly(cx, cy, r, n, a0).forEach(p => s.appendChild(el('line', { x1: cx, y1: cy, x2: p[0], y2: p[1], stroke: C.grid, 'stroke-width': 1 })));
    axes.forEach((ax, i) => {
      const p = poly(cx, cy, r + 16, n, a0)[i];
      const t = el('text', { x: p[0], y: p[1], 'text-anchor': Math.abs(p[0] - cx) < 6 ? 'middle' : p[0] > cx ? 'start' : 'end', 'dominant-baseline': 'middle', fill: C.text, 'font-family': 'Inter', 'font-size': 10.5, 'font-weight': 600 });
      t.textContent = ax; s.appendChild(t);
    });
    series.forEach((ser) => {
      const pts = ser.values.map((v, i) => poly(cx, cy, (r * v) / 100, n, a0)[i]);
      const poly2 = el('polygon', { points: pts.map(p => p.join(',')).join(' '), fill: ser.color + '22', stroke: ser.color, 'stroke-width': 2, 'stroke-linejoin': 'round', opacity: 0, style: 'transform-origin:center;transform:scale(.4);transition:transform .9s cubic-bezier(.3,1,.4,1),opacity .6s' });
      s.appendChild(poly2);
      pts.forEach(p => s.appendChild(el('circle', { cx: p[0], cy: p[1], r: 2.5, fill: ser.color })));
    });
    mount(target, s);
    animate(target, () => [...s.querySelectorAll('polygon[opacity="0"]')].forEach((p, i) => setTimeout(() => { p.setAttribute('opacity', '1'); p.style.transform = 'scale(1)'; }, i * 160)));
    return s;
  };

  /* ---- Line / area chart (xG, form, trends), multi-series ---- */
  IXChart.line = function (target, opts = {}) {
    const w = opts.w || 480, h = opts.h || 200, pad = opts.pad || { t: 14, r: 14, b: 22, l: 30 };
    const series = opts.series, xMax = opts.xMax ?? Math.max(...series[0].data.map(d => d.x ?? 0));
    let yMax = opts.yMax ?? Math.max(...series.flatMap(s => s.data.map(d => d.y))) * 1.15;
    let yMin = opts.yMin ?? 0;
    const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    const X = x => pad.l + (x / (xMax || 1)) * iw;
    const Y = y => pad.t + ih - ((y - yMin) / (yMax - yMin || 1)) * ih;
    const s = svg(w, h);
    const gy = opts.gy || 4;
    for (let i = 0; i <= gy; i++) { const yy = pad.t + (ih * i) / gy; s.appendChild(el('line', { x1: pad.l, y1: yy, x2: w - pad.r, y2: yy, stroke: C.grid, 'stroke-width': 1 })); if (opts.yLabels) { const val = (yMax - (i / gy) * (yMax - yMin)).toFixed(opts.yDec ?? 0); const t = el('text', { x: pad.l - 7, y: yy + 3, 'text-anchor': 'end', fill: C.dim, 'font-family': 'JetBrains Mono', 'font-size': 9 }); t.textContent = val; s.appendChild(t); } }
    if (opts.xLabels) opts.xLabels.forEach((lb, i) => { const xx = X((i / (opts.xLabels.length - 1)) * xMax); const t = el('text', { x: xx, y: h - 6, 'text-anchor': 'middle', fill: C.dim, 'font-family': 'JetBrains Mono', 'font-size': 9 }); t.textContent = lb; s.appendChild(t); });
    series.forEach((ser) => {
      const pts = ser.data.map((d, i) => [X(d.x ?? (i / (ser.data.length - 1)) * xMax), Y(d.y)]);
      const dPath = opts.smooth !== false ? smooth(pts) : path(pts);
      if (ser.area) {
        const id = uid(); const g = el('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 }); g.appendChild(el('stop', { offset: '0%', 'stop-color': ser.color, 'stop-opacity': .28 })); g.appendChild(el('stop', { offset: '100%', 'stop-color': ser.color, 'stop-opacity': 0 })); s.appendChild(g);
        const ap = el('path', { d: dPath + ` L ${pts[pts.length - 1][0]} ${pad.t + ih} L ${pts[0][0]} ${pad.t + ih} Z`, fill: `url(#${id})`, opacity: 0, style: 'transition:opacity 1s .3s' }); s.appendChild(ap); animate(target, () => ap.setAttribute('opacity', '1'));
      }
      const p = el('path', { d: dPath, fill: 'none', stroke: ser.color, 'stroke-width': ser.width || 2.4, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
      if (ser.dash) p.setAttribute('stroke-dasharray', '5 5');
      const len = p.getTotalLength ? 0 : 0; s.appendChild(p);
      const L = p.getTotalLength(); p.style.strokeDasharray = ser.dash ? '5 5' : L; if (!ser.dash) { p.style.strokeDashoffset = L; animate(target, () => { p.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(.3,1,.4,1)'; p.style.strokeDashoffset = '0'; }); }
      if (ser.dots) pts.forEach(pt => s.appendChild(el('circle', { cx: pt[0], cy: pt[1], r: 3, fill: '#0a1020', stroke: ser.color, 'stroke-width': 2 })));
      if (ser.endDot) { const e = pts[pts.length - 1]; s.appendChild(el('circle', { cx: e[0], cy: e[1], r: 4, fill: ser.color })); s.appendChild(el('circle', { cx: e[0], cy: e[1], r: 7, fill: 'none', stroke: ser.color, 'stroke-width': 1, opacity: .4 })); }
    });
    mount(target, s);
    return s;
  };

  /* ---- Momentum diverging bars (home vs away by time bucket) ---- */
  IXChart.momentum = function (target, data, opts = {}) {
    const w = opts.w || 480, h = opts.h || 130, mid = h / 2, bw = (w / data.length) * 0.62, gap = w / data.length;
    const s = svg(w, h);
    s.appendChild(el('line', { x1: 0, y1: mid, x2: w, y2: mid, stroke: C.line, 'stroke-width': 1 }));
    const cH = opts.homeColor || C.blue, cA = opts.awayColor || C.green;
    data.forEach((d, i) => {
      const x = gap * i + (gap - bw) / 2;
      const hH = (Math.abs(d) / 100) * (mid - 6);
      const up = d >= 0;
      const r = el('rect', { x, y: mid, width: bw, height: 0, rx: 3, fill: up ? cH : cA, opacity: .85 });
      s.appendChild(r);
      animate(target, () => setTimeout(() => { r.style.transition = 'all .7s cubic-bezier(.3,1,.4,1)'; r.setAttribute('y', up ? mid - hH : mid); r.setAttribute('height', hH); }, i * 35));
    });
    return mount(target, s) && s;
  };

  /* ---- Bar chart (horizontal or vertical) ---- */
  IXChart.bars = function (target, data, opts = {}) {
    const horiz = opts.horiz; const max = opts.max ?? Math.max(...data.map(d => d.v)) * 1.1;
    if (horiz) {
      const t = resolve(target); if (!t) return; t.innerHTML = '';
      data.forEach((d, i) => {
        const row = document.createElement('div'); row.style.cssText = 'display:flex;align-items:center;gap:10px;margin:9px 0';
        row.innerHTML = `<div style="width:${opts.labelW||92}px;font-size:12px;color:var(--text-2);flex-shrink:0;${opts.labelMono?'font-family:var(--font-mono)':''}">${d.label}</div><div style="flex:1;height:9px;border-radius:20px;background:var(--surface-3);overflow:hidden"><i style="display:block;height:100%;width:0;border-radius:20px;background:${d.color||'linear-gradient(90deg,var(--blue),var(--blue-2))'};transition:width 1s cubic-bezier(.3,1,.4,1) ${i*0.06}s"></i></div><div class="mono" style="width:${opts.valW||40}px;text-align:right;font-size:12px;font-weight:600;color:var(--text)">${d.disp ?? d.v}</div>`;
        t.appendChild(row);
        animate(target, () => row.querySelector('i').style.width = (d.v / max * 100) + '%');
      });
      return;
    }
    const w = opts.w || 360, h = opts.h || 160, pad = 24, bw = ((w - pad) / data.length) * 0.6, gap = (w - pad) / data.length;
    const s = svg(w, h);
    data.forEach((d, i) => {
      const bh = (d.v / max) * (h - pad - 14);
      const x = pad + gap * i + (gap - bw) / 2;
      const id = uid(); const g = el('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 }); g.appendChild(el('stop', { offset: '0%', 'stop-color': d.color || C.blue })); g.appendChild(el('stop', { offset: '100%', 'stop-color': (d.color || C.blue) + '44' })); s.appendChild(g);
      const r = el('rect', { x, y: h - 14, width: bw, height: 0, rx: 4, fill: `url(#${id})` }); s.appendChild(r);
      animate(target, () => setTimeout(() => { r.style.transition = 'all .8s cubic-bezier(.3,1,.4,1)'; r.setAttribute('y', h - 14 - bh); r.setAttribute('height', bh); }, i * 50));
      const t = el('text', { x: x + bw / 2, y: h - 3, 'text-anchor': 'middle', fill: C.dim, 'font-family': 'JetBrains Mono', 'font-size': 9 }); t.textContent = d.label; s.appendChild(t);
    });
    return mount(target, s) && s;
  };

  /* ---- Sparkline (mini trend) ---- */
  IXChart.spark = function (target, vals, opts = {}) {
    const w = opts.w || 90, h = opts.h || 28, col = opts.color || C.green;
    const max = Math.max(...vals), min = Math.min(...vals);
    const pts = vals.map((v, i) => [(i / (vals.length - 1)) * w, h - 2 - ((v - min) / (max - min || 1)) * (h - 4)]);
    const s = svg(w, h);
    if (opts.area) { const id = uid(); const g = el('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 }); g.appendChild(el('stop', { offset: '0%', 'stop-color': col, 'stop-opacity': .35 })); g.appendChild(el('stop', { offset: '100%', 'stop-color': col, 'stop-opacity': 0 })); s.appendChild(g); s.appendChild(el('path', { d: smooth(pts) + ` L ${w} ${h} L 0 ${h} Z`, fill: `url(#${id})` })); }
    s.appendChild(el('path', { d: smooth(pts), fill: 'none', stroke: col, 'stroke-width': 1.8, 'stroke-linecap': 'round' }));
    s.appendChild(el('circle', { cx: pts[pts.length - 1][0], cy: pts[pts.length - 1][1], r: 2.2, fill: col }));
    return mount(target, s) && s;
  };

  /* ---- Pitch heatmap (zone intensity grid) ---- */
  IXChart.heatmap = function (target, grid, opts = {}) {
    // grid: array of rows (top=attacking) x cols, values 0..1
    const w = opts.w || 300, h = opts.h || 200, rows = grid.length, cols = grid[0].length;
    const s = svg(w, h);
    drawPitch(s, w, h);
    const cw = w / cols, ch = h / rows;
    grid.forEach((row, r) => row.forEach((v, c) => {
      const col = v > .66 ? C.red : v > .4 ? C.amber : v > .2 ? C.green : C.blue;
      const rect = el('rect', { x: c * cw, y: r * ch, width: cw, height: ch, fill: col, opacity: 0, rx: 2, style: 'mix-blend-mode:screen;transition:opacity .8s' });
      s.appendChild(rect); animate(target, () => setTimeout(() => rect.setAttribute('opacity', (v * 0.7).toFixed(2)), (r * cols + c) * 12));
    }));
    return mount(target, s) && s;
  };

  /* ---- Formation pitch (positions) ---- */
  IXChart.formation = function (target, players, opts = {}) {
    const w = opts.w || 300, h = opts.h || 420, vert = true;
    const s = svg(w, h);
    drawPitch(s, w, h, true);
    const col = opts.color || C.blue;
    players.forEach((p) => {
      const x = p.x * w, y = p.y * h;
      const g = el('g', { opacity: 0, style: 'transition:opacity .5s' });
      g.appendChild(el('circle', { cx: x, cy: y, r: 13, fill: '#0a1020', stroke: col, 'stroke-width': 2 }));
      g.appendChild(el('circle', { cx: x, cy: y, r: 19, fill: 'none', stroke: col, 'stroke-width': 1, opacity: .25 }));
      const num = el('text', { x, y: y + 3.5, 'text-anchor': 'middle', fill: '#fff', 'font-family': 'JetBrains Mono', 'font-size': 11, 'font-weight': 700 }); num.textContent = p.num; g.appendChild(num);
      if (p.name) { const nm = el('text', { x, y: y + 27, 'text-anchor': 'middle', fill: C.text, 'font-family': 'Inter', 'font-size': 8.5, 'font-weight': 600 }); nm.textContent = p.name; g.appendChild(nm); }
      s.appendChild(g); animate(target, () => setTimeout(() => g.setAttribute('opacity', '1'), Math.random() * 400));
    });
    return mount(target, s) && s;
  };

  /* ---- Win probability tracker (live, stacked area over time) ---- */
  IXChart.winprob = function (target, data, opts = {}) {
    // data: [{m, h, d, a}] percentages summing to 100
    const w = opts.w || 520, h = opts.h || 150, pad = { t: 8, r: 8, b: 18, l: 8 };
    const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    const X = i => pad.l + (i / (data.length - 1)) * iw;
    const s = svg(w, h);
    const bands = [{ key: 'h', color: C.blue }, { key: 'd', color: '#6b7689' }, { key: 'a', color: C.green }];
    let base = data.map(() => 0);
    bands.forEach((b) => {
      const top = data.map((d, i) => base[i] + d[b.key]);
      const upper = top.map((v, i) => [X(i), pad.t + ih - (v / 100) * ih]);
      const lower = base.map((v, i) => [X(i), pad.t + ih - (v / 100) * ih]).reverse();
      const id = uid(); const g = el('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 }); g.appendChild(el('stop', { offset: '0%', 'stop-color': b.color, 'stop-opacity': .55 })); g.appendChild(el('stop', { offset: '100%', 'stop-color': b.color, 'stop-opacity': .15 })); s.appendChild(g);
      const p = el('path', { d: path(upper) + ' ' + path(lower).replace('M', 'L') + ' Z', fill: `url(#${id})`, opacity: 0, style: 'transition:opacity 1s' });
      s.appendChild(p); animate(target, () => p.setAttribute('opacity', '1'));
      base = top;
    });
    // 50% line
    s.appendChild(el('line', { x1: pad.l, y1: pad.t + ih / 2, x2: w - pad.r, y2: pad.t + ih / 2, stroke: C.line, 'stroke-width': 1, 'stroke-dasharray': '3 4' }));
    return mount(target, s) && s;
  };

  /* ---- Gauge (semi-circle, confidence) ---- */
  IXChart.gauge = function (target, value, opts = {}) {
    const size = opts.size || 180, sw = opts.stroke || 14, r = size / 2 - sw, cx = size / 2, cy = size / 2;
    const s = svg(size, size * 0.62);
    const a0 = Math.PI, a1 = 0;
    function pt(a) { return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
    const bg = el('path', { d: `M ${pt(a0)[0]} ${pt(a0)[1]} A ${r} ${r} 0 0 1 ${pt(a1)[0]} ${pt(a1)[1]}`, fill: 'none', stroke: C.surf, 'stroke-width': sw, 'stroke-linecap': 'round' }); s.appendChild(bg);
    const id = uid(); const g = el('linearGradient', { id }); g.appendChild(el('stop', { offset: '0%', 'stop-color': C.blue })); g.appendChild(el('stop', { offset: '100%', 'stop-color': C.green })); s.appendChild(g);
    const len = Math.PI * r;
    const arc = el('path', { d: `M ${pt(a0)[0]} ${pt(a0)[1]} A ${r} ${r} 0 0 1 ${pt(a1)[0]} ${pt(a1)[1]}`, fill: 'none', stroke: `url(#${id})`, 'stroke-width': sw, 'stroke-linecap': 'round', 'stroke-dasharray': len, 'stroke-dashoffset': len }); s.appendChild(arc);
    const t = el('text', { x: cx, y: cy - 4, 'text-anchor': 'middle', fill: C.fg, 'font-family': 'JetBrains Mono', 'font-size': size * 0.2, 'font-weight': 700 }); t.textContent = '0'; s.appendChild(t);
    if (opts.label) { const l = el('text', { x: cx, y: cy + 14, 'text-anchor': 'middle', fill: C.dim, 'font-family': 'Inter', 'font-size': size * 0.075, 'font-weight': 600 }); l.textContent = opts.label; s.appendChild(l); }
    mount(target, s);
    animate(target, () => { arc.style.transition = 'stroke-dashoffset 1.3s cubic-bezier(.3,1,.4,1)'; arc.setAttribute('stroke-dashoffset', len * (1 - value / 100)); countUp(t, value, '', 1300); });
    return s;
  };

  /* ---- helpers ---- */
  function drawPitch(s, w, h, vert) {
    s.appendChild(el('rect', { x: 0, y: 0, width: w, height: h, rx: 8, fill: C.pitch, stroke: C.line }));
    const ln = { stroke: C.line, 'stroke-width': 1, fill: 'none' };
    if (vert) {
      s.appendChild(el('line', { x1: 0, y1: h / 2, x2: w, y2: h / 2, ...ln }));
      s.appendChild(el('circle', { cx: w / 2, cy: h / 2, r: w * 0.13, ...ln }));
      s.appendChild(el('rect', { x: w * 0.2, y: 0, width: w * 0.6, height: h * 0.12, ...ln }));
      s.appendChild(el('rect', { x: w * 0.2, y: h * 0.88, width: w * 0.6, height: h * 0.12, ...ln }));
    } else {
      s.appendChild(el('line', { x1: w / 2, y1: 0, x2: w / 2, y2: h, ...ln }));
      s.appendChild(el('circle', { cx: w / 2, cy: h / 2, r: h * 0.16, ...ln }));
      s.appendChild(el('rect', { x: 0, y: h * 0.22, width: w * 0.14, height: h * 0.56, ...ln }));
      s.appendChild(el('rect', { x: w * 0.86, y: h * 0.22, width: w * 0.14, height: h * 0.56, ...ln }));
    }
  }
  function countUp(node, to, suffix, dur) {
    const dec = to % 1 !== 0 ? 1 : 0;
    if (document.visibilityState === 'hidden') { node.textContent = to.toFixed(dec) + (suffix || ''); return; }
    const start = performance.now();
    function step(t) { const p = Math.min(1, (t - start) / dur); const e = 1 - Math.pow(1 - p, 3); node.textContent = (to * e).toFixed(dec) + (suffix || ''); if (p < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  const seen = new WeakSet();
  function animate(target, fn) {
    const t = resolve(target); if (!t) { fn(); return; }
    // If the tab isn't visible (e.g. background capture), draw final state at once.
    if (document.visibilityState === 'hidden' || !('IntersectionObserver' in window)) { fn(); return; }
    let done = false; const run = () => { if (!done) { done = true; fn(); } };
    const io = new IntersectionObserver((ents) => { ents.forEach(e => { if (e.isIntersecting) { run(); io.disconnect(); } }); }, { threshold: 0.12 });
    io.observe(t);
    // Safety: ensure it always renders even if IO never fires.
    setTimeout(() => { run(); io.disconnect(); }, 1200);
  }

  IXChart.countUp = countUp;
  IXChart.C = C;

  // --- Theme redraw registry ---------------------------------------------
  // Wrap renderers so every draw is recorded against its target element and
  // can be re-run when the theme flips (structural colors come from CSS vars).
  const REG = [];
  ['ring', 'donut', 'radar', 'line', 'momentum', 'bars', 'spark', 'heatmap', 'formation', 'winprob', 'gauge'].forEach(name => {
    const orig = IXChart[name];
    if (!orig) return;
    IXChart[name] = function (target, ...args) {
      refreshC();
      const el2 = resolve(target);
      if (el2) { const i = REG.findIndex(r => r.el === el2); const rec = { el: el2, run: () => orig.apply(IXChart, [el2, ...args]) }; if (i >= 0) REG[i] = rec; else REG.push(rec); }
      return orig.apply(IXChart, [target, ...args]);
    };
  });
  IXChart.redrawAll = function () {
    refreshC();
    for (let i = REG.length - 1; i >= 0; i--) {
      const r = REG[i];
      if (!document.body.contains(r.el)) { REG.splice(i, 1); continue; }
      try { r.run(); } catch (e) { /* ignore */ }
    }
  };

  refreshC();
  window.IXChart = IXChart;
})();
