const LINE_PUSH_ENDPOINT = 'https://api.line.me/v2/bot/message/push';

export async function onRequestPost(context) {
  const { request, env } = context;
  const required = ['SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SECRET_KEY', 'LINE_CHANNEL_ACCESS_TOKEN'];
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

    const groupIds = await resolveGroupIds(env);
    if (!groupIds.length) return json({ error: 'No LINE group has been captured yet. Send a message in each target group and try again.' }, 503);

    const reports = await rest(env, `daily_reports?report_date=eq.${body.report_date}&select=id,report_date,status,note,reception_saved_at,accounting_saved_at`, { method: 'GET' });
    const report = reports[0];
    if (!report) return json({ error: 'No daily report exists for this date' }, 404);
    if (!report.reception_saved_at || !report.accounting_saved_at) return json({ error: 'Both reception and accounting data must be saved before sending' }, 422);

    // Do not resend this daily report to a group that already accepted it.
    const sentLogs = await rest(env, `line_delivery_logs?report_id=eq.${report.id}&status=eq.sent&select=destination`, { method: 'GET' });
    const sentDestinations = new Set(sentLogs.map((log) => log.destination));
    const pendingGroupIds = groupIds.filter((groupId) => !sentDestinations.has(destinationLabel(groupId)));
    if (!pendingGroupIds.length) return json({ ok: true, already_sent: true, group_count: groupIds.length });

    await rest(env, `daily_reports?id=eq.${report.id}`, { method: 'PATCH', body: { status: 'sending', updated_by: user.id } });
    const yearStart = `${report.report_date.slice(0, 4)}-01-01`;
    const [entries, reportItems, existingVersions, periodReports] = await Promise.all([
      rest(env, `report_entries?report_id=eq.${report.id}&select=item_code,quantity&order=item_code.asc`, { method: 'GET' }),
      rest(env, 'report_items?select=code,display_name,sort_order,item_group&order=sort_order.asc', { method: 'GET' }),
      rest(env, `report_versions?report_id=eq.${report.id}&select=version_no&order=version_no.desc&limit=1`, { method: 'GET' }),
      rest(env, `daily_reports?report_date=gte.${yearStart}&report_date=lte.${report.report_date}&select=report_date,report_entries(item_code,quantity)&order=report_date.asc`, { method: 'GET' })
    ]);

    const entryMap = new Map(entries.map((entry) => [entry.item_code, Number(entry.quantity)]));
    const displayEntries = reportItems.map((item) => ({ ...item, quantity: entryMap.get(item.code) || 0 }));
    const farmTotal = displayEntries.filter((item) => item.item_group === 'farm').reduce((sum, item) => sum + item.quantity, 0);
    const resortTotal = displayEntries.filter((item) => item.item_group === 'resort').reduce((sum, item) => sum + item.quantity, 0);
    const cumulative = cumulativeTotals(periodReports, report.report_date, reportItems);
    const versionNo = (existingVersions[0]?.version_no || 0) + 1;
    const payload = {
      report_date: report.report_date,
      note: report.note,
      version_no: versionNo,
      entries: displayEntries,
      totals: {
        farm: farmTotal,
        resort: resortTotal,
        overall: farmTotal + resortTotal,
        month_cumulative: cumulative.month,
        year_cumulative: cumulative.year
      }
    };
    const versions = await rest(env, 'report_versions', { method: 'POST', body: { report_id: report.id, version_no: versionNo, payload, created_by: user.id }, prefer: 'return=representation' });
    const version = versions[0];

    const deliveries = await pushToGroups(env.LINE_CHANNEL_ACCESS_TOKEN, pendingGroupIds, createReportFlexMessage(payload));
    const failedDeliveries = deliveries.filter((delivery) => delivery.status === 'failed');
    const reportStatus = failedDeliveries.length ? 'failed' : 'sent';
    const reportUpdate = reportStatus === 'sent'
      ? { status: 'sent', sent_at: new Date().toISOString(), updated_by: user.id }
      : { status: 'failed', updated_by: user.id };

    await Promise.all([
      rest(env, `daily_reports?id=eq.${report.id}`, { method: 'PATCH', body: reportUpdate }),
      ...deliveries.map((delivery) => rest(env, 'line_delivery_logs', {
        method: 'POST',
        body: {
          report_id: report.id,
          report_version_id: version.id,
          status: delivery.status,
          destination: destinationLabel(delivery.groupId),
          line_request_id: delivery.requestId,
          ...(delivery.errorMessage ? { error_message: delivery.errorMessage } : {}),
          sent_by: user.id
        }
      }))
    ]);

    if (failedDeliveries.length) {
      const sentCount = deliveries.length - failedDeliveries.length;
      const quotaExceeded = failedDeliveries.every((delivery) => /monthly limit/i.test(delivery.errorMessage || ''));
      return json({
        error: quotaExceeded
          ? `โควตาส่งข้อความ LINE รายเดือนหมดแล้ว ส่งสำเร็จ ${sentCount} กลุ่ม เหลือ ${failedDeliveries.length} กลุ่ม กรุณาเพิ่มโควตาใน LINE Official Account แล้วกดส่งอีกครั้ง ระบบจะไม่ส่งซ้ำกลุ่มที่สำเร็จแล้ว`
          : `ส่ง LINE สำเร็จ ${sentCount} จาก ${deliveries.length} กลุ่ม และมี ${failedDeliveries.length} กลุ่มส่งไม่สำเร็จ กรุณาตรวจสอบประวัติการส่ง`,
        sent_groups: sentCount,
        failed_groups: failedDeliveries.length,
        code: quotaExceeded ? 'LINE_MONTHLY_LIMIT_REACHED' : 'LINE_DELIVERY_FAILED'
      }, 502);
    }

    return json({ ok: true, version_no: versionNo, group_count: groupIds.length });
  } catch (error) {
    return json({ error: error.message || 'Unable to send the LINE report' }, 500);
  }
}

