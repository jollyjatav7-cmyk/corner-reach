/* ================= 画面 ================= */
const FLAG = '<svg viewBox="0 0 18 18" aria-hidden="true"><path d="M4 17V1.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M4.8 2h10l-3 3.2 3 3.2h-10z" fill="currentColor"/></svg>';
const PLAY = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9.5-5.5z" fill="currentColor"/></svg>';
const PAUSE = '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="2.5" width="3" height="11" rx="1" fill="currentColor"/><rect x="9.5" y="2.5" width="3" height="11" rx="1" fill="currentColor"/></svg>';
const IC = {
  undo: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 5L3 9l4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.5 9H12a4.5 4.5 0 010 9H9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  stats: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3.5v13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><rect x="3" y="5" width="6" height="3" rx="1.2" fill="currentColor"/><rect x="11" y="5" width="4" height="3" rx="1.2" fill="currentColor" opacity=".55"/><rect x="5" y="12" width="4" height="3" rx="1.2" fill="currentColor"/><rect x="11" y="12" width="6" height="3" rx="1.2" fill="currentColor" opacity=".55"/></svg>',
  list: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 6h10M7 10h10M7 14h10" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="3.5" cy="6" r="1.2" fill="currentColor"/><circle cx="3.5" cy="10" r="1.2" fill="currentColor"/><circle cx="3.5" cy="14" r="1.2" fill="currentColor"/></svg>',
  arch: '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="3" width="15" height="4" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M4 7v9a1 1 0 001 1h10a1 1 0 001-1V7M8 10.5h4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  menu: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 6h12M4 10h12M4 14h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  sync: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M16 10a6 6 0 1 1-1.8-4.3M16 3.5v3.5h-3.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};
const teamName = i => (i ? M.a : M.h).trim() || (i ? '客队' : '主队');
const isOpen = e => OC.some(o => o && o.k === e.k);
function evLabel(e){
  if (e.c === 'ar'){
    const open = isOpen(e) && !isDone(e.pa);
    if (open && !e.pa) return '到达 · 选择中';
    return '到达' + (e.pa ? ' › ' + paLabel(e.pa) : ' · 没选') + (ok(e.dt) ? '（' + fmtS(e.dt) + ' 秒）' : '') + (open ? ' …' : '');
  }
  if (e.c === 'ck') return e.b ? '角球（加入前）' : '其他角球';
  if (e.c === 'gl') return e.b ? '进球（补录）' : '进球';
  return SIMPLE[e.c] || e.c;
}
const svLabel = s => SVF[s.f].s + ' → ' + svText(s.f, s.v);

function renderHeader(){
  const fh = $('#fH'), fa = $('#fA'), fl = $('#fLg');
  for (const el of [fh, fa, fl]) el.readOnly = M.st === 2;
  if (document.activeElement !== fh) fh.value = M.h;
  if (document.activeElement !== fa) fa.value = M.a;
  if (document.activeElement !== fl) fl.value = M.lg;
  $('#mDate').textContent = M.d + (M.st === 2 ? ' · 已结束' : '');
  const sc = score(M), ck = cornersOf(M, 'ft');
  $('#glH').textContent = sc[0]; $('#glA').textContent = sc[1];
  const p = curP(), ck2 = cornersOf(M, 'h2');
  $('#ckH').textContent = '角球 ' + ck[0] + (p === 2 && ck[0] !== ck2[0] ? '（下 ' + ck2[0] + '）' : '');
  $('#ckA').textContent = '角球 ' + ck[1] + (p === 2 && ck[1] !== ck2[1] ? '（下 ' + ck2[1] + '）' : '');
  tickClock();
}
function tickClock(){
  const p = M.tm.p, t = clockOf(M), run = !!M.tm.r;
  $('#clkT').textContent = M.tm.ht ? '中场' : fmtClock(p, t);
  $('#perL').textContent = M.st === 2 ? '已结束' : M.tm.ht ? '休息' : PER[p][2];
  $('#clk').classList.toggle('idle', !run);
  const rb = $('#runBtn'); rb.innerHTML = run ? PAUSE : PLAY; rb.classList.toggle('on', run);
  rb.setAttribute('aria-label', run ? '暂停计时' : (M.tm.ht ? '下半场开球' : '开始计时'));
}
function renderMode(){
  document.body.classList.toggle('qmode', PREF.mode === 'q');
  $$('#mseg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === PREF.mode)));
}

/* ---------- 到达与选择：每队一栏 ---------- */
const OC = [null, null];   // 正在选的那次到达：{ k 事件, at 按到达的时间(毫秒，0＝不详), dt 第一次选择的用时 }
let lastAdd = null;        // 刚点的事件（撤销按钮会亮一下）
function ocEv(i){ const o = OC[i]; if (!o) return null; const e = evByK(o.k); if (!e || e.c !== 'ar' || isDone(e.pa)){ OC[i] = null; return null; } return e; }
function lastArr(i){ let best = null; for (const e of M.ev) if (e.i === i && e.c === 'ar' && (!best || e.k > best.k)) best = e; return best; }
const ocSecs = i => OC[i] && OC[i].at ? (Date.now() - OC[i].at) / 1000 : null;
function p1SumHTML(i){
  return '<div class="p1s" role="group" aria-label="第一部分：点一项修改">' + P1.map(x => {
    const s = svCur(M, i, x.f), v = s ? s.v : null;
    return '<button data-a="p1" data-i="' + i + '" data-f="' + x.f + '" aria-label="' + x.n + '：' + (v == null ? '未选' : x.o[v]) + '"><em>' + x.s + '</em><b' + (v == null ? ' class="na"' : '') + '>' + (v == null ? '未选' : x.ab[v]) + '</b></button>';
  }).join('') + '</div>';
}
function optBtn(i, c, name, o){
  o = o || {};
  return '<button class="k' + (o.r ? ' res-' + o.r : '') + '" data-a="pick" data-i="' + i + '" data-v="' + c + '">' + (o.dot ? '<i class="' + o.dot + '"></i>' : '')
    + '<span class="lw"><span class="l">' + name + '</span>' + (o.sub ? '<small>' + o.sub + '</small>' : '') + '</span>' + (o.n != null ? '<span class="c">' + o.n + '</span>' : '') + '</button>';
}
function stageHTML(i, r){
  const e = ocEv(i);
  if (!e){
    const last = lastArr(i);
    const head = last ? '<span class="last">上一次：' + esc(last.pa ? paLabel(last.pa) : '没选') + (ok(last.dt) ? ' · ' + fmtS(last.dt) + ' 秒' : '') + '</span>' : '<span class="last">到了对方禁区附近点“到达”，做出选择时再点</span>';
    return '<div class="stage idle"><div class="sth">' + head + '</div><div class="sto n5">' + CH.map(c => optBtn(i, c, CHN[c], { dot: CHC[c], n: r.ch[c] })).join('') + '</div></div>';
  }
  const pa = e.pa || '', nd = tipOf(pa);
  if (!pa){
    const s = ocSecs(i);
    return '<div class="stage open"><div class="sth"><span class="pulse"></span><span class="tm" id="tm' + i + '">' + (s == null ? '—' : fmtS(s)) + '<small>秒</small></span><span class="q">选哪一个？</span></div>'
      + '<div class="sto n5">' + CH.map(c => optBtn(i, c, CHN[c], { dot: CHC[c], n: r.ch[c] })).join('') + '</div>'
      + '<div class="stf"><button data-a="stx" data-i="' + i + '">取消这次到达</button><button data-a="ste" data-i="' + i + '">没选就结束</button></div></div>';
  }
  return '<div class="stage open"><div class="sth deep"><span class="crumb"><b>' + esc(paLabel(pa)) + '</b>' + (ok(e.dt) ? ' · ' + fmtS(e.dt) + ' 秒' : '') + '</span><span class="q">' + nd.q + '</span></div>'
    + '<div class="sto n' + nd.o.length + '">' + nd.o.map(c => { const x = nd.k[c]; return optBtn(i, c, x.n, { sub: x.d, r: x.r, dot: x.bs ? 'c-' + pa[0] : null }); }).join('') + '</div>'
    + '<div class="stf"><button data-a="stb" data-i="' + i + '">返回</button><button data-a="ste" data-i="' + i + '">先这样，结束</button></div></div>';
}
function recPadHTML(i, sc){
  const r = statOf(M, i, sc), last = lastOf(i);
  const hot = last && lastAdd && lastAdd.k === last.k && Date.now() - lastAdd.at < 8000;
  return '<div class="pad-h"><i></i><b>' + esc(teamName(i)) + '</b><span class="who">' + (i ? '客对主' : '主对客') + ' · ' + SCN[sc] + '</span><span class="sp"></span>'
    + '<button class="undo' + (hot ? ' hot' : '') + '" data-a="undoT" data-i="' + i + '" ' + (last ? '' : 'disabled') + '>撤销</button></div>'
    + p1SumHTML(i)
    + '<div class="board"><button class="k arb' + (ocEv(i) ? ' on' : '') + '" data-a="ar" data-i="' + i + '"><span class="l">到达</span><span class="c">' + r.ar + '</span></button>'
    + stageHTML(i, r)
    + '<button class="k ckb" data-a="ck" data-i="' + i + '">' + FLAG + '<span class="l">其他角球</span><span class="c">' + r.cks.o + '</span></button></div>';
}
/* ---------- 两个问题：每队一栏，字大 ---------- */
function qPadHTML(i){
  let h = '<div class="pad-h"><i></i><b>' + esc(teamName(i)) + '</b><span class="who">' + (i ? '客对主' : '主对客') + '</span><span class="sp"></span>'
    + '<button class="qck" data-a="ck" data-i="' + i + '" aria-label="' + esc(teamName(i)) + ' 角球加一">' + FLAG + '<span>角球</span><b>' + statOf(M, i, 'ft').ck + '</b><small>＋1</small></button></div>';
  for (const q of QS){
    const s = svCur(M, i, q.f), v = s ? s.v : null;
    let prev = null; for (const x of M.sv) if (x.i === i && x.f === q.f && s && x.k !== s.k && (!prev || x.k > prev.k)) prev = x;
    const note = v == null ? '还没选' : fmtMin(s.p, s.t) + ' 选的' + (prev && prev.v != null ? '（之前 ' + (prev.v + 1) + '）' : '');
    h += '<div class="qcard"><div class="qh"><h3 class="qq">' + q.n + '</h3><span class="qnote">' + note + '</span></div><div class="qlv">'
      + q.o.map((lab, j) => '<button data-a="qv" data-i="' + i + '" data-f="' + q.f + '" data-v="' + j + '" aria-pressed="' + (v === j) + '" aria-label="' + q.n + ' ' + (j + 1) + ' ' + lab + '"><b>' + (j + 1) + '</b><small>' + lab + '</small></button>').join('') + '</div></div>';
  }
  return h;
}
function renderPads(){
  document.body.classList.toggle('ended', M.st === 2);
  if (M.st === 2){
    const sc = score(M), ck = cornersOf(M, 'ft');
    $('.pad[data-i="0"]').innerHTML = '<div class="endc"><h2>这场已经结束</h2>'
      + '<p class="es"><span class="h">' + esc(teamName(0)) + '</span> ' + sc[0] + '–' + sc[1] + ' <span class="a">' + esc(teamName(1)) + '</span><br>角球 ' + ck[0] + '–' + ck[1] + '</p>'
      + '<p class="hint">' + (M.keep ? '已加入比赛仓库，可以在仓库里导出、看统计。' : '这场没有加入比赛仓库。') + '</p>'
      + '<button class="pill green bigp" data-a="new">开始新比赛</button>'
      + '<button class="pill bigp" data-a="arch">看比赛仓库</button>'
      + '<button class="linkb" data-a="reopen">要接着记录这场：重新打开</button></div>';
    $('.pad[data-i="1"]').innerHTML = '';
    return;
  }
  const sc = 'h' + curP();
  for (const i of [0, 1]) $('.pad[data-i="' + i + '"]').innerHTML = PREF.mode === 'q' ? qPadHTML(i) : recPadHTML(i, sc);
}
/* 最近的一笔（事件或主观选择） */
function lastAny(){
  let best = null, kind = null;
  for (const e of M.ev) if (!e.b && (!best || e.k > best.k)){ best = e; kind = 'ev'; }
  for (const s of M.sv) if (!best || s.k > best.k){ best = s; kind = 'sv'; }
  return best ? { x: best, kind: kind } : null;
}
function renderStrip(){
  const la = lastAny();
  $('#qbUndo').innerHTML = IC.undo + '<span>撤销</span>';
  $('#qbUndo').disabled = !la;
  $('#qbList').innerHTML = IC.list + '<span>全部记录</span>';
  $('#qbStats').innerHTML = IC.stats + '<span>统计</span>';
  $('#qbArch').innerHTML = IC.arch + '<span>仓库</span>';
  $('#qbMenu').innerHTML = IC.menu + '<span>功能</span>';
  const rec = M.ev.filter(e => !e.b).map(e => ({ k: e.k, p: e.p, t: e.t, i: e.i, l: evLabel(e) })).concat(M.sv.map(s => ({ k: s.k, p: s.p, t: s.t, i: s.i, l: svLabel(s) })))
    .sort((a, b) => b.k - a.k).slice(0, 3);
  $('#recent').innerHTML = rec.length ? rec.map(e => '<button data-a="list"><span class="t">' + fmtClock(e.p, e.t) + '</span><span class="d' + e.i + '">' + esc(teamName(e.i)) + '</span>' + esc(e.l) + '</button>').join('') : '<span class="empty">开球时按时间旁边的 ▶；到了对方禁区附近点“到达”</span>';
}
function renderAll(){
  renderMode(); renderHeader(); renderPads(); renderStats(); renderStrip(); renderNet();
}
/* 计时器每秒更新时间；统计每 15 秒更新（时间在走，每 10 分钟的次数会变） */
let lastSlow = 0;
setInterval(() => {
  tickClock();
  if (M.api && M.api.hold && M.api.hold.length) flushHold();
  if (M.api && apiKey() && NET.iv > 0 && M.st === 1 && isRecording() && !netBusy && sheet.hidden && LIVE_ST.indexOf(M.api.st) >= 0 && nowSec() - (M.api.at || 0) >= NET.iv) apiSync(false);
  if (Date.now() - lastSlow > 15000 && M.tm.r){ lastSlow = Date.now(); renderStats(); }
  if (sheetKind === 'join' && sheetData.tp && sheetData.tp.live) tpShow(sheetData.tp);
  if (sheetKind === 'clock'){ const b = $('#shClk'); if (b) b.textContent = M.tm.ht ? '中场' : fmtClock(M.tm.p, clockOf(M)); if (sheetData.tp && sheetData.tp.live) tpShow(sheetData.tp); }
}, 1000);
/* 到达后的秒数：每 0.2 秒更新那一个数字 */
setInterval(() => {
  for (const i of [0, 1]){
    if (!OC[i]) continue;
    const el = document.getElementById('tm' + i); if (!el) continue;
    const s = ocSecs(i); if (s == null) continue;
    el.firstChild.nodeValue = fmtS(s);
  }
}, 200);

/* ================= 记录 ================= */
function flash(sel){ const b = $(sel); if (!b) return; b.classList.remove('hit'); b.getBoundingClientRect(); b.classList.add('hit'); }
/* 已结束的这场不能再记：提示开始新比赛（要接着记就用“重新打开这场”） */
function endedToast(){ showToast('这场已经结束。要记下一场，按“开始新比赛”', startNew, '开始新比赛', 7000); }
function clockTip(){ if (!M.tm.r && !M.tm.ht && M.st !== 2 && M.ev.filter(x => !x.b).length === 1) showToast('计时还没开始：开球时按时间旁边的 ▶，或点时间设定', () => openClock(), '设定时间'); }
/* 防手滑：同一队 0.4 秒内又按“到达”、0.22 秒内连点选择（画面刚换，第二下会点到下一层），当作同一下；
   一次到达刚选完，0.5 秒内再点到选择也不算新的一次 */
const tapAt = [0, 0], doneAt = [0, 0];
function tapArrive(i){
  if (M.st === 2){ endedToast(); return; }
  const o = ocEv(i);
  if (o && !o.pa && Date.now() - tapAt[i] < 400) return;
  tapAt[i] = Date.now();
  const e = addEv(i, 'ar', { pa: '' });
  OC[i] = { k: e.k, at: Date.now(), dt: null };
  lastAdd = { k: e.k, i: i, at: Date.now() };
  renderAll();
  flash('.pad[data-i="' + i + '"] [data-a="ar"]');
  clockTip();
}
let noArrTip = 0;
function pick(i, c){
  if (M.st === 2){ endedToast(); return; }
  let e = ocEv(i);
  const now = Date.now();
  if (now - tapAt[i] < 220 && e && e.pa) return;
  if (!e && now - doneAt[i] < 500) return;
  tapAt[i] = now;
  if (!e){
    if (CH.indexOf(c) < 0) return;
    // 没按“到达”就直接点选择：也算一次到达，用时不详
    e = addEv(i, 'ar', { pa: '' });
    OC[i] = { k: e.k, at: 0, dt: null };
    lastAdd = { k: e.k, i: i, at: Date.now() };
    if (!noArrTip){ noArrTip = 1; showToast('没按“到达”直接点了选择：也算一次到达，用时记成不详'); }
  }
  const nd = tipOf(e.pa);
  if (!nd.o || nd.o.indexOf(c) < 0) return;
  if (!e.pa){
    const o = OC[i];
    const dt = o.dt != null ? o.dt : o.at ? Math.round((Date.now() - o.at) / 100) / 10 : null;
    if (dt != null) e.dt = dt; else delete e.dt;
    o.dt = dt;
  }
  e.pa += c;
  const res = resOf(e.pa);
  const merged = res === 'c' ? mergeAuto(i, 'ck') : res === 'g' ? mergeAuto(i, 'gl') : false;
  const done = isDone(e.pa);
  if (done){ OC[i] = null; doneAt[i] = now; }
  save(); renderAll();
  if (done) flash('.pad[data-i="' + i + '"] [data-a="ar"]');
  if (res === 'g') showToast(teamName(i) + ' 进球 ' + score(M).join('–') + (merged ? '（跟联网补上的那球合并）' : ''));
  else if (res === 'c') showToast(teamName(i) + ' 角球，共 ' + cornersOf(M, 'ft')[i] + ' 个' + (merged ? '（跟联网补上的角球合并）' : ''));
  clockTip();
}
function stageBack(i){
  const e = ocEv(i); if (!e || !e.pa) return;
  e.pa = e.pa.slice(0, -1);
  save(); renderAll();
}
function stageEnd(i){ OC[i] = null; renderAll(); }
function stageCancel(i){
  const e = ocEv(i); OC[i] = null;
  if (!e){ renderAll(); return; }
  removeEv(e); renderAll();
  showToast('已取消这次到达', () => { M.ev.push(e); M.ev.sort(byTime); save(); renderAll(); }, '恢复');
}
function tapCorner(i){
  if (M.st === 2){ endedToast(); return; }
  const s = nowStamp();
  const dup = M.ev.some(e => e.i === i && e.c === 'ar' && resOf(e.pa) === 'c' && e.p === s.p && s.t >= e.t && s.t - e.t <= 60);
  const merged = mergeAuto(i, 'ck');
  const e = addEv(i, 'ck');
  lastAdd = { k: e.k, i: i, at: Date.now() };
  renderAll();
  flash('.pad[data-i="' + i + '"] [data-a="ck"]');
  if (dup) showToast('刚才那次到达已经记了角球，这个会再多算一个', () => { removeEv(e); renderAll(); }, '撤销', 7000);
  else showToast(teamName(i) + ' 角球，共 ' + cornersOf(M, 'ft')[i] + ' 个' + (merged ? '（跟联网补上的角球合并）' : ''));
  clockTip();
}
function pickQ(i, f, v){
  if (M.st === 2){ endedToast(); return; }
  const cur = svCur(M, i, f);
  if (cur && cur.v === v) return;
  setSv(i, f, v);
  renderAll();
}
function undoTeam(i){
  const e = lastOf(i); if (!e) return;
  if (OC[i] && OC[i].k === e.k) OC[i] = null;
  removeEv(e); renderAll();
  showToast('已撤销 ' + teamName(e.i) + ' ' + evLabel(e), () => { M.ev.push(e); M.ev.sort(byTime); save(); renderAll(); }, '恢复');
}
function undoAny(){
  const la = lastAny(); if (!la) return;
  if (la.kind === 'ev'){ undoTeam(la.x.i); return; }
  const s = la.x, j = M.sv.indexOf(s);
  if (j >= 0) M.sv.splice(j, 1);
  save(); renderAll(); if (sheetKind === 'p1') renderSheet();
  showToast('已撤销 ' + teamName(s.i) + ' ' + svLabel(s), () => { M.sv.push(s); M.sv.sort(byTime); save(); renderAll(); if (sheetKind === 'p1') renderSheet(); }, '恢复');
}
