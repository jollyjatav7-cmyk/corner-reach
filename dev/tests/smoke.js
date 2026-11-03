// Quick look: open on phone and iPad, record a few arrivals, screenshot the screens.
// Usage: node smoke.js <base_url> <out_dir>
const { chromium } = require(process.env.PLAYWRIGHT || '/opt/node-tools/node_modules/playwright');
const [base, out] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch();
  for (const [w, h, mob, tag] of [[390, 763, true, 'phone'], [1180, 820, false, 'ipad'], [820, 1180, false, 'ipadP']]){
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: mob, hasTouch: mob, serviceWorkers: 'block' });
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', e => errs.push('pageerror ' + e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push('console ' + m.text()); });
    await p.clock.install({ time: new Date('2026-11-04T10:00:00Z') });
    await p.goto(base + '/index.html');
    await p.fill('#fH', '鹿岛鹿角'); await p.fill('#fA', '横滨水手');
    await p.click('#runBtn');
    await p.clock.runFor(5 * 60000);
    await p.screenshot({ path: `${out}/${tag}_0.png` });
    await p.click('.pad[data-i="0"] [data-a="ar"]');
    await p.clock.runFor(2300);
    await p.screenshot({ path: `${out}/${tag}_1open.png` });
    await p.click('.pad[data-i="0"] [data-a="pick"][data-v="x"]');
    await p.screenshot({ path: `${out}/${tag}_2cross.png` });
    await p.clock.runFor(400);
    await p.click('.pad[data-i="0"] [data-a="pick"][data-v="i"]');
    await p.clock.runFor(400);
    await p.click('.pad[data-i="0"] [data-a="pick"][data-v="s"]');
    await p.screenshot({ path: `${out}/${tag}_3shot.png` });
    await p.clock.runFor(400);
    await p.click('.pad[data-i="0"] [data-a="pick"][data-v="c"]');
    for (const [i, path] of [[1, 'li'], [1, 'b'], [0, 'mn'], [0, 'xo'], [1, 'xicn'], [0, 'g'], [0, 'lin']]){
      await p.click('.pad[data-i="' + i + '"] [data-a="ar"]');
      await p.clock.runFor(1500 + path.length * 700);
      for (const c of path){ await p.click('.pad[data-i="' + i + '"] [data-a="pick"][data-v="' + c + '"]'); await p.clock.runFor(400); }
      await p.clock.runFor(30000);
    }
    await p.screenshot({ path: `${out}/${tag}_4after.png` });
    if (mob){ await p.click('#qbStats'); await p.waitForTimeout(400); await p.screenshot({ path: `${out}/${tag}_5stats.png` }); await p.evaluate(() => { const m = document.querySelector('#mid'); m.scrollTop = m.scrollHeight; }); await p.screenshot({ path: `${out}/${tag}_6stats2.png` }); await p.click('[data-a="midclose"]'); await p.waitForTimeout(300); }
    else { await p.screenshot({ path: `${out}/${tag}_5full.png`, fullPage: true }); }
    const slide = async (sel, v) => { const r = await p.$eval(sel + ' .sl-t', el => { el.scrollIntoView({ block: 'center' }); const b = el.getBoundingClientRect(); return { x: b.left, y: b.top + b.height / 2, w: b.width }; }); await p.mouse.click(r.x + r.w * v / 100, r.y); await p.clock.runFor(300); };
    await p.click('.pad[data-i="0"] [data-a="p1"]');
    await slide('#card .sl[data-x="bq"]', 60); await slide('#card .sl[data-x="nd"]', 70);
    await p.screenshot({ path: `${out}/${tag}_7p1.png` });
    await p.click('#card [data-a="close"]');
    await p.click('#mseg [data-v="q"]');
    await slide('.pad[data-i="0"] .sl[data-x="0_q1"]', 70);
    await slide('.pad[data-i="1"] .sl[data-x="1_q2"]', 30);
    await p.screenshot({ path: `${out}/${tag}_8q.png` });
    console.log(tag, 'errors:', errs.length ? errs.join('\n') : 'none');
    console.log(tag, JSON.stringify(await p.evaluate(() => window.__reach.M.ev.map(e => e.c + ':' + (e.pa || '') + ':' + (e.dt || '')))));
    await ctx.close();
  }
  await b.close();
})();
