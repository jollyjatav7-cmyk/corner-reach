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
async function open(b, w, h, mob, pip){
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: mob, hasTouch: mob, serviceWorkers: 'block' });
  if (pip) await ctx.addInitScript(x => localStorage.setItem('corner-reach-pip', JSON.stringify(x)), pip);
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
async function layout(p, tag){
  const r = await S(p, () => {
    const de = document.documentElement, bad = [];
    for (const el of document.querySelectorAll('.k .l, .k .c, .qlv small, .qlv b, .p1s b, .p1s em, .mr-t .v, .sgb i, .qck, .sth .tm, .stf button, .mseg button, .undo')){
      const cs = getComputedStyle(el); if (cs.display === 'none' || !el.offsetParent) continue;
      if (el.scrollWidth > el.clientWidth + 1 && cs.textOverflow !== 'ellipsis') bad.push(el.className + ':' + el.textContent.trim().slice(0, 12));
    }
    const strip = document.querySelector('#strip').getBoundingClientRect();
    let low = 0; for (const el of document.querySelectorAll('.pad .board, .pad .qcard, .pad .endc')){ const b = el.getBoundingClientRect(); if (b.height) low = Math.max(low, b.bottom); }
    const ks = [...document.querySelectorAll('.pad .k, .pad .qlv button')].filter(x => x.offsetParent).map(x => x.getBoundingClientRect().height);
    return { sw: de.scrollWidth, cw: de.clientWidth, bad: bad, low: low, strip: strip.top, minK: ks.length ? Math.min.apply(null, ks) : 0 };
  });
  check(r.sw <= r.cw, tag + ': no sideways scroll (' + r.sw + '/' + r.cw + ')');
  check(!r.bad.length, tag + ': all labels fit their buttons' + (r.bad.length ? ' ' + JSON.stringify(r.bad.slice(0, 6)) : ''));
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
  // 10. part one
  await p.click('.pad[data-i="0"] [data-a="p1"][data-f="bq"]');
  await p.click('#card [data-a="p1v"][data-f="bq"][data-v="0"]');
  await p.clock.runFor(5000);
  await p.click('#card [data-a="p1v"][data-f="bq"][data-v="1"]');
  m = await MM(p);
  let bq = m.sv.filter(s => s.i === 0 && s.f === 'bq');
  check(bq.length === 1 && bq[0].v === 1, 'changing again within 20 s corrects the same record (' + JSON.stringify(bq.map(s => s.v)) + ')');
  await p.clock.runFor(40000);
  await p.click('#card [data-a="p1v"][data-f="bq"][data-v="1"]');
  m = await MM(p); bq = m.sv.filter(s => s.i === 0 && s.f === 'bq');
  check(bq.length === 2 && bq[1].v === null, 'tapping the chosen option later cancels it with a new timestamped record');
  await p.click('#card [data-a="p1v"][data-f="nd"][data-v="3"]');
  await p.click('#card [data-a="p1v"][data-f="cm"][data-v="0"]');
  await p.click('#card [data-a="p1side"][data-v="1"]');
  await p.click('#card [data-a="p1v"][data-f="yy"][data-v="2"]');
  await p.screenshot({ path: `${out}/t_phone_p1.png` });
  await p.click('#card [data-a="close"]');
  const p1t = [await txt(p, '.pad[data-i="0"] .p1s'), await txt(p, '.pad[data-i="1"] .p1s')];
  check(p1t[0].replace(/ /g, '') === '球权未选难度勉强进意愿未选场面包饺子' && p1t[1].replace(/ /g, '') === '球权未选难度未选意愿弱场面未选', 'summaries show the current part-one choices: ' + p1t.join(' | '));
  // the sheet scrolls to the factor you tap
  await p.click('.pad[data-i="1"] [data-a="p1"][data-f="cm"]');
  const vis = await S(p, () => { const g = document.getElementById('p1g-cm').getBoundingClientRect(), c = document.getElementById('card').getBoundingClientRect(); return g.bottom <= c.bottom + 1 && g.top >= c.top - 1; });
  check(vis, 'tapping 场面 opens the sheet with 场面 in view');
  await p.click('#card [data-a="close"]');
  // 11. the two questions
  await p.click('#mseg [data-v="q"]');
  check(await p.isVisible('.pad[data-i="0"] .qcard') && !(await p.isVisible('.pad[data-i="0"] [data-a="ar"]')), 'two-questions mode replaces the arrival keys');
  await p.click('.pad[data-i="0"] [data-a="qv"][data-f="q1"][data-v="3"]');
  await p.click('.pad[data-i="1"] [data-a="qv"][data-f="q2"][data-v="1"]');
  await p.clock.runFor(30000);
  await p.click('.pad[data-i="0"] [data-a="qv"][data-f="q1"][data-v="4"]');
  m = await MM(p);
  const q1 = m.sv.filter(s => s.i === 0 && s.f === 'q1').map(s => s.v).join(',');
  check(q1 === '3,4', 'each answer is a timestamped record (' + q1 + ')');
  check((await txt(p, '.pad[data-i="0"] .qcard .qnote')).indexOf('（之前 4）') >= 0 && (await p.getAttribute('.pad[data-i="0"] [data-f="q1"][data-v="4"]', 'aria-pressed')) === 'true', 'the chosen level is highlighted and the note shows the previous one');
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
  check(st.indexOf(xl(H) + '传中＋远射占比' + xl(A)) >= 0, 'stats: 传中＋远射 share ' + xl(H) + ' vs ' + xl(A));
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
  check(o.app === '角球到达与选择' && o.matches.length === 1 && o.matches[0].ev.length === nEv && o.matches[0].sv.length === nSv && o.tree.xisc === '传中 › 内 › 禁区射门 › 角球', 'JSON export: all events, choices and the path legend');
  await p.click('#card [data-a="close"]');
  await p.click('#qbArch'); await p.click('#card [data-a="wtab"][data-v="back"]'); await p.click('#card [data-a="expcsv"]');
  const csv = (await p.$eval('#expText', el => el.value)).replace(/^﻿/, '').split('\n');
  check(csv.length === nEv + 1 && csv[0].indexOf('完整路径') >= 0 && csv[0].indexOf('球权') >= 0 && csv.some(l => l.indexOf('有很大难度但勉强进得去') >= 0), 'CSV: one row per event with the part-one state at that time (' + (csv.length - 1) + ' rows, ' + nEv + ' events)');
  await p.click('#card [data-a="close"]');
  await p.click('#qbArch'); await p.click('#card [data-a="wtab"][data-v="back"]'); await p.click('#card [data-a="expcsvh"]');
  const csvh = (await p.$eval('#expText', el => el.value)).split('\n');
  check(csvh.length >= 3 && csvh[0].indexOf('传中远射占比') >= 0, 'CSV per team-half: ' + (csvh.length - 1) + ' rows');
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

  // ================= B. iPad and phone sizes =================
  for (const [w, h, mob, tag, pip] of [[1180, 820, false, 'iPad landscape'], [820, 1180, false, 'iPad portrait'], [1133, 744, false, 'iPad mini landscape'], [375, 667, true, 'small phone'], [414, 896, true, 'large phone'], [390, 763, true, 'phone + PiP', { pos: 'top', h: 190 }], [375, 667, true, 'small phone + PiP', { pos: 'bot', h: 150 }]]){
    ({ ctx, p } = await open(b, w, h, mob, pip));
    await p.fill('#fH', '浦和红钻'); await p.fill('#fA', '大阪钢巴');
    await p.click('#runBtn'); await p.clock.runFor(4 * 60000);
    await chain(p, 0, 'xisc'); await chain(p, 1, 'li');
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
