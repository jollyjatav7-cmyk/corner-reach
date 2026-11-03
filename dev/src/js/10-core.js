/* ================= 工具 ================= */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad2 = n => String(n).padStart(2, '0');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const nowSec = () => Math.floor(Date.now() / 1000);
const ok = v => typeof v === 'number' && isFinite(v);
const f1 = v => ok(v) ? v.toFixed(1) : '—';
const pc = v => ok(v) ? Math.round(v * 100) + '%' : '—';
const r1 = v => Math.round(v * 10) / 10;   // 拖动条的值最多一位小数
const fp = v => String(r1(v));             // 显示：62.5 → "62.5"，60 → "60"
const APPVER = '__APPVER__';
const APPNAME = '角球到达与选择';
const LS = {
  get(k, d){ try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e){ return d; } },
  set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e){ return false; } }
};
const phoneMQ = window.matchMedia('(max-width: 599px)');
const isPhone = () => phoneMQ.matches;

/* ================= 到达之后的选择链 =================
   第一步（选择）：x 传中、l 远射、m 中路渗透、b 回传、g 丢球。后面按你的思维导图：
   传中 → i 内／o 外；传中·内 → s 禁区射门（g 进球／c 角球／n 无角球）或 c 解围、中途拦截（c 角球／n 无角球）
   远射 → i 内（g 进球／c 角球／n 无角球）／o 外
   中路渗透 → s 禁区射门（g 进球／c 角球／n 无角球）／n 没有禁区射门
   一次到达存成一串字母，例如 "xisc" ＝ 传中 → 内 → 禁区射门 → 角球；没选完就是比较短的一串。 */
const R3 = { g: { n: '进球', r: 'g' }, c: { n: '角球', r: 'c' }, n: { n: '无角球', r: 'n' } };
const R2 = { c: { n: '角球', r: 'c' }, n: { n: '无角球', r: 'n' } };
const TREE = {
  x: { n: '传中', q: '落点？', o: ['i', 'o'], k: {
    i: { n: '内', d: '传到威胁范围', q: '接下来？', o: ['s', 'c'], k: {
      s: { n: '禁区射门', bs: 1, q: '结果？', o: ['g', 'c', 'n'], k: R3 },
      c: { n: '解围/中途拦截', s: '解围拦截', q: '结果？', o: ['c', 'n'], k: R2 } } },
    o: { n: '外', d: '传偏了' } } },
  l: { n: '远射', q: '落点？', o: ['i', 'o'], k: {
    i: { n: '内', d: '射正、被挡、碰到人', q: '结果？', o: ['g', 'c', 'n'], k: R3 },
    o: { n: '外', d: '射偏、打高' } } },
  m: { n: '中路渗透', q: '接下来？', o: ['s', 'n'], k: {
    s: { n: '禁区射门', bs: 1, q: '结果？', o: ['g', 'c', 'n'], k: R3 },
    n: { n: '无禁区射门' } } },
  b: { n: '回传' },
  g: { n: '丢球' }
};
const CH = ['x', 'l', 'm', 'b', 'g'];
const ROOT = { n: '', q: '选哪一个？', o: CH, k: TREE };
function walk(pa){
  const out = []; let nd = ROOT; pa = String(pa || '');
  for (let j = 0; j < pa.length; j++){ const c = pa[j]; if (!nd.k || !nd.k[c]) break; nd = nd.k[c]; out.push(nd); }
  return out;
}
const cleanPa = pa => String(pa || '').slice(0, walk(pa).length);
const tipOf = pa => { const w = walk(pa); return w.length ? w[w.length - 1] : ROOT; };
const isDone = pa => { const w = walk(pa); return w.length > 0 && !w[w.length - 1].o; };
const resOf = pa => { const w = walk(pa), t = w[w.length - 1]; return t && t.r ? t.r : null; };
const hasBox = pa => walk(pa).some(n => n.bs);
const paLabel = (pa, sep) => walk(pa).map(n => n.s || n.n).join(sep || ' › ');
const CHN = { x: '传中', l: '远射', m: '中路渗透', b: '回传', g: '丢球' };

