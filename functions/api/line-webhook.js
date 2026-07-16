// Use this temporary endpoint only to retrieve the LINE group ID during setup.
// Configure the endpoint in LINE Developers and send a test message in the target group.
export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.LINE_CHANNEL_SECRET) return new Response('LINE_CHANNEL_SECRET is not configured', { status: 500 });
  const rawBody = await request.text();
  const isValid = await verifySignature(rawBody, request.headers.get('x-line-signature'), env.LINE_CHANNEL_SECRET);
  if (!isValid) return new Response('Invalid LINE signature', { status: 401 });

  const payload = JSON.parse(rawBody);
  for (const event of payload.events || []) {
    if (event.source?.type === 'group') console.log(JSON.stringify({ line_group_id: event.source.groupId, event_type: event.type }));
  }
  return new Response('OK');
}

async function verifySignature(body, signature, secret) {
  if (!signature) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  const expected = arrayBufferToBase64(digest);
  return timingSafeEqual(signature, expected);
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let value = '';
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value);
}

function timingSafeEqual(left, right) {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return result === 0;
}
