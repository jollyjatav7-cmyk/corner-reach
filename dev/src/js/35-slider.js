/* ================= 拖动条 =================
   slHTML(种类, 参数, 值, 设定) 画一条，两边各有一个按钮（− 和 ＋；球权是往左、往右）。
   手指拖、点一下条、方向键、两边的按钮都可以；放开才记下（SLK[种类].commit）。
   拖的时候只更新这一条和旁边的数字（SLK[种类].input），整个画面等放开以后才重画。
   在可以上下捲动的视窗里，要先往左右移才开始拖（往上下就是捲动）；有 lock 的（两个问题）一按就开始。
   每格多少：百分比的项目跟着“功能 → 拖动条”（默认 1%），其他的看 o.st。
   两边的按钮：点一下动一格；按住不放，0.4 秒后开始一直动，放开才记下。 */
const ICS = {
  m: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8h9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  p: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8h9M8 3.5v9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  l: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5L5.5 8l4.5 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  r: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5L10.5 8 6 12.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};
function slHTML(kind, x, v, o){
  o = o || {};
  const lo = o.lo == null ? 0 : o.lo, hi = o.hi == null ? 100 : o.hi, st = o.st || pctStep(), one = fp(st) + (o.u == null ? '%' : o.u);
  const w = (v == null ? 50 : (clamp(v, lo, hi) - lo) / (hi - lo) * 100).toFixed(1) + '%';
  // o.lr：两边按钮的说明（球权用“往左／往右”，因为两队一起动）
  const btn = d => '<button type="button" class="slb" data-sb="' + d + '" aria-label="' + esc(o.lr ? o.lr[d > 0 ? 1 : 0] + ' ' + one : (o.lab || '') + (d > 0 ? ' 加 ' : ' 减 ') + one) + '">'
    + (o.lr ? (d > 0 ? ICS.r : ICS.l) : (d > 0 ? ICS.p : ICS.m)) + '</button>';
  return '<div class="slw' + (o.cls && /(^| )big( |$)/.test(o.cls) ? ' big' : '') + '">' + btn(-1)
    + '<div class="sl' + (o.cls ? ' ' + o.cls : '') + (v == null ? ' na' : '') + '" data-sl="' + kind + '" data-x="' + esc(x) + '" data-lo="' + lo + '" data-hi="' + hi + '" data-st="' + st + '" data-v="' + (v == null ? '' : v) + '"'
    + ' role="slider" tabindex="0" aria-label="' + esc(o.lab || '') + '" aria-valuemin="' + lo + '" aria-valuemax="' + hi + '"' + (v == null ? ' aria-valuetext="还没设"' : ' aria-valuenow="' + v + '"') + '>'
    + '<div class="sl-t"><i class="sl-f" style="width:' + w + '"></i><b class="sl-k" style="left:' + w + '"></b></div></div>' + btn(1) + '</div>';
}
/* 手指或滑鼠的位置 → 值（对齐到格子） */
function slVal(el, cx){
  const t = el.querySelector('.sl-t').getBoundingClientRect(), lo = +el.dataset.lo, hi = +el.dataset.hi, st = +el.dataset.st;
  const r = t.width > 0 ? clamp((cx - t.left) / t.width, 0, 1) : 0.5;
  return clamp(+(Math.round((lo + r * (hi - lo)) / st) * st).toFixed(2), lo, hi);
}
/* 往右（d=1）或往左（d=-1）一格；big＝一大格（大约全长的十分之一，键盘的 PageUp／PageDown）。
   不在格子上的值（例如之前每格 0.5% 记的 62.5%，现在每格 1%）先走到旁边的格子；还没设的从中间开始。 */
