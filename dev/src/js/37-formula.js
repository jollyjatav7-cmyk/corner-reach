/* ================= 角球公式 =================
   角球指数 = x × [ y + (1 − y − h) × z ]，z = 1 ÷ (1 + 3 × a × b)
   x 到达次数、y 传中和远射占比、h 回传占比、a 打门门槛、b 对方禁区内防守（a、b 的 1 是联赛平均，没设时按 1 算）。
   画面上两队同一项上下排在一起，可以直接比较比例；y、h 在同一条轴上（两个滑块分成传中远射、中路渗透、回传三段）。
   跟两个问题一样每次放开都记下时间；拖的时候上方的结果跟着算。
   两队对比：大的是小的 2 倍以上才下判断。高于／低于平均：比联赛平均线高或低 10% 以上。
   联赛平均（FAVG）不属于哪一场，一直留着。指数只用来比较高低，不是角球数。 */
const FK = 3, FRATIO = 2, FNEAR = 0.1;
const FAVK = 'corner-reach-favg';
function fixFavg(o){
  const n = (v, hi) => v == null || v === '' || !isFinite(+v) ? null : clamp(r1(+v), 0, hi);
  o = o && typeof o === 'object' ? o : {};
  const r = { x: n(o.x, 80), y: n(o.y, 100), h: n(o.h, 100) };
  if (r.y != null && r.h != null && r.y + r.h > 100) r.h = r1(100 - r.y);
  return r;
}
let FAVG = fixFavg(LS.get(FAVK, null));
let FDRAG = null;   // 正在拖的那一条：{ x 哪一条, v 拖到哪里 }（还没记下）
let FAVD = null;    // 联赛平均的到达次数正在拖到哪里
const favOn = () => FAVG.x != null && FAVG.y != null && FAVG.h != null;

/* 公式本身：y、h 是百分比 */
function fCalc(x, y, h, a, b){
  const wide = y / 100, mid = Math.max(0, 1 - wide - h / 100), z = 1 / (1 + FK * a * b);
  return { z: z, mid: mid, cross: x * wide, centre: x * mid * z, s: x * (wide + mid * z) };
}
/* 这一队现在的值（正在拖的那一条用拖到的位置） */
function fVals(i){
  const out = {};
  for (const q of FS){
    const k = i + '_' + q.f, s = svCur(M, i, q.f);
    out[q.f] = FDRAG && FDRAG.x === k && slBusy() ? FDRAG.v : s && s.v != null ? s.v : null;
  }
  if (TRI && TRI.on && TRI.kind === 'f' && +TRI.x === i){ out.fy = TRI.y; out.fh = TRI.h; }
  return out;
}
/* ok＝到达次数和选择都设了才算。选择的轴拖过一个滑块就算设了（另一段是 0）；a、b 没设时按 1 */
function fTeam(i){
  const v = fVals(i), miss = [];
  if (v.fx == null) miss.push('到达次数');
  if (v.fy == null && v.fh == null) miss.push('到达后的选择');
  if (miss.length) return { ok: false, v: v, miss: miss };
  const a = v.fa == null ? 1 : v.fa, b = v.fb == null ? 1 : v.fb;
  return Object.assign({ ok: true, v: v, a: a, b: b, miss: [] }, fCalc(v.fx, v.fy || 0, v.fh || 0, a, b));
}
/* 联赛平均线：平均的到达次数和选择，a、b 都是 1 */
function fLine(){
  const d = TRI && TRI.on && TRI.kind === 'fav' ? TRI : null;
  const x = FAVD && slBusy() ? FAVD.v : FAVG.x, y = d ? d.y : FAVG.y, h = d ? d.h : FAVG.h;
  return x == null || y == null || h == null ? null : fCalc(x, y, h, 1, 1).s;
}
function fTag(s, line){
  if (line == null || !(line > 0)) return null;
  const r = s / line;
  return r >= 1 + FNEAR - 1e-9 ? { k: 'up', t: '高于平均' } : r <= 1 - FNEAR + 1e-9 ? { k: 'dn', t: '低于平均' } : { k: 'mid', t: '接近平均' };
}
/* 两队对比：i＝指数大的那队；r＝倍数（对方是 0 时是 Infinity）；clear＝到了 2 倍 */
function fJudge(a, b){
  if (!a.ok || !b.ok) return null;
  const big = Math.max(a.s, b.s), small = Math.min(a.s, b.s);
  if (big <= 0) return { same: 1, r: 1 };
  if (Math.abs(a.s - b.s) < 1e-9) return { same: 1, r: 1 };
  const r = small > 0 ? big / small : Infinity;
  return { i: a.s > b.s ? 0 : 1, r: r, clear: r >= FRATIO - 1e-9 };
}

