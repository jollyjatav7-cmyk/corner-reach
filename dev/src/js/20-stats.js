/* ================= 统计面板 =================
   iPad 在两队中间，手机在底部“统计”。全部用两队对比：左边主队（蓝）、右边客队（红），
   条从中间往外长，长度跟这一行比较大的那一队比。比例用一整条分成几块（像摊平的饼图）。 */
function scopeNow(){ if (PREF.scope !== 'auto') return PREF.scope; return 'h' + curP(); }
const SCN = { h1: '上半场', h2: '下半场', ft: '全场' };
const CHC = { x: 'c-x', l: 'c-l', m: 'c-m', b: 'c-b', g: 'c-g' };
const DT_MAX = 60;   // 超过 60 秒才选，多半是忘了点，不算进用时
const fmtS = v => ok(v) ? (v < 9.95 ? v.toFixed(1) : String(Math.round(v))) : '—';
const teamDot = i => '<i style="background:var(--' + (i ? 'am' : 'hm') + ')"></i>';
function mrow(lab, hv, av, o){
  o = o || {};
  const fm = o.fmt || (v => String(v)), tx = v => v == null || (typeof v === 'number' && !isFinite(v)) ? '—' : fm(v);
  const mx = Math.max(hv || 0, av || 0), w = v => mx > 0 && v ? Math.max(2, v / mx * 100) : 0;
  const u = o.unit ? '<small>' + o.unit + '</small>' : '';
  return '<div class="mr' + (o.big ? ' big' : '') + '"><div class="mr-t"><span class="v h' + (hv == null ? ' dim' : '') + '">' + tx(hv) + (hv != null ? u : '') + '</span>'
    + '<span class="lb">' + (o.dot ? '<i class="' + o.dot + '"></i>' : '') + lab + '</span>'
    + '<span class="v a' + (av == null ? ' dim' : '') + '">' + tx(av) + (av != null ? u : '') + '</span></div>'
    + '<div class="mb" aria-hidden="true"><span class="h" style="width:' + w(hv).toFixed(1) + '%"></span><span class="a" style="width:' + w(av).toFixed(1) + '%"></span></div></div>';
}
/* 一整条分成几块；放得下才在块里写比例（或次数） */
function segBar(parts, o){
  o = o || {};
  const tot = parts.reduce((s, p) => s + p.v, 0);
  if (!tot) return '<div class="sgb none">' + (o.empty || '还没有') + '</div>';
  return '<div class="sgb" role="img" aria-label="' + esc(parts.filter(p => p.v).map(p => p.n + ' ' + p.v + '（' + pc(p.v / tot) + '）').join('，')) + '">'
    + parts.filter(p => p.v > 0).map(p => { const sh = p.v / tot, lab = o.count ? (sh >= 0.09 ? String(p.v) : '') : (sh >= 0.13 ? pc(sh) : '');
      return '<i class="' + p.c + '" style="-webkit-flex:' + p.v + ' 1 0;flex:' + p.v + ' 1 0">' + lab + '</i>'; }).join('') + '</div>';
}
const segLegend = list => '<div class="sgl">' + list.map(x => '<span><i class="' + x[0] + '"></i>' + x[1] + '</span>').join('') + '</div>';
function meter(i, inn, out, cls){
  const n = inn + out, w = n ? inn / n * 100 : 0;
  return '<div class="mtr"><span class="who">' + teamDot(i) + (i ? '客' : '主') + '</span>'
    + '<div class="mtk" role="img" aria-label="' + (n ? '内 ' + inn + '，外 ' + out : '还没有') + '"><span class="' + cls + '" style="width:' + w.toFixed(1) + '%"></span></div>'
    + '<span class="r">' + (n ? inn + '/' + n + '<small>' + pc(inn / n) + '</small>' : '<small>还没有</small>') + '</span></div>';
}
function renderStats(){
  const el = $('#stats'); if (!el) return;
  const sc = scopeNow(), mins = minsOf(M, sc);
  const S = [statOf(M, 0, sc), statOf(M, 1, sc)];
  const per10 = r => mins >= 1 ? r.ar / mins * 10 : null;
  let h = '<div class="st"><div class="st-h"><div class="seg" role="group" aria-label="统计范围">' + ['h1', 'h2', 'ft'].map(k => '<button data-a="scope" data-v="' + k + '" aria-pressed="' + (sc === k) + '">' + SCN[k] + '</button>').join('') + '</div>'
    + '<div class="lgd"><span>' + teamDot(0) + '<span class="tm">' + esc(teamName(0)) + '</span></span><span>' + teamDot(1) + '<span class="tm">' + esc(teamName(1)) + '</span></span><span class="mins">看了 ' + Math.floor(mins) + ' 分钟</span></div></div>';
  // 到达
  h += '<div class="sec"><h4>到达禁区附近</h4>' + mrow('到达次数', S[0].ar, S[1].ar, { big: true })
    + mrow('每 10 分钟', per10(S[0]), per10(S[1]), { fmt: fmtS }) + '</div>';
  // 选择
  const any = S[0].chosen + S[1].chosen > 0;
  h += '<div class="sec"><h4>到达后的选择<small>（每队一条＝100%）</small></h4>';
  if (any){
    for (const i of [0, 1]) h += '<div class="sgr"><span class="who">' + teamDot(i) + (i ? '客' : '主') + '</span>' + segBar(CH.map(c => ({ c: CHC[c], v: S[i].ch[c], n: CHN[c] })), { empty: '还没有选择' }) + '</div>';
    h += segLegend(CH.map(c => [CHC[c], CHN[c]]));
    const xl = r => r.chosen ? (r.ch.x + r.ch.l) / r.chosen : null;
    h += mrow('传中＋远射 占比', xl(S[0]), xl(S[1]), { fmt: pc, big: true });
    for (const c of CH) h += mrow(CHN[c], S[0].ch[c], S[1].ch[c], { dot: CHC[c] });
    h += mrow('禁区射门', S[0].bs, S[1].bs);
    const nn = [0, 1].map(i => { const e = ocEv(i); return S[i].none - (e && !e.pa && (sc === 'ft' || e.p === +sc[1]) ? 1 : 0); });   // 正在选的那次不算
    if (nn[0] + nn[1]) h += '<p class="snote">没选就结束的到达：主 ' + nn[0] + '、客 ' + nn[1] + '（不算进比例）</p>';
  } else h += '<p class="empty">还没有选择。点“到达”，再点传中、远射、中路渗透、回传或丢球。</p>';
  h += '</div>';
  // 用时
  const dts = r => r.dt.filter(x => x <= DT_MAX), dtc = (r, c) => r.dtc[c].filter(x => x <= DT_MAX);
  if (dts(S[0]).length + dts(S[1]).length){
    h += '<div class="sec"><h4>从到达到做出选择<small>（秒）</small></h4>'
      + mrow('平均', avg(dts(S[0])), avg(dts(S[1])), { fmt: fmtS, unit: '秒', big: true })
      + mrow('中位数', median(dts(S[0])), median(dts(S[1])), { fmt: fmtS, unit: '秒' });
    for (const c of CH) if (dtc(S[0], c).length + dtc(S[1], c).length) h += mrow(CHN[c], avg(dtc(S[0], c)), avg(dtc(S[1], c)), { fmt: fmtS, unit: '秒', dot: CHC[c] });
    h += '<p class="snote">时间越短越果断。超过 ' + DT_MAX + ' 秒的不算（多半是忘了点）；没按“到达”直接点选择的，用时不详。</p></div>';
  }
  // 内外
  h += '<div class="sec"><h4>命中范围<small>（内的比例）</small></h4>';
  for (const c of ['x', 'l']){
    h += '<div class="mtg"><h5><i class="' + CHC[c] + '"></i>' + CHN[c] + '</h5>' + meter(0, S[0].io[c][0], S[0].io[c][1], CHC[c]) + meter(1, S[1].io[c][0], S[1].io[c][1], CHC[c]) + '</div>';
  }
  h += '<p class="snote">传中、远射很多但老是在范围外，也很难造成角球。</p></div>';
  // 射门和角球
  h += '<div class="sec"><h4>射门和角球</h4>'
    + mrow('禁区射门', S[0].bs, S[1].bs) + mrow('远射', S[0].ls, S[1].ls) + mrow('射门合计', S[0].sh, S[1].sh)
    + mrow('角球', S[0].ck, S[1].ck, { big: true }) + mrow('进球', S[0].gl, S[1].gl);
  if (S[0].ck + S[1].ck){
    h += '<h4 style="margin-top:4px">角球从哪里来</h4>';
    for (const i of [0, 1]) h += '<div class="sgr"><span class="who">' + teamDot(i) + (i ? '客' : '主') + '</span>' + segBar([['c-x', 'x', '传中'], ['c-l', 'l', '远射'], ['c-m', 'm', '中路渗透'], ['c-o', 'o', '其他']].map(x => ({ c: x[0], v: S[i].cks[x[1]], n: x[2] })), { count: true, empty: S[i].ckb ? '都是加入前的' : '还没有' }) + '</div>';
    h += segLegend([['c-x', '传中'], ['c-l', '远射'], ['c-m', '中路渗透'], ['c-o', '其他角球']]);
    if (S[0].ckb + S[1].ckb) h += '<p class="snote">角球总数包括中途加入前的（主 ' + S[0].ckb + '、客 ' + S[1].ckb + '），来源里不算。</p>';
  }
  h += '</div></div>';
  el.innerHTML = h;
}
