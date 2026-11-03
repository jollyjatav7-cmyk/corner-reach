/* ================= 视频浮窗 ================= */
const PIP = Object.assign({ pos: 'off', h: 190 }, LS.get('corner-reach-pip', {}) || {});
function applyPip(){
  const on = PIP.pos === 'top' || PIP.pos === 'bot';
  document.body.classList.toggle('pip-on', on);
  document.body.classList.toggle('pip-top', PIP.pos === 'top');
  document.body.classList.toggle('pip-bot', PIP.pos === 'bot');
  document.documentElement.style.setProperty('--pipH', (on ? PIP.h : 0) + 'px');
}
const savePip = () => { LS.set('corner-reach-pip', PIP); applyPip(); renderAll(); };
applyPip();

/* ================= 提示 ================= */
let toastT = 0, toastFn = null;
function showToast(msg, fn, lab, ms){
  $('#toastMsg').textContent = msg; toastFn = fn || null;
  const b = $('#toastBtn'); b.textContent = lab || '撤销'; b.hidden = !fn; $('#toast').hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => { $('#toast').hidden = true; toastFn = null; }, ms || Math.min(9000, Math.max(fn ? 4500 : 2600, msg.length * 110)));
}
function hideToast(){ clearTimeout(toastT); $('#toast').hidden = true; toastFn = null; }
$('#toastBtn').addEventListener('click', () => { if (!toastFn) return; const f = toastFn; toastFn = null; $('#toast').hidden = true; f(); });

