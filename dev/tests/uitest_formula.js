// 角球公式: the formula, the single choice axis, both teams on one page, the comparison with the averages,
// records, export and layouts. Usage: node uitest_formula.js <base_url> <out_dir>
const { chromium } = require(process.env.PLAYWRIGHT || '/opt/node-tools/node_modules/playwright');
const [base, out] = process.argv.slice(2);
let fails = 0;
const check = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const txt = async (p, sel) => (await p.textContent(sel)).replace(/\s+/g, ' ').trim();
// the formula written out again here, on purpose not using the app's own code
const index = (x, y, h, a, b) => x * (y / 100 + (1 - y / 100 - h / 100) / (1 + 3 * a * b));
const crossPart = (x, y) => x * y / 100;
const centrePart = (x, y, h, a, b) => x * (1 - y / 100 - h / 100) / (1 + 3 * a * b);
const AVG = { cross: 50 * 33 / 100, centre: 50 * 33 / 100 / 4 }; AVG.total = AVG.cross + AVG.centre;   // arrival 50%, cross 33%, central 33%, a = b = 1
const pctOf = (v, avg) => { const r = (v / avg - 1) * 100, n = Math.round(Math.abs(r)); return { r, n, tx: (r < 0 && n ? '−' : '+') + n + '%' }; };
const TH0 = { hi: 25, lo: 30, gap: 2 };
const chip = (v, avg, th) => { const q = pctOf(v, avg), t = th || TH0, w = q.r > 0 && q.n >= t.hi ? '高于平均' : q.r < 0 && q.n >= t.lo ? '低于平均' : '接近平均'; return w + ' ' + q.tx; };
const levelOf = (s, th) => { const q = pctOf(s, AVG.total); return q.r > 0 && q.n >= th.hi ? 'b' : q.r < 0 && q.n >= th.lo ? 's' : 'm'; };
const finalChip = (s, th) => ({ b: '大角', s: '小角', m: '平均水平' })[levelOf(s, th || TH0)] + ' ' + pctOf(s, AVG.total).tx;
// the user's rules, written out again here on purpose (H and A are { fx, fy, fh, fa, fb })
const wantRec = (H, A, th) => {
  const sh = index(H.fx, H.fy, H.fh, H.fa, H.fb), sa = index(A.fx, A.fy, A.fh, A.fa, A.fb), x = levelOf(sh, th), y = levelOf(sa, th), w = { b: '大角', s: '小角' };
  const top = sh > sa ? '鹿岛鹿角' : '横滨水手';
  if (x === 'b' && y === 'b') return '推荐大角';
  if (x === 's' && y === 's') return '推荐小角';
  if (x !== 'm' && y !== 'm') return '推荐让球' + top;
  if (x === 'm' && y === 'm') return '不推荐：两队都在平均水平';
  const one = x === 'm' ? y : x, lo = Math.min(sh, sa), ratio = lo > 0 ? Math.max(sh, sa) / lo : Infinity;
  if (+ratio.toFixed(2) >= th.gap) return '推荐让球' + top + '＋' + w[one];
  return '不推荐：一队' + w[one] + '、一队平均水平，差距不到' + (+th.gap.toFixed(1)) + '倍';
};
const MM = p => p.evaluate(() => JSON.parse(JSON.stringify(window.__reach.M)));
const cur = (m, i, f) => { let b = null; for (const s of m.sv) if (s.i === i && s.f === f && (!b || s.k > b.k)) b = s; return b ? b.v : null; };
const count = (m, f) => m.sv.filter(s => s.f === f).length;
async function open(b, w, h, mob, extra){
  const ctx = await b.newContext(Object.assign({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: mob, hasTouch: mob, serviceWorkers: 'block', acceptDownloads: true }, extra || {}));
  const p = await ctx.newPage(); p.errs = [];
  p.on('pageerror', e => p.errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') p.errs.push(m.text()); });
  await p.goto(base + '/index.html');
  await p.fill('#fH', '鹿岛鹿角'); await p.fill('#fA', '横滨水手');
  await p.click('#mseg [data-v="f"]');
  return { ctx, p };
}
const sl = (i, f) => '.pad .sl[data-x="' + i + '_' + f + '"]';
const TR = i => '.pad .tri[data-x="' + i + '"]';
const RANGE = { fx: [0, 100], fa: [0, 2], fb: [0, 2] };
async function rect(p, sel){ return p.$eval(sel + ' .sl-t', el => { el.scrollIntoView({ block: 'nearest' }); const b = el.getBoundingClientRect(); return { x: b.left, y: b.top + b.height / 2, w: b.width }; }); }
async function set(p, i, f, v){ const R = RANGE[f], r = await rect(p, sl(i, f)); await p.mouse.click(r.x + r.w * (v - R[0]) / (R[1] - R[0]), r.y); await p.waitForTimeout(40); }
async function exact(p, i, f, v){
  await set(p, i, f, v);
  for (let n = 0; n < 12; n++){
    const now = +(await p.getAttribute(sl(i, f), 'data-v')); if (Math.abs(now - v) < 1e-6) return;
    await p.focus(sl(i, f)); await p.keyboard.press(now < v ? 'ArrowRight' : 'ArrowLeft'); await p.waitForTimeout(30);
  }
}
const axis = (p, sel) => p.$eval(sel + ' .tri-r', el => { el.scrollIntoView({ block: 'nearest' }); const b = el.getBoundingClientRect(); return { x: b.left, y: b.top + b.height / 2, w: b.width }; });
const tv = (p, sel) => p.$eval(sel, e => ({ y: +e.dataset.y, h: +e.dataset.h, na: e.classList.contains('na') }));
// drag one slider of the axis with the mouse: from where it is now to a place on the axis (0–100)
async function drag(p, sel, k, to){
  const r = await axis(p, sel), v = await tv(p, sel), from = k === 'y' ? v.y : 100 - v.h;
  await p.mouse.move(r.x + r.w * from / 100, r.y); await p.mouse.down();
  await p.mouse.move(r.x + r.w * to / 100, r.y, { steps: 4 }); await p.mouse.up(); await p.waitForTimeout(40);
}
// walk a slider to an exact value with the keyboard
async function key(p, sel, k, want){
  for (let n = 0; n < 14; n++){
    const v = await tv(p, sel), now = k === 'y' ? v.y : 100 - v.h; if (Math.abs(now - want) < 1e-6) return;
    await p.focus(sel + ' .k' + k); await p.keyboard.press(now < want ? 'ArrowRight' : 'ArrowLeft'); await p.waitForTimeout(25);
  }
}
async function choice(p, sel, y, h){
  await drag(p, sel, 'y', y); await key(p, sel, 'y', y);
  await drag(p, sel, 'h', 100 - h); await key(p, sel, 'h', 100 - h);
}
const seed = (p, rows) => p.evaluate(rows => { const M = window.__reach.M; M.sv = M.sv.filter(s => s.f[0] !== 'f'); for (const r of rows) window.__reach.pickQ(r[0], r[1], r[2]); window.__reach.render(); }, rows);
const row = (i, o) => Object.keys(o).map(f => [i, f, o[f]]);
const segs = (p, sel) => p.$$eval(sel + ' .tri-s', a => a.map(e => e.textContent.replace(/\D/g, '')));

(async () => {
  const b = await chromium.launch();

  // ================= A. iPad =================
  { const { ctx, p } = await open(b, 1180, 820, false);
    check((await p.$$('#mseg button')).length === 4 && (await p.getAttribute('#mseg [data-v="f"]', 'aria-pressed')) === 'true', 'the formula program sits beside 两个问题 in the switch');
    check((await p.$$('.pad .sl')).length === 6 && (await p.$$('.pad .tri')).length === 2, 'three bars and one choice axis for each team');
    check(!(await p.$('.pad .sl[data-x$="_fy"]')) && !(await p.$('.pad .sl[data-x$="_fh"]')), 'the separate cross and back-pass bars are gone');
    check(!(await p.$('.fsw')) && !(await p.$('[data-a="fside"]')), 'no switching between the teams');
    const blocks = await p.$$eval('.ftm', t => t.map(e => { const r = e.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, team: e.classList.contains('h') ? 0 : 1, bars: e.querySelectorAll('.sl').length, axes: e.querySelectorAll('.tri').length, own: [...e.querySelectorAll('.sl,.tri')].every(x => x.dataset.x[0] === (e.classList.contains('h') ? '0' : '1')), tracks: [...e.querySelectorAll('.sl-t,.tri-r')].map(x => { const b = x.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.width)]; }) }; }));
    check(blocks.length === 2 && blocks[0].team === 0 && blocks[1].team === 1 && blocks[0].bottom <= blocks[1].top, 'the home team is one block on top, the away team one block below');
    check(blocks.every(x => x.bars === 3 && x.axes === 1 && x.own), 'each block holds the four items of that team only');
    check(JSON.stringify(blocks[0].tracks) === JSON.stringify(blocks[1].tracks), 'the same item sits at the same place in both blocks');
    check(!(await p.$('.pad input[type="number"], .pad input[type="text"]')), 'no typing: every value is a slider');
    check(!(await p.isVisible('#mBan')) && await p.isVisible('#fres'), 'the result panel replaces the model banner');
    check((await txt(p, '#frj')).indexOf('拖动') >= 0 && (await txt(p, '#frv0')) === '—', 'before any input the panel asks for the sliders');
    check((await txt(p, '#fv_0_fa')) === '默认 1' && (await txt(p, '#fv_0_fx')) === '未设' && (await tv(p, TR(0))).na, 'a and b start from the league average, arrivals and the choices are required');

    await exact(p, 0, 'fx', 20);
    await choice(p, TR(0), 60, 0);
    let m = await MM(p);
    check(cur(m, 0, 'fy') === 60 && cur(m, 0, 'fh') === null, 'the left slider only writes crosses and long shots (' + cur(m, 0, 'fy') + ')');
    check((await txt(p, '#frv0')) === index(20, 60, 0, 1, 1).toFixed(1), 'one slider is enough to get a result, the other part counts as 0 (' + await txt(p, '#frv0') + ')');
    await choice(p, TR(0), 60, 20);
    m = await MM(p);
    check(cur(m, 0, 'fy') === 60 && cur(m, 0, 'fh') === 20, 'the right slider only writes back passes (' + cur(m, 0, 'fh') + ')');
    check((await txt(p, '#frv0')) === '13.0', 'home 20 / 60% / 20% with a=b=1 → 13.0 (' + await txt(p, '#frv0') + ')');
    check(JSON.stringify(await segs(p, TR(0))) === '["60","20","20"]', 'the three parts show 60, 20 and 20 ' + JSON.stringify(await segs(p, TR(0))));
    check((await txt(p, '#frj')).indexOf('等另一队') >= 0, 'one team filled: waits for the other team');
    await exact(p, 1, 'fx', 12); await choice(p, TR(1), 50, 30); await exact(p, 1, 'fa', 1.5);
    await exact(p, 1, 'fb', 2);
    check(await p.$eval(sl(1, 'fb'), e => e.closest('.ftm').classList.contains('a')), 'the opponent defence is set inside the block of the attacking team');
    check((await txt(p, '#frv1')) === '6.2' && (await txt(p, '#frv0')) === '13.0', 'the opponent defence of the away block lowers only the away index: 6.24 shown as 6.2 (' + await txt(p, '#frv1') + ')');
    check((await txt(p, '#frr')).replace(/\s/g, '') === '2.08倍', 'the ratio of the two teams is 2.08 (' + await txt(p, '#frr') + ')');
    check((await txt(p, '#frj')).replace(/\s/g, '') === '推荐小角', 'both teams far below the average: the small-corners call (' + await txt(p, '#frj') + ')');
    check((await txt(p, '#frx0')) === '12.0' && (await txt(p, '#frz0')) === '1.0', 'the panel shows the two parts of the home result: 12.0 + 1.0');
    check((await txt(p, '#frx1')) === '6.0' && (await txt(p, '#frz1')) === '0.2', 'and of the away result: 6.0 + 0.2 (' + await txt(p, '#frx1') + ' + ' + await txt(p, '#frz1') + ')');
    await p.screenshot({ path: `${out}/formula_ipad.png` });

    // the formula against an independent calculation
    let bad = [];
    const cases = [[20, 60, 20, 1, 1], [12, 50, 30, 1.5, 2], [33, 25, 40, 0.5, 0.7], [7, 100, 0, 2, 2], [60, 0, 0, 0, 0], [45.0, 10, 90, 1.3, 1.1], [0, 40, 30, 1, 1], [80, 35.5, 12.5, 0.9, 1.7]];
    for (const c of cases){
      await seed(p, row(0, { fx: c[0], fy: c[1], fh: c[2], fa: c[3], fb: c[4] }).concat(row(1, { fx: 10, fy: 50, fh: 25 })));
      const got = await txt(p, '#frv0'), want = index(c[0], c[1], c[2], c[3], c[4]).toFixed(1);
      if (got !== want) bad.push(c.join('/') + ' got ' + got + ' want ' + want);
    }
    check(!bad.length, 'the index equals the formula in ' + cases.length + ' independent cases ' + bad.join('; '));

    // ---- the recommendation: every rule, for both teams
    const recText = async (h, a) => { await seed(p, row(0, h).concat(row(1, a))); return (await txt(p, '#frj')).replace(/\s/g, ''); };
    const T = v => ({ fx: v, fy: 100, fh: 0 });   // final result = v
    const RULES = [
      [T(40), T(30), '推荐大角', 'both big → big corners'],
      [T(10), T(14), '推荐小角', 'both small → small corners'],
      [T(40), T(10), '推荐让球鹿岛鹿角', 'big against small → handicap on the home team'],
      [T(10), T(40), '推荐让球横滨水手', 'small against big → handicap on the away team'],
      [T(40), T(20), '推荐让球鹿岛鹿角＋大角', 'big against average with a wide gap → handicap and big corners'],
      [T(20), T(40), '推荐让球横滨水手＋大角', 'the same with the teams swapped'],
      [T(10), T(20), '推荐让球横滨水手＋小角', 'small against average with a wide gap → handicap on the average team and small corners'],
      [T(20), T(10), '推荐让球鹿岛鹿角＋小角', 'the same with the teams swapped'],
      [T(30), T(20), '不推荐：一队大角、一队平均水平，差距不到2倍', 'big against average with a small gap → no call'],
      [T(14), T(20), '不推荐：一队小角、一队平均水平，差距不到2倍', 'small against average with a small gap → no call'],
      [T(20), T(24), '不推荐：两队都在平均水平', 'both average → no call']
    ];
    for (const [h, a, want, name] of RULES){ const got = await recText(h, a); check(got === want, name + ' (' + got + ')'); }
    await recText(T(40), T(20));
    check(await p.isVisible('#frj .frp.p0') && await p.isVisible('#frj .frp.pb'), 'the handicap and the corners are two separate marks');
    check((await txt(p, '#frv0d')).indexOf('大角') === 0 && (await txt(p, '#frv1d')).indexOf('平均水平') === 0, 'each team shows its own level on the final-result row');
    check((await recText(T(40), T(0))) === '推荐让球鹿岛鹿角' && (await txt(p, '#fres')).indexOf('Infinity') < 0, 'a team at zero: no broken number');
    check((await recText(T(20), T(0))) === '推荐让球鹿岛鹿角＋小角' && (await txt(p, '#fres')).indexOf('Infinity') < 0, 'average against zero counts as a wide gap');
    check((await recText(T(0), T(0))) === '推荐小角' && !p.errs.length, 'both at zero: small corners, no errors');
    // the edges use the same whole percent that is on the screen
    await recText(T(25.7), T(20)); check((await txt(p, '#frv0d')).indexOf('大角') === 0, '+25% on the screen is big (' + await txt(p, '#frv0d') + ')');
    await recText(T(25.6), T(20)); check((await txt(p, '#frv0d')).indexOf('平均水平') === 0, '+24% on the screen is average (' + await txt(p, '#frv0d') + ')');
    await recText(T(14.5), T(20)); check((await txt(p, '#frv0d')).indexOf('小角') === 0, '−30% on the screen is small (' + await txt(p, '#frv0d') + ')');
    await recText(T(14.6), T(20)); check((await txt(p, '#frv0d')).indexOf('平均水平') === 0, '−29% on the screen is average (' + await txt(p, '#frv0d') + ')');
    check((await recText(T(40), T(20))).indexOf('让球') >= 0, 'exactly 2.00 times is a wide gap');
    check((await recText(T(39.8), T(20))).indexOf('不推荐') === 0, '1.99 times is not');

    // random matches against the rules written out above, with three sets of standards
    let rnd = 20261119; const R = n => { rnd = (rnd * 16807) % 2147483647; return rnd % n; };
    const team = () => { const fy = R(71), fh = R(101 - fy); return { fx: 5 + R(91), fy, fh, fa: R(21) / 10, fb: R(21) / 10 }; };
    const seen = {}; bad = [];
    for (const th of [TH0, { hi: 10, lo: 15, gap: 1.5 }, { hi: 60, lo: 50, gap: 3.2 }]){
      await p.evaluate(t => localStorage.setItem('corner-reach-frec', JSON.stringify(t)), th); await p.reload(); await p.waitForTimeout(120);
      for (let n = 0; n < 70; n++){
        const H = team(), A = team(); await seed(p, row(0, H).concat(row(1, A)));
        const got = (await txt(p, '#frj')).replace(/\s/g, ''), want = wantRec(H, A, th);
        seen[want.replace(/鹿岛鹿角|横滨水手/, '').replace(/，差距不到.*$/, '')] = 1;
        const c0 = await p.$eval('#frv0d', e => e.querySelector('.frdl').textContent + ' ' + e.textContent.replace(/^.*?([+−]\d+%)$/, '$1')), w0 = finalChip(index(H.fx, H.fy, H.fh, H.fa, H.fb), th);
        const x1 = await p.$eval('#frx1d', e => e.querySelector('.frdl').textContent + ' ' + e.textContent.replace(/^.*?([+−]\d+%)$/, '$1')), w1 = chip(crossPart(A.fx, A.fy), AVG.cross, th);
        if (got !== want || c0 !== w0 || x1 !== w1) bad.push(JSON.stringify([H, A, th.hi]) + ' got ' + got + ' / ' + c0 + ' / ' + x1 + ' want ' + want + ' / ' + w0 + ' / ' + w1);
      }
    }
    check(!bad.length, 'the recommendation and the comparisons match the rules in 210 random matches ' + bad.slice(0, 2).join(' ;; '));
    check(Object.keys(seen).length >= 8, 'those matches covered the kinds of recommendation: ' + Object.keys(seen).join(' | '));
    await p.evaluate(() => localStorage.removeItem('corner-reach-frec')); await p.reload(); await p.waitForTimeout(120);

    // ---- fine-tuning
    await seed(p, row(0, T(40)).concat(row(1, T(20))));
    const svOf = async () => JSON.stringify((await MM(p)).sv.map(x => [x.t, x.p, x.i, x.f, x.v])), svBefore = await svOf();
    check(await p.isVisible('#fres [data-a="frec"]'), 'the panel has a 微调 button');
    await p.click('#qbMenu');
    check((await txt(p, '#card [data-a="frec"]')).indexOf('大角 +25%、小角 −30%、差距 2 倍') >= 0, 'the menu has the entry too, with the standards in use (' + await txt(p, '#card [data-a="frec"]') + ')');
    await p.click('#card [data-a="frec"]'); await p.waitForTimeout(60);
    const FS_ = k => '#card .sl[data-sl="frec"][data-x="' + k + '"]';
    check((await p.$$('#card .sl[data-sl="frec"]')).length === 3, 'three standards can be tuned');
    const vals = await p.$$eval('#card .sl[data-sl="frec"]', a => a.map(e => e.dataset.x + '=' + e.dataset.v).join(' '));
    check(vals === 'hi=25 lo=30 gap=2', 'they start from the agreed values (' + vals + ')');
    check((await txt(p, '#frs_hi')) === '+25%' && (await txt(p, '#frs_lo')) === '−30%' && (await txt(p, '#frs_gap')) === '2.0 倍', 'each standard shows its value');
    check((await txt(p, '#frn_hi')).indexOf('25.8') >= 0 && (await txt(p, '#frn_lo')).indexOf('14.4') >= 0, 'and what that means for the final result');
    check(await p.$eval('#card [data-a="frecr"]', e => e.disabled), 'nothing to reset yet');
    check((await txt(p, '#frecNow')).replace(/\s/g, '') === '推荐让球鹿岛鹿角＋大角', 'the sheet shows the recommendation right now');
    const walk = async (k, want) => { for (let n = 0; n < 120; n++){ const v = +(await p.getAttribute(FS_(k), 'data-v')); if (Math.abs(v - want) < 1e-6) return; await p.focus(FS_(k)); await p.keyboard.press(v < want ? 'ArrowRight' : 'ArrowLeft'); await p.waitForTimeout(8); } };
    await walk('gap', 2.5);
    check((await txt(p, '#frs_gap')) === '2.5 倍' && (await txt(p, '#frecNow')).indexOf('不推荐') === 0 && (await txt(p, '#frecNow')).replace(/\s/g, '').indexOf('差距不到2.5倍') >= 0, 'a wider gap takes the handicap away at once (' + await txt(p, '#frecNow') + ')');
    await walk('gap', 2); await walk('hi', 100);
    check((await txt(p, '#frs_hi')) === '+100%' && (await txt(p, '#frecNow')).replace(/\s/g, '') === '不推荐：两队都在平均水平', 'raising the big-corners bar changes the recommendation at once');
    check((await txt(p, '#frv0d')).indexOf('平均水平') === 0, 'and the panel behind the sheet follows');
    await walk('lo', 45);
    const saved = await p.evaluate(() => JSON.parse(localStorage.getItem('corner-reach-frec')));
    check(saved.hi === 100 && saved.lo === 45 && saved.gap === 2, 'the standards are saved ' + JSON.stringify(saved));
    await p.click('#card [data-a="close"]'); await p.reload(); await p.waitForTimeout(150);
    check((await txt(p, '#frv0d')).indexOf('平均水平') === 0 && await p.evaluate(() => window.__reach.FREC.lo === 45), 'they survive a reload');
    await p.click('#fres [data-a="frec"]'); await p.waitForTimeout(60);
    check(await p.isVisible('#card .sl[data-sl="frec"]'), 'the 微调 button on the panel opens the same sheet');
    await p.click('#card [data-a="frecr"]'); await p.waitForTimeout(60);
    check(JSON.stringify(await p.evaluate(() => window.__reach.FREC)) === JSON.stringify(TH0) && (await txt(p, '#frs_hi')) === '+25%', 'reset brings back the first values');
    check(JSON.stringify(await p.evaluate(() => JSON.parse(localStorage.getItem('corner-reach-frec')))) === JSON.stringify(TH0), 'and saves them');
    await p.click('#card [data-a="close"]');
    const svAfter = await svOf(); check(svAfter === svBefore, 'tuning writes nothing into the match' + (svAfter === svBefore ? '' : ' ' + svBefore + ' → ' + svAfter));
    await p.evaluate(() => localStorage.setItem('corner-reach-frec', JSON.stringify({ hi: 'x', lo: -5, gap: 99 }))); await p.reload(); await p.waitForTimeout(120);
    check(JSON.stringify(await p.evaluate(() => window.__reach.FREC)) === '{"hi":25,"lo":5,"gap":4}', 'broken saved values are repaired ' + JSON.stringify(await p.evaluate(() => window.__reach.FREC)));
    await p.evaluate(() => localStorage.removeItem('corner-reach-frec')); await p.reload(); await p.waitForTimeout(120);

    // ---- the axis
    await seed(p, row(0, { fx: 20, fy: 70, fh: 10 }));
    await drag(p, TR(0), 'y', 97);
    let v = await tv(p, TR(0));
    check(v.y === 90 && v.h === 10, 'the left slider stops at the right slider (' + v.y + ')');
    await seed(p, row(0, { fx: 20, fy: 70, fh: 10 }));
    await drag(p, TR(0), 'h', 20);
    v = await tv(p, TR(0));
    check(v.y === 70 && v.h === 30, 'the right slider stops at the left slider (' + v.h + ')');
    await seed(p, row(0, { fx: 20, fy: 20, fh: 20 }));
    let c0 = await MM(p);
    await drag(p, TR(0), 'y', 45);
    let c1 = await MM(p);
    check(cur(c1, 0, 'fy') === 45 && cur(c1, 0, 'fh') === 20 && count(c1, 'fh') === count(c0, 'fh'), 'a drag only writes the slider that moved');
    v = await tv(p, TR(0));
    check(v.h === 20 && JSON.stringify(await segs(p, TR(0))) === '["45","35","20"]', 'moving the left slider changes only crosses and the middle part ' + JSON.stringify(await segs(p, TR(0))));
    await seed(p, row(0, { fx: 20, fy: 20, fh: 20 }));
    let r = await axis(p, TR(0));
    await p.mouse.click(r.x + r.w * .34, r.y); await p.waitForTimeout(40);
    v = await tv(p, TR(0));
    check(v.y === 34 && v.h === 20, 'tapping the axis moves the nearer slider (left) to that place (' + v.y + ')');
    await p.mouse.click(r.x + r.w * .66, r.y); await p.waitForTimeout(40);
    v = await tv(p, TR(0));
    check(v.y === 34 && v.h === 34, 'tapping nearer the right slider moves that one (' + v.h + ')');
    await seed(p, row(0, { fx: 20, fy: 40, fh: 30 }));
    c0 = await MM(p); r = await axis(p, TR(0));
    await p.mouse.click(r.x + r.w * .4 + 4, r.y); await p.waitForTimeout(40);
    v = await tv(p, TR(0));
    check(v.y === 40 && count(await MM(p), 'fy') === count(c0, 'fy'), 'a tap on a slider does not make it jump');
    // the two sliders on top of each other: the direction decides
    await seed(p, row(0, { fx: 20, fy: 50, fh: 50 }));
    r = await axis(p, TR(0));
    await p.mouse.move(r.x + r.w * .5, r.y); await p.mouse.down(); await p.mouse.move(r.x + r.w * .3, r.y, { steps: 5 }); await p.mouse.up(); await p.waitForTimeout(40);
    v = await tv(p, TR(0));
    check(v.y === 30 && v.h === 50, 'sliders on top of each other: moving left takes the left slider (' + v.y + '/' + v.h + ')');
    await seed(p, row(0, { fx: 20, fy: 50, fh: 50 }));
    await p.mouse.move(r.x + r.w * .5, r.y); await p.mouse.down(); await p.mouse.move(r.x + r.w * .8, r.y, { steps: 5 }); await p.mouse.up(); await p.waitForTimeout(40);
    v = await tv(p, TR(0));
    check(v.y === 50 && v.h === 20, 'moving right takes the right slider (' + v.y + '/' + v.h + ')');
    await seed(p, row(0, { fx: 20, fy: 100, fh: 0 }));
    r = await axis(p, TR(0));
    await p.mouse.move(r.x + r.w, r.y); await p.mouse.down(); await p.mouse.move(r.x + r.w * .7, r.y, { steps: 5 }); await p.mouse.up(); await p.waitForTimeout(40);
    v = await tv(p, TR(0));
    check(v.y === 70 && v.h === 0, 'both sliders at the right end can still be pulled apart (' + v.y + ')');
    await seed(p, row(0, { fx: 20, fy: 0, fh: 100 }));
    r = await axis(p, TR(0));
    await p.mouse.move(r.x, r.y); await p.mouse.down(); await p.mouse.move(r.x + r.w * .3, r.y, { steps: 5 }); await p.mouse.up(); await p.waitForTimeout(40);
    v = await tv(p, TR(0));
    check(v.y === 0 && v.h === 70, 'both sliders at the left end can still be pulled apart (' + v.h + ')');
    // keyboard
    await seed(p, row(0, { fx: 20, fy: 40, fh: 30 }));
    await p.focus(TR(0) + ' .ky'); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(40);
    check((await tv(p, TR(0))).y === 41 && await p.evaluate(() => document.activeElement.classList.contains('ky')), 'arrow keys move a slider and keep the focus');
    await p.keyboard.press('End'); await p.waitForTimeout(40);
    check((await tv(p, TR(0))).y === 70, 'the End key stops at the other slider');
    await p.focus(TR(0) + ' .kh'); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(40);
    check((await tv(p, TR(0))).h === 29, 'moving the right slider to the right makes back passes smaller');
    // a record edited to more than 100% in the list
    await seed(p, row(0, { fx: 20, fy: 70, fh: 50 }));
    check(JSON.stringify(await segs(p, TR(0))) === '["70","","30"]' && (await txt(p, '#frv0')) === index(20, 70, 30, 1, 1).toFixed(1), 'an old record above 100% is drawn safely ' + JSON.stringify(await segs(p, TR(0))));
    // undo returns to not set
    await seed(p, row(0, { fx: 20 }));
    await drag(p, TR(0), 'y', 40);
    await p.click('#qbUndo'); await p.waitForTimeout(40);
    v = await tv(p, TR(0));
    check(v.na && (await txt(p, '#frv0')) === '—', 'bottom 撤销 puts the axis back to not set');

    // ---- the averages the user set: arrival 50%, cross 33%, central 33%, a = b = 1
    await seed(p, row(0, { fx: 50, fy: 33, fh: 34 }).concat(row(1, { fx: 50, fy: 33, fh: 34, fa: 1, fb: 1 })));
    check((await txt(p, '#frx0')) === '16.5' && (await txt(p, '#frz0')) === '4.1' && (await txt(p, '#frv0')) === '20.6', 'the reference inputs give 16.5 + 4.1 = 20.6');
    check(await p.isVisible('#frv0d') && await p.isVisible('#frx0d') && await p.isVisible('#frz1d'), 'the near-average comparison is visible too');
    const panelText = (await txt(p, '#fres')).replace(/\s/g, '');
    check(panelText.indexOf('平均20.6') >= 0 && panelText.indexOf('平均16.5') >= 0 && panelText.indexOf('平均4.1') >= 0, 'the three averages are on the panel');
    for (const i of [0, 1]) for (const id of ['frv', 'frx', 'frz']) check((await p.$eval('#' + id + i + 'd', e => e.querySelector('.frdl').textContent + e.textContent.replace(/^.*?([+−]\d+%)$/, '$1'))) === (id === 'frv' ? '平均水平+0%' : '接近平均+0%'), 'team ' + i + ' ' + id + ' equals its average (' + await txt(p, '#' + id + i + 'd') + ')');
    bad = [];
    const cmpCases = [[70, 45, 20, 1, 1], [40, 30, 30, 1.5, 1.2], [100, 100, 0, 1, 1], [100, 0, 0, 0, 0], [5, 10, 80, 2, 2], [62, 28, 41, 0.7, 1.4], [0, 40, 30, 1, 1], [55, 33, 34, 1, 1], [54, 33, 34, 1, 1], [45, 33, 34, 1, 1], [46, 33, 34, 1, 1]];
    for (const c of cmpCases){
      for (const i of [0, 1]){
        await seed(p, row(i, { fx: c[0], fy: c[1], fh: c[2], fa: c[3], fb: c[4] }).concat(row(1 - i, { fx: 50, fy: 33, fh: 34 })));
        const X = crossPart(c[0], c[1]), Z = centrePart(c[0], c[1], c[2], c[3], c[4]), S = X + Z;
        for (const [id, v, avg] of [['frx', X, AVG.cross], ['frz', Z, AVG.centre], ['frv', S, AVG.total]]){
          const num = await txt(p, '#' + id + i), got = (await p.$eval('#' + id + i + 'd', e => e.querySelector('.frdl').textContent + ' ' + e.textContent.replace(/^.*?([+−]\d+%)$/, '$1'))).replace(/\s+/g, ' ');
          const wantC = id === 'frv' ? finalChip(v) : chip(v, avg);
          if (Math.abs(+num - v) > 0.0501 || got !== wantC) bad.push(c.join('/') + ' ' + id + i + ' got ' + num + ' ' + got + ' want ' + v.toFixed(1) + ' ' + wantC);
        }
      }
    }
    check(!bad.length, 'the three values and their comparison match an independent calculation in ' + cmpCases.length + ' cases for both teams ' + bad.slice(0, 3).join('; '));
    await seed(p, row(0, { fx: 63, fy: 33, fh: 67 }).concat(row(1, { fx: 35, fy: 33, fh: 67 })));
    check((await p.$eval('#frx0d', e => e.classList.contains('fhi'))) && (await p.$eval('#frx1d', e => e.classList.contains('flo'))), 'the two parts use the same standards: +26% is above the average and −30% is below it');
    await seed(p, row(0, { fx: 62, fy: 33, fh: 67 }).concat(row(1, { fx: 36, fy: 33, fh: 67 })));
    check((await p.$eval('#frx0d', e => e.classList.contains('feq'))) && (await p.isVisible('#frx0d')) && (await p.$eval('#frx1d', e => e.classList.contains('feq'))) && (await p.isVisible('#frx1d')), '+24% and −28% are near the average');
    await seed(p, row(0, { fx: 20 }));
    check((await txt(p, '#fres')).indexOf('还差 1 项') >= 0 && (await txt(p, '#fres')).indexOf('还差 2 项') >= 0 && (await txt(p, '#frx0')) === '—', 'a team with missing items shows how many are left');
    check(!(await p.$('.fra')) && !(await p.$('[data-a="favg"]')), 'the average is fixed, there is no setting for it on the page');
    await p.click('#qbMenu');
    check((await txt(p, '#card')).indexOf('联赛平均线') < 0, 'nor in the menu');
    await p.keyboard.press('Escape');
    const sliderX = await p.$eval(sl(0, 'fx'), e => [e.dataset.lo, e.dataset.hi, e.dataset.st].join('/'));
    check(sliderX === '0/100/1', 'arrival is a percentage from 0 to 100 (' + sliderX + ')');
    await exact(p, 0, 'fx', 95);
    check((await txt(p, '#fv_0_fx')) === '95%' && (await txt(p, '#fw_0_fx')) === '包饺子', 'near 100% reads as 包饺子 (' + await txt(p, '#fw_0_fx') + ')');
    await seed(p, row(0, { fx: 70, fy: 45, fh: 20 }).concat(row(1, { fx: 40, fy: 30, fh: 30, fa: 1.5, fb: 1.2 })));
    await p.screenshot({ path: `${out}/formula_ipad_panel.png` });

    // records: list, edit
    await seed(p, []);
    await p.waitForTimeout(40);
    await exact(p, 0, 'fx', 24);
    await p.click('#qbList');
    check((await txt(p, '#card .list')).indexOf('公式·到达频率 → 24%') >= 0, 'the record list shows the value with its unit (24%)');
    await p.click('#card .list button');
    check((await p.getAttribute('#card .sl', 'data-hi')) === '100' && (await p.getAttribute('#card .sl', 'data-st')) === '1', 'editing a record keeps the slider range of that item (0–100%)');
    await p.keyboard.press('Escape');
    await p.click('#qbUndo'); await p.waitForTimeout(40);
    check(cur(await MM(p), 0, 'fx') === null && (await txt(p, '#fv_0_fx')) === '未设', 'bottom 撤销 removes the last bar');

    // hide numbers: bars hide their numbers, the result stays
    await seed(p, row(0, { fx: 20, fy: 60, fh: 20 }).concat(row(1, { fx: 12, fy: 50, fh: 30 })));
    await p.click('#numBtn'); await p.waitForTimeout(60);
    check(!/\d/.test(await txt(p, '#fv_0_fx')) && !/\d/.test(await txt(p, TR(0))) && (await txt(p, '#frv0')) === '13.0', 'hide numbers hides the bar values but keeps the result');
    await p.click('#numBtn'); await p.waitForTimeout(60);

    // saved across a reload
    await p.waitForTimeout(450); await p.reload(); await p.waitForTimeout(150);
    check(await p.isVisible('#fres') && (await txt(p, '#frv0')) === '13.0', 'the program and its values survive a reload');

    // export
    await p.click('#qbMenu'); await p.click('#card [data-a="exp1"]'); await p.waitForTimeout(100);
    const js = await p.evaluate(() => { const t = document.querySelector('#card textarea'); return t ? t.value : null; });
    if (js){ const o = JSON.parse(js);
      check(o.ver === 'v11' && o.sv.fx.u === '%' && o.sv.fy.u === '%' && o.sv.fa.u === '' && JSON.stringify(o.favg) === '{"x":50,"y":33,"m":33,"a":1,"b":1}' && JSON.stringify(o.frec) === JSON.stringify(TH0) && o.matches[0].sv.some(s => s.f === 'fx' && s.v === 20), 'JSON export carries the values, their units and the average settings');
      check(o.readme.indexOf('fx 到达频率') >= 0 && o.readme.indexOf('z＝1÷(1+3×a×b)') >= 0, 'the export explains the formula');
    } else check(false, 'export text not found');
    await p.keyboard.press('Escape');
    check(!p.errs.length, 'iPad: no errors ' + p.errs.join(' | '));
    await ctx.close();
  }

  // ================= B. phone: all sliders of both teams on one page =================
  { const { ctx, p } = await open(b, 390, 763, true);
    const vis = await p.evaluate(() => { const strip = document.querySelector('#strip').getBoundingClientRect().top; return [...document.querySelectorAll('.pad .sl,.pad .tri')].map(e => { const r = e.getBoundingClientRect(); return e.offsetParent && r.top >= 0 && r.bottom <= strip; }); });
    check(vis.length === 8 && vis.every(Boolean), 'phone: all eight axes of both teams are on the page at once');
    check(!(await p.$('.fsw')), 'phone: nothing to switch');
    await seed(p, row(0, { fx: 20, fy: 60, fh: 20 }).concat(row(1, { fx: 12, fy: 50, fh: 30 })));
    // finger on the axis: live while dragging, written on release
    const r = await axis(p, TR(1)), cdp = await ctx.newCDPSession(p), X = v => Math.round(r.x + r.w * v / 100);
    const before = await txt(p, '#frv1'), top0 = await p.evaluate(() => document.querySelector('.pad[data-i="0"]').scrollTop);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: X(50), y: r.y }] });
    for (let k = 1; k <= 6; k++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: X(50 + 3 * k), y: r.y + 1 }] });
    await p.waitForTimeout(60);
    const during = await txt(p, '#frv1'), rec = cur(await MM(p), 1, 'fy');
    check(during !== before && during === index(12, 68, 30, 1, 1).toFixed(1) && rec === 50, 'the result updates live while the finger moves (' + before + ' → ' + during + '), nothing is written yet');
    check(await p.isVisible(TR(1) + ' .tri-tip') && (await txt(p, TR(1) + ' .tri-tip')) === '传中远射 68% · 中路渗透 2% · 回传 30%', 'all three shares are shown while dragging (' + await txt(p, TR(1) + ' .tri-tip') + ')');
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: X(95), y: r.y + 1 }] });
    await p.waitForTimeout(40);
    check((await tv(p, TR(1))).y === 70, 'the finger cannot push past the other slider (' + (await tv(p, TR(1))).y + ')');
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await p.waitForTimeout(120);
    check(cur(await MM(p), 1, 'fy') === 70 && cur(await MM(p), 1, 'fh') === 30, 'on release the value is written (70%)');
    check(await p.evaluate(() => document.querySelector('.pad[data-i="0"]').scrollTop) === top0, 'dragging the axis does not scroll the page');
    // finger on the other team's axis right after, and on a normal bar
    const r0 = await axis(p, TR(0));
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: Math.round(r0.x + r0.w * .8), y: r0.y }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: Math.round(r0.x + r0.w * .9), y: r0.y }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await p.waitForTimeout(120);
    check(cur(await MM(p), 0, 'fh') === 10 && cur(await MM(p), 0, 'fy') === 60, 'the right slider works by finger too (back passes 10%)');
    const bar = await rect(p, sl(1, 'fx'));
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: Math.round(bar.x + bar.w * .5), y: Math.round(bar.y) }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await cdp.detach(); await p.waitForTimeout(120);
    check(cur(await MM(p), 1, 'fx') === 50, 'the normal bars work by finger next to the axis');
    await p.screenshot({ path: `${out}/formula_phone.png` });
    await p.tap('.ftm.a [data-a="ck"]'); await p.waitForTimeout(80);
    await p.tap('.ftm.h [data-a="ck"]'); await p.waitForTimeout(80);
    check((await txt(p, '#ckA')) === '角球 1' && (await txt(p, '#ckH')) === '角球 1', 'the corner pills of both teams work here');
    check(await p.$eval('#sheet', e => e.hidden), 'tapping the corner pill right under the panel does not open the tuning sheet');
    const tb = await (await p.$('#fres [data-a="frec"]')).boundingBox();
    await p.touchscreen.tap(tb.x + tb.width / 2, tb.y - 8); await p.waitForTimeout(80);
    check(!(await p.$eval('#sheet', e => e.hidden)) && (await p.$$('#card .sl[data-sl="frec"]')).length === 3, 'the small 微调 button is easy to hit: a finger just above it still opens the sheet');
    const sw = await p.evaluate(() => { const c = document.querySelector('#card'); return c.scrollWidth - c.clientWidth; });
    check(sw <= 0, 'the tuning sheet fits the phone width');
    await p.screenshot({ path: `${out}/formula_phone_tune.png` });
    const hb = await p.$eval('#card .sl[data-x="hi"] .sl-t', e => { e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left, y: r.top + r.height / 2, w: r.width }; });
    const cdpT = await ctx.newCDPSession(p);
    await cdpT.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: hb.x + hb.w * .2, y: hb.y }] });
    for (let k = 1; k <= 6; k++) await cdpT.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: hb.x + hb.w * (.2 + k * .05), y: hb.y }] });
    await cdpT.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await cdpT.detach(); await p.waitForTimeout(80);
    check(await p.evaluate(() => window.__reach.FREC.hi) !== 25, 'the standards can be dragged by finger (' + await txt(p, '#frs_hi') + ')');
    await p.click('#card [data-a="frecr"]'); await p.waitForTimeout(60); await p.click('#card [data-a="close"]'); await p.waitForTimeout(60);
    await p.click('#mseg [data-v="q"]');
    check(await p.isVisible('.pad[data-i="0"] .qcard') && await p.isVisible('.pad[data-i="1"] .qcard') && !(await p.isVisible('#fres')), 'two questions is untouched: both teams on screen, no formula panel');
    const m = await MM(p);
    check(!m.sv.some(s => s.f === 'q1' || s.f === 'g1'), 'the formula does not write into the other programs');
    await p.click('#mseg [data-v="f"]');
    await p.evaluate(() => { window.__reach.M.st = 2; window.__reach.render(); });
    check(!(await p.isVisible('#fres')) && await p.isVisible('.endc'), 'a finished match shows the end card instead');
    check(!p.errs.length, 'phone: no errors ' + p.errs.join(' | '));
    await ctx.close();
  }

  // ================= C. every screen size =================
  const SZ = [[390, 763, 1, 0], [375, 647, 1, 0], [360, 640, 1, 0], [414, 808, 1, 0], [320, 548, 1, 0], [390, 763, 1, 1], [375, 647, 1, 1], [1180, 820, 0, 0], [1133, 744, 0, 0], [1024, 768, 0, 0], [820, 1180, 0, 0], [744, 1133, 0, 0], [1366, 1024, 0, 0]];
  for (const [w, h, mob, pip] of SZ){
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: !!mob, hasTouch: !!mob, serviceWorkers: 'block' });
    if (pip) await ctx.addInitScript(() => localStorage.setItem('corner-reach-pip', JSON.stringify({ pos: 'top', h: 190 })));
    const p = await ctx.newPage(); await p.goto(base + '/index.html');
    await p.fill('#fH', '名字很长的鹿岛鹿角足球俱乐部'); await p.fill('#fA', '名字很长的横滨水手足球俱乐部'); await p.click('#mseg [data-v="f"]');
    await seed(p, row(0, { fx: 80, fy: 60, fh: 20, fa: 1.2, fb: 0.8 }).concat(row(1, { fx: 33, fy: 50, fh: 30, fa: 1.5, fb: 2 })));
    await p.waitForTimeout(60);
    const r = await p.evaluate(() => {
      const de = document.documentElement, pad = document.querySelector('.pad[data-i="0"]'), bad = [];
      for (const el of document.querySelectorAll('.frd,.frj,.frr,.frv,.frm,.fval,.fw,.fll,.fls,.tri-s b,.tri-n,#mseg button')){ if (el.offsetParent && el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).textOverflow !== 'ellipsis') bad.push(el.className + ':' + el.textContent.slice(0, 8)); }
      const box = el => el.getBoundingClientRect();
      for (const w of document.querySelectorAll('.frw')){ const [l, m, r] = w.children, ends = e => [...e.children].map(box); if (ends(l).some(b => b.right > box(m).left + 1) || ends(r).some(b => b.left < box(m).right - 1) || ends(l).concat(ends(r)).some(b => b.left < box(w).left - 1 || b.right > box(w).right + 1)) bad.push('panel row overlaps: ' + w.textContent.slice(0, 18)); }
      for (const l of document.querySelectorAll('.fl')){ const v = l.querySelector('.flv'), n = v.querySelector('.fval'); if (n && box(n).right > box(l.children[1]).left + 1) bad.push('value runs into the bar ' + n.textContent); }
      const strip = box(document.querySelector('#strip')).top;
      const ax = [...document.querySelectorAll('.pad .sl,.pad .tri')].filter(e => e.offsetParent);
      const low = ax.filter(e => box(e).bottom > strip + 1 || box(e).top < 0).length;
      const tr = Math.min(...ax.map(e => box(e.querySelector('.sl-t,.tri-r')).width));
      const res = box(document.querySelector('#fres'));
      return { side: de.scrollWidth - de.clientWidth, bad, tr: Math.round(tr), minH: Math.round(Math.min(...ax.map(e => box(e).height))), n: ax.length, low, resTop: Math.round(res.top), resBot: Math.round(res.bottom) };
    });
    const tag = w + 'x' + h + (pip ? ' floating video' : '');
    // the widest numbers the panel can ever show
    const wide = [];
    for (const st of [[{ fx: 100, fy: 100, fh: 0 }, { fx: 99, fy: 100, fh: 0 }], [{ fx: 100, fy: 0, fh: 0, fa: 0, fb: 0 }, { fx: 99, fy: 0, fh: 0, fa: 0, fb: 0 }], [{ fx: 0, fy: 50, fh: 50 }, { fx: 88, fy: 77, fh: 3, fa: 2, fb: 2 }]]){
      await seed(p, row(0, st[0]).concat(row(1, st[1]))); await p.waitForTimeout(30);
      wide.push(...await p.evaluate(() => { const box = e => e.getBoundingClientRect(), out = []; for (const w of document.querySelectorAll('.frw')){ const [l, m, r] = w.children; for (const e of [...l.children]) if (box(e).right > box(l).right + .5) out.push('left ' + e.textContent); for (const e of [...r.children]) if (box(e).left < box(r).left - .5) out.push('right ' + e.textContent); if (![...l.children, ...r.children].every(e => box(e).width > 0)) out.push('hidden in ' + w.textContent.slice(0, 16)); } return out; }));
    }
    check(!wide.length, tag + ': the widest possible numbers still fit ' + JSON.stringify(wide.slice(0, 4)));
    await seed(p, row(0, { fx: 40, fy: 100, fh: 0 }).concat(row(1, { fx: 20, fy: 100, fh: 0 }))); await p.waitForTimeout(30);
    const rw = await p.evaluate(() => { const box = e => e.getBoundingClientRect(), j = document.querySelector('#frj'), t = document.querySelector('#fres .frtn'), add = j.querySelector('.frp.pb'), hc = j.querySelector('.frp.p0'); return { inJ: [...j.children].every(e => box(e).left >= box(j).left - 1 && box(e).right <= box(j).right + 1), clear: box(j).right <= box(t).left + 1, add: box(add).width > 30, hc: box(hc).width > 40, panel: box(document.querySelector('#fres')).right <= innerWidth }; });
    check(rw.inJ && rw.clear && rw.add && rw.hc && rw.panel, tag + ': handicap, corners and 微调 all fit even with long team names ' + JSON.stringify(rw));
    if (w === 390 && !pip) await p.screenshot({ path: `${out}/formula_phone_rec.png` });
    await seed(p, row(0, { fx: 80, fy: 60, fh: 20, fa: 1.2, fb: 0.8 }).concat(row(1, { fx: 33, fy: 50, fh: 30, fa: 1.5, fb: 2 })));
    check(r.side <= 0, tag + ': no sideways scroll');
    check(!r.bad.length, tag + ': all labels and results fit ' + JSON.stringify(r.bad.slice(0, 5)));
    check(r.minH >= 30 && r.tr >= 80, tag + ': sliders are usable (track ' + r.tr + 'px, height ' + r.minH + 'px)');
    check(r.n === 8, tag + ': all ' + r.n + ' axes of both teams are present');
    check(r.resTop >= 0 && r.resBot <= h, tag + ': the results of both teams are on screen');
    if (w !== 320 && !(pip && h < 700)) check(r.low === 0, tag + ': every axis fits on the page without scrolling (' + r.low + ' cut off)');
    else { const reach = await p.evaluate(() => { const pad = document.querySelector('.pad[data-i="0"]'); pad.scrollTop = pad.scrollHeight; const a = [...pad.querySelectorAll('.sl,.tri')].pop().getBoundingClientRect(); return a.bottom <= document.querySelector('#strip').getBoundingClientRect().top + 1; }); check(reach, tag + ': the last axis can be reached by scrolling'); }
    if ([390, 375, 1180, 820].indexOf(w) >= 0) await p.screenshot({ path: `${out}/formula_fit_${w}${pip ? 'p' : ''}.png` });
    await ctx.close();
  }
  await b.close();
  console.log(fails ? 'FAILS ' + fails : 'ALL OK');
})();
