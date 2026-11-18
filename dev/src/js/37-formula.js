/* ================= 角球公式 =================
   角球指数 = x × [ y + (1 − y − h) × z ]，z = 1 ÷ (1 + 3 × a × b)
   x 到达次数、y 传中和远射占比、h 回传占比、a 打门门槛、b 对方禁区内防守（a、b 的 1 是联赛平均，没设时按 1 算）。
   每队五条拖动条（FS，在 10-core.js），跟两个问题一样每次放开都记下时间；拖的时候上方的结果跟着算。
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
let FAVD = null;    // 联赛平均正在拖的那一条
let FSIDE = 0;      // 手机上正在调整哪一队
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
  return out;
}
/* ok＝到达次数、两个占比都设了才算（a、b 没设时按 1） */
function fTeam(i){
  const v = fVals(i), miss = FS.filter(q => q.def == null && v[q.f] == null).map(q => q.n);
  if (miss.length) return { ok: false, v: v, miss: miss };
  const a = v.fa == null ? 1 : v.fa, b = v.fb == null ? 1 : v.fb;
  return Object.assign({ ok: true, v: v, a: a, b: b, miss: [] }, fCalc(v.fx, v.fy, v.fh, a, b));
}
/* 联赛平均线：平均的到达次数和选择，a、b 都是 1 */
function fLine(){
  if (!favOn()) return null;
  const g = k => FAVD && FAVD.x === k && slBusy() ? FAVD.v : FAVG[k];
  return fCalc(g('x'), g('y'), g('h'), 1, 1).s;
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
/* 传中远射＋回传不能超过 100%：这一条最多到“100% − 另一条” */
function fOther(i, f){
  const o = f === 'fy' ? 'fh' : 'fy', k = i + '_' + o, s = svCur(M, i, o);
  const v = FDRAG && FDRAG.x === k && slBusy() ? FDRAG.v : s && s.v != null ? s.v : 0;
  return v;
}
function fCap(x, v){
  const p = String(x).split('_');
  return p[1] === 'fy' || p[1] === 'fh' ? Math.min(v, r1(100 - fOther(+p[0], p[1]))) : v;
}
const favCap = (x, v) => x === 'y' ? Math.min(v, r1(100 - (FAVG.h || 0))) : x === 'h' ? Math.min(v, r1(100 - (FAVG.y || 0))) : v;

/* ---------- 每队的五条拖动条 ---------- */
const fNum = (q, v) => q.step === 0.1 ? v.toFixed(1) : fp(v);
const fUnit = q => q.u == null ? '%' : q.u.trim();
function fValHTML(q, v){
  if (v == null) return q.def != null ? '默认 ' + q.def : '未设';
  if (hideNum()) return '<span class="nh" title="数字已隐藏">' + ICE.off + '</span>';
  return fNum(q, v) + (fUnit(q) ? '<small>' + fUnit(q) + '</small>' : '');
}
function fRowHTML(i, q, v){
  const x = i + '_' + q.f, share = q.f === 'fy' || q.f === 'fh';
  return '<div class="frow"><div class="frh"><h3 class="frl">' + q.n + '<em>' + q.sym + '</em></h3><span class="fab" aria-hidden="true">' + q.ab + '</span>'
    + '<span class="fw" id="fw_' + x + '">' + wordHTML(q.f, v) + '</span><span class="fval' + (v == null ? ' na' : '') + '" id="fv_' + x + '">' + fValHTML(q, v) + '</span></div>'
    + '<div class="fd">' + q.d + '</div>'
    + slHTML('f', x, v, { lo: q.min, hi: q.max, st: q.step, u: q.u, cap: share ? r1(100 - fOther(i, q.f)) : null, cls: 'big lock ' + (i ? 'a' : 'h'), lab: teamName(i) + ' ' + q.n }) + '</div>';
}
/* 三种选择加起来 100%：传中远射、中路渗透（自动算）、回传 */
function fMixHTML(v){
  const y = v.fy == null ? 0 : v.fy, h = v.fh == null ? 0 : v.fh, m = Math.max(0, r1(100 - y - h)), set = v.fy != null && v.fh != null;
  const t = (c, n, p) => '<span><i class="' + c + '"></i>' + n + (set && !hideNum() ? ' <b>' + fp(p) + '%</b>' : '') + '</span>';
  return '<div class="fmb" aria-hidden="true">' + (set ? '<i class="c-x" style="width:' + y + '%"></i><i class="c-m" style="width:' + m + '%"></i><i class="c-b" style="width:' + h + '%"></i>' : '') + '</div>'
    + '<div class="fmt">' + t('c-x', '传中远射', y) + t('c-m', '中路渗透', m) + t('c-b', '回传', h) + '</div>';
}
/* 这一队的算式 */
function fCalcHTML(t){
  if (!t.ok) return '<span class="fcm">还差：' + esc(t.miss.join('、')) + '</span>';
  return '<span>打门比例 z <b>' + Math.round(t.z * 100) + '%</b></span><span class="fcs">传中远射 ' + t.cross.toFixed(1) + ' ＋ 中路打门 ' + t.centre.toFixed(1) + ' ＝ <b>' + t.s.toFixed(1) + '</b></span>';
}
function fPadHTML(i){
  const t = fTeam(i), v = t.v, by = f => FS.filter(q => q.f === f)[0];
  const side = j => '<button type="button" class="' + (j ? 'a' : 'h') + '" data-a="fside" data-v="' + j + '" aria-pressed="' + (FSIDE === j) + '"><i></i><span>' + esc(teamName(j)) + '</span></button>';
  const head = '<div class="pad-h"><i></i><b>' + esc(teamName(i)) + '</b><span class="who">' + (i ? '客对主' : '主对客') + '</span><div class="fsw" role="group" aria-label="调整哪一队">' + side(0) + side(1) + '</div><span class="sp"></span>'
    + '<button class="qck" data-a="ck" data-i="' + i + '" aria-label="' + esc(teamName(i)) + ' 角球加一">' + FLAG + '<span>角球</span><b>' + statOf(M, i, 'ft').ck + '</b><small>＋1</small></button></div>';
  return head + '<div class="fcard">' + fRowHTML(i, by('fx'), v.fx) + fRowHTML(i, by('fy'), v.fy) + fRowHTML(i, by('fh'), v.fh)
    + '<div class="fmix" id="fmix_' + i + '">' + fMixHTML(v) + '</div>'
    + fRowHTML(i, by('fa'), v.fa) + fRowHTML(i, by('fb'), v.fb)
    + '<div class="fcalc" id="fcalc_' + i + '">' + fCalcHTML(t) + '</div></div>';
}
/* 拖的时候：这一条的数字、三种选择、上限的斜线、算式和上方的结果跟着变，整个画面放开以后才重画 */
function fInput(x, v){
  const p = x.split('_'), i = +p[0], q = SVF[p[1]];
  FDRAG = { x: x, v: v };
  setTx('fv_' + x, fValHTML(q, v)); setTx('fw_' + x, wordHTML(q.f, v));
  const fv = document.getElementById('fv_' + x); if (fv) fv.classList.remove('na');
  const t = fTeam(i);
  setTx('fmix_' + i, fMixHTML(t.v)); setTx('fcalc_' + i, fCalcHTML(t));
  if (q.f === 'fy' || q.f === 'fh'){
    const o = q.f === 'fy' ? 'fh' : 'fy', c = document.querySelector('.sl[data-sl="f"][data-x="' + i + '_' + o + '"] .sl-c');
    if (c) c.style.left = r1(100 - v) + '%';
  }
  renderFres();
}
const fDragEnd = () => { FDRAG = null; };

/* ---------- 上方的结果：两队的指数、谁多、高于还是低于平均 ---------- */
function renderFres(){
  const el = $('#fres'); if (!el) return;
  const show = PREF.mode === 'f' && M.st !== 2;
  el.hidden = !show;
  document.body.classList.toggle('fs1', FSIDE === 1);
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
const FAVQ = [
  { k: 'x', n: '平均到达次数', d: '时间长度要跟比赛里读的一样（例如都是一个半场）', hi: 80, st: 1, u: ' 次', lo: '0 次', ho: '80 次' },
  { k: 'y', n: '平均传中和远射占比', d: '到达以后选择传中或远射的比例', hi: 100, lo: '0%', ho: '100%' },
  { k: 'h', n: '平均回传占比', d: '到达以后选择回传的比例', hi: 100, lo: '0%', ho: '100%' }
];
const favTxt = (q, v) => v == null ? '未设' : fp(v) + (q.u == null ? '%' : q.u);
function favLineHTML(){
  const L = fLine();
  return L == null ? '三项都设好以后，这里显示联赛平均线' : '联赛平均线 <b>' + L.toFixed(1) + '</b>：指数高于 <b>' + (L * (1 + FNEAR)).toFixed(1) + '</b> 算高于平均，低于 <b>' + (L * (1 - FNEAR)).toFixed(1) + '</b> 算低于平均';
}
function favSheetHTML(){
  return '<div class="card-h"><h3>联赛平均线</h3><button class="pill dark" data-a="close">完成</button></div>'
    + '<p class="hint">用来判断一队的角球高于还是低于平均。设一次就一直留着，每场都用。平均线按 a、b 都是 1 计算。</p>'
    + FAVQ.map(q => {
      const cap = q.k === 'y' ? r1(100 - (FAVG.h || 0)) : q.k === 'h' ? r1(100 - (FAVG.y || 0)) : null;
      return '<div class="p1g"><h4>' + q.n + '</h4><div class="p1val"><b id="favv_' + q.k + '">' + favTxt(q, FAVG[q.k]) + '</b><span>' + q.d + '</span></div>'
        + slHTML('fav', q.k, FAVG[q.k], { hi: q.hi, st: q.st, u: q.u, cap: cap, cls: 'h', lab: q.n })
        + '<div class="slends"><span>' + q.lo + '</span><span>' + q.ho + '</span></div></div>';
    }).join('')
    + '<p class="netnote" id="favLine">' + favLineHTML() + '</p>'
    + '<button class="pill" data-a="favclr"' + (FAVG.x == null && FAVG.y == null && FAVG.h == null ? ' disabled' : '') + '>清除联赛平均</button>';
}
function favInput(x, v){
  FAVD = { x: x, v: v };
  const q = FAVQ.filter(y => y.k === x)[0];
  setTx('favv_' + x, favTxt(q, v));
  setTx('favLine', favLineHTML());
  renderFres();
}
function favSet(x, v){ FAVD = null; FAVG[x] = v; LS.set(FAVK, FAVG); }
function favClear(){ FAVD = null; FAVG = fixFavg(null); LS.set(FAVK, FAVG); }
