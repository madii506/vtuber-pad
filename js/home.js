// Home: the first screen is a live stream. The house VTuber hosts pump.fun's real launch feed, a marquee carries
// the newest coins, the OBS section runs the real overlay, and the roster lists every VTUBER launch from chain.
import { $, $$, esc, usd, api, proxied, clean, sky, sol, reduced, TRAITS, reveal } from './util.js';
import { stage } from './stage.js';
import { pumpFeed } from './feed.js';
import { houseLine } from './lines.js';

sky(); reveal.init();
// the audience on the hero desk: one of them hops whenever something happens on stream
const crowdHop = () => { const k = [...document.querySelectorAll('#crowd img')]; if (!k.length || reduced) return; const im = k[Math.floor(Math.random() * k.length)]; im.classList.remove('hop'); void im.offsetWidth; im.classList.add('hop'); };

/* ---------- hero: the host reads new pump.fun launches ---------- */
const host = stage($('#heroStage'), { name: 'VTUBER', follow: true, pokes: ['hey! that tickles', 'boop! you found me', 'careful, i am live!', 'hi hi! launch me a friend?', 'click the pink button, not me!'], onPoke: () => { lastTalk = Date.now(); crowdHop(); } });
$('#heroStage .tag span').textContent = 'HOST · 配信中';
const demo = stage($('#obsStage'), { name: 'YOUR VTUBER' });
const say = t => { host.say(t); setTimeout(() => demo.say(t), 400); };
const msgs = $('#feedMsgs'), pill = $('#feedLive');
const COLS = ['#ff3fa4', '#2fe6ff', '#ffe74c', '#5dffb0', '#ffffff'];
const queue = []; let newest = null, lastTalk = Date.now(), seen = 0, offNoted = false;
function msg(html, cls = '') { const el = document.createElement('div'); el.className = 'msg ' + cls; el.innerHTML = html; msgs.append(el); while (msgs.children.length > 26) msgs.firstElementChild.remove(); }
function status(s) {
  pill.classList.toggle('off', s !== 'live'); pill.querySelector('span').textContent = s === 'live' ? 'LIVE' : s === 'off' ? 'OFFLINE' : 'CONNECTING';
  if (s === 'off' && !offNoted) { offNoted = true; msg('the pump.fun feed is offline right now. retrying…', 'sys'); say('my feed dropped. one sec, reconnecting!'); }
  if (s === 'live') { if (offNoted) msg('feed is back.', 'sys'); offNoted = false; }
}
pumpFeed({ newTokens: true, onStatus: status, onToken: d => {
  if (!clean(d.name) || !clean(d.symbol) || !d.symbol) return;
  queue.push(d); if (queue.length > 18) queue.splice(0, queue.length - 18);
} });
setInterval(() => {
  const d = queue.shift(); if (!d) return; seen++; newest = d; $('#feedN').textContent = '· ' + seen;
  const c = COLS[seen % COLS.length], s = String(d.symbol).slice(0, 12).toUpperCase();
  msg(`<span class="ph" style="background:${c}"></span><div><b class="${seen % 3 ? 'p' : 'l'}">$${esc(s)}</b> <em>${esc(String(d.name).slice(0, 32))}</em>${d.solAmount > 0 ? ` · dev buy ${sol(d.solAmount)} SOL` : ''}</div>`);
  marq.add(`<i>NEW</i>$${esc(s)}`);
}, 900);
setInterval(() => {
  const now = Date.now();
  if (newest && now - lastTalk > 7500) { const d = newest; newest = null; lastTalk = now; const t2 = String(d.symbol).slice(0, 12);
    say(houseLine('coin', { t2 })); host.alert(seen % 4 === 0 ? 'big' : '', 'NEW COIN', '$' + t2.toUpperCase() + ' · ' + String(d.name).slice(0, 26)); host.react('buy'); demo.react('buy'); crowdHop(); }
  else if (now - lastTalk > 22000) { lastTalk = now; say(houseLine('idle', { name: 'VTUBER' })); }
}, 1000);
msg('welcome to the chat! new pump.fun coins show up here the second they launch.', 'sys');
setTimeout(() => { lastTalk = Date.now(); say('hiii chat! every new pump.fun coin pops up in chat as it launches. launch yours and get your own stream.'); }, 700);

/* ---------- marquee: brand lines first, then the newest real launches as they arrive ---------- */
const marq = (() => {
  const box = $('#marq'), base = ['EVERY COIN BECOMES A VTUBER', 'LAUNCH ON PUMP.FUN', 'LIVE THE SAME MINUTE', 'REACTS TO EVERY TRADE', 'STREAM IT IN OBS'];
  let x = 0, last = 0, bi = 0;
  const mk = h => { const s = document.createElement('span'); s.innerHTML = h; return s; };
  const top = () => { let g = 0; while (box.scrollWidth + x < innerWidth * 2 && g++ < 30) box.append(mk(base[bi++ % base.length])); };
  top();
  function tick(ts) { requestAnimationFrame(tick); const dt = Math.min(64, ts - (last || ts)); last = ts; if (reduced) return;
    x -= dt * .06; const f = box.firstElementChild; if (f && -x > f.offsetWidth) { x += f.offsetWidth; f.remove(); } top();
    box.style.transform = `translateX(${x}px)`; }
  requestAnimationFrame(tick);
  // a new launch enters at the right edge straight away
  return { add(h) { const s = mk(h), at = [...box.children].find(k => k.offsetLeft + x > innerWidth); at ? box.insertBefore(s, at) : box.append(s); } };
})();