function slNext(el, d, big){
  const lo = +el.dataset.lo, hi = +el.dataset.hi, st = +el.dataset.st, cur = el.dataset.v === '' ? null : +el.dataset.v;
  const inc = big ? st * Math.max(1, Math.round((hi - lo) / 10 / st)) : st;
  const base = cur == null ? (lo + hi) / 2 : cur;
  const n = d > 0 ? Math.floor(base / inc + 1e-6) + 1 : Math.ceil(base / inc - 1e-6) - 1;
  return clamp(+(n * inc).toFixed(2), lo, hi);
}
function slShow(el, v){
  const lo = +el.dataset.lo, hi = +el.dataset.hi, w = ((v - lo) / (hi - lo) * 100).toFixed(1) + '%';
  el.classList.remove('na');
  el.querySelector('.sl-f').style.width = w; el.querySelector('.sl-k').style.left = w;
  el.dataset.v = v; el.setAttribute('aria-valuenow', v); el.removeAttribute('aria-valuetext');
  const k = SLK[el.dataset.sl]; if (k && k.input) k.input(el.dataset.x, v, el);
}
function slFlush(){ if (rdPend){ rdPend = 0; renderAll(); if (!sheet.hidden) renderSheet(); } }
/* 记下来、重画；原来在这一条（或它的按钮）上的键盘焦点，重画以后放回去 */
function slCommit(el, v, btn){
  const k = SLK[el.dataset.sl], key = el.dataset.sl + '|' + el.dataset.x, ae = document.activeElement;
  const foc = ae === el ? 'sl' : btn && ae === btn ? btn.dataset.sb : null;
  SL = null; rdPend = 0;
  if (k && v != null) k.commit(el.dataset.x, v);
  renderAll(); if (!sheet.hidden) renderSheet();
  if (foc){
    const n = $$('.sl').filter(e => e.dataset.sl + '|' + e.dataset.x === key)[0];
    const f = n && (foc === 'sl' ? n : n.parentNode.querySelector('.slb[data-sb="' + foc + '"]'));
    if (f) f.focus();
  }
}
let slTouchAt = 0;
const slOf = t => t && t.closest ? t.closest('.sl') : null;
document.addEventListener('touchstart', ev => {
  const el = slOf(ev.target);
  if (!el || ev.touches.length !== 1) return;
  const t = ev.touches[0]; slTouchAt = Date.now();
  SL = { el: el, x0: t.clientX, y0: t.clientY, s: 'u', v: null, touch: 1 };
  if (el.classList.contains('lock')){ ev.preventDefault(); SL.s = 'd'; SL.v = slVal(el, t.clientX); slShow(el, SL.v); }
}, { passive: false });
document.addEventListener('touchmove', ev => {
  if (!SL || !SL.touch) return;
  const t = ev.touches[0]; if (!t) return;
  if (SL.s === 'u'){
    const dx = Math.abs(t.clientX - SL.x0), dy = Math.abs(t.clientY - SL.y0);
    if (dx > 6 && dx >= dy) SL.s = 'd'; else if (dy > 8) SL.s = 's';
  }
  if (SL.s === 'd'){ if (ev.cancelable) ev.preventDefault(); SL.v = slVal(SL.el, t.clientX); slShow(SL.el, SL.v); }
}, { passive: false });
document.addEventListener('touchend', ev => {
  if (!SL || !SL.touch) return;
  const s = SL; slTouchAt = Date.now();
  if (s.s === 's'){ SL = null; slFlush(); return; }
  if (ev.cancelable) ev.preventDefault();   // 不要再变成一下滑鼠点击
  if (s.s === 'u'){ s.v = slVal(s.el, s.x0); slShow(s.el, s.v); }
  slCommit(s.el, s.v);
}, { passive: false });
document.addEventListener('touchcancel', () => { if (SL && SL.touch){ SL = null; rdPend = 1; slFlush(); } });
document.addEventListener('mousedown', ev => {
  if (Date.now() - slTouchAt < 800 || ev.button !== 0) return;
  const el = slOf(ev.target); if (!el) return;
  ev.preventDefault();
  SL = { el: el, s: 'd', v: slVal(el, ev.clientX), touch: 0 }; slShow(el, SL.v);
});
document.addEventListener('mousemove', ev => { if (!SL || SL.touch) return; SL.v = slVal(SL.el, ev.clientX); slShow(SL.el, SL.v); });
document.addEventListener('mouseup', () => { if (!SL || SL.touch) return; slCommit(SL.el, SL.v); });
document.addEventListener('keydown', ev => {
  const el = ev.target && ev.target.classList && ev.target.classList.contains('sl') ? ev.target : null; if (!el) return;
  let v;
  if (ev.key === 'ArrowRight' || ev.key === 'ArrowUp') v = slNext(el, 1);
  else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowDown') v = slNext(el, -1);
  else if (ev.key === 'PageUp') v = slNext(el, 1, true);
  else if (ev.key === 'PageDown') v = slNext(el, -1, true);
  else if (ev.key === 'Home') v = +el.dataset.lo;
  else if (ev.key === 'End') v = +el.dataset.hi;
  else return;
  ev.preventDefault();
  slShow(el, v); slCommit(el, v);
});