/* ---------- 三种选择：一条轴、两个滑块 ----------
   triHTML(种类, 参数, y, h, 设定)：左边的滑块在 y，右边的滑块在 100 − h，中间一段就是中路渗透，加起来一定是 100%。
   拖左边的只改 y，拖右边的只改 h，两个滑块不能交叉；叠在一起时看手指往哪边动（往左是左边的，往右是右边的）。
   按在滑块上是接着它现在的位置拖（不会跳）；按在轴的其他地方，比较近的滑块移过来。放开才记下（TRK[种类].commit）。 */
const TRK = {
  f: {
    live(x){ setTx('fcalc_' + x, fCalcHTML(fTeam(+x))); renderFres(); },
    commit(x, T){ if (T.y !== T.y0) pickQ(+x, 'fy', T.y); if (T.h !== T.h0) pickQ(+x, 'fh', T.h); }
  },
  fav: {
    live(){ setTx('favLine', favLineHTML()); renderFres(); },
    commit(x, T){ FAVG.y = T.y; FAVG.h = T.h; LS.set(FAVK, FAVG); }
  }
};
function triParts(y, h){
  const Y = clamp(y == null ? 0 : y, 0, 100), H = clamp(h == null ? 0 : h, 0, r1(100 - Y));
  return { y: Y, h: H, m: r1(100 - Y - H) };
}
function triSegs(p){
  const seg = (c, v) => '<i class="tri-s ' + c + '" style="width:' + v + '%">' + (v >= 10 && !hideNum() ? '<b>' + fp(v) + '<small>%</small></b>' : '') + '</i>';
  return seg('c-x', p.y) + seg('c-m', p.m) + seg('c-b', p.h);
}
function triHTML(kind, x, y, h, o){
  const un = y == null && h == null, p = triParts(y, h);
  const knob = (k, pos, name, val) => '<span class="tri-k k' + k + '" data-k="' + k + '" role="slider" tabindex="0" style="left:' + pos + '%" aria-label="' + esc(o.lab + ' ' + name) + '" aria-valuemin="0" aria-valuemax="100"' + (un ? ' aria-valuetext="还没设"' : ' aria-valuenow="' + val + '"') + '></span>';
  return '<div class="tri ' + o.cls + (un ? ' na' : '') + '" data-tri="' + kind + '" data-x="' + esc(x) + '" data-y="' + p.y + '" data-h="' + p.h + '"><div class="tri-r">'
    + '<div class="tri-t">' + triSegs(p) + (un ? '<span class="tri-hint">拖动两端的滑块</span>' : '') + '</div>'
    + knob('y', p.y, '传中和远射占比', p.y) + knob('h', r1(100 - p.h), '回传占比', p.h)
    + '<span class="tri-tip" aria-hidden="true"></span></div></div>';
}
function triShow(T){
  const el = T.el, p = triParts(T.y, T.h), ky = el.querySelector('.ky'), kh = el.querySelector('.kh'), tip = el.querySelector('.tri-tip');
  el.classList.remove('na');
  el.querySelector('.tri-t').innerHTML = triSegs(p);
  ky.style.left = p.y + '%'; kh.style.left = r1(100 - p.h) + '%';
  ky.classList.toggle('top', T.k === 'y'); kh.classList.toggle('top', T.k === 'h');
  for (const [n, v] of [[ky, p.y], [kh, p.h]]){ n.setAttribute('aria-valuenow', v); n.removeAttribute('aria-valuetext'); }
  el.dataset.y = p.y; el.dataset.h = p.h;
  if (!hideNum()){ tip.textContent = '传中远射 ' + fp(p.y) + '% · 中路渗透 ' + fp(p.m) + '% · 回传 ' + fp(p.h) + '%'; el.classList.toggle('drag', !!T.touch || !!T.mouse); }
  TRK[T.kind].live(T.x, T);
}
function triPct(el, cx){ const r = el.querySelector('.tri-r').getBoundingClientRect(); return r.width > 0 ? clamp((cx - r.left) / r.width * 100, 0, 100) : 0; }
const triSnap = v => { const st = pctStep(); return clamp(+(Math.round(v / st) * st).toFixed(2), 0, 100); };
/* 把正在拖的滑块放到轴上的 v（不能越过另一个） */
function triPut(T, v){
  if (T.k === 'y') T.y = Math.min(v, r1(100 - T.h)); else T.h = clamp(r1(100 - v), 0, r1(100 - T.y));
}
function triBegin(el, cx, cy, touch){
  const y = +el.dataset.y, h = +el.dataset.h, p2 = r1(100 - h), px = triPct(el, cx), w = el.querySelector('.tri-r').getBoundingClientRect().width, R = w > 0 ? 16 / w * 100 : 6;
  const T = { el: el, kind: el.dataset.tri, x: el.dataset.x, y: y, h: h, y0: y, h0: h, k: null, off: 0, jump: null, px0: px, cx0: cx, cy0: cy, touch: touch, mouse: !touch, on: false };
  if (p2 - y <= R && px >= y - R && px <= p2 + R) return T;   // 两个滑块叠在一起：看手指往哪边动
  T.k = Math.abs(px - y) <= Math.abs(px - p2) ? 'y' : 'h';
  const pos = T.k === 'y' ? y : p2;
  if (Math.abs(px - pos) <= R) T.off = px - pos; else T.jump = triSnap(px);
  return T;
}
function triGo(T){ T.on = true; if (T.jump != null){ triPut(T, T.jump); T.jump = null; triShow(T); } }
function triMove(T, cx){
  if (!T.k){
    const dx = cx - T.cx0; if (Math.abs(dx) < 3) return;
    T.k = dx < 0 ? 'y' : 'h'; T.off = T.px0 - (T.k === 'y' ? T.y : r1(100 - T.h));
  }
  triPut(T, triSnap(triPct(T.el, cx) - T.off)); triShow(T);
}
function triEnd(T){
  TRI = null; rdPend = 0;
  if (T.y !== T.y0 || T.h !== T.h0) TRK[T.kind].commit(T.x, T);
  renderAll(); if (!sheet.hidden) renderSheet();
}
const triOf = t => t && t.closest ? t.closest('.tri') : null;
document.addEventListener('touchstart', ev => {
  const el = triOf(ev.target); if (!el || ev.touches.length !== 1) return;
  const t = ev.touches[0]; slTouchAt = Date.now();
  TRI = triBegin(el, t.clientX, t.clientY, 1);
  if (el.classList.contains('lock')){ ev.preventDefault(); triGo(TRI); }
}, { passive: false });
document.addEventListener('touchmove', ev => {
  if (!TRI || !TRI.touch) return;
  const t = ev.touches[0]; if (!t) return;
  if (!TRI.on){   // 视窗里：先往左右移才开始拖，往上下就是捲动
    const dx = Math.abs(t.clientX - TRI.cx0), dy = Math.abs(t.clientY - TRI.cy0);
    if (dx > 6 && dx >= dy) triGo(TRI); else { if (dy > 8){ TRI = null; slFlush(); } return; }
  }
  if (ev.cancelable) ev.preventDefault();
  triMove(TRI, t.clientX);
}, { passive: false });
document.addEventListener('touchend', ev => {
  if (!TRI || !TRI.touch) return;
  const T = TRI; slTouchAt = Date.now();
  if (ev.cancelable) ev.preventDefault();
  if (!T.on) triGo(T);
  triEnd(T);
}, { passive: false });
document.addEventListener('touchcancel', () => { if (TRI && TRI.touch){ TRI = null; rdPend = 1; slFlush(); } });
document.addEventListener('mousedown', ev => {
  if (Date.now() - slTouchAt < 800 || ev.button !== 0) return;
  const el = triOf(ev.target); if (!el) return;
  ev.preventDefault();
  TRI = triBegin(el, ev.clientX, ev.clientY, 0); triGo(TRI);
});
document.addEventListener('mousemove', ev => { if (TRI && !TRI.touch) triMove(TRI, ev.clientX); });
document.addEventListener('mouseup', () => { if (TRI && !TRI.touch) triEnd(TRI); });
document.addEventListener('keydown', ev => {
  const n = ev.target && ev.target.classList && ev.target.classList.contains('tri-k') ? ev.target : null; if (!n) return;
  const st = pctStep(), D = { ArrowRight: st, ArrowUp: st, ArrowLeft: -st, ArrowDown: -st, PageUp: 10, PageDown: -10, Home: -100, End: 100 }[ev.key];
  if (D == null) return;
  ev.preventDefault();
  const el = n.closest('.tri'), T = triBegin(el, 0, 0, 0), k = n.dataset.k;
  T.k = k; T.mouse = false; T.on = true; TRI = T;
  triPut(T, clamp(+((k === 'y' ? T.y : r1(100 - T.h)) + D).toFixed(2), 0, 100)); triShow(T);
  triEnd(T);
  const again = $$('.tri').filter(e => e.dataset.tri === T.kind && e.dataset.x === T.x)[0];
  if (again) again.querySelector('.k' + k).focus();
});

