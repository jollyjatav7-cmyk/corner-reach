/* ================= 角球公式 =================
   最终结果 = 传中远射频率 + 中路渗透射门频率
   传中远射频率 = x × y；中路渗透射门频率 = x × (1 − y − h) × z，z = 1 ÷ (1 + 3 × a × b)
   x 到达频率（0–100%，接近 100% 是一直包饺子）、y 传中和远射占比、h 回传占比、a 打门门槛、b 对方禁区内防守（a、b 的 1 是联赛平均，没设时按 1 算）。
   画面上主队一块在上、客队一块在下，都在同一页；y、h 在同一条轴上（两个滑块分成传中远射、中路渗透、回传三段）。
   跟两个问题一样每次放开都记下时间；拖的时候上方的面板跟着算。
   平均值（FAV）：到达 50%、传中远射 33%、中路渗透 33%、a 和 b 都是 1。这些数只用来比较高低，不是角球数。
   推荐：最终结果高出标准算大角、低出标准算小角，其他是平均水平。两队都大角 → 大角；两队都小角 → 小角；一大一小 → 让球；
   一队大角或小角、一队平均水平，而且差距偏大 → 让球＋对应的大角或小角；其他情况不推荐。让球投最终结果大的那队。 */
const FK = 3;
const FAV = { x: 50, y: 33, m: 33, a: 1, b: 1 };
FAV.cross = FAV.x * FAV.y / 100;
FAV.centre = FAV.x * FAV.m / 100 / (1 + FK * FAV.a * FAV.b);
FAV.s = FAV.cross + FAV.centre;
/* 推荐的标准（面板上的“微调”、功能 → 角球公式的推荐标准，存在这台设备上）：
   hi 大角＝高于平均至少百分之几；lo 小角＝低于平均至少百分之几；gap 差距偏大＝大的是小的至少几倍。
   传中远射、中路射门两行用同样的 hi、lo 显示高于或低于平均，整个面板只有一套标准 */