/* ================= 第一部分（主观，随时可以改）和两个问题 =================
   球权、难度、意愿和两个问题都是拖动条：存百分比（0–100，最多一位小数；每格多少在功能 → 拖动条，默认 1%）。
   场面还是三个选项：存第几个（0 开始）。
   球权只有一条：主队＋客队＝100%，两队各存一笔，用同一个 g 配对。
   bk 是统计用的区间 [下限, 上限)，跟画面上显示的字。值最多一位小数，所以 60.05 当上限＝60% 还算中间那一档；
   三档的中间一档两头都算（40% 和 60% 都是“中”，球权主 40%／客 60% 两队才对称）。 */
const BK3 = w => [[0, 40, '0–39.9%', w[0]], [40, 60.05, '40–60%', w[1]], [60.05, 101, '60.1–100%', w[2]]];
const BK5 = w => [[0, 20, '0–19.9%', w[0]], [20, 40, '20–39.9%', w[1]], [40, 60, '40–59.9%', w[2]], [60, 80, '60–79.9%', w[3]], [80, 101, '80–100%', w[4]]];
const P1 = [
  { f: 'bq', pct: 1, n: '球权', s: '球权', lo: '少', hi: '多', bk: BK3(['少', '中', '多']) },
  { f: 'nd', pct: 1, n: '到禁区附近的难度', s: '难度', lo: '没难度', hi: '难且进不去', bk: BK5(['没难度', '有难度但小', '有难度但进得去', '有很大难度但勉强进得去', '难且进不去']) },
  { f: 'yy', pct: 1, n: '到禁区附近的意愿', s: '意愿', lo: '弱', hi: '强', bk: BK3(['弱', '中', '强']) },
  { f: 'cm', n: '到禁区附近的场面', s: '场面', o: ['包饺子', '包一会饺子然后转换球权', '快速转换球权'], ab: ['包饺子', '包一会', '快转换'] }
];
const QS = [
  { f: 'q1', pct: 1, n: '他容不容易到对方禁区附近？', s: '容不容易到禁区附近', d: '几次进攻里有百分之几能到对方禁区附近', lo: '很难', hi: '很容易', bk: BK5(['很难', '难', '一般', '容易', '很容易']) },
  { f: 'q2', pct: 1, n: '他喜不喜欢传中和远射？', s: '喜不喜欢传中和远射', d: '传中和远射的比例', lo: '很不喜欢', hi: '很喜欢', bk: BK5(['很不喜欢', '不喜欢', '一般', '喜欢', '很喜欢']) }
];
const SVF = {}; P1.concat(QS).forEach(x => { SVF[x.f] = x; });
const bucketOf = (f, v) => { const b = SVF[f].bk; for (let j = 0; j < b.length; j++) if (v >= b[j][0] && v < b[j][1]) return j; return b.length - 1; };
const wordOf = (f, v) => v == null ? '' : SVF[f].bk[bucketOf(f, v)][3];
const svText = (f, v) => { const x = SVF[f]; if (v == null) return '清除'; return x.pct ? pctText(f, v) : x.o[v]; };
/* 旧版（v1）存的是第几个选项：换成那一档中间的百分比（原来的选项留在 o） */
const OLDPCT = { bq: [65, 50, 35], nd: [10, 30, 50, 70, 90], yy: [80, 50, 20], q1: [10, 30, 50, 70, 90], q2: [10, 30, 50, 70, 90] };
const SIMPLE = { ar: '到达', ck: '其他角球', gl: '进球', rc: '红牌' };

