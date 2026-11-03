/* ================= 弹出视窗 ================= */
const sheet = $('#sheet'), card = $('#card');
let sheetKind = null, sheetData = {};
function openSheet(kind, data){
  const ae = document.activeElement; if (ae && ae !== document.body && ae.blur && !card.contains(ae)) ae.blur();
  if (sheet.hidden) hideToast();
  sheetKind = kind; sheetData = data || {}; renderSheet(); sheet.hidden = false; card.scrollTop = 0;
}
function closeSheet(){ sheet.hidden = true; sheetKind = null; sheetData = {}; card.className = 'card'; }
function openClock(){
  const p = M.tm.ht ? 2 : M.tm.p, v = M.tm.ht ? PER[2][0] : Math.floor(clockOf(M));
  openSheet('clock', { tp: { p: p, v: clamp(v, TPR[p][0], TPR[p][1]), live: !!M.tm.r && !M.tm.ht, at: Date.now() } });
}
const HELP = {
  rec: ['到达与选择', '上方切换“到达与选择”', '左边记主对客（主队进攻）、右边记客对主（客队进攻）。球队到了对方禁区附近点“到达”，秒数开始走；做出选择时点传中、远射、中路渗透、回传或丢球，app 记下用了几秒。传中和远射接着选内或外；传中内再选禁区射门或解围/中途拦截；中路渗透选有没有禁区射门；最后选进球、角球或无角球。同一次进攻里又做了一次选择（例如传中被解围后再传中），就再按一次“到达”。点错了按“返回”，或球队名字旁边的“撤销”。'],
  p1: ['第一部分（主观）', '每队“到达”上方的四格', '球权、到禁区附近的难度、意愿是拖动条（百分比，每格 5%），场面是三个选项，由你主观判断，比赛中随时可以改。球权只有一条：主队拖多一点，客队就自动少一点（两队加起来 100%）。每次放开都会记下时间（20 秒内再调算改正），以后可以统计在每种状态下角球多还是少。'],
  q: ['两个问题', '上方切换“两个问题”', '每队两个问题，都是拖动条（百分比）：一、他容不容易到对方禁区附近＝几次进攻里有百分之几能到对方禁区附近；二、他喜不喜欢传中和远射＝传中和远射的比例。随时可以改，每次放开都记下时间。上方的“角球 ＋1”可以顺便记角球。两个程序记在同一场比赛里，可以只用一个。'],
  mdl: ['简易模型', '上方“简易模型”、每队名字旁边、功能 → 简易模型', '按你定的标准提醒：某队满足“大角”的条件，名字旁边显示“大角”（这队角球会高于平均）；满足“小角”的条件显示“小角”。两队合起来：都大角提示投大角，都小角提示投小角；只有一队有提醒、或一队大角一队小角，提示投角球让球（投角球会比较多的那队）。点提示可以看每个条件现在满不满足；功能 → 简易模型可以用拖动条调标准、加项、删项、关掉提醒。这只是暂时的主观模型，不会改任何记录。'],
  stats: ['统计', 'iPad 两队中间；手机底部“统计”', '两队对比：到达次数和每 10 分钟几次、五个选择的比例（每队一条＝100%）和次数、传中＋远射占比、从到达到选择的秒数、传中和远射在范围内的比例、射门、角球和角球从哪里来。上方可以切换上半场、下半场、全场。'],
  ck: ['其他角球', '每队下面的“其他角球”', '不是从你记的那次到达直接来的角球（例如任意球、反击、忘了记的那次），点这里。到达链里选了“角球”的，不用再点。'],
  net: ['联网', '底部“同步”、功能 → 联网数据', '输入球队名字后自动在网上找这场比赛（API-Football，key 默认用“角球数据记录”里的那个）。比赛已经在踢时按“加入”，时间、比分、角球、红牌一次填好；记录时按“同步”才会联网（省额度），漏点的角球、进球、红牌会等画面追上后补上，你自己再点会自动合并，不会多算。'],
  clock: ['比赛时间', '点比分中间的时间', '开球时按“上半场开球／下半场开球”，上半场吹哨按“上半场结束”。时间跟画面对不上时，用加减按钮或拖动条对准画面上的时间。中途才开始看，就把时间调到画面上的时间再开始，每 10 分钟的次数会按你看的时间算。'],
  fix: ['补录比分和角球', '点比分或“角球”数字', '中途加入，或数字跟实际对不上时用。补录的角球和进球算进比分和总数，但不算进到达和选择的统计。'],
  arch: ['比赛仓库', '底部“仓库”', '保存结束时选“加入仓库”的比赛，以及还没结束的比赛。可以搜索、打开、导出、删除；“统计”有平均角球、你的到达和选择平均、你的逻辑检验，以及第一部分和两个问题每种选择下的角球（以后建模型用）；“备份”可以导出全部（JSON 或表格 CSV）和导入。'],
  pip: ['视频浮窗', '功能 → 视频浮窗', '用一台手机边看边记时：把视频切到画中画，拖到屏幕上方或下方，再在这里选同样的位置。app 会空出浮窗的位置，只留比分那一行，按键压缩。']
};
const HELP_ORDER = ['rec', 'p1', 'q', 'mdl', 'stats', 'ck', 'net', 'clock', 'fix', 'arch', 'pip'];
const DEFS = [
  ['到达', '本队在对方禁区附近（禁区线外大约 10 米以内，或禁区两侧一直到底线的边路）把球控制住，点一次。同一次进攻在禁区附近来回传只点一次；做了一次选择以后（例如传中被解围），本队又在禁区附近拿到球、再做选择，就再点一次“到达”。角球、任意球本身不算。', null],
  ['传中', '从边路往禁区里传的球（下底传中、45 度传中、倒三角都算）。任意球、角球开出的不算。', ['内：球往有威胁的范围飞（禁区里、门前、队友能争到的地方），不管之后被挡、被解围、被门将拿到，还是有人射门', '外：传偏了：直接出界、飞过所有人、落点没有威胁', '内之后：禁区射门＝队友在禁区里射门（包括头球）；解围/中途拦截＝防守球员（包括门将）把球顶出、踢出、挡下、拿住']],
  ['远射', '禁区外射门。任意球直接射门不算。', ['内：射正、被挡、碰到人或门柱（有机会变成角球）', '外：没碰到人直接射偏、打高']],
  ['中路渗透', '不传中，带球突破、直塞、短传配合往禁区里打（边路带球突进禁区也算）。', ['禁区射门：最后在禁区里射门', '无禁区射门：被断、被挡下，或没有射门']],
  ['回传', '往回传、倒回中场重新组织，这次到达没有往禁区里打。', null],
  ['丢球', '还没做出选择就丢了球：被抢断、传球被断、带球失误、出界。', null],
  ['进球、角球、无角球', '这次进攻的最后：直接得到角球选“角球”，没有就选“无角球”，进了选“进球”。', null],
  ['用了几秒', '从按“到达”开始算，到你点第一个选择为止。没按“到达”直接点选择的，也算一次到达，但用时不详。超过 60 秒的不算进平均（多半是忘了点）。', null],
  ['其他角球', '不是从你记的那次到达直接来的角球（任意球、反击，或忘了记的那次）。到达链里选了“角球”的，不要再点，不然会多算。', null],
  ['第一部分', '对球队未来能到对面禁区附近次数与呆在对方禁区附近总时长的预测，由你主观判断。', ['球权：两队加起来 100%，主队拖多一点，客队就少一点', '到禁区附近的难度：0% 没难度 … 100% 难且进不去（中间是有难度但小、有难度但进得去、有很大难度但勉强进得去）', '意愿：0% 弱 … 100% 强', '场面：包饺子／包一会饺子然后转换球权／快速转换球权（还是选项）']],
  ['两个问题', '都是百分比。', ['一、他容不容易到对方禁区附近：几次进攻里有百分之几能到对方禁区附近', '二、他喜不喜欢传中和远射：传中和远射的比例']],
  ['简易模型', '你主观定的暂时标准，可以在功能 → 简易模型里改。默认：', ['到达与选择·大角：球权至少 30%、难度低于 50%、意愿高于 50%、传中＋远射占三项高于 50%，全部满足', '到达与选择·小角：球权最多 70%、难度高于 60%、意愿低于 50%、传中＋远射占三项低于 40%，全部满足；或者难度高于 80%、或者传中＋远射占三项低于 20%，任意一项满足', '三项＝传中、远射、中路渗透；这类比例要三项加起来满 4 次才算', '两个问题·大角：两个问题都高于 60%；小角：都低于 40%', '两队都大角→投大角；都小角→投小角；只有一队有提醒，或一队大角一队小角→投角球让球（投角球会比较多的那队）']]
];
function renderSheet(){
  if (SL && SL.s === 'd' && card.contains(SL.el)){ rdPend = 1; return; }   // 正在拖视窗里的拖动条
  const d = sheetData;
  let h = '';
  card.className = 'card';
  switch (sheetKind){
    case 'menu': {
      const n = whAll().length, last = LS.get('corner-reach-exported', 0);
      const t = (a, title, sub, cls) => '<button class="fct' + (cls ? ' ' + cls : '') + '" data-a="' + a + '"><b>' + title + '</b><span>' + sub + '</span></button>';
      const ago = last ? Math.floor((nowSec() - last) / 86400) : null;
      h = '<div class="card-h"><h3>功能</h3><button class="pill" data-a="help">功能说明</button><button class="pill" data-a="close">关闭</button></div><div class="fc">'
        + '<div><h4>这场比赛　' + esc(teamName(0)) + ' vs ' + esc(teamName(1)) + '</h4><div class="fcg">'
        + t('clock', '比赛时间', (M.tm.ht ? '中场休息' : PER[M.tm.p][2]) + ' ' + fmtClock(M.tm.p, clockOf(M)) + '：开球、中场、对准画面上的时间')
        + t('list', '全部记录', '到达 ' + M.ev.filter(e => e.c === 'ar').length + ' 次、其他 ' + (M.ev.filter(e => e.c !== 'ar' && !e.b).length + M.sv.length) + ' 笔，可以逐笔修改或删除')
        + t('join', '中途加入', M.api && apiKey() && !ownEvents() ? '按联网的时间、比分、角球、红牌一次填好' : '比赛已经在踢：设定时间、比分、角球再开始')
        + t('fix', '补录比分和角球', '数字跟实际对不上时用；也可以记点球进球、红牌')
        + t('note', '这场备注', M.note ? esc(M.note.slice(0, 24)) : '写下你自己的观察，跟着比赛一起保存')
        + (M.st === 2 ? t('reopen', '重新打开这场', '已结束：要接着记录时用') : t('finish', '结束这场', '结束后选择要不要加入比赛仓库', 'danger'))
        + t('new', '新比赛', '开始记录另一场') + '</div></div>'
        + '<div><h4>比赛仓库</h4><div class="fcg">'
        + t('arch', '比赛仓库', n + ' 场：搜索、打开、导出、删除')
        + t('wstats', '统计', '平均角球、到达和选择的平均、每种主观选择下的角球')
        + t('exp1', '导出这场', '存成文件，可以传给 Claude 分析')
        + t('wback', '备份与导入', ago == null ? '还没备份过：导出全部、导入' : '上次备份 ' + (ago ? ago + ' 天前' : '今天')) + '</div></div>'
        + '<div><h4>设置与说明</h4><div class="fcg">'
        + t('mset', '简易模型', MODEL.on ? '提醒开着：用拖动条调大角、小角的标准，加项、删项' : '提醒关着：点这里打开或调整标准')
        + t('net', '联网数据', !apiKey() ? '还没设定：API key、自动同步、画面延迟' : M.api ? '已连上 ' + esc(M.api.h) + ' vs ' + esc(M.api.a) : keyFromOther() ? '用角球数据记录的 key：查找比赛、同步' : '已设定 API key')
        + t('pip', '视频浮窗', PIP.pos === 'off' ? '一台手机边看浮窗边记录：空出浮窗的位置' : '已开启：浮窗在' + (PIP.pos === 'top' ? '上方' : '下方'))
        + t('defs', '按键定义', '到达、每个选择、内外、角球怎么算')
        + t('help', '功能说明', '每个功能是做什么的、在哪里') + '</div></div></div>'
        + '<p class="hint">' + offline + '　版本 ' + APPVER + '</p>';
      break;
    }
    case 'help':
      h = '<div class="card-h"><h3>功能说明</h3><button class="pill" data-a="close">关闭</button></div><div class="hlp">' + HELP_ORDER.map(k => { const x = HELP[k]; return '<div><h4>' + x[0] + '</h4><p>' + x[2] + '</p><p class="where">在哪里：' + x[1] + '</p></div>'; }).join('') + '</div>';
      break;
    case 'defs':
      h = '<div class="card-h"><h3>按键定义</h3><button class="pill" data-a="close">关闭</button></div><div class="defs">'
        + DEFS.map(x => '<div><h4>' + x[0] + '</h4><p>' + x[1] + '</p>' + (x[2] ? '<ul>' + x[2].map(y => '<li>' + y + '</li>').join('') + '</ul>' : '') + '</div>').join('') + '</div>';
      break;
    case 'p1': {
      const i = d.i, cls = i ? 'a' : 'h';
      const when = s => s ? (s.v == null ? '已清除' : fmtMin(s.p, s.t) + ' 设的') : '还没设';
      const clr = (f, on) => '<button class="p1clr" data-a="p1clr" data-f="' + f + '"' + (on ? '' : ' disabled') + '>清除</button>';
      // 球权：一条，值＝主队的百分比
      const bh = svCur(M, 0, 'bq'), ba = svCur(M, 1, 'bq');
      const hv = bh && bh.v != null ? bh.v : ba && ba.v != null ? 100 - ba.v : null, av = ba && ba.v != null ? ba.v : hv == null ? null : 100 - hv;
      h = '<div class="card-h"><h3>第一部分</h3><button class="pill dark" data-a="close">完成</button></div>'
        + '<div class="seg p1side">' + [0, 1].map(j => '<button data-a="p1side" data-v="' + j + '" aria-pressed="' + (i === j) + '">' + (j ? '客对主 ' : '主对客 ') + esc(teamName(j)) + '</button>').join('') + '</div>'
        + '<p class="hint">对球队未来能到对面禁区附近次数与呆在对方禁区附近总时长的预测。拖动或点一下条，随时可以改；每次放开都记下时间（20 秒内再调算改正）。</p>'
        + '<div class="p1g" id="p1g-bq"><h4>球权<small>' + when(svCur(M, i, 'bq')) + '</small>' + clr('bq', hv != null) + '</h4>'
        + '<div class="bqv"><span class="h" id="p1v_bqh">主 ' + (hv == null ? '—' : hv + '%') + '</span><span class="lb">两队加起来 100%</span><span class="a" id="p1v_bqa">客 ' + (av == null ? '—' : av + '%') + '</span></div>'
        + slHTML('p1', 'bq', hv, { cls: 'bq', lab: '球权：主队的百分比（客队自动是其余的）' })
        + '<p class="p1n">蓝色是' + esc(teamName(0)) + '、红色是' + esc(teamName(1)) + '：往右拖主队多，往左拖客队多。</p></div>';
      for (const f of ['nd', 'yy']){
        const x = SVF[f], s = svCur(M, i, f), v = s && s.v != null ? s.v : null;
        h += '<div class="p1g" id="p1g-' + f + '"><h4>' + x.n + '<small>' + when(s) + '</small>' + clr(f, v != null) + '</h4>'
          + '<div class="p1val"><b id="p1v_' + f + '">' + (v == null ? '未设' : v + '%') + '</b><span id="p1w_' + f + '">' + (v == null ? '拖动或点一下条' : esc(wordOf(f, v))) + '</span></div>'
          + slHTML('p1', f, v, { cls: cls, lab: x.n })
          + '<div class="slends"><span>' + x.lo + '</span><span>' + x.hi + '</span></div></div>';
      }
      const xc = SVF.cm, sc = svCur(M, i, 'cm'), vc = sc ? sc.v : null;
      h += '<div class="p1g" id="p1g-cm"><h4>' + xc.n + '<small>' + when(sc) + '　再点一次选中的就是清除</small></h4><div class="p1o c1">'
        + xc.o.map((lab, j) => '<button data-a="p1v" data-f="cm" data-v="' + j + '" aria-pressed="' + (vc === j) + '">' + lab + '</button>').join('') + '</div></div>';
      break;
    }
    case 'clock': {
      const p = M.tm.p;
      h = '<div class="card-h"><h3>比赛时间</h3><button class="pill" data-a="close">完成</button></div>'
        + '<div class="big-clk" id="shClk">' + (M.tm.ht ? '中场' : fmtClock(p, clockOf(M))) + '</div>'
        + '<p class="hint" style="text-align:center">' + (M.st === 2 ? '已结束' : M.tm.ht ? '中场休息' : PER[p][2]) + '　' + (M.tm.r ? '计时中' : '已暂停') + '</p>'
        + '<div class="grid2"><button class="pill green" data-a="kick" data-p="1">上半场开球</button><button class="pill green" data-a="kick" data-p="2">下半场开球</button></div>'
        + '<div class="grid2"><button class="pill" data-a="toggle">' + (M.tm.r ? '暂停' : '继续计时') + '</button><button class="pill" data-a="endh">上半场结束</button></div>'
        + '<div class="lbl">微调</div><div class="row"><button class="chip" data-a="nudge" data-d="-60">−1 分</button><button class="chip" data-a="nudge" data-d="-10">−10 秒</button><button class="chip" data-a="nudge" data-d="10">＋10 秒</button><button class="chip" data-a="nudge" data-d="60">＋1 分</button></div>'
        + '<div class="lbl">对准画面上的时间（拖动或按加减，不用打字）</div>' + tpHTML(d.tp)
        + '<button class="pill dark" data-a="tpset">设定为 <span id="jgoT">' + fmtClock(d.tp.p, d.tp.v) + '</span></button>'
        + '<div class="grid2"><button class="pill" data-a="fix">补录比分和角球</button>' + (M.st === 2 ? '<button class="pill" data-a="reopen">重新打开</button>' : '<button class="pill danger" data-a="finish">结束这场</button>') + '</div>'
        + '<p class="hint">开球时按“上半场开球”或“下半场开球”，计时会从 0:00 或 45:00 开始。中途才开始看：把时间调到画面上的时间，按“设定为”，再按 ▶。</p>';
      break;
    }
    case 'fix': {
      const p = curP();
      const stp = (f, i) => '<div class="stp"><span class="' + (i ? 'a' : 'h') + '">' + esc(teamName(i)) + '</span><button data-a="fs" data-f="' + f + '" data-i="' + i + '" data-d="-1" aria-label="减少">−</button><b>' + d[f][i] + '</b><button data-a="fs" data-f="' + f + '" data-i="' + i + '" data-d="1" aria-label="增加">＋</button></div>';
      h = '<div class="card-h"><h3>补录比分和角球</h3><button class="pill" data-a="close">取消</button></div>'
        + '<div class="jgrp"><h4>比分<small>包括点球、乌龙</small></h4>' + stp('sc', 0) + stp('sc', 1) + '</div>'
        + '<div class="jgrp"><h4>上半场角球</h4>' + stp('c1', 0) + stp('c1', 1) + '</div>'
        + (p === 2 || M.pe[1] || M.st === 2 ? '<div class="jgrp"><h4>下半场角球</h4>' + stp('c2', 0) + stp('c2', 1) + '</div>' : '')
        + '<div class="jgrp"><h4>红牌</h4>' + stp('rc', 0) + stp('rc', 1) + '</div>'
        + '<button class="pill green" data-a="fsave">保存</button>'
        + '<p class="hint">数字是总数（包括你点过的）。增加的算补录；减少时先减补录的，再减最后点的“其他角球”，最后才把到达链里的角球、进球改成“无角球”。补录的不算进到达和选择的统计。</p>';
      break;
    }
    case 'list': {
      // 球权两队一笔一起显示（用主队那一笔）
      const rows0 = M.ev.map(e => ({ x: e, kind: 'ev' })).concat(M.sv.filter(s => !(s.i === 1 && svPair(s))).map(s => ({ x: s, kind: 'sv' }))).sort((a, b) => byTime(a.x, b.x));
      let cur = 0, rows = '';
      for (const r of rows0){
        const e = r.x, both = r.kind === 'sv' && !!svPair(e);
        if (e.p !== cur){ cur = e.p; rows += '<h4>' + PER[cur][2] + '</h4>'; }
        const lab = r.kind === 'ev' ? evLabel(e) : svLabel(e);
        rows += '<button data-a="' + (r.kind === 'ev' ? 'evedit' : 'svedit') + '" data-k="' + e.k + '"><span class="t">' + (e.b ? '加入前' : fmtClock(e.p, e.t)) + '</span><span' + (r.kind === 'sv' ? ' class="sv"' : '') + '>' + (both ? '' : '<span class="who d' + e.i + '">' + esc(teamName(e.i)) + '</span>　') + esc(lab) + (e.a ? '<small class="auto">联网补上</small>' : '') + '</span><span class="bf">修改</span></button>';
      }
      h = '<div class="card-h"><h3>全部记录</h3><button class="pill" data-a="close">关闭</button></div>'
        + (rows0.length ? '<div class="list">' + rows + '</div>' : '<p class="hint">还没有记录。</p>');
      break;
    }
    case 'evedit': {
      const e = evByK(d.k);
      if (!e){ closeSheet(); return; }
      let body = '';
      if (e.c === 'ar'){
        const w = walk(e.pa);
        body += '<div class="lbl">选择</div><div class="chips">' + ['' ].concat(CH).map(c => '<button class="chip" data-a="eppick" data-l="0" data-v="' + c + '" aria-pressed="' + ((e.pa[0] || '') === c) + '">' + (c ? CHN[c] : '没选') + '</button>').join('') + '</div>';
        for (let L = 1; L <= w.length; L++){
          const nd = w[L - 1]; if (!nd.o) break;
          body += '<div class="lbl">' + esc(paLabel(e.pa.slice(0, L))) + ' → ' + nd.q + '</div><div class="chips">' + nd.o.map(c => '<button class="chip" data-a="eppick" data-l="' + L + '" data-v="' + c + '" aria-pressed="' + (e.pa[L] === c) + '">' + nd.k[c].n + '</button>').join('') + '</div>';
        }
      }
      h = '<div class="card-h"><h3>修改' + (e.c === 'ar' ? '这次到达' : '这一笔') + '</h3><button class="pill" data-a="list">返回</button></div>'
        + '<p class="netnote">' + (e.b ? '加入前' : fmtClock(e.p, e.t)) + '　' + esc(teamName(e.i)) + '　' + esc(evLabel(e)) + '</p>' + body
        + '<div class="lbl">球队</div><div class="chips">' + [0, 1].map(i => '<button class="chip" data-a="evteam" data-v="' + i + '" aria-pressed="' + (e.i === i) + '">' + esc(teamName(i)) + '</button>').join('') + '</div>'
        + (e.b ? '' : '<div class="lbl">时间</div><div class="chips">' + [[-60, '−1 分'], [-10, '−10 秒'], [10, '＋10 秒'], [60, '＋1 分']].map(x => '<button class="chip" data-a="evtime" data-v="' + x[0] + '">' + x[1] + '</button>').join('') + '</div>')
        + '<button class="pill danger" data-a="evdel">删除这笔</button>';
      break;
    }
    case 'svedit': {
      const s = svByK(d.k);
      if (!s){ closeSheet(); return; }
      const x = SVF[s.f], pr = svPair(s);
      const body = x.pct
        ? '<div class="lbl">' + x.n + (pr ? '（两队一起改，加起来 100%）' : '') + '</div><div class="p1val"><b id="svev">' + esc(svValText(s, s.v)) + '</b></div>'
          + slHTML('sve', s.k, s.v, { cls: pr && !s.i ? 'bq' : s.i ? 'a' : 'h', lab: x.n })
          + (pr ? '' : '<div class="slends"><span>' + x.lo + '</span><span>' + x.hi + '</span></div>')
        : '<div class="lbl">' + x.n + '</div><div class="chips">' + x.o.map((lab, j) => '<button class="chip" data-a="svval" data-v="' + j + '" aria-pressed="' + (s.v === j) + '">' + lab + '</button>').join('') + '</div>';
      h = '<div class="card-h"><h3>修改这笔选择</h3><button class="pill" data-a="list">返回</button></div>'
        + '<p class="netnote">' + fmtClock(s.p, s.t) + '　' + (pr ? '' : esc(teamName(s.i)) + ' 进攻　') + esc(svLabel(s)) + '</p>'
        + body
        + '<div class="lbl">时间</div><div class="chips">' + [[-60, '−1 分'], [-10, '−10 秒'], [10, '＋10 秒'], [60, '＋1 分']].map(y => '<button class="chip" data-a="svtime" data-v="' + y[0] + '">' + y[1] + '</button>').join('') + '</div>'
        + '<button class="pill danger" data-a="svdel">删除这笔</button>';
      break;
    }
    case 'note':
      h = '<div class="card-h"><h3>这场备注</h3><button class="pill" data-a="close">完成</button></div>'
        + '<textarea class="fi" id="noteIn" style="height:180px;font:15px/1.5 var(--f-ui)" placeholder="例如：主队下半场换上高中锋，传中明显变多">' + esc(M.note) + '</textarea>'
        + '<p class="hint">备注会跟着比赛一起保存和导出。</p>';
      break;
    case 'finish':
      h = '<div class="card-h"><h3>结束这场</h3><button class="pill" data-a="close">取消</button></div>'
        + '<p class="hint">' + esc(teamName(0)) + ' vs ' + esc(teamName(1)) + '：要把这场加入比赛仓库吗？</p>'
        + '<button class="pill green bigp" data-a="fkeep">加入仓库</button><p class="hint">保存这场记录、计入统计，以后可以导出给 Claude 分析、建模型。</p>'
        + '<button class="pill bigp" data-a="fdrop">不加入，删除这场</button><p class="hint">删除后几秒内可以在提示里撤销。</p>';
      break;
    case 'newq':
      h = '<div class="card-h"><h3>开始新比赛</h3><button class="pill" data-a="close">取消</button></div>'
        + '<p class="hint">目前这场（' + esc(teamName(0)) + ' vs ' + esc(teamName(1)) + '）还没结束，要怎么处理？</p>'
        + '<button class="pill green bigp" data-a="nq1">结束并加入仓库</button><button class="pill bigp" data-a="nq2">先留着（在仓库里还能打开）</button><button class="pill bigp" data-a="nq3">删除这场</button>';
      break;
    case 'pip':
      h = '<div class="card-h"><h3>视频浮窗</h3><button class="pill" data-a="close">完成</button></div><p class="hint">' + HELP.pip[2] + '</p>'
        + (isPhone() ? '' : '<p class="netnote">浮窗模式只在手机上使用；iPad 的画面够大，不需要空出位置。</p>')
        + '<div class="lbl">浮窗放在哪里</div><div class="chips">' + [['off', '不用浮窗'], ['top', '屏幕上方'], ['bot', '屏幕下方']].map(x => '<button class="chip" data-a="pippos" data-v="' + x[0] + '" aria-pressed="' + (PIP.pos === x[0]) + '">' + x[1] + '</button>').join('') + '</div>'
        + '<div class="lbl">空出的高度：调到跟浮窗边缘对齐（现在 ' + PIP.h + '）</div><div class="chips">' + [['小', 150], ['中', 190], ['大', 230]].map(x => '<button class="chip" data-a="piph" data-v="' + x[1] + '" aria-pressed="' + (PIP.h === x[1]) + '">' + x[0] + '</button>').join('') + '<button class="chip" data-a="pipn" data-d="-10">−10</button><button class="chip" data-a="pipn" data-d="10">＋10</button></div>'
        + '<p class="hint">浮窗很大时按键会变小；屏幕比较小的手机（例如 iPhone SE）建议用“小”或“中”。</p>';
      break;
    case 'arch': {
      card.className = 'card wide';
      const tab = d.tab || 'list';
      h = '<div class="card-h"><h3>比赛仓库</h3><button class="pill" data-a="close">关闭</button></div>'
        + '<div class="seg" style="width:100%">' + [['list', '比赛'], ['stats', '统计'], ['back', '备份']].map(x => '<button style="flex:1" data-a="wtab" data-v="' + x[0] + '" aria-pressed="' + (tab === x[0]) + '">' + x[1] + '</button>').join('') + '</div>'
        + (tab === 'list' ? whListPage(d) : tab === 'stats' ? whStats() : whBack());
      break;
    }
    case 'export':
      h = '<div class="card-h"><h3>导出</h3><button class="pill" data-a="close">关闭</button></div>'
        + '<p class="hint">' + esc(d.name) + '（' + d.count + ' 场）。可以存成文件，或复制文字直接贴给 Claude 分析。</p>'
        + '<div class="row">' + (canShareFile() ? '<button class="pill dark" data-a="share">分享文件</button>' : '') + '<button class="pill' + (canShareFile() ? '' : ' dark') + '" data-a="download">下载文件</button><button class="pill" data-a="copy">复制文字</button></div>'
        + '<textarea class="fi" id="expText" readonly>' + esc(d.text.length > 200000 ? d.text.slice(0, 200000) + '\n…（太长，请用下载或分享）' : d.text) + '</textarea>';
      break;
    case 'net': {
      const used = (NET.used || {})[dayKey(new Date())] || 0, a = M.api, dl = myDelay();
      h = '<div class="card-h"><h3>联网数据</h3><button class="pill" data-a="close">完成</button></div>'
        + '<p class="hint">输入球队名字后（填一队也行），自动在网上找这场比赛：中途加入时帮你填好时间、比分、角球和红牌；记录时按底部的“同步”，你漏点的角球、进球、红牌会等画面追上后补上（标“联网”）。联网的数字只用在比分和角球总数，不会混进到达和选择的统计。数据来源：API-Football、Wikidata。</p>'
        + '<div class="lbl">API key</div>'
        + (keyFromOther() ? '<p class="netnote">现在用的是“角球数据记录”里的 API key（同一个网址共用，不用再填）。几个 app 共用每天的免费额度。要换成别的 key，贴在下面。</p>' : '')
        + '<input class="fi" id="netKey" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="' + (keyFromOther() ? '（用角球数据记录的 key）' : '贴上 API-Football 的 API key') + '" value="' + esc(NET.key) + '">'
        + '<div class="row"><button class="pill dark" data-a="nkey">保存并测试</button>' + (apiKey() ? '<button class="pill" data-a="nkey0">不用联网</button>' : '') + ((NET.key || NET.nosb) && otherKey() ? '<button class="pill" data-a="nsb">用角球数据记录的 key</button>' : '') + '</div>'
        + (d.msg ? '<p class="netnote">' + esc(d.msg) + '</p>' : '')
        + '<div class="lbl">输入球队名字后自动查找</div>'
        + '<div class="chips"><button class="chip" data-a="nauto" data-v="1" aria-pressed="' + !!NET.auto + '">开</button><button class="chip" data-a="nauto" data-v="0" aria-pressed="' + !NET.auto + '">关（只在按“查找”时找）</button></div>'
        + '<div class="lbl">记录时自动同步</div>'
        + '<div class="chips">' + [[0, '关（只在按“同步”时）'], [300, '每 5 分钟'], [180, '每 3 分钟'], [120, '每 2 分钟']].map(x => '<button class="chip" data-a="niv" data-v="' + x[0] + '" aria-pressed="' + (NET.iv === x[0]) + '">' + x[1] + '</button>').join('') + '</div>'
        + '<p class="hint">每次同步用 1 次请求，查找一场用 1–3 次。' + (NET.quota ? 'API-Football 显示今天已用 ' + NET.quota.cur + ' / ' + NET.quota.lim + ' 次（' + esc(NET.quota.t) + ' 查询，几个 app 合计）。' : '今天这个 app 大约用了 ' + used + ' 次请求。') + (NET.iv > 0 ? '现在每 ' + Math.round(NET.iv / 60) + ' 分钟自动同步一次，一场比赛约 ' + Math.round(100 * 60 / NET.iv) + ' 次。' : '现在只在你按“同步”时才联网，最省额度。') + '</p>'
        + '<div class="lbl">画面延迟</div>'
        + '<p class="hint" style="margin-top:0">' + (dl != null && dl < 10 ? '你看的画面跟联网的实时时间差不多（相差不到 10 秒）。' : dl != null ? '你看的画面大约比实时慢 <b>' + fmtDelay(dl) + '</b>。中途加入时会自动扣掉；同步到的角球，会等画面追上之后、你还没点的才补上。' : '还没测出来。连上比赛后，在画面上看到开球时按 ▶，或中途加入时把时间对准画面，app 会自动算出你的画面比实时慢多少。') + '</p>'
        + (dl != null ? '<div class="row"><button class="pill" data-a="ndl0">重新测（换了看球的地方时）</button></div>' : '')
        + (a ? '<div class="lbl">目前这场</div><div class="mrow"><div class="t1">' + esc(a.h) + ' vs ' + esc(a.a) + '</div><div class="t2">' + esc(a.lg || '') + (a.sw ? '，主客跟你输入的相反（已自动对调）' : '') + '</div>'
          + '<div class="row"><button class="pill dark" data-a="nsync">立即同步</button><button class="pill" data-a="nre">换一场</button><button class="pill" data-a="noff">解除连接</button></div></div>'
          : (apiKey() && (M.h.trim() || M.a.trim()) ? '<button class="pill green" data-a="nfind">查找这场比赛</button>' : ''))
        + '<div class="defs"><div><h4>怎么拿 API key</h4><p>到 dashboard.api-football.com 免费注册，登录后在 Account → My Access 复制 API key，贴到上面。key 只存在这台设备上。</p></div></div>';
      break;
    }
    case 'join': {
      const stp = (f, i) => '<div class="stp"><span class="' + (i ? 'a' : 'h') + '">' + esc(teamName(i)) + '</span><button data-a="js" data-f="' + f + '" data-i="' + i + '" data-d="-1" aria-label="减少">−</button><b>' + d[f][i] + '</b><button data-a="js" data-f="' + f + '" data-i="' + i + '" data-d="1" aria-label="增加">＋</button></div>';
      const p = d.ht ? 2 : d.tp.p;
      const ck = p === 1 ? '<div class="jgrp"><h4>上半场已有的角球</h4>' + stp('ck1', 0) + stp('ck1', 1) + '</div>'
        : '<div class="jgrp"><h4>全场已有的角球</h4>' + stp('ft', 0) + stp('ft', 1) + '</div>'
          + '<div class="jgrp"><h4>其中上半场<small>' + (d.lk ? '不知道可以不填' : '下半场到现在 ' + (d.ft[0] - d.ck1[0]) + '–' + (d.ft[1] - d.ck1[1])) + '</small></h4>' + (d.lk ? '<button class="pill" data-a="jlk">我知道上半场各几个</button>' : stp('ck1', 0) + stp('ck1', 1)) + '</div>';
      h = '<div class="card-h"><h3>中途加入</h3><button class="pill" data-a="close">取消</button></div>'
        + (d.net && M.api ? '<p class="netnote">已用联网数据填好（' + esc(M.api.h) + ' vs ' + esc(M.api.a) + '）。' + (d.ht ? '现在是中场休息：开始后会停在中场，下半场开球时按 ▶。'
          : d.dl != null && d.dl >= 10 ? '时间已按你的画面延迟（慢 ' + fmtDelay(d.dl) + '）往回调，跟画面上的时间对一下再开始。'
          : '下面先填的是联网的实时时间。你看的画面通常慢一些：请调到画面上现在显示的时间再开始，app 会记住这个延迟。') + (d.nock ? '这场联网没有角球统计，角球请自己填。' : '') + '</p>' : '')
        + (d.ht ? '' : '<div class="jgrp"><h4>画面上现在的比赛时间<small>' + (d.tp.live ? '时间会跟着走，对准画面就行' : '') + '</small></h4>' + tpHTML(d.tp) + '</div>')
        + '<div class="jgrp"><h4>目前比分</h4>' + stp('sc', 0) + stp('sc', 1) + '</div>' + ck
        + '<div class="jgrp"><h4>红牌</h4>' + stp('rc', 0) + stp('rc', 1) + '</div>'
        + '<button class="pill green" data-a="jgo">' + (d.ht ? '从中场休息开始记录' : '从 <span id="jgoT">' + fmtClock(d.tp.p, d.tp.v) + '</span> 开始记录') + '</button>'
        + '<p class="hint">加入前的比分、角球、红牌算进总数，但不算进到达和选择的统计。统计只算你从现在开始看到的。</p>';
      break;
    }
    case 'mdl': {
      card.className = 'card wide';
      const g = d.g === 'q' ? 'q' : 'r', N = mAll()[g], b = N.bet;
      h = '<div class="card-h"><h3>简易模型</h3><button class="pill" data-a="mset">调整标准</button><button class="pill" data-a="close">关闭</button></div>'
        + '<div class="seg" style="width:100%">' + ['r', 'q'].map(k => '<button style="flex:1" data-a="mtab" data-v="' + k + '" aria-pressed="' + (g === k) + '">' + MPROG[k] + '</button>').join('') + '</div>'
        + (MODEL.on ? '' : '<p class="netnote">提醒现在关着（在“调整标准”里打开）。下面还是照样算给你看。</p>')
        + '<div class="mbet ' + betCls(b) + '">' + betIcon(b) + '<b>' + esc(betText(b)) + '</b></div>'
        + '<p class="hint">' + (g === 'r' ? '比例用' + (MODEL.sc === 'ft' ? '全场' : '本半场') + '的数据；传中＋远射这类比例要满 ' + MODEL.min + ' 次才算，没满的条件显示还差几次。' : '用两个问题现在设的百分比。') + '</p>'
        + '<div class="mdg">' + [0, 1].map(i => mTeamHTML(N.t[i], i)).join('') + '</div>'
        + '<p class="hint">这是你主观定的暂时模型，只是提醒，不会改任何记录。比赛数据照常记，以后用真实数据建更准的模型。</p>';
      break;
    }
    case 'mset': {
      card.className = 'card wide';
      const g = d.g === 'q' ? 'q' : 'r';
      const seg = (a, list, cur) => '<div class="seg">' + list.map(x => '<button data-a="' + a + '" data-v="' + x[0] + '" aria-pressed="' + (cur === x[0]) + '">' + x[1] + '</button>').join('') + '</div>';
      h = '<div class="card-h"><h3>简易模型：标准</h3><button class="pill" data-a="mdl">看现在的判断</button><button class="pill dark" data-a="close">完成</button></div>'
        + '<div class="mopt"><span>提醒</span>' + seg('mon', [[1, '开'], [0, '关']], MODEL.on) + '</div>'
        + '<div class="mopt"><span>比例用哪段数据</span>' + seg('msc', [['half', '本半场'], ['ft', '全场']], MODEL.sc) + '</div>'
        + '<div class="mopt col"><span>比例最少要几次才算<b id="mminv">' + MODEL.min + ' 次</b></span>' + slHTML('mmin', 'min', MODEL.min, { lo: 1, hi: 10, st: 1, lab: '比例最少要几次才算' })
        + '<p class="hint">传中＋远射占三项：传中、远射、中路渗透加起来要满这么多次；传中、远射内的比例：传中（远射）要满这么多次。没满就当作还不算。</p></div>'
        + '<div class="seg" style="width:100%">' + ['r', 'q'].map(k => '<button style="flex:1" data-a="mtab" data-v="' + k + '" aria-pressed="' + (g === k) + '">' + MPROG[k] + '</button>').join('') + '</div>'
        + mRuleHTML(g, 'b') + mRuleHTML(g, 's')
        + '<div class="defs"><div><h4>两队合起来（固定）</h4><ul><li>两队都大角：可以投大角</li><li>两队都小角：可以投小角</li><li>只有一队有提醒，或一队大角、一队小角：可以投角球让球，投角球会比较多的那一队</li></ul></div></div>'
        + '<button class="pill" data-a="mreset">恢复默认标准</button>'
        + '<p class="hint">改了马上生效，存在这台设备上。大角和小角同时成立时（标准互相冲突）不提醒。</p>';
      break;
    }
    case 'import':
      h = '<div class="card-h"><h3>导入</h3><button class="pill" data-a="close">取消</button></div>'
        + '<p class="hint">选择之前导出的 .json 文件，或把导出的文字贴在下面。同一场比赛会用导入的版本取代。</p>'
        + '<button class="pill dark" data-a="pickfile">选择文件</button><textarea class="fi" id="impText" placeholder="贴上导出的文字"></textarea><button class="pill" data-a="imptext">导入贴上的文字</button>';
      break;
  }
  card.innerHTML = h;
}
/* 简易模型：一队现在每个条件满不满足 */
function mTeamHTML(T, i){
  const vb = T.v === 'b' ? '<span class="mbg big">' + ICM.up + '<span>大角</span></span>' : T.v === 's' ? '<span class="mbg small">' + ICM.dn + '<span>小角</span></span>' : '<span class="mbg off">没有提醒</span>';
  const row = x => '<li class="' + (x.ok === true ? 'y' : x.ok === false ? 'n' : 'u') + '">' + (x.ok === true ? ICM.ok : x.ok === false ? ICM.no : ICM.na)
    + '<span class="ct">' + esc(condText(x.c)) + '</span><span class="cv">' + esc(x.mv.v == null ? x.mv.why : '现在 ' + fmtMV(x.c.m, x.mv.v, x.c.v)) + '</span></li>';
  const grp = (L, title) => L.length ? '<h6>' + title + '</h6><ul class="mcl">' + L.map(row).join('') + '</ul>' : '';
  const side = (w, title) => { const S = T[w]; return '<div class="mside ' + (w === 'b' ? 'big' : 'small') + (S.ok ? ' on' : '') + '"><h5>' + (w === 'b' ? ICM.up : ICM.dn) + '<span>' + title + '</span>' + (S.ok ? '<em>成立</em>' : '') + '</h5>'
    + grp(S.all, '全部满足') + grp(S.any, '满足任意一项就算') + (S.all.length + S.any.length ? '' : '<p class="hint">没有条件</p>') + '</div>'; };
  return '<div class="mdc"><div class="mdh"><i style="background:var(--' + (i ? 'am' : 'hm') + ')"></i><b>' + esc(teamName(i)) + '</b><span class="wh">' + (i ? '客对主' : '主对客') + '</span>' + vb + '</div>'
    + (T.clash ? '<p class="netnote">大角和小角同时成立，标准互相冲突，所以不提醒。</p>' : '')
    + side('b', '大角：角球高于平均') + side('s', '小角：角球低于平均') + '</div>';
}
/* 简易模型：编辑一条规则（大角或小角）的两组条件 */
function mRuleHTML(g, w){
  const R = MODEL[g][w], d = sheetData;
  const grp = (l, title, sub) => {
    const path = g + '.' + w + '.' + l;
    return '<div class="mgrp"><h5>' + title + (sub ? '<small>' + sub + '</small>' : '') + '</h5>'
      + R[l].map((c, j) => mCondEd(c, path + '.' + j)).join('')
      + (d.add === path ? mPicker(path) : '<button class="chip addc" data-a="mcadd" data-p="' + path + '">＋ 加一项</button>') + '</div>';
  };
  return '<div class="mrule ' + (w === 'b' ? 'big' : 'small') + '"><h4>' + (w === 'b' ? ICM.up + '<span>大角：这队角球高于平均</span>' : ICM.dn + '<span>小角：这队角球低于平均</span>') + '</h4>'
    + grp('all', '全部满足', R.all.length ? '' : '没有条件时这一组不算') + grp('any', '满足任意一项就算', '可以不放') + '</div>';
}
function mCondEd(c, x){
  const k = c.m, del = '<button class="mcx" data-a="mcdel" data-p="' + x + '">删除</button>';
  if (MET[k].cat) return '<div class="mce"><div class="mch"><b>' + esc(MET[k].n) + '</b><span>是其中一个就算</span>' + del + '</div><div class="chips">'
    + P1[3].o.map((lab, j) => '<button class="chip" data-a="mcin" data-p="' + x + '" data-v="' + j + '" aria-pressed="' + (c.in.indexOf(j) >= 0) + '">' + lab + '</button>').join('') + '</div></div>';
  return '<div class="mce"><div class="mch"><b>' + esc(MET[k].n) + '</b>' + (MET[k].d ? '<span>' + esc(MET[k].d) + '</span>' : '') + del + '</div>'
    + '<div class="mco"><div class="seg">' + OPK.map(o => '<button data-a="mop" data-p="' + x + '" data-v="' + o + '" aria-pressed="' + (c.op === o) + '">' + OPS[o] + '</button>').join('') + '</div>'
    + '<b class="mthv" id="mv_' + x.replace(/\./g, '_') + '">' + esc(fmtTh(k, c.v)) + '</b></div>'
    + slHTML('mth', x, c.v, { lo: mLo(k), hi: mHi(k), st: mSt(k), lab: MET[k].n + '的标准' }) + '</div>';
}
function mPicker(path){
  return '<div class="mpick"><div class="mpk-h"><b>加哪一项？</b><button class="chip" data-a="mcadd" data-p="">取消</button></div>'
    + MGP.map((t, gp) => '<div class="lbl">' + t + '</div><div class="chips">' + MORD.filter(k => MET[k].gp === gp).map(k => '<button class="chip" data-a="mcpick" data-p="' + path + '" data-v="' + k + '">' + esc(MET[k].n) + '</button>').join('') + '</div>').join('') + '</div>';
}
/* 补录：按差额加减补录事件（b=1）；减少时先减补录的、联网补上的，再减最后点的，最后才把到达链里的结果改成无角球 */
function pickLast(fn){ let best = null; for (const e of M.ev) if (fn(e) && (!best || e.k > best.k)) best = e; return best; }
function adjKind(i, code, p, diff){
  const inP = e => p == null || e.p === p;
  while (diff > 0){ M.ev.push({ t: PER[p || curP()][0], p: p || curP(), i: i, c: code, b: 1, k: ++seq }); diff--; }
  while (diff < 0){
    const pick = pickLast(e => e.i === i && e.c === code && inP(e) && e.b) || pickLast(e => e.i === i && e.c === code && inP(e) && e.a) || pickLast(e => e.i === i && e.c === code && inP(e));
    if (pick){ M.ev.splice(M.ev.indexOf(pick), 1); diff++; continue; }
    const r = code === 'ck' ? 'c' : code === 'gl' ? 'g' : null;
    const ch = r ? pickLast(e => e.i === i && e.c === 'ar' && inP(e) && resOf(e.pa) === r) : null;
    if (!ch) break;
    ch.pa = ch.pa.slice(0, -1) + 'n'; diff++;
  }
}
function applyFix(d){
  const o = d.orig;
  for (const i of [0, 1]){
    adjKind(i, 'ck', 1, d.c1[i] - o.c1[i]);
    if (d.c2) adjKind(i, 'ck', 2, d.c2[i] - o.c2[i]);
    adjKind(i, 'gl', null, d.sc[i] - o.sc[i]);
    adjKind(i, 'rc', null, d.rc[i] - o.rc[i]);
  }
  sortEv(M); save();
}
