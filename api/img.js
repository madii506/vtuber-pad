// GET /api/img?u=<https image url> : same-origin copy of a coin logo so the stage can draw it (canvas needs CORS-clean images).
// Only public https images, max 1.5 MB, cached for a day.
const L = require('./_lib');
const PRIVATE = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.|\[?::1\]?|metadata)/i;
module.exports = async (req, res) => {
  try {
    const u = new URL(String((req.query || {}).u || ''));
    if (u.protocol !== 'https:' || PRIVATE.test(u.hostname)) return res.status(400).send('bad url');
    const cid = /\/ipfs\/([A-Za-z0-9]{40,})/.exec(u.pathname);
    const tries = [u.href].concat(cid ? ['https://dweb.link/ipfs/' + cid[1], 'https://gateway.pinata.cloud/ipfs/' + cid[1], 'https://cloudflare-ipfs.com/ipfs/' + cid[1]] : []);
    let r = null, type = '';
    for (const url of tries) { try { r = await L.get(url, { headers: { accept: 'image/*' }, redirect: 'follow' }, 7000); type = r.headers.get('content-type') || ''; if (r.ok && /^image\//.test(type) && !/svg/.test(type)) break; } catch (e) { } r = null; }
    if (!r) return res.status(415).send('not an image');
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 1.5e6) return res.status(413).send('too big');
    res.setHeader('Content-Type', type); res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    res.setHeader('Access-Control-Allow-Origin', '*'); res.status(200).send(buf);
  } catch (e) { res.status(502).send('fetch failed'); }
};
