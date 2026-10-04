// POST /api/launch : {op:'ipfs', image(dataURL), name, symbol, description, twitter, website} -> pump.fun metadata URI
//                    {op:'tx', publicKey, mint, name, symbol, uri, amount}              -> unsigned create tx (base64) from PumpPortal
// Nothing here signs anything. The browser signs with the user's wallet and the new mint key, and nothing else ever sees them.
const L = require('./_lib');
module.exports = L.wrap(async (req, res) => {
  if (req.method !== 'POST') return L.send(res, 405, { ok: false, error: 'POST only' });
  const b = await L.body(req);
  if (b.op === 'ipfs') {
    const m = /^data:(image\/[a-z+]+);base64,(.+)$/.exec(String(b.image || '')); if (!m) return L.send(res, 400, { ok: false, error: 'image missing' });
    const fd = new FormData();
    fd.append('file', new Blob([Buffer.from(m[2], 'base64')], { type: m[1] }), 'image.' + (m[1].split('/')[1] || 'png'));
    fd.append('name', String(b.name || '').slice(0, 32)); fd.append('symbol', String(b.symbol || '').slice(0, 10)); fd.append('description', String(b.description || '').slice(0, 500));
    if (b.twitter) fd.append('twitter', String(b.twitter)); if (b.website) fd.append('website', String(b.website)); fd.append('showName', 'true');
    const r = await L.get('https://pump.fun/api/ipfs', { method: 'POST', body: fd }, 25000); const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.metadataUri) return L.send(res, 502, { ok: false, error: 'pump.fun refused the image upload (' + r.status + ')' });
    return L.send(res, 200, { ok: true, uri: j.metadataUri });
  }
  if (b.op === 'tx') {
    if (!L.B58.test(b.publicKey || '') || !L.B58.test(b.mint || '')) return L.send(res, 400, { ok: false, error: 'bad wallet or mint' });
    const amount = Math.max(0, Math.min(50, +b.amount || 0));
    const r = await L.get('https://pumpportal.fun/api/trade-local', { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ publicKey: b.publicKey, action: 'create', tokenMetadata: { name: String(b.name).slice(0, 32), symbol: String(b.symbol).slice(0, 10), uri: b.uri }, mint: b.mint, denominatedInSol: 'true', amount, slippage: 10, priorityFee: 0.0005, pool: 'pump' }) }, 20000);
    if (!r.ok) return L.send(res, 502, { ok: false, error: 'pumpportal ' + r.status + ' ' + (await r.text()).slice(0, 160) });
    return L.send(res, 200, { ok: true, tx: Buffer.from(await r.arrayBuffer()).toString('base64') });
  }
  L.send(res, 400, { ok: false, error: 'unknown op' });
});
