const { chromium } = require('/opt/node-tools/node_modules/playwright');
const [base, out] = process.argv.slice(2);
let fails = 0; const check = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  for (const [w, h, mob, tag] of [[390, 844, true, 'phone'], [1180, 820, false, 'ipad']]){
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: mob, hasTouch: mob, serviceWorkers: 'block', colorScheme: 'dark' });
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await p.goto(base + '/index.html');
    await p.fill('#fH', '鹿岛鹿角'); await p.fill('#fA', '横滨水手');
    await p.click('[data-a="mode"][data-v="q"]');
    check(await p.isVisible('#tips .tipbar'), tag + ' tips bar visible');
    // set current q1 home by clicking on slider at 70%
    const sl = '.pad[data-i="0"] .qcard:nth-of-type(1) .sl';
    const box = await p.$eval('.pad[data-i="0"] .qcard .sl-t', e => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top + r.height/2, w: r.width }; });
    await p.mouse.click(box.x + box.w * 0.7, box.y);
    await p.click('.pad[data-i="0"] [data-a="qsel"][data-x="0_q1"][data-v="1"]');
    check(await p.$eval('.pad[data-i="0"] .qcard', e => e.classList.contains('pot')), tag + ' card in potential mode');
    const box2 = await p.$eval('.pad[data-i="0"] .qcard .sl-t', e => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top + r.height/2, w: r.width }; });
    await p.mouse.click(box2.x + box2.w * 0.9, box2.y);
    const sv = await p.evaluate(() => { const M = window.__reach.M; return M.sv.map(s => s.f + ':' + s.v); });
    check(sv.some(s => s.startsWith('q1:')) && sv.some(s => s.startsWith('q1p:')), tag + ' both q1 and q1p recorded ' + sv.join(','));
    check(await p.$eval('.pad[data-i="0"] .qcard .sl-g', e => !!e), tag + ' ghost shown');
    // note
    await p.click('.pad[data-i="0"] [data-a="qnote"][data-x="0_q2"]');
    await p.fill('.qnta[data-x="0_q2"]', '边路速度快');
    await p.click('#tips .tipbar');
    await p.fill('#tipTa', '1. 先看能不能到禁区附近\n2. 落后时传中会变多');
    await p.click('body', { position: { x: 5, y: 5 } });
    await p.waitForTimeout(400);
    const qn = await p.evaluate(() => window.__reach.M.qn);
    check(qn && qn['0_q2'] === '边路速度快', tag + ' note saved');
    await p.screenshot({ path: `${out}/${tag}_v6open.png` });
    await p.click('#tips [data-a="tips"]');
    await p.click('.pad[data-i="0"] [data-a="qnote"][data-x="0_q2"]');
    check(await p.$eval('.qnb[data-x="0_q2"]', e => e.classList.contains('has')), tag + ' note dot');
    await p.screenshot({ path: `${out}/${tag}_v6.png` });
    await p.reload(); await p.waitForTimeout(300);
    check((await p.textContent('#tips .tipt')).includes('先看能不能'), tag + ' tips persist after reload');
    check(await p.$eval('.pad[data-i="0"] .qcard', e => e.classList.contains('pot')), tag + ' potential selection persists');
    console.log(tag, 'errors:', errs.join(' | ') || 'none');
    await ctx.close();
  }
  await b.close(); console.log('fails', fails);
})();
