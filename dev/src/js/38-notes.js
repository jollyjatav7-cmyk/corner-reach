/* ================= 两个问题：每张卡的备注、页面上的心得 =================
   备注：每张卡一个（每场比赛、每队、每题），平时收起来，点卡上的“备注”打开；打的字马上存（M.qn）。
   心得：两个问题页面上方一个窗口，写你暂时的心得当指导；不属于哪一场，一直留着（localStorage）。
   收起来时显示前两行，点一下展开就可以直接改。 */
const TIPK = 'corner-reach-tips';
let TIPS = LS.get(TIPK, null);
if (!TIPS || typeof TIPS !== 'object') TIPS = { t: '', u: 0 };
TIPS.t = String(TIPS.t || '');
let tipsKey = '';
function renderTips(){
  const el = $('#tips'); if (!el) return;
  const show = PREF.mode === 'q' && M.st !== 2, open = !!PREF.tx;
  el.hidden = !show;
  document.body.classList.toggle('tips-on', show);
  if (!show) return;
  const ta = $('#tipTa');
  if (ta && document.activeElement === ta) return;   // 正在打字：不要动它
  const k = (open ? 'o' : 'c') + '|' + TIPS.t;
  if (k === tipsKey && el.innerHTML) return;
  tipsKey = k;
  el.classList.toggle('open', open);
  if (!open){
    el.innerHTML = '<button type="button" class="tipbar" data-a="tips" aria-expanded="false"><b>心得</b>'
      + '<span class="tipt' + (TIPS.t.trim() ? '' : ' na') + '">' + (TIPS.t.trim() ? esc(TIPS.t.trim()) : '点这里写下你暂时的心得，当作判断的指导') + '</span>'
      + '<span class="tipc">展开</span></button>';
  } else {
    el.innerHTML = '<div class="tiph"><b>心得</b><span class="tips-s">一直留着，每场都看得到</span><span class="sp"></span><button type="button" class="tipc" data-a="tips" aria-expanded="true">收起</button></div>'
      + '<textarea id="tipTa" class="tipta" maxlength="5000" placeholder="例如：上半场前 15 分钟先别急着投；主队落后时传中会变多……" aria-label="心得">' + esc(TIPS.t) + '</textarea>';
    tipGrow($('#tipTa'));
  }
}
function tipGrow(ta){ if (!ta) return; ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight + 2, Math.round(window.innerHeight * (isPhone() ? 0.32 : 0.4))) + 'px'; }
function toggleTips(){
  PREF.tx = PREF.tx ? 0 : 1; savePref(); tipsKey = '';
  renderTips();
}
function toggleQNote(x){
  if (QNOPEN[x]) delete QNOPEN[x]; else QNOPEN[x] = 1;
  renderPads();
  if (QNOPEN[x]){
    const ta = $$('.qnta').filter(t => t.dataset.x === x)[0];
    if (ta){ ta.scrollIntoView({ block: 'nearest' }); if (!(M.qn && M.qn[x])) ta.focus(); }
  }
}
function setQSel(x, w){
  if (!M.qm) M.qm = {};
  if (+w) M.qm[x] = 1; else delete M.qm[x];
  save(); renderPads();
}
document.addEventListener('input', ev => {
  const t = ev.target; if (!t || !t.classList) return;
  if (t.classList.contains('qnta')){
    const x = t.dataset.x, v = t.value;
    if (!M.qn) M.qn = {};
    if (v.trim()) M.qn[x] = v; else delete M.qn[x];
    const b = $$('.qnb').filter(e => e.dataset.x === x)[0]; if (b) b.classList.toggle('has', !!v.trim());
    save();
  } else if (t.id === 'tipTa'){
    TIPS = { t: t.value, u: nowSec() }; LS.set(TIPK, TIPS); tipsKey = (PREF.tx ? 'o' : 'c') + '|' + TIPS.t; tipGrow(t);
  }
});
// 打完备注（离开那一格）：刚才没重画的现在补上（稍等一下，让刚按的按钮先收到点击）
document.addEventListener('focusout', ev => {
  if (ev.target && ev.target.classList && ev.target.classList.contains('qnta')){ saveNow(); setTimeout(() => { if (!typing()) slFlush(); }, 250); }
});
// 正在打备注时去碰拖动条或其他地方：先离开那一格（拖动条一按就开始，焦点不会自己移走）
const offNote = ev => { if (typing() && !(ev.target && ev.target.closest && ev.target.closest('.qnw'))) document.activeElement.blur(); };
document.addEventListener('touchstart', offNote, { capture: true, passive: true });
document.addEventListener('mousedown', offNote, true);
