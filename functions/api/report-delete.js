export async function onRequestPost(context) {
  const { request, env } = context;
  const required = ['SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SECRET_KEY'];
  const missing = required.filter((name) => !env[name]);
  if (missing.length) return json({ error: `Missing server configuration: ${missing.join(', ')}` }, 500);

  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'Authentication is required' }, 401);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON body' }, 400); }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.report_date || '')) {
    return json({ error: 'report_date must use YYYY-MM-DD' }, 400);
  }
  if (body.report_date >= bangkokDate()) {
    return json({ error: 'ลบได้เฉพาะรายงานย้อนหลังเท่านั้น' }, 422);
  }

  try {
    const user = await getCurrentUser(env, token);
    const profiles = await rest(env, `profiles?id=eq.${user.id}&select=id,role`, { method: 'GET' });
    if (!profiles[0] || !['accountant', 'admin'].includes(profiles[0].role)) {
      return json({ error: 'เฉพาะฝ่ายบัญชีหรือผู้ดูแลระบบเท่านั้นที่ลบรายงานย้อนหลังได้' }, 403);
    }

    const reports = await rest(env, `daily_reports?report_date=eq.${body.report_date}&select=id,report_date`, { method: 'GET' });
    if (!reports[0]) return json({ error: 'ไม่พบรายงานของวันที่เลือก' }, 404);

    await rest(env, `daily_reports?id=eq.${reports[0].id}`, {
      method: 'DELETE',
      prefer: 'return=minimal'
    });
    return json({ ok: true, report_date: body.report_date });
  } catch (error) {
    return json({ error: error.message || 'ไม่สามารถลบรายงานย้อนหลังได้' }, 500);
  }
}

async function getCurrentUser(env, token) {
  const response = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}` }
  });
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
    }
  });
  if (response.status === 204) return null;
  const body = await response.json();
  if (!response.ok) throw new Error(body.message || 'Supabase request failed');
  return body;
}

function bangkokDate() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}
