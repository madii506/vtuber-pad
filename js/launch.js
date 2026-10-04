// Launch: upload a character, write its personality, deploy its coin on pump.fun from the user's own wallet,
// tagged with the VTUBER memo + registry key so its stream room and the roster can find it on chain.
import { $, $$, REG, TRAITS, VOICES, esc, short, post, toast, loadImg, confetti, sky } from './util.js';
import { stage } from './stage.js';
import { houseLine } from './lines.js';

sky();
const MEMO = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr', CB = 'ComputeBudget111111111111111111111111111111';
const S = { img: null, traits: [], voice: 'sweet', busy: false };
const pv = stage($('#pvStage'), { name: 'Your VTuber', sym: 'TICKER' });
const ctx = () => ({ name: $('#fName').value.trim() || 'your vtuber', symbol: $('#fTick').value.trim() || 'TICKER', persona: S.traits, catchphrase: $('#fCatch').value.trim(), s: '0.50' });

/* ---------- form ---------- */
$('#traits').innerHTML = TRAITS.map(t => `<button type="button" data-t="${t}" aria-pressed="false">${t}</button>`).join('');
$('#voices').innerHTML = VOICES.map(v => `<button type="button" data-v="${v}" aria-pressed="${v === S.voice}" class="${v === S.voice ? 'on' : ''}">${v}</button>`).join('');
$('#buys').innerHTML = [0, 0.1, 0.5, 1].map(b => `<button type="button" data-b="${b}" class="${b === 0 ? 'on' : ''}">${b ? b + ' SOL' : 'none'}</button>`).join('');
$('#traits').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const t = b.dataset.t;
  if (S.traits.includes(t)) S.traits = S.traits.filter(x => x !== t); else { S.traits.push(t); if (S.traits.length > 2) S.traits.shift(); }
  $$('#traits button').forEach(x => { const on = S.traits.includes(x.dataset.t); x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
  if (S.traits.includes(t)) pv.say(houseLine(Math.random() < .5 ? 'hello' : 'buy', ctx())); });
$('#voices').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.voice = b.dataset.v; pv.setVoice(S.voice);
  $$('#voices button').forEach(x => { const on = x.dataset.v === S.voice; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); }); if (pv.sound) pv.say(houseLine('hello', ctx())); });
$('#buys').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $('#fBuy').value = b.dataset.b; $$('#buys button').forEach(x => x.classList.toggle('on', x === b)); });
$('#fBuy').addEventListener('input', () => $$('#buys button').forEach(x => x.classList.toggle('on', +x.dataset.b === +$('#fBuy').value)));
$('#hear').addEventListener('click', () => { pv.setSound(true); pv.say(houseLine('hello', ctx())); $('#hear').textContent = 'Sound on'; });
function counters() { $('#cName').textContent = $('#fName').value.length + '/32'; $('#cBio').textContent = $('#fBio').value.length + '/200'; $('#cCatch').textContent = $('#fCatch').value.length + '/60'; }
let tickTouched = false;
$('#fTick').addEventListener('input', () => { tickTouched = true; const v = $('#fTick').value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10); if (v !== $('#fTick').value) $('#fTick').value = v; sync(); });
$('#fName').addEventListener('input', () => { if (!tickTouched) $('#fTick').value = $('#fName').value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6); sync(); });
['#fBio', '#fCatch', '#fX'].forEach(s => $(s).addEventListener('input', sync));
let sayT = 0;
function sync() { counters(); pv.setTag($('#fName').value.trim() || 'Your VTuber', $('#fTick').value.trim() || 'TICKER'); check();
  clearTimeout(sayT); sayT = setTimeout(() => { if ($('#fName').value.trim()) pv.say(houseLine('hello', ctx())); }, 900); }
function check() { const ok = !!(S.img && $('#fName').value.trim() && /^[A-Z0-9]{2,10}$/.test($('#fTick').value.trim())); $('#launchBtn').disabled = !ok || S.busy; return ok; }

