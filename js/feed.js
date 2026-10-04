// Live pump.fun data straight from PumpPortal's public websocket: new launches and trades for given mints.
// Reconnects with backoff; reports 'live' / 'connecting' / 'off' so the page can say honestly what it is showing.
const URL = 'wss://pumpportal.fun/api/data';
export function pumpFeed({ newTokens = false, mints = [], onToken, onTrade, onStatus } = {}) {
  let ws = null, closed = false, wait = 1500, timer = 0;
  const status = s => onStatus && onStatus(s);
  function open() {
    if (closed) return; status('connecting');
    try { ws = new WebSocket(URL); } catch (e) { return retry(); }
    ws.onopen = () => { wait = 1500; status('live');
      if (newTokens) ws.send(JSON.stringify({ method: 'subscribeNewToken' }));
      if (mints.length) ws.send(JSON.stringify({ method: 'subscribeTokenTrade', keys: mints })); };
    ws.onmessage = ev => { let d; try { d = JSON.parse(ev.data); } catch (e) { return; } if (!d || !d.mint) return;
      if (d.txType === 'create') onToken && onToken(d); else if (d.txType === 'buy' || d.txType === 'sell') onTrade && onTrade(d); };
    ws.onerror = () => { try { ws.close(); } catch (e) { } };
    ws.onclose = () => { if (!closed) { status('off'); retry(); } };
  }
  function retry() { clearTimeout(timer); timer = setTimeout(open, wait); wait = Math.min(30000, wait * 2); }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && ws && ws.readyState > 1) { wait = 1500; open(); } });
  open();
  return { close() { closed = true; clearTimeout(timer); try { ws && ws.close(); } catch (e) { } } };
}