/* ---------- 两队放在同一块：同一项的两条上下对齐 ---------- */
const fNum = (q, v) => q.step === 0.1 ? v.toFixed(1) : fp(v);
const fUnit = q => q.u == null ? '%' : q.u.trim();
function fValHTML(q, v){
  if (v == null) return q.def != null ? '默认 ' + q.def : '未设';
  if (hideNum()) return '<span class="nh" title="数字已隐藏">' + ICE.off + '</span>';
  return fNum(q, v) + (fUnit(q) ? '<small>' + fUnit(q) + '</small>' : '');
}
/* d＝这一行是哪一队；own＝这一行是那一队自己的防守，记在对方的 b 上（算对方的指数时用） */
function fNumRow(g, d, vals){
  const q = SVF[g.f], i = g.own ? 1 - d : d, v = vals[i][g.f], x = i + '_' + g.f;
  return '<div class="fl ' + (d ? 'a' : 'h') + '"><div class="flv"><span class="fln">' + esc(teamName(d)) + '</span><span class="flx"><span class="fval' + (v == null ? ' na' : '') + '" id="fv_' + x + '">' + fValHTML(q, v) + '</span><span class="fw" id="fw_' + x + '">' + wordHTML(q.f, v) + '</span></span></div>'
    + slHTML('f', x, v, { lo: q.min, hi: q.max, st: q.step, u: q.u, cls: 'big lock ' + (d ? 'a' : 'h'), lab: teamName(d) + ' ' + g.t }) + '</div>';
}
function fGroupHTML(g, vals){
  return '<section class="fg"><div class="fgh"><span class="fgs" aria-hidden="true">' + g.ab + '</span><h3 class="fgt">' + g.t + '<em>' + g.sym + '</em></h3><span class="fgd">' + g.d + '</span></div>'
    + '<div class="fgb">' + fNumRow(g, 0, vals) + fNumRow(g, 1, vals) + '</div></section>';
}
const FLEG = '<span><i class="c-x"></i>传中远射</span><span><i class="c-m"></i>中路渗透</span><span><i class="c-b"></i>回传</span>';
function fChoiceHTML(vals){
  const row = d => '<div class="fl flc ' + (d ? 'a' : 'h') + '"><div class="flv"><span class="fln">' + esc(teamName(d)) + '</span></div>'
    + triHTML('f', String(d), vals[d].fy, vals[d].fh, { cls: 'lock ' + (d ? 'a' : 'h'), lab: teamName(d) }) + '</div>';
  return '<section class="fg"><div class="fgh"><span class="fgs" aria-hidden="true">选择</span><h3 class="fgt">到达后的选择</h3><span class="fgl">' + FLEG + '</span></div><div class="fgb">' + row(0) + row(1) + '</div></section>';
}
/* 这一队的算式 */
function fCalcHTML(t){
  if (!t.ok) return '<span class="fcm">还差：' + esc(t.miss.join('、')) + '</span>';
  return '<span>打门比例 z <b>' + Math.round(t.z * 100) + '%</b></span><span class="fcs">传中远射 ' + t.cross.toFixed(1) + ' ＋ 中路打门 ' + t.centre.toFixed(1) + ' ＝ <b>' + t.s.toFixed(1) + '</b></span>';
}
function fBoardHTML(){
  const T = [fTeam(0), fTeam(1)], vals = [T[0].v, T[1].v];
  const team = i => '<div class="ft ' + (i ? 'a' : 'h') + '"><i></i><b>' + esc(teamName(i)) + '</b><button class="qck" data-a="ck" data-i="' + i + '" aria-label="' + esc(teamName(i)) + ' 角球加一">' + FLAG + '<span>角球</span><b>' + statOf(M, i, 'ft').ck + '</b><small>＋1</small></button></div>';
  return '<div class="fteams">' + team(0) + team(1) + '</div><div class="fboard">'
    + fGroupHTML({ f: 'fx', t: '到达次数', sym: 'x', ab: '到达', d: '这段时间到对方禁区附近几次' }, vals)
    + fChoiceHTML(vals)
    + fGroupHTML({ f: 'fa', t: '打门门槛', sym: 'a', ab: '门槛', d: '中路渗透后要多大的机会才打门，1 是联赛平均' }, vals)
    + fGroupHTML({ f: 'fb', t: '禁区内防守', sym: 'b', ab: '防守', own: 1, d: '每行是那一队自己的防守，1 是联赛平均' }, vals)
    + '</div><div class="fcalcs"><div class="fcalc" id="fcalc_0">' + fCalcHTML(T[0]) + '</div><div class="fcalc" id="fcalc_1">' + fCalcHTML(T[1]) + '</div></div>';
}
/* 拖的时候：这一条的数字、算式和上方的结果跟着变，整个画面放开以后才重画 */
function fInput(x, v){
  const p = x.split('_'), i = +p[0], q = SVF[p[1]];
  FDRAG = { x: x, v: v };
  setTx('fv_' + x, fValHTML(q, v)); setTx('fw_' + x, wordHTML(q.f, v));
  const fv = document.getElementById('fv_' + x); if (fv) fv.classList.remove('na');
  setTx('fcalc_' + i, fCalcHTML(fTeam(i)));
  renderFres();
}
const fDragEnd = () => { FDRAG = null; };

