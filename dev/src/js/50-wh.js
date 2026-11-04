/* ================= 比赛仓库 ================= */
const hasContent = m => !!(m.ev.length || m.sv.length || m.tm.b || m.tm.r);
function whAll(){ return Object.keys(store).map(k => store[k]).filter(m => hasContent(m) || m.h.trim() || m.a.trim()).sort((a, b) => (b.u || b.c) - (a.u || a.c)); }
function whListPage(d){
  const all = whAll(), f = d.f || 'all', nDone = all.filter(m => m.st === 2).length;
  return '<div class="wbar"><input class="fi" id="whQ" type="search" placeholder="搜索球队、联赛或日期" value="' + esc(d.q || '') + '" autocomplete="off" autocapitalize="off" spellcheck="false"></div>'
    + '<div class="chips">' + [['all', '全部 ' + all.length], ['done', '已结束 ' + nDone], ['open', '未结束 ' + (all.length - nDone)]].map(x => '<button class="chip" data-a="wf" data-v="' + x[0] + '" aria-pressed="' + (f === x[0]) + '">' + x[1] + '</button>').join('') + '</div>'
    + '<div id="whList">' + whListHTML(d) + '</div>';
}
function whListHTML(d){
  const f = d.f || 'all', q = (d.q || '').trim().toLowerCase();
  const list = whAll().filter(m => (f === 'all' || (f === 'done' ? m.st === 2 : m.st !== 2)) && (!q || [m.h, m.a, m.lg, m.d].some(x => String(x || '').toLowerCase().indexOf(q) >= 0)));
  if (!list.length) return '<p class="hint">' + (whAll().length ? '没有符合的比赛。' : '还没有比赛。结束一场比赛时选“加入仓库”，就会保存在这里。') + '</p>';
  return list.map(m => {
    const sc = score(m), c1 = cornersOf(m, 'h1'), c2 = cornersOf(m, 'h2');
    const nar = m.ev.filter(e => e.c === 'ar').length, nq = m.sv.filter(s => s.f[0] === 'q').length, ng = m.sv.filter(s => SVF[s.f].pg === 'g').length;
    const cur = m.id === M.id, open = d.open === m.id;
    const act = open ? '<div class="wact"><div class="row">' + (cur ? '' : '<button class="pill dark" data-a="mopen" data-id="' + esc(m.id) + '">打开</button>') + '<button class="pill" data-a="mexp" data-id="' + esc(m.id) + '">导出</button><button class="pill' + (d.del === m.id ? ' danger' : '') + '" data-a="mdel" data-id="' + esc(m.id) + '">' + (d.del === m.id ? '确定删除' : '删除') + '</button></div></div>' : '';
    return '<div class="wrow"><button data-a="wopen" data-id="' + esc(m.id) + '" aria-expanded="' + open + '"><span class="w1">' + esc(m.h || '主队') + ' ' + sc[0] + '–' + sc[1] + ' ' + esc(m.a || '客队') + (cur ? ' <i class="wtag live">目前这场</i>' : '') + (m.st !== 2 ? ' <i class="wtag">未结束</i>' : '') + '</span>'
      + '<span class="w2">' + esc(m.d) + (m.lg ? ' · ' + esc(m.lg) : '') + ' · 角球 ' + (c1[0] + c2[0]) + '–' + (c1[1] + c2[1]) + '（上半场 ' + c1[0] + '–' + c1[1] + '） · 到达 ' + nar + ' 次' + (nq ? ' · 两个问题' : '') + (ng ? ' · 进球预测' : '') + '</span></button>' + act + '</div>';
  }).join('');
}
/* 统计：以后建模型用。每队每半场一笔（看了 20 分钟以上的半场） */
const MIN_HALF = 20;
function halfRows(list){
  const out = [];
  for (const m of list) for (const p of [1, 2]){
    const mins = minsOf(m, 'h' + p); if (mins < MIN_HALF) continue;
    for (const i of [0, 1]){
      const r = statOf(m, i, 'h' + p);
      let ck = 0; for (const e of m.ev) if (e.i === i && e.p === p && !e.b && (e.c === 'ck' || (e.c === 'ar' && resOf(e.pa) === 'c'))) ck++;
      out.push({ m: m, p: p, i: i, mins: mins, r: r, ck: ck });
    }
  }
  return out;
}
function whStats(){
  const done = Object.keys(store).map(k => store[k]).filter(m => m.st === 2 && hasContent(m));
  if (!done.length) return '<p class="hint">还没有结束的比赛。结束时选“加入仓库”，这里就会有平均角球、到达和选择的统计，以及每种主观选择下的角球。</p>';
  // 联赛平均
  const lg = {};
  let nAll = 0, gAll = 0, cFull = 0, nFull = 0;
  for (const m of done){
    const k = m.lg.trim() || '没填联赛', x = lg[k] || (lg[k] = { n: 0, g: 0, nf: 0, cf: 0, n1: 0, c1: 0 });
    const sc = score(m), c1 = cornersOf(m, 'h1'), cf = cornersOf(m, 'ft');
    x.n++; x.g += sc[0] + sc[1]; nAll++; gAll += sc[0] + sc[1];
    if (fullHalf(m, 1) || c1[0] + c1[1]){ x.n1++; x.c1 += c1[0] + c1[1]; }
    if (m.stop && m.stop.p === 2 && m.stop.t >= PER[2][1] - 120){ x.nf++; x.cf += cf[0] + cf[1]; nFull++; cFull += cf[0] + cf[1]; }
  }
  const lgs = Object.keys(lg).sort((a, b) => lg[b].n - lg[a].n);
  let h = '<div class="wst"><div><h4>平均进球和角球（' + done.length + ' 场）</h4><table class="sts"><thead><tr><th>联赛</th><th>场数</th><th>进球</th><th>全场角球</th><th>上半场角球</th></tr></thead><tbody>'
    + lgs.map(k => { const x = lg[k]; return '<tr><td class="tl">' + esc(k) + '</td><td>' + x.n + '</td><td>' + (x.g / x.n).toFixed(1) + '</td><td>' + (x.nf ? (x.cf / x.nf).toFixed(1) : '—') + '</td><td>' + (x.n1 ? (x.c1 / x.n1).toFixed(1) : '—') + '</td></tr>'; }).join('')
    + (lgs.length > 1 ? '<tr><td class="tl">全部</td><td>' + nAll + '</td><td>' + (gAll / nAll).toFixed(1) + '</td><td>' + (nFull ? (cFull / nFull).toFixed(1) : '—') + '</td><td>—</td></tr>' : '')
    + '</tbody></table><p class="hint">全场角球只算看到最后的比赛（包括补录的角球）。</p></div>';
  const rows = halfRows(done);
  if (!rows.length) return h + '<p class="hint">到达和选择的统计只用看了 ' + MIN_HALF + ' 分钟以上的半场。</p></div>';
  // 我的平均
  const T = { mins: 0, ar: 0, chosen: 0, ch: { x: 0, l: 0, m: 0, b: 0, g: 0 }, dt: [], io: { x: [0, 0], l: [0, 0] }, bs: 0, ck: 0 };
  for (const x of rows){ const r = x.r; T.mins += x.mins; T.ar += r.ar; T.chosen += r.chosen; for (const c of CH) T.ch[c] += r.ch[c]; T.dt = T.dt.concat(r.dt.filter(v => v <= DT_MAX)); for (const c of ['x', 'l']){ T.io[c][0] += r.io[c][0]; T.io[c][1] += r.io[c][1]; } T.bs += r.bs; T.ck += x.ck; }
  const sh = c => T.chosen ? T.ch[c] / T.chosen : null, ioR = c => T.io[c][0] + T.io[c][1] ? T.io[c][0] / (T.io[c][0] + T.io[c][1]) : null;
  h += '<div><h4>我的平均（' + rows.length + ' 个队伍半场）</h4><table class="sts"><tbody>'
    + [['到达（每 10 分钟）', f1(T.ar / T.mins * 10)], ['传中占选择', pc(sh('x'))], ['远射占选择', pc(sh('l'))], ['中路渗透占选择', pc(sh('m'))], ['回传占选择', pc(sh('b'))], ['丢球占选择', pc(sh('g'))],
      ['传中＋远射占选择', pc(T.chosen ? (T.ch.x + T.ch.l) / T.chosen : null)], ['传中＋远射占三项', pc(T.ch.x + T.ch.l + T.ch.m ? (T.ch.x + T.ch.l) / (T.ch.x + T.ch.l + T.ch.m) : null)],
      ['从到达到选择（平均秒数）', f1(avg(T.dt))], ['传中在范围内', pc(ioR('x'))], ['远射在范围内', pc(ioR('l'))],
      ['禁区射门（每 10 分钟）', f1(T.bs / T.mins * 10)], ['角球（每 10 分钟）', f1(T.ck / T.mins * 10)]].map(x => '<tr><td class="tl">' + x[0] + '</td><td>' + x[1] + '</td></tr>').join('')
    + '</tbody></table></div>';
  // 你的逻辑：常到禁区附近、又偏爱传中和远射 → 角球多？
  const bA = r => { const v = r.r.ar / r.mins * 10; return v < 2.5 ? 0 : v < 4 ? 1 : 2; };
  const bX = r => { const n = r.r.ch.x + r.r.ch.l + r.r.ch.m; if (n < 4) return null; const v = (r.r.ch.x + r.r.ch.l) / n; return v < 0.4 ? 0 : v < 0.6 ? 1 : 2; };
  const cell = {};
  for (const x of rows){ const a = bA(x), b = bX(x); if (b == null) continue; const c = cell[a + '' + b] || (cell[a + '' + b] = { ck: 0, mins: 0, n: 0 }); c.ck += x.ck; c.mins += x.mins; c.n++; }
  h += '<div><h4>你的逻辑：到达多不多 × 传中远射多不多</h4><table class="sts"><thead><tr><th>到达每10分＼传中＋远射占三项</th><th>少 &lt;40%</th><th>中 40–60%</th><th>多 ≥60%</th></tr></thead><tbody>'
    + ['少 &lt;2.5', '中 2.5–4', '多 ≥4'].map((t, a) => '<tr><td class="tl">' + t + '</td>' + [0, 1, 2].map(b => { const c = cell[a + '' + b]; return c ? '<td>' + f1(c.ck / c.mins * 10) + '<small>' + c.n + '</small></td>' : '<td class="dim">—</td>'; }).join('') + '</tr>').join('')
    + '</tbody></table><p class="hint">格子里是每 10 分钟几个角球，小字是队伍半场数（传中、远射、中路渗透加起来至少 4 次才算）。每格少于 10 个半场时，数字还会跳得很厉害。</p></div>';
  // 第一部分、两个问题：每个区间（拖动条）或选项（场面）下的角球；进球预测（goal）：每个区间下的进球
  const stTab = (x, title, goal) => {
    const agg = {}; const n = x.pct ? x.bk.length : x.o.length;
    for (let v = -1; v < n; v++) agg[v] = { mins: 0, ck: 0, ar: 0, gl: 0 };
    for (const m of done) for (const i of [0, 1]){ const s = stateSplit(m, i, x.f, 'ft'); for (let v = -1; v < n; v++){ agg[v].mins += s[v].mins; agg[v].ck += s[v].ck; agg[v].ar += s[v].ar; agg[v].gl += s[v].gl; } }
    const lines = [];
    for (let v = 0; v < n; v++) if (agg[v].mins >= 1) lines.push('<tr><td class="tl">' + (x.pct ? x.bk[v][2] + '<small>' + esc(x.bk[v][3]) + '</small>' : esc(x.o[v])) + '</td><td>' + Math.round(agg[v].mins) + '</td>'
      + (goal ? '<td>' + agg[v].gl + '</td><td>' + (agg[v].gl / agg[v].mins * 90).toFixed(2) + '</td>' : '<td>' + f1(agg[v].ar / agg[v].mins * 10) + '</td><td>' + f1(agg[v].ck / agg[v].mins * 10) + '</td>') + '</tr>');
    if (!lines.length) return '';
    return '<div><h4>' + title + '</h4><table class="sts"><thead><tr><th>' + (x.pct ? '区间' : '选择') + '</th><th>分钟</th>' + (goal ? '<th>进球</th><th>进球/90分</th>' : '<th>到达/10分</th><th>角球/10分</th>') + '</tr></thead><tbody>' + lines.join('') + '</tbody></table></div>';
  };
  const st = P1.map(x => stTab(x, '第一部分：' + x.n)).join('') + QS.map(x => stTab(x, '两个问题：' + x.s)).join('');
  const sg = GS.map(x => stTab(x, '进球预测：' + x.s, true)).join('');
  if (!st && !sg) h += '<p class="hint">还没有第一部分、两个问题或进球预测的记录。比赛中设了以后，这里会有每个区间下平均几个角球（进球预测是几个进球）。</p>';
  if (st) h += st + '<p class="hint">分钟＝这一队处在这个区间（或选项）的时间（所有比赛加起来），角球和到达都算这一队的。拖动条的值最多一位小数，所以区间写到 .9（例如 20–39.9%）。数据多了以后，可以导出给 Claude 建模型。</p>';
  if (sg) h += sg + '<p class="hint">进球预测：分钟＝这一队处在这个区间的时间（所有比赛加起来），进球是这一队在那段时间进的；补录的进球时间不详，不算。进球/90分＝每 90 分钟几个进球。进球比角球少很多，要很多场才看得出差别。</p>';
  return h + '</div>';
}
function whBack(){
  const last = LS.get('corner-reach-exported', 0), all = whAll();
  return '<div class="tidy"><b>备份</b><p>数据只存在这台设备上，换手机或清除浏览器数据会不见，建议每周导出一次。' + (last ? '上次导出：' + new Date(last * 1000).toLocaleString('zh-CN', { hour12: false }) + '。' : '还没导出过。') + '导出档可以直接传给 Claude 分析、建模型。</p>'
    + '<div class="row"><button class="pill dark" data-a="expall" ' + (all.length ? '' : 'disabled') + '>导出全部（' + all.length + ' 场）</button><button class="pill" data-a="expcsv" ' + (all.length ? '' : 'disabled') + '>每一笔（CSV）</button><button class="pill" data-a="expcsvh" ' + (all.length ? '' : 'disabled') + '>每队每半场（CSV）</button><button class="pill" data-a="import">导入</button></div></div>'
    + '<p class="hint">JSON 有每一笔记录和时间，可以再导入；“每一笔”是每次到达、角球、进球一行，带着当时第一部分、两个问题、进球预测的值（百分比）；“每队每半场”是次数加起来一行，拖动条的项目是按时间平均的百分比，还有简易模型提醒了几分钟。CSV 用 Excel 或 Numbers 打开。</p>';
}
function dropMatch(m, msg){
  const wasCur = m.id === M.id;
  delete store[m.id]; LS.set(KEY, store);
  if (wasCur){ M = newMatch(m); OC[0] = OC[1] = null; saveNow(); }
  renderAll();
  showToast(msg, () => {
    store[m.id] = m; LS.set(KEY, store);
    if (wasCur && !hasContent(M)){ if (store[M.id] && M.id !== m.id) delete store[M.id]; M = m; saveNow(); }
    if (sheetKind === 'arch') renderSheet(); renderAll();
  });
}
function startNew(){
  saveNow();
  if (M.st !== 2 && !hasContent(M) && store[M.id]){ delete store[M.id]; LS.set(KEY, store); }
  pauseClock();
  M = newMatch(M); OC[0] = OC[1] = null; saveNow(); closeSugg(); renderAll(); showToast('已开始新比赛');
}
function askNew(){ if (M.st === 2 || !hasContent(M)){ startNew(); return; } openSheet('newq'); }

