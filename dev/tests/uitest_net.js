// Online sync against a mocked API-Football and Wikidata: key reused from the corner-sb app, Chinese team names,
// mid-match join prefilled from the API, synced corners held until the screen catches up, corners and goals from
// the arrival chain counting as yours (no doubles), merging, manual sync by default, full time, export.
// Usage: node uitest_net.js <base_url> <out_dir>
const { chromium } = require(process.env.PLAYWRIGHT || '/opt/node-tools/node_modules/playwright');
const [base, out] = process.argv.slice(2);
let fails = 0;
const check = (cond, msg) => { console.log((cond ? 'ok   ' : 'FAIL ') + msg); if (!cond) fails++; };

const T = { 293: 'Kashima', 294: 'Yokohama F. Marinos', 296: 'Urawa', 300: 'Gamba Osaka', 600: 'Wolfsberger AC', 601: 'Red Bull Salzburg', 40: 'Liverpool', 49: 'Chelsea' };
let FX;
const KO = Date.parse('2026-10-27T10:00:00Z') / 1000;   // first-half kick-off (real time)
function fresh(){
  FX = {
    2001: { lg: 'J1 League', h: 293, a: 294, st: '2H', el: 67, g: [1, 0], ck: [6, 3], ck1: [4, 2], rc: [0, 0], sh: [[12, 3, 5], [5, 1, 2]], pos: [58, 42], per: [KO, KO + 3600] },
    2002: { lg: 'J1 League', h: 296, a: 300, st: '1H', el: 20, g: [0, 0], ck: [2, 1], rc: [0, 0], sh: [[4, 1, 1], [3, 0, 1]], pos: [51, 49], per: [KO + 1200, null] },
    2003: { lg: 'Bundesliga', h: 600, a: 601, st: '1H', el: 30, g: [0, 1], ck: [2, 4], rc: [0, 0], sh: [[3, 1, 1], [6, 2, 3]], pos: [40, 60], per: [KO, null] },
    2004: { lg: 'Premier League', h: 49, a: 40, st: 'NS', el: null, g: [null, null], ck: [0, 0], rc: [0, 0], sh: [[0, 0, 0], [0, 0, 0]], pos: [50, 50], per: [null, null] },
  };
}
const calls = [];
function fx(id){ const x = FX[id]; return { fixture: { id, date: '2026-10-27T10:00:00+00:00', timestamp: KO, periods: { first: x.per[0], second: x.per[1] }, status: { short: x.st, elapsed: x.el, extra: null } }, league: { name: x.lg }, teams: { home: { id: x.h, name: T[x.h] }, away: { id: x.a, name: T[x.a] } }, goals: { home: x.g[0], away: x.g[1] } }; }
function detail(id){
  const x = FX[id], b = fx(id);
  b.statistics = x.st === 'NS' ? [] : [x.h, x.a].map((t, j) => ({ team: { id: t, name: T[t] }, statistics: [
    { type: 'Shots on Goal', value: x.sh[j][2] }, { type: 'Shots off Goal', value: x.sh[j][0] - x.sh[j][1] - x.sh[j][2] }, { type: 'Total Shots', value: x.sh[j][0] },
    { type: 'Blocked Shots', value: x.sh[j][1] }, { type: 'Corner Kicks', value: x.ck[j] || null }, { type: 'Ball Possession', value: x.pos[j] + '%' }, { type: 'Red Cards', value: x.rc[j] || null }] }));
  b.events = [];
  return b;
}
function halfStats(id){ const x = FX[id]; return [x.h, x.a].map((t, j) => ({ team: { id: t }, statistics: [{ type: 'Corner Kicks', value: x.ck[j] }], statistics_1h: x.ck1 ? [{ type: 'Corner Kicks', value: x.ck1[j] }] : undefined })); }
const WD = { '沃尔夫斯贝格': [['Q1', '沃尔夫斯贝格足球俱乐部', '奥地利足球俱乐部'], ['Q2', '沃尔夫斯贝格', '奥地利城镇']], '萨尔茨堡红牛': [['Q3', '萨尔茨堡红牛足球俱乐部', '奥地利足球俱乐部']] };
const WDE = { Q1: ['Wolfsberger AC', ['WAC']], Q2: ['Wolfsberg', []], Q3: ['FC Red Bull Salzburg', ['Red Bull Salzburg', 'RB Salzburg']] };
async function mock(ctx){
  await ctx.route('https://www.wikidata.org/**', async route => {
    const u = new URL(route.request().url());
    const headers = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
    let body;
    if (u.searchParams.get('action') === 'wbsearchentities') body = { search: (WD[u.searchParams.get('search')] || []).map(([id, label, description]) => ({ id, label, description })) };
    else { const ents = {}; for (const id of u.searchParams.get('ids').split('|')) if (WDE[id]) ents[id] = { id, labels: { en: { language: 'en', value: WDE[id][0] } }, aliases: { en: WDE[id][1].map(v => ({ language: 'en', value: v })) } }; body = { entities: ents }; }
    return route.fulfill({ status: 200, headers, body: JSON.stringify(body) });
  });
  await ctx.route('https://v3.football.api-sports.io/**', async route => {
    const req = route.request(), u = new URL(req.url());
    const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    calls.push(u.pathname + u.search);
    let body;
    if (req.headers()['x-apisports-key'] !== 'SBKEY') body = { errors: { token: 'Error/Missing application key.' }, response: [] };
    else if (u.pathname === '/status') body = { errors: [], response: { subscription: { plan: 'Free', active: true }, requests: { current: 12, limit_day: 100 } } };
    else if (u.pathname === '/fixtures' && u.searchParams.get('live')) body = { errors: [], response: Object.keys(FX).filter(k => ['1H', '2H', 'HT'].includes(FX[k].st)).map(k => fx(+k)) };
    else if (u.pathname === '/fixtures' && u.searchParams.get('date')) body = { errors: [], response: Object.keys(FX).map(k => fx(+k)) };
    else if (u.pathname === '/fixtures' && u.searchParams.get('id')) body = { errors: [], response: [detail(+u.searchParams.get('id'))] };
    else if (u.pathname === '/fixtures/statistics') body = { errors: [], response: u.searchParams.get('half') ? halfStats(+u.searchParams.get('fixture')) : detail(+u.searchParams.get('fixture')).statistics };
    else body = { errors: { bad: 'unknown endpoint' }, response: [] };
    return route.fulfill({ status: 200, headers, body: JSON.stringify(body) });
  });
}
async function page(b, w, h, mob, nowIso, sixNet){
  fresh(); calls.length = 0;
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: mob, hasTouch: mob, serviceWorkers: 'block' });
  await mock(ctx);
  // settings this app saved earlier on the device (e.g. by v2, whose default was auto sync every 3 minutes)
  if (sixNet) await ctx.addInitScript(n => { if (!localStorage.getItem('corner-reach-net')) localStorage.setItem('corner-reach-net', JSON.stringify(n)); }, sixNet);
  await ctx.addInitScript(() => { if (!localStorage.getItem('corner-sb-net')) localStorage.setItem('corner-sb-net', JSON.stringify({ key: 'SBKEY', delay: 40, auto: true })); });
  const p = await ctx.newPage();
  p.errs = [];
  p.on('pageerror', e => p.errs.push('pageerror ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) p.errs.push('console ' + m.text()); });
  await p.clock.install({ time: new Date(nowIso) });
  await p.goto(base + '/index.html');
  return { ctx, p };
}
const S = (p, fn, arg) => p.evaluate(fn, arg);
// press 同步 and wait until the request is back (the button is disabled while it runs)
async function sync(p){
  await p.click('#qbSync');
  await p.waitForFunction(() => !document.querySelector('#qbSync').disabled, null, { timeout: 15000 });
  await p.clock.runFor(300);
}

const tapAr = (p, i) => p.click('.pad[data-i="' + i + '"] [data-a="ar"]');
async function chain(p, i, path){ await tapAr(p, i); await p.clock.runFor(1500); for (const c of path){ await p.click('.pad[data-i="' + i + '"] [data-a="pick"][data-v="' + c + '"]'); await p.clock.runFor(300); } await p.clock.runFor(600); }
const corners = p => S(p, () => { const M = window.__reach.M, R = window.__reach; return { all: [0, 1].map(i => R.statOf(M, i, 'ft').ck), auto: M.ev.filter(e => e.c === 'ck' && e.a).length, back: M.ev.filter(e => e.c === 'ck' && e.b).length }; });

(async () => {
  const b = await chromium.launch();
  // ---------- A. phone: join at 67' from Chinese names, sync, chain corners count as yours ----------
  let { ctx, p } = await page(b, 390, 763, true, new Date((KO + 3600 + 22 * 60) * 1000).toISOString());
  check((await p.textContent('#qbSync')).indexOf('查找') >= 0, 'key reused from the corner-sb app: the sync button offers 查找');
  await p.fill('#fH', '鹿岛鹿角'); await p.fill('#fA', '横滨水手');
  await p.clock.runFor(3000);
  await p.waitForSelector('#card [data-a="jgo"]', { timeout: 5000 });
  const jtxt = await p.textContent('#card');
  check(jtxt.indexOf('已用联网数据填好') >= 0 && jtxt.indexOf('慢 40 秒') >= 0, 'auto-find matched the Chinese names; join sheet prefilled, clock pulled back by the 40-second delay');
  await p.screenshot({ path: `${out}/net_join.png` });
  await p.click('#card [data-a="jgo"]');
  let st = await S(p, () => { const M = window.__reach.M; const c = { ck: [[0, 0], [0, 0]], gl: [0, 0] }; for (const e of M.ev){ if (e.c === 'ck' && e.b) c.ck[e.p - 1][e.i]++; if (e.c === 'gl' && e.b) c.gl[e.i]++; } return { tm: M.tm, c, score: document.querySelector('#glH').textContent + '-' + document.querySelector('#glA').textContent, ck: document.querySelector('#ckH').textContent }; });
  check(st.c.ck[0].join() === '4,2' && st.c.ck[1].join() === '2,1', 'corners backfilled by half from the API (4–2 first half, 2–1 second): ' + JSON.stringify(st.c.ck));
  check(st.score === '1-0' && st.tm.p === 2 && st.tm.r === 1 && Math.abs(st.tm.b - (67 * 60 - 40)) <= 10, 'score 1–0, clock running at API 67:00 minus the delay (' + st.tm.b + ')');
  check(st.ck.indexOf('角球 6') === 0, 'header shows the 6 home corners: ' + st.ck);
  let stx = await S(p, () => document.querySelector('#stats').textContent.replace(/\s+/g, ''));
  check(stx.indexOf('加入前的（主2、客1）') >= 0, 'statistics (second half) keep the pre-join corners apart');
  for (let k = 0; k < 3; k++){ await p.clock.runFor(60000); await chain(p, 0, 'xo'); }
  // the API now shows two more home corners; you have recorded neither yet
  FX[2001].ck = [8, 3]; FX[2001].el = 71;
  await sync(p);
  check(/等画面追上/.test(await p.textContent('#toastMsg')), 'sync holds the two new corners until your screen catches up: ' + (await p.textContent('#toastMsg')));
  check((await corners(p)).auto === 0, 'nothing added yet while waiting');
  // you record one of them through the chain (cross → in → cleared → corner) before the hold expires
  await chain(p, 0, 'xicc');
  await p.clock.runFor(75000);
  let c = await corners(p);
  check(c.auto === 1 && c.all[0] === 8, 'after the wait only the one you missed is added: the chain corner counts as yours (auto ' + c.auto + ', home ' + c.all[0] + ')');
  // a late chain corner merges with the synced one
  await chain(p, 0, 'lic');
  c = await corners(p);
  check(c.auto === 0 && c.all[0] === 8, 'recording it later through a long shot → corner merges with the synced corner (home ' + c.all[0] + ')');
  check((await p.textContent('#toastMsg')).indexOf('跟联网补上的角球合并') >= 0, 'toast says it merged');
  // same for the other-corner key
  FX[2001].ck = [9, 3]; FX[2001].el = 75;
  await sync(p); await p.clock.runFor(75000);
  check((await corners(p)).auto === 1, 'another missed corner is added after the wait');
  await p.click('.pad[data-i="0"] [data-a="ck"]');
  c = await corners(p);
  check(c.auto === 0 && c.all[0] === 9, 'tapping 其他角球 later merges too (home ' + c.all[0] + ')');
  // manual by default
  const before = calls.length;
  await p.clock.runFor(185000);
  check(calls.length === before, 'no automatic sync by default (' + (calls.length - before) + ' requests in 3 min)');
  // full time
  FX[2001].st = 'FT'; FX[2001].el = 90;
  await sync(p);
  check((await p.textContent('#toastMsg')).indexOf('已经结束') >= 0, 'full time from the API offers to finish');
  await p.click('#toastBtn');
  await p.click('#card [data-a="fkeep"]');
  await p.click('#qbMenu'); await p.click('#card [data-a="exp1"]');
  const ex = JSON.parse(await p.$eval('#expText', t => t.value));
  check(ex.matches[0].api && ex.matches[0].api.id === 2001 && ex.matches[0].ev.some(e => e.b === 1), 'export keeps the API link and the backfilled events');
  await p.click('#card [data-a="close"]');
  await p.click('#qbMenu'); await p.click('#card [data-a="net"]');
  check((await p.textContent('#card')).indexOf('角球数据记录”里的 API key') >= 0, 'settings explain the key comes from the corner-sb app');
  await p.screenshot({ path: `${out}/net_settings.png` });
  console.log('phone A errors:', p.errs.length ? p.errs.join('\n') : 'none'); if (p.errs.length) fails++;
  await ctx.close();

  // ---------- B. iPad: one team only, then Wikidata names, swapped home / away ----------
  ({ ctx, p } = await page(b, 1180, 820, false, new Date((KO + 1200 + 20 * 60) * 1000).toISOString()));
  await p.fill('#fH', '浦和红钻');
  await p.clock.runFor(3000);
  await p.waitForSelector('#sugg:not([hidden]) [data-sg="pick"]', { timeout: 5000 });
  await p.screenshot({ path: `${out}/net_sugg.png` });
  await p.click('#sugg [data-sg="pick"]');
  await p.waitForSelector('#card [data-a="jgo"]', { timeout: 5000 });
  check((await p.inputValue('#fA')) === '大阪钢巴', 'one-team search fills the other team with its Chinese name');
  await p.click('#card [data-a="close"]');
  check((await p.textContent('#qbSync')).indexOf('加入') >= 0, 'closing the join sheet leaves a 加入 button');
  await p.click('#qbMenu'); await p.click('#card [data-a="new"]');
  if (await p.$('#card [data-a="nq3"]')) await p.click('#card [data-a="nq3"]');
  await p.fill('#fH', '萨尔茨堡红牛'); await p.fill('#fA', '沃尔夫斯贝格');
  await p.clock.runFor(3000);
  await p.waitForSelector('#card [data-a="jgo"]', { timeout: 5000 });
  check(await S(p, () => window.__reach.M.api && window.__reach.M.api.sw) === 1, 'Wikidata names matched and the swapped home / away was detected');
  const sc = await p.$$eval('#card .stp b', bs => bs.slice(0, 2).map(x => x.textContent).join('-'));
  check(sc === '1-0', 'swapped match: the score is shown from your side (1–0 for 萨尔茨堡红牛)');
  console.log('ipad B errors:', p.errs.length ? p.errs.join('\n') : 'none'); if (p.errs.length) fails++;
  await ctx.close();

  // ---------- C. phone: join at half-time, delay from the second-half kick-off, chain goal not doubled ----------
  ({ ctx, p } = await page(b, 390, 763, true, new Date((KO + 2820 + 300) * 1000).toISOString()));
  FX[2001].st = 'HT'; FX[2001].el = 45; FX[2001].ck = [3, 1]; FX[2001].ck1 = null; FX[2001].g = [0, 1]; FX[2001].per = [KO, null];
  await p.fill('#fH', '鹿岛鹿角'); await p.fill('#fA', '横滨水手');
  await p.clock.runFor(3000);
  await p.waitForSelector('#card [data-a="jgo"]', { timeout: 5000 });
  check((await p.textContent('#card')).indexOf('现在是中场休息') >= 0, 'half-time join: the sheet says it will wait at half-time');
  await p.click('#card [data-a="jgo"]');
  st = await S(p, () => { const M = window.__reach.M; const n = (cc, pp) => [0, 1].map(i => M.ev.filter(e => e.c === cc && e.i === i && (!pp || e.p === pp)).length); return { ht: M.tm.ht, pe1: M.pe[1], ck1: n('ck', 1), ck2: n('ck', 2), gl: n('gl') }; });
  check(st.ht === 1 && st.pe1 === 2700 && st.ck1.join() === '3,1' && st.ck2.join() === '0,0' && st.gl.join() === '0,1', 'half-time join: corners 3–1 in the first half, score 0–1 ' + JSON.stringify(st));
  const ps = await S(p, () => Math.floor(Date.now() / 1000)) + 60;
  FX[2001].st = '2H'; FX[2001].per = [KO, ps]; FX[2001].el = 46;
  await p.clock.runFor(90000);
  await p.click('#runBtn');
  await sync(p);
  const dl2 = await S(p, () => window.__reach.M.api.dl);
  check(dl2 >= 29 && dl2 <= 32, 'screen delay measured from your second-half kick-off: ' + dl2 + ' s');
  await p.clock.runFor(240000);
  FX[2001].el = 50; FX[2001].g = [1, 1]; FX[2001].rc = [0, 1];
  await sync(p);
  check(/等画面追上/.test(await p.textContent('#toastMsg')), 'goal and red card held: ' + (await p.textContent('#toastMsg')));
  // you see the goal and record it through the chain: long shot → in → goal
  await p.clock.runFor(20000);
  await chain(p, 0, 'lig');
  await p.clock.runFor(45000);
  st = await S(p, () => { const M = window.__reach.M; return { gl: window.__reach.statOf(M, 0, 'ft').gl, auto: M.ev.filter(e => e.c === 'gl' && e.a).length, rc: M.ev.filter(e => e.c === 'rc' && e.i === 1).map(e => e.a || 0), hold: (M.api.hold || []).length }; });
  check(st.gl === 1 && st.auto === 0 && st.rc.join() === '1' && st.hold === 0, 'your chain goal is not doubled; the missed red card is added and marked as synced ' + JSON.stringify(st));
  check(/联网同步补上：横滨水手 红牌 1/.test(await p.textContent('#toastMsg')), 'toast names what was added: ' + (await p.textContent('#toastMsg')));
  check((await p.textContent('#glH')).trim() === '1' && (await p.textContent('#glA')).trim() === '1', 'score 1–1');
  console.log('phone C errors:', p.errs.length ? p.errs.join('\n') : 'none'); if (p.errs.length) fails++;
  await ctx.close();

  // ---------- E. phone: linked before kick-off, play at the kick-off on screen, manual sync, interval setting ----------
  ({ ctx, p } = await page(b, 390, 763, true, new Date((KO - 300) * 1000).toISOString()));
  await p.fill('#fH', '切尔西'); await p.fill('#fA', '利物浦');
  await p.clock.runFor(3000);
  await p.waitForFunction(() => window.__reach.M.api && window.__reach.M.api.st === 'NS', null, { timeout: 5000 });
  check(/开球时按 ▶/.test(await p.textContent('#toastMsg')), 'before kick-off: linked, told to press play at kick-off');
  const ko = await S(p, () => Math.floor(Date.now() / 1000)) + 60;
  await p.clock.runFor(60000 + 35000);
  FX[2004].st = '1H'; FX[2004].el = 1; FX[2004].per = [ko, null]; FX[2004].g = [0, 0];
  await p.click('#runBtn');
  await p.clock.runFor(20000);
  await sync(p);
  st = await S(p, () => ({ dl: window.__reach.M.api.dl, r: window.__reach.M.tm.r, obs: window.__reach.M.obs }));
  check(!(await p.isVisible('#card [data-a="jgo"]')) && st.r === 1 && st.obs.t === 0, 'watching from kick-off: sync does not offer a join');
  check(st.dl >= 34 && st.dl <= 37, 'delay measured from your kick-off tap: ' + st.dl + ' s');
  let n0 = calls.length; await p.clock.runFor(400000);
  check(calls.length === n0, 'manual by default: no requests during 6+ minutes');
  await p.click('#qbMenu'); await p.click('#card [data-a="net"]');
  check((await p.textContent('#card')).indexOf('现在只在你按“同步”时才联网') >= 0, 'settings say sync is manual');
  await p.click('#card [data-a="niv"][data-v="180"]');
  await p.click('#card [data-a="close"]');
  n0 = calls.length; await p.clock.runFor(185000);
  check(calls.length > n0, 'after choosing every 3 minutes, auto sync runs (' + (calls.length - n0) + ' requests)');
  await p.reload();
  check(await S(p, () => JSON.parse(localStorage.getItem('corner-reach-net')).iv === 180), 'a chosen interval is kept after reopening');
  check(await S(p, () => !localStorage.getItem('corner-sb-net') || JSON.parse(localStorage.getItem('corner-sb-net')).key === 'SBKEY'), 'the corner-sb settings are left untouched');
  console.log('phone E errors:', p.errs.length ? p.errs.join('\n') : 'none'); if (p.errs.length) fails++;
  await ctx.close();
  await b.close();
  console.log(fails ? fails + ' FAILED' : 'ALL OK');
  process.exit(fails ? 1 : 0);
})();
