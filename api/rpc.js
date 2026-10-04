// POST /api/rpc : a small allow-listed Solana RPC relay for the launch flow (lookup tables, simulate, send, status, balance).
const L = require('./_lib');
const ALLOW = new Set(['getMultipleAccounts', 'getLatestBlockhash', 'simulateTransaction', 'sendTransaction', 'getSignatureStatuses', 'getBalance', 'getAccountInfo']);
module.exports = L.wrap(async (req, res) => {
  const b = await L.body(req);
  if (!ALLOW.has(b.method)) return L.send(res, 400, { error: { message: 'method not allowed' } });
  try { const result = await L.rpc(b.method, b.params || [], 20000); L.send(res, 200, { result }); }
  catch (e) { L.send(res, 200, { error: { message: String(e.message || e).slice(0, 300) } }); }
});
