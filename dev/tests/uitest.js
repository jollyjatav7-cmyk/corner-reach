// The arrival chain (timer, back, cancel, end without a choice, pick without 到达, second 到达, double-tap guard),
// corners (chain + other, duplicate warning), undo, part one (timestamps, correction, cancel), the two questions,
// the statistics panel, editing, score fix, finish, warehouse, JSON/CSV export and import, and layouts.
// Usage: node uitest.js <base_url> <out_dir>
const { chromium } = require(process.env.PLAYWRIGHT || '/opt/node-tools/node_modules/playwright');
const [base, out] = process.argv.slice(2);
let fails = 0;
const check = (cond, msg) => { console.log((cond ? 'ok   ' : 'FAIL ') + msg); if (!cond) fails++; };
const S = (p, fn, arg) => p.evaluate(fn, arg);
const MM = p => S(p, () => JSON.parse(JSON.stringify(window.__reach.M)));
const ars = (m, i) => m.ev.filter(e => e.c === 'ar' && (i == null || e.i === i));
const txt = async (p, sel) => (await p.textContent(sel)).replace(/\s+/g, ' ').trim();
async function open(b, w, h, mob, pip, seed){
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: mob, hasTouch: mob, serviceWorkers: 'block' });
  if (pip) await ctx.addInitScript(x => localStorage.setItem('corner-reach-pip', JSON.stringify(x)), pip);
  if (seed) await ctx.addInitScript(x => { if (!sessionStorage.getItem('seeded')){ sessionStorage.setItem('seeded', '1'); for (const k in x) localStorage.setItem(k, x[k]); } }, seed);
  const p = await ctx.newPage();
  p.errs = [];
  p.on('pageerror', e => p.errs.push('pageerror ' + e.message));
  p.on('console', m => { if (m.type() === 'error') p.errs.push('console ' + m.text()); });
  await p.clock.install({ time: new Date('2026-11-04T10:00:00Z') });
  await p.goto(base + '/index.html');
  return { ctx, p };
}
const tapAr = (p, i) => p.click('.pad[data-i="' + i + '"] [data-a="ar"]');
async function pick(p, i, v){ await p.click('.pad[data-i="' + i + '"] [data-a="pick"][data-v="' + v + '"]'); await p.clock.runFor(300); }
async function chain(p, i, path, wait){ await tapAr(p, i); await p.clock.runFor(wait || 1500); for (const c of path) await pick(p, i, c); await p.clock.runFor(600); }
// 拖动条：滑鼠点在某个百分比的位置；手指点一下；手指拖（CDP 触控）
async function slRect(p, sel){ return p.$eval(sel + ' .sl-t', el => { el.scrollIntoView({ block: 'center' }); const b = el.getBoundingClientRect(); return { x: b.left, y: b.top + b.height / 2, w: b.width }; }); }
async function slide(p, sel, v, lo, hi){ lo = lo == null ? 0 : lo; hi = hi == null ? 100 : hi; const r = await slRect(p, sel); await p.mouse.click(r.x + r.w * (v - lo) / (hi - lo), r.y); await p.clock.runFor(300); }
async function tapSlide(p, sel, v){ const r = await slRect(p, sel); await p.touchscreen.tap(r.x + r.w * v / 100, r.y); await p.clock.runFor(1000); }
async function dragSlide(p, sel, v0, v1, mid, dy){
  const r = await slRect(p, sel), X = v => r.x + r.w * v / 100;
  const cdp = await p.context().newCDPSession(p);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: X(v0), y: r.y }] });
  for (let k = 1; k <= 8; k++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: X(v0 + (v1 - v0) * k / 8), y: r.y + (dy || 0.3) * k }] });
  if (mid) await mid();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach(); await p.clock.runFor(1000);
}
const svOf = (m, i, f) => m.sv.filter(s => s.i === i && s.f === f);
async function layout(p, tag){
  const r = await S(p, () => {
    const de = document.documentElement, bad = [];
    for (const el of document.querySelectorAll('.k .l, .k .c, .qval, .qw, .qends span, .p1s b, .p1s em, .mr-t .v, .sgb i, .qck, .sth .tm, .stf button, .mseg button, .undo, .mbn, .mbg')){
      const cs = getComputedStyle(el); if (cs.display === 'none' || !el.offsetParent) continue;
      if (el.scrollWidth > el.clientWidth + 1 && cs.textOverflow !== 'ellipsis') bad.push(el.className + ':' + el.textContent.trim().slice(0, 12));
    }
    for (const el of document.querySelectorAll('.pad .qcard')) if (el.offsetParent && el.scrollHeight > el.clientHeight + 1) bad.push('qcard squeezed ' + el.scrollHeight + '>' + el.clientHeight);
    for (const el of document.querySelectorAll('.pad .qcard .sl')) if (el.offsetParent && el.getBoundingClientRect().height < 34) bad.push('slider squeezed ' + Math.round(el.getBoundingClientRect().height));
    const strip = document.querySelector('#strip').getBoundingClientRect();
    let low = 0; for (const el of document.querySelectorAll('.pad .board, .pad .qcard, .pad .endc')){ const b = el.getBoundingClientRect(); if (b.height) low = Math.max(low, b.bottom); }
    const ks = [...document.querySelectorAll('.pad .k, .pad .sl')].filter(x => x.offsetParent).map(x => x.getBoundingClientRect().height);
    const mb = document.querySelector('#mBan'), ms = document.querySelector('#mseg').getBoundingClientRect();
    const ban = mb && !mb.hidden ? mb.getBoundingClientRect() : null;
    return { sw: de.scrollWidth, cw: de.clientWidth, bad: bad, low: low, strip: strip.top, minK: ks.length ? Math.min.apply(null, ks) : 0,
      banOk: !ban || (ban.left >= ms.right - 1 && ban.right <= de.clientWidth + 1 && Math.abs((ban.top + ban.bottom) / 2 - (ms.top + ms.bottom) / 2) < 6) };
  });
  check(r.sw <= r.cw, tag + ': no sideways scroll (' + r.sw + '/' + r.cw + ')');
  check(!r.bad.length, tag + ': all labels fit their buttons' + (r.bad.length ? ' ' + JSON.stringify(r.bad.slice(0, 6)) : ''));
  check(r.banOk, tag + ': the model banner sits beside the mode switch, on screen');
  return r;
}

