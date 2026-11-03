const TEAM_ZH = ('阿森纳:Arsenal|切尔西:Chelsea|利物浦:Liverpool|曼联/曼彻斯特联:Manchester United/Man United|曼城/曼彻斯特城:Manchester City'
  + '|热刺/托特纳姆/托特纳姆热刺:Tottenham|纽卡斯尔/纽卡/纽卡斯尔联:Newcastle|阿斯顿维拉/维拉:Aston Villa|布莱顿:Brighton|西汉姆/西汉姆联:West Ham'
  + '|狼队/伍尔弗汉普顿:Wolves/Wolverhampton|埃弗顿:Everton|富勒姆:Fulham|布伦特福德:Brentford|水晶宫:Crystal Palace|诺丁汉森林/诺丁汉:Nottingham Forest'
  + '|伯恩茅斯:Bournemouth|莱斯特城/莱斯特:Leicester|利兹联/利兹:Leeds|南安普顿:Southampton|伯恩利:Burnley|桑德兰:Sunderland|伊普斯维奇/伊普斯维奇城:Ipswich'
  + '|谢菲尔德联/谢菲联:Sheffield Utd/Sheffield United|谢周三/谢菲尔德星期三:Sheffield Wednesday|卢顿/卢顿城:Luton|沃特福德:Watford|诺维奇/诺维奇城:Norwich'
  + '|赫尔城:Hull City|米德尔斯堡/米堡:Middlesbrough|斯托克城:Stoke City|西布朗/西布罗姆维奇:West Brom|考文垂/考文垂城:Coventry|布里斯托尔城:Bristol City'
  + '|卡迪夫城/卡迪夫:Cardiff|斯旺西:Swansea|女王公园巡游者:QPR|德比郡:Derby|普雷斯顿:Preston|米尔沃尔:Millwall|布莱克本:Blackburn|朴茨茅斯:Portsmouth'
  + '|牛津联:Oxford United|雷克瑟姆:Wrexham|普利茅斯:Plymouth'
  + '|皇马/皇家马德里:Real Madrid|巴萨/巴塞罗那:Barcelona|马竞/马德里竞技:Atletico Madrid|塞维利亚:Sevilla|皇家社会:Real Sociedad|比利亚雷亚尔/黄潜:Villarreal'
  + '|贝蒂斯/皇家贝蒂斯:Real Betis/Betis|毕尔巴鄂/毕尔巴鄂竞技:Athletic Club/Athletic Bilbao|瓦伦西亚:Valencia|塞尔塔:Celta Vigo|奥萨苏纳:Osasuna|赫塔费:Getafe'
  + '|赫罗纳:Girona|马略卡/马洛卡:Mallorca|巴列卡诺/巴列卡诺闪电:Rayo Vallecano|阿拉维斯:Alaves|拉斯帕尔马斯:Las Palmas|西班牙人:Espanyol|莱加内斯:Leganes'
  + '|巴拉多利德/皇家巴拉多利德:Valladolid|加的斯:Cadiz|格拉纳达:Granada|阿尔梅里亚:Almeria|莱万特:Levante|埃尔切:Elche|奥维耶多/皇家奥维耶多:Oviedo'
  + '|国米/国际米兰:Inter|AC米兰/米兰:AC Milan|尤文/尤文图斯:Juventus|那不勒斯:Napoli|罗马:AS Roma/Roma|拉齐奥:Lazio|亚特兰大:Atalanta'
  + '|佛罗伦萨/佛罗伦蒂娜:Fiorentina|博洛尼亚:Bologna|都灵:Torino|乌迪内斯:Udinese|热那亚:Genoa|萨索洛:Sassuolo|卡利亚里:Cagliari|莱切:Lecce'
  + '|维罗纳:Verona|恩波利:Empoli|蒙扎:Monza|帕尔马:Parma|科莫:Como|威尼斯:Venezia|克雷莫纳/克雷莫内塞:Cremonese|比萨:Pisa|桑普多利亚:Sampdoria'
  + '|萨勒尼塔纳:Salernitana|弗罗西诺内:Frosinone'
  + '|拜仁/拜仁慕尼黑:Bayern Munchen/Bayern Munich/Bayern|多特/多特蒙德:Borussia Dortmund/Dortmund|莱比锡/RB莱比锡:RB Leipzig/Leipzig'
  + '|勒沃库森/药厂:Bayer Leverkusen/Leverkusen|法兰克福:Eintracht Frankfurt/Frankfurt|斯图加特:Stuttgart|沃尔夫斯堡/狼堡:Wolfsburg'
  + '|门兴/门兴格拉德巴赫:Borussia Monchengladbach/Gladbach|弗赖堡:Freiburg|霍芬海姆:Hoffenheim|不莱梅/云达不莱梅:Werder Bremen|奥格斯堡:Augsburg'
  + '|柏林联合:Union Berlin|美因茨:Mainz|科隆:Koln/Cologne|海登海姆:Heidenheim|圣保利:St. Pauli|基尔/荷尔斯泰因基尔:Holstein Kiel|波鸿:Bochum'
  + '|汉堡:Hamburger SV/Hamburg|达姆施塔特:Darmstadt|沙尔克/沙尔克04:Schalke|柏林赫塔/赫塔:Hertha'
  + '|巴黎圣日耳曼/大巴黎/巴黎:Paris Saint Germain/PSG|马赛:Marseille|里昂:Lyon|摩纳哥:Monaco|里尔:Lille|尼斯:Nice|雷恩:Rennes|朗斯:Lens|南特:Nantes'
  + '|斯特拉斯堡:Strasbourg|蒙彼利埃:Montpellier|兰斯:Reims|图卢兹:Toulouse|布雷斯特:Brest/Stade Brestois|勒阿弗尔:Le Havre|欧塞尔:Auxerre|昂热:Angers'
  + '|圣埃蒂安:Saint Etienne|洛里昂:Lorient|梅斯:Metz|巴黎FC:Paris FC'
  + '|阿贾克斯:Ajax|埃因霍温/PSV:PSV Eindhoven/PSV|费耶诺德:Feyenoord|阿尔克马尔/AZ:AZ Alkmaar|特温特:Twente|乌德勒支:Utrecht'
  + '|本菲卡:Benfica|波尔图:Porto|葡萄牙体育/里斯本竞技:Sporting CP|布拉加:Braga|凯尔特人:Celtic|流浪者/格拉斯哥流浪者:Rangers'
  + '|加拉塔萨雷:Galatasaray|费内巴切:Fenerbahce|贝西克塔斯:Besiktas|布鲁日:Club Brugge|安德莱赫特:Anderlecht'
  + '|博德闪耀/博德格林特/博德:Bodo/Glimt|雅典AEK/AEK雅典/AEK:AEK Athens|奥林匹亚科斯:Olympiakos Piraeus/Olympiacos|帕纳辛奈科斯:Panathinaikos|PAOK/塞萨洛尼基:PAOK'
  + '|布拉格斯拉维亚/斯拉维亚:Slavia Praha/Slavia Prague|布拉格斯巴达/斯巴达:Sparta Praha|萨巴赫:Sabah|斯洛万/布拉迪斯拉发斯洛万:Slovan Bratislava|维京/维京人:Viking'
  + '|林茨/LASK:LASK|萨尔茨堡/萨尔茨堡红牛:Red Bull Salzburg/Salzburg|顿涅茨克矿工/矿工:Shakhtar Donetsk|基辅迪纳摩:Dynamo Kyiv|萨格勒布迪纳摩:Dinamo Zagreb'
  + '|贝尔格莱德红星/红星:Crvena Zvezda/Red Star Belgrade|年轻人/伯尔尼年轻人:Young Boys|哥本哈根:FC Copenhagen|中日德兰:Midtjylland|圣吉罗斯联合:Union St. Gilloise'
  + '|奈梅亨/NEC:NEC Nijmegen|阿拉木图凯拉特:Kairat|卡拉巴赫:Qarabag|塞尔维特:Servette|布雷斯特:Stade Brestois 29'
  + '|利雅得新月/新月:Al-Hilal|利雅得胜利/胜利:Al-Nassr|吉达联合:Al-Ittihad|吉达国民:Al-Ahli|迈阿密国际:Inter Miami|洛杉矶银河:LA Galaxy|洛杉矶FC:Los Angeles FC'
  + '|上海海港:Shanghai Port|上海申花:Shanghai Shenhua|山东泰山/山东鲁能:Shandong Taishan/Shandong Luneng|北京国安:Beijing Guoan|成都蓉城:Chengdu Rongcheng'
  + '|天津津门虎:Tianjin Jinmen Tiger|武汉三镇:Wuhan Three Towns|浙江/浙江队:Zhejiang|河南/河南队:Henan|长春亚泰:Changchun Yatai|青岛海牛:Qingdao Hainiu'
  + '|梅州客家:Meizhou Hakka|沧州雄狮:Cangzhou|深圳新鹏城:Shenzhen Peng City|青岛西海岸:Qingdao West Coast|大连英博:Dalian Yingbo|云南玉昆:Yunnan Yukun'
  + '|神户胜利船/神户:Vissel Kobe|横滨水手:Yokohama F. Marinos/Yokohama F-Marinos/Yokohama Marinos|川崎前锋/川崎:Kawasaki Frontale'
  + '|浦和红钻/浦和:Urawa/Urawa Red Diamonds/Urawa Reds|鹿岛鹿角/鹿岛:Kashima/Kashima Antlers|广岛三箭/广岛:Sanfrecce Hiroshima'
  + '|大阪钢巴/钢巴:Gamba Osaka|大阪樱花/樱花:Cerezo Osaka|东京FC/FC东京:FC Tokyo|名古屋鲸八/名古屋:Nagoya Grampus|柏太阳神/柏雷素尔:Kashiwa Reysol'
  + '|町田泽维亚/町田:Machida Zelvia|新潟天鹅:Albirex Niigata|札幌冈萨多:Consadole Sapporo/Hokkaido Consadole Sapporo|湘南比马:Shonan Bellmare'
  + '|福冈黄蜂/福冈:Avispa Fukuoka|京都不死鸟/京都:Kyoto Sanga/Kyoto Sanga FC|磐田喜悦:Jubilo Iwata|东京绿茵/绿茵:Tokyo Verdy|鸟栖砂岩:Sagan Tosu'
  + '|清水鼓动/清水:Shimizu S-Pulse|冈山绿雉/冈山:Fagiano Okayama|横滨FC:Yokohama FC|千叶/千叶市原/市原千叶:JEF United Chiba/JEF Utd Chiba/JEF United'
  + '|长崎航海/长崎:V-Varen Nagasaki|水户蜀葵/水户:Mito Hollyhock'
  + '|蔚山现代/蔚山:Ulsan|全北现代/全北:Jeonbuk|浦项制铁/浦项:Pohang|首尔FC:FC Seoul'
  + '|中国/中国队:China|日本/日本队:Japan|韩国/韩国队:South Korea|英格兰:England|法国:France|德国:Germany|西班牙:Spain|意大利:Italy|葡萄牙:Portugal'
  + '|荷兰:Netherlands|比利时:Belgium|巴西:Brazil|阿根廷:Argentina|克罗地亚:Croatia|澳大利亚:Australia|沙特/沙特阿拉伯:Saudi Arabia|伊朗:Iran|卡塔尔:Qatar'
  + '|美国:USA|墨西哥:Mexico|乌拉圭:Uruguay|哥伦比亚:Colombia|摩洛哥:Morocco|塞内加尔:Senegal|瑞士:Switzerland|丹麦:Denmark|奥地利:Austria|波兰:Poland|土耳其:Turkey')
  .split('|').map(x => { const [zh, en] = x.split(':'); return [zh.split('/'), en.split('/')]; });

