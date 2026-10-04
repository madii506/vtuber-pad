// The VTuber stage: the house mascot (an SVG that blinks and talks) or any uploaded character (PNGtuber bounce),
// typed subtitles, trade alerts, hearts, and the browser's own text-to-speech when sound is switched on.
import { $, esc, reduced } from './util.js';

export const HOUSE = `<svg viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<g stroke="#0e0618" stroke-width="46" stroke-linejoin="round" fill="#0e0618">
<polygon points="205,400 265,150 455,345"/><polygon points="795,400 735,150 545,345"/>
<rect x="170" y="330" width="660" height="460" rx="130"/><rect x="445" y="770" width="110" height="82"/><rect x="330" y="838" width="340" height="54" rx="27"/></g>
<g fill="#fff"><polygon points="205,400 265,150 455,345"/><polygon points="795,400 735,150 545,345"/>
<rect x="170" y="330" width="660" height="460" rx="130"/><rect x="445" y="770" width="110" height="82"/><rect x="330" y="838" width="340" height="54" rx="27"/></g>
<polygon points="248,360 278,228 392,338" fill="#ff3fa4"/><polygon points="752,360 722,228 608,338" fill="#ff3fa4"/>
<rect x="222" y="382" width="556" height="356" rx="88" fill="#1a0b2e"/>
<g class="look"><g class="eyes" style="transform-box:fill-box;transform-origin:center"><ellipse cx="390" cy="544" rx="52" ry="74" fill="#2fe6ff"/><ellipse cx="610" cy="544" rx="52" ry="74" fill="#2fe6ff"/>
<ellipse cx="376" cy="511" rx="16" ry="19" fill="#fff"/><ellipse cx="596" cy="511" rx="16" ry="19" fill="#fff"/><circle cx="409" cy="570" r="9" fill="#fff"/><circle cx="629" cy="570" r="9" fill="#fff"/></g></g>
<rect x="296" y="628" width="56" height="18" rx="9" fill="#ff3fa4"/><rect x="648" y="628" width="56" height="18" rx="9" fill="#ff3fa4"/>
<path class="mc" d="M452 640 q25 34 50 0 q25 34 50 0" fill="none" stroke="#ff3fa4" stroke-width="15" stroke-linecap="round"/>
<ellipse class="mo" cx="500" cy="652" rx="27" ry="22" fill="#ff3fa4" style="display:none"/>
<circle cx="754" cy="362" r="18" fill="#ff2b4a"/></svg>`;

const VOX = { sweet: { pitch: 1.55, rate: 1.04 }, low: { pitch: .7, rate: .94 }, robot: { pitch: .15, rate: .92 } };

export function stage(root, o = {}) {
  root.insertAdjacentHTML('beforeend', `<div class="ring"></div><div class="av"><div class="bob"></div></div><div class="hearts"></div><div class="tag"><b></b><span></span></div><div class="alerts" aria-live="polite"></div><div class="sub" data-who="" aria-live="polite"></div>`);
  const av = $('.av', root), bob = $('.bob', root), sub = $('.sub', root), alerts = $('.alerts', root), hearts = $('.hearts', root);
  const st = { voice: o.voice || 'sweet', sound: !!o.sound, typing: 0, svg: null, blinkT: 0 };
  function setImg(src) {
    if (!src) { bob.innerHTML = HOUSE; st.svg = $('svg', bob); return; }
    bob.innerHTML = ''; st.svg = null; const i = new Image(); i.alt = ''; i.decoding = 'async'; i.src = src; i.onerror = () => { bob.innerHTML = HOUSE; st.svg = $('svg', bob); }; bob.append(i);
  }
  function setTag(name, sym) { $('.tag b', root).textContent = name || ''; $('.tag span', root).textContent = sym ? '$' + String(sym).toUpperCase() : ''; sub.dataset.who = name || ''; }
  function mouth(open) { if (!st.svg) return; $('.mc', st.svg).style.display = open ? 'none' : ''; $('.mo', st.svg).style.display = open ? '' : 'none'; }
  (function blink() { st.blinkT = setTimeout(() => { if (st.svg && !reduced) { const e = $('.eyes', st.svg); e.style.transition = 'transform .07s'; e.style.transform = 'scaleY(.1)'; setTimeout(() => { e.style.transform = ''; }, 120); } blink(); }, 2600 + Math.random() * 3200); })();
  function speakTTS(text) {
    if (!st.sound || !('speechSynthesis' in window)) return false;
    try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text.replace(/[^\p{L}\p{N}\s.,!?'$-]/gu, ' ')); const v = VOX[st.voice] || VOX.sweet; u.pitch = v.pitch; u.rate = v.rate; u.volume = 1; speechSynthesis.speak(u); return true; } catch (e) { return false; }
  }
  function say(text) {
    text = String(text || '').slice(0, 160); const my = ++st.typing; speakTTS(text);
    av.classList.add('talk'); let i = 0, flap = 0; sub.textContent = '';
    const step = () => { if (my !== st.typing) return; i = Math.min(text.length, i + (reduced ? text.length : 1)); sub.textContent = text.slice(0, i); if (++flap % 3 === 0) mouth(flap % 6 === 0); if (i < text.length) setTimeout(step, 30); else setTimeout(() => { if (my === st.typing) { av.classList.remove('talk'); mouth(false); } }, 650); };
    step();
  }
  function alert(kind, title, text) {
    const el = document.createElement('div'); el.className = 'alert ' + (kind || ''); el.innerHTML = `<small>${esc(title)}</small>${esc(text)}`; alerts.prepend(el);
    while (alerts.children.length > 3) alerts.lastElementChild.remove();
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 360); }, 4200);
  }
  function burst(n = 6) { if (reduced) return; for (let k = 0; k < n; k++) { const h = document.createElement('i'); h.textContent = '♥'; h.style.left = (54 + Math.random() * 22) + '%'; h.style.setProperty('--r', (Math.random() * 40 - 20) + 'deg'); h.style.animationDelay = (k * .09) + 's'; h.style.color = ['#ff3fa4', '#2fe6ff', '#ffe74c', '#fff'][k % 4]; hearts.append(h); setTimeout(() => h.remove(), 2200); } }
  function react(kind) { if (reduced) return; av.classList.remove('jump', 'shake'); void av.offsetWidth; av.classList.add(kind === 'sell' ? 'shake' : 'jump'); if (kind !== 'sell') burst(kind === 'big' ? 14 : 6); }
  // the house mascot's eyes follow the pointer; a click on any avatar gets a reaction
  if (o.follow && !reduced) addEventListener('pointermove', e => { if (!st.svg) return; const r = av.getBoundingClientRect(); const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height * .55); const k = Math.min(1, Math.hypot(dx, dy) / 500), a = Math.atan2(dy, dx);
    $('.look', st.svg).style.transform = `translate(${(Math.cos(a) * 22 * k).toFixed(1)}px,${(Math.sin(a) * 16 * k).toFixed(1)}px)`; }, { passive: true });
  if (o.pokes) { av.style.cursor = 'pointer'; av.addEventListener('click', () => { react('buy'); say(o.pokes[Math.floor(Math.random() * o.pokes.length)]); o.onPoke && o.onPoke(); }); }
  setImg(o.img || null); setTag(o.name, o.sym);
  return { say, alert, react, burst, setImg, setTag, label: t => { $('.tag span', root).textContent = t || ''; }, setVoice: v => { st.voice = v; }, setSound: on => { st.sound = !!on; if (!on && 'speechSynthesis' in window) speechSynthesis.cancel(); }, get sound() { return st.sound; } };
}
