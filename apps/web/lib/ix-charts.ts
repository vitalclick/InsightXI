/**
 * InsightXI — dependency-free SVG chart library (browser only).
 *
 * Ported from the design prototype (assets/js/charts.js) to a typed module.
 * Each renderer takes a mounted DOM element and draws an animated SVG into it.
 * Structural colours are read from CSS custom properties so charts adapt to
 * the light/dark theme; call `redrawAll()` (or re-run the renderer) on change.
 */

const NS = "http://www.w3.org/2000/svg";

export const C = {
  blue: "#2e7dff",
  blue2: "#5a9bff",
  green: "#27e08a",
  green2: "#54f0a6",
  cyan: "#19d3e3",
  gold: "#e8c270",
  red: "#ff5b6b",
  amber: "#ffb13d",
  violet: "#9b7bff",
  grid: "rgba(255,255,255,.07)",
  line: "rgba(255,255,255,.12)",
  text: "#b9c4d8",
  dim: "#5b6680",
  surf: "#18223a",
  fg: "#ffffff",
  pitch: "rgba(39,224,138,.03)",
};

/** Pull theme-dependent structural colours from CSS vars. */
function refreshC(): void {
  if (typeof document === "undefined") return;
  const cs = getComputedStyle(document.documentElement);
  const g = (k: string) => (cs.getPropertyValue(k) || "").trim();
  if (g("--chart-grid")) C.grid = g("--chart-grid");
  if (g("--chart-line")) C.line = g("--chart-line");
  if (g("--chart-text")) C.text = g("--chart-text");
  if (g("--chart-dim")) C.dim = g("--chart-dim");
  if (g("--chart-surf")) C.surf = g("--chart-surf");
  if (g("--chart-fg")) C.fg = g("--chart-fg");
  if (g("--pitch-fill")) C.pitch = g("--pitch-fill");
}

type Attrs = Record<string, string | number>;
function el(t: string, a?: Attrs): SVGElement {
  const e = document.createElementNS(NS, t) as SVGElement;
  if (a) for (const k in a) e.setAttribute(k, String(a[k]));
  return e;
}
function uid(): string {
  return "ix" + Math.random().toString(36).slice(2, 8);
}
type Pt = [number, number];
function poly(cx: number, cy: number, r: number, n: number, a0: number): Pt[] {
  const p: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = a0 + (Math.PI * 2 * i) / n;
    p.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return p;
}
function path(pts: Pt[], close?: boolean): string {
  return (
    pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(2) + " " + p[1].toFixed(2)).join(" ") +
    (close ? " Z" : "")
  );
}
function smooth(pts: Pt[]): string {
  if (pts.length < 2) return path(pts);
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i ? i - 1 : 0],
      p1 = pts[i],
      p2 = pts[i + 1],
      p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6,
      c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6,
      c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return d;
}
function svg(w: number, h: number): SVGSVGElement {
  const s = el("svg", {
    viewBox: `0 0 ${w} ${h}`,
    width: "100%",
    height: "100%",
    preserveAspectRatio: "xMidYMid meet",
  }) as SVGSVGElement;
  s.style.display = "block";
  s.style.overflow = "visible";
  return s;
}
function mount(target: HTMLElement, s: SVGSVGElement): SVGSVGElement {
  target.innerHTML = "";
  target.appendChild(s);
  return s;
}