/* ---------- 两边的按钮（−／＋）----------
   SB＝正在按的那一个：{ b 按钮, el 拖动条, d 方向, v 现在的值, rep 已经连续动了几次 }。按着的时候画面先不重画（slBusy）。 */
let sbAt = 0;   // 刚用手指或滑鼠按完（后面跟来的 click 不要再算一次）
const sbOf = t => t && t.closest ? t.closest('.slb') : null;
const slOfB = b => b && b.parentNode ? b.parentNode.querySelector('.sl') : null;
function sbClear(){ if (SB){ clearTimeout(SB.tm); SB.b.classList.remove('on'); } SB = null; }
function sbDown(b, touch, x, y){
  const el = slOfB(b); if (!el) return;
  sbClear();
  SB = { b: b, el: el, d: +b.dataset.sb > 0 ? 1 : -1, v: null, rep: 0, touch: touch, x0: x, y0: y, t0: Date.now() };
  SB.tm = setTimeout(sbRep, 400);
}
function sbRep(){
  if (!SB) return;
  if (!document.body.contains(SB.el) || Date.now() - SB.t0 > 30000){ sbClear(); rdPend = 1; slFlush(); return; }   // 保险：按钮不见了或按太久
  SB.rep++; SB.b.classList.add('on');
  SB.v = slNext(SB.el, SB.d); slShow(SB.el, SB.v);
  SB.tm = setTimeout(sbRep, SB.rep < 8 ? 110 : 45);
}
function sbUp(){
  if (!SB) return;
  const s = SB; sbClear(); sbAt = Date.now();
  if (!s.rep){ s.v = slNext(s.el, s.d); slShow(s.el, s.v); }   // 点一下：动一格
  slCommit(s.el, s.v, s.b);
}
function sbCancel(){
  if (!SB) return;
  const s = SB; sbClear(); sbAt = Date.now();
  if (s.rep) slCommit(s.el, s.v, s.b); else { rdPend = 1; slFlush(); }
}
document.addEventListener('touchstart', ev => {
  const b = sbOf(ev.target);
  if (!b || ev.touches.length !== 1) return;
  const t = ev.touches[0]; slTouchAt = Date.now();
  sbDown(b, 1, t.clientX, t.clientY);
}, { passive: false });
document.addEventListener('touchmove', ev => {
  if (!SB || !SB.touch) return;
  const t = ev.touches[0]; if (!t) return;
  if (SB.rep){ if (ev.cancelable) ev.preventDefault(); return; }   // 一直动的时候不要捲动
  if (Math.abs(t.clientX - SB.x0) > 10 || Math.abs(t.clientY - SB.y0) > 10) sbCancel();   // 手指移开了：是在捲动
}, { passive: false });
document.addEventListener('touchend', ev => {
  if (!SB || !SB.touch) return;
  slTouchAt = Date.now();
  if (ev.cancelable) ev.preventDefault();   // 自己处理，不要再变成一下滑鼠点击
  sbUp();
}, { passive: false });
document.addEventListener('touchcancel', () => { if (SB && SB.touch) sbCancel(); });
document.addEventListener('mousedown', ev => {
  if (Date.now() - slTouchAt < 800 || ev.button !== 0) return;
  const b = sbOf(ev.target); if (!b) return;
  ev.preventDefault();
  sbDown(b, 0, ev.clientX, ev.clientY);
});
document.addEventListener('mouseup', () => { if (SB && !SB.touch) sbUp(); });
document.addEventListener('click', ev => {   // 键盘（Enter、空白键）或读屏软件按的
  const b = sbOf(ev.target); if (!b || Date.now() - sbAt < 700) return;
  const el = slOfB(b); if (!el) return;
  const v = slNext(el, +b.dataset.sb > 0 ? 1 : -1); slShow(el, v); slCommit(el, v, b);
});
document.addEventListener('contextmenu', ev => { if (sbOf(ev.target)) ev.preventDefault(); });