/* ================= 联网（API-Football，跟“角球数据记录”同一套） =================
   只做一件事：帮你填好时间、比分、角球、红牌（中途加入、漏点的补上）。联网的数字不会混进到达和选择的统计。
   API key 默认用“角球数据记录”里的（同一个网址，读得到，不会改它的资料）。 */
const API_BASE = 'https://v3.football.api-sports.io';
const LIVE_ST = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE', 'INT', 'SUSP'];
const DONE_ST = ['FT', 'AET', 'PEN', 'AWD', 'WO'];
const ST_ZH = { TBD: '时间未定', NS: '未开赛', '1H': '上半场', HT: '中场休息', '2H': '下半场', ET: '加时', BT: '加时休息', P: '点球大战', SUSP: '暂停', INT: '中断', FT: '已完场', AET: '加时完场', PEN: '点球完场', PST: '延期', CANC: '取消', ABD: '腰斩', AWD: '判定胜负', WO: '弃权', LIVE: '进行中' };
const dayKey = d => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
const TZ = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (e){ return 'UTC'; } })();
const NET = Object.assign({ key: '', auto: true, iv: 0, used: {}, delay: null, quota: null }, LS.get('corner-reach-net', {}) || {});
if (!NET.ivSet) NET.iv = 0;   // 默认只在按“同步”时联网（省额度）；自己在设定里选过才会自动同步
const SBNET = LS.get('corner-sb-net', {}) || {}, SIXNET = LS.get('corner-six-net', {}) || {};   // 只读，不会改它们
const saveNet = () => LS.set('corner-reach-net', NET);
const otherKey = () => String(SBNET.key || '').trim() || String(SIXNET.key || '').trim();
const apiKey = () => (NET.key || '').trim() || (NET.nosb ? '' : otherKey());
const keyFromOther = () => !(NET.key || '').trim() && !NET.nosb && !!otherKey();
let ALIAS = Object.assign({}, LS.get('corner-sb-alias', {}) || {}, LS.get('corner-six-alias', {}) || {}, LS.get('corner-reach-alias', {}) || {});
const MYALIAS = LS.get('corner-reach-alias', {}) || {};
let netBusy = false, netList = { at: 0, list: [], day: false };