async function resolveGroupIds(env) {
  const settings = await rest(env, 'line_group_settings?setting_key=eq.report_destination&select=group_id&order=captured_at.asc', { method: 'GET' });
  return uniqueGroupIds(env.LINE_GROUP_ID, settings);
}

function uniqueGroupIds(environmentGroupId, settings) {
  return [...new Set([environmentGroupId, ...(settings || []).map((setting) => setting.group_id)].filter((groupId) => typeof groupId === 'string' && groupId.trim()))];
}

async function pushToGroups(accessToken, groupIds, message, fetchImpl = fetch) {
  return Promise.all(groupIds.map(async (groupId) => {
    try {
      const response = await fetchImpl(LINE_PUSH_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ to: groupId, messages: [message] })
      });
      return {
        groupId,
        status: response.ok ? 'sent' : 'failed',
        requestId: response.headers.get('x-line-request-id'),
        errorMessage: response.ok ? null : (await response.text()).slice(0, 1000)
      };
    } catch (error) {
      return { groupId, status: 'failed', requestId: null, errorMessage: String(error?.message || error).slice(0, 1000) };
    }
  }));
}

function destinationLabel(groupId) {
  return `LINE group •••${groupId.slice(-6)}`;
}

async function getCurrentUser(env, token) {
  const response = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, { headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error('Invalid or expired session');
  return response.json();
}

async function rest(env, path, options = {}) {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    method: options.method || 'GET',
    headers: {
      apikey: env.SUPABASE_SECRET_KEY,
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

export function createReportFlexMessage(payload) {
  const date = thaiDate(payload.report_date);
  const note = formatNote(payload.note);
  const shareUrl = `https://line.me/R/share?text=${encodeURIComponent(createShareText(payload, date, note))}`;
  const details = payload.entries.map((entry) => detailRow(entry));
  const bodyContents = [
    { type: 'text', text: 'สรุปจำนวนลูกค้า', weight: 'bold', size: 'md', color: '#1F2937' },
    { type: 'text', text: 'ข้อมูลที่บันทึกในระบบ', size: 'xs', color: '#6B7280', margin: 'sm' },
    { type: 'box', layout: 'horizontal', spacing: 'md', margin: 'lg', contents: [
      summaryTile('เข้าชมฟาร์ม', payload.totals.farm, '#E8F4EE', '#237A4B'),
      summaryTile('เข้าพัก', payload.totals.resort, '#EAF1FB', '#245B9A')
    ] },
    { type: 'box', layout: 'horizontal', margin: 'md', backgroundColor: '#FFF4E5', cornerRadius: '12px', paddingAll: '12px', contents: [
      { type: 'text', text: 'ยอดรวมทั้งหมด', size: 'sm', weight: 'bold', color: '#8A4B08', flex: 4 },
      { type: 'text', text: `${payload.totals.overall.toLocaleString('th-TH')} คน`, size: 'lg', weight: 'bold', color: '#8A4B08', align: 'end', flex: 3 }
    ] },
    { type: 'box', layout: 'vertical', spacing: 'md', margin: 'md', contents: [
      cumulativeTile('ยอดสะสมเดือน', payload.totals.month_cumulative, '#F3EEFB', '#6941A5'),
      cumulativeTile('ยอดสะสมปี', payload.totals.year_cumulative, '#EAF7F7', '#14706F')
    ] },
    { type: 'separator', margin: 'xl', color: '#E5E7EB' },
    { type: 'text', text: 'รายละเอียด', weight: 'bold', size: 'sm', color: '#374151', margin: 'xl' },
    { type: 'box', layout: 'vertical', spacing: 'md', margin: 'md', contents: details }
  ];

  if (note) {
    bodyContents.push(
      { type: 'separator', margin: 'xl', color: '#E5E7EB' },
      { type: 'box', layout: 'vertical', margin: 'xl', paddingAll: '12px', backgroundColor: '#F3F4F6', cornerRadius: '12px', contents: [
        { type: 'text', text: 'หมายเหตุ', size: 'xs', weight: 'bold', color: '#4B5563' },
        { type: 'text', text: note, size: 'sm', color: '#374151', wrap: true, margin: 'sm', lineSpacing: '4px' }
      ] }
    );
  }

  return {
    type: 'flex',
    altText: `รายงานยอดลูกค้า ${date} • รวม ${payload.totals.overall.toLocaleString('th-TH')} คน${note ? ' • มีหมายเหตุ' : ''}`,
    contents: {
      type: 'bubble',
      header: { type: 'box', layout: 'vertical', paddingAll: '18px', backgroundColor: '#245B9A', contents: [
        { type: 'text', text: payload.version_no > 1 ? 'รายงานฉบับแก้ไข' : 'รายงานยอดลูกค้า', size: 'lg', weight: 'bold', color: '#FFFFFF' },
        { type: 'text', text: `ประจำวันที่ ${date}`, size: 'sm', color: '#DCEBFF', margin: 'sm' },
        { type: 'text', text: `ฉบับที่ ${payload.version_no}`, size: 'xxs', color: '#BFD7F5', margin: 'md' }
      ] },
      body: { type: 'box', layout: 'vertical', paddingAll: '18px', contents: bodyContents },
      footer: { type: 'box', layout: 'vertical', paddingAll: '12px', spacing: 'sm', contents: [
        { type: 'button', style: 'primary', color: '#06C755', height: 'sm', action: { type: 'uri', label: 'แชร์รายงาน', uri: shareUrl } },
        { type: 'text', text: 'จัดทำจากระบบบันทึกยอดลูกค้า', size: 'xxs', color: '#9CA3AF', align: 'center' }
      ] }
    }
  };
}

function createShareText(payload, date, note) {
  const rows = payload.entries
    .filter((entry) => Number(entry.quantity) > 0)
    .map((entry) => `• ${entry.display_name}: ${Number(entry.quantity).toLocaleString('th-TH')} คน`);
  return [
    `รายงานยอดลูกค้า ประจำวันที่ ${date}`,
    `เข้าชมฟาร์ม ${payload.totals.farm.toLocaleString('th-TH')} คน | เข้าพัก ${payload.totals.resort.toLocaleString('th-TH')} คน`,
    `รวมทั้งหมด ${payload.totals.overall.toLocaleString('th-TH')} คน`,
    ...rows,
    ...(note ? [`หมายเหตุ: ${note}`] : [])
  ].join('\n');
}

export function cumulativeTotals(reports, reportDate, reportItems) {
  const monthPrefix = reportDate.slice(0, 7);
  const groupByCode = new Map((reportItems || []).map((item) => [item.code, item.item_group]));
  return (reports || []).reduce((totals, report) => {
    for (const entry of report.report_entries || []) {
      const group = groupByCode.get(entry.item_code);
      if (!['farm', 'resort'].includes(group)) continue;
      const quantity = Number(entry.quantity || 0);
      totals.year[group] += quantity;
      if (report.report_date.startsWith(monthPrefix)) totals.month[group] += quantity;
    }
    return totals;
  }, { month: { farm: 0, resort: 0 }, year: { farm: 0, resort: 0 } });
}

function cumulativeTile(label, totals, backgroundColor, color) {
  return { type: 'box', layout: 'vertical', backgroundColor, cornerRadius: '12px', paddingAll: '12px', contents: [
    { type: 'text', text: label, size: 'xs', weight: 'bold', color },
    { type: 'text', text: 'ถึงวันที่รายงาน', size: 'xxs', color, margin: 'xs' },
    { type: 'separator', color, margin: 'md' },
    { type: 'box', layout: 'horizontal', spacing: 'md', margin: 'md', contents: [
      cumulativeMetric('เข้าชมฟาร์ม', totals.farm, color),
      { type: 'separator', color },
      cumulativeMetric('เข้าพัก', totals.resort, color)
    ] }
  ] };
}

function cumulativeMetric(label, quantity, color) {
  return { type: 'box', layout: 'vertical', flex: 1, contents: [
    { type: 'text', text: label, size: 'xxs', color, align: 'center' },
    { type: 'text', text: `${quantity.toLocaleString('th-TH')} คน`, size: 'sm', weight: 'bold', color, align: 'center', margin: 'xs', adjustMode: 'shrink-to-fit' }
  ] };
}

function summaryTile(label, quantity, backgroundColor, color) {
  return { type: 'box', layout: 'vertical', backgroundColor, cornerRadius: '12px', paddingAll: '12px', flex: 1, contents: [
    { type: 'text', text: label, size: 'xxs', color },
    { type: 'text', text: `${quantity.toLocaleString('th-TH')} คน`, size: 'md', weight: 'bold', color, margin: 'sm', wrap: true }
  ] };
}

function detailRow(entry) {
  return { type: 'box', layout: 'horizontal', contents: [
    { type: 'text', text: entry.display_name, size: 'xs', color: '#4B5563', flex: 5, wrap: true },
    { type: 'text', text: `${entry.quantity.toLocaleString('th-TH')} คน`, size: 'xs', weight: 'bold', color: '#1F2937', align: 'end', flex: 2 }
  ] };
}

function formatNote(note) {
  const value = String(note || '').trim();
  return value.length > 1000 ? `${value.slice(0, 997)}...` : value || null;
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
