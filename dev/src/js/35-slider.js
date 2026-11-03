/* ================= 拖动条 =================
   slHTML(种类, 参数, 值, 设定) 画一条；手指拖、点一下、方向键都可以，放开才记下（SLK[种类].commit）。
   拖的时候只更新这一条和旁边的数字（SLK[种类].input），整个画面等放开以后才重画。
   在可以上下捲动的视窗里，要先往左右移才开始拖（往上下就是捲动）；有 lock 的（两个问题）一按就开始。 */
function slHTML(kind, x, v, o){
  o = o || {};
  const lo = o.lo == null ? 0 : o.lo, hi = o.hi == null ? 100 : o.hi, st = o.st || 5;
  const w = (v == null ? 50 : (clamp(v, lo, hi) - lo) / (hi - lo) * 100).toFixed(1) + '%';
  return '<div class="sl' + (o.cls ? ' ' + o.cls : '') + (v == null ? ' na' : '') + '" data-sl="' + kind + '" data-x="' + esc(x) + '" data-lo="' + lo + '" data-hi="' + hi + '" data-st="' + st + '" data-v="' + (v == null ? '' : v) + '"'
    + ' role="slider" tabindex="0" aria-label="' + esc(o.lab || '') + '" aria-valuemin="' + lo + '" aria-valuemax="' + hi + '"' + (v == null ? ' aria-valuetext="还没设"' : ' aria-valuenow="' + v + '"') + '>'
    + '<div class="sl-t"><i class="sl-f" style="width:' + w + '"></i><b class="sl-k" style="left:' + w + '"></b></div></div>';
}
function slVal(el, cx){
  const t = el.querySelector('.sl-t').getBoundingClientRect(), lo = +el.dataset.lo, hi = +el.dataset.hi, st = +el.dataset.st;
  const r = t.width > 0 ? clamp((cx - t.left) / t.width, 0, 1) : 0.5;
  return clamp(+(Math.round((lo + r * (hi - lo)) / st) * st).toFixed(2), lo, hi);
}
function slShow(el, v){
  const lo = +el.dataset.lo, hi = +el.dataset.hi, w = ((v - lo) / (hi - lo) * 100).toFixed(1) + '%';
  el.classList.remove('na');
  el.querySelector('.sl-f').style.width = w; el.querySelector('.sl-k').style.left = w;
  el.dataset.v = v; el.setAttribute('aria-valuenow', v); el.removeAttribute('aria-valuetext');
  const k = SLK[el.dataset.sl]; if (k && k.input) k.input(el.dataset.x, v, el);
}
function slFlush(){ if (rdPend){ rdPend = 0; renderAll(); if (!sheet.hidden) renderSheet(); } }
function slCommit(el, v){
  const k = SLK[el.dataset.sl], key = el.dataset.sl + '|' + el.dataset.x, foc = document.activeElement === el;
  SL = null; rdPend = 0;
  if (k && v != null) k.commit(el.dataset.x, v);
  renderAll(); if (!sheet.hidden) renderSheet();
  if (foc){ const n = $$('.sl').filter(e => e.dataset.sl + '|' + e.dataset.x === key)[0]; if (n) n.focus(); }
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
  const lo = +el.dataset.lo, hi = +el.dataset.hi, st = +el.dataset.st, cur = el.dataset.v === '' ? null : +el.dataset.v;
  let v;
  if (ev.key === 'ArrowRight' || ev.key === 'ArrowUp') v = cur == null ? (lo + hi) / 2 : cur + st;
  else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowDown') v = cur == null ? (lo + hi) / 2 : cur - st;
  else if (ev.key === 'Home') v = lo;
  else if (ev.key === 'End') v = hi;
  else return;
  ev.preventDefault();
  v = clamp(+(Math.round(v / st) * st).toFixed(2), lo, hi);
  slShow(el, v); slCommit(el, v);
});
const setTx = (id, h) => { const e = document.getElementById(id); if (e) e.innerHTML = h; };
function svValText(s, v){
  if (v == null) return '清除';
  const pr = svPair(s);
  if (pr) return s.i ? '主 ' + (100 - v) + '% · 客 ' + v + '%' : '主 ' + v + '% · 客 ' + (100 - v) + '%';
  const x = SVF[s.f];
  return x.pct ? v + '%' + (s.f === 'bq' ? '' : ' ' + wordOf(s.f, v)) : x.o[v];
}
const SLK = {
  // 第一部分（视窗里）：x＝bq（值＝主队的百分比）、nd、yy
  p1: {
    input(f, v){
      if (f === 'bq'){ setTx('p1v_bqh', '主 ' + v + '%'); setTx('p1v_bqa', '客 ' + (100 - v) + '%'); }
      else { setTx('p1v_' + f, v + '%'); setTx('p1w_' + f, esc(wordOf(f, v))); }
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
    input(x, v){ const p = x.split('_'); setTx('qv_' + x, v + '<small>%</small>'); setTx('qw_' + x, esc(wordOf(p[1], v))); },
    commit(x, v){ const p = x.split('_'); pickQ(+p[0], p[1], v); }
  },
  // 全部记录里改一笔：x＝那一笔的 k
  sve: {
    input(k, v){ const s = svByK(+k); if (s) setTx('svev', esc(svValText(s, v))); },
    commit(k, v){ const s = svByK(+k); if (!s) return; const pr = svPair(s); s.v = v; if (pr) pr.v = 100 - v; save(); }
  },
  // 简易模型的标准：x＝'r.b.all.0'
  mth: {
    input(x, v){ const c = mCondAt(x); if (c) setTx('mv_' + x.replace(/\./g, '_'), esc(fmtTh(c.m, v))); },
    commit(x, v){ const c = mCondAt(x); if (c){ c.v = v; saveModel(); } }
  },
  mmin: {
    input(x, v){ setTx('mminv', Math.round(v) + ' 次'); },
    commit(x, v){ MODEL.min = clamp(Math.round(v), 1, 10); saveModel(); }
  }
};