/* ---------- image: fit the whole character into a 512 square, transparency kept ---------- */
async function fit(dataURL) { const img = await loadImg(dataURL); if (!img) return null; const Z = 512, c = document.createElement('canvas'); c.width = c.height = Z; const g = c.getContext('2d');
  const k = Math.min(Z / img.width, Z / img.height); g.drawImage(img, (Z - img.width * k) / 2, (Z - img.height * k) / 2, img.width * k, img.height * k);
  let d = c.toDataURL('image/png'); if (d.length > 1.4e6) d = c.toDataURL('image/webp', .92); return d; }
async function take(file) {
  if (!file) return; if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) return toast('Use a PNG, JPG, WEBP or GIF.'); if (file.size > 8e6) return toast('That image is over 8 MB.');
  const raw = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.onerror = () => r(null); fr.readAsDataURL(file); });
  const d = raw && await fit(raw); if (!d) return toast('That image could not be read.');
  S.orig = d; S.cut = false; $('#rmbg').textContent = 'Remove background'; $('#imgTools').hidden = !(await solid(d));
  S.img = d; $('#thumb').style.backgroundImage = `url("${d}")`; $('#dropT').textContent = file.name.slice(0, 40); pv.setImg(d); pv.react('buy'); pv.say(houseLine('hello', ctx())); check();
}
// remove a flat background: flood-fill from the corners of the picture, soften the edge
async function pixels(d) { const img = await loadImg(d); const Z = 512, c = document.createElement('canvas'); c.width = c.height = Z; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, Z, Z); return { c, g, id: g.getImageData(0, 0, Z, Z), Z }; }
function box(p, Z) { let x0 = Z, y0 = Z, x1 = -1, y1 = -1; for (let y = 0; y < Z; y++) for (let x = 0; x < Z; x++) if (p[(y * Z + x) * 4 + 3] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } return x1 < 0 ? null : [x0, y0, x1, y1]; }
async function solid(d) { const { id, Z } = await pixels(d), p = id.data, b = box(p, Z); if (!b) return false; return [[b[0], b[1]], [b[2], b[1]], [b[0], b[3]], [b[2], b[3]]].every(([x, y]) => p[(y * Z + x) * 4 + 3] === 255); }
async function cutout(d) {
  const { c, g, id, Z } = await pixels(d), p = id.data, b = box(p, Z); if (!b) return d; const seen = new Uint8Array(Z * Z);
  for (const [sx, sy] of [[b[0], b[1]], [b[2], b[1]], [b[0], b[3]], [b[2], b[3]]]) {
    const s0 = sy * Z + sx, r = p[s0 * 4], gg = p[s0 * 4 + 1], bb = p[s0 * 4 + 2], st = [s0];
    while (st.length) { const i = st.pop(); if (seen[i]) continue; const o = i * 4; if (p[o + 3] && Math.abs(p[o] - r) + Math.abs(p[o + 1] - gg) + Math.abs(p[o + 2] - bb) > 66) continue;
      seen[i] = 1; p[o + 3] = 0; const x = i % Z, y = (i / Z) | 0; if (x > 0) st.push(i - 1); if (x < Z - 1) st.push(i + 1); if (y > 0) st.push(i - Z); if (y < Z - 1) st.push(i + Z); }
  }
  for (let i = 0; i < Z * Z; i++) if (!seen[i] && p[i * 4 + 3]) { const x = i % Z, y = (i / Z) | 0; if ((x > 0 && seen[i - 1]) || (x < Z - 1 && seen[i + 1]) || (y > 0 && seen[i - Z]) || (y < Z - 1 && seen[i + Z])) p[i * 4 + 3] = 170; }
  g.putImageData(id, 0, 0); return c.toDataURL('image/png');
}
$('#rmbg').addEventListener('click', async () => {
  if (!S.orig) return; $('#rmbg').disabled = true;
  try { S.cut = !S.cut; S.img = S.cut ? await cutout(S.orig) : S.orig; $('#rmbg').textContent = S.cut ? 'Undo' : 'Remove background';
    $('#thumb').style.backgroundImage = `url("${S.img}")`; pv.setImg(S.img); pv.react('buy'); if (S.cut) pv.say('ooh, no background. i feel so free'); }
  finally { $('#rmbg').disabled = false; }
});
$('#file').addEventListener('change', e => take(e.target.files[0]));
['dragenter', 'dragover'].forEach(ev => $('#drop').addEventListener(ev, e => { e.preventDefault(); $('#drop').classList.add('over'); }));
['dragleave', 'drop'].forEach(ev => $('#drop').addEventListener(ev, e => { e.preventDefault(); $('#drop').classList.remove('over'); if (ev === 'drop') take(e.dataTransfer.files[0]); }));