/* ================= 导出与导入 ================= */
const README = APPNAME + '导出档（fmt=2）。matches 是比赛阵列，每场：id、d 日期、lg 联赛、h 主队、a 客队、st 状态(1进行中/2已结束)、keep(1=结束时选了加入仓库)、pe 各半场结束时的比赛时钟秒数、obs 开始记录的位置{p 半场, t 比赛时钟秒数}、stop 结束记录的位置、note 备注、ev 事件、sv 主观选择、al 简易模型的提醒、mc 当时用的模型标准。只有 obs 到 stop 之间是实际看到的。'
  + 'ev 每笔 = {t 比赛时钟秒数（下半场从2700起算）, p 半场(1/2), i 进攻的队伍(0主队/1客队), c 类型}。c：ar 到达（本队在对方禁区附近控制住球）、ck 其他角球（不是从记下的那次到达直接来的）、gl 进球（不是从到达链来的：进球预测的“进球 ＋1”、补录、点球等）、rc 红牌；b=1 加入前补录、时间不详；a=1 联网同步补上的，时间是估计。'
  + 'ar 另有 pa 选择路径（一串字母，见 tree）和 dt 从按到达到第一个选择的秒数（没有＝不详）。路径第一个字母：x 传中、l 远射、m 中路渗透、b 回传、g 丢球；传中 x 后 i 内/o 外，xi 后 s 禁区射门/c 解围或中途拦截，再后 g 进球/c 角球/n 无角球；远射 l 后 i 内/o 外，li 后 g/c/n；中路渗透 m 后 s 禁区射门/n 无禁区射门，ms 后 g/c/n；回传、丢球没有后续。路径以 c 结果结束的（例如 xisc、xicc、lic、msc）＝这次到达直接得到角球。空字串＝到达后没选。'
  + 'sv 每笔 = {t, p, i 进攻的队伍, f 项目, v 值(null=清除)}，从这个时间起一直有效到下一笔。拖动条的项目 v 是百分比 0–100，最多一位小数（v2 每格 5，v3 起默认每格 1，可以设成 0.5 或 0.1）：bq 球权（两队加起来 100，同一次调整的两笔有同一个 g）、nd 到禁区附近的难度(0 没难度…100 难且进不去)、yy 到禁区附近的意愿(0 弱…100 强)、q1 他容不容易到对方禁区附近（几次进攻里有百分之几能到对方禁区附近）、q2 他喜不喜欢传中和远射（传中和远射的比例）；进球预测（v5 起，暂时没有模型）：g1 容不容易到对面禁区附近(0 很难…100 很容易，跟 q1 分开记)、g2 对面球门前漏洞大不大(0 很小…100 很大)、g3 自己的进攻质量高不高（传中、射门、基本功、战术配合，0 很低…100 很高）。cm 到禁区附近的场面 v 是选第几个(0 包饺子/1 包一会饺子然后转换球权/2 快速转换球权)。'
  + '旧版（v1，选项）记的会换成那一档中间的百分比，原来选第几个留在 o：bq 多/中/少→65/50/35、nd 五档→10/30/50/70/90、yy 强/中/弱→80/50/20、q1/q2 1–5 档→10/30/50/70/90。'
  + 'al 每笔 = {t, p, g 程序(r 到达与选择/q 两个问题), i 队伍, v 提醒(b 大角=角球高于平均/s 小角=角球低于平均/空字串=没有提醒)}：简易模型的提醒从这个时间起变成 v。两队合起来：都 b→投大角；都 s→投小角；只有一队有提醒、或一队 b 一队 s→投角球让球（投角球会比较多的那队）。model 是导出时的模型标准（mc 是这场最后一次提醒变化时的标准）：每个程序 b/s 两条规则，all=全部满足、any=满足任意一项；条件 {m 项目, op gt高于/ge至少/lt低于/le最多, v 标准} 或场面 {m:cm, in 选项}；xl=传中＋远射占三项（传中、远射、中路渗透），min=比例最少要几次才算，sc=half 本半场/ft 全场。'
  + 'api 是联网连上的比赛（API-Football fixture id、两队英文名、sw=1 主客相反，最后同步到的 st 状态、el 分钟、g 比分、ck 角球、ck1 上半场角球、sh 射门{t 全部, b 被挡, on 射正}、pos 控球%、rc 红牌、dl 你的画面比实时慢几秒）。';
