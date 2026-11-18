// 角球公式: the formula, the bars, the results of both teams on one page, the league average line,
// records, export and layouts. Usage: node uitest_v7.js <base_url> <out_dir>
const { chromium } = require(process.env.PLAYWRIGHT || '/opt/node-tools/node_modules/playwright');
const [base, out] = process.argv.slice(2);
let fails = 0;
const check = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const txt = async (p, sel) => (await p.textContent(sel)).replace(/\s+/g, ' ').trim();
// the formula written out again here, on purpose not using the app's own code
const index = (x, y, h, a, b) => x * (y / 100 + (1 - y / 100 - h / 100) / (1 + 3 * a * b));
const MM = p => p.evaluate(() => JSON.parse(JSON.stringify(window.__reach.M)));
const cur = (m, i, f) => { let b = null; for (const s of m.sv) if (s.i === i && s.f === f && (!b || s.k > b.k)) b = s; return b ? b.v : null; };
async function open(b, w, h, mob, extra){
  const ctx = await b.newContext(Object.assign({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: mob, hasTouch: mob, serviceWorkers: 'block', acceptDownloads: true }, extra || {}));
  const p = await ctx.newPage(); p.errs = [];
  p.on('pageerror', e => p.errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') p.errs.push(m.text()); });
  await p.goto(base + '/index.html');
  await p.fill('#fH', '鹿岛鹿角'); await p.fill('#fA', '横滨水手');
  await p.click('#mseg [data-v="f"]');
  return { ctx, p };
}
const sl = (i, f) => '.pad[data-i="' + i + '"] .sl[data-x="' + i + '_' + f + '"]';
const RANGE = { fx: [0, 80], fy: [0, 100], fh: [0, 100], fa: [0, 2], fb: [0, 2] };
async function rect(p, sel){ return p.$eval(sel + ' .sl-t', el => { el.scrollIntoView({ block: 'nearest' }); const b = el.getBoundingClientRect(); return { x: b.left, y: b.top + b.height / 2, w: b.width }; }); }
async function set(p, i, f, v){ const R = RANGE[f], r = await rect(p, sl(i, f)); await p.mouse.click(r.x + r.w * (v - R[0]) / (R[1] - R[0]), r.y); await p.waitForTimeout(40); }
// put an exact value by walking with the keyboard from a click nearby
async function exact(p, i, f, v){
  await set(p, i, f, v);
  for (let n = 0; n < 12; n++){
    const now = +(await p.getAttribute(sl(i, f), 'data-v')); if (Math.abs(now - v) < 1e-6) return;
    await p.focus(sl(i, f)); await p.keyboard.press(now < v ? 'ArrowRight' : 'ArrowLeft'); await p.waitForTimeout(30);
  }
}
async function team(p, i, vals){ for (const f in vals) await exact(p, i, f, vals[f]); }
const seed = (p, rows) => p.evaluate(rows => { const M = window.__reach.M; M.sv = M.sv.filter(s => s.f[0] !== 'f'); for (const r of rows) window.__reach.pickQ(r[0], r[1], r[2]); window.__reach.render(); }, rows);
const row = (i, o) => Object.keys(o).map(f => [i, f, o[f]]);

(async () => {
  const b = await chromium.launch();

  // ================= A. iPad: both teams side by side =================
  { const { ctx, p } = await open(b, 1180, 820, false);
    check((await p.$$('#mseg button')).length === 4 && (await p.getAttribute('#mseg [data-v="f"]', 'aria-pressed')) === 'true', 'the formula program sits beside 两个问题 in the switch');
    for (const i of [0, 1]) check((await p.$$('.pad[data-i="' + i + '"] .sl')).length === 5 && await p.isVisible(sl(i, 'fx')), 'team ' + i + ': five sliders');
    check(!(await p.$('.pad input[type="number"], .pad input[type="text"]')), 'no typing: every value is a slider');
    check(!(await p.isVisible('#mBan')) && await p.isVisible('#fres'), 'the result panel replaces the model banner');
    check((await txt(p, '#frj')).indexOf('拖动') >= 0 && (await txt(p, '#frv0')) === '—', 'before any input the panel asks for the sliders');
    check((await txt(p, '#fv_0_fa')) === '默认 1' && (await txt(p, '#fv_0_fx')) === '未设', 'a and b start from the league average, x y h are required');

    await team(p, 0, { fx: 20, fy: 60, fh: 20 });
    check((await txt(p, '#frv0')) === '13.0', 'home 20 / 60% / 20% with a=b=1 → 13.0 (' + await txt(p, '#frv0') + ')');
    check((await txt(p, '#frj')).indexOf('等另一队') >= 0, 'one team filled: waits for the other team');
    await team(p, 1, { fx: 12, fy: 50, fh: 30, fa: 1.5, fb: 2 });
    check((await txt(p, '#frv1')) === '6.2', 'away 12 / 50% / 30% with a=1.5 b=2 → 6.24 shown as 6.2 (' + await txt(p, '#frv1') + ')');
    check((await txt(p, '#frr')).replace(/\s/g, '') === '2.08倍', 'the ratio of the two teams is 2.08 (' + await txt(p, '#frr') + ')');
    check((await txt(p, '#frj')).indexOf('判断：鹿岛鹿角 角球更多') >= 0, 'at 2 times or more it names the team (' + await txt(p, '#frj') + ')');
    check((await txt(p, '#fcalc_0')).indexOf('传中远射 12.0 ＋ 中路打门 1.0 ＝ 13.0') >= 0 && (await txt(p, '#fcalc_0')).indexOf('25%') >= 0, 'the working of the sum is shown (' + await txt(p, '#fcalc_0') + ')');
    check((await txt(p, '#fmix_1')).replace(/\s/g, '') === '传中远射50%中路渗透20%回传30%', 'the three choices add to 100% (' + await txt(p, '#fmix_1') + ')');
    await p.screenshot({ path: `${out}/v7_ipad.png` });

    // the formula against an independent calculation
    let bad = [];
    const cases = [[20, 60, 20, 1, 1], [12, 50, 30, 1.5, 2], [33, 25, 40, 0.5, 0.7], [7, 100, 0, 2, 2], [60, 0, 0, 0, 0], [45.0, 10, 90, 1.3, 1.1], [0, 40, 30, 1, 1], [80, 35.5, 12.5, 0.9, 1.7]];
    for (const c of cases){
      await seed(p, row(0, { fx: c[0], fy: c[1], fh: c[2], fa: c[3], fb: c[4] }).concat(row(1, { fx: 10, fy: 50, fh: 25 })));
      const got = await txt(p, '#frv0'), want = index(c[0], c[1], c[2], c[3], c[4]).toFixed(1);
      if (got !== want) bad.push(c.join('/') + ' got ' + got + ' want ' + want);
    }
    check(!bad.length, 'the index equals the formula in ' + cases.length + ' independent cases ' + bad.join('; '));

    // the verdict
    const verdict = async (h, a) => { await seed(p, row(0, h).concat(row(1, a))); return txt(p, '#frj'); };
    check((await verdict({ fx: 20, fy: 100, fh: 0 }, { fx: 10, fy: 100, fh: 0 })).indexOf('判断：鹿岛鹿角') >= 0, 'exactly 2 times counts');
    check((await verdict({ fx: 19, fy: 100, fh: 0 }, { fx: 10, fy: 100, fh: 0 })).indexOf('相差不到 2 倍') >= 0, '1.9 times: no call');
    check((await verdict({ fx: 10, fy: 100, fh: 0 }, { fx: 30, fy: 100, fh: 0 })).indexOf('判断：横滨水手') >= 0, 'the away team can be named too');
    check((await verdict({ fx: 10, fy: 100, fh: 0 }, { fx: 10, fy: 100, fh: 0 })).indexOf('两队一样') >= 0, 'level: no call');
    check((await verdict({ fx: 0, fy: 50, fh: 0 }, { fx: 0, fy: 50, fh: 0 })).indexOf('两队一样') >= 0, 'both zero: no call and no error');
    check((await verdict({ fx: 10, fy: 50, fh: 0 }, { fx: 0, fy: 50, fh: 0 })).indexOf('判断：鹿岛鹿角') >= 0 && (await txt(p, '#fres')).indexOf('Infinity') < 0, 'the other team at zero: names the team without a broken number');

    // cross + long shots + back passes cannot pass 100%
    await seed(p, []);
    await exact(p, 0, 'fy', 70);
    await set(p, 0, 'fh', 90);
    let m = await MM(p);
    check(cur(m, 0, 'fh') === 30 && (await txt(p, '#fv_0_fh')) === '30%', 'back passes stop at 100% minus crosses and long shots (' + cur(m, 0, 'fh') + ')');
    await set(p, 0, 'fy', 95);
    m = await MM(p);
    check(cur(m, 0, 'fy') === 70, 'and the other bar stops at the same limit (' + cur(m, 0, 'fy') + ')');
    await p.focus(sl(0, 'fy')); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(40);
    check((await MM(p)).sv.filter(s => s.f === 'fy').slice(-1)[0].v === 70, 'the keyboard cannot pass the limit either');
    const left = await p.$eval(sl(0, 'fh') + ' .sl-c', e => e.style.left);
    check(left === '30%', 'the part of the bar that cannot be reached is marked (' + left + ')');
    await p.click('.pad[data-i="0"] .slw:has(.sl[data-x="0_fh"]) .slb[data-sb="1"]');
    await p.waitForTimeout(40);
    check(cur(await MM(p), 0, 'fh') === 30, 'the + button stops at the limit');

    // the league average line
    await seed(p, row(0, { fx: 20, fy: 60, fh: 20 }).concat(row(1, { fx: 12, fy: 50, fh: 30, fa: 1.5, fb: 2 })));
    check((await txt(p, '.fra')).indexOf('设联赛平均') >= 0 && !(await p.$('#frg0')), 'without a league average there is no above/below tag');
    await p.click('.fra');
    const av = async (k, v, hi) => { const r = await p.$eval('#card .sl[data-x="' + k + '"] .sl-t', el => { el.scrollIntoView({ block: 'center' }); const b = el.getBoundingClientRect(); return { x: b.left, y: b.top + b.height / 2, w: b.width }; }); await p.mouse.click(r.x + r.w * v / hi, r.y); await p.waitForTimeout(60); for (let n = 0; n < 10; n++){ const now = +(await p.getAttribute('#card .sl[data-x="' + k + '"]', 'data-v')); if (now === v) break; await p.focus('#card .sl[data-x="' + k + '"]'); await p.keyboard.press(now < v ? 'ArrowRight' : 'ArrowLeft'); await p.waitForTimeout(40); } };
    await av('x', 15, 80); await av('y', 50, 100); await av('h', 25, 100);
    check((await txt(p, '#favLine')).replace(/\s/g, '').indexOf('联赛平均线8.4') >= 0, 'league line 15 / 50% / 25% = 8.4 (' + await txt(p, '#favLine') + ')');
    await p.screenshot({ path: `${out}/v7_ipad_avg.png` });
    await p.click('#card [data-a="close"]');
    check((await txt(p, '#frg0')) === '高于平均' && (await txt(p, '#frg1')) === '低于平均', '13.0 is above and 6.2 below the line of 8.4');
    await seed(p, row(0, { fx: 15, fy: 50, fh: 25 }).concat(row(1, { fx: 17, fy: 50, fh: 25 })));
    check((await txt(p, '#frg0')) === '接近平均' && (await txt(p, '#frg1')) === '高于平均', 'within 10% is near the average; beyond 10% is above (' + await txt(p, '#frv1') + ')');
    await seed(p, row(0, { fx: 20, fy: 60, fh: 20 }).concat(row(1, { fx: 12, fy: 50, fh: 30, fa: 1.5, fb: 2 })));
    await p.screenshot({ path: `${out}/v7_ipad_tags.png` });

    // records: undo, list, edit
    await seed(p, []);
    await p.waitForTimeout(40);
    await exact(p, 0, 'fx', 24);
    await p.click('#qbList');
    check((await txt(p, '#card .list')).indexOf('公式·到达次数 → 24 次') >= 0, 'the record list shows the value with its unit (24 次)');
    await p.click('#card .list button');
    const hi = await p.getAttribute('#card .sl', 'data-hi');
    check(hi === '80' && (await p.getAttribute('#card .sl', 'data-st')) === '1', 'editing a record keeps the slider range of that item (0–80, step 1)');
    await p.keyboard.press('Escape');
    await p.click('#qbUndo'); await p.waitForTimeout(40);
    check(cur(await MM(p), 0, 'fx') === null && (await txt(p, '#fv_0_fx')) === '未设', 'bottom 撤销 removes the last bar');

    // hide numbers: bars hide their numbers, the result stays
    await seed(p, row(0, { fx: 20, fy: 60, fh: 20 }).concat(row(1, { fx: 12, fy: 50, fh: 30 })));
    await p.click('#numBtn'); await p.waitForTimeout(60);
    check(!/\d/.test(await txt(p, '#fv_0_fx')) && !/\d/.test(await txt(p, '#fmix_0')) && (await txt(p, '#frv0')) === '13.0', 'hide numbers hides the bar values but keeps the result');
    await p.click('#numBtn'); await p.waitForTimeout(60);

    // saved across a reload
    await p.waitForTimeout(450); await p.reload(); await p.waitForTimeout(150);
    check(await p.isVisible('#fres') && (await txt(p, '#frv0')) === '13.0', 'the program and its values survive a reload');
    check(await p.evaluate(() => JSON.stringify(window.__reach.FAVG)) === '{"x":15,"y":50,"h":25}' && (await txt(p, '.fra')).indexOf('8.4') >= 0, 'the league average stays for every match');

    // export
    await p.click('#qbMenu'); await p.click('#card [data-a="exp1"]'); await p.waitForTimeout(100);
    const js = await p.evaluate(() => { const t = document.querySelector('#card textarea'); return t ? t.value : null; });
    if (js){ const o = JSON.parse(js);
      check(o.ver === 'v7' && o.sv.fx.u === '次' && o.sv.fy.u === '%' && o.sv.fa.u === '' && o.favg.x === 15 && o.matches[0].sv.some(s => s.f === 'fx' && s.v === 20), 'JSON export carries the bars, their units and the league average');
      check(o.readme.indexOf('fx 到达次数') >= 0 && o.readme.indexOf('z＝1÷(1+3×a×b)') >= 0, 'the export explains the formula');
    } else check(false, 'export text not found');
    await p.keyboard.press('Escape');
    check(!p.errs.length, 'iPad: no errors ' + p.errs.join(' | '));
    await ctx.close();
  }

  // ================= B. phone: one team at a time, both results always on top =================
  { const { ctx, p } = await open(b, 390, 763, true);
    check(await p.isVisible(sl(0, 'fx')) && !(await p.isVisible(sl(1, 'fx'))), 'phone: the sliders of one team at a time');
    await seed(p, row(0, { fx: 20, fy: 60, fh: 20 }));
    await p.tap('.pad[data-i="0"] .fsw .a'); await p.waitForTimeout(60);
    check(await p.isVisible(sl(1, 'fx')) && !(await p.isVisible(sl(0, 'fx'))), 'tapping the other team name switches to its sliders');
    check((await txt(p, '#frv0')) === '13.0' && await p.isVisible('#frv0') && await p.isVisible('#frv1'), 'both results stay on the same page');
    // finger drag: the result moves while dragging, the record is written on release
    const r = await rect(p, sl(1, 'fy')), cdp = await ctx.newCDPSession(p), X = v => Math.round(r.x + r.w * v / 100);
    await seed(p, row(0, { fx: 20, fy: 60, fh: 20 }).concat(row(1, { fx: 12, fy: 50, fh: 30 })));
    const r2 = await rect(p, sl(1, 'fy'));
    const before = await txt(p, '#frv1');
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: X(50), y: r2.y }] });
    for (let k = 1; k <= 6; k++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: X(50 + 3 * k), y: r2.y + 1 }] });
    await p.waitForTimeout(60);
    const during = await txt(p, '#frv1'), rec = cur(await MM(p), 1, 'fy');
    check(during !== before && during === index(12, 68, 30, 1, 1).toFixed(1) && rec === 50, 'the result updates live while dragging (' + before + ' → ' + during + '), nothing is recorded yet');
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: X(90), y: r2.y + 1 }] });
    await p.waitForTimeout(40);
    check((await txt(p, '#fv_1_fy')) === '70%', 'dragging past the limit stops at 70% (' + await txt(p, '#fv_1_fy') + ')');
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await cdp.detach(); await p.waitForTimeout(120);
    check(cur(await MM(p), 1, 'fy') === 70, 'on release the value is recorded (70%)');
    await p.screenshot({ path: `${out}/v7_phone.png` });
    await p.tap('.pad[data-i="1"] [data-a="ck"]'); await p.waitForTimeout(80);
    check((await txt(p, '#ckA')) === '角球 1', 'the corner pill works here too');
    await p.click('#mseg [data-v="q"]');
    check(await p.isVisible('.pad[data-i="0"] .qcard') && await p.isVisible('.pad[data-i="1"] .qcard') && !(await p.isVisible('#fres')), 'two questions is untouched: both teams on screen, no formula panel');
    const m = await MM(p);
    check(!m.sv.some(s => s.f === 'q1' || s.f === 'g1'), 'the formula bars do not write into the other programs');
    await p.click('#mseg [data-v="f"]');
    // finished match
    await p.evaluate(() => { window.__reach.M.st = 2; window.__reach.render(); });
    check(!(await p.isVisible('#fres')) && await p.isVisible('.endc'), 'a finished match shows the end card instead');
    check(!p.errs.length, 'phone: no errors ' + p.errs.join(' | '));
    await ctx.close();
  }

  // ================= C. every screen size =================
  const SZ = [[390, 763, 1, 0], [375, 647, 1, 0], [360, 640, 1, 0], [414, 808, 1, 0], [320, 548, 1, 0], [390, 763, 1, 1], [1180, 820, 0, 0], [1024, 768, 0, 0], [820, 1180, 0, 0], [744, 1133, 0, 0], [1366, 1024, 0, 0]];
  for (const [w, h, mob, pip] of SZ){
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: !!mob, hasTouch: !!mob, serviceWorkers: 'block' });
    if (pip) await ctx.addInitScript(() => localStorage.setItem('corner-reach-pip', JSON.stringify({ pos: 'top', h: 190 })));
    await ctx.addInitScript(() => localStorage.setItem('corner-reach-favg', JSON.stringify({ x: 15, y: 50, h: 25 })));
    const p = await ctx.newPage(); await p.goto(base + '/index.html');
    await p.fill('#fH', '名字很长的鹿岛鹿角足球俱乐部'); await p.fill('#fA', '名字很长的横滨水手足球俱乐部'); await p.click('#mseg [data-v="f"]');
    await seed(p, row(0, { fx: 80, fy: 60, fh: 20, fa: 1.2, fb: 0.8 }).concat(row(1, { fx: 33, fy: 50, fh: 30, fa: 1.5, fb: 2 })));
    await p.waitForTimeout(60);
    const r = await p.evaluate(() => {
      const de = document.documentElement, pad = document.querySelector('.pad:not([style*="none"]) .fcard').closest('.pad'), bad = [];
      for (const el of document.querySelectorAll('.frg,.frj,.fra,.frr,.frv,.fval,.fw,.fmt span,.fab,#mseg button')){ if (el.offsetParent && el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).textOverflow !== 'ellipsis') bad.push(el.className + ':' + el.textContent.slice(0, 8)); }
      const box = el => el.getBoundingClientRect();
      const a = box(document.querySelector('.frs.h')), m = document.querySelector('#frr') ? box(document.querySelector('#frr')) : null, c = box(document.querySelector('.frs.a'));
      for (const s of document.querySelectorAll('.frs')){ const inner = s.querySelector('.frx'); if (inner.scrollWidth > inner.clientWidth + 1) bad.push('result overflows ' + inner.textContent.slice(0, 12)); }
      if (m && (a.right > m.left + 1 || c.left < m.right - 1)) bad.push('result overlaps the ratio');
      const vis = [...document.querySelectorAll('.pad .sl')].filter(e => e.offsetParent);
      const small = vis.filter(e => box(e).height < 30).length;
      const tr = Math.min(...vis.map(e => box(e.querySelector('.sl-t')).width));
      const res = box(document.querySelector('#fres'));
      return { side: de.scrollWidth - de.clientWidth, bad, small, tr: Math.round(tr), n: vis.length, padOver: pad.scrollHeight - pad.clientHeight, pageOver: de.scrollHeight - innerHeight, resTop: Math.round(res.top), resBot: Math.round(res.bottom) };
    });
    const tag = w + 'x' + h + (pip ? ' floating video' : '');
    check(r.side <= 0, tag + ': no sideways scroll');
    check(!r.bad.length, tag + ': all labels and results fit ' + JSON.stringify(r.bad.slice(0, 5)));
    check(r.small === 0 && r.tr >= 80, tag + ': sliders are usable (track ' + r.tr + 'px)');
    check(r.n === (mob ? 5 : 10), tag + ': ' + r.n + ' sliders on screen');
    check(r.resTop >= 0 && r.resBot <= h, tag + ': the results of both teams are on screen');
    if (w !== 320) check(r.padOver <= 6 && r.pageOver <= 12, tag + ': all five bars fit without scrolling (pad ' + r.padOver + ', page ' + r.pageOver + ')');
    if ([390, 375, 1180].indexOf(w) >= 0) await p.screenshot({ path: `${out}/v7_fit_${w}${pip ? 'p' : ''}.png` });
    await ctx.close();
  }
  await b.close();
  console.log(fails ? 'FAILS ' + fails : 'ALL OK');
})();