/* ---------- wallet + launch (pump.fun create via PumpPortal, tagged with the VTUBER memo + REG key) ---------- */
const provider = () => (window.phantom && window.phantom.solana) || window.solflare || window.backpack || window.solana || null;
let addr = null;
async function connect() { const p = provider(); if (!p) { toast('No Solana wallet found. Install Phantom, Solflare or Backpack.'); return null; } const r = await p.connect(); addr = ((r && r.publicKey) || p.publicKey).toString(); return p; }
const b64d = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const b64e = u => { let s = ''; const a = new Uint8Array(u); for (let i = 0; i < a.length; i += 0x8000) s += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000)); return btoa(s); };
const rpc = async (method, params) => { const j = await post('/api/rpc', { method, params }, 25000); if (j.error) throw new Error(j.error.message || j.error); if (!('result' in j)) throw new Error('rpc unavailable'); return j.result; };
const script = src => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error(src + ' did not load')); document.head.append(s); });
async function loadWeb3() { if (!window.Buffer) await script('/vendor/buffer.min.js'); if (!window.solanaWeb3) await script('/vendor/web3.min.js'); }
async function tag(vtx, text, payer) {
  const W = window.solanaWeb3, msg = vtx.message, looks = msg.addressTableLookups || []; let alts = [];
  if (looks.length) { const r = await rpc('getMultipleAccounts', [looks.map(l => l.accountKey.toBase58()), { encoding: 'base64' }]); alts = r.value.map((a, i) => new W.AddressLookupTableAccount({ key: looks[i].accountKey, state: W.AddressLookupTableAccount.deserialize(b64d(a.data[0])) })); }
  const dec = W.TransactionMessage.decompile(msg, { addressLookupTableAccounts: alts });
  for (const ix of dec.instructions) if (ix.programId.toBase58() === CB && ix.data[0] === 2) { const dv = new DataView(ix.data.buffer, ix.data.byteOffset, ix.data.length); dv.setUint32(1, dv.getUint32(1, true) + 30000, true); }
  dec.instructions.push(new W.TransactionInstruction({ programId: new W.PublicKey(MEMO), keys: [], data: new TextEncoder().encode(text) }));
  const t = W.SystemProgram.transfer({ fromPubkey: payer, toPubkey: payer, lamports: 0 }); t.keys.push({ pubkey: new W.PublicKey(REG), isSigner: false, isWritable: false }); dec.instructions.push(t);
  const tagged = new W.VersionedTransaction(dec.compileToV0Message(alts));
  const sim = await rpc('simulateTransaction', [b64e(tagged.serialize()), { encoding: 'base64', sigVerify: false, replaceRecentBlockhash: true, commitment: 'confirmed' }]);
  if (sim && sim.value && sim.value.err) { const logs = (sim.value.logs || []).join(' '); throw new Error(/insufficient|0x1\b/i.test(logs + JSON.stringify(sim.value.err)) ? 'not enough SOL in this wallet for the launch and dev buy' : 'the launch failed simulation: ' + JSON.stringify(sim.value.err)); }
  return tagged;
}
function log(t, cls = '') { const el = $('#log'); el.hidden = false; const li = document.createElement('li'); li.className = cls; li.innerHTML = t; el.appendChild(li); return li; }
async function launch(e) {
  e && e.preventDefault(); if (S.busy || !check()) return;
  const name = $('#fName').value.trim().slice(0, 32), sym = $('#fTick').value.trim().toUpperCase().slice(0, 10), bio = $('#fBio').value.trim(), cat = $('#fCatch').value.trim().replace(/"/g, "'"), x = $('#fX').value.trim(), buy = Math.max(0, Math.min(50, +($('#fBuy').value || 0)));
  if (x && !/^https:\/\/(x|twitter)\.com\/[A-Za-z0-9_]{1,15}\/?$/.test(x)) { toast('The X link should look like https://x.com/yourhandle'); return; }
  S.busy = true; $('#launchBtn').disabled = true; $('#log').innerHTML = ''; $('#born').hidden = true;
  try {
    log('Connecting your wallet…'); const p = await connect(); if (!p) throw new Error('no wallet'); log('Wallet ' + esc(short(addr)) + ' connected.', 'ok');
    await loadWeb3(); const W = window.solanaWeb3; const mintKp = W.Keypair.generate(); const mint = mintKp.publicKey.toBase58();
    const desc = [bio, S.traits.length ? `Personality: ${S.traits.join(', ')}.` : '', cat ? `Catchphrase: "${cat}".` : '', 'Live on VTUBER.'].filter(Boolean).join(' ').slice(0, 500);
    log('1/5 Uploading the character and metadata to pump.fun IPFS…');
    const ip = await post('/api/launch', { op: 'ipfs', image: S.img, name, symbol: sym, description: desc, twitter: x, website: location.origin + '/v/' + mint }, 45000);
    if (!ip.ok) throw new Error(ip.error || 'metadata upload failed');
    log('2/5 Building the pump.fun create transaction…');
    const tj = await post('/api/launch', { op: 'tx', publicKey: addr, mint, name, symbol: sym, uri: ip.uri, amount: buy }, 30000);
    if (!tj.ok) throw new Error(tj.error || 'launch build failed');
    log('3/5 Adding the VTUBER tag…'); const vtx = await tag(W.VersionedTransaction.deserialize(b64d(tj.tx)), `vt:v1:${mint}:${S.traits.join('+') || 'cute'}:${S.voice}`, new W.PublicKey(addr)); log('Tagged as a VTUBER launch.', 'ok');
    log('4/5 Approve it in your wallet…'); const signed = await p.signTransaction(vtx); signed.sign([mintKp]);
    const sig = await rpc('sendTransaction', [b64e(signed.serialize()), { encoding: 'base64', skipPreflight: false, preflightCommitment: 'confirmed', maxRetries: 3 }]);
    log(`5/5 Sent <a href="https://solscan.io/tx/${esc(sig)}" target="_blank" rel="noopener">${esc(short(sig))}</a>. Waiting for Solana…`);
    let ok = false;
    for (let i = 0; i < 40 && !ok; i++) { await new Promise(r => setTimeout(r, 1500)); try { const st = await rpc('getSignatureStatuses', [[sig]]); const v = st.value && st.value[0]; if (v && v.err) throw new Error('the launch failed on chain'); if (v && /confirmed|finalized/.test(v.confirmationStatus || '')) ok = true; } catch (er) { if (/failed on chain/.test(er.message)) throw er; } }
    if (!ok) { log('Not confirmed yet. Open the transaction link, it may still land.', 'err'); return; }
    confetti(140); pv.react('big'); pv.say(houseLine('hello', ctx()));
    const share = encodeURIComponent(`${name} ($${sym}) just went live as a VTuber on pump.fun\n${location.origin}/v/${mint}`);
    $('#born').innerHTML = `<b>You're live.</b><span>$${esc(sym)} is on pump.fun and its stream room is open.</span><div class="row"><a class="btn pink" href="/v/${esc(mint)}">Open the stream</a><a class="btn" href="https://pump.fun/coin/${esc(mint)}" target="_blank" rel="noopener">pump.fun</a><a class="btn" href="https://x.com/intent/post?text=${share}" target="_blank" rel="noopener">Post it</a></div>`;
    $('#born').hidden = false; log('Live. The roster picks it up within a minute.', 'ok');
  } catch (er) { if (er.message !== 'no wallet') log(esc(/reject|denied|cancel/i.test(er.message) ? 'You cancelled it in your wallet.' : er.message || String(er)), 'err'); }
  finally { S.busy = false; check(); }
}
$('#form').addEventListener('submit', launch);
counters(); check();
setTimeout(() => pv.say('hi! upload a character and i will show you how it looks on stream.'), 600);