/* ================= 保存 ================= */
const KEY = 'corner-reach-matches', CURK = 'corner-reach-current';
let store = LS.get(KEY, {}) || {};
let M = null, seq = 0;
const PER = { 1: [0, 2700, '上半场'], 2: [2700, 5400, '下半场'] };
function newMatch(prev){
  const d = new Date();
  return { id: 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), c: nowSec(), u: nowSec(),
    d: d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()), lg: prev ? prev.lg : '', h: '', a: '', st: 1,
    tm: { p: 1, b: 0, r: 0, at: 0, ht: 0 }, pe: {}, obs: null, stop: null, note: '', keep: 0, api: null, apiNo: null, kw: null, ev: [], sv: [], pv: 1, al: [], mc: null };
}
const numOr = (v, d) => ok(v) ? v : d;
function fixEv(e){
  if (!e || !SIMPLE[e.c] || !PER[e.p] || (e.i !== 0 && e.i !== 1)) return null;
  const x = { t: Math.max(0, Math.round(numOr(+e.t, 0))), p: +e.p, i: e.i, c: e.c, k: ++seq };
  if (e.c === 'ar'){ x.pa = cleanPa(e.pa); if (ok(+e.dt) && e.dt !== null && e.dt !== '') x.dt = Math.max(0, Math.round(+e.dt * 10) / 10); }
  else { if (e.b) x.b = 1; if (e.a) x.a = 1; }
  return x;
}
function fixSv(s, old){
  if (!s || !SVF[s.f] || !PER[s.p] || (s.i !== 0 && s.i !== 1)) return null;
  const x = SVF[s.f];
  let v = s.v == null || s.v === '' ? null : +s.v, o = null;
  if (v != null && !isFinite(v)) return null;
  if (x.pct && v != null){
    if (old){ v = Math.round(v); const mp = OLDPCT[s.f]; if (!(v >= 0 && v < mp.length)) return null; o = v; v = mp[v]; }
    else { v = clamp(r1(v), 0, 100); if (s.o != null && isFinite(+s.o)) o = +s.o; }   // 百分比留一位小数
  } else if (v != null){ v = Math.round(v); if (!(v >= 0 && v < x.o.length)) return null; }
  const r = { t: Math.max(0, Math.round(numOr(+s.t, 0))), p: +s.p, i: s.i, f: s.f, v: v, k: ++seq };
  if (o != null) r.o = o;
  if (s.g != null && isFinite(+s.g)) r.g = +s.g;
  return r;
}
const fixAl = a => a && PER[a.p] && (a.g === 'r' || a.g === 'q') && (a.i === 0 || a.i === 1) && (a.v === 'b' || a.v === 's' || a.v === '') ? { t: Math.max(0, Math.round(numOr(+a.t, 0))), p: +a.p, g: a.g, i: a.i, v: a.v } : null;
function fixMatch(m){
  m.lg = String(m.lg || ''); m.h = String(m.h || ''); m.a = String(m.a || ''); m.d = String(m.d || '');
  m.st = m.st === 2 ? 2 : 1;
  const tm = m.tm && PER[m.tm.p] ? m.tm : { p: 1, b: 0, r: 0, at: 0, ht: 0 };
  m.tm = { p: +tm.p, b: Math.max(0, numOr(tm.b, 0)), r: tm.r ? 1 : 0, at: numOr(tm.at, 0), ht: tm.ht ? 1 : 0 };
  const pe = m.pe && typeof m.pe === 'object' ? m.pe : {};
  m.pe = {}; for (const p of [1, 2]) if (ok(pe[p])) m.pe[p] = pe[p];
  m.obs = m.obs && PER[m.obs.p] ? { p: +m.obs.p, t: Math.max(0, numOr(m.obs.t, 0)) } : null;
  m.stop = m.stop && PER[m.stop.p] ? { p: +m.stop.p, t: Math.max(0, numOr(m.stop.t, 0)) } : null;
  m.note = String(m.note || ''); m.keep = m.keep ? 1 : 0;
  m.api = m.api && typeof m.api === 'object' && isFinite(+m.api.id) ? Object.assign({}, m.api, { id: +m.api.id, sw: m.api.sw ? 1 : 0 }) : null;
  m.apiNo = typeof m.apiNo === 'string' ? m.apiNo : null; m.apiErr = null;
  m.kw = m.kw && typeof m.kw === 'object' ? m.kw : null;
  m.ev = (Array.isArray(m.ev) ? m.ev : []).map(fixEv).filter(Boolean);
  const old = m.pv !== 1;   // v1 的比赛：主观选择还是选项，换成百分比
  m.sv = (Array.isArray(m.sv) ? m.sv : []).map(s => fixSv(s, old)).filter(Boolean);
  m.pv = 1;
  m.al = (Array.isArray(m.al) ? m.al : []).map(fixAl).filter(Boolean);   // 简易模型的提醒什么时候出现、消失
  m.mc = m.mc && typeof m.mc === 'object' ? m.mc : null;                 // 当时用的模型标准
  sortEv(m);
  return m;
}
const byTime = (x, y) => x.p - y.p || x.t - y.t || x.k - y.k;
const sortEv = m => { m.ev.sort(byTime); m.sv.sort(byTime); };
let saveT = 0;
function saveNow(){
  clearTimeout(saveT); saveT = 0;
  M.u = nowSec();
  const empty = !M.ev.length && !M.sv.length && !M.h && !M.a && !M.tm.b && !M.tm.r;
  if (!empty || store[M.id]) store[M.id] = M;
  if (!LS.set(KEY, store)) showToast('保存失败：空间可能不足，请先导出备份');
  LS.set(CURK, M.id);
}
const save = () => { clearTimeout(saveT); saveT = setTimeout(saveNow, 300); };
window.addEventListener('pagehide', () => { if (saveT) saveNow(); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && saveT) saveNow(); });
for (const id in store){ if (store[id] && typeof store[id] === 'object') fixMatch(store[id]); else delete store[id]; }
M = store[LS.get(CURK, '')] || newMatch();
const PREF = Object.assign({ scope: 'auto', mode: 'rec', st: 1, hn: 0, hw: 1 }, LS.get('corner-reach-pref', {}) || {});
const savePref = () => LS.set('corner-reach-pref', PREF);
/* 拖动条每格多少（百分比的项目：第一部分、两个问题、模型的标准）：功能 → 拖动条 */
const SLSTEPS = [1, 0.5, 0.1];
const pctStep = () => SLSTEPS.indexOf(+PREF.st) >= 0 ? +PREF.st : 1;
/* 隐藏数字（PREF.hn）：画面上不显示你拖的百分比，只看条的位置判断，不受数字影响。
   PREF.hw＝1（默认）：隐藏时连按百分比分档的文字（例如“有难度但小”）也隐藏。
   只影响画面：记录、统计、导出照样有数字；简易模型的标准照样显示数字。 */
