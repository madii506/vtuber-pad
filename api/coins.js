// GET /api/coins : every VTuber launched on VTUBER, rebuilt from chain (memo + REG key), with market cap and bonding curve.
const L = require('./_lib'); const C = require('./_cfg'); const R = require('./_registry');
module.exports = L.wrap(async (req, res) => {
  const out = await L.cached('coins', 45000, async () => { const r = await R.list(); return { ok: true, ts: Date.now(), reg: C.REG, cfg: { CA: C.CA, X: C.X, BUY: C.BUY }, ...r }; });
  L.send(res, 200, out, 's-maxage=30, stale-while-revalidate=120');
});
