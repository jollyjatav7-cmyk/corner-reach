/* ================= 简易模型（你主观定的标准，暂时用） =================
   两个程序各一套：r 到达与选择、q 两个问题。每套有“大角”(b) 和“小角”(s) 两条规则，
   每条规则两组条件：all＝全部满足才算；any＝满足任意一项就算（两组有一组成立就提醒）。
   条件 { m 项目, op 比较, v 标准 }；场面是 { m:'cm', in:[算数的选项] }。
   两队合起来：都大角 → 投大角；都小角 → 投小角；只有一队有提醒、或一队大角一队小角 → 投角球让球（投角球会比较多的那队）。
   这只是提醒，不改任何记录；比赛数据照常记，以后用真实数据建更准的模型。 */
const MET = {
  bq: { n: '球权', u: '%', gp: 0 },
  nd: { n: '到禁区附近的难度', s: '难度', u: '%', gp: 0 },
  yy: { n: '到禁区附近的意愿', s: '意愿', u: '%', gp: 0 },
  cm: { n: '到禁区附近的场面', s: '场面', cat: 1, gp: 0 },
  q1: { n: '问题一：容不容易到禁区附近', s: '问题一', u: '%', gp: 1 },
  q2: { n: '问题二：喜不喜欢传中和远射', s: '问题二', u: '%', gp: 1 },
  xl: { n: '传中＋远射 占三项', s: '传中＋远射占三项', u: '%', gp: 2, d: '（传中＋远射）÷（传中＋远射＋中路渗透）' },
  xin: { n: '传中在范围内的比例', s: '传中内', u: '%', gp: 2, d: '传中里“内”的比例' },
  lin: { n: '远射在范围内的比例', s: '远射内', u: '%', gp: 2, d: '远射里“内”的比例' },
  bg: { n: '回传＋丢球 占五项', s: '回传＋丢球', u: '%', gp: 2, d: '到达后回传或丢球的比例' },
  ar10: { n: '每 10 分钟到达', s: '每10分钟到达', u: '次', lo: 0, hi: 10, st: 0.1, gp: 2, d: '要看满 10 分钟才算' },
  dt: { n: '从到达到选择的平均秒数', s: '平均用时', u: '秒', lo: 0, hi: 15, st: 0.1, gp: 2, d: '越短越果断' }
};
const MORD = ['bq', 'nd', 'yy', 'cm', 'q1', 'q2', 'xl', 'xin', 'lin', 'bg', 'ar10', 'dt'];
const MGP = ['你的判断（第一部分）', '两个问题', '记下的到达和选择'];
const OPS = { gt: '高于', ge: '至少', lt: '低于', le: '最多' };
const OPK = ['gt', 'ge', 'lt', 'le'];
const MPROG = { r: '到达与选择', q: '两个问题' };
// 标准的拖动条每格多少：百分比的项目跟着“功能 → 拖动条”，次数和秒数每格 0.1
const mLo = k => MET[k].lo == null ? 0 : MET[k].lo, mHi = k => MET[k].hi == null ? 100 : MET[k].hi, mSt = k => MET[k].st || pctStep();
const MDEF = { on: 1, sc: 'half', min: 4,
  r: { b: { all: [{ m: 'bq', op: 'ge', v: 30 }, { m: 'nd', op: 'lt', v: 50 }, { m: 'yy', op: 'gt', v: 50 }, { m: 'xl', op: 'gt', v: 50 }], any: [] },
       s: { all: [{ m: 'bq', op: 'le', v: 70 }, { m: 'nd', op: 'gt', v: 60 }, { m: 'yy', op: 'lt', v: 50 }, { m: 'xl', op: 'lt', v: 40 }], any: [{ m: 'nd', op: 'gt', v: 80 }, { m: 'xl', op: 'lt', v: 20 }] } },
  q: { b: { all: [{ m: 'q1', op: 'gt', v: 60 }, { m: 'q2', op: 'gt', v: 60 }], any: [] },
       s: { all: [{ m: 'q1', op: 'lt', v: 40 }, { m: 'q2', op: 'lt', v: 40 }], any: [] } } };