const hideNum = () => !!PREF.hn;
const hideWord = () => !!PREF.hn && PREF.hw !== 0;
// 一个拖动条的值写成字：62.5%；隐藏数字时是分档的文字，或“已设”
const pctText = (f, v) => !hideNum() ? fp(v) + '%' : hideWord() ? '已设' : wordOf(f, v);

/* ================= 计时（跟“角球数据记录”一样） ================= */
const clockOf = m => m.tm.r ? m.tm.b + (Date.now() - m.tm.at) / 1000 : m.tm.b;
function fmtClock(p, t){
  t = Math.max(0, Math.floor(t)); const end = PER[p][1];
  if (t > end){ const x = t - end; return (end / 60) + '+' + Math.floor(x / 60) + ':' + pad2(x % 60); }
  return pad2(Math.floor(t / 60)) + ':' + pad2(t % 60);
}
function fmtMin(p, t){ const end = PER[p][1]; t = Math.max(0, Math.floor(t)); return t > end ? (end / 60) + '+' + (Math.floor((t - end) / 60) + 1) + "'" : (Math.floor(t / 60) + 1) + "'"; }
const maxT = (m, p) => { let a = 0; for (const e of m.ev) if (e.p === p && !e.b) a = Math.max(a, e.t); for (const s of m.sv) if (s.p === p) a = Math.max(a, s.t); return a; };
const curP = () => M.tm.ht ? 1 : M.tm.p;
function startClock(){
  if (!M.tm.r){ M.tm.r = 1; M.tm.at = Date.now(); }
  M.tm.ht = 0;
  if (!M.obs) M.obs = { p: M.tm.p, t: Math.round(M.tm.b) };
}
function pauseClock(){ if (M.tm.r){ M.tm.b = Math.round(clockOf(M)); M.tm.r = 0; } }
function setClock(sec){ M.tm.b = Math.max(PER[M.tm.p][0], Math.round(sec)); if (M.tm.r) M.tm.at = Date.now(); }
function kick(p){
  if (p === 1){ M.obs = { p: 1, t: 0 }; }
  if (p === 2){
    if (!M.pe[1]){ const c = clockOf(M); M.pe[1] = M.tm.p === 1 && c >= 2700 && c <= 3900 ? Math.round(c) : Math.max(2700, maxT(M, 1)); }
    if (!M.obs) M.obs = { p: 2, t: 2700 };
  }
  M.tm = { p: p, b: PER[p][0], r: 1, at: Date.now(), ht: 0 };
  if (M.st === 2){ M.st = 1; M.stop = null; }
  M.kw = Object.assign({}, M.kw); M.kw[p] = nowSec();
  return M.api ? delayFromKick() : null;
}
function endFirstHalf(){
  pauseClock();
  M.pe[1] = Math.max(Math.round(clockOf(M)), maxT(M, 1), 2700);
  M.tm.ht = 1;
}
function finishMatch(){
  const ht = M.tm.ht;
  pauseClock();
  const p = ht ? 1 : M.tm.p;
  const t = Math.max(ht && M.pe[1] ? M.pe[1] : Math.round(clockOf(M)), maxT(M, p));
  M.stop = { p: p, t: t };
  if (p === 2 && t >= PER[2][1] && t <= PER[2][1] + 1200) M.pe[2] = t;
  M.st = 2; M.tm.ht = 0;
}
/* 选时间：半场按钮＋拖动条＋加减按钮。tp = { p, v, live, at } */
const TPR = { 1: [0, 3600], 2: [2700, 6300] };
const TPL = { 1: ["0'", "15'", "30'", "45'", '+15'], 2: ["45'", "60'", "75'", "90'", '+15'] };
const tpNow = tp => tp.live && tp.at ? clamp(tp.v + Math.floor((Date.now() - tp.at) / 1000), TPR[tp.p][0], TPR[tp.p][1]) : tp.v;
function tpSet(tp, v){ tp.v = clamp(Math.round(v), TPR[tp.p][0], TPR[tp.p][1]); if (tp.live) tp.at = Date.now(); }
function tpHTML(tp){
  const a = TPR[tp.p][0], b = TPR[tp.p][1], v = tpNow(tp);
  return '<div class="tp"><div class="chips">' + [1, 2].map(q => '<button class="chip" data-a="tpp" data-p="' + q + '" aria-pressed="' + (tp.p === q) + '">' + PER[q][2] + '</button>').join('') + '</div>'
    + '<div class="tpv" id="tpV">' + fmtClock(tp.p, v) + '</div>'
    + '<input type="range" class="tpr" id="tpR" min="' + a + '" max="' + b + '" step="60" value="' + Math.floor(v / 60) * 60 + '" aria-label="比赛时间">'
    + '<div class="tps" aria-hidden="true">' + TPL[tp.p].map((x, j) => '<span style="left:' + (j * 25) + '%">' + x + '</span>').join('') + '</div>'
    + '<div class="tpb">' + [[-60, '−1 分'], [-30, '−30 秒'], [-10, '−10 秒'], [10, '＋10 秒'], [30, '＋30 秒'], [60, '＋1 分']].map(x => '<button class="chip" data-a="tpn" data-d="' + x[0] + '">' + x[1] + '</button>').join('') + '</div></div>';
}
function tpShow(tp){
  const v = $('#tpV'), r = $('#tpR'), g = $('#jgoT'), x = tpNow(tp);
  if (v) v.textContent = fmtClock(tp.p, x);
  if (r && document.activeElement !== r && +r.value !== Math.floor(x / 60) * 60) r.value = Math.floor(x / 60) * 60;
  if (g) g.textContent = fmtClock(tp.p, x);
}
function tpHalf(tp, q){
  if (q === tp.p) return;
  const v = tpNow(tp);
  tp.p = q; tpSet(tp, q === 2 ? v + PER[2][0] : v - PER[2][0]);
}