function treeObj(){ const o = {}; const go = (nd, pa) => { if (pa) o[pa] = paLabel(pa); if (nd.o) for (const c of nd.o) go(nd.k[c], pa + c); }; go(ROOT, ''); return o; }
function openExport(list){
  const ds = new Date().toISOString().slice(0, 10);
  const matches = list.map(m => ({ id: m.id, d: m.d, lg: m.lg, h: m.h, a: m.a, st: m.st, keep: m.keep ? 1 : undefined, pe: m.pe, obs: m.obs, stop: m.stop, note: m.note || undefined,
    api: m.api ? { id: m.api.id, h: m.api.h, a: m.api.a, lg: m.api.lg, sw: m.api.sw, st: m.api.st, el: m.api.el, g: m.api.g, ck: m.api.ck, ck1: m.api.ck1 || undefined, sh: m.api.sh, pos: m.api.pos, rc: m.api.rc, dl: m.api.dl } : undefined,
    ev: m.ev.map(e => { const x = { t: e.t, p: e.p, i: e.i, c: e.c }; if (e.c === 'ar'){ x.pa = e.pa; if (ok(e.dt)) x.dt = e.dt; } if (e.b) x.b = 1; if (e.a) x.a = 1; return x; }),
    sv: m.sv.map(s => { const x = { t: s.t, p: s.p, i: s.i, f: s.f, v: s.v }; if (s.g != null) x.g = s.g; if (s.o != null) x.o = s.o; return x; }),
    al: m.al.length ? m.al.map(a => ({ t: a.t, p: a.p, g: a.g, i: a.i, v: a.v })) : undefined, mc: m.mc || undefined, pv: 1 }));
  const obj = { app: APPNAME, fmt: 2, ver: APPVER, exported: new Date().toISOString().slice(0, 16), readme: README, tree: treeObj(),
    sv: SVL.reduce((o, x) => { o[x.f] = x.pct ? { n: x.n, u: '%', lo: x.lo, hi: x.hi, bk: x.bk.map(b => b[2] + ' ' + b[3]) } : { n: x.n, o: x.o }; return o; }, {}),
    model: MODEL, matches: matches };
  const nm = s => (s || '').replace(/[\\/:*?"<>|\s]+/g, '');
  const name = list.length === 1 ? '角球到达_' + list[0].d + '_' + (nm(list[0].h) || '主队') + 'vs' + (nm(list[0].a) || '客队') + '.json' : '角球到达_全部' + list.length + '场_' + ds + '.json';
  openSheet('export', { text: JSON.stringify(obj), name: name, count: list.length, type: 'application/json' });
}
const csvOf = rows => '﻿' + rows.map(r => r.map(v => { const s = String(v == null ? '' : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(',')).join('\n');
const svCols = (m, i, p, t) => SVL.map(x => { const s = svAt(m, i, x.f, p, t); return s && s.v != null ? (x.pct ? s.v : x.o[s.v]) : ''; });
// 表格里每个主观项目的栏名：第一部分用全名，两个问题用短名，进球预测前面加“进球·”
const svCol = x => x.pg === 'g' ? svName(x.f) : x.f[0] === 'q' ? x.s : x.n;
function openCsv(list){
  const head = ['日期', '联赛', '主队', '客队', '进攻方', '进攻球队', '半场', '时间', '比赛钟秒数', '类型', '选择', '用时秒', '内外', '下一步', '结果', '路径', '完整路径', '禁区射门', '角球', '进球', '补录', '联网补上'];
  SVL.forEach(x => head.push(svCol(x) + (x.pct ? '%' : '')));
  const rows = [head];
  for (const m of list){
    for (const e of m.ev){
      const w = e.c === 'ar' ? walk(e.pa) : [];
      const res = e.c === 'ar' ? resOf(e.pa) : null;
      const io = e.c === 'ar' && (e.pa[0] === 'x' || e.pa[0] === 'l') && e.pa.length > 1 ? (e.pa[1] === 'i' ? '内' : '外') : '';
      const nx = e.c === 'ar' && e.pa[0] === 'x' && e.pa.length > 2 ? w[2].n : e.c === 'ar' && e.pa[0] === 'm' && e.pa.length > 1 ? w[1].n : '';
      const row = [m.d, m.lg, m.h, m.a, e.i ? '客' : '主', e.i ? m.a : m.h, e.p === 1 ? '上' : '下', e.b ? '' : fmtClock(e.p, e.t), e.b ? '' : e.t,
        e.c === 'ar' ? '到达' : e.c === 'ck' ? '其他角球' : SIMPLE[e.c], e.c === 'ar' && e.pa ? CHN[e.pa[0]] : '', e.c === 'ar' && ok(e.dt) ? e.dt : '', io, nx,
        res ? R3[res].n : '', e.c === 'ar' ? e.pa : '', e.c === 'ar' ? paLabel(e.pa) : '', e.c === 'ar' && hasBox(e.pa) ? 1 : 0,
        e.c === 'ck' || res === 'c' ? 1 : 0, e.c === 'gl' || res === 'g' ? 1 : 0, e.b ? 1 : '', e.a ? 1 : ''];
      rows.push(row.concat(svCols(m, e.i, e.p, e.t)));
    }
  }
  openSheet('export', { text: csvOf(rows), name: '角球到达_每一笔_' + list.length + '场_' + new Date().toISOString().slice(0, 10) + '.csv', count: list.length, type: 'text/csv' });
}
function openCsvHalf(list){
  const head = ['日期', '联赛', '主队', '客队', '进攻方', '进攻球队', '半场', '看到分钟', '完整半场', '到达', '传中', '远射', '中路渗透', '回传', '丢球', '没选', '传中内', '传中外', '远射内', '远射外', '禁区射门', '角球', '其中到达链', '其他角球', '加入前角球', '进球', '平均用时秒', '传中远射占比', '传中远射占三项'];
  SVL.forEach(x => head.push(svCol(x) + (x.pct ? '（按时间平均%）' : '（停留最久）')));
  head.push('简易模型·到达与选择', '简易模型·两个问题', '备注');
  const rows = [head];
  for (const m of list){
    for (const p of [1, 2]){
      if (!halfSpan(m, p)) continue;
      for (const i of [0, 1]){
        const r = statOf(m, i, 'h' + p), mins = minsOf(m, 'h' + p), d = avg(r.dt.filter(v => v <= DT_MAX));
        const row = [m.d, m.lg, m.h, m.a, i ? '客' : '主', i ? m.a : m.h, p === 1 ? '上' : '下', mins.toFixed(1), fullHalf(m, p) ? 1 : 0,
          r.ar, r.ch.x, r.ch.l, r.ch.m, r.ch.b, r.ch.g, r.none, r.io.x[0], r.io.x[1], r.io.l[0], r.io.l[1], r.bs, r.ck, r.ckc, r.cks.o, r.ckb, r.gl, d == null ? '' : d.toFixed(1), r.chosen ? ((r.ch.x + r.ch.l) / r.chosen).toFixed(3) : '',
          r.ch.x + r.ch.l + r.ch.m ? ((r.ch.x + r.ch.l) / (r.ch.x + r.ch.l + r.ch.m)).toFixed(3) : ''];
        for (const x of SVL){
          const s = stateSplit(m, i, x.f, 'h' + p);
          if (x.pct){ row.push(s.avg == null ? '' : s.avg.toFixed(1)); continue; }
          let best = -1, bm = 0;
          for (let v = 0; v < x.o.length; v++) if (s[v].mins > bm){ bm = s[v].mins; best = v; }
          row.push(best < 0 ? '' : x.o[best]);
        }
        // 这个半场里简易模型出现过的提醒（大角/小角，几分钟）
        for (const g of ['r', 'q']) row.push(alSum(m, i, p, g));
        row.push(p === 1 && i === 0 ? m.note : '');
        rows.push(row);
      }
    }
  }
  openSheet('export', { text: csvOf(rows), name: '角球到达_每队每半场_' + list.length + '场_' + new Date().toISOString().slice(0, 10) + '.csv', count: list.length, type: 'text/csv' });
}
/* 一队一个半场里，简易模型提醒“大角”“小角”各几分钟 */
function alSum(m, i, p, g){
  const sp = halfSpan(m, p); if (!sp) return '';
  const L = m.al.filter(a => a.g === g && a.i === i).sort((a, b) => a.p - b.p || a.t - b.t), dur = { b: 0, s: 0 };
  let v = '', t0 = sp[0];
  for (const a of L) if (a.p < p || (a.p === p && a.t <= sp[0])) v = a.v;
  for (const a of L){
    if (a.p !== p || a.t <= sp[0]) continue;
    const t1 = Math.min(a.t, sp[1]);
    if (v && t1 > t0) dur[v] += t1 - t0;
    t0 = Math.max(t0, t1); v = a.v;
  }
  if (v && sp[1] > t0) dur[v] += sp[1] - t0;
  const out = [];
  if (dur.b >= 30) out.push('大角 ' + Math.round(dur.b / 60) + ' 分钟');
  if (dur.s >= 30) out.push('小角 ' + Math.round(dur.s / 60) + ' 分钟');
  return out.join(' / ');
}
const markExported = () => LS.set('corner-reach-exported', nowSec());
function canShareFile(){
  try { return !!(navigator.canShare && window.File && navigator.canShare({ files: [new File(['x'], 'x.json', { type: 'application/json' })] })); } catch (e){ return false; }
}
function shareFile(){
  try {
    navigator.share({ files: [new File([sheetData.text], sheetData.name, { type: sheetData.type })] }).then(() => { markExported(); showToast('已送出文件'); }, e => { if (e && e.name !== 'AbortError') showToast('分享失败，请改用“复制文字”'); });
  } catch (e){ showToast('分享失败，请改用“复制文字”'); }
}
function downloadFile(){
  const url = URL.createObjectURL(new Blob([sheetData.text], { type: sheetData.type }));
  const a = document.createElement('a'); a.href = url; a.download = sheetData.name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000); markExported(); showToast('已开始下载；如果没有反应，请改用“复制文字”');
}
function copyText(){
  const ta = $('#expText');
  const fb = () => { ta.focus(); ta.select(); try { document.execCommand('copy'); markExported(); showToast('已复制'); } catch (e){ showToast('文字已全选，请手动复制'); } };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(sheetData.text).then(() => { markExported(); showToast('已复制到剪贴板'); }, fb); else fb();
}
function importText(txt){
  let o;
  try { o = JSON.parse(txt); } catch (e){ showToast('读不懂这段文字，请确认是完整的导出内容'); return; }
  if (!o || (o.fmt !== 1 && o.fmt !== 2) || o.app !== APPNAME || !Array.isArray(o.matches)){ showToast('这不是' + APPNAME + '的导出档'); return; }
  let n = 0;
  for (const r of o.matches){
    if (!r || !r.id || r.id === M.id) continue;
    // fmt 1 的主观选择是选项（fixMatch 会换成百分比），fmt 2 已经是百分比
    const m = fixMatch({ id: String(r.id), c: nowSec(), u: nowSec(), d: r.d, lg: r.lg, h: r.h, a: r.a, st: r.st, keep: r.keep, pe: r.pe, obs: r.obs, stop: r.stop, note: r.note,
      api: r.api, tm: null, ev: r.ev || [], sv: r.sv || [], pv: o.fmt === 2 ? 1 : 0, al: r.al || [], mc: r.mc || null });
    const last = m.ev[m.ev.length - 1];
    m.tm = m.stop ? { p: m.stop.p, b: m.stop.t, r: 0, at: 0, ht: 0 } : { p: last ? last.p : 1, b: last ? last.t : 0, r: 0, at: 0, ht: 0 };
    store[m.id] = m; n++;
  }
  LS.set(KEY, store); closeSheet(); renderAll();
  showToast('已导入 ' + n + ' 场');
}
$('#fileIn').addEventListener('change', ev => {
  const f = ev.target.files && ev.target.files[0]; if (!f) return;
  const rd = new FileReader(); rd.onload = () => importText(String(rd.result || '')); rd.readAsText(f); ev.target.value = '';
});
