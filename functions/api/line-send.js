const LINE_PUSH_ENDPOINT = 'https://api.line.me/v2/bot/message/push';

export async function onRequestPost(context) {
  const { request, env } = context;
  const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'LINE_CHANNEL_ACCESS_TOKEN', 'LINE_GROUP_ID'];
  const missing = required.filter((name) => !env[name]);
  if (missing.length) return json({ error: `Missing server configuration: ${missing.join(', ')}` }, 500);

  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'Authentication is required' }, 401);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON body' }, 400); }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.report_date || '')) return json({ error: 'report_date must use YYYY-MM-DD' }, 400);

  try {
    const user = await getCurrentUser(env, token);
    const profile = await rest(env, `profiles?id=eq.${user.id}&select=id,display_name,role`, { method: 'GET' });
    if (!profile[0] || !['accountant', 'admin'].includes(profile[0].role)) return json({ error: 'Only accounting staff or administrators can send reports' }, 403);

    const reports = await rest(env, `daily_reports?report_date=eq.${body.report_date}&select=id,report_date,status,reception_saved_at,accounting_saved_at`, { method: 'GET' });
    const report = reports[0];
    if (!report) return json({ error: 'No daily report exists for this date' }, 404);
    if (!report.reception_saved_at || !report.accounting_saved_at) return json({ error: 'Both reception and accounting data must be saved before sending' }, 422);

    await rest(env, `daily_reports?id=eq.${report.id}`, { method: 'PATCH', body: { status: 'sending', updated_by: user.id } });
    const [entries, reportItems, existingVersions] = await Promise.all([
      rest(env, `report_entries?report_id=eq.${report.id}&select=item_code,quantity&order=item_code.asc`, { method: 'GET' }),
      rest(env, 'report_items?select=code,display_name,sort_order,item_group&order=sort_order.asc', { method: 'GET' }),
      rest(env, `report_versions?report_id=eq.${report.id}&select=version_no&order=version_no.desc&limit=1`, { method: 'GET' })
    ]);

    const entryMap = new Map(entries.map((entry) => [entry.item_code, Number(entry.quantity)]));
    const displayEntries = reportItems.map((item) => ({ ...item, quantity: entryMap.get(item.code) || 0 }));
    const farmTotal = displayEntries.filter((item) => item.item_group === 'farm').reduce((sum, item) => sum + item.quantity, 0);
    const resortTotal = displayEntries.filter((item) => item.item_group === 'resort').reduce((sum, item) => sum + item.quantity, 0);
    const versionNo = (existingVersions[0]?.version_no || 0) + 1;
    const payload = { report_date: report.report_date, version_no: versionNo, entries: displayEntries, totals: { farm: farmTotal, resort: resortTotal, overall: farmTotal + resortTotal } };
    const versions = await rest(env, 'report_versions', { method: 'POST', body: { report_id: report.id, version_no: versionNo, payload, created_by: user.id }, prefer: 'return=representation' });
    const version = versions[0];

    const lineResponse = await fetch(LINE_PUSH_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}` },
      body: JSON.stringify({ to: env.LINE_GROUP_ID, messages: [createFlexMessage(payload)] })
    });
    const requestId = lineResponse.headers.get('x-line-request-id');

    if (!lineResponse.ok) {
      const errorText = await lineResponse.text();
      await Promise.all([
        rest(env, `daily_reports?id=eq.${report.id}`, { method: 'PATCH', body: { status: 'failed', updated_by: user.id } }),
        rest(env, 'line_delivery_logs', { method: 'POST', body: { report_id: report.id, report_version_id: version.id, status: 'failed', destination: 'LINE group', line_request_id: requestId, error_message: errorText.slice(0, 1000), sent_by: user.id } })
      ]);
      return json({ error: 'LINE rejected the report. Review the delivery history and try again.' }, 502);
    }

    await Promise.all([
      rest(env, `daily_reports?id=eq.${report.id}`, { method: 'PATCH', body: { status: 'sent', sent_at: new Date().toISOString(), updated_by: user.id } }),
      rest(env, 'line_delivery_logs', { method: 'POST', body: { report_id: report.id, report_version_id: version.id, status: 'sent', destination: 'LINE group', line_request_id: requestId, sent_by: user.id } })
    ]);
    return json({ ok: true, version_no: versionNo });
  } catch (error) {
    return json({ error: error.message || 'Unable to send the LINE report' }, 500);
  }
}

async function getCurrentUser(env, token) {
  const response = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, { headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error('Invalid or expired session');
  return response.json();
}

async function rest(env, path, options = {}) {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    method: options.method || 'GET',
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...(options.prefer ? { Prefer: options.prefer } : {})
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {})
  });
  const contentType = response.headers.get('content-type') || '';
  const responseBody = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) throw new Error(typeof responseBody === 'string' ? responseBody : responseBody.message || 'Supabase request failed');
  return responseBody;
}

function createFlexMessage(payload) {
  const date = thaiDate(payload.report_date);
  const details = payload.entries.map((entry) => ({ type: 'box', layout: 'horizontal', spacing: 'sm', contents: [
    { type: 'text', text: entry.display_name, size: 'xs', color: '#5d514b', flex: 5, wrap: true },
    { type: 'text', text: `${entry.quantity.toLocaleString('th-TH')} คน`, size: 'xs', color: '#241e1a', align: 'end', flex: 2 }
  ] }));
  return {
    type: 'flex',
    altText: `รายงานยอดลูกค้า ${date} ยอดรวม ${payload.totals.overall.toLocaleString('th-TH')} คน`,
    contents: {
      type: 'bubble',
      body: { type: 'box', layout: 'vertical', paddingAll: '16px', contents: [
        { type: 'text', text: payload.version_no > 1 ? `รายงานฉบับแก้ไขครั้งที่ ${payload.version_no}` : 'รายงานยอดลูกค้า', weight: 'bold', size: 'lg', color: '#70462e' },
        { type: 'text', text: `ประจำวันที่ ${date}`, size: 'sm', color: '#6d625c', margin: 'sm' },
        { type: 'separator', margin: 'lg' },
        { type: 'box', layout: 'vertical', spacing: 'sm', margin: 'lg', contents: details },
        { type: 'separator', margin: 'lg' },
        { type: 'box', layout: 'vertical', spacing: 'sm', margin: 'lg', contents: [
          totalRow('ยอดเข้าชมฟาร์ม', payload.totals.farm),
          totalRow('ลูกค้าเข้าพัก', payload.totals.resort),
          totalRow('ยอดรวมทั้งหมด', payload.totals.overall, true)
        ] }
      ] }
    }
  };
}

function totalRow(label, quantity, emphasis = false) {
  return { type: 'box', layout: 'horizontal', contents: [
    { type: 'text', text: label, size: emphasis ? 'sm' : 'xs', weight: emphasis ? 'bold' : 'regular', color: emphasis ? '#70462e' : '#5d514b', flex: 5 },
    { type: 'text', text: `${quantity.toLocaleString('th-TH')} คน`, size: emphasis ? 'sm' : 'xs', weight: 'bold', color: emphasis ? '#70462e' : '#241e1a', align: 'end', flex: 2 }
  ] };
}

function thaiDate(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year + 543}`;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