/* ================= 事件 ================= */
function nowStamp(){
  const p = curP();
  const t = M.tm.ht ? (M.pe[1] || clockOf(M)) : clockOf(M);
  return { p: p, t: Math.round(t) };
}
function addEv(i, c, extra){
  const s = nowStamp();
  if (!M.obs) M.obs = { p: s.p, t: Math.min(s.t, PER[s.p][0]) };
  const e = Object.assign({ t: s.t, p: s.p, i: i, c: c, k: ++seq }, extra || {});
  M.ev.push(e); M.ev.sort(byTime);
  save();
  return e;
}
const evByK = k => { for (const e of M.ev) if (e.k === k) return e; return null; };
const svByK = k => { for (const s of M.sv) if (s.k === k) return s; return null; };
function removeEv(e){ const j = M.ev.indexOf(e); if (j >= 0) M.ev.splice(j, 1); save(); }
function lastOf(i){ let best = null; for (const e of M.ev) if ((i == null || e.i === i) && !e.b && (!best || e.k > best.k)) best = e; return best; }
/* 主观选择：同一项 20 秒内又改，当作改正（取代上一笔），不另记一笔 */
function setSv(i, f, v, g){
  const s = nowStamp(), cur = svCur(M, i, f);
  if (cur && cur.p === s.p && Math.abs(s.t - cur.t) <= 20 && cur.k === lastSvK(i, f) && Date.now() - (cur.at || 0) < 20000){
    cur.v = v; cur.t = s.t; cur.at = Date.now(); M.sv.sort(byTime); save(); return cur;
  }
  if (!M.obs) M.obs = { p: s.p, t: Math.min(s.t, PER[s.p][0]) };
  const x = { t: s.t, p: s.p, i: i, f: f, v: v, k: ++seq, at: Date.now() };
  if (g != null) x.g = g;
  M.sv.push(x); M.sv.sort(byTime); save();
  return x;
}
/* 球权：v＝主队的百分比（null＝清除），客队自动是 100−v */
let bqG = 0;
function setBq(v){
  const h = svCur(M, 0, 'bq'), a = svCur(M, 1, 'bq'), av = v == null ? null : r1(100 - v);
  if (h && a && h.v === v && a.v === av) return;
  const g = Math.max(Date.now(), bqG + 1); bqG = g;
  setSv(0, 'bq', v, g); setSv(1, 'bq', av, g);
}
/* 球权配对的另一笔（同一个 g、另一队） */
function svPair(s){
  if (!s || s.f !== 'bq' || s.g == null) return null;
  for (const x of M.sv) if (x !== s && x.f === 'bq' && x.g === s.g && x.i !== s.i) return x;
  return null;
}
let SL = null, SB = null, rdPend = 0;   // 正在拖的拖动条、正在按的 −／＋；这时候先不重画画面
const slBusy = () => !!((SL && SL.s === 'd') || SB);
const slBusyEl = () => SL && SL.s === 'd' ? SL.el : SB ? SB.el : null;
const lastSvK = (i, f) => { let k = 0; for (const s of M.sv) if (s.i === i && s.f === f && s.k > k) k = s.k; return k; };
/* 现在的选择：最后记的那一笔；某个时间点的选择：那个时间以前最后一笔 */
function svCur(m, i, f){ let best = null; for (const s of m.sv) if (s.i === i && s.f === f && (!best || s.k > best.k)) best = s; return best; }
function svAt(m, i, f, p, t){ let best = null; for (const s of m.sv) if (s.i === i && s.f === f && (s.p < p || (s.p === p && s.t <= t))) best = s; return best; }

