/* ================= 角球公式 =================
   最终结果 = 传中远射频率 + 中路渗透射门频率
   传中远射频率 = x × y；中路渗透射门频率 = x × (1 − y − h) × z，z = 1 ÷ (1 + 3 × a × b)
   x 到达频率（0–100%，接近 100% 是一直包饺子）、y 传中和远射占比、h 回传占比、a 打门门槛、b 对方禁区内防守（a、b 的 1 是联赛平均，没设时按 1 算）。
   画面上主队一块在上、客队一块在下，都在同一页；y、h 在同一条轴上（两个滑块分成传中远射、中路渗透、回传三段）。
   跟两个问题一样每次放开都记下时间；拖的时候上方的面板跟着算。
   平均值（FAV）：到达 50%、传中远射 33%、中路渗透 33%、a 和 b 都是 1。比平均值高或低 10% 以上算高于或低于平均。
   两队对比：最终结果大的是小的 2 倍以上才下判断。这些数只用来比较高低，不是角球数。 */
const FK = 3, FRATIO = 2, FNEAR = 10;
const FAV = { x: 50, y: 33, m: 33, a: 1, b: 1 };
FAV.cross = FAV.x * FAV.y / 100;
FAV.centre = FAV.x * FAV.m / 100 / (1 + FK * FAV.a * FAV.b);
FAV.s = FAV.cross + FAV.centre;
let FDRAG = null;   // 正在拖的那一条：{ x 哪一条, v 拖到哪里 }（还没记下）

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
/* ok＝到达频率和选择都设了才算。选择的轴拖过一个滑块就算设了（另一段是 0）；a、b 没设时按 1 */
function fTeam(i){
  const v = fVals(i), miss = [];
  if (v.fx == null) miss.push('到达频率');
  if (v.fy == null && v.fh == null) miss.push('到达后的选择');
  if (miss.length) return { ok: false, v: v, miss: miss };
  const a = v.fa == null ? 1 : v.fa, b = v.fb == null ? 1 : v.fb;
  return Object.assign({ ok: true, v: v, a: a, b: b, miss: [] }, fCalc(v.fx, v.fy || 0, v.fh || 0, a, b));
}
/* 跟平均值比：n＝高或低百分之几（画面上的数字），差 10% 以上才算高于或低于平均 */
function fCmp(v, avg){
  const r = (v / avg - 1) * 100, n = Math.round(Math.abs(r)), k = n >= FNEAR ? (r > 0 ? 'fhi' : 'flo') : 'feq';
  return { k: k, t: k === 'fhi' ? '高于平均' : k === 'flo' ? '低于平均' : '接近平均', s: k === 'fhi' ? '高' : k === 'flo' ? '低' : '近', n: (r < 0 && n ? '−' : '+') + n + '%' };
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
    live(){ renderFres(); },
    commit(x, T){ if (T.y !== T.y0) pickQ(+x, 'fy', T.y); if (T.h !== T.h0) pickQ(+x, 'fh', T.h); }
  }
};
function triParts(y, h){
  const Y = clamp(y == null ? 0 : y, 0, 100), H = clamp(h == null ? 0 : h, 0, r1(100 - Y));
  return { y: Y, h: H, m: r1(100 - Y - H) };
}
function triSegs(p){
  const seg = (c, n, v) => '<i class="tri-s ' + c + '" style="width:' + v + '%">' + (v >= 24 ? '<span class="tri-n">' + n + '</span>' : '') + (v >= 10 && !hideNum() ? '<b>' + fp(v) + '<small>%</small></b>' : '') + '</i>';
  return seg('c-x', '传中', p.y) + seg('c-m', '中路', p.m) + seg('c-b', '回传', p.h);
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

/* ---------- 两队放在同一页：主队一块在上，客队一块在下 ---------- */
const fNum = (q, v) => q.step === 0.1 ? v.toFixed(1) : fp(v);
const fUnit = q => q.u == null ? '%' : q.u.trim();
function fValHTML(q, v){
  if (v == null) return q.def != null ? '默认 ' + q.def : '未设';
  if (hideNum()) return '<span class="nh" title="数字已隐藏">' + ICE.off + '</span>';
  return fNum(q, v) + (fUnit(q) ? '<small>' + fUnit(q) + '</small>' : '');
}
/* 每队的四项：t 全名（iPad）、s 短名（手机） */
const FITEMS = [
  { f: 'fx', t: '到达频率', s: '到达', sym: 'x' },
  { choice: 1, t: '到达后的选择', s: '选择' },
  { f: 'fa', t: '打门门槛', s: '门槛', sym: 'a' },
  { f: 'fb', t: '对方禁区内防守', s: '对方防守', sym: 'b' }
];
function fItemHTML(g, i, v){
  const name = '<span class="fln"><span class="fll">' + g.t + (g.sym ? '<em>' + g.sym + '</em>' : '') + '</span><span class="fls">' + g.s + '</span></span>', c = i ? 'a' : 'h';
  if (g.choice) return '<div class="fl flc"><div class="flv">' + name + '</div>' + triHTML('f', String(i), v.fy, v.fh, { cls: 'lock ' + c, lab: teamName(i) }) + '</div>';
  const q = SVF[g.f], x = i + '_' + g.f, val = v[g.f];
  return '<div class="fl"><div class="flv">' + name + '<span class="flx"><span class="fval' + (val == null ? ' na' : '') + '" id="fv_' + x + '">' + fValHTML(q, val) + '</span><span class="fw" id="fw_' + x + '">' + wordHTML(q.f, val) + '</span></span></div>'
    + slHTML('f', x, val, { lo: q.min, hi: q.max, st: q.step, u: q.u, cls: 'big lock ' + c, lab: teamName(i) + ' ' + g.t }) + '</div>';
}
function fTeamHTML(i){
  const t = fTeam(i);
  return '<section class="ftm ' + (i ? 'a' : 'h') + '" aria-label="' + esc(teamName(i)) + '"><div class="ftmh"><b>' + esc(teamName(i)) + '</b>'
    + '<button class="qck" data-a="ck" data-i="' + i + '" aria-label="' + esc(teamName(i)) + ' 角球加一">' + FLAG + '<span>角球</span><b>' + statOf(M, i, 'ft').ck + '</b><small>＋1</small></button></div>'
    + '<div class="ftmb">' + FITEMS.map(g => fItemHTML(g, i, t.v)).join('') + '</div></section>';
}
const fBoardHTML = () => '<div class="ftms">' + fTeamHTML(0) + fTeamHTML(1) + '</div>';
/* 拖的时候：这一条的数字和上方的面板跟着变，整个画面放开以后才重画 */
function fInput(x, v){
  const q = SVF[x.split('_')[1]];
  FDRAG = { x: x, v: v };
  setTx('fv_' + x, fValHTML(q, v)); setTx('fw_' + x, wordHTML(q.f, v));
  const fv = document.getElementById('fv_' + x); if (fv) fv.classList.remove('na');
  renderFres();
}
const fDragEnd = () => { FDRAG = null; };

/* ---------- 上方的面板：每队的最终结果和内部两部分，每一项都跟平均值比 ---------- */
function renderFres(){
  const el = $('#fres'); if (!el) return;
  const show = PREF.mode === 'f' && M.st !== 2;
  el.hidden = !show;
  if (!show) return;
  const T = [fTeam(0), fTeam(1)], J = fJudge(T[0], T[1]);
  const cell = (i, key, id, big) => {
    const t = T[i], c = t.ok ? fCmp(t[key], FAV[key]) : null, tx = t.ok ? t[key].toFixed(1) : '—';
    const num = '<b class="frv' + (t.ok ? '' : ' na') + (tx.length > 4 ? ' l' : '') + '" id="' + id + i + '">' + tx + '</b>';
    const chip = c ? '<span class="frd ' + c.k + '" id="' + id + i + 'd"><span class="frdl">' + c.t + '</span><span class="frds">' + c.s + '</span> ' + c.n + '</span>' : big ? '<span class="frd miss">还差 ' + t.miss.length + ' 项</span>' : '';
    return '<div class="frc ' + (i ? 'a' : 'h') + '">' + (i ? chip + num : num + chip) + '</div>';
  };
  const row = (key, id, name, short, big) => '<div class="frw' + (big ? ' big' : '') + '">' + cell(0, key, id, big)
    + '<div class="frm"><span class="frml">' + name + '</span><span class="frms">' + short + '</span><span class="frma"><span class="frmw">平均 </span><b>' + FAV[key].toFixed(1) + '</b></span></div>' + cell(1, key, id, big) + '</div>';
  let rt = '', jt, jc = '';
  if (!T[0].ok && !T[1].ok) jt = '拖动下面的条，结果自动算出';
  else if (!J) jt = '等另一队的数据';
  else if (J.same) { rt = '1.00<small>倍</small>'; jt = '两队一样，不下结论'; }
  else {
    rt = J.r === Infinity ? '' : J.r.toFixed(2) + '<small>倍</small>';
    if (J.clear){ jt = '判断：' + esc(teamName(J.i)) + ' 角球更多'; jc = ' c' + J.i; }
    else jt = '相差不到 ' + FRATIO + ' 倍，不下结论';
  }
  el.innerHTML = '<div class="frhd"><span class="frn h">' + esc(teamName(0)) + '</span><b class="frr" id="frr">' + rt + '</b><span class="frn a">' + esc(teamName(1)) + '</span></div>'
    + row('s', 'frv', '最终结果', '最终结果', 1) + row('cross', 'frx', '传中远射频率', '传中远射') + row('centre', 'frz', '中路渗透射门频率', '中路射门')
    + '<div class="frjr"><span class="frj' + jc + '" id="frj">' + jt + '</span></div>';
  // 手机的字体比预想的宽、一格放不下时，先省掉“高／低／近”这个字，靠颜色和正负号看
  el.querySelectorAll('.frc').forEach(c => {
    const gap = parseFloat(getComputedStyle(c).columnGap) || 0;
    if ([...c.children].reduce((w, e) => w + e.getBoundingClientRect().width + gap, -gap) > c.clientWidth) c.classList.add('tight');
  });
}