(async () => {
  const b = await chromium.launch();
  // ================= A. phone =================
  let { ctx, p } = await open(b, 390, 763, true);
  await p.fill('#fLg', 'J1'); await p.fill('#fH', '鹿岛鹿角'); await p.fill('#fA', '横滨水手');
  await p.click('#runBtn');
  await p.clock.runFor(3 * 60000);
  // 1. a full chain with the timer
  await tapAr(p, 0);
  check(await p.isVisible('.pad[data-i="0"] .stage.open'), 'after 到达 the stage opens with the choices');
  await p.clock.runFor(2400);
  const tm = await txt(p, '#tm0');
  check(/^2\.[1-6]/.test(tm), 'live seconds since 到达: ' + tm);
  await pick(p, 0, 'x');
  check((await txt(p, '.pad[data-i="0"] .sth')).indexOf('传中') >= 0 && await p.isVisible('.pad[data-i="0"] [data-a="pick"][data-v="i"]'), 'after 传中: 内／外');
  await pick(p, 0, 'i'); await pick(p, 0, 's');
  check(await p.isVisible('.pad[data-i="0"] [data-a="pick"][data-v="g"]') && await p.isVisible('.pad[data-i="0"] [data-a="pick"][data-v="n"]'), 'after 禁区射门: 进球／角球／无角球');
  await pick(p, 0, 'c');
  let m = await MM(p), e = ars(m, 0).pop();
  check(e.pa === 'xisc' && Math.abs(e.dt - 2.4) < 0.35, 'recorded 传中 › 内 › 禁区射门 › 角球 with the time to the choice (' + e.pa + ', ' + e.dt + ' s)');
  check((await txt(p, '#ckH')) === '角球 1' && (await txt(p, '#toastMsg')).indexOf('角球，共 1 个') >= 0, 'the chain corner counts in the header and is announced');
  check(!(await p.isVisible('.pad[data-i="0"] .stage.open')) && (await txt(p, '.pad[data-i="0"] .sth')).indexOf('上一次：传中 › 内 › 禁区射门 › 角球') >= 0, 'stage closes and shows the last chain');
  await p.screenshot({ path: `${out}/t_phone_after1.png` });
  // 2. back keeps the time of the first choice
  await tapAr(p, 0); await p.clock.runFor(1800);
  await pick(p, 0, 'l'); await p.clock.runFor(3000);
  await p.click('.pad[data-i="0"] [data-a="stb"]');
  check(await p.isVisible('.pad[data-i="0"] [data-a="pick"][data-v="m"]'), '返回 goes back to the choices');
  await pick(p, 0, 'm'); await pick(p, 0, 'n');
  m = await MM(p); e = ars(m, 0).pop();
  check(e.pa === 'mn' && Math.abs(e.dt - 1.8) < 0.35, 'after 返回 the new choice keeps the time of the first tap (' + e.pa + ', ' + e.dt + ' s)');
  // 3. cancel an arrival, then restore it
  await p.clock.runFor(1000);
  await tapAr(p, 1); await p.clock.runFor(500);
  await p.click('.pad[data-i="1"] [data-a="stx"]');
  check(ars(await MM(p), 1).length === 0, '取消这次到达 removes it');
  await p.click('#toastBtn');
  check(ars(await MM(p), 1).length === 1, '…and the toast restores it');
  // 4. end without a choice
  await p.clock.runFor(1000);
  await tapAr(p, 1); await p.clock.runFor(700);
  await p.click('.pad[data-i="1"] [data-a="ste"]');
  m = await MM(p);
  check(ars(m, 1).length === 2 && ars(m, 1).every(x => x.pa === ''), '没选就结束 keeps the arrival without a choice');
  // 5. a choice without pressing 到达
  await p.clock.runFor(1000);
  await pick(p, 1, 'b');
  m = await MM(p); e = ars(m, 1).pop();
  check(ars(m, 1).length === 3 && e.pa === 'b' && e.dt == null && (await txt(p, '#toastMsg')).indexOf('用时记成不详') >= 0, 'tapping a choice without 到达 records an arrival with unknown time');
  // 6. 到达 again while a chain is open
  await p.clock.runFor(1000);
  await tapAr(p, 0); await p.clock.runFor(1000); await pick(p, 0, 'x');
  await p.clock.runFor(500); await tapAr(p, 0); await p.clock.runFor(900); await pick(p, 0, 'g');
  m = await MM(p);
  const last2 = ars(m, 0).slice(-2).map(x => x.pa).join(',');
  check(last2 === 'x,g', 'pressing 到达 again starts a new arrival and leaves the old one as chosen so far (' + last2 + ')');
  // 7. double taps do not jump a level or start a new arrival
  await p.clock.runFor(1000);
  await tapAr(p, 1); await p.clock.runFor(1200);
  await p.click('.pad[data-i="1"] [data-a="pick"][data-v="x"]');
  await p.click('.pad[data-i="1"] [data-a="pick"][data-v="i"]');
  m = await MM(p);
  check(ars(m, 1).pop().pa === 'x', 'a second tap within 0.22 s does not pick on the next level');
  await p.clock.runFor(300);
  await p.click('.pad[data-i="1"] [data-a="pick"][data-v="o"]');
  const n1 = ars(await MM(p), 1).length;
  await p.click('.pad[data-i="1"] [data-a="pick"][data-v="x"]');
  check(ars(await MM(p), 1).length === n1, 'a tap right after the chain ends does not start another arrival');
  // 8. other corners and the duplicate warning
  await p.clock.runFor(1000);
  await chain(p, 0, 'xicc');
  await p.click('.pad[data-i="0"] [data-a="ck"]');
  check((await txt(p, '#toastMsg')).indexOf('刚才那次到达已经记了角球') >= 0 && (await txt(p, '#toastBtn')) === '撤销', 'other corner right after a chain corner warns about double counting');
  await p.click('#toastBtn');
  check((await txt(p, '#ckH')) === '角球 2', '…and 撤销 removes it (home corners 2)');
  await p.clock.runFor(70000);
  await p.click('.pad[data-i="0"] [data-a="ck"]');
  check((await txt(p, '#ckH')) === '角球 3' && (await txt(p, '.pad[data-i="0"] [data-a="ck"] .c')) === '1', 'a later other corner counts (header 3, button 1)');
  // 9. undo the last home event
  await p.click('.pad[data-i="0"] [data-a="undoT"]');
  check((await txt(p, '#ckH')) === '角球 2' && (await txt(p, '#toastMsg')).indexOf('已撤销') >= 0, 'per-team 撤销 removes the last event');
  await p.click('#toastBtn');
  check((await txt(p, '#ckH')) === '角球 3', '…恢复 brings it back');
  // 10. part one: sliders (球权 is one bar for both teams)
  await p.click('.pad[data-i="0"] [data-a="p1"][data-f="bq"]');
  await slide(p, '#card .sl[data-x="bq"]', 60);
  m = await MM(p);
  let bh = svOf(m, 0, 'bq'), ba = svOf(m, 1, 'bq');
  check(bh.length === 1 && ba.length === 1 && bh[0].v === 60 && ba[0].v === 40 && bh[0].g != null && bh[0].g === ba[0].g, '球权 60% for home sets away to 40% (one pair: ' + JSON.stringify([bh, ba].map(x => x.map(s => s.v))) + ')');
  check((await txt(p, '#p1v_bqh')) === '主 60%' && (await txt(p, '#p1v_bqa')) === '客 40%', 'the sheet shows both sides of the possession bar');
  await p.clock.runFor(5000);
  await slide(p, '#card .sl[data-x="bq"]', 55);
  m = await MM(p); bh = svOf(m, 0, 'bq'); ba = svOf(m, 1, 'bq');
  check(bh.length === 1 && bh[0].v === 55 && ba.length === 1 && ba[0].v === 45, 'moving it again within 20 s corrects the same pair (' + bh.map(s => s.v) + ' / ' + ba.map(s => s.v) + ')');
  await p.clock.runFor(40000);
  await p.click('#card [data-a="p1clr"][data-f="bq"]');
  m = await MM(p); bh = svOf(m, 0, 'bq'); ba = svOf(m, 1, 'bq');
  check(bh.length === 2 && bh[1].v === null && ba.length === 2 && ba[1].v === null, '清除 later clears both with a new timestamped pair');
  // keyboard: End then 6 x left = 70%, all within 20 s = one record
  await p.focus('#card .sl[data-x="nd"]');
  await p.keyboard.press('End');
  for (let k = 0; k < 6; k++){ await p.keyboard.press('ArrowLeft'); await p.clock.runFor(100); }
  m = await MM(p);
  check(svOf(m, 0, 'nd').length === 1 && svOf(m, 0, 'nd')[0].v === 70 && (await txt(p, '#p1w_nd')) === '有很大难度但勉强进得去', 'arrow keys move the difficulty bar in 5% steps (70%, word shown)');
  // a vertical swipe on a bar scrolls instead of changing it
  const before = svOf(await MM(p), 0, 'yy').length;
  await dragSlide(p, '#card .sl[data-x="yy"]', 50, 52, null, 9);
  check(svOf(await MM(p), 0, 'yy').length === before, 'a vertical swipe on a bar does not record anything');
  await p.click('#card [data-a="p1v"][data-f="cm"][data-v="0"]');
  await p.click('#card [data-a="p1side"][data-v="1"]');
  // touch: drag the away 意愿 bar from 70 to 20; nothing is recorded until the finger lifts
  let midN = -1;
  await dragSlide(p, '#card .sl[data-x="yy"]', 70, 20, async () => { midN = svOf(await MM(p), 1, 'yy').length; });
  m = await MM(p);
  check(midN === 0 && svOf(m, 1, 'yy').length === 1 && svOf(m, 1, 'yy')[0].v === 20, 'dragging the away 意愿 bar records once, on release (20%)');
  await tapSlide(p, '#card .sl[data-x="nd"]', 35);
  m = await MM(p);
  check(svOf(m, 1, 'nd').length === 1 && svOf(m, 1, 'nd')[0].v === 35, 'a tap on the bar sets that value (35%)');
  await p.click('#card [data-a="p1clr"][data-f="nd"]');
  await p.screenshot({ path: `${out}/t_phone_p1.png` });
  await p.click('#card [data-a="close"]');
  const p1t = [await txt(p, '.pad[data-i="0"] .p1s'), await txt(p, '.pad[data-i="1"] .p1s')];
  check(p1t[0].replace(/ /g, '') === '球权未设难度70%意愿未设场面包饺子' && p1t[1].replace(/ /g, '') === '球权未设难度未设意愿20%场面未设', 'summaries show the current part-one values: ' + p1t.join(' | '));
  // the sheet scrolls to the factor you tap
  await p.click('.pad[data-i="1"] [data-a="p1"][data-f="cm"]');
  const vis = await S(p, () => { const g = document.getElementById('p1g-cm').getBoundingClientRect(), c = document.getElementById('card').getBoundingClientRect(); return g.bottom <= c.bottom + 1 && g.top >= c.top - 1; });
  check(vis, 'tapping 场面 opens the sheet with 场面 in view');
  await p.click('#card [data-a="close"]');
  // the list shows one row per possession change, and undo removes both teams' records
  await p.click('.pad[data-i="0"] [data-a="p1"][data-f="bq"]');
  await p.clock.runFor(30000);
  await slide(p, '#card .sl[data-x="bq"]', 65);
  await p.click('#card [data-a="close"]');
  await p.click('#qbMenu'); await p.click('#card [data-a="list"]');
  const lt = await txt(p, '#card .list');
  check((lt.match(/球权 → 主 65% · 客 35%/g) || []).length === 1, 'the list shows the possession pair as one row');
  await p.keyboard.press('Escape');
  await p.click('#qbUndo');
  m = await MM(p);
  check(svOf(m, 0, 'bq').length === 2 && svOf(m, 1, 'bq').length === 2, 'bottom 撤销 removes both records of the last possession change');
  // 11. the two questions: big sliders
  await p.click('#mseg [data-v="q"]');
  check(await p.isVisible('.pad[data-i="0"] .qcard .sl') && !(await p.isVisible('.pad[data-i="0"] [data-a="ar"]')), 'two-questions mode shows the question bars instead of the arrival keys');
  await slide(p, '.pad[data-i="0"] .sl[data-x="0_q1"]', 65);
  await p.clock.runFor(1000);
  await dragSlide(p, '.pad[data-i="1"] .sl[data-x="1_q2"]', 50, 30);
  await p.clock.runFor(30000);
  await slide(p, '.pad[data-i="0"] .sl[data-x="0_q1"]', 80);
  m = await MM(p);
  const q1 = svOf(m, 0, 'q1').map(s => s.v).join(',');
  check(q1 === '65,80' && svOf(m, 1, 'q2').length === 1 && svOf(m, 1, 'q2')[0].v === 30, 'each answer is a timestamped percent (' + q1 + '; away q2 ' + svOf(m, 1, 'q2').map(s => s.v) + ')');
  check((await txt(p, '#qv_0_q1')) === '80%' && (await txt(p, '#qw_0_q1')) === '很容易' && (await txt(p, '.pad[data-i="0"] .qcard .qnote')).indexOf('（之前 65%）') >= 0, 'the value, its word and the previous value are shown');
  const qfit = await layout(p, 'phone two questions');
  check(qfit.low <= qfit.strip + 1, 'both teams fit on one phone screen in two-questions mode (bottom ' + Math.round(qfit.low) + ' / strip ' + Math.round(qfit.strip) + ')');
  await p.screenshot({ path: `${out}/t_phone_q.png` });
  await p.click('.pad[data-i="1"] [data-a="ck"]');
  check((await txt(p, '#ckA')) === '角球 1', 'the corner pill in two-questions mode adds a corner');
  await p.click('#qbUndo');
  check((await txt(p, '#ckA')) === '角球 0', 'bottom 撤销 removes it');
  await p.click('#mseg [data-v="rec"]');
  await p.clock.runFor(1000);
  await chain(p, 0, 'b');   // one arrival after the part-one choices, so the CSV shows them
  // 12. the statistics
  m = await MM(p);
  const H = ars(m, 0), A = ars(m, 1);
  await p.click('#qbStats'); await p.waitForTimeout(350);
  const st = (await txt(p, '#stats')).replace(/ /g, '');
  const xl = arr => { const c = arr.filter(x => x.pa); return Math.round(c.filter(x => x.pa[0] === 'x' || x.pa[0] === 'l').length / c.length * 100) + '%'; };
  check(st.indexOf(H.length + '到达次数' + A.length) >= 0, 'stats: arrivals ' + H.length + ' vs ' + A.length);
  check(st.indexOf(xl(H) + '传中＋远射占五项' + xl(A)) >= 0, 'stats: 传中＋远射 share of five ' + xl(H) + ' vs ' + xl(A));
  const x3 = arr => { const c = arr.filter(x => x.pa && 'xlm'.indexOf(x.pa[0]) >= 0); return c.length ? Math.round(c.filter(x => x.pa[0] !== 'm').length / c.length * 100) + '%' : '—'; };
  check(st.indexOf(x3(H) + '传中＋远射占三项' + x3(A)) >= 0, 'stats: 传中＋远射 share of three ' + x3(H) + ' vs ' + x3(A));
  const segs = await S(p, () => [...document.querySelectorAll('#stats .sgr')].slice(0, 2).map(r => r.querySelector('.sgb').getAttribute('aria-label')));
  check(/传中 3/.test(segs[0]) && /中路渗透 1/.test(segs[0]) && /丢球 1/.test(segs[0]), 'home choice bar: ' + segs[0]);
  check(st.indexOf('1/1') >= 0 || st.indexOf('2/2') >= 0, 'in/out meters show counts');
  check(st.indexOf('没选就结束的到达：主0、客2') >= 0, 'arrivals without a choice are listed separately');
  check(st.indexOf('3角球0') >= 0, 'stats: corners 3–0');
  await p.screenshot({ path: `${out}/t_phone_stats.png` });
  await p.click('#stats [data-a="scope"][data-v="ft"]');
  check((await p.getAttribute('#stats [data-v="ft"]', 'aria-pressed')) === 'true', 'scope switch to 全场');
  await p.click('#stats [data-a="scope"][data-v="h1"]');
  await p.click('[data-a="midclose"]'); await p.waitForTimeout(300);
  // 13. edit a chain from the list
  await p.click('#qbMenu'); await p.click('#card [data-a="list"]');
  const first = await p.$('#card [data-a="evedit"]');
  await first.click();
  check((await txt(p, '#card')).indexOf('传中 › 内 › 禁区射门 → 结果？') >= 0, 'edit sheet shows every step of the chain');
  await p.click('#card [data-a="eppick"][data-l="1"][data-v="o"]');
  m = await MM(p);
  check(ars(m, 0)[0].pa === 'xo' && (await txt(p, '#ckH')) === '角球 2', 'changing 内 to 外 shortens the chain and removes its corner');
  await p.keyboard.press('Escape');
  // 14. score fix
  await p.click('#glA');
  await p.click('#card [data-a="fs"][data-f="sc"][data-i="1"][data-d="1"]');
  await p.click('#card [data-a="fs"][data-f="c1"][data-i="1"][data-d="1"]');
  await p.click('#card [data-a="fs"][data-f="c1"][data-i="0"][data-d="-1"]');
  await p.click('#card [data-a="fsave"]');
  m = await MM(p);
  check((await txt(p, '#glA')) === '1' && (await txt(p, '#ckA')) === '角球 1' && (await txt(p, '#ckH')) === '角球 1', 'fix: away goal and corner added, a home corner removed (' + (await txt(p, '#ckH')) + ' / ' + (await txt(p, '#ckA')) + ')');
  check(m.ev.filter(x => x.c === 'ck' && x.i === 0).length === 0 && ars(m, 0).some(x => x.pa === 'xicc'), 'removing a home corner takes the other corner first and keeps the chain corner');
  // 15. finish, warehouse, export and import
  const nEv = m.ev.length, nSv = m.sv.length;
  await p.click('#qbMenu'); await p.click('#card [data-a="finish"]'); await p.click('#card [data-a="fkeep"]');
  check(await p.isVisible('.endc [data-a="new"]'), 'finished: ended card');
  await p.click('#qbArch'); await p.click('#card [data-a="wtab"][data-v="stats"]');
  const ws = await txt(p, '#card');
  check(ws.indexOf('平均进球和角球（1 场）') >= 0, 'warehouse stats render');
  await p.click('#card [data-a="wtab"][data-v="back"]');
  await p.click('#card [data-a="expall"]');
  const json = await p.$eval('#expText', el => el.value);
  const o = JSON.parse(json);
  check(o.app === '角球到达与选择' && o.fmt === 2 && o.matches.length === 1 && o.matches[0].ev.length === nEv && o.matches[0].sv.length === nSv && o.tree.xisc === '传中 › 内 › 禁区射门 › 角球' && o.model && o.model.r.b.all.length === 4, 'JSON export (fmt 2): all events, percents, the path legend and the model');
  await p.click('#card [data-a="close"]');
  await p.click('#qbArch'); await p.click('#card [data-a="wtab"][data-v="back"]'); await p.click('#card [data-a="expcsv"]');
  const csv = (await p.$eval('#expText', el => el.value)).replace(/^﻿/, '').split('\n');
  check(csv.length === nEv + 1 && csv[0].indexOf('完整路径') >= 0 && csv[0].indexOf('球权%') >= 0 && csv.some(l => /,70,,包饺子,80,$/.test(l)), 'CSV: one row per event with the part-one percents at that time (' + (csv.length - 1) + ' rows, ' + nEv + ' events)');
  await p.click('#card [data-a="close"]');
  await p.click('#qbArch'); await p.click('#card [data-a="wtab"][data-v="back"]'); await p.click('#card [data-a="expcsvh"]');
  const csvh = (await p.$eval('#expText', el => el.value)).split('\n');
  check(csvh.length >= 3 && csvh[0].indexOf('传中远射占三项') >= 0 && csvh[0].indexOf('难度（按时间平均%）') >= 0, 'CSV per team-half with time-averaged percents: ' + (csvh.length - 1) + ' rows');
  await p.click('#card [data-a="close"]');
  await p.click('.endc [data-a="new"]');
  m = await MM(p);
  check(m.st === 1 && !m.ev.length && !m.sv.length && m.lg === 'J1', 'new match starts clean (league kept)');
  console.log('phone errors:', p.errs.length ? p.errs.join('\n') : 'none'); if (p.errs.length) fails++;
  await ctx.close();
  // import into a fresh device
  ({ ctx, p } = await open(b, 390, 763, true));
  await p.click('#qbMenu'); await p.click('#card [data-a="wback"]'); await p.click('#card [data-a="import"]');
  await p.fill('#impText', json); await p.click('#card [data-a="imptext"]');
  const imp = await S(p, () => { const s = window.__reach.store(); const k = Object.keys(s).find(x => s[x].h === '鹿岛鹿角'); return k ? { ev: s[k].ev.length, sv: s[k].sv.length, pa: s[k].ev.filter(e => e.c === 'ar').map(e => e.pa).join(',') } : null; });
  check(imp && imp.ev === nEv && imp.sv === nSv, 'import restores the match (' + JSON.stringify(imp) + ')');
  console.log('import errors:', p.errs.length ? p.errs.join('\n') : 'none'); if (p.errs.length) fails++;
  await ctx.close();

  // ================= C. the simple model =================
  ({ ctx, p } = await open(b, 390, 763, true));
  await p.fill('#fH', '鹿岛鹿角'); await p.fill('#fA', '横滨水手');
  await p.click('#runBtn'); await p.clock.runFor(3 * 60000);
  const MNv = () => S(p, () => { const N = window.__reach.MN, k = x => x ? x.k + (x.i == null ? '' : x.i) : ''; return { r: N.r.t.map(t => t.v).join(','), rb: k(N.r.bet), q: N.q.t.map(t => t.v).join(','), qb: k(N.q.bet), clash: N.r.t[0].clash }; });
  async function p1set(i, vals){
    await p.click('.pad[data-i="' + i + '"] [data-a="p1"][data-f="nd"]');
    for (const f in vals) await slide(p, '#card .sl[data-x="' + f + '"]', vals[f]);
    await p.click('#card [data-a="close"]'); await p.clock.runFor(25000);
  }
  check((await txt(p, '#mBan')).indexOf('没有提示') >= 0 && !(await p.$('.pad .mbg')), 'model: no alerts at the start');
  await p1set(0, { bq: 55, nd: 30, yy: 70 });
  for (const path of ['xo', 'lo', 'xicn']) await chain(p, 0, path);
  let mv = await MNv();
  check(mv.r === ',' && mv.rb === '', 'model: home meets 球权/难度/意愿 but only 3 of the 4 choices needed → no alert yet');
  await p.click('#mBan');
  check((await txt(p, '#card')).indexOf('三项 3/4 次') >= 0, 'model detail shows how many choices are still missing (三项 3/4 次)');
  await p.click('#card [data-a="close"]');
  await chain(p, 0, 'mn');
  mv = await MNv();
  check(mv.r === 'b,' && mv.rb === 'hc0', 'model: 4th choice (传中＋远射 75%) → home 大角, bet 角球让球 home (' + JSON.stringify(mv) + ')');
  check((await txt(p, '.pad[data-i="0"] .mbg')) === '大角' && (await p.getAttribute('#mBan', 'class')).indexOf('hc0') >= 0 && (await txt(p, '#mBan')).indexOf('投角球让球') >= 0 && (await txt(p, '#mBan')).indexOf('鹿岛鹿角') >= 0, 'home badge 大角 and the banner says 投角球让球 鹿岛鹿角');
  await p.screenshot({ path: `${out}/t_model_hc.png` });
  await p1set(1, { nd: 85 });
  mv = await MNv();
  check(mv.r === 'b,s' && mv.rb === 'hc0', 'away 难度 85% alone → 小角 at once (any-one rule); 大角 + 小角 → 让球 home');
  await p1set(1, { nd: 50 });
  mv = await MNv();
  check(mv.r === 'b,' && mv.rb === 'hc0', 'away back to 50% → no alert; still 让球 home');
  await p1set(0, { yy: 50 });
  mv = await MNv();
  check(mv.r === ',' && mv.rb === '' && (await txt(p, '#mBan')).indexOf('没有提示') >= 0, 'home 意愿 exactly 50% is not 高于 50% → no alerts, banner back to 没有提示');
  await p1set(0, { yy: 70 });
  await p1set(1, { nd: 30, yy: 70 });
  for (const path of ['xo', 'xo', 'lo', 'mn']) await chain(p, 1, path);
  mv = await MNv();
  check(mv.r === 'b,b' && mv.rb === 'big' && (await txt(p, '#mBan')).indexOf('投大角') >= 0, 'both 大角 → 投大角');
  await p1set(0, { nd: 90 }); await p1set(1, { nd: 90 });
  mv = await MNv();
  check(mv.r === 's,s' && mv.rb === 'small' && (await txt(p, '#mBan')).indexOf('投小角') >= 0, 'both 小角 → 投小角');
  await p1set(1, { nd: 50, yy: 50 });
  mv = await MNv();
  check(mv.r === 's,' && mv.rb === 'hc1' && (await txt(p, '#mBan')).indexOf('横滨水手') >= 0, '小角 + no alert → 投角球让球 for the team without an alert (away)');
  m = await MM(p);
  const alr = i => m.al.filter(a => a.g === 'r' && a.i === i).map(a => a.v || '-').join(',');
  check(alr(0) === 'b,-,b,s' && alr(1) === 's,-,b,s,-', 'alert changes are logged per team (home ' + alr(0) + ' / away ' + alr(1) + ')');
  // the editor
  await p.click('#qbMenu'); await p.click('#card [data-a="mset"]');
  check((await txt(p, '#card h3')) === '简易模型：标准' && (await p.$$('#card .mce')).length === 10, 'menu → 简易模型 opens the editor with the 10 default conditions of 到达与选择');
  await p.click('#card [data-a="mcdel"][data-p="r.s.any.0"]');
  mv = await MNv();
  check(mv.r === ',' && (await S(p, () => window.__reach.MODEL.r.s.any.length)) === 1, 'deleting “难度 高于 80%” removes home 小角');
  await p.click('#toastBtn');
  mv = await MNv();
  check(mv.r === 's,' && (await S(p, () => window.__reach.MODEL.r.s.any[0].m)) === 'nd', '…and the toast puts it back');
  await p.focus('#card .sl[data-x="r.b.all.1"]'); await p.keyboard.press('End');
  mv = await MNv();
  check(mv.r === ',' && mv.clash === true && (await txt(p, '#mv_r_b_all_1')) === '100%', 'raising 大角 难度 to 100% makes 大角 and 小角 both true → clash, no alert');
  await p.click('#card [data-a="mop"][data-p="r.s.any.0"][data-v="lt"]');
  mv = await MNv();
  check(mv.r === 'b,s' && mv.rb === 'hc0', 'switching “难度 高于 80%” to 低于: home 大角 again, and away (难度 50%) now 小角 (' + mv.r + ')');
  await p.click('#card [data-a="mcadd"][data-p="r.b.any"]');
  await p.click('#card [data-a="mcpick"][data-p="r.b.any"][data-v="cm"]');
  await p.click('#card [data-a="mcin"][data-p="r.b.any.0"][data-v="2"]');
  const mdl0 = await S(p, () => JSON.stringify(window.__reach.MODEL.r.b.any));
  check(mdl0 === '[{"m":"cm","in":[0,2]}]', 'add 场面 to “满足任意一项”, pick 包饺子 and 快速转换球权 (' + mdl0 + ')');
  await p.screenshot({ path: `${out}/t_model_editor.png` });
  await p.reload(); await p.clock.runFor(1000);
  const kept = await S(p, () => { const x = window.__reach.MODEL; return x.r.b.all[1].v + ',' + x.r.s.any[0].op + ',' + JSON.stringify(x.r.b.any[0].in); });
  check(kept === '100,lt,[0,2]', 'the standards are kept after reopening the app (' + kept + ')');
  await p.click('#qbMenu'); await p.click('#card [data-a="mset"]');
  await p.click('#card [data-a="mreset"]');
  const def = await S(p, () => { const x = window.__reach.MODEL; return x.r.b.all[1].v + ',' + x.r.s.any[0].op + ',' + x.r.b.any.length + ',' + x.on; });
  check(def === '50,gt,0,1', '恢复默认标准 restores the defaults (' + def + ')');
  await p.click('#card [data-a="mon"][data-v="0"]');
  check(!(await p.isVisible('#mBan')) && !(await p.$('.pad .mbg')), 'turning the alerts off hides the banner and badges');
  await p.click('#card [data-a="mon"][data-v="1"]');
  await p.focus('#card .sl[data-x="min"]'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight');
  mv = await MNv();
  const why6 = await S(p, () => window.__reach.MN.r.t[0].b.all[3].mv.why);
  check((await S(p, () => window.__reach.MODEL.min)) === 6 && why6 === '三项 4/6 次', 'raising the minimum to 6: the 传中＋远射 condition waits for more choices (' + why6 + ')');
  await p.focus('#card .sl[data-x="min"]'); await p.keyboard.press('ArrowLeft'); await p.keyboard.press('ArrowLeft');
  await p.click('#card [data-a="close"]');
  // the two-questions program
  await p.click('#mseg [data-v="q"]');
  await slide(p, '.pad[data-i="0"] .sl[data-x="0_q1"]', 65); await slide(p, '.pad[data-i="0"] .sl[data-x="0_q2"]', 70);
  await slide(p, '.pad[data-i="1"] .sl[data-x="1_q1"]', 30); await slide(p, '.pad[data-i="1"] .sl[data-x="1_q2"]', 20);
  mv = await MNv();
  check(mv.q === 'b,s' && mv.qb === 'hc0' && (await txt(p, '.pad[data-i="0"] .mbg')) === '大角' && (await txt(p, '.pad[data-i="1"] .mbg')) === '小角', 'two questions: home 65/70 → 大角, away 30/20 → 小角, bet 让球 home');
  await p.screenshot({ path: `${out}/t_model_q.png` });
  await p.clock.runFor(25000);
  await slide(p, '.pad[data-i="1"] .sl[data-x="1_q1"]', 50);
  mv = await MNv();
  check(mv.q === 'b,' && mv.qb === 'hc0', 'away question 1 at 50% → no alert; 让球 home');
  await slide(p, '.pad[data-i="0"] .sl[data-x="0_q2"]', 60);
  mv = await MNv();
  check(mv.q === ',' && mv.qb === '' && (await txt(p, '#mBan')).indexOf('没有提示') >= 0, 'home question 2 at exactly 60% is not 高于 60% → no alert');
  await p.click('#mseg [data-v="rec"]');
  await p.click('#qbMenu'); await p.click('#card [data-a="exp1"]');
  const oj = JSON.parse(await p.$eval('#expText', el => el.value)).matches[0];
  check(oj.al && oj.al.length >= 9 && oj.mc && oj.mc.r && oj.pv === 1, 'the export carries the alert log and the standards used (' + (oj.al || []).length + ' changes)');
  await p.click('#card [data-a="close"]');
  console.log('model errors:', p.errs.length ? p.errs.join('\n') : 'none'); if (p.errs.length) fails++;
  await ctx.close();
  // old (v1) records are converted to percents
  const oldM = { id: 'rold1', c: 1, u: 2, d: '2026-11-01', lg: 'J1', h: '旧主', a: '旧客', st: 2, keep: 1, tm: { p: 2, b: 5400, r: 0, at: 0, ht: 0 }, pe: { 1: 2760 }, obs: { p: 1, t: 0 }, stop: { p: 2, t: 5400 }, note: '', api: null,
    ev: [{ t: 600, p: 1, i: 0, c: 'ar', pa: 'xisc', dt: 2.1 }, { t: 3000, p: 2, i: 1, c: 'ar', pa: 'lo' }],
    sv: [{ t: 100, p: 1, i: 0, f: 'bq', v: 0 }, { t: 100, p: 1, i: 0, f: 'nd', v: 3 }, { t: 120, p: 1, i: 1, f: 'yy', v: 2 }, { t: 130, p: 1, i: 0, f: 'q1', v: 4 }, { t: 140, p: 1, i: 0, f: 'cm', v: 1 }] };
  ({ ctx, p } = await open(b, 390, 763, true, null, { 'corner-reach-matches': JSON.stringify({ rold1: oldM }), 'corner-reach-current': JSON.stringify('rold1') }));
  m = await MM(p);
  const cv = m.sv.map(s => s.f + ':' + s.v + (s.o != null ? '/' + s.o : '')).join(' ');
  check(m.pv === 1 && cv === 'bq:65/0 nd:70/3 yy:20/2 q1:90/4 cm:1', 'v1 options become percents, the old option kept in o (' + cv + ')');
  await p.click('#qbArch'); await p.click('#card [data-a="wtab"][data-v="stats"]');
  const ws2 = await txt(p, '#card');
  check(ws2.indexOf('第一部分：球权') >= 0 && ws2.indexOf('65–100%') >= 0 && ws2.indexOf('60–75%') >= 0, 'warehouse stats group the percents into ranges');
  await p.click('#card [data-a="wtab"][data-v="back"]'); await p.click('#card [data-a="import"]');
  const old2 = JSON.parse(JSON.stringify(oldM)); old2.id = 'rold2'; old2.h = '旧主二';
  await p.fill('#impText', JSON.stringify({ app: '角球到达与选择', fmt: 1, matches: [old2] })); await p.click('#card [data-a="imptext"]');
  const im2 = await S(p, () => { const s = window.__reach.store().rold2; return s ? s.sv.map(x => x.f + ':' + x.v).join(' ') : null; });
  check(im2 === 'bq:65 nd:70 yy:20 q1:90 cm:1', 'importing a v1 export converts it too (' + im2 + ')');
  console.log('migration errors:', p.errs.length ? p.errs.join('\n') : 'none'); if (p.errs.length) fails++;
  await ctx.close();

  // ================= B. iPad and phone sizes =================
  for (const [w, h, mob, tag, pip] of [[1180, 820, false, 'iPad landscape'], [820, 1180, false, 'iPad portrait'], [1133, 744, false, 'iPad mini landscape'], [375, 667, true, 'small phone'], [414, 896, true, 'large phone'], [390, 763, true, 'phone + PiP', { pos: 'top', h: 190 }], [375, 667, true, 'small phone + PiP', { pos: 'bot', h: 150 }]]){
    ({ ctx, p } = await open(b, w, h, mob, pip));
    await p.fill('#fH', '浦和红钻'); await p.fill('#fA', '大阪钢巴');
    await p.click('#runBtn'); await p.clock.runFor(4 * 60000);
    await chain(p, 0, 'xisc'); await chain(p, 1, 'li');
    await S(p, () => { const R = window.__reach, M = R.M; M.sv.push({ t: 200, p: 1, i: 0, f: 'bq', v: 55, k: 9001, g: 1 }, { t: 200, p: 1, i: 1, f: 'bq', v: 45, k: 9002, g: 1 }, { t: 200, p: 1, i: 0, f: 'nd', v: 30, k: 9003 }, { t: 200, p: 1, i: 0, f: 'yy', v: 70, k: 9004 }); R.MODEL.min = 1; R.render(); });
    check((await S(p, () => window.__reach.MN.r.bet && window.__reach.MN.r.bet.k)) === 'hc', tag + ': banner shows 投角球让球 with the team name');
    await tapAr(p, 0); await p.clock.runFor(1000);
    const r = await layout(p, tag + ' (choices open)');
    check(r.low <= r.strip + 1 && r.minK >= 30, tag + ': keys fit above the bottom bar, smallest key ' + Math.round(r.minK) + 'px');
    await pick(p, 0, 'x');
    await layout(p, tag + ' (内／外)');
    await pick(p, 0, 'i');
    await layout(p, tag + ' (禁区射门／解围)');
    const slug = tag.replace(/\W+/g, '_');
    await p.screenshot({ path: `${out}/t_${slug}.png` });
    if (!mob){
      const st2 = (await txt(p, '#stats')).replace(/ /g, '');
      check(st2.indexOf('2到达次数1') >= 0, tag + ': stats beside the keys update right away');
      const ov = await S(p, () => { const a = document.querySelector('.pad[data-i="0"]').getBoundingClientRect(), m = document.querySelector('#mid').getBoundingClientRect(); return !(a.right <= m.left + 1 || a.bottom <= m.top + 1 || m.bottom <= a.top + 1); });
      check(!ov, tag + ': stats and keys do not overlap');
    }
    await p.click('#mseg [data-v="q"]');
    const rq = await layout(p, tag + ' (two questions)');
    if (mob) check(rq.low <= rq.strip + 1, tag + ': two questions fit without scrolling');
    await p.screenshot({ path: `${out}/t_${slug}_q.png` });
    console.log(tag + ' errors:', p.errs.length ? p.errs.join('\n') : 'none'); if (p.errs.length) fails++;
    await ctx.close();
  }
  await b.close();
  console.log(fails ? fails + ' FAILED' : 'ALL OK');
  process.exit(fails ? 1 : 0);
})();