/* ---------- 上方的结果：两队的指数、谁多、高于还是低于平均 ---------- */
function renderFres(){
  const el = $('#fres'); if (!el) return;
  const show = PREF.mode === 'f' && M.st !== 2;
  el.hidden = !show;
  if (!show) return;
  const T = [fTeam(0), fTeam(1)], J = fJudge(T[0], T[1]), line = fLine();
  const side = i => {
    const t = T[i];
    return '<div class="frs ' + (i ? 'a' : 'h') + '"><span class="frn">' + esc(teamName(i)) + '</span>'
      + '<div class="frx"><b class="frv' + (t.ok ? '' : ' na') + '" id="frv' + i + '">' + (t.ok ? t.s.toFixed(1) : '—') + '</b></div></div>';
  };
  // 高于／低于平均：iPad 在指数旁边，手机在指数下面、判断的两边
  const tag = i => {
    const t = T[i], g = t.ok ? fTag(t.s, line) : null;
    return g ? '<span class="frg t' + i + ' ' + g.k + '" id="frg' + i + '">' + g.t + '</span>' : !t.ok ? '<span class="frg t' + i + ' miss">还差 ' + t.miss.length + ' 项</span>' : '<span class="frg t' + i + ' none"></span>';
  };
  let rt = '', jt, jc = '';
  if (!T[0].ok && !T[1].ok) jt = '拖动下面的条，结果自动算出';
  else if (!J) jt = '等另一队的数据';
  else if (J.same) { rt = '1.00<small>倍</small>'; jt = '两队一样，不下结论'; }
  else {
    rt = J.r === Infinity ? '' : J.r.toFixed(2) + '<small>倍</small>';
    if (J.clear){ jt = '判断：' + esc(teamName(J.i)) + ' 角球更多'; jc = ' c' + J.i; }
    else jt = '相差不到 ' + FRATIO + ' 倍，不下结论';
  }
  const sum = J ? T[0].s + T[1].s : 0;
  const bar = J && sum > 0 ? '<div class="frb" aria-hidden="true"><i class="h" style="width:' + (T[0].s / sum * 100).toFixed(1) + '%"></i><i class="a" style="width:' + (T[1].s / sum * 100).toFixed(1) + '%"></i></div>' : '<div class="frb" aria-hidden="true"></div>';
  const avg = line == null ? '设联赛平均，判断高于还是低于平均' : '联赛平均线 <b>' + line.toFixed(1) + '</b>　高于 ' + (line * (1 + FNEAR)).toFixed(1) + '　低于 ' + (line * (1 - FNEAR)).toFixed(1);
  const nt = !(T[0].ok && fTag(T[0].s, line)) && !(T[1].ok && fTag(T[1].s, line)) && T[0].ok && T[1].ok;
  el.innerHTML = '<div class="frt' + (nt ? ' notag' : '') + '">' + side(0) + tag(0) + '<div class="frm">' + (rt ? '<b class="frr" id="frr">' + rt + '</b>' : '') + '<span class="frj' + jc + '" id="frj">' + jt + '</span></div>' + tag(1) + side(1) + '</div>'
    + bar + '<button type="button" class="fra" data-a="favg">' + avg + '<span class="frc">' + (line == null ? '设定' : '调整') + '</span></button>';
}