const clone = o => JSON.parse(JSON.stringify(o));
function fixCond(c){
  if (!c || !MET[c.m]) return null;
  if (MET[c.m].cat){
    const a = []; for (const v of Array.isArray(c.in) ? c.in : []){ const n = +v; if (n >= 0 && n < P1[3].o.length && a.indexOf(n) < 0) a.push(n); }
    return { m: c.m, in: a.sort() };
  }
  const k = c.m;   // 标准最多一位小数（不管现在每格多少，之前用小格子定的标准照样留着）
  return { m: k, op: OPS[c.op] ? c.op : 'gt', v: clamp(r1(numOr(+c.v, (mLo(k) + mHi(k)) / 2)), mLo(k), mHi(k)) };
}
function fixModel(o){
  const d = clone(MDEF); if (!o || typeof o !== 'object') return d;
  const r = { on: o.on === 0 ? 0 : 1, sc: o.sc === 'ft' ? 'ft' : 'half', min: clamp(Math.round(numOr(+o.min, 4)), 1, 10) };
  for (const g of ['r', 'q']){
    r[g] = {};
    for (const w of ['b', 's']){
      r[g][w] = {};
      for (const l of ['all', 'any']){
        const src = o[g] && o[g][w] && Array.isArray(o[g][w][l]) ? o[g][w][l] : d[g][w][l];
        r[g][w][l] = src.map(fixCond).filter(Boolean);
      }
    }
  }
  return r;
}
let MODEL = fixModel(LS.get('corner-reach-model', null));
const saveModel = () => LS.set('corner-reach-model', MODEL);
const mScope = () => MODEL.sc === 'ft' ? 'ft' : 'h' + curP();