function apiGet(path){
  const key = apiKey();
  if (!key) return Promise.reject(new Error('还没有设定 API key'));
  if (navigator.onLine === false) return Promise.reject(new Error('现在没有网络'));
  if (path.indexOf('/status') !== 0){ const k = dayKey(new Date()); const u = {}; u[k] = ((NET.used || {})[k] || 0) + 1; NET.used = u; saveNet(); }
  return fetch(API_BASE + path, { headers: { 'x-apisports-key': key } }).then(r => {
    if (!r.ok) throw new Error('API-Football 回应错误 ' + r.status);
    return r.json();
  }, () => { throw new Error('连不上 API-Football（没有网络，或被浏览器拦截）'); }).then(j => {
    const er = j && j.errors;
    if (er && !Array.isArray(er) && Object.keys(er).length){
      if (er.token) throw new Error('API key 不对，请在“联网数据”里重新贴上');
      if (er.requests) throw new Error('今天的请求次数用完了');
      if (er.rateLimit) throw new Error('请求太快了，等一分钟再试');
      if (er.plan) throw new Error('免费方案查不到这些比赛（API 原文：' + er.plan + '）');
      throw new Error(Object.keys(er).map(k => er[k]).join('；'));
    }
    if (Array.isArray(er) && er.length) throw new Error(er.join('；'));
    return j.response;
  });
}