/* ---------- roster: every VTUBER launch from chain, the house host, and open slots ---------- */
function card(c) {
  const pct = c.curve == null ? null : Math.round(c.curve);
  return `<a class="card" href="/v/${esc(c.mint)}"><div class="pic">${c.icon ? `<img src="${esc(proxied(c.icon))}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">` : ''}<span class="live"><i></i>LIVE</span></div>
  <b>${esc(c.name || 'Unnamed')}</b><div class="row"><span class="sym">$${esc(String(c.symbol || '').toUpperCase())}</span><span>${usd(c.mcap)}</span></div>
  ${pct == null ? '' : `<div class="row"><span>${pct >= 100 ? 'bonded' : 'bonding ' + pct + '%'}</span></div><div class="meter"><i style="width:${Math.min(100, pct)}%"></i></div>`}</a>`;
}
const HOUSE = `<a class="card house" href="#top"><div class="pic"><img src="/assets/mark-512.png" alt=""><span class="live"><i></i>LIVE</span></div><b>VTUBER host</b><div class="row"><span class="sym">ON AIR</span><span>pump.fun launches</span></div></a>`;
const SLOT = `<a class="card slot" href="/launch"><div class="pic"><span>?</span></div><b>Your VTuber</b><div class="row"><span class="sym">$TICKER</span><span>Launch →</span></div></a>`;
(async () => {
  const j = await api('/api/coins', {}, 30000); const l = (j && j.ok && j.coins) || [];
  const slots = Math.max(0, 3 - l.length);
  $('#roster').innerHTML = l.map(card).join('') + HOUSE + SLOT.repeat(slots);
  $$('#roster .card').forEach(c => c.classList.add('rv')); reveal.watch($$('#roster .card'));
  if (!j.ok) { $('#rosterNote').hidden = false; $('#rosterNote').textContent = 'The roster is offline right now. Launches still work.'; }
})();

/* ---------- personality: the same line engine the streams use, one sample VTuber per vibe ---------- */
const CAST = { cute: 'bunbun', elegant: 'bunbun', chaotic: 'kitsu', gremlin: 'kitsu', sleepy: 'kuma', savage: 'kuma', hype: 'hoshi', tsundere: 'hoshi', nerdy: 'drako', deadpan: 'drako' };
const NAMES = { bunbun: 'Bunbun', kitsu: 'Kitsu', kuma: 'Kuma', hoshi: 'Hoshi', drako: 'Drako' };
const pers = stage($('#persStage'), { name: 'Bunbun', img: '/assets/cast/bunbun.png', pokes: ['hehe, hi!', 'that is my ear!', 'boop'] });
let auto = true, ti = 0, cur = '';
$('#persChips').innerHTML = TRAITS.map(t => `<button type="button" data-t="${t}" aria-pressed="false">${t}</button>`).join('');
function vibe(t, user) {
  if (user) auto = false; const who = CAST[t];
  if (who !== cur) { pers.setImg('/assets/cast/' + who + '.png'); cur = who; }
  pers.setTag(NAMES[who]); pers.label(t.toUpperCase());
  $$('#persChips button').forEach(b => { const on = b.dataset.t === t; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  const kinds = ['hello', 'buy', 'idle', 'sell', 'big']; const kind = kinds[Math.floor(Math.random() * kinds.length)];
  pers.say(houseLine(kind, { name: NAMES[who], symbol: who.toUpperCase(), persona: [t], s: kind === 'big' ? '3.20' : '0.42' })); pers.react(kind === 'sell' ? 'sell' : kind === 'big' ? 'big' : 'buy');
}
$('#persChips').addEventListener('click', e => { const b = e.target.closest('button'); if (b) vibe(b.dataset.t, true); });
$('#persHear').addEventListener('click', () => { const on = !pers.sound; pers.setSound(on); $('#persHear').textContent = on ? 'Sound on' : 'Hear it'; $('#persHear').setAttribute('aria-pressed', on); vibe($('#persChips button.on')?.dataset.t || 'cute', true); });
const io = new IntersectionObserver(es => { if (es[0].isIntersecting && auto && !ti) { vibe('cute'); ti = setInterval(() => { if (!auto) return clearInterval(ti); vibe(TRAITS[(TRAITS.indexOf($('#persChips button.on')?.dataset.t) + 1) % TRAITS.length]); }, 6500); } }, { threshold: .35 });
io.observe($('#persona'));
