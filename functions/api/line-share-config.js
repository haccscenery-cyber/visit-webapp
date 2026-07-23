export function onRequestGet({ env }) {
  if (!env.LINE_LIFF_ID) {
    return new Response(JSON.stringify({ error: 'LINE sharing is not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
    });
  }
  return new Response(JSON.stringify({ liffId: env.LINE_LIFF_ID }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}
