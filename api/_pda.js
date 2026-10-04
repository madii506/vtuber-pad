// Tiny Solana helpers with no dependencies: base58 and program-derived addresses (ed25519 off-curve check).
const crypto = require('crypto');
const ALPH = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function b58d(s) { let n = 0n; for (const c of s) { const i = ALPH.indexOf(c); if (i < 0) throw new Error('bad base58'); n = n * 58n + BigInt(i); } const out = []; while (n > 0n) { out.push(Number(n & 255n)); n >>= 8n; } for (const c of s) { if (c === '1') out.push(0); else break; } return Buffer.from(out.reverse()); }
function b58e(buf) { let n = 0n; for (const b of buf) n = (n << 8n) + BigInt(b); let s = ''; while (n > 0n) { s = ALPH[Number(n % 58n)] + s; n /= 58n; } for (const b of buf) { if (b === 0) s = '1' + s; else break; } return s; }
const P = (1n << 255n) - 19n;
const mod = a => ((a % P) + P) % P;
const pow = (b, e) => { let r = 1n; b = mod(b); while (e > 0n) { if (e & 1n) r = r * b % P; b = b * b % P; e >>= 1n; } return r; };
const D = mod(-121665n * pow(121666n, P - 2n));
const SQRTM1 = pow(2n, (P - 1n) / 4n);
function onCurve(bytes) {
  const b = Buffer.from(bytes); const sign = b[31] >> 7; b[31] &= 0x7f;
  let y = 0n; for (let i = 31; i >= 0; i--) y = (y << 8n) + BigInt(b[i]);
  if (y >= P) return false;
  const y2 = y * y % P, u = mod(y2 - 1n), v = mod(D * y2 + 1n);
  const x2 = u * pow(v, P - 2n) % P;
  if (x2 === 0n) return sign === 0;
  let x = pow(x2, (P + 3n) / 8n);
  if (mod(x * x - x2) !== 0n) { x = x * SQRTM1 % P; if (mod(x * x - x2) !== 0n) return false; }
  return true;
}
function pda(seeds, program) {
  const prog = typeof program === 'string' ? b58d(program) : program;
  for (let bump = 255; bump >= 0; bump--) {
    const h = crypto.createHash('sha256'); for (const s of seeds) h.update(typeof s === 'string' ? (s.length > 30 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(s) ? b58d(s) : Buffer.from(s)) : s);
    h.update(Buffer.from([bump])); h.update(prog); h.update(Buffer.from('ProgramDerivedAddress'));
    const d = h.digest(); if (!onCurve(d)) return b58e(d);
  }
  throw new Error('no pda');
}
module.exports = { b58d, b58e, pda };
