export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.CRON_SECRET || request.headers.get('x-cron-secret') !== env.CRON_SECRET) return json({ error: 'Unauthorized' }, 401);
  if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY || !env.LINE_CHANNEL_ACCESS_TOKEN || !env.LINE_GROUP_ID) return json({ error: 'Missing reminder configuration' }, 500);

  const reportDate = bangkokIsoDate();
  try {
    const reports = await rest(env, `daily_reports?report_date=eq.${reportDate}&status=neq.sent&select=id,status`);
    const report = reports[0];
    if (report) {
      const existing = await rest(env, `reminder_logs?report_id=eq.${report.id}&reminder_date=eq.${reportDate}&destination=eq.LINE%20group&select=id&limit=1`);
      if (existing.length) return json({ ok: true, skipped: 'reminder already sent today' });
    }

    const message = report
      ? `แจ้งเตือน: รายงานยอดลูกค้าประจำวันที่ ${thaiDate(reportDate)} ยังอยู่ในสถานะ “${statusLabel(report.status)}” กรุณาให้แผนกบัญชีตรวจสอบและกดส่งรายงาน`
      : `แจ้งเตือน: ยังไม่มีการบันทึกรายงานยอดลูกค้าประจำวันที่ ${thaiDate(reportDate)} กรุณาตรวจสอบข้อมูลจากแผนกต้อนรับและแผนกบัญชี`;
    const lineResponse = await fetch('https://api.line.me/v2/bot/message/push', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}` }, body: JSON.stringify({ to: env.LINE_GROUP_ID, messages: [{ type: 'text', text: message }] }) });
    const requestId = lineResponse.headers.get('x-line-request-id');
    if (!lineResponse.ok) {
      const errorText = await lineResponse.text();
      if (report) await rest(env, 'reminder_logs', { method: 'POST', body: { report_id: report.id, reminder_date: reportDate, destination: 'LINE group', status: 'failed', error_message: errorText.slice(0, 1000) } });
      return json({ error: 'LINE reminder failed' }, 502);
    }
    if (report) await rest(env, 'reminder_logs', { method: 'POST', body: { report_id: report.id, reminder_date: reportDate, destination: 'LINE group', status: 'sent' } });
    return json({ ok: true, line_request_id: requestId, report_date: reportDate });
  } catch (error) {
    return json({ error: error.message || 'Reminder failed' }, 500);
  }
}

async function rest(env, path, options = {}) {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, { method: options.method || 'GET', headers: { apikey: env.SUPABASE_SECRET_KEY, 'Content-Type': 'application/json' }, ...(options.body ? { body: JSON.stringify(options.body) } : {}) });
  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) throw new Error(typeof body === 'string' ? body : body.message || 'Supabase request failed');
  return body;
}

function bangkokIsoDate() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const value = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function thaiDate(iso) { const [year, month, day] = iso.split('-').map(Number); return `${day}/${month}/${year + 543}`; }
function statusLabel(status) { return ({ waiting_accounting: 'รอข้อมูลบัญชี', pending_send: 'รอส่ง', failed: 'ส่งไม่สำเร็จ', revised_pending_resend: 'แก้ไขแล้ว รอส่งซ้ำ' })[status] || status; }
function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } }); }