const setTx = (id, h) => { const e = document.getElementById(id); if (e) e.innerHTML = h; };
function svValText(s, v){
  if (v == null) return '清除';
  const pr = svPair(s), x = SVF[s.f];
  if (!x.pct) return x.o[v];
  if (hideWord()) return '数字已隐藏';
  if (pr){ const h = s.i ? r1(100 - v) : v, a = s.i ? v : r1(100 - v); return '主 ' + pctText('bq', h) + ' · 客 ' + pctText('bq', a); }
  return pctText(s.f, v) + (s.f === 'bq' || hideNum() ? '' : ' ' + wordOf(s.f, v));
}
const SLK = {
  // 第一部分（视窗里）：x＝bq（值＝主队的百分比）、nd、yy
  p1: {
    input(f, v){
      if (f === 'bq'){ setTx('p1v_bqh', '主 ' + bqText(v)); setTx('p1v_bqa', '客 ' + bqText(r1(100 - v))); }
      else { setTx('p1v_' + f, p1NumHTML(v)); setTx('p1w_' + f, wordHTML(f, v)); }
    },
    commit(f, v){
      if (M.st === 2){ endedToast(); return; }
      if (f === 'bq'){ setBq(v); return; }
      const cur = svCur(M, sheetData.i, f);
      if (!cur || cur.v !== v) setSv(sheetData.i, f, v);
    }
  },
  // 两个问题（画面上）：x＝'0_q1'
  q: {
    input(x, v){ const p = x.split('_'); setTx('qv_' + x, qValHTML(v)); setTx('qw_' + x, wordHTML(p[1], v)); },
    commit(x, v){ const p = x.split('_'); pickQ(+p[0], p[1], v); }
  },
  // 全部记录里改一笔：x＝那一笔的 k
  sve: {
    input(k, v){ const s = svByK(+k); if (s) setTx('svev', esc(svValText(s, v))); },
    commit(k, v){ const s = svByK(+k); if (!s) return; const pr = svPair(s); s.v = v; if (pr) pr.v = r1(100 - v); save(); }
  },
  // 简易模型的标准：x＝'r.b.all.0'
  mth: {
    input(x, v){ const c = mCondAt(x); if (c) setTx('mv_' + x.replace(/\./g, '_'), esc(fmtTh(c.m, v))); },
    commit(x, v){ const c = mCondAt(x); if (c){ c.v = v; saveModel(); } }
  },
  mmin: {
    input(x, v){ setTx('mminv', Math.round(v) + ' 次'); },
    commit(x, v){ MODEL.min = clamp(Math.round(v), 1, 10); saveModel(); }
  },
  // 功能 → 拖动条：试试看（不记任何东西）
  demo: {
    input(x, v){ setTx('sldv', fp(v) + '%'); },
    commit(x, v){ DEMO_V = v; }
  }
};
let DEMO_V = 50;