/* ---------- 联赛平均（视窗） ---------- */
const FAVX = { k: 'x', n: '平均到达次数', d: '时间长度要跟比赛里读的一样（例如都是一个半场）', hi: 80, st: 1, u: ' 次' };
const favTxt = v => v == null ? '未设' : fp(v) + FAVX.u;
function favLineHTML(){
  const L = fLine();
  return L == null ? '两项都设好以后，这里显示联赛平均线' : '联赛平均线 <b>' + L.toFixed(1) + '</b>：指数高于 <b>' + (L * (1 + FNEAR)).toFixed(1) + '</b> 算高于平均，低于 <b>' + (L * (1 - FNEAR)).toFixed(1) + '</b> 算低于平均';
}
function favSheetHTML(){
  return '<div class="card-h"><h3>联赛平均线</h3><button class="pill dark" data-a="close">完成</button></div>'
    + '<p class="hint">用来判断一队的角球高于还是低于平均。设一次就一直留着，每场都用。平均线按 a、b 都是 1 计算。</p>'
    + '<div class="p1g"><h4>' + FAVX.n + '</h4><div class="p1val"><b id="favv_x">' + favTxt(FAVG.x) + '</b><span>' + FAVX.d + '</span></div>'
    + slHTML('fav', 'x', FAVG.x, { hi: FAVX.hi, st: FAVX.st, u: FAVX.u, cls: 'h', lab: FAVX.n })
    + '<div class="slends"><span>0 次</span><span>80 次</span></div></div>'
    + '<div class="p1g favm"><h4>平均的选择</h4><div class="favl">' + FLEG + '</div>'
    + triHTML('fav', 'avg', FAVG.y, FAVG.h, { cls: 'n', lab: '联赛平均' }) + '</div>'
    + '<p class="netnote" id="favLine">' + favLineHTML() + '</p>'
    + '<button class="pill" data-a="favclr"' + (FAVG.x == null && FAVG.y == null && FAVG.h == null ? ' disabled' : '') + '>清除联赛平均</button>';
}
function favInput(x, v){
  FAVD = { v: v };
  setTx('favv_x', favTxt(v));
  setTx('favLine', favLineHTML());
  renderFres();
}
function favSet(x, v){ FAVD = null; FAVG.x = v; LS.set(FAVK, FAVG); }
function favClear(){ FAVD = null; FAVG = fixFavg(null); LS.set(FAVK, FAVG); }