function countUp(node: SVGElement, to: number, suffix: string, dur: number): void {
  const dec = to % 1 !== 0 ? 1 : 0;
  if (typeof document !== "undefined" && document.visibilityState === "hidden") {
    node.textContent = to.toFixed(dec) + (suffix || "");
    return;
  }
  const start = performance.now();
  function step(t: number) {
    const p = Math.min(1, (t - start) / dur);
    const e = 1 - Math.pow(1 - p, 3);
    node.textContent = (to * e).toFixed(dec) + (suffix || "");
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function animate(target: HTMLElement, fn: () => void): void {
  if (
    typeof document === "undefined" ||
    document.visibilityState === "hidden" ||
    !("IntersectionObserver" in window)
  ) {
    fn();
    return;
  }
  let done = false;
  const run = () => {
    if (!done) {
      done = true;
      fn();
    }
  };
  const io = new IntersectionObserver(
    (ents) => {
      ents.forEach((e) => {
        if (e.isIntersecting) {
          run();
          io.disconnect();
        }
      });
    },
    { threshold: 0.12 },
  );
  io.observe(target);
  setTimeout(() => {
    run();
    io.disconnect();
  }, 1200);
}

function drawPitch(s: SVGSVGElement, w: number, h: number, vert?: boolean): void {
  s.appendChild(el("rect", { x: 0, y: 0, width: w, height: h, rx: 8, fill: C.pitch, stroke: C.line }));
  const ln: Attrs = { stroke: C.line, "stroke-width": 1, fill: "none" };
  if (vert) {
    s.appendChild(el("line", { x1: 0, y1: h / 2, x2: w, y2: h / 2, ...ln }));
    s.appendChild(el("circle", { cx: w / 2, cy: h / 2, r: w * 0.13, ...ln }));
    s.appendChild(el("rect", { x: w * 0.2, y: 0, width: w * 0.6, height: h * 0.12, ...ln }));
    s.appendChild(el("rect", { x: w * 0.2, y: h * 0.88, width: w * 0.6, height: h * 0.12, ...ln }));
  } else {
    s.appendChild(el("line", { x1: w / 2, y1: 0, x2: w / 2, y2: h, ...ln }));
    s.appendChild(el("circle", { cx: w / 2, cy: h / 2, r: h * 0.16, ...ln }));
    s.appendChild(el("rect", { x: 0, y: h * 0.22, width: w * 0.14, height: h * 0.56, ...ln }));
    s.appendChild(el("rect", { x: w * 0.86, y: h * 0.22, width: w * 0.14, height: h * 0.56, ...ln }));
  }
}

// ---- Option types -----------------------------------------------------------
export interface RingOpts {
  size?: number;
  stroke?: number;
  color?: string;
  glow?: boolean;
  label?: string;
  suffix?: string;
  fs?: number;
  textColor?: string;
}
export interface DonutSeg {
  v: number;
  color: string;
}
export interface DonutOpts {
  size?: number;
  stroke?: number;
  gap?: number;
  centerTop?: string;
  centerBot?: string;
}
export interface RadarSeries {
  color: string;
  values: number[];
}
export interface RadarOpts {
  size?: number;
  axes: string[];
  series: RadarSeries[];
}
export interface LineDatum {
  x?: number;
  y: number;
}
export interface LineSeries {
  color: string;
  data: LineDatum[];
  area?: boolean;
  dash?: boolean;
  dots?: boolean;
  endDot?: boolean;
  width?: number;
}
export interface LineOpts {
  w?: number;
  h?: number;
  pad?: { t: number; r: number; b: number; l: number };
  series: LineSeries[];
  xMax?: number;
  yMax?: number;
  yMin?: number;
  gy?: number;
  yLabels?: boolean;
  yDec?: number;
  xLabels?: string[];
  smooth?: boolean;
  /** Vertical event markers drawn at an x value (e.g. goal minutes). */
  markers?: { x: number; color: string }[];
}
export interface BarDatum {
  label: string;
  v: number;
  disp?: string;
  color?: string;
}
export interface BarsOpts {
  horiz?: boolean;
  max?: number;
  w?: number;
  h?: number;
  labelW?: number;
  valW?: number;
  labelMono?: boolean;
}
export interface SparkOpts {
  w?: number;
  h?: number;
  color?: string;
  area?: boolean;
}
export interface FormationPlayer {
  x: number;
  y: number;
  num: number | string;
  name?: string;
}
export interface WinProbDatum {
  m: number;
  h: number;
  d: number;
  a: number;
}

// ---- Renderers --------------------------------------------------------------
export function ring(target: HTMLElement, value: number, opts: RingOpts = {}): void {
  refreshC();
  const size = opts.size || 120,
    sw = opts.stroke || 11,
    r = (size - sw) / 2 - 2,
    cx = size / 2,
    cy = size / 2;
  const col = opts.color || C.blue,
    glow = opts.glow !== false;
  const s = svg(size, size);
  const id = uid();
  if (glow) {
    const f = el("filter", { id, x: "-50%", y: "-50%", width: "200%", height: "200%" });
    f.appendChild(el("feGaussianBlur", { stdDeviation: "3", result: "b" }));
    const m = el("feMerge");
    m.appendChild(el("feMergeNode", { in: "b" }));
    m.appendChild(el("feMergeNode", { in: "SourceGraphic" }));
    f.appendChild(m);
    s.appendChild(f);
  }
  s.appendChild(el("circle", { cx, cy, r, fill: "none", stroke: C.surf, "stroke-width": sw }));
  const circ = 2 * Math.PI * r;
  const arc = el("circle", {
    cx,
    cy,
    r,
    fill: "none",
    stroke: col,
    "stroke-width": sw,
    "stroke-linecap": "round",
    transform: `rotate(-90 ${cx} ${cy})`,
    "stroke-dasharray": circ,
    "stroke-dashoffset": circ,
  });
  if (glow) arc.setAttribute("filter", `url(#${id})`);
  s.appendChild(arc);
  const t1 = el("text", {
    x: cx,
    y: cy + (opts.label ? -2 : 6),
    "text-anchor": "middle",
    fill: opts.textColor || C.fg,
    "font-family": "JetBrains Mono, monospace",
    "font-size": opts.fs || size * 0.26,
    "font-weight": 700,
  });
  t1.textContent = "0" + (opts.suffix || "%");
  s.appendChild(t1);
  if (opts.label) {
    const t2 = el("text", {
      x: cx,
      y: cy + size * 0.16,
      "text-anchor": "middle",
      fill: C.dim,
      "font-family": "Inter, sans-serif",
      "font-size": size * 0.1,
      "font-weight": 600,
    });
    t2.textContent = opts.label;
    s.appendChild(t2);
  }
  mount(target, s);
  animate(target, () => {
    (arc as SVGElement).style.transition = "stroke-dashoffset 1.3s cubic-bezier(.3,1,.4,1)";
    arc.setAttribute("stroke-dashoffset", String(circ * (1 - value / 100)));
    countUp(t1, value, opts.suffix || "%", 1300);
  });
}

export function donut(target: HTMLElement, segs: DonutSeg[], opts: DonutOpts = {}): void {
  refreshC();
  const size = opts.size || 150,
    sw = opts.stroke || 16,
    r = (size - sw) / 2 - 2,
    cx = size / 2,
    cy = size / 2;
  const s = svg(size, size);
  s.appendChild(el("circle", { cx, cy, r, fill: "none", stroke: C.surf, "stroke-width": sw }));
  const circ = 2 * Math.PI * r,
    gap = opts.gap || 3;
  let off = 0;
  const arcs: { a: SVGElement; len: number }[] = [];
  segs.forEach((sg) => {
    const len = (sg.v / 100) * circ;
    const a = el("circle", {
      cx,
      cy,
      r,
      fill: "none",
      stroke: sg.color,
      "stroke-width": sw,
      "stroke-linecap": "butt",
      transform: `rotate(-90 ${cx} ${cy})`,
      "stroke-dasharray": `0 ${circ}`,
      "stroke-dashoffset": -off,
    });
    s.appendChild(a);
    arcs.push({ a, len: Math.max(0, len - gap) });
    off += len;
  });
  if (opts.centerTop) {
    const t1 = el("text", {
      x: cx,
      y: cy - 4,
      "text-anchor": "middle",
      fill: C.fg,
      "font-family": "JetBrains Mono, monospace",
      "font-size": size * 0.2,
      "font-weight": 700,
    });
    t1.textContent = opts.centerTop;
    s.appendChild(t1);
  }
  if (opts.centerBot) {
    const t2 = el("text", {
      x: cx,
      y: cy + size * 0.12,
      "text-anchor": "middle",
      fill: C.dim,
      "font-family": "Inter",
      "font-size": size * 0.085,
      "font-weight": 600,
    });
    t2.textContent = opts.centerBot;
    s.appendChild(t2);
  }
  mount(target, s);
  animate(target, () =>
    arcs.forEach((o, i) =>
      setTimeout(() => {
        (o.a as SVGElement).style.transition = "stroke-dasharray 1s cubic-bezier(.3,1,.4,1)";
        o.a.setAttribute("stroke-dasharray", `${o.len} ${circ}`);
      }, i * 140),
    ),
  );
}

export function radar(target: HTMLElement, opts: RadarOpts): void {
  refreshC();
  const size = opts.size || 240,
    cx = size / 2,
    cy = size / 2,
    r = size / 2 - 34;
  const axes = opts.axes,
    series = opts.series;
  const n = axes.length,
    a0 = -Math.PI / 2;
  const s = svg(size, size);
  for (let g = 1; g <= 4; g++) {
    s.appendChild(
      el("polygon", {
        points: poly(cx, cy, (r * g) / 4, n, a0)
          .map((p) => p.join(","))
          .join(" "),
        fill: "none",
        stroke: C.grid,
        "stroke-width": 1,
      }),
    );
  }
  poly(cx, cy, r, n, a0).forEach((p) =>
    s.appendChild(el("line", { x1: cx, y1: cy, x2: p[0], y2: p[1], stroke: C.grid, "stroke-width": 1 })),
  );
  axes.forEach((ax, i) => {
    const p = poly(cx, cy, r + 16, n, a0)[i];
    const t = el("text", {
      x: p[0],
      y: p[1],
      "text-anchor": Math.abs(p[0] - cx) < 6 ? "middle" : p[0] > cx ? "start" : "end",
      "dominant-baseline": "middle",
      fill: C.text,
      "font-family": "Inter",
      "font-size": 10.5,
      "font-weight": 600,
    });
    t.textContent = ax;
    s.appendChild(t);
  });
  series.forEach((ser) => {
    const pts = ser.values.map((v, i) => poly(cx, cy, (r * v) / 100, n, a0)[i]);
    const poly2 = el("polygon", {
      points: pts.map((p) => p.join(",")).join(" "),
      fill: ser.color + "22",
      stroke: ser.color,
      "stroke-width": 2,
      "stroke-linejoin": "round",
      opacity: 0,
      style:
        "transform-origin:center;transform:scale(.4);transition:transform .9s cubic-bezier(.3,1,.4,1),opacity .6s",
    });
    s.appendChild(poly2);
    pts.forEach((p) => s.appendChild(el("circle", { cx: p[0], cy: p[1], r: 2.5, fill: ser.color })));
  });
  mount(target, s);
  animate(target, () =>
    [...s.querySelectorAll('polygon[opacity="0"]')].forEach((p, i) =>
      setTimeout(() => {
        p.setAttribute("opacity", "1");
        (p as SVGElement).style.transform = "scale(1)";
      }, i * 160),
    ),
  );
}

export function line(target: HTMLElement, opts: LineOpts): void {
  refreshC();
  const w = opts.w || 480,
    h = opts.h || 200,
    pad = opts.pad || { t: 14, r: 14, b: 22, l: 30 };
  const series = opts.series,
    xMax = opts.xMax ?? Math.max(...series[0].data.map((d, i) => d.x ?? i));
  const yMax = opts.yMax ?? Math.max(...series.flatMap((s) => s.data.map((d) => d.y))) * 1.15;
  const yMin = opts.yMin ?? 0;
  const iw = w - pad.l - pad.r,
    ih = h - pad.t - pad.b;
  const X = (x: number) => pad.l + (x / (xMax || 1)) * iw;
  const Y = (y: number) => pad.t + ih - ((y - yMin) / (yMax - yMin || 1)) * ih;
  const s = svg(w, h);
  const gy = opts.gy || 4;
  for (let i = 0; i <= gy; i++) {
    const yy = pad.t + (ih * i) / gy;
    s.appendChild(el("line", { x1: pad.l, y1: yy, x2: w - pad.r, y2: yy, stroke: C.grid, "stroke-width": 1 }));
    if (opts.yLabels) {
      const val = (yMax - (i / gy) * (yMax - yMin)).toFixed(opts.yDec ?? 0);
      const t = el("text", {
        x: pad.l - 7,
        y: yy + 3,
        "text-anchor": "end",
        fill: C.dim,
        "font-family": "JetBrains Mono",
        "font-size": 9,
      });
      t.textContent = val;
      s.appendChild(t);
    }
  }
  if (opts.xLabels)
    opts.xLabels.forEach((lb, i) => {
      const xx = X((i / (opts.xLabels!.length - 1)) * xMax);
      const t = el("text", {
        x: xx,
        y: h - 6,
        "text-anchor": "middle",
        fill: C.dim,
        "font-family": "JetBrains Mono",
        "font-size": 9,
      });
      t.textContent = lb;
      s.appendChild(t);
    });
  if (opts.markers)
    opts.markers.forEach((mk) => {
      const mx = X(mk.x);
      s.appendChild(
        el("line", {
          x1: mx,
          y1: pad.t,
          x2: mx,
          y2: pad.t + ih,
          stroke: mk.color,
          "stroke-width": 1.5,
          "stroke-dasharray": "3 3",
          opacity: 0.7,
        }),
      );
      s.appendChild(el("circle", { cx: mx, cy: pad.t + 3, r: 3, fill: mk.color }));
    });
  series.forEach((ser) => {
    const pts: Pt[] = ser.data.map((d, i) => [X(d.x ?? (i / (ser.data.length - 1)) * xMax), Y(d.y)]);
    const dPath = opts.smooth !== false ? smooth(pts) : path(pts);
    if (ser.area) {
      const id = uid();
      const g = el("linearGradient", { id, x1: 0, y1: 0, x2: 0, y2: 1 });
      g.appendChild(el("stop", { offset: "0%", "stop-color": ser.color, "stop-opacity": 0.28 }));
      g.appendChild(el("stop", { offset: "100%", "stop-color": ser.color, "stop-opacity": 0 }));
      s.appendChild(g);
      const ap = el("path", {
        d: dPath + ` L ${pts[pts.length - 1][0]} ${pad.t + ih} L ${pts[0][0]} ${pad.t + ih} Z`,
        fill: `url(#${id})`,
        opacity: 0,
        style: "transition:opacity 1s .3s",
      });
      s.appendChild(ap);
      animate(target, () => ap.setAttribute("opacity", "1"));
    }
    const p = el("path", {
      d: dPath,
      fill: "none",
      stroke: ser.color,
      "stroke-width": ser.width || 2.4,
      "stroke-linejoin": "round",
      "stroke-linecap": "round",
    }) as SVGPathElement;
    if (ser.dash) p.setAttribute("stroke-dasharray", "5 5");
    s.appendChild(p);
    const L = p.getTotalLength();
    p.style.strokeDasharray = ser.dash ? "5 5" : String(L);
    if (!ser.dash) {
      p.style.strokeDashoffset = String(L);
      animate(target, () => {
        p.style.transition = "stroke-dashoffset 1.4s cubic-bezier(.3,1,.4,1)";
        p.style.strokeDashoffset = "0";
      });
    }
    if (ser.dots)
      pts.forEach((pt) =>
        s.appendChild(el("circle", { cx: pt[0], cy: pt[1], r: 3, fill: "#0a1020", stroke: ser.color, "stroke-width": 2 })),
      );
    if (ser.endDot) {
      const e = pts[pts.length - 1];
      s.appendChild(el("circle", { cx: e[0], cy: e[1], r: 4, fill: ser.color }));
      s.appendChild(el("circle", { cx: e[0], cy: e[1], r: 7, fill: "none", stroke: ser.color, "stroke-width": 1, opacity: 0.4 }));
    }
  });
  mount(target, s);
}

export function momentum(
  target: HTMLElement,
  data: number[],
  opts: { w?: number; h?: number; homeColor?: string; awayColor?: string } = {},
): void {
  refreshC();
  const w = opts.w || 480,
    h = opts.h || 130,
    mid = h / 2,
    bw = (w / data.length) * 0.62,
    gap = w / data.length;
  const s = svg(w, h);
  s.appendChild(el("line", { x1: 0, y1: mid, x2: w, y2: mid, stroke: C.line, "stroke-width": 1 }));
  const cH = opts.homeColor || C.blue,
    cA = opts.awayColor || C.green;
  data.forEach((d, i) => {
    const x = gap * i + (gap - bw) / 2;
    const hH = (Math.abs(d) / 100) * (mid - 6);
    const up = d >= 0;
    const r = el("rect", { x, y: mid, width: bw, height: 0, rx: 3, fill: up ? cH : cA, opacity: 0.85 });
    s.appendChild(r);
    animate(target, () =>
      setTimeout(() => {
        (r as SVGElement).style.transition = "all .7s cubic-bezier(.3,1,.4,1)";
        r.setAttribute("y", String(up ? mid - hH : mid));
        r.setAttribute("height", String(hH));
      }, i * 35),
    );
  });
  mount(target, s);
}

export function bars(target: HTMLElement, data: BarDatum[], opts: BarsOpts = {}): void {
  refreshC();
  const max = opts.max ?? Math.max(...data.map((d) => d.v)) * 1.1;
  if (opts.horiz) {
    target.innerHTML = "";
    data.forEach((d, i) => {
      const row = document.createElement("div");
      row.style.cssText = "display:flex;align-items:center;gap:10px;margin:9px 0";
      row.innerHTML = `<div style="width:${opts.labelW || 92}px;font-size:12px;color:var(--text-2);flex-shrink:0;${opts.labelMono ? "font-family:var(--font-mono)" : ""}">${d.label}</div><div style="flex:1;height:9px;border-radius:20px;background:var(--surface-3);overflow:hidden"><i style="display:block;height:100%;width:0;border-radius:20px;background:${d.color || "linear-gradient(90deg,var(--blue),var(--blue-2))"};transition:width 1s cubic-bezier(.3,1,.4,1) ${i * 0.06}s"></i></div><div class="mono" style="width:${opts.valW || 40}px;text-align:right;font-size:12px;font-weight:600;color:var(--text)">${d.disp ?? d.v}</div>`;
      target.appendChild(row);
      animate(target, () => {
        const bar = row.querySelector("i") as HTMLElement | null;
        if (bar) bar.style.width = (d.v / max) * 100 + "%";
      });
    });
    return;
  }
  const w = opts.w || 360,
    h = opts.h || 160,
    pad = 24,
    bw = ((w - pad) / data.length) * 0.6,
    gap = (w - pad) / data.length;
  const s = svg(w, h);
  data.forEach((d, i) => {
    const bh = (d.v / max) * (h - pad - 14);
    const x = pad + gap * i + (gap - bw) / 2;
    const id = uid();
    const g = el("linearGradient", { id, x1: 0, y1: 0, x2: 0, y2: 1 });
    g.appendChild(el("stop", { offset: "0%", "stop-color": d.color || C.blue }));
    g.appendChild(el("stop", { offset: "100%", "stop-color": (d.color || C.blue) + "44" }));
    s.appendChild(g);
    const r = el("rect", { x, y: h - 14, width: bw, height: 0, rx: 4, fill: `url(#${id})` });
    s.appendChild(r);
    animate(target, () =>
      setTimeout(() => {
        (r as SVGElement).style.transition = "all .8s cubic-bezier(.3,1,.4,1)";
        r.setAttribute("y", String(h - 14 - bh));
        r.setAttribute("height", String(bh));
      }, i * 50),
    );
    const t = el("text", {
      x: x + bw / 2,
      y: h - 3,
      "text-anchor": "middle",
      fill: C.dim,
      "font-family": "JetBrains Mono",
      "font-size": 9,
    });
    t.textContent = d.label;
    s.appendChild(t);
  });
  mount(target, s);
}

export function spark(target: HTMLElement, vals: number[], opts: SparkOpts = {}): void {
  refreshC();
  const w = opts.w || 90,
    h = opts.h || 28,
    col = opts.color || C.green;
  const max = Math.max(...vals),
    min = Math.min(...vals);
  const pts: Pt[] = vals.map((v, i) => [(i / (vals.length - 1)) * w, h - 2 - ((v - min) / (max - min || 1)) * (h - 4)]);
  const s = svg(w, h);
  if (opts.area) {
    const id = uid();
    const g = el("linearGradient", { id, x1: 0, y1: 0, x2: 0, y2: 1 });
    g.appendChild(el("stop", { offset: "0%", "stop-color": col, "stop-opacity": 0.35 }));
    g.appendChild(el("stop", { offset: "100%", "stop-color": col, "stop-opacity": 0 }));
    s.appendChild(g);
    s.appendChild(el("path", { d: smooth(pts) + ` L ${w} ${h} L 0 ${h} Z`, fill: `url(#${id})` }));
  }
  s.appendChild(el("path", { d: smooth(pts), fill: "none", stroke: col, "stroke-width": 1.8, "stroke-linecap": "round" }));
  s.appendChild(el("circle", { cx: pts[pts.length - 1][0], cy: pts[pts.length - 1][1], r: 2.2, fill: col }));
  mount(target, s);
}

/**
 * Pitch zone heatmap. `grid` is rows (top = attacking third) × cols of 0..1
 * intensities; cell colour ramps blue → green → amber → red and is layered
 * over a vertical pitch with screen blending.
 */
export function heatmap(target: HTMLElement, grid: number[][], opts: { w?: number; h?: number } = {}): void {
  refreshC();
  const w = opts.w || 300,
    h = opts.h || 200,
    rows = grid.length,
    cols = grid[0].length;
  const s = svg(w, h);
  drawPitch(s, w, h, true);
  const cw = w / cols,
    ch = h / rows;
  grid.forEach((row, r) =>
    row.forEach((v, c) => {
      const col = v > 0.66 ? C.red : v > 0.4 ? C.amber : v > 0.2 ? C.green : C.blue;
      const rect = el("rect", {
        x: c * cw,
        y: r * ch,
        width: cw,
        height: ch,
        fill: col,
        opacity: 0,
        rx: 2,
        style: "mix-blend-mode:screen;transition:opacity .8s",
      });
      s.appendChild(rect);
      animate(target, () => setTimeout(() => rect.setAttribute("opacity", (v * 0.7).toFixed(2)), (r * cols + c) * 12));
    }),
  );
  mount(target, s);
}

export function formation(target: HTMLElement, players: FormationPlayer[], opts: { w?: number; h?: number; color?: string } = {}): void {
  refreshC();
  const w = opts.w || 300,
    h = opts.h || 420;
  const s = svg(w, h);
  drawPitch(s, w, h, true);
  const col = opts.color || C.blue;
  players.forEach((p) => {
    const x = p.x * w,
      y = p.y * h;
    const g = el("g", { opacity: 0, style: "transition:opacity .5s" });
    g.appendChild(el("circle", { cx: x, cy: y, r: 13, fill: "#0a1020", stroke: col, "stroke-width": 2 }));
    g.appendChild(el("circle", { cx: x, cy: y, r: 19, fill: "none", stroke: col, "stroke-width": 1, opacity: 0.25 }));
    const num = el("text", {
      x,
      y: y + 3.5,
      "text-anchor": "middle",
      fill: "#fff",
      "font-family": "JetBrains Mono",
      "font-size": 11,
      "font-weight": 700,
    });
    num.textContent = String(p.num);
    g.appendChild(num);
    if (p.name) {
      const nm = el("text", {
        x,
        y: y + 27,
        "text-anchor": "middle",
        fill: C.text,
        "font-family": "Inter",
        "font-size": 8.5,
        "font-weight": 600,
      });
      nm.textContent = p.name;
      g.appendChild(nm);
    }
    s.appendChild(g);
    animate(target, () => setTimeout(() => g.setAttribute("opacity", "1"), Math.random() * 400));
  });
  mount(target, s);
}

export function winprob(target: HTMLElement, data: WinProbDatum[], opts: { w?: number; h?: number } = {}): void {
  refreshC();
  const w = opts.w || 520,
    h = opts.h || 150,
    pad = { t: 8, r: 8, b: 18, l: 8 };
  const iw = w - pad.l - pad.r,
    ih = h - pad.t - pad.b;
  const X = (i: number) => pad.l + (i / (data.length - 1)) * iw;
  const s = svg(w, h);
  const bands: { key: "h" | "d" | "a"; color: string }[] = [
    { key: "h", color: C.blue },
    { key: "d", color: "#6b7689" },
    { key: "a", color: C.green },
  ];
  let base = data.map(() => 0);
  bands.forEach((b) => {
    const top = data.map((d, i) => base[i] + d[b.key]);
    const upper: Pt[] = top.map((v, i): Pt => [X(i), pad.t + ih - (v / 100) * ih]);
    const lower: Pt[] = base.map((v, i): Pt => [X(i), pad.t + ih - (v / 100) * ih]).reverse();
    const id = uid();
    const g = el("linearGradient", { id, x1: 0, y1: 0, x2: 0, y2: 1 });
    g.appendChild(el("stop", { offset: "0%", "stop-color": b.color, "stop-opacity": 0.55 }));
    g.appendChild(el("stop", { offset: "100%", "stop-color": b.color, "stop-opacity": 0.15 }));
    s.appendChild(g);
    const p = el("path", {
      d: path(upper) + " " + path(lower).replace("M", "L") + " Z",
      fill: `url(#${id})`,
      opacity: 0,
      style: "transition:opacity 1s",
    });
    s.appendChild(p);
    animate(target, () => p.setAttribute("opacity", "1"));
    base = top;
  });
  s.appendChild(
    el("line", { x1: pad.l, y1: pad.t + ih / 2, x2: w - pad.r, y2: pad.t + ih / 2, stroke: C.line, "stroke-width": 1, "stroke-dasharray": "3 4" }),
  );
  mount(target, s);
}

export function gauge(target: HTMLElement, value: number, opts: { size?: number; stroke?: number; label?: string } = {}): void {
  refreshC();
  const size = opts.size || 180,
    sw = opts.stroke || 14,
    r = size / 2 - sw,
    cx = size / 2,
    cy = size / 2;
  const s = svg(size, size * 0.62);
  const a0 = Math.PI,
    a1 = 0;
  const pt = (a: number): Pt => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  s.appendChild(
    el("path", {
      d: `M ${pt(a0)[0]} ${pt(a0)[1]} A ${r} ${r} 0 0 1 ${pt(a1)[0]} ${pt(a1)[1]}`,
      fill: "none",
      stroke: C.surf,
      "stroke-width": sw,
      "stroke-linecap": "round",
    }),
  );
  const id = uid();
  const g = el("linearGradient", { id });
  g.appendChild(el("stop", { offset: "0%", "stop-color": C.blue }));
  g.appendChild(el("stop", { offset: "100%", "stop-color": C.green }));
  s.appendChild(g);
  const len = Math.PI * r;
  const arc = el("path", {
    d: `M ${pt(a0)[0]} ${pt(a0)[1]} A ${r} ${r} 0 0 1 ${pt(a1)[0]} ${pt(a1)[1]}`,
    fill: "none",
    stroke: `url(#${id})`,
    "stroke-width": sw,
    "stroke-linecap": "round",
    "stroke-dasharray": len,
    "stroke-dashoffset": len,
  });
  s.appendChild(arc);
  const t = el("text", {
    x: cx,
    y: cy - 4,
    "text-anchor": "middle",
    fill: C.fg,
    "font-family": "JetBrains Mono",
    "font-size": size * 0.2,
    "font-weight": 700,
  });
  t.textContent = "0";
  s.appendChild(t);
  if (opts.label) {
    const l = el("text", {
      x: cx,
      y: cy + 14,
      "text-anchor": "middle",
      fill: C.dim,
      "font-family": "Inter",
      "font-size": size * 0.075,
      "font-weight": 600,
    });
    l.textContent = opts.label;
    s.appendChild(l);
  }
  mount(target, s);
  animate(target, () => {
    (arc as SVGElement).style.transition = "stroke-dashoffset 1.3s cubic-bezier(.3,1,.4,1)";
    arc.setAttribute("stroke-dashoffset", String(len * (1 - value / 100)));
    countUp(t, value, "", 1300);
  });
}

export const IXChart = { ring, donut, radar, line, momentum, bars, spark, heatmap, formation, winprob, gauge, C, refreshC };
