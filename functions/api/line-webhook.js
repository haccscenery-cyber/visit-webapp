import { createReportFlexMessage, cumulativeTotals } from './line-send.js';

const LINE_REPLY_ENDPOINT = 'https://api.line.me/v2/bot/message/reply';

// Store direct-chat user IDs privately after LINE verifies the webhook
// signature. This lets the report button push to friends of the OA.
export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.LINE_CHANNEL_SECRET) return new Response('LINE_CHANNEL_SECRET is not configured', { status: 500 });
  const rawBody = await request.text();
  const isValid = await verifySignature(rawBody, request.headers.get('x-line-signature'), env.LINE_CHANNEL_SECRET);
  if (!isValid) return new Response('Invalid LINE signature', { status: 401 });

  const payload = JSON.parse(rawBody);
  for (const event of payload.events || []) {
    const isGroupEvent = event.source?.type === 'group' && event.source.groupId;
    const isDirectEvent = event.source?.type === 'user' && event.source.userId;
    if (!isGroupEvent && !isDirectEvent) continue;
    try {
      if (isDirectEvent) {
        await saveDestinationId(env, event.source.userId);
        console.log(JSON.stringify({ event: 'line_friend_id_captured', event_type: event.type }));
      }
      if (!(isGroupEvent && event.type === 'leave')) {
        if (isLatestReportCommand(event)) await replyWithLatestReport(env, event.replyToken);
      }
    } catch (error) {
      console.error(JSON.stringify({ event: 'line_destination_capture_failed', event_type: event.type, error: error.message }));
      return new Response('Unable to save LINE destination ID', { status: 500 });
    }
  }
  return new Response('OK');
}

function isLatestReportCommand(event) {
  return event.type === 'message'
    && event.message?.type === 'text'
    && event.message.text.trim() === 'รายงาน'
    && typeof event.replyToken === 'string';
}

async function replyWithLatestReport(env, replyToken) {
  if (!env.LINE_CHANNEL_ACCESS_TOKEN || !env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
    throw new Error('LINE reply configuration is missing');
  }

  const reports = await rest(env, 'daily_reports?reception_saved_at=not.is.null&accounting_saved_at=not.is.null&select=id,report_date,note&order=report_date.desc&limit=1');
  const report = reports[0];
  if (!report) return sendReply(env, replyToken, { type: 'text', text: 'ยังไม่มีรายงานที่บันทึกข้อมูลครบ' });

  const yearStart = `${report.report_date.slice(0, 4)}-01-01`;
  const [entries, reportItems, versions, periodReports] = await Promise.all([
    rest(env, `report_entries?report_id=eq.${report.id}&select=item_code,quantity&order=item_code.asc`),
    rest(env, 'report_items?select=code,display_name,sort_order,item_group&order=sort_order.asc'),
    rest(env, `report_versions?report_id=eq.${report.id}&select=version_no&order=version_no.desc&limit=1`),
    rest(env, `daily_reports?report_date=gte.${yearStart}&report_date=lte.${report.report_date}&select=report_date,report_entries(item_code,quantity)&order=report_date.asc`)
  ]);
  const entryMap = new Map(entries.map((entry) => [entry.item_code, Number(entry.quantity)]));
  const displayEntries = reportItems.map((item) => ({ ...item, quantity: entryMap.get(item.code) || 0 }));
  const farm = displayEntries.filter((item) => item.item_group === 'farm').reduce((sum, item) => sum + item.quantity, 0);
  const resort = displayEntries.filter((item) => item.item_group === 'resort').reduce((sum, item) => sum + item.quantity, 0);
  const cumulative = cumulativeTotals(periodReports, report.report_date, reportItems);
  return sendReply(env, replyToken, createReportFlexMessage({
    report_date: report.report_date,
    note: report.note,
    version_no: versions[0]?.version_no || 1,
    entries: displayEntries,
    totals: { farm, resort, overall: farm + resort, month_cumulative: cumulative.month, year_cumulative: cumulative.year }
  }));
}

async function sendReply(env, replyToken, message) {
  const response = await fetch(LINE_REPLY_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}` },
    body: JSON.stringify({ replyToken, messages: [message] })
  });
  if (!response.ok) throw new Error(`LINE reply failed: ${(await response.text()).slice(0, 1000)}`);
}

async function rest(env, path) {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, { headers: { apikey: env.SUPABASE_SECRET_KEY } });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message || 'Supabase request failed');
  return body;
}

async function saveDestinationId(env, destinationId) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) throw new Error('Supabase server configuration is missing');
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/line_group_settings?on_conflict=group_id`, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_SECRET_KEY,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify({ setting_key: 'report_destination', group_id: destinationId, updated_at: new Date().toISOString() })
  });
  if (!response.ok) throw new Error(await response.text());
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
