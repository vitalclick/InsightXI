/* ============================================================
   InsightXI — Leagues logic (standings from club data)
   ============================================================ */
window.addEventListener('DOMContentLoaded', function () {
  const D = IXData, X = IXChart, C = IXChart.C, I = window.IXIcons || {};
  document.querySelectorAll('[data-icon]').forEach(e => { e.innerHTML = I[e.dataset.icon] || ''; });

  const clubs = D.list.map(code => {
    const c = D.CLUBS[code];
    let d = c.pts % 3; while (d < 4) d += 3;            // realistic draw count
    const w = Math.round((c.pts - d) / 3);
    const l = c.pld - w - d;
    const gf = Math.round(c.xg * c.pld);
    const ga = gf - c.gd;
    return { code, ...c, w, d, l, gf, ga };
  }).sort((a, b) => a.pos - b.pos);

  function formDots(arr) { return `<span class="form-row">${arr.map(r => `<span class="fdot ${r.toLowerCase()}">${r}</span>`).join('')}</span>`; }

  document.getElementById('tableBody').innerHTML = clubs.map(c => {
    const zone = c.pos <= 3 ? 'var(--green)' : c.pos <= 5 ? 'var(--blue)' : c.pos >= 11 ? 'var(--red)' : 'transparent';
    return `<tr style="cursor:pointer" onclick="location.href='team.html'">
      <td><div class="flex aic gap-8"><span style="width:3px;height:18px;border-radius:2px;background:${zone}"></span><span class="mono" style="color:var(--text)">${c.pos}</span></div></td>
      <td><div class="flex aic gap-10">${D.crest(c.code, 'xs')}<span style="color:var(--text);font-weight:600">${c.name}</span></div></td>
      <td class="num">${c.pld}</td><td class="num">${c.w}</td><td class="num">${c.d}</td><td class="num">${c.l}</td>
      <td class="num">${c.gf}</td><td class="num">${c.ga}</td>
      <td class="num" style="color:${c.gd > 0 ? 'var(--green)' : c.gd < 0 ? 'var(--red)' : 'var(--text-2)'}">${c.gd > 0 ? '+' : ''}${c.gd}</td>
      <td>${formDots(c.form)}</td>
      <td class="num" style="font-weight:700;color:var(--text);font-size:14px">${c.pts}</td>
    </tr>`;
  }).join('');

  // Title race (top 3 projected points)
  const top3 = clubs.slice(0, 3);
  document.getElementById('titleRace').innerHTML = top3.map((c, i) => {
    const proj = c.pts + Math.round((38 - c.pld) * (c.pts / c.pld));
    const pct = [62, 28, 10][i];
    return `<div style="margin-bottom:14px">
      <div class="flex jcb aic" style="margin-bottom:7px">
        <div class="flex aic gap-9">${D.crest(c.code, 'xs')}<span style="font-weight:600;font-size:13px">${c.name}</span></div>
        <span class="mono" style="font-weight:700;color:${i === 0 ? 'var(--gold)' : 'var(--text-2)'}">${pct}%</span></div>
      <div class="meter ${i === 0 ? 'gold' : ''}" style="height:6px"><i data-w="${pct}" style="width:0"></i></div>
      <div class="dim" style="font-size:10.5px;margin-top:4px;font-family:var(--font-mono)">proj. ${proj} pts</div>
    </div>`;
  }).join('');
  setTimeout(() => document.querySelectorAll('#titleRace [data-w]').forEach(i => i.style.width = i.dataset.w + '%'), 300);

  // Top scorers — derive from squads
  const scorers = [];
  D.list.slice(0, 8).forEach(code => {
    const sq = D.makeSquad(code);
    const top = sq.slice().sort((a, b) => b.goals - a.goals)[0];
    scorers.push({ code, name: top.name, goals: top.goals + (code === 'RVS' ? 4 : 0), assists: top.assists });
  });
  scorers.sort((a, b) => b.goals - a.goals);
  document.getElementById('topScorers').innerHTML = scorers.slice(0, 6).map((s, i) => `
    <div class="flex aic gap-12" style="padding:9px 0;${i < 5 ? 'border-bottom:1px solid var(--line)' : ''}">
      <span class="mono dim" style="width:14px">${i + 1}</span>
      ${D.crest(s.code, 'xs')}
      <div style="flex:1"><div style="font-size:13px;font-weight:600">${s.name}</div><div class="dim" style="font-size:10.5px">${D.CLUBS[s.code].short} · ${s.assists} assists</div></div>
      <span class="mono" style="font-weight:700;font-size:15px;color:var(--green)">${s.goals}</span>
    </div>`).join('');

  // Form table (by form points last 5)
  const formPts = c => c.form.reduce((s, r) => s + (r === 'W' ? 3 : r === 'D' ? 1 : 0), 0);
  const formRanked = clubs.slice().sort((a, b) => formPts(b) - formPts(a)).slice(0, 5);
  document.getElementById('formTable').innerHTML = formRanked.map((c, i) => `
    <div class="flex aic gap-12" style="padding:9px 0;${i < 4 ? 'border-bottom:1px solid var(--line)' : ''}">
      <span class="mono dim" style="width:14px">${i + 1}</span>
      ${D.crest(c.code, 'xs')}
      <span style="flex:1;font-size:13px;font-weight:600">${c.name}</span>
      ${formDots(c.form)}
      <span class="mono" style="font-weight:700;width:24px;text-align:right;color:var(--blue-2)">${formPts(c)}</span>
    </div>`).join('');
});
