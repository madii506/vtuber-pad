// A VTuber's stream room: its character on stage, real trades on its coin in chat (PumpPortal),
// alerts and reactions, lines in its own personality, and an OBS overlay mode (?obs=1, add &voice=1 for speech).
import { $, B58, esc, short, usd, api, proxied, copy, sky, sol, loadImg } from './util.js';
import { stage } from './stage.js';
import { pumpFeed } from './feed.js';
import { line, houseLine } from './lines.js';

const q = new URLSearchParams(location.search);
const OBS = q.get('obs') === '1';
if (OBS) document.body.classList.add('obs'); else sky();
const mint = (location.pathname.match(/\/v\/([1-9A-HJ-NP-Za-km-z]{32,44})/) || [])[1] || q.get('mint') || '';
const MILES = [1e4, 2.5e4, 5e4, 1e5, 2.5e5, 5e5, 1e6, 2.5e6, 5e6, 1e7, 2.5e7, 5e7, 1e8];

function missing(t, p) { $('#roomBox').hidden = true; $('#miss').hidden = false; $('#missT').textContent = t; $('#missP').textContent = p || ''; }
function parseDesc(d) {
  d = String(d || ''); const cat = (/Catchphrase: "([^"]{1,60})"/.exec(d) || [])[1] || '';
  const bio = d.split(/\s(?:Personality:|Catchphrase:|Live on VTUBER\.)/)[0].trim();
  return { bio: bio === 'Live on VTUBER.' ? '' : bio, cat };
}