/* ================= 互动 ================= */
function setMid(open){ $('#mid').classList.toggle('open', open); $('#scrim').hidden = !open; }
$('#scrim').addEventListener('click', () => setMid(false));
function closeChainOf(e){ for (const i of [0, 1]) if (OC[i] && OC[i].k === e.k) OC[i] = null; }
document.addEventListener('click', ev => {
  const b = ev.target.closest('[data-a]');
  if (!b || b.disabled) return;
  if (sugg.contains(b)) return;
  const a = b.dataset.a, d = sheetData;
  switch (a){
    case 'close': closeSheet(); break;
    // 记录
    case 'mode': PREF.mode = b.dataset.v === 'q' ? 'q' : 'rec'; savePref(); setMid(false); renderAll(); break;
    case 'ar': tapArrive(+b.dataset.i); break;
    case 'pick': pick(+b.dataset.i, b.dataset.v); break;
    case 'stb': stageBack(+b.dataset.i); break;
    case 'ste': stageEnd(+b.dataset.i); break;
    case 'stx': stageCancel(+b.dataset.i); break;
    case 'ck': tapCorner(+b.dataset.i); break;
    case 'p1': {
      if (M.st === 2){ endedToast(); break; }
      openSheet('p1', { i: +b.dataset.i });
      const g = b.dataset.f && document.getElementById('p1g-' + b.dataset.f);   // 点的那一项看不到时，捲到刚好看得到
      if (g){ const r = g.getBoundingClientRect(), c = card.getBoundingClientRect(); if (r.bottom > c.bottom) card.scrollTop += r.bottom - c.bottom + 16; }
      break;
    }
    case 'p1side': d.i = +b.dataset.v; renderSheet(); break;
    case 'p1v': {   // 场面（选项）：再点一次选中的就是清除
      if (M.st === 2){ endedToast(); break; }
      const f = b.dataset.f, v = +b.dataset.v, cur = svCur(M, d.i, f);
      setSv(d.i, f, cur && cur.v === v ? null : v);
      renderAll(); renderSheet(); break;
    }
    case 'p1clr': {   // 拖动条清除（球权两队一起）
      if (M.st === 2){ endedToast(); break; }
      if (b.dataset.f === 'bq') setBq(null); else setSv(d.i, b.dataset.f, null);
      renderAll(); renderSheet(); break;
    }
    // 简易模型
    case 'mdl': setMid(false); openSheet('mdl', { g: b.dataset.g || (sheetKind === 'mset' && d.g) || (PREF.mode === 'q' ? 'q' : 'r') }); break;
    case 'mset': setMid(false); openSheet('mset', { g: (sheetKind === 'mdl' && d.g) || (PREF.mode === 'q' ? 'q' : 'r') }); break;
    case 'mtab': d.g = b.dataset.v; d.add = null; renderSheet(); break;
    case 'mon': MODEL.on = +b.dataset.v ? 1 : 0; saveModel(); renderAll(); renderSheet(); break;
    case 'msc': MODEL.sc = b.dataset.v === 'ft' ? 'ft' : 'half'; saveModel(); renderAll(); renderSheet(); break;
    case 'mop': { const c = mCondAt(b.dataset.p); if (c){ c.op = b.dataset.v; saveModel(); renderAll(); renderSheet(); } break; }
    case 'mcin': {
      const c = mCondAt(b.dataset.p), v = +b.dataset.v; if (!c || !c.in) break;
      const j = c.in.indexOf(v); if (j >= 0) c.in.splice(j, 1); else { c.in.push(v); c.in.sort(); }
      saveModel(); renderAll(); renderSheet(); break;
    }
    case 'mcadd': d.add = b.dataset.p || null; renderSheet(); break;
    case 'mcpick': {
      const p = String(b.dataset.p).split('.'), L = MODEL[p[0]] && MODEL[p[0]][p[1]] && MODEL[p[0]][p[1]][p[2]];
      if (L && MET[b.dataset.v]){ L.push(newCond(b.dataset.v)); d.add = null; saveModel(); renderAll(); renderSheet(); }
      break;
    }
    case 'mcdel': {
      const p = String(b.dataset.p).split('.'), L = MODEL[p[0]] && MODEL[p[0]][p[1]] && MODEL[p[0]][p[1]][p[2]], j = +p[3];
      if (!L || !L[j]) break;
      const c = L.splice(j, 1)[0]; saveModel(); renderAll(); renderSheet();
      showToast('已删除：' + condText(c), () => { L.splice(Math.min(j, L.length), 0, c); saveModel(); renderAll(); if (sheetKind === 'mset') renderSheet(); });
      break;
    }
    case 'mreset': {
      const old = clone(MODEL); MODEL = fixModel(clone(MDEF)); MODEL.on = old.on; saveModel(); d.add = null; renderAll(); renderSheet();
      showToast('已恢复默认标准', () => { MODEL = fixModel(old); saveModel(); renderAll(); if (sheetKind === 'mset') renderSheet(); });
      break;
    }
    // 隐藏数字（画面右上角、第一部分视窗、功能 → 拖动条）
    case 'hidenum': case 'hnset': {
      PREF.hn = a === 'hnset' ? (+b.dataset.v ? 1 : 0) : (PREF.hn ? 0 : 1); savePref(); renderAll(); if (!sheet.hidden) renderSheet();
      if (a === 'hidenum') showToast(PREF.hn ? '数字已隐藏，只看条的位置判断（再按一次显示）' : '数字已显示');
      break;
    }
    case 'hwset': PREF.hw = +b.dataset.v ? 1 : 0; savePref(); renderAll(); renderSheet(); break;
    // 拖动条每格多少
    case 'slset': setMid(false); openSheet('slst'); break;
    case 'slst': {
      const v = +b.dataset.v; if (SLSTEPS.indexOf(v) < 0) break;
      PREF.st = v; savePref(); renderAll(); renderSheet();
      showToast('拖动条现在每格 ' + fp(v) + '%');
      break;
    }
    case 'undoT': undoTeam(+b.dataset.i); break;
    case 'undo': undoAny(); break;
    // 统计
    case 'stats': renderStats(); setMid(true); break;
    case 'midclose': setMid(false); break;
    case 'scope': { const v = b.dataset.v; PREF.scope = v === 'h' + curP() ? 'auto' : v; savePref(); renderStats(); break; }
    // 全部记录
    case 'list': setMid(false); openSheet('list'); break;
    case 'evedit': openSheet('evedit', { k: +b.dataset.k }); break;
    case 'svedit': openSheet('svedit', { k: +b.dataset.k }); break;
    case 'eppick': {
      const e = evByK(d.k); if (!e || e.c !== 'ar') break;
      const L = +b.dataset.l, v = b.dataset.v;
      e.pa = cleanPa(e.pa.slice(0, L) + v);
      if (!e.pa) delete e.dt;
      for (const i of [0, 1]) if (OC[i] && OC[i].k === e.k && isDone(e.pa)) OC[i] = null;
      save(); renderAll(); renderSheet(); break;
    }
    case 'evteam': { const e = evByK(d.k); if (e){ closeChainOf(e); e.i = +b.dataset.v; save(); renderAll(); renderSheet(); } break; }
    case 'evtime': { const e = evByK(d.k); if (e){ e.t = clamp(e.t + +b.dataset.v, PER[e.p][0], PER[e.p][1] + 1200); sortEv(M); save(); renderAll(); renderSheet(); } break; }
    case 'evdel': { const e = evByK(d.k); if (e){ closeChainOf(e); removeEv(e); renderAll(); openSheet('list'); showToast('已删除 ' + evLabel(e), () => { M.ev.push(e); sortEv(M); save(); renderAll(); if (sheetKind === 'list') renderSheet(); }); } break; }
    case 'svval': { const s = svByK(d.k); if (s){ s.v = +b.dataset.v; save(); renderAll(); renderSheet(); } break; }
    case 'svtime': { const s = svByK(d.k); if (s){ const pr = svPair(s); s.t = clamp(s.t + +b.dataset.v, PER[s.p][0], PER[s.p][1] + 1200); if (pr) pr.t = s.t; sortEv(M); save(); renderAll(); renderSheet(); } break; }
    case 'svdel': {
      const s = svByK(d.k); if (!s) break;
      const pr = svPair(s), rm = pr ? [s, pr] : [s], lab = svLabel(s);   // 球权两队一起删
      for (const x of rm) M.sv.splice(M.sv.indexOf(x), 1);
      save(); renderAll(); openSheet('list');
      showToast('已删除 ' + lab, () => { for (const x of rm) M.sv.push(x); sortEv(M); save(); renderAll(); if (sheetKind === 'list') renderSheet(); });
      break;
    }
    // 联网
    case 'qsync': setMid(false); quickSync(); break;
    case 'netpill': if (M.api || apiKey()) quickSync(); else openSheet('net'); break;
    case 'net': setMid(false); openSheet('net'); break;
    case 'join': { closeSheet(); if (M.st === 2) startNew(); if (M.api && apiKey() && M.st === 1 && !ownEvents()) joinFromNet(); else openJoin(); break; }   // 已结束的那场不动：中途加入就是新的一场
    case 'js': { const f = b.dataset.f, i = +b.dataset.i; d[f][i] = Math.max(0, d[f][i] + +b.dataset.d); if (f === 'ft' && d.lk) d.ck1 = d.ft.slice(); renderSheet(); break; }
    case 'jlk': d.lk = false; d.ck1 = d.ft.slice(); renderSheet(); break;
    case 'jgo': {
      applyJoin(d); closeSheet(); renderAll();
      let dl = null;
      if (!d.ht && M.api) dl = learnDelay(clockOf(M), 'join');
      saveNow();
      showToast(d.ht ? '已从中场休息开始记录，下半场开球时按 ▶' : '已从 ' + fmtClock(M.tm.p, clockOf(M)) + ' 开始记录' + delayNote(dl));
      break;
    }
    case 'nkey': {
      NET.key = ($('#netKey').value || '').trim(); saveNet(); netList = { at: 0, list: [], day: false };
      if (!apiKey()){ sheetData.msg = '已清除。'; renderSheet(); renderNet(); break; }
      sheetData.msg = '测试中…'; renderSheet();
      apiGet('/status').then(r => {
        const x = Array.isArray(r) ? r[0] : r, sub = x && x.subscription, rq = x && x.requests;
        if (rq){ NET.quota = { cur: rq.current, lim: rq.limit_day, t: new Date().toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' }) }; saveNet(); }
        sheetData.msg = '已连上 API-Football' + (sub ? '：方案 ' + sub.plan + (sub.active === false ? '（未启用）' : '') : '') + (rq ? '，今天已用 ' + rq.current + ' / ' + rq.limit_day + ' 次' : '') + '。';
      }).catch(e => { sheetData.msg = '测试失败：' + e.message; }).then(() => { if (sheetKind === 'net') renderSheet(); renderNet(); scheduleFind(300); });
      break;
    }
    case 'nkey0': NET.key = ''; NET.nosb = 1; saveNet(); sheetData.msg = '已清除。'; renderSheet(); renderNet(); break;
    case 'nsb': NET.key = ''; NET.nosb = 0; saveNet(); sheetData.msg = '改用“角球数据记录”里的 key。'; renderSheet(); renderNet(); break;
    case 'nauto': NET.auto = b.dataset.v === '1'; saveNet(); renderSheet(); break;
    case 'niv': NET.iv = +b.dataset.v; NET.ivSet = 1; saveNet(); renderSheet(); break;
    case 'ndl0': NET.delay = null; NET.dl0 = 1; if (M.api){ M.api.dl = null; M.api.dlk = null; } saveNet(); saveNow(); renderSheet(); showToast('已清除画面延迟，下次开球或中途加入时重新测'); break;
    case 'nsync': closeSheet(); apiSync(true); break;
    case 'nfind': closeSheet(); M.apiNo = null; apiFind(true); break;
    case 'nre': closeSheet(); M.api = null; M.apiNo = null; saveNow(); renderAll(); apiFind(true); break;
    case 'noff': M.api = null; M.apiNo = namesKey(); saveNow(); closeSheet(); renderAll(); showToast('已解除联网连接'); break;
    // 功能
    case 'menu': setMid(false); openSheet('menu'); break;
    case 'help': openSheet('help'); break;
    case 'defs': setMid(false); openSheet('defs'); break;
    case 'clock': setMid(false); if (M.st === 2){ endedToast(); break; } openClock(); break;
    case 'arch': setMid(false); openSheet('arch', { tab: 'list' }); break;
    case 'wstats': openSheet('arch', { tab: 'stats' }); break;
    case 'wback': openSheet('arch', { tab: 'back' }); break;
    case 'wtab': d.tab = b.dataset.v; renderSheet(); break;
    case 'wf': d.f = b.dataset.v; renderSheet(); break;
    case 'wopen': d.open = d.open === b.dataset.id ? null : b.dataset.id; d.del = null; renderSheet(); break;
    case 'mopen': { const m = store[b.dataset.id]; if (!m) break; saveNow(); pauseClock(); if (M.st !== 2 && !hasContent(M) && store[M.id]){ delete store[M.id]; } M = m; OC[0] = OC[1] = null; saveNow(); closeSheet(); closeSugg(); renderAll(); showToast('已打开 ' + teamName(0) + ' vs ' + teamName(1)); break; }
    case 'mexp': { const m = store[b.dataset.id]; if (m) openExport([m]); break; }
    case 'mdel': { if (d.del !== b.dataset.id){ d.del = b.dataset.id; renderSheet(); break; } const m = store[b.dataset.id]; if (m){ dropMatch(m, '已删除 ' + (m.h || '主队') + ' vs ' + (m.a || '客队')); d.del = null; d.open = null; renderSheet(); } break; }
    case 'expall': saveNow(); openExport(whAll()); break;
    case 'expcsv': saveNow(); openCsv(whAll()); break;
    case 'expcsvh': saveNow(); openCsvHalf(whAll()); break;
    case 'exp1': saveNow(); openExport([M]); break;
    case 'import': openSheet('import'); break;
    case 'pickfile': $('#fileIn').click(); break;
    case 'imptext': importText($('#impText').value); break;
    case 'share': shareFile(); break;
    case 'download': downloadFile(); break;
    case 'copy': copyText(); break;
    case 'pip': openSheet('pip'); break;
    case 'pippos': PIP.pos = b.dataset.v; savePip(); renderSheet(); break;
    case 'piph': PIP.h = +b.dataset.v; savePip(); renderSheet(); break;
    case 'pipn': PIP.h = clamp(PIP.h + +b.dataset.d, 100, 320); savePip(); renderSheet(); break;
    // 计时
    case 'kick': { const p = +b.dataset.p; const dl = kick(p); save(); closeSheet(); renderAll(); showToast(PER[p][2] + '开球，计时开始' + delayNote(dl)); break; }
    case 'toggle': if (M.tm.r) pauseClock(); else startClock(); save(); renderAll(); renderSheet(); break;
    case 'endh': endFirstHalf(); OC[0] = OC[1] = null; save(); closeSheet(); renderAll(); showToast('上半场结束。下半场开球时按 ▶'); break;
    case 'nudge': setClock(clockOf(M) + +b.dataset.d); save(); renderAll(); renderSheet(); break;
    case 'tpp': tpHalf(d.tp, +b.dataset.p); renderSheet(); break;
    case 'tpn': tpSet(d.tp, tpNow(d.tp) + +b.dataset.d); tpShow(d.tp); break;
    case 'tpset': {
      const v = tpNow(d.tp);
      if (M.tm.ht && d.tp.p === 2){ M.tm.ht = 0; }
      if (d.tp.p !== M.tm.p){ if (d.tp.p === 2 && !M.pe[1]) M.pe[1] = Math.max(2700, maxT(M, 1)); M.tm.p = d.tp.p; }
      M.tm.b = v; if (M.tm.r) M.tm.at = Date.now();
      if (!M.obs || (!M.ev.some(e => !e.b) && !M.sv.length && !M.tm.r)) M.obs = { p: d.tp.p, t: v };
      const dl = M.api && M.tm.r ? learnDelay(clockOf(M), 'set') : null;
      save(); closeSheet(); renderAll(); showToast('时间设定为 ' + fmtClock(d.tp.p, v) + (M.tm.r ? '' : '，按 ▶ 开始计时') + delayNote(dl)); break;
    }
    // 补录、结束
    case 'fix': {
      setMid(false);
      if (M.st === 2){ endedToast(); break; }
      const all = [statOf(M, 0, 'ft'), statOf(M, 1, 'ft')];
      openSheet('fix', { sc: score(M), c1: cornersOf(M, 'h1'), c2: cornersOf(M, 'h2'), rc: [all[0].rc, all[1].rc] });
      sheetData.orig = JSON.parse(JSON.stringify(sheetData));
      break;
    }
    case 'fs': { const f = b.dataset.f, i = +b.dataset.i; d[f][i] = Math.max(0, d[f][i] + +b.dataset.d); renderSheet(); break; }
    case 'fsave': applyFix(d); closeSheet(); renderAll(); showToast('已保存'); break;
    case 'note': openSheet('note'); break;
    case 'finish': setMid(false); openSheet('finish'); break;
    case 'fkeep': finishMatch(); M.keep = 1; OC[0] = OC[1] = null; saveNow(); closeSheet(); renderAll(); showToast('已结束并加入仓库', startNew, '开始新比赛', 7000); break;
    case 'fdrop': closeSheet(); dropMatch(M, '已删除这场'); break;
    case 'reopen': M.st = 1; M.stop = null; save(); closeSheet(); renderAll(); showToast('已重新打开，可以接着记录'); break;
    case 'new': closeSheet(); askNew(); break;
    case 'nq1': finishMatch(); M.keep = 1; saveNow(); closeSheet(); startNew(); break;
    case 'nq2': closeSheet(); startNew(); break;
    case 'nq3': { closeSheet(); const old = M; delete store[old.id]; LS.set(KEY, store); M = newMatch(old); OC[0] = OC[1] = null; saveNow(); renderAll(); showToast('已删除，开始新比赛', () => { store[old.id] = old; LS.set(KEY, store); M = old; saveNow(); renderAll(); }); break; }
  }
});
card.addEventListener('input', ev => {
  if (ev.target.id === 'whQ' && sheetKind === 'arch'){ sheetData.q = ev.target.value; const l = $('#whList'); if (l) l.innerHTML = whListHTML(sheetData); return; }
  if (ev.target.id === 'noteIn'){ M.note = ev.target.value.slice(0, 2000); save(); return; }
  if (ev.target.id === 'tpR' && sheetData.tp){ tpSet(sheetData.tp, +ev.target.value); tpShow(sheetData.tp); }
});
sheet.addEventListener('click', ev => { if (ev.target === sheet) closeSheet(); });
$('#runBtn').addEventListener('click', () => {
  if (M.st === 2){ endedToast(); return; }
  if (M.tm.ht){ const dl = kick(2); save(); renderAll(); showToast('下半场开球' + delayNote(dl)); return; }
  if (M.tm.r) pauseClock();
  else { if (!M.tm.b && M.tm.p === 1 && !M.ev.some(e => !e.b)) { const dl = kick(1); showToast('上半场开球，计时开始' + delayNote(dl)); } else startClock(); }
  save(); renderAll();
});
for (const [id, key] of [['#fH', 'h'], ['#fA', 'a'], ['#fLg', 'lg']]){
  const el = $(id);
  el.addEventListener('focus', () => { if (M.st === 2){ el.blur(); endedToast(); } });
  el.addEventListener('input', () => { if (M.st === 2){ el.value = M[key]; return; } M[key] = el.value; save(); renderPads(); renderStats(); if (key !== 'lg'){ if (M.api && !M.ev.length){ M.api = null; } scheduleFind(); renderNet(); } });
  el.addEventListener('keydown', e => { if (e.key === 'Enter') el.blur(); });
}
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !sheet.hidden) closeSheet(); });
let wasPhone = isPhone();
window.addEventListener('resize', () => { if (isPhone() !== wasPhone){ wasPhone = isPhone(); setMid(false); renderAll(); } });

/* ================= 离线 ================= */
let offline = '离线使用：第一次联网打开后就能离线使用。';
if ('serviceWorker' in navigator && window.isSecureContext && location.protocol !== 'file:'){
  let hadCtrl = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadCtrl){ hadCtrl = true; return; }
    showToast('新版本已经下载好，你的记录都已存好', () => location.reload(), '现在更新', 30000);
  });
  navigator.serviceWorker.register('./sw.js').then(reg => {
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
    return navigator.serviceWorker.ready;
  }).then(() => { offline = '离线使用：已准备好，没有网络也能从主屏幕打开。'; }).catch(() => {});
}
renderAll();
window.__reach = { get M(){ return M; }, store: () => store, statOf: statOf, stateSplit: stateSplit, walk: walk, paLabel: paLabel, OC: OC, minsOf: minsOf,
  get MODEL(){ return MODEL; }, mAll: mAll, get MN(){ return MN; }, render: () => renderAll(), fmtMV: fmtMV, bucketOf: bucketOf, PREF: PREF };