/* 一个项目现在的值：{ v 数值（场面＝第几个，null＝还不算）, why 不算的原因 } */
function metVal(i, k, r, sc){
  const need = MODEL.min;
  if (SVF[k]){ const s = svCur(M, i, k); return s && s.v != null ? { v: s.v } : { v: null, why: '还没设' }; }
  if (k === 'xl'){ const n = r.ch.x + r.ch.l + r.ch.m; return n >= need ? { v: (r.ch.x + r.ch.l) / n * 100 } : { v: null, why: '三项 ' + n + '/' + need + ' 次' }; }
  if (k === 'xin' || k === 'lin'){ const a = r.io[k[0]], n = a[0] + a[1]; return n >= need ? { v: a[0] / n * 100 } : { v: null, why: (k === 'xin' ? '传中 ' : '远射 ') + n + '/' + need + ' 次' }; }
  if (k === 'bg'){ const n = r.chosen; return n >= need ? { v: (r.ch.b + r.ch.g) / n * 100 } : { v: null, why: '五项 ' + n + '/' + need + ' 次' }; }
  if (k === 'ar10'){ const mins = minsOf(M, sc); return mins >= 10 ? { v: r.ar / mins * 10 } : { v: null, why: '看了 ' + Math.floor(mins) + '/10 分钟' }; }
  if (k === 'dt'){ const a = r.dt.filter(v => v <= DT_MAX); return a.length >= need ? { v: avg(a) } : { v: null, why: '有用时的 ' + a.length + '/' + need + ' 次' }; }
  return { v: null, why: '—' };
}
const EPS = 1e-9;
function condOK(c, mv){
  if (mv.v == null) return null;
  if (MET[c.m].cat) return c.in.indexOf(mv.v) >= 0;
  const a = mv.v, b = c.v;
  return c.op === 'gt' ? a > b + EPS : c.op === 'ge' ? a >= b - EPS : c.op === 'lt' ? a < b - EPS : a <= b + EPS;
}
/* 一队在一个程序的判断：v＝'b' 大角、's' 小角、'' 没有提醒（大小都成立也不提醒，clash） */
function mTeam(g, i){
  const sc = mScope(), r = statOf(M, i, sc);
  const one = c => { const mv = metVal(i, c.m, r, sc); return { c: c, mv: mv, ok: condOK(c, mv) }; };
  const side = w => {
    const R = MODEL[g][w], all = R.all.map(one), any = R.any.map(one);
    const okAll = all.length > 0 && all.every(x => x.ok === true), okAny = any.some(x => x.ok === true);
    return { all: all, any: any, ok: okAll || okAny };
  };
  const b = side('b'), s = side('s');
  return { b: b, s: s, v: b.ok && !s.ok ? 'b' : s.ok && !b.ok ? 's' : '', clash: b.ok && s.ok };
}
/* 两队合起来：k＝big 投大角、small 投小角、hc 投角球让球（i＝投哪一队） */
function mBet(a, b){
  if (a === 'b' && b === 'b') return { k: 'big' };
  if (a === 's' && b === 's') return { k: 'small' };
  if (a === 'b' || b === 'b') return { k: 'hc', i: a === 'b' ? 0 : 1 };   // 一队大角，另一队小角或没有提醒
  if (a === 's' || b === 's') return { k: 'hc', i: a === 's' ? 1 : 0 };   // 一队小角，另一队没有提醒：投没有提醒的那队
  return null;
}
let MN = null;   // 现在的判断（每次重画时算一次）
function mNow(g){ const t = [mTeam(g, 0), mTeam(g, 1)]; return { t: t, bet: mBet(t[0].v, t[1].v) }; }
function mAll(){ MN = { r: mNow('r'), q: mNow('q') }; return MN; }
const mSig = () => MN ? ['r', 'q'].map(g => MN[g].t[0].v + ',' + MN[g].t[1].v).join('|') : '';
/* 记下提醒什么时候出现、消失（导出用，以后可以检验这个模型准不准） */
function mLog(){
  if (!MN || M.st !== 1 || !MODEL.on) return;
  let ch = false;
  for (const g of ['r', 'q']) for (const i of [0, 1]){
    let last = ''; for (const a of M.al) if (a.g === g && a.i === i) last = a.v;
    const v = MN[g].t[i].v;
    if (v !== last){ const s = nowStamp(); M.al.push({ t: s.t, p: s.p, g: g, i: i, v: v }); ch = true; }
  }
  if (ch){ M.mc = clone(MODEL); save(); }
}
/* 编辑标准用：x＝'r.b.all.0' 这样的位置 */
function mCondAt(x){
  const p = String(x).split('.'), R = MODEL[p[0]] && MODEL[p[0]][p[1]], L = R && R[p[2]];
  return L && L[+p[3]] ? L[+p[3]] : null;
}
function newCond(k){
  if (MET[k].cat) return { m: k, in: [0] };
  if (k === 'ar10') return { m: k, op: 'gt', v: 3 };
  if (k === 'dt') return { m: k, op: 'lt', v: 3 };
  return { m: k, op: 'gt', v: 50 };
}
const fmtTh = (k, v) => MET[k].u === '%' ? fp(v) + '%' : fp(v) + ' ' + MET[k].u;
/* 现在的值：你设的（第一部分、两个问题）照原样；算出来的比例、次数、秒数用够看得出满不满足标准的位数
   （例如标准是高于 50%、现在 50.3%，就不能显示成 50%） */
function fmtMV(k, v, c){
  const x = MET[k];
  if (x.cat) return P1[3].o[v] || '—';
  let s;
  if (SVF[k]) s = fp(v);
  else {
    let d = x.u === '%' ? 0 : 1;
    while (d < 2 && c && condOK(c, { v: +v.toFixed(d) }) !== condOK(c, { v: v })) d++;
    s = String(+v.toFixed(d));
  }
  return x.u === '%' ? s + '%' : s + ' ' + x.u;
}
const mName = k => MET[k].s || MET[k].n;
function condText(c){
  if (MET[c.m].cat) return mName(c.m) + ' 是 ' + (c.in.length ? c.in.map(j => P1[3].o[j]).join(' 或 ') : '（没选）');
  return mName(c.m) + ' ' + OPS[c.op] + ' ' + fmtTh(c.m, c.v);
}