(async () => {
  if (!B58.test(mint)) return missing('That is not a coin address.', 'Stream rooms live at /v/ followed by the coin\'s mint address.');
  $('#miss').hidden = false;
  const j = await api('/api/coin?mint=' + encodeURIComponent(mint), {}, 30000);
  if (!j.ok) return missing(/not launched/.test(j.error || '') ? 'This coin is not a VTUBER.' : 'The stream could not load.', /not launched/.test(j.error || '') ? 'Only coins launched on VTUBER get a stream room. Launch one in a minute.' : (j.error || 'Try again in a moment.'));
  $('#miss').hidden = true; $('#roomBox').hidden = false;
  const c = j.coin; const { bio, cat } = parseDesc(c.desc); const sym = String(c.symbol || '').toUpperCase();
  const ctx = { name: c.name, symbol: sym, persona: c.persona || [], catchphrase: cat, bio };
  document.title = (c.name || 'VTUBER') + ' · VTUBER';
  const st = stage($('#rStage'), { img: c.icon ? proxied(c.icon) : null, name: c.name, sym, voice: c.voice, sound: OBS && q.get('voice') === '1' });

  /* talking: one line at a time, AI when allowed, house lines otherwise */
  let lastLine = 0, busy = false;
  async function talk(kind, extra = {}, force = false) {
    if (busy || (!force && Date.now() - lastLine < 5000)) return; busy = true; lastLine = Date.now();
    try { st.say(await line(kind, { ...ctx, ...extra })); } finally { busy = false; }
  }

  /* info */
  $('#rIcon').src = c.icon ? proxied(c.icon) : '/assets/mark-512.png'; $('#rName').textContent = c.name || 'Unnamed'; $('#rSym').textContent = '$' + sym; 
  $('#rBuy').href = 'https://pump.fun/coin/' + mint; $('#rChart').href = 'https://dexscreener.com/solana/' + mint;
  $('#rBio').textContent = bio || 'No bio yet.'; $('#rTraits').innerHTML = (c.persona || []).map(t => `<span>${esc(t)}</span>`).join('') + (c.voice ? `<span>voice: ${esc(c.voice)}</span>` : '');
  $('#rCopy').onclick = () => copy(mint, 'Contract address copied');
  // a shareable card of this exact moment: the character, what it just said, its name and ticker
  $('#rCard').onclick = async () => {
    const W = 1200, H = 675, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    try { await Promise.all([document.fonts.load('40px Mochiy'), document.fonts.load('700 30px ZenMaru'), document.fonts.load('20px DotGothic')]); } catch (e) { }
    g.fillStyle = '#1a0b2e'; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(255,255,255,.08)'; for (let x = 28; x < W; x += 64) for (let y = 28; y < H; y += 64) { g.beginPath(); g.arc(x, y, 2.4, 0, 7); g.fill(); }
    g.fillStyle = '#ff3fa4'; g.beginPath(); g.arc(W * .7, H * .52, 238, 0, 7); g.fill();
    const im = await loadImg(c.icon ? proxied(c.icon) : '/assets/mark-512.png');
    if (im) { const h = H * .8, w = h * im.width / im.height; g.save(); g.shadowColor = '#0e0618'; g.shadowOffsetX = 8; g.shadowOffsetY = 8; g.drawImage(im, W * .7 - w / 2, H - h - 40, w, h); g.restore(); }
    g.fillStyle = '#311a4f'; g.fillRect(0, H - 84, W, 84); g.fillStyle = '#0e0618'; g.fillRect(0, H - 84, W, 4);
    const line = ($('#rStage .sub').textContent || houseLine('hello', ctx)).slice(0, 140);
    g.font = '700 30px ZenMaru, sans-serif'; const words = line.split(' '), rows = []; let cur = '';
    for (const w of words) { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > 470 && cur) { rows.push(cur); cur = w; } else cur = t; } if (cur) rows.push(cur);
    const bh = 34 + rows.length * 40, bx = 48, by = H - 84 - bh - 26;
    g.fillStyle = '#0e0618'; rr(g, bx + 7, by + 7, 520, bh, 22); g.fill(); g.fillStyle = '#fff'; rr(g, bx, by, 520, bh, 22); g.fill(); g.lineWidth = 4; g.strokeStyle = '#0e0618'; g.stroke();
    g.fillStyle = '#0e0618'; rows.forEach((r, i) => g.fillText(r, bx + 22, by + 46 + i * 40));
    g.font = '400 54px Mochiy, sans-serif'; g.fillStyle = '#fff'; g.lineWidth = 8; g.strokeStyle = '#0e0618'; g.strokeText(c.name || '', 48, 104); g.fillText(c.name || '', 48, 104);
    g.font = '400 24px DotGothic, monospace'; g.fillStyle = '#ffe74c'; g.fillText('$' + sym + '  ·  LIVE ON VTUBER', 52, 146);
    g.font = '400 34px Mochiy, sans-serif'; g.textAlign = 'right'; g.lineWidth = 6; g.strokeStyle = '#0e0618'; g.strokeText('vtuber', W - 40, H - 28); g.fillStyle = '#ff3fa4'; g.fillText('vtuber', W - 40, H - 28); g.textAlign = 'left';
    g.fillStyle = '#ff2b4a'; rr(g, W - 150, 32, 112, 40, 10); g.fill(); g.fillStyle = '#fff'; g.font = '400 22px DotGothic, monospace'; g.fillText('● LIVE', W - 136, 60);
    cv.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = sym.toLowerCase() + '-moment.png'; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }, 'image/png');
  };
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  $('#rObs').onclick = () => copy(location.origin + '/v/' + mint + '?obs=1&voice=1', 'Overlay link copied. Add it to OBS as a Browser Source.');
  $('#rSound').onclick = () => { st.setSound(!st.sound); $('#rSound').textContent = st.sound ? 'Sound on' : 'Sound off'; $('#rSound').setAttribute('aria-pressed', st.sound); if (st.sound) st.say(houseLine('hello', ctx)); };
  let lastMc = null, mood0 = false;
  function market(m, coin) {
    const mc = (m && m.mcap) || coin.mcap || null; $('#rMcap').textContent = usd(mc);
    // mood from the real 5-minute price change: lemon when it runs, blue when it bleeds, honest chip with the number
    const m5 = m && m.chg && m.chg.m5 != null ? +m.chg.m5 : null, stg = $('#rStage'); let chip = $('#rMood');
    if (!chip) { chip = document.createElement('span'); chip.id = 'rMood'; chip.className = 'mood'; stg.append(chip); }
    if (m5 == null || !isFinite(m5)) { chip.hidden = true; stg.classList.remove('mood-up', 'mood-down'); }
    else { chip.hidden = false; chip.className = 'mood ' + (m5 >= 0 ? 'up' : 'down'); chip.textContent = '5M ' + (m5 >= 0 ? '▲ ' : '▼ ') + Math.abs(m5).toFixed(1) + '%';
      const was = stg.classList.contains('mood-up') ? 'up' : stg.classList.contains('mood-down') ? 'down' : '', now = m5 >= 5 ? 'up' : m5 <= -5 ? 'down' : '';
      stg.classList.toggle('mood-up', now === 'up'); stg.classList.toggle('mood-down', now === 'down');
      if (now && now !== was && mood0) { st.react(now === 'up' ? 'big' : 'sell'); talk(now === 'up' ? 'pump' : 'dump', {}, true); } }
    mood0 = true;
    const pct = coin.curve == null ? null : Math.round(coin.curve); $('#rCurve').style.width = (pct == null ? 0 : Math.min(100, pct)) + '%'; $('#rCurveL').textContent = pct == null ? 'BONDING —' : pct >= 100 ? 'BONDED' : 'BONDING ' + pct + '%';
    if (mc && lastMc) { const hit = MILES.filter(v => lastMc < v && mc >= v).pop(); if (hit) { st.alert('big', 'MILESTONE', usd(hit) + ' market cap'); st.react('big'); talk('milestone', { mc: usd(hit) }, true); } }
    if (mc) lastMc = mc;
  }
  market(j.market, c);
  setInterval(async () => { const r = await api('/api/coin?mint=' + encodeURIComponent(mint), {}, 20000); if (r.ok) market(r.market, r.coin); }, 30000);

  setTimeout(() => talk('hello', {}, true), 600);
  setInterval(() => { if (Date.now() - lastLine > 30000) talk('idle'); }, 4000);

  /* chat: real trades from PumpPortal */
  const msgs = $('#rMsgs'), pill = $('#rLive'); let offNoted = false;
  const msg = (html, cls = '') => { const el = document.createElement('div'); el.className = 'msg ' + cls; el.innerHTML = html; msgs.append(el); while (msgs.children.length > 30) msgs.firstElementChild.remove(); };
  msg('waiting for trades on $' + esc(sym) + '…', 'sys');
  pumpFeed({ mints: [mint],
    onStatus: s => { pill.classList.toggle('off', s !== 'live'); pill.querySelector('span').textContent = s === 'live' ? 'LIVE' : s === 'off' ? 'OFFLINE' : 'CONNECTING';
      if (s === 'off' && !offNoted) { offNoted = true; msg('live trades are offline right now. retrying…', 'sys'); } if (s === 'live') offNoted = false; },
    onTrade: d => {
      const amt = +d.solAmount || 0, sell = d.txType === 'sell', kind = sell ? 'sell' : amt >= 1 ? 'big' : 'buy';
      msg(`<span class="ph" style="background:${sell ? '#ffffff' : amt >= 1 ? '#2fe6ff' : '#ff3fa4'}"></span><div><b class="${sell ? 'l' : 'p'}">${esc(short(d.traderPublicKey))}</b> <em>${sell ? 'sold' : 'bought'}</em> ${sol(amt)} SOL</div>`);
      st.alert(kind, sell ? 'SELL' : kind === 'big' ? 'BIG BUY' : 'NEW BUY', `${sol(amt)} SOL · ${short(d.traderPublicKey)}`); st.react(kind);
      talk(kind, { s: sol(amt), sol: amt }, kind === 'big');
    } });
})();
