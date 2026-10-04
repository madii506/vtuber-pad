// small shared helpers
export const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const B58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
export const REG = '4NTiLGvYAQDKS1WEztJsoAmDApjnkjJwt3feFXsjVBdx';
export const TRAITS = ['cute', 'chaotic', 'sleepy', 'tsundere', 'hype', 'deadpan', 'gremlin', 'elegant', 'nerdy', 'savage'];
export const VOICES = ['sweet', 'low', 'robot'];
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const short = s => s ? String(s).slice(0, 4) + '…' + String(s).slice(-4) : '';
export const usd = n => n == null || !isFinite(n) ? '—' : n >= 1e9 ? '$' + (n / 1e9).toFixed(2) + 'B' : n >= 1e6 ? '$' + (n / 1e6).toFixed(2) + 'M' : n >= 1e3 ? '$' + (n / 1e3).toFixed(1) + 'K' : '$' + (+n).toFixed(n < 1 ? 4 : 0);
export const sol = n => (+n || 0) >= 10 ? (+n).toFixed(1) : (+n || 0).toFixed(2);
export const ago = t => { if (!t) return '—'; const s = Math.max(1, (Date.now() - t) / 1000); return s < 60 ? Math.floor(s) + 's' : s < 3600 ? Math.floor(s / 60) + 'm' : s < 86400 ? Math.floor(s / 3600) + 'h' : Math.floor(s / 86400) + 'd'; };
export async function api(path, opt = {}, ms = 20000) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), ms);
  try { const r = await fetch(path, { ...opt, signal: c.signal }); const j = await r.json().catch(() => ({ ok: false, error: 'bad reply (' + r.status + ')' })); if (!r.ok && j.ok !== false) j.ok = false; return j; }
  catch (e) { return { ok: false, error: e.name === 'AbortError' ? 'timed out' : 'network error' }; } finally { clearTimeout(t); }
}
export const post = (path, body, ms) => api(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }, ms);
export const proxied = u => u ? (/^(data:|blob:|\/)/.test(u) ? u : '/api/img?u=' + encodeURIComponent(u)) : '';
let toastT; export function toast(msg, ms = 3200) { let el = $('#toast'); if (!el) { el = document.createElement('div'); el.id = 'toast'; el.setAttribute('role', 'status'); document.body.append(el); } el.textContent = msg; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), ms); }
export function loadImg(src) { return new Promise(res => { if (!src) return res(null); const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }); }
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export async function copy(text, label = 'Copied') { try { await navigator.clipboard.writeText(text); toast(label); } catch (e) { toast('Copy failed. Select it by hand.'); } }
// names on pump.fun are anyone's; skip the ones we would not read out on stream
const BAD = /n[i1!]gg|f[a@]gg|r[a@]pe|porn|s[e3]x|nud[e3]|cum\b|dick|c[o0]ck|puss|t[i1]tt|onlyfan|hitler|nazi|kkk|isis|terror|child|loli|cp\b|kill|suicid|slave|retard|whore|slut|fuck|shit|https?:|\.com|t\.me/i;
export const clean = s => !BAD.test(String(s || ''));
// confetti in the brand colours
export function confetti(n = 110) {
  if (reduced) return;
  const c = document.createElement('canvas'); c.className = 'confetti'; document.body.append(c); const g = c.getContext('2d'); const W = c.width = innerWidth, H = c.height = innerHeight;
  const cols = ['#ff3fa4', '#2fe6ff', '#ffe74c', '#ffffff']; const P = Array.from({ length: n }, () => ({ x: W / 2 + (Math.random() - .5) * W * .3, y: H * .45, vx: (Math.random() - .5) * 16, vy: -Math.random() * 16 - 6, r: Math.random() * 6, s: 7 + Math.random() * 9, c: cols[Math.floor(Math.random() * cols.length)], k: Math.floor(Math.random() * 3) }));
  let f = 0; (function loop() { g.clearRect(0, 0, W, H); for (const p of P) { p.vy += .45; p.x += p.vx; p.y += p.vy; p.r += .12; g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.strokeStyle = '#0e0618'; g.lineWidth = 2;
      if (p.k === 0) { g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); } else if (p.k === 1) { g.beginPath(); g.arc(0, 0, p.s / 2.4, 0, 7); g.fill(); g.stroke(); } else { star(g, p.s / 1.6); g.fill(); g.stroke(); } g.restore(); }
    if (++f < 150) requestAnimationFrame(loop); else c.remove(); })();
}
function star(g, r) { g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * .38 : r; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); }
// the moving background: twinkling sparkles that re-roll, and slow hearts drifting up (paused when hidden)
export function sky() {
  const c = document.getElementById('bg'); if (!c || reduced) return; const g = c.getContext('2d'); let W, H, dpr = Math.min(2, devicePixelRatio || 1);
  const fit = () => { W = c.width = innerWidth * dpr; H = c.height = innerHeight * dpr; }; fit(); addEventListener('resize', fit);
  const cols = ['#ff3fa4', '#2fe6ff', '#ffe74c', '#ffffff'];
  const S = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), s: 2 + Math.random() * 5, c: cols[Math.floor(Math.random() * 4)], t: Math.random() * 100, v: .00012 + Math.random() * .0004, k: Math.random() < .25 }));
  let last = 0, on = true; document.addEventListener('visibilitychange', () => { on = !document.hidden; if (on) requestAnimationFrame(loop); });
  function loop(ts) { if (!on) return; requestAnimationFrame(loop); if (ts - last < 42) return; last = ts; g.clearRect(0, 0, W, H);
    for (const p of S) { p.t += 1; p.y -= p.v; if (p.y < -.02) { p.y = 1.02; p.x = Math.random(); } const tw = (Math.sin(p.t * .12 + p.x * 9) + 1) / 2; const a = p.k ? .28 : .12 + tw * .4; if (!p.k && Math.random() < .004) p.c = cols[Math.floor(Math.random() * 4)];
      g.globalAlpha = a; g.fillStyle = p.c; g.save(); g.translate(p.x * W, p.y * H); const r = p.s * dpr * (p.k ? 1.4 : .6 + tw * .7);
      if (p.k) { g.beginPath(); g.moveTo(0, r * .35); g.bezierCurveTo(r * .9, -r * .35, r * .35, -r * 1.05, 0, -r * .45); g.bezierCurveTo(-r * .35, -r * 1.05, -r * .9, -r * .35, 0, r * .35); g.fill(); }
      else star(g, r), g.fill(); g.restore(); }
    g.globalAlpha = 1; }
  requestAnimationFrame(loop);
}
// staggered pop-in for anything marked .rv; new nodes can be passed to reveal.watch()
export const reveal = (() => {
  let io = null;
  const show = el => { const sib = el.parentElement ? [...el.parentElement.children].filter(x => x.classList.contains('rv')) : []; el.style.transitionDelay = Math.min(6, Math.max(0, sib.indexOf(el))) * 70 + 'ms'; el.classList.add('vis'); };
  function watch(els) { for (const el of els) { if (reduced || !io) show(el); else io.observe(el); } }
  function init() {
    if ('IntersectionObserver' in window && !reduced) io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    watch(document.querySelectorAll('.rv'));
    // backstop: anything already on screen shows even if the observer never fires
    setTimeout(() => document.querySelectorAll('.rv:not(.vis)').forEach(el => { const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) show(el); }), 1500);
  }
  return { init, watch };
})();