/* ================= 计算：看了多久、各种次数 ================= */
function halfSpan(m, p){
  const o = m.obs || { p: 1, t: 0 };
  if (o.p > p) return null;
  const S = o.p === p ? o.t : PER[p][0];
  const cp = m.tm.ht ? 1 : m.tm.p;
  let E;
  if (m.st === 2 && m.stop){
    if (p < m.stop.p) E = m.pe[p] || PER[p][1];
    else if (p === m.stop.p) E = m.stop.t;
    else return null;
  } else if (p < cp) E = m.pe[p] || PER[p][1];
  else if (p === cp) E = m.tm.ht ? (m.pe[1] || clockOf(m)) : clockOf(m);
  else return null;
  E = Math.max(E, maxT(m, p));
  return E > S ? [S, E] : null;
}
function minsOf(m, scope){
  let s = 0;
  for (const p of scope === 'ft' ? [1, 2] : [+scope[1]]){ const sp = halfSpan(m, p); if (sp) s += (sp[1] - sp[0]) / 60; }
  return s;
}
/* 整个半场都有看到：开始不晚于开球后 5 分钟，而且这个半场已经结束 */
function fullHalf(m, p){
  const sp = halfSpan(m, p); if (!sp) return false;
  const o = m.obs || { p: 1, t: 0 };
  const startOk = o.p < p || (o.p === p && o.t <= PER[p][0] + 300);
  const ended = p === 1 ? (!!m.pe[1] || (m.st === 2 && m.stop && m.stop.p === 2) || m.tm.p === 2) : (m.st === 2 && m.stop && m.stop.p === 2 && m.stop.t >= PER[2][1] - 120);
  return startOk && !!ended;
}
/* 一队在一个范围（h1 上半场、h2 下半场、ft 全场）的所有次数 */
function statOf(m, i, scope){
  const want = scope === 'ft' ? 0 : +scope[1];
  const r = { ar: 0, ch: { x: 0, l: 0, m: 0, b: 0, g: 0 }, none: 0, chosen: 0, dt: [], dtc: { x: [], l: [], m: [], b: [], g: [] },
    io: { x: [0, 0], l: [0, 0] }, xn: { s: 0, c: 0 }, mn: { s: 0, n: 0 }, bs: 0, ls: 0, sh: 0,
    ck: 0, ckc: 0, cks: { x: 0, l: 0, m: 0, o: 0 }, ckb: 0, cka: 0, gl: 0, glb: 0, rc: 0 };
  for (const e of m.ev){
    if (e.i !== i || (want && e.p !== want)) continue;
    if (e.c === 'ar'){
      r.ar++;
      const ch = e.pa ? e.pa[0] : '';
      if (!ch){ r.none++; continue; }
      r.ch[ch]++; r.chosen++;
      if (ok(e.dt)){ r.dt.push(e.dt); r.dtc[ch].push(e.dt); }
      if ((ch === 'x' || ch === 'l') && e.pa.length > 1) r.io[ch][e.pa[1] === 'i' ? 0 : 1]++;
      if (ch === 'x' && e.pa.length > 2) r.xn[e.pa[2]]++;
      if (ch === 'm' && e.pa.length > 1) r.mn[e.pa[1]]++;
      if (ch === 'l') r.ls++;
      if (hasBox(e.pa)) r.bs++;
      const res = resOf(e.pa);
      if (res === 'c'){ r.ck++; r.ckc++; r.cks[ch]++; }
      else if (res === 'g') r.gl++;
    } else if (e.c === 'ck'){ r.ck++; if (e.b) r.ckb++; else { r.cks.o++; if (e.a) r.cka++; } }
    else if (e.c === 'gl'){ r.gl++; if (e.b) r.glb++; }
    else if (e.c === 'rc') r.rc++;
  }
  r.sh = r.bs + r.ls;
  return r;
}
const score = m => [statOf(m, 0, 'ft').gl, statOf(m, 1, 'ft').gl];
const cornersOf = (m, scope) => [statOf(m, 0, scope).ck, statOf(m, 1, scope).ck];
const avg = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;
function median(a){ if (!a.length) return null; const s = a.slice().sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; }
/* 每个区间（拖动条）或选项（场面）停留了几分钟、那段时间几个角球（统计和导出用）。
   键：区间或选项第几个，-1＝没设；avg＝按时间平均的百分比（拖动条才有） */