const FRK = 'corner-reach-frec';
const FR0 = { hi: 25, lo: 30, gap: 2 };
const FRR = { hi: { lo: 5, hi: 100, st: 1, u: '%' }, lo: { lo: 5, hi: 90, st: 1, u: '%' }, gap: { lo: 1.1, hi: 4, st: 0.1, u: ' 倍' } };
function fixFrec(o){
  const r = {};
  for (const k of Object.keys(FR0)){
    const c = FRR[k], v = o && o[k] != null ? +o[k] : NaN;
    r[k] = v === v ? clamp(+(Math.round(v / c.st) * c.st).toFixed(1), c.lo, c.hi) : FR0[k];
  }
  return r;
}
let FREC = fixFrec(LS.get(FRK, null));
const saveFrec = () => LS.set(FRK, FREC);
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
/* 跟平均值比：n＝高或低百分之几（画面上的数字，判断也用这个数，看到的和算的一样） */
function fPct(v, avg){
  const r = (v / avg - 1) * 100, n = Math.round(Math.abs(r));
  return { up: r > 0, n: n, tx: (r < 0 && n ? '−' : '+') + n + '%' };
}
/* 跟平均值比算哪一档：b 高（最终结果就是大角）、s 低（小角）、m 差不多（平均水平） */
function fBand(v, avg){ const p = fPct(v, avg); return p.up && p.n >= FREC.hi ? 'b' : !p.up && p.n >= FREC.lo ? 's' : 'm'; }
const fLevel = v => fBand(v, FAV.s);
/* 面板上每一行的比较：最终结果说大角／小角／平均水平，两部分说高于／低于／接近平均 */
function fChip(key, v){
  const L = fBand(v, FAV[key]), k = L === 'b' ? 'fhi' : L === 's' ? 'flo' : 'feq', W = key === 's' ? { b: ['大角', '大'], s: ['小角', '小'], m: ['平均水平', '平'] } : { b: ['高于平均', '高'], s: ['低于平均', '低'], m: ['接近平均', '近'] };
  return { k: k, t: W[L][0], s: W[L][1], n: fPct(v, FAV[key]).tx };
}
/* 两队对比：i＝最终结果大的那队；r＝倍数（对方是 0 时是 Infinity）；clear＝差距偏大（跟画面上的两位小数比） */
function fJudge(a, b){
  if (!a.ok || !b.ok) return null;
  const big = Math.max(a.s, b.s), small = Math.min(a.s, b.s);
  if (big <= 0 || Math.abs(a.s - b.s) < 1e-9) return { same: 1, r: 1 };
  const r = small > 0 ? big / small : Infinity;
  return { i: a.s > b.s ? 0 : 1, r: r, clear: +r.toFixed(2) >= FREC.gap };
}
/* 两队合起来的推荐：k＝big 大角、small 小角、hc 让球（i＝投哪一队，add＝同时推荐大角 b 或小角 s）、none 不推荐（w＝为什么） */
function fRec(a, b){
  const J = fJudge(a, b); if (!J) return null;
  const x = fLevel(a.s), y = fLevel(b.s);
  if (x === 'b' && y === 'b') return { k: 'big' };
  if (x === 's' && y === 's') return { k: 'small' };
  if (x !== 'm' && y !== 'm') return { k: 'hc', i: J.i };   // 一队大角、一队小角
  if (x === 'm' && y === 'm') return { k: 'none', w: 'm' };
  const w = x === 'm' ? y : x;   // 一队大角或小角，另一队平均水平
  return J.clear ? { k: 'hc', i: J.i, add: w } : { k: 'none', w: w };
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

/* ---------- 上方的面板：每队的最终结果和内部两部分，每一项都跟平均值比，最下面是推荐 ---------- */
const frPill = (c, ic, tx) => '<span class="frp ' + c + '">' + ic + '<span class="frpt">' + tx + '</span></span>';
const frSide = w => w === 'b' ? frPill('pb', ICM.up, '大角') : frPill('ps', ICM.dn, '小角');
function fRecHTML(T, R){
  if (!T[0].ok && !T[1].ok) return '拖动下面的条，结果自动算出';
  if (!R) return '等另一队的数据';
  if (R.k === 'none') return '不推荐：' + (R.w === 'm' ? '两队都在平均水平' : '<span class="frdl">一队' + (R.w === 'b' ? '大角' : '小角') + '、一队平均水平，</span>差距不到 ' + fp(FREC.gap) + ' 倍');
  const head = '<span class="frl">推荐</span>';
  if (R.k !== 'hc') return head + frSide(R.k === 'big' ? 'b' : 's');
  return head + frPill('p' + R.i, ICM.hc, '让球 ' + esc(teamName(R.i))) + (R.add ? '<span class="frpa">＋</span>' + frSide(R.add) : '');
}
function renderFres(){
  const el = $('#fres'); if (!el) return;
  const show = PREF.mode === 'f' && M.st !== 2;
  el.hidden = !show;
  if (!show) return;
  const T = [fTeam(0), fTeam(1)], J = fJudge(T[0], T[1]);
  const cell = (i, key, id, big) => {
    const t = T[i], c = t.ok ? fChip(key, t[key]) : null, tx = t.ok ? t[key].toFixed(1) : '—';
    const num = '<b class="frv' + (t.ok ? '' : ' na') + (tx.length > 4 ? ' l' : '') + '" id="' + id + i + '">' + tx + '</b>';
    const chip = c ? '<span class="frd ' + c.k + '" id="' + id + i + 'd"><span class="frdl">' + c.t + '</span><span class="frds">' + c.s + '</span> ' + c.n + '</span>' : big ? '<span class="frd miss">还差 ' + t.miss.length + ' 项</span>' : '';
    return '<div class="frc ' + (i ? 'a' : 'h') + '">' + (i ? chip + num : num + chip) + '</div>';
  };
  const row = (key, id, name, short, big) => '<div class="frw' + (big ? ' big' : '') + '">' + cell(0, key, id, big)
    + '<div class="frm"><span class="frml">' + name + '</span><span class="frms">' + short + '</span><span class="frma"><span class="frmw">平均 </span><b>' + FAV[key].toFixed(1) + '</b></span></div>' + cell(1, key, id, big) + '</div>';
  const rt = !J ? '' : J.same ? '1.00<small>倍</small>' : J.r === Infinity ? '' : J.r.toFixed(2) + '<small>倍</small>';
  el.innerHTML = '<div class="frhd"><span class="frn h">' + esc(teamName(0)) + '</span><b class="frr" id="frr">' + rt + '</b><span class="frn a">' + esc(teamName(1)) + '</span></div>'
    + row('s', 'frv', '最终结果', '最终结果', 1) + row('cross', 'frx', '传中远射频率', '传中远射') + row('centre', 'frz', '中路渗透射门频率', '中路射门')
    + '<div class="frjr"><div class="frj" id="frj">' + fRecHTML(T, fRec(T[0], T[1])) + '</div><button type="button" class="frtn" data-a="frec" aria-label="微调推荐的标准">微调</button></div>';
  // 手机的字体比预想的宽、一格放不下时，先省掉“大／小／平”这个字，靠颜色和正负号看
  el.querySelectorAll('.frc').forEach(c => {
    const gap = parseFloat(getComputedStyle(c).columnGap) || 0;
    if ([...c.children].reduce((w, e) => w + e.getBoundingClientRect().width + gap, -gap) > c.clientWidth) c.classList.add('tight');
  });
}

/* ---------- 微调：推荐的标准 ---------- */
const FRI = {
  hi: { n: '大角', d: '最终结果比平均值高多少才算大角', v: v => '+' + v + '%', t: v => '最终结果大约 ' + (FAV.s * (1 + v / 100)).toFixed(1) + ' 以上' },
  lo: { n: '小角', d: '最终结果比平均值低多少才算小角', v: v => '−' + v + '%', t: v => '最终结果大约 ' + (FAV.s * (1 - v / 100)).toFixed(1) + ' 以下' },
  gap: { n: '差距偏大', d: '一队大角或小角、一队平均水平时，差几倍才推荐让球', v: v => v.toFixed(1) + ' 倍', t: () => '最终结果大的是小的这么多倍以上' }
};
const frecNow = () => { const T = [fTeam(0), fTeam(1)]; return fRecHTML(T, fRec(T[0], T[1])); };
function frecSheetHTML(){
  const group = k => {
    const c = FRR[k], x = FRI[k];
    return '<div class="p1g frgp"><h4><span>' + x.n + '</span><small>' + x.d + '</small></h4><div class="p1val"><b id="frs_' + k + '">' + x.v(FREC[k]) + '</b><span id="frn_' + k + '">' + x.t(FREC[k]) + '</span></div>'
      + slHTML('frec', k, FREC[k], { lo: c.lo, hi: c.hi, st: c.st, u: c.u, cls: 'h', lab: x.n })
      + '<div class="slends"><span>' + c.lo + c.u + '</span><span>' + c.hi + c.u + '</span></div></div>';
  };
  const same = Object.keys(FR0).every(k => FREC[k] === FR0[k]);
  return '<div class="card-h"><h3>角球公式：推荐标准</h3><button class="pill dark" data-a="close">完成</button></div>'
    + '<div class="frnow"><span>现在</span><div class="frj" id="frecNow">' + frecNow() + '</div></div>'
    + Object.keys(FR0).map(group).join('')
    + '<div class="defs"><div><h4>两队合起来（固定）</h4><ul><li>两队都大角：推荐大角</li><li>两队都小角：推荐小角</li><li>一队大角、一队小角：推荐让球</li><li>一队大角或小角、一队平均水平，而且差距偏大：推荐让球和对应的大角或小角</li><li>其他情况：不推荐</li><li>让球投最终结果大的那队</li></ul></div></div>'
    + '<button class="pill" data-a="frecr"' + (same ? ' disabled' : '') + '>恢复初始值</button>'
    + '<p class="hint">传中远射、中路射门两行也用大角、小角这两个百分比，显示高于或低于平均。改了马上生效，存在这台设备上，不会改任何记录。</p>';
}
function frecInput(k, v){
  FREC[k] = v;
  setTx('frs_' + k, FRI[k].v(v)); setTx('frn_' + k, FRI[k].t(v)); setTx('frecNow', frecNow());
  renderFres();
}