/* ---------- 队名比对：内置中文译名 → 英文，维基数据补查，加上你确认过的队名 ---------- */
const STOP = new Set(['fc', 'cf', 'afc', 'sc', 'ac', 'as', 'ss', 'us', 'club', 'de', 'calcio', 'cd', 'ud', 'sd', 'rc', 'sv', 'vfb', 'vfl', 'tsg', 'fk', 'sk', 'bk', 'if', 'ca', 'se', 'ec', '1', '04', '05', '1899']);
function normName(s){
  return String(s || '').replace(/\./g, '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ø/g, 'o').replace(/ß/g, 'ss').replace(/ı/g, 'i')
    .replace(/[^a-z0-9一-鿿぀-ヿ가-힯]+/g, ' ').trim();
}
const coreW = s => s.split(' ').filter(w => w && !STOP.has(w));
function bigr(s){ const t = s.replace(/ /g, ''); const a = []; for (let i = 0; i < t.length - 1; i++) a.push(t.slice(i, i + 2)); return a.length ? a : [t]; }
function sim(a, b){
  if (!a || !b) return 0;
  if (a === b) return 1;
  const ca = coreW(a), cb = coreW(b);
  if (ca.length && ca.join(' ') === cb.join(' ')) return 0.95;
  const s = ca.length <= cb.length ? ca : cb, l = ca.length <= cb.length ? cb : ca;
  if (s.length && s.some(w => w.length >= 3) && s.every(w => l.some(x => x.indexOf(w) === 0 || (w.indexOf(x) === 0 && x.length >= 3)))) return 0.85 * (0.75 + 0.25 * s.length / l.length);
  const ba = bigr(ca.join(' ') || a), bb = bigr(cb.join(' ') || b), m = new Map();
  for (const x of bb) m.set(x, (m.get(x) || 0) + 1);
  let hit = 0; for (const x of ba){ const c = m.get(x); if (c){ hit++; m.set(x, c - 1); } }
  return 0.8 * 2 * hit / (ba.length + bb.length);
}
const WDC = Object.assign({}, LS.get('corner-sb-wd', {}) || {}, LS.get('corner-six-wd', {}) || {}, LS.get('corner-reach-wd', {}) || {});
const MYWD = LS.get('corner-reach-wd', {}) || {};
function nameKeys(u){
  const raw = String(u || '').trim(), cn = raw.replace(/\s+/g, '').toUpperCase(), keys = new Set([normName(raw)]);
  for (const x of TEAM_ZH) if (x[0].some(z => z.toUpperCase() === cn)) x[1].forEach(e => keys.add(normName(e)));
  const w = WDC[normName(raw)];
  if (w) w.en.forEach(e => keys.add(normName(e)));
  return Array.from(keys).filter(Boolean);
}
const WD_API = 'https://www.wikidata.org/w/api.php';
const hasCJK = x => /[一-鿿]/.test(x);
const inDict = raw => { const cn = raw.replace(/\s+/g, '').toUpperCase(); return TEAM_ZH.some(x => x[0].some(z => z.toUpperCase() === cn)); };
function wdPrep(u){
  const raw = String(u || '').trim(), k = normName(raw);
  if (!raw || !hasCJK(raw) || ALIAS[k] || inDict(raw)) return Promise.resolve();
  const c = WDC[k];
  if (c && (c.en.length || nowSec() - c.t < 7 * 86400)) return Promise.resolve();
  const q = new URLSearchParams({ action: 'wbsearchentities', search: raw, language: 'zh', uselang: 'zh', type: 'item', limit: '12', format: 'json', origin: '*' });
  const FOOT = /足球|球会|球會|球队|球隊|俱乐部|俱樂部|football|soccer/i;
  return fetch(WD_API + '?' + q).then(r => r.json()).then(r => {
    const ids = ((r && r.search) || []).filter(x => FOOT.test((x.label || '') + ' ' + (x.description || ''))).slice(0, 3).map(x => x.id);
    if (!ids.length) return [];
    const q2 = new URLSearchParams({ action: 'wbgetentities', ids: ids.join('|'), props: 'labels|aliases', languages: 'en', format: 'json', origin: '*' });
    return fetch(WD_API + '?' + q2).then(x => x.json()).then(g => {
      const en = [];
      for (const id of ids){
        const e = g && g.entities && g.entities[id]; if (!e) continue;
        if (e.labels && e.labels.en) en.push(e.labels.en.value);
        for (const x of (e.aliases && e.aliases.en) || []) en.push(x.value);
      }
      return en;
    });
  }).then(en => {
    WDC[k] = MYWD[k] = { t: nowSec(), en: Array.from(new Set(en)).slice(0, 15) };
    LS.set('corner-reach-wd', MYWD);
  }).catch(() => {});
}
function teamSim(u, team){
  const a = ALIAS[normName(u)];
  if (a && a.id === team.id) return 1.2;
  const tn = normName(team.name);
  return Math.max.apply(null, [0].concat(nameKeys(u).map(k => sim(k, tn))));
}
function rankFixtures(list, h, a){
  const out = [];
  for (const f of list){
    if (!f || !f.teams || !f.fixture) continue;
    const H = f.teams.home, A = f.teams.away;
    const n = [teamSim(h, H), teamSim(a, A)], w = [teamSim(h, A), teamSim(a, H)];
    const sn = (n[0] + n[1]) / 2, sw = (w[0] + w[1]) / 2 * 0.95;
    const swp = sw > sn, sc = swp ? sw : sn, pair = swp ? w : n;
    if (Math.min(pair[0], pair[1]) >= 0.4 || Math.max(pair[0], pair[1]) >= 0.8) out.push({ f: f, score: sc, lo: Math.min(pair[0], pair[1]), sw: swp });
  }
  return out.sort((x, y) => y.score - x.score);
}
function rankOne(list, u){
  const out = [];
  for (const f of list){
    if (!f || !f.teams || !f.fixture) continue;
    const sh = teamSim(u, f.teams.home), sa = teamSim(u, f.teams.away), sc = Math.max(sh, sa);
    if (sc >= 0.6) out.push({ f: f, score: sc, lo: sc, sw: false, side: sh >= sa ? 'h' : 'a', live: LIVE_ST.indexOf((f.fixture.status || {}).short) >= 0 ? 1 : 0 });
  }
  return out.sort((x, y) => y.score - x.score || y.live - x.live || (x.f.fixture.timestamp || 0) - (y.f.fixture.timestamp || 0));
}
function zhOf(name){
  const k = normName(name);
  for (const x of TEAM_ZH) if (x[1].some(e => normName(e) === k)) return x[0][0];
  for (const x of TEAM_ZH) if (x[1].some(e => sim(normName(e), k) >= 0.9)) return x[0][0];
  return name;
}
const isSure = r => r.length > 0 && ((r[0].lo >= 0.9 && (r.length === 1 || r[1].score < r[0].score - 0.15)) || (r[0].lo >= 0.72 && r.filter(c => c.lo >= 0.5).length === 1));
const namesKey = () => M.h.trim() + '|' + M.a.trim();
function rankQuery(list, q){
  const k = normName(q);
  if (!k) return [];
  return list.map(f => { const x = Math.max(sim(k, normName(f.teams.home.name)), sim(k, normName(f.teams.away.name)), normName(f.teams.home.name + ' ' + f.teams.away.name).indexOf(k) >= 0 ? 0.9 : 0); return { f: f, score: x, lo: 0, sw: false }; })
    .filter(c => c.score >= 0.35).sort((x, y) => y.score - x.score);
}
function addDay(){
  if (netList.day) return Promise.resolve();
  return apiGet('/fixtures?date=' + dayKey(new Date()) + '&timezone=' + encodeURIComponent(TZ)).then(day => {
    const seen = new Set(netList.list.map(f => f.fixture.id));
    netList.list = netList.list.concat((day || []).filter(f => f && f.fixture && !seen.has(f.fixture.id))); netList.day = true;
  });
}
/* ---------- 查找这场比赛 ---------- */
function apiFind(manual){
  if (netBusy) return Promise.resolve();
  if (!apiKey()){ if (manual) openSheet('net'); return Promise.resolve(); }
  const h = M.h.trim(), a = M.a.trim();
  if (!h && !a){ if (manual) showToast('先输入球队名字（填一队就行）'); return Promise.resolve(); }
  netBusy = true; renderNet();
  const id = M.id;
  return Promise.all([wdPrep(h), wdPrep(a)]).then(() => {
    if (Date.now() - netList.at > 120000) return apiGet('/fixtures?live=all').then(l => { netList = { at: Date.now(), list: l || [], day: false }; });
  }).then(() => {
    if (!h || !a) return addDay().then(() => {
      if (M.id !== id) return;
      const r1 = rankOne(netList.list, h || a);
      if (r1.length) openSugg(r1.slice(0, 8), h ? 'h' : 'a');
      else { M.apiErr = '今天的比赛里没找到“' + (h || a) + '”'; if (manual) openSugg([]); }
    });
    let r = rankFixtures(netList.list, h, a);
    const go = () => {
      if (M.id !== id) return;
      if (isSure(r)){ netBusy = false; closeSugg(); return apiLink(r[0]); }
      if (r.length || manual) openSugg(r.slice(0, 8));
      else M.apiErr = '今天的比赛里没找到这两队，可以按“查找”手动选';
    };
    if (!isSure(r) && !netList.day) return addDay().then(() => { r = rankFixtures(netList.list, h, a); return go(); });
    return go();
  }).catch(e => {
    if (manual) showToast('联网查找失败：' + e.message); else M.apiErr = '联网查找失败：' + e.message;
  }).then(() => { netBusy = false; renderNet(); });
}
const sugg = $('#sugg');
let SG = null;
function fixWhen(f){
  const st = f.fixture.status || {};
  if (LIVE_ST.indexOf(st.short) >= 0) return (ST_ZH[st.short] || st.short) + (st.elapsed ? ' ' + st.elapsed + "'" : '');
  if (st.short === 'NS' || st.short === 'TBD'){ const t = new Date(f.fixture.date); return pad2(t.getHours()) + ':' + pad2(t.getMinutes()) + ' 开球'; }
  return ST_ZH[st.short] || st.short || '';
}
const suggList = () => SG.q ? rankQuery(netList.list, SG.q).slice(0, 8) : SG.cands;
const gStr = (g, k) => g[k] == null ? '' : g[k];
const suggItems = list => list.map((c, i) => { const f = c.f, g = f.goals || {}; return '<button data-sg="pick" data-i="' + i + '"><span class="t1">' + esc(f.teams.home.name) + ' <b>' + gStr(g, 'home') + (g.home != null ? '–' : 'vs') + gStr(g, 'away') + '</b> ' + esc(f.teams.away.name) + '</span>'
  + '<span class="t2">' + esc(f.league ? f.league.name : '') + '　' + fixWhen(f) + (c.sw ? '　<em>主客跟你输入的相反</em>' : '') + '</span></button>'; }).join('');
function openSugg(cands, one){ SG = { cands: cands, q: '', one: one || null }; renderSugg(); }
function closeSugg(){ SG = null; sugg.hidden = true; sugg.innerHTML = ''; }
function suggHint(list){
  if (!list.length) return '今天的比赛里没找到名字相近的，可以输入英文队名筛选。';
  if (SG && SG.one) return '“' + esc(M.h.trim() || M.a.trim()) + '”今天的比赛，点正确的那一场，另一队会自动填上。';
  return '点正确的那一场。确认后会记住这两个队名，下次自动对上。';
}
function renderSugg(){
  if (!SG){ closeSugg(); return; }
  const list = suggList();
  sugg.innerHTML = '<div class="sg-h"><b>是哪一场？</b><span id="sgHint">' + suggHint(list) + '</span><button data-sg="x">关闭</button></div>'
    + '<div class="picks" id="sgList">' + suggItems(list) + '</div>'
    + '<div class="sg-f"><input class="fi" id="sgQ" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="都不对？输入英文队名筛选，例如 Kashima" value="' + esc(SG.q) + '"><button class="pill" data-sg="none">都不是</button></div>';
  sugg.hidden = false;
}
sugg.addEventListener('input', ev => {
  if (ev.target.id !== 'sgQ' || !SG) return;
  SG.q = ev.target.value.trim();
  const list = suggList(); $('#sgList').innerHTML = suggItems(list); $('#sgHint').innerHTML = suggHint(list);
});
sugg.addEventListener('click', ev => {
  const b = ev.target.closest('[data-sg]'); if (!b || !SG) return;
  ev.stopPropagation();
  switch (b.dataset.sg){
    case 'x': closeSugg(); break;
    case 'none': M.apiNo = namesKey(); saveNow(); closeSugg(); renderNet(); showToast('这场先不连。之后要连，按底部的“查找”'); break;
    case 'pick': {
      const c = suggList()[+b.dataset.i]; if (!c) break;
      const H = c.f.teams.home, A = c.f.teams.away, one = M.h.trim() && M.a.trim() ? null : (M.h.trim() || M.a.trim());
      if (one){
        const side = c.side || (teamSim(one, H) >= teamSim(one, A) ? 'h' : 'a');
        M.h = side === 'h' ? one : zhOf(H.name); M.a = side === 'a' ? one : zhOf(A.name);
        c.sw = false; save(); renderAll();
      } else if (SG.q) c.sw = teamSim(M.a, H) + teamSim(M.h, A) > teamSim(M.h, H) + teamSim(M.a, A);
      closeSugg(); apiLink(c); break;
    }
  }
});
function apiLink(c){
  const f = c.f, H = f.teams.home, A = f.teams.away;
  M.api = { id: f.fixture.id, h: H.name, a: A.name, hid: H.id, aid: A.id, lg: f.league ? f.league.name : '', sw: c.sw ? 1 : 0, at: 0 };
  M.apiErr = null; M.apiNo = null;
  const mine = c.sw ? [A, H] : [H, A];
  [M.h, M.a].forEach((u, i) => { const k = normName(u); if (k){ ALIAS[k] = MYALIAS[k] = { id: mine[i].id, n: mine[i].name }; } });
  LS.set('corner-reach-alias', MYALIAS);
  if (!M.lg.trim() && M.api.lg) M.lg = M.api.lg;
  saveNow();
  netBusy = true; renderNet();
  return apiFetch(M).then(s => {
    netBusy = false;
    if (needJoin(s)) return openJoinFromApi(s);
    applySync(s);
    showToast('已连上：' + M.api.h + ' vs ' + M.api.a + '（' + (ST_ZH[s.st] || s.st) + '）' + (isRecording() ? '' : '，开球时按 ▶'));
  }).catch(e => { if (M.api){ M.api.err = e.message; } showToast('已连上，但读取资料失败：' + e.message); })
    .then(() => { netBusy = false; saveNow(); renderAll(); });
}
const isRecording = () => !!(M.ev.some(e => !e.b) || M.sv.length || M.tm.r || M.tm.b);
const ownEvents = () => M.ev.some(e => !e.b);
/* 联网的比赛在踢，但这场还没开始记录，或计时跟联网差太多又还没记任何事件（例如先按了 ▶ 才填队名）：当作中途加入 */
function needJoin(s){
  if (M.st !== 1 || LIVE_ST.indexOf(s.st) < 0) return false;
  if (!isRecording()) return true;
  if (ownEvents()) return false;
  const c = apiClock(s); if (!c) return false;
  // 两边放在同一条时间线上比（上半场补时算到 45:00 为止，中场休息＝45:00）；画面延迟一般不到 3 分钟
  const pos = (p, v, ht) => ht ? PER[1][1] : p === 1 ? Math.min(v, PER[1][1]) : v;
  const gap = pos(c.p, c.v, c.ht) - pos(M.tm.p, clockOf(M), M.tm.ht);
  return gap > 300 || gap < -150;
}
function parseFix(f, m){
  const sw = m.api.sw, ids = sw ? [f.teams.away.id, f.teams.home.id] : [f.teams.home.id, f.teams.away.id];
  const st = (f.fixture && f.fixture.status) || {};
  const gl = f.goals || {}, g = sw ? [gl.away, gl.home] : [gl.home, gl.away];
  const num = v => v == null ? null : (parseInt(v, 10) || 0);
  const raw = (arr, id, type) => { const t = (arr || []).find(x => x && x.team && x.team.id === id); if (!t) return undefined; const s = (t.statistics || []).find(x => x.type === type); return s ? s.value : null; };
  const stat = (arr, id, type) => { const v = raw(arr, id, type); if (v === undefined) return null; const n = num(v); return n == null ? 0 : n; };
  const has = Array.isArray(f.statistics) && f.statistics.length >= 2;
  const ck = has ? ids.map(id => stat(f.statistics, id, 'Corner Kicks')) : null;
  let rc = has ? ids.map(id => stat(f.statistics, id, 'Red Cards')) : null;
  if (!rc || rc.some(x => x == null)) rc = ids.map(id => (f.events || []).filter(e => e && e.type === 'Card' && e.team && e.team.id === id && /red|second yellow/i.test(e.detail || '')).length);
  const sv = (id, type) => stat(f.statistics, id, type) || 0;
  const sh = has ? ids.map(id => { const on = sv(id, 'Shots on Goal'), off = sv(id, 'Shots off Goal'), b = sv(id, 'Blocked Shots'), tot = stat(f.statistics, id, 'Total Shots'); return { t: tot != null && tot > 0 ? tot : on + off + b, b: b, on: on }; }) : null;
  const pos = has ? ids.map(id => { const v = raw(f.statistics, id, 'Ball Possession'); const n = v == null ? NaN : parseFloat(String(v)); return isFinite(n) ? n : null; }) : null;
  const per = f.fixture && f.fixture.periods ? { first: num(f.fixture.periods.first), second: num(f.fixture.periods.second) } : null;
  return { st: st.short || '', el: num(st.elapsed) || 0, ex: num(st.extra) || 0, g: g.map(x => num(x) || 0), ck: ck && ck.every(x => x != null) ? ck : null, rc: rc, sh: sh,
    pos: pos && pos.every(x => x != null) ? pos : null, per: per, ko: (f.fixture && f.fixture.timestamp) || null, at: nowSec() };
}
function apiFetch(m){
  return apiGet('/fixtures?id=' + m.api.id).then(res => {
    const f = res && res[0];
    if (!f) throw new Error('找不到这场比赛的资料');
    const s = parseFix(f, m);
    if ((!s.ck || !s.sh) && (LIVE_ST.indexOf(s.st) >= 0 || DONE_ST.indexOf(s.st) >= 0)){
      return apiGet('/fixtures/statistics?fixture=' + m.api.id).then(st => {
        const t = parseFix(Object.assign({}, f, { statistics: st }), m);
        s.ck = s.ck || t.ck; s.sh = s.sh || t.sh; s.pos = s.pos || t.pos;
        return s;
      });
    }
    return s;
  });
}
/* 上半场各几个角球（API 有分半场的统计才有） */
function apiHalf(m){
  return apiGet('/fixtures/statistics?fixture=' + m.api.id + '&half=true').then(res => {
    const ids = m.api.sw ? [m.api.aid, m.api.hid] : [m.api.hid, m.api.aid];
    const out = ids.map(id => {
      const t = (res || []).find(x => x && x.team && x.team.id === id);
      const arr = t && (t.statistics_1h || t.statistics_first_half);
      if (!Array.isArray(arr)) return null;
      const s = arr.find(x => x.type === 'Corner Kicks');
      return s ? (parseInt(s.value, 10) || 0) : 0;
    });
    return out.every(x => x != null) ? out : null;
  });
}
/* 开球时间戳跟“第几分钟”对得上才用（有的比赛给的是排定时间） */
function perFits(s, p){
  const per = s.per || {}, ps = p === 1 ? per.first : per.second;
  if (!ps || !s.el || s.st !== (p === 1 ? '1H' : '2H')) return null;
  const at = s.at || nowSec(), v = (p === 1 ? 0 : PER[2][0]) + at - ps, est = (s.el + (s.ex || 0) - 1) * 60 + 30;
  return Math.abs(v - est) <= 100 || (s.el >= (p === 1 ? 45 : 90) && v > est && v - est < 900);
}
/* 联网的实时比赛时间 */
function apiClock(s, now){
  now = now == null ? nowSec() : now;
  const per = s.per || {}, gone = Math.max(0, now - (s.at || now));
  if (s.st === '1H' && per.first && now - per.first > 0 && now - per.first < 4500 && perFits(s, 1) !== false) return { p: 1, v: clamp(now - per.first, 0, TPR[1][1]), exact: true };
  if (s.st === '2H' && per.second && now - per.second > 0 && now - per.second < 4500 && perFits(s, 2) !== false) return { p: 2, v: clamp(PER[2][0] + now - per.second, PER[2][0], TPR[2][1]), exact: true };
  const mm = s.el + (s.ex || 0);
  if (s.st === '1H') return { p: 1, v: clamp((mm - 1) * 60 + 30 + gone, 0, TPR[1][1]) };
  if (s.st === '2H') return { p: 2, v: clamp((mm - 1) * 60 + 30 + gone, PER[2][0], TPR[2][1]) };
  if (s.st === 'HT') return { p: 1, v: PER[1][1], ht: true };
  return null;
}
/* 画面延迟：你看的画面比实时慢几秒（开球、中途加入、对时的时候测，存在这台设备上） */
function fmtDelay(sec){ sec = Math.round(Math.abs(sec)); return sec >= 60 ? Math.floor(sec / 60) + ' 分 ' + pad2(sec % 60) + ' 秒' : sec + ' 秒'; }
const myDelay = () => M.api && M.api.dl != null ? M.api.dl : NET.delay != null ? NET.delay : NET.dl0 ? null : SBNET.delay != null ? SBNET.delay : SIXNET.delay != null ? SIXNET.delay : null;
const delayNote = d => d == null ? '' : d < 10 ? '，你的画面跟联网实时差不多' : '，你的画面比联网实时慢 ' + fmtDelay(d);
function learnDelay(appSec, why){
  const a = M.api;
  if (!a || !a.st || nowSec() - (a.at || 0) > 900) return null;
  const r = apiClock(a);
  if (!r || r.ht || r.p !== curP()) return null;
  if (!r.exact && why === 'kick') return null;
  let d = Math.round(r.v - appSec);
  if (d < -45 || d > 900) return null;
  if (!r.exact && d < 30) d = 0;
  a.dl = Math.max(0, d); NET.delay = a.dl; saveNet();
  return a.dl;
}
function delayFromKick(){
  const a = M.api;
  if (!a || !a.per || !M.kw) return null;
  let got = null;
  for (const p of [1, 2]){
    const ps = p === 1 ? a.per.first : a.per.second, kw = M.kw[p];
    if (!ps || !kw || a.dlk === p || !(a.pok && a.pok[p])) continue;
    const d = kw - ps;
    if (d >= 0 && d <= 180){ a.dl = Math.round(d); a.dlk = p; NET.delay = a.dl; saveNet(); got = a.dl; }
  }
  return got;
}
/* 你记录的数字：其他角球＋到达链里的角球、补录和到达链里的进球 */
function curCounts(){
  const a = statOf(M, 0, 'h1'), b = statOf(M, 1, 'h1'), c = statOf(M, 0, 'h2'), d = statOf(M, 1, 'h2');
  return { sc: [a.gl + c.gl, b.gl + d.gl], rc: [a.rc + c.rc, b.rc + d.rc], ck1: [a.ck, b.ck], ck2: [c.ck, d.ck], ft: [a.ck + c.ck, b.ck + d.ck] };
}
const NETL = { ck: '角球', gl: '进球', rc: '红牌' };
/* 中途加入：按联网的时间（扣掉你上次测出的画面延迟）、比分、角球、红牌填好 */
function openJoinFromApi(s){
  const c = apiClock(s);
  const need1h = s.ck && c && c.p === 2;
  return (need1h ? apiHalf(M).catch(() => null) : Promise.resolve(null)).then(ck1 => {
    if (ck1) M.api.ck1 = ck1.slice();
    const dl = myDelay() || 0;
    const tp = c ? { p: c.p, v: c.ht ? c.v : clamp(Math.round((c.v - dl) / 5) * 5, TPR[c.p][0], TPR[c.p][1]), live: !c.ht, at: Date.now() } : { p: 1, v: 20 * 60, live: true, at: Date.now() };
    const d = { tp: tp, sc: s.g.slice(), rc: s.rc.slice(), net: true, ht: !!(c && c.ht), real: !!(c && !c.ht), dl: myDelay() };
    if (s.ck){ d.ft = s.ck.slice(); d.ck1 = c && c.p === 2 ? (ck1 || s.ck.slice()) : s.ck.slice(); d.lk = !!(c && c.p === 2 && !ck1); }
    else { d.ft = [0, 0]; d.ck1 = [0, 0]; d.lk = true; d.nock = true; }
    applySnap(s);
    openSheet('join', d);
  });
}
/* 功能 → 中途加入（已连上、还没记任何事件）：直接用联网的资料填 */
function joinFromNet(){
  if (netBusy) return;
  netBusy = true; renderNet();
  apiFetch(M).then(s => {
    netBusy = false;
    if (LIVE_ST.indexOf(s.st) >= 0) return openJoinFromApi(s);
    applySnap(s); saveNow(); renderAll(); openJoin();
  }).catch(e => { netBusy = false; showToast('联网读取失败，请手动填：' + e.message); openJoin(); })
    .then(() => { netBusy = false; renderNet(); });
}
function openJoin(){
  const c = curCounts();
  openSheet('join', { tp: { p: 1, v: 20 * 60, live: true, at: Date.now() }, sc: c.sc.slice(), rc: c.rc.slice(), ck1: c.ck1.slice(), ft: c.ft.slice(), lk: true });
}
function applyJoin(d){
  const p = d.ht ? 1 : d.tp.p, v = d.ht ? PER[1][1] : tpNow(d.tp);
  M.ev = M.ev.filter(e => !e.b);
  const base = curCounts();
  const addB = (n, c, ep, i) => { for (let k = 0; k < n; k++) M.ev.push({ t: PER[ep][0], p: ep, i: i, c: c, b: 1, k: ++seq }); };
  for (const i of [0, 1]){
    let h1 = d.ck1[i], h2 = base.ck2[i];
    if (d.tp.p === 2 || d.ht){ h1 = d.lk ? Math.max(base.ck1[i], d.ft[i] - base.ck2[i]) : d.ck1[i]; h2 = d.ft[i] - h1; }
    addB(Math.max(0, d.sc[i] - base.sc[i]), 'gl', 1, i);
    addB(Math.max(0, d.rc[i] - base.rc[i]), 'rc', 1, i);
    addB(Math.max(0, h1 - base.ck1[i]), 'ck', 1, i);
    addB(Math.max(0, h2 - base.ck2[i]), 'ck', 2, i);
  }
  M.obs = { p: p, t: v };
  M.tm = { p: p, b: v, r: d.ht ? 0 : 1, at: Date.now(), ht: 0 };
  M.st = 1; M.stop = null;
  M.kw = null;   // 之前按 ▶ 的时间不是这场的开球，不能拿来测画面延迟
  if (d.ht){ M.pe[1] = PER[1][1]; M.tm.ht = 1; }
  sortEv(M); saveNow();
}
function applySnap(s){
  const a = M.api; a.at = s.at || nowSec(); a.st = s.st; a.el = s.el; a.ex = s.ex; a.g = s.g; a.rc = s.rc; a.err = null; if (s.ko) a.ko = s.ko;
  let dl = null;
  if (s.per){
    a.per = s.per;
    for (const p of [1, 2]){ const f = perFits(s, p); if (f != null){ a.pok = a.pok || {}; a.pok[p] = f; } }
    dl = delayFromKick();
  }
  if (s.ck) a.ck = s.ck;
  if (s.sh) a.sh = s.sh;
  if (s.pos) a.pos = s.pos;
  if (s.st === 'HT' && s.ck && !a.ck1) a.ck1 = s.ck.slice();
  if (!M.h.trim() || !M.a.trim()){ const nm = a.sw ? [a.a, a.h] : [a.h, a.a]; if (!M.h.trim()) M.h = zhOf(nm[0]); if (!M.a.trim()) M.a = zhOf(nm[1]); }
  if (DONE_ST.indexOf(s.st) >= 0) a.fin = 1;
  return dl;
}
/* 同步：联网的角球、进球、红牌比你记录的多，就等画面追上（画面延迟＋30 秒）后补上你还没点的（标“联网”） */
const holdWait = () => clamp((myDelay() == null ? 60 : myDelay()) + 30, 20, 600);
function missingFrom(s){
  const cur = curCounts(), out = [];
  for (const i of [0, 1]){
    if (s.ck) out.push(['ck', s.ck[i] - cur.ft[i], i]);
    out.push(['gl', s.g[i] - cur.sc[i], i]);
    out.push(['rc', (s.rc[i] || 0) - cur.rc[i], i]);
  }
  return out.filter(x => x[1] > 0);
}
function commitHold(s){
  const a = M.api, added = {};
  if (!(M.st === 1 && isRecording())) return added;
  const miss = missingFrom(s);
  if (!miss.length) return added;
  const ht = !!M.tm.ht, p = curP(), clk = ht ? (M.pe[1] || PER[1][1]) : Math.floor(clockOf(M));
  const now = ht ? clk : Math.max(PER[p][0], clk - 30);
  const o = M.obs || { p: 1, t: 0 };
  let from = a.cp === p && a.ct != null && a.ct <= now ? a.ct : now - 120;
  from = Math.max(from, PER[p][0], o.p === p ? o.t : PER[p][0]);
  for (const x of miss){
    const c = x[0], n = x[1], i = x[2];
    for (let k = 0; k < n; k++) M.ev.push({ t: ht ? now : Math.round(from + (now - from) * (k + 1) / (n + 1)), p: p, i: i, c: c, a: 1, k: ++seq });
    const key = teamName(i) + ' ' + NETL[c]; added[key] = (added[key] || 0) + n;
  }
  sortEv(M);
  a.ct = now; a.cp = p;
  return added;
}
function addedMsg(added){ const m = Object.keys(added).map(k => k + ' ' + added[k]); if (m.length) showToast('联网同步补上：' + m.join('，')); }
function flushHold(force){
  const a = M.api;
  if (!a || !a.hold || !a.hold.length) return;
  const appP = curP();
  const due = a.hold.filter(h => force || (nowSec() >= h.due && !(h.p === 2 && (appP === 1 || M.tm.ht))));
  if (!due.length) return;
  a.hold = a.hold.filter(h => due.indexOf(h) < 0);
  const added = {};
  for (const h of due){ const x = commitHold(h.s); for (const k in x) added[k] = (added[k] || 0) + x[k]; }
  saveNow(); renderAll(); addedMsg(added);
}
/* 你自己点了角球或进球：跟最近联网补上的那笔合并，不会多算 */
function mergeAuto(i, kind){
  const codes = kind === 'ck' ? ['ck'] : ['gl'], win = kind === 'ck' ? 240 : 360, s = nowStamp();
  let pick = null;
  for (const e of M.ev) if (e.a && e.i === i && codes.indexOf(e.c) >= 0 && e.p === s.p && s.t - e.t <= win && (!pick || e.k > pick.k)) pick = e;
  if (!pick) return false;
  M.ev.splice(M.ev.indexOf(pick), 1); save();
  return true;
}
function applySync(s, manual){
  const dl = applySnap(s);
  const a = M.api;
  let shown = false;
  const noCk = !s.ck && LIVE_ST.indexOf(s.st) >= 0 ? '。这场联网没有角球统计，角球要自己点' : '';
  if (M.st === 1 && isRecording() && !needJoin(s)){
    const miss = missingFrom(s);
    if (miss.length){
      const wait = holdWait(), c = apiClock(s), hp = c ? c.p : null;
      const later = hp === 2 && (!!M.tm.ht || M.tm.p === 1);
      a.hold = (a.hold || []).concat([{ due: nowSec() + wait, p: hp, s: { ck: s.ck, g: s.g, rc: s.rc } }]).slice(-4);
      if (manual){
        const what = miss.map(x => teamName(x[2]) + ' ' + NETL[x[0]] + ' ' + x[1]).join('，');
        showToast(later ? '联网已经是下半场，比你多：' + what + '。你按“下半场开球”后，等画面追上，还没点的会自动补上'
          : '联网比你多：' + what + '。等画面追上（约 ' + fmtDelay(wait) + '），还没点的会自动补上' + noCk + delayNote(dl));
        shown = true;
      }
    } else if (manual){ showToast('已同步：' + (s.ck ? '角球 ' + s.ck[0] + '–' + s.ck[1] + '，跟你记录的一样' : '比分 ' + s.g[0] + '–' + s.g[1]) + noCk + delayNote(dl)); shown = true; }
  }
  if (dl != null && !shown) showToast('按开球时间测出' + delayNote(dl).slice(1));
  saveNow(); renderAll();
  if (DONE_ST.indexOf(s.st) >= 0 && M.st === 1 && !a.done){
    a.done = 1; save();
    showToast('联网数据显示比赛已经结束', () => openSheet('finish'), '结束这场', 15000);
  }
}
function apiSync(manual){
  if (!M.api || netBusy) return Promise.resolve();
  netBusy = true; renderNet();
  const id = M.id;
  return apiFetch(M).then(s => {
    netBusy = false;
    if (M.id !== id) return;
    if (needJoin(s)){
      if (manual) return openJoinFromApi(s);
      applySnap(s); saveNow(); renderAll(); return;
    }
    applySync(s, manual);
    if (manual && M.st === 1 && !isRecording() && DONE_ST.indexOf(s.st) < 0){
      const t = M.api && M.api.ko ? new Date(M.api.ko * 1000).toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' }) + ' 开球，' : '';
      showToast('联网：' + (ST_ZH[s.st] || s.st) + '。' + t + '开球时按 ▶');
    }
  }).catch(e => {
    netBusy = false;
    if (M.api){ M.api.err = e.message; M.api.at = nowSec(); save(); }
    if (manual) showToast('同步失败：' + e.message);
  }).then(() => { netBusy = false; renderNet(); });
}
let findT = 0;
function scheduleFind(delay){
  clearTimeout(findT);
  if (!apiKey() || !NET.auto || M.api || M.st !== 1 || (!M.h.trim() && !M.a.trim()) || M.apiNo === namesKey()) return;
  findT = setTimeout(() => { if (!sheet.hidden) return; apiFind(false); }, delay == null ? 2500 : delay);
}
function syncState(){
  if (!apiKey()) return { k: 'set', l: '联网', s: '未设定' };
  const a = M.api;
  if (!a) return { k: 'find', l: '查找', s: netBusy ? '查找中…' : M.h.trim() || M.a.trim() ? '未连上' : '先填队名' };
  if (netBusy) return { k: 'busy', l: '同步', s: '同步中…' };
  if (M.st === 1 && DONE_ST.indexOf(a.st) >= 0) return { k: 'fin', l: '结束', s: '已完场', alert: true };
  if (M.st === 1 && !a.err){
    if (a.st && needJoin(a)) return { k: 'join', l: '加入', s: a.ck ? '联网 ' + a.ck[0] + '–' + a.ck[1] : (ST_ZH[a.st] || a.st) + (a.el ? ' ' + a.el + "'" : ''), alert: true };
    if (!isRecording() && (a.st === 'NS' || a.st === 'TBD')) return { k: 'sync', l: '同步', s: '未开赛' };
  }
  const rec = curCounts().ft, on = LIVE_ST.indexOf(a.st) >= 0 || DONE_ST.indexOf(a.st) >= 0;
  const ago = a.at ? Math.max(0, Math.round((nowSec() - a.at) / 60)) : null;
  if (a.err) return { k: 'sync', l: '同步', s: '上次失败', alert: true };
  if (on && a.ck && (a.ck[0] !== rec[0] || a.ck[1] !== rec[1])) return { k: 'sync', l: '同步', s: '联网 ' + a.ck[0] + '–' + a.ck[1], alert: true };
  return { k: 'sync', l: '同步', s: ago == null ? '还没同步' : ago ? ago + ' 分钟前' : '刚刚' };
}
function quickSync(){
  const ss = syncState();
  if (ss.k === 'set'){ openSheet('net'); return; }
  if (ss.k === 'find'){ if (M.h.trim() || M.a.trim()){ M.apiNo = null; apiFind(true); } else showToast('先在上方输入球队名字，才能联网找这场比赛'); return; }
  if (ss.k === 'fin'){ openSheet('finish'); return; }
  if (ss.k === 'busy') return;
  apiSync(true);
}
function renderNet(){
  const ss = syncState(), sb = $('#qbSync');
  if (sb){
    sb.className = 'qb' + (ss.alert ? ' alert' : '');
    sb.disabled = ss.k === 'busy';
    sb.innerHTML = IC.sync + '<span>' + ss.l + '</span><small>' + esc(ss.s) + '</small>' + (ss.alert ? '<i class="dot"></i>' : '');
    sb.setAttribute('aria-label', ss.l + '：' + ss.s);
  }
  const pill = $('#netPill');
  if (pill){
    if (!apiKey() && !M.api){ pill.hidden = true; }
    else {
      pill.hidden = false;
      const a = M.api;
      let txt = '联网', cls = 'off';
      if (netBusy){ txt = M.api ? '同步中…' : '查找中…'; cls = ''; }
      else if (a && a.err){ txt = '同步失败'; cls = 'bad'; }
      else if (a && a.st){ txt = (ST_ZH[a.st] || a.st) + (a.el && LIVE_ST.indexOf(a.st) >= 0 ? ' ' + a.el + "'" : '') + (a.ck ? ' · 角球 ' + a.ck[0] + '–' + a.ck[1] : ''); cls = ''; }
      else if (a) { txt = '已连上'; cls = ''; }
      else txt = M.apiErr ? '没找到这场' : '联网 · 未连上';
      pill.className = 'netpill ' + cls;
      pill.innerHTML = '<i></i><span>' + esc(txt) + '</span>';
    }
  }
}