function stateSplit(m, i, f, scope){
  const x = SVF[f], n = x.pct ? x.bk.length : x.o.length;
  const key = v => v == null ? -1 : x.pct ? bucketOf(f, v) : v;
  const out = { avg: null }; let sw = 0, sm = 0;
  for (let v = -1; v < n; v++) out[v] = { mins: 0, ck: 0, ar: 0, xl: 0 };
  const ps = scope === 'ft' || !scope ? [1, 2] : [+scope[1]];
  for (const p of ps){
    const sp = halfSpan(m, p); if (!sp) continue;
    // 这个半场里的切换点
    const cuts = [];
    for (const s of m.sv) if (s.i === i && s.f === f && s.p === p && s.t > sp[0] && s.t < sp[1]) cuts.push(s.t);
    let t0 = sp[0];
    const pts = cuts.concat([sp[1]]);
    for (const t1 of pts){
      if (t1 > t0){
        const s = svAt(m, i, f, p, t0), v = s ? s.v : null, d = (t1 - t0) / 60;
        out[key(v)].mins += d;
        if (x.pct && v != null){ sw += v * d; sm += d; }
      }
      t0 = t1;
    }
    for (const e of m.ev){
      if (e.i !== i || e.p !== p || e.b) continue;
      if (e.t < sp[0] || e.t > sp[1]) continue;
      const s = svAt(m, i, f, p, e.t), o = out[key(s ? s.v : null)];
      if (e.c === 'ck' || (e.c === 'ar' && resOf(e.pa) === 'c')) o.ck++;
      if (e.c === 'ar'){ o.ar++; if (e.pa && (e.pa[0] === 'x' || e.pa[0] === 'l')) o.xl++; }
    }
  }
  out.avg = sm > 0 ? sw / sm : null;
  return out;
}
