import { createReportFlexMessage, verifyReportShareToken } from './line-send.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const reportDate = url.searchParams.get('date') || '';
  const versionNo = Number(url.searchParams.get('version'));
  const token = url.searchParams.get('token') || '';

  if (!/^\d{4}-\d{2}-\d{2}$/.test(reportDate) || !Number.isInteger(versionNo) || versionNo < 1) {
    return json({ error: 'Invalid report reference' }, 400);
  }
  if (!await verifyReportShareToken(env, reportDate, versionNo, token)) {
    return json({ error: 'Invalid report link' }, 403);
  }
  if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
    return json({ error: 'Report service is not configured' }, 500);
  }

  try {
    const reports = await rest(env, `daily_reports?report_date=eq.${reportDate}&select=id&limit=1`);
    if (!reports[0]) return json({ error: 'Report not found' }, 404);
    const versions = await rest(
      env,
      `report_versions?report_id=eq.${reports[0].id}&version_no=eq.${versionNo}&select=payload&limit=1`
    );
    if (!versions[0]?.payload) return json({ error: 'Report version not found' }, 404);
    return json({
      message: createReportFlexMessage(versions[0].payload, {
        shareUrl: `https://liff.line.me/${env.LINE_LIFF_ID}?${url.searchParams.toString()}`
      })
    });
  } catch (error) {
    return json({ error: error.message || 'Unable to load report' }, 500);
  }
}

async function rest(env, path) {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: env.SUPABASE_SECRET_KEY }
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message || 'Supabase request failed');
  return body;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}
