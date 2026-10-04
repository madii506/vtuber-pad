// Reads VTUBER launches from chain. Every launch carries the memo "vt:v1:<mint>:<persona>:<voice>" plus the read-only REG key.
const L = require('./_lib'); const C = require('./_cfg'); const X = require('./_pda');
const PUMP = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P';
const META = 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s';
const TOTAL = 793100000n * 1000000n;
const TRAITS = ['cute', 'chaotic', 'sleepy', 'tsundere', 'hype', 'deadpan', 'gremlin', 'elegant', 'nerdy', 'savage'];
const VOICES = ['sweet', 'low', 'robot'];
function parse(tx, sig, t) {
  if (!tx) return null; const logs = (tx.meta && tx.meta.logMessages) || [];
  const memo = logs.map(l => /Memo \(len \d+\): "(vt:v1:[^"]+)"/.exec(l)).find(Boolean); if (!memo) return null;
  const [, , mint, p, v] = memo[1].split(':'); if (!L.B58.test(mint || '')) return null;
  const persona = String(p || '').split('+').filter(x => TRAITS.includes(x)).slice(0, 2);
  const keys = tx.transaction.message.accountKeys || []; const dev = keys[0] && (keys[0].pubkey || keys[0]);
  return { mint, persona, voice: VOICES.includes(v) ? v : 'sweet', dev: String(dev || ''), sig, t: (t || 0) * 1000 };
}
async function getTx(sig) {
  try { return await L.rpc('getTransaction', [sig, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0, commitment: 'confirmed' }]); }
  catch (e) { return null; }
}
async function meta(mints) {
  const out = {}; const u = [...new Set(mints)].filter(m => L.B58.test(m));
  for (let i = 0; i < u.length; i += 90) { try { const j = await L.jup(u.slice(i, i + 90).join(',')); for (const t of j || []) out[t.id] = L.tok(t); } catch (e) { } }
  return out;
}
async function curves(mints) {
  const out = {}; if (!mints.length) return out;
  try { const pdas = mints.map(m => X.pda([Buffer.from('bonding-curve'), X.b58d(m)], PUMP)); const acc = await L.rpc('getMultipleAccounts', [pdas, { encoding: 'base64', commitment: 'confirmed' }]);
    (acc.value || []).forEach((a, i) => { if (!a) return; const b = Buffer.from(a.data[0], 'base64'); const rTok = b.readBigUInt64LE(24); const done = b[48] === 1; out[mints[i]] = done ? 100 : Math.max(0, Math.min(100, Number((TOTAL - rTok) * 10000n / TOTAL) / 100)); }); } catch (e) { }
  return out;
}
// the coin's own metadata (name, symbol, image, description) from its Metaplex account and the IPFS JSON it points to
async function card(mint) {
  try {
    const c = await L.getJson('https://frontend-api-v3.pump.fun/coins/' + mint, { headers: { accept: 'application/json' } }, 6000);
    if (c && c.mint === mint) return { name: c.name, symbol: c.symbol, icon: c.image_uri || null, desc: c.description || '', twitter: c.twitter || null, complete: !!c.complete };
  } catch (e) { }
  try {
    const pda = X.pda([Buffer.from('metadata'), X.b58d(META), X.b58d(mint)], META);
    const a = await L.rpc('getAccountInfo', [pda, { encoding: 'base64' }]); if (!a || !a.value) return null;
    const b = Buffer.from(a.value.data[0], 'base64'); let o = 65; const str = () => { const n = b.readUInt32LE(o); o += 4; const s = b.slice(o, o + n).toString('utf8').replace(/\0+$/, ''); o += n; return s; };
    const name = str(), symbol = str(), uri = str();
    let j = {}; const cid = /\/ipfs\/([A-Za-z0-9]{40,})/.exec(uri);
    for (const u of [uri].concat(cid ? ['https://dweb.link/ipfs/' + cid[1], 'https://gateway.pinata.cloud/ipfs/' + cid[1]] : [])) { try { j = await L.getJson(u, {}, 6000); break; } catch (e) { } }
    return { name: j.name || name, symbol: j.symbol || symbol, icon: j.image || null, desc: j.description || '', twitter: j.twitter || null, complete: null };
  } catch (e) { return null; }
}
async function list() {
  const sigs = await L.rpc('getSignaturesForAddress', [C.REG, { limit: 120, commitment: 'confirmed' }]); const ok = (sigs || []).filter(s => !s.err);
  const txs = []; for (let i = 0; i < ok.length; i += 20) txs.push(...await Promise.all(ok.slice(i, i + 20).map(s => getTx(s.signature))));
  const coins = txs.map((tx, i) => parse(tx, ok[i].signature, ok[i].blockTime)).filter(Boolean);
  const seen = new Set(); const uniq = coins.filter(c => !seen.has(c.mint) && seen.add(c.mint));
  const [m, cv] = await Promise.all([meta(uniq.map(c => c.mint)), curves(uniq.map(c => c.mint))]);
  for (const c of uniq) { Object.assign(c, m[c.mint] || {}, { mint: c.mint }); c.curve = cv[c.mint] ?? null; }
  return { coins: uniq };
}
async function byMint(mint) {
  let before, oldest = null;
  for (let p = 0; p < 3; p++) { const s = await L.rpc('getSignaturesForAddress', [mint, { limit: 1000, before, commitment: 'confirmed' }]); if (!s || !s.length) break; oldest = s[s.length - 1]; if (s.length < 1000) break; before = oldest.signature; }
  if (!oldest) return null;
  const c = parse(await getTx(oldest.signature), oldest.signature, oldest.blockTime); if (!c || c.mint !== mint) return null;
  const [m, cv] = await Promise.all([meta([c.mint]), curves([c.mint])]);
  Object.assign(c, m[c.mint] || {}, { mint: c.mint }); c.curve = cv[c.mint] ?? null; return c;
}
module.exports = { list, byMint, card, TRAITS, VOICES };
