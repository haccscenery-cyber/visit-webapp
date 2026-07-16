import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const items = [
  { code: 'show_baan_rim_khao', name: 'บัตรชมโชว์ (บ้านริมเขา)', group: 'farm', owner: 'accountant' },
  { code: 'combo_s_sw', name: 'Combo Set S (สว)', group: 'farm', owner: 'accountant' },
  { code: 'combo_s_hs_ht_dog', name: 'Combo Set S (Hs, Ht, Dog Show)', group: 'farm', owner: 'accountant' },
  { code: 'combo_m', name: 'Combo Set M', group: 'farm', owner: 'accountant' },
  { code: 'combo_l', name: 'Combo Set L', group: 'farm', owner: 'accountant' },
  { code: 'combo_xl', name: 'Combo Set XL', group: 'farm', owner: 'accountant' },
  { code: 'farm_after_1600', name: 'บัตรเข้าฟาร์มหลัง 16.00 น.', group: 'farm', owner: 'accountant' },
  { code: 'farm_after_1700', name: 'บัตรเข้าฟาร์มหลัง 17.00 น.', group: 'farm', owner: 'accountant' },
  { code: 'combo_tour', name: 'Combo Set (ทัวร์)', group: 'farm', owner: 'accountant' },
  { code: 'farm_free', name: 'เข้าชมฟาร์มฟรี', group: 'farm', owner: 'accountant' },
  { code: 'resort_guests', name: 'ลูกค้าเข้าพัก', group: 'resort', owner: 'receptionist' }
];

const labels = {
  receptionist: 'เจ้าหน้าที่แผนกต้อนรับ',
  accountant: 'เจ้าหน้าที่บัญชี',
  admin: 'ผู้ดูแลระบบ',
  waiting_accounting: 'รอข้อมูลบัญชี',
  pending_send: 'รอส่ง',
  sending: 'กำลังส่ง',
  sent: 'ส่งแล้ว',
  failed: 'ส่งไม่สำเร็จ',
  revised_pending_resend: 'แก้ไขแล้ว รอส่งซ้ำ'
};

const config = window.APP_CONFIG || {};
const hasSupabaseConfig = Boolean(config.supabaseUrl && config.supabasePublishableKey);
const supabase = hasSupabaseConfig ? createClient(config.supabaseUrl, config.supabasePublishableKey) : null;

const state = {
  isDemo: !hasSupabaseConfig,
  role: 'accountant',
  user: { id: null, name: 'ผู้ใช้งานสาธิต', email: '' },
  date: localIsoDate(),
  note: '',
  report: emptyReport(),
  history: [],
  entries: seedEntries(),
  currentView: 'dashboard'
};

const elements = {
  reportDate: document.querySelector('#report-date'),
  today: document.querySelector('#today-display'),
  pageTitle: document.querySelector('#page-title'),
  pageSubtitle: document.querySelector('#page-subtitle'),
  entryTable: document.querySelector('#entry-table-body'),
  entryCount: document.querySelector('#entry-count'),
  farmTotal: document.querySelector('#farm-total'),
  resortTotal: document.querySelector('#resort-total'),
  overallTotal: document.querySelector('#overall-total'),
  monthTotal: document.querySelector('#month-total'),
  tableFarmTotal: document.querySelector('#table-farm-total'),
  tableResortTotal: document.querySelector('#table-resort-total'),
  tableOverallTotal: document.querySelector('#table-overall-total'),
  statusTitle: document.querySelector('#report-status-title'),
  statusBadge: document.querySelector('#status-badge'),
  receptionStatus: document.querySelector('#reception-status'),
  accountingStatus: document.querySelector('#accounting-status'),
  lastUpdated: document.querySelector('#last-updated'),
  reminderPanel: document.querySelector('#reminder-panel'),
  reminderTitle: document.querySelector('#reminder-title'),
  reminderDetail: document.querySelector('#reminder-detail'),
  historyList: document.querySelector('#history-list'),
  barChart: document.querySelector('#bar-chart'),
  entryModal: document.querySelector('#entry-modal'),
  entryForm: document.querySelector('#entry-form'),
  entryFormList: document.querySelector('#entry-form-list'),
  entryRoleNote: document.querySelector('#entry-role-note'),
  reportNote: document.querySelector('#report-note'),
  lineModal: document.querySelector('#line-modal'),
  linePreview: document.querySelector('#line-preview-card'),
  lineSendNote: document.querySelector('#line-send-note'),
  loginModal: document.querySelector('#login-modal'),
  loginForm: document.querySelector('#login-form'),
  loginMessage: document.querySelector('#login-message'),
  userName: document.querySelector('#sidebar-user-name'),
  sidebarRole: document.querySelector('#sidebar-role'),
  topbarUserName: document.querySelector('#topbar-user-name'),
  sidebarAvatar: document.querySelector('#user-avatar'),
  topbarAvatar: document.querySelector('#topbar-avatar'),
  notificationCount: document.querySelector('#notification-count')
};

function localIsoDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function emptyReport() {
  return { id: null, status: 'waiting_accounting', note: '', receptionSavedAt: null, accountingSavedAt: null, updatedAt: null, sentAt: null };
}

function seedEntries() {
  const quantities = [120, 85, 210, 150, 95, 40, 0, 0, 320, 220, 45];
  return Object.fromEntries(items.map((item, index) => [item.code, { quantity: quantities[index], updatedAt: index === 10 ? '08:30' : '09:15', updatedBy: item.owner === 'receptionist' ? 'แผนกต้อนรับ' : 'แผนกบัญชี' }]));
}

function formatThaiDate(iso, withWeekday = false) {
  if (!iso) return '-';
  const date = new Date(`${iso}T00:00:00`);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear() + 543;
  if (!withWeekday) return `${day}/${month}/${year}`;
  const days = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
  return `${days[date.getDay()]} ${day}/${month}/${year}`;
}

function formatDateTime(value) {
  if (!value) return 'ยังไม่มีข้อมูล';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${formatThaiDate(date.toISOString().slice(0, 10))} ${hh}:${mm} น.`;
}

function totals() {
  const farm = items.filter((item) => item.group === 'farm').reduce((sum, item) => sum + Number(state.entries[item.code]?.quantity || 0), 0);
  const resort = Number(state.entries.resort_guests?.quantity || 0);
  return { farm, resort, overall: farm + resort, month: farm * 12 + resort * 12 };
}

function isReceptionSaved() { return Boolean(state.entries.resort_guests?.updatedAt); }
function isAccountingSaved() { return items.filter((item) => item.group === 'farm').some((item) => state.entries[item.code]?.updatedAt); }
function roleCanEdit(item) {
  if (state.role === 'admin') return true;
  if (state.role === 'receptionist' && ['sent', 'revised_pending_resend'].includes(currentStatus())) return false;
  return state.role === 'receptionist' ? item.owner === 'receptionist' : item.owner === 'accountant';
}
function roleCanSend() { return state.role === 'accountant' || state.role === 'admin'; }
function currentStatus() { return state.report.status || 'waiting_accounting'; }

function statusClass(status) {
  if (status === 'sent') return 'complete';
  if (status === 'failed') return 'error';
  if (status === 'revised_pending_resend') return 'revised';
  return 'waiting';
}

function render() {
  const sum = totals();
  elements.today.textContent = formatThaiDate(state.date, true);
  elements.reportDate.value = state.date;
  elements.farmTotal.textContent = sum.farm.toLocaleString('th-TH');
  elements.resortTotal.textContent = sum.resort.toLocaleString('th-TH');
  elements.overallTotal.textContent = sum.overall.toLocaleString('th-TH');
  elements.monthTotal.textContent = sum.month.toLocaleString('th-TH');
  elements.tableFarmTotal.textContent = `${sum.farm.toLocaleString('th-TH')} คน`;
  elements.tableResortTotal.textContent = `${sum.resort.toLocaleString('th-TH')} คน`;
  elements.tableOverallTotal.textContent = `${sum.overall.toLocaleString('th-TH')} คน`;
  elements.entryCount.textContent = `${items.filter((item) => state.entries[item.code]?.updatedAt).length} จาก 11 รายการ`;
  renderUser();
  renderStatus();
  renderEntries();
  renderChart();
  renderHistory();
  window.lucide?.createIcons();
}

function renderUser() {
  const initial = state.user.name.trim().slice(0, 1) || 'ผ';
  elements.userName.textContent = state.user.name;
  elements.topbarUserName.textContent = state.user.name;
  elements.sidebarRole.textContent = labels[state.role];
  elements.sidebarAvatar.textContent = initial;
  elements.topbarAvatar.textContent = initial;
}

function renderStatus() {
  const status = currentStatus();
  elements.statusTitle.textContent = labels[status];
  elements.statusBadge.textContent = labels[status];
  elements.statusBadge.className = `badge ${statusClass(status)}`;
  elements.receptionStatus.textContent = isReceptionSaved() ? 'บันทึกแล้ว' : 'รอบันทึก';
  elements.accountingStatus.textContent = isAccountingSaved() ? 'บันทึกแล้ว' : 'รอกรอก';
  elements.lastUpdated.textContent = formatDateTime(state.report.updatedAt || state.report.accountingSavedAt || state.report.receptionSavedAt);
  const needsReminder = status !== 'sent';
  elements.reminderPanel.hidden = !needsReminder;
  elements.notificationCount.textContent = needsReminder ? '1' : '0';
  elements.reminderTitle.textContent = needsReminder ? `มีรายงาน ${formatThaiDate(state.date)} ที่ยังไม่ได้ส่ง` : 'ไม่มีรายงานค้างส่ง';
  elements.reminderDetail.textContent = needsReminder ? 'เจ้าหน้าที่บัญชีต้องตรวจสอบและกดส่งรายงานด้วยตนเอง' : '';
}

function renderEntries() {
  elements.entryTable.innerHTML = items.map((item) => {
    const entry = state.entries[item.code] || { quantity: 0 };
    const source = entry.updatedBy || '-';
    const isComplete = Boolean(entry.updatedAt);
    return `<tr>
      <td class="entry-name">${escapeHtml(item.name)}</td>
      <td class="number">${Number(entry.quantity || 0).toLocaleString('th-TH')}</td>
      <td class="entry-source">${escapeHtml(source)}</td>
      <td class="entry-time">${escapeHtml(entry.updatedAt || '-')}</td>
      <td><span class="badge ${isComplete ? 'complete' : 'waiting'}">${isComplete ? 'บันทึกแล้ว' : 'รอข้อมูล'}</span></td>
    </tr>`;
  }).join('');
}

function renderChart() {
  const base = Math.max(totals().farm, 1);
  const farmValues = [0.68, 0.77, 0.56, 0.84, 0.66, 0.94, 1];
  const resortValues = [0.46, 0.57, 0.40, 0.63, 0.52, 0.59, 0.49];
  elements.barChart.innerHTML = farmValues.map((value, index) => `<div class="bar-group"><span class="bar" style="height:${Math.round(value * 100)}%" title="ยอดฟาร์ม ${Math.round(base * value)} คน"></span><span class="bar resort" style="height:${Math.round(resortValues[index] * 100)}%" title="ยอดเข้าพัก ${Math.round(totals().resort * resortValues[index])} คน"></span><small>${index === 6 ? 'วันนี้' : `${index + 1} วันก่อน`}</small></div>`).join('');
}

function renderHistory() {
  const fallback = state.isDemo && state.history.length === 0 ? [
    { version: 1, sentAt: `${formatThaiDate(state.date)} 17:15 น.`, status: 'sent', sender: 'แผนกบัญชี' },
    { version: 1, sentAt: `${formatThaiDate(previousDay(state.date))} 17:09 น.`, status: 'sent', sender: 'แผนกบัญชี' }
  ] : state.history;
  elements.historyList.innerHTML = fallback.length ? fallback.slice(0, 4).map((log) => `<div class="history-item"><div class="history-icon"><i data-lucide="message-circle"></i></div><div><strong>รายงานฉบับที่ ${log.version || 1}</strong><span>${escapeHtml(log.sentAt || formatDateTime(log.created_at))} โดย ${escapeHtml(log.sender || 'แผนกบัญชี')}</span></div><span class="badge ${statusClass(log.status || 'sent')}">${labels[log.status || 'sent']}</span></div>`).join('') : '<div class="history-item"><div><strong>ยังไม่มีประวัติการส่ง</strong><span>รายงานที่ส่งสำเร็จจะแสดงที่นี่</span></div></div>';
}

function previousDay(iso) {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

function openEntryModal() {
  const editable = items.filter(roleCanEdit);
  if (editable.length === 0) return showToast('บทบาทนี้ไม่มีสิทธิ์แก้ไขข้อมูล', 'error');
  elements.entryRoleNote.textContent = state.role === 'receptionist'
    ? 'แผนกต้อนรับบันทึกได้เฉพาะรายการ “ลูกค้าเข้าพัก” หลังบันทึก ระบบจะรอให้แผนกบัญชีกรอกข้อมูลเพิ่มเติม'
    : 'ตรวจสอบและกรอกจำนวนลูกค้า รายการที่มีข้อมูลส่งแล้วถูกแก้ไขจะเปลี่ยนเป็นสถานะรอส่งฉบับแก้ไข';
  elements.entryFormList.innerHTML = editable.map((item) => {
    const quantity = Number(state.entries[item.code]?.quantity || 0);
    return `<div class="entry-field"><div><label for="entry-${item.code}">${escapeHtml(item.name)}</label><small>${item.group === 'farm' ? 'ยอดเข้าชมฟาร์ม' : 'ยอดลูกค้าเข้าพัก'}</small></div><input id="entry-${item.code}" data-item-code="${item.code}" type="number" min="0" step="1" inputmode="numeric" value="${quantity}" required /></div>`;
  }).join('');
  elements.reportNote.value = state.note || state.report.note || '';
  elements.entryModal.showModal();
  window.lucide?.createIcons();
}

async function saveEntry(event) {
  event.preventDefault();
  const formEntries = [...elements.entryFormList.querySelectorAll('[data-item-code]')];
  const updates = {};
  for (const input of formEntries) {
    const quantity = Number(input.value);
    if (!Number.isInteger(quantity) || quantity < 0) return showToast('จำนวนคนต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป', 'error');
    updates[input.dataset.itemCode] = quantity;
  }
  const wasSent = state.report.status === 'sent';
  if (state.isDemo) {
    Object.entries(updates).forEach(([code, quantity]) => {
      state.entries[code] = { quantity, updatedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }), updatedBy: state.role === 'receptionist' ? 'แผนกต้อนรับ' : 'แผนกบัญชี' };
    });
    state.note = elements.reportNote.value.trim();
    state.report.note = state.note;
    state.report.updatedAt = new Date().toISOString();
    if (state.role === 'receptionist') {
      state.report.receptionSavedAt = state.report.updatedAt;
      state.report.status = isAccountingSaved() ? 'pending_send' : 'waiting_accounting';
    } else {
      state.report.accountingSavedAt = state.report.updatedAt;
      state.report.status = wasSent ? 'revised_pending_resend' : 'pending_send';
    }
  } else {
    const payload = Object.fromEntries(Object.entries(updates).map(([code, quantity]) => [code, quantity]));
    const { error } = await supabase.rpc('save_daily_report', { p_report_date: state.date, p_entries: payload, p_note: elements.reportNote.value.trim() || null });
    if (error) return showToast(error.message, 'error');
    await loadReport();
  }
  elements.entryModal.close();
  render();
  showToast('บันทึกข้อมูลเรียบร้อยแล้ว', 'success');
}

function openLineModal() {
  if (!roleCanSend()) return showToast('เฉพาะเจ้าหน้าที่บัญชีหรือผู้ดูแลระบบเท่านั้นที่ส่งรายงานได้', 'error');
  if (!isReceptionSaved() || !isAccountingSaved()) return showToast('กรุณากรอกข้อมูลของทั้งแผนกต้อนรับและบัญชีก่อนส่ง', 'error');
  const sum = totals();
  const version = state.history.length + 1;
  const isRevision = state.report.status === 'revised_pending_resend';
  elements.linePreview.innerHTML = `<div class="line-card-header"><strong>${isRevision ? `รายงานฉบับแก้ไขครั้งที่ ${version}` : `รายงานฉบับที่ ${version}`}</strong><span>ยอดคนเข้าชมฟาร์มและลูกค้าเข้าพัก ประจำวันที่ ${formatThaiDate(state.date)}</span></div><div class="line-card-totals"><div><span>ยอดเข้าชมฟาร์ม</span><b>${sum.farm.toLocaleString('th-TH')} คน</b></div><div><span>ลูกค้าเข้าพัก</span><b>${sum.resort.toLocaleString('th-TH')} คน</b></div><div><span>ยอดสะสมประจำเดือน</span><b>${sum.month.toLocaleString('th-TH')} คน</b></div><div><span>ยอดรวมวันนี้</span><strong>${sum.overall.toLocaleString('th-TH')} คน</strong></div></div>`;
  elements.lineSendNote.textContent = state.isDemo ? 'โหมดสาธิต: ระบบจะจำลองการส่งและบันทึกประวัติ' : 'รายงานจะส่งเข้ากลุ่ม LINE ที่ผู้ดูแลระบบตั้งค่าไว้';
  elements.lineModal.showModal();
}

async function sendLineReport() {
  const button = document.querySelector('#send-line-button');
  button.disabled = true;
  button.innerHTML = '<i data-lucide="loader-circle"></i>กำลังส่ง';
  window.lucide?.createIcons();
  try {
    if (state.isDemo) {
      state.report.status = 'sent';
      state.report.sentAt = new Date().toISOString();
      state.report.updatedAt = state.report.sentAt;
      state.history.unshift({ version: state.history.length + 1, status: 'sent', sender: state.user.name, sentAt: formatDateTime(state.report.sentAt) });
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/line-send', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` }, body: JSON.stringify({ report_date: state.date }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'ไม่สามารถส่ง LINE ได้');
      await loadReport();
    }
    elements.lineModal.close();
    render();
    showToast('ส่งรายงานเข้ากลุ่ม LINE เรียบร้อยแล้ว', 'success');
  } catch (error) {
    showToast(error.message || 'การส่งรายงานไม่สำเร็จ', 'error');
  } finally {
    button.disabled = false;
    button.innerHTML = '<i data-lucide="send"></i>ส่งเข้ากลุ่ม LINE';
    window.lucide?.createIcons();
  }
}

async function loadReport() {
  if (state.isDemo) return;
  const { data: reports, error } = await supabase.from('daily_reports').select('*').eq('report_date', state.date).limit(1);
  if (error) return showToast(error.message, 'error');
  const report = reports?.[0];
  state.report = report ? {
    id: report.id, status: report.status, note: report.note || '', receptionSavedAt: report.reception_saved_at,
    accountingSavedAt: report.accounting_saved_at, updatedAt: report.updated_at, sentAt: report.sent_at
  } : emptyReport();
  state.entries = Object.fromEntries(items.map((item) => [item.code, { quantity: 0, updatedAt: '', updatedBy: '' }]));
  state.note = state.report.note;
  state.history = [];
  if (!report) return;
  const { data: entries, error: entriesError } = await supabase.from('report_entries').select('item_code, quantity, updated_at, profiles!report_entries_updated_by_fkey(display_name)').eq('report_id', report.id);
  if (entriesError) return showToast(entriesError.message, 'error');
  for (const entry of entries || []) {
    state.entries[entry.item_code] = { quantity: entry.quantity, updatedAt: formatDateTime(entry.updated_at).split(' ')[1] || '', updatedBy: entry.profiles?.display_name || '-' };
  }
  const { data: logs } = await supabase.from('line_delivery_logs').select('status, created_at, report_versions(version_no, created_by)').eq('report_id', report.id).order('created_at', { ascending: false }).limit(4);
  state.history = (logs || []).map((log) => ({ version: log.report_versions?.version_no, status: log.status, sentAt: formatDateTime(log.created_at), sender: 'แผนกบัญชี' }));
}

async function loadProfile() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;
  const { data: profile, error } = await supabase.from('profiles').select('id, display_name, role').eq('id', session.user.id).single();
  if (error) {
    showToast('ไม่พบข้อมูลสิทธิ์ผู้ใช้งาน กรุณาให้ผู้ดูแลระบบสร้าง profile', 'error');
    return false;
  }
  state.isDemo = false;
  state.user = { id: profile.id, name: profile.display_name || session.user.email, email: session.user.email };
  state.role = profile.role;
  await loadReport();
  return true;
}

async function signIn(event) {
  event.preventDefault();
  if (!hasSupabaseConfig) {
    elements.loginMessage.textContent = 'ยังไม่ได้กำหนด Supabase URL และ Publishable Key ใน assets/js/config.js';
    return;
  }
  elements.loginMessage.textContent = '';
  const email = document.querySelector('#login-email').value;
  const password = document.querySelector('#login-password').value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) { elements.loginMessage.textContent = error.message; return; }
  if (await loadProfile()) {
    elements.loginModal.close();
    render();
  }
}

async function signOut() {
  if (!state.isDemo) await supabase.auth.signOut();
  state.isDemo = !hasSupabaseConfig;
  state.role = 'accountant';
  state.user = { id: null, name: 'ผู้ใช้งานสาธิต', email: '' };
  state.report = emptyReport();
  state.entries = seedEntries();
  state.history = [];
  render();
  elements.loginForm.reset();
  elements.loginMessage.textContent = '';
  elements.loginModal.showModal();
}

function setDemoMode() {
  state.isDemo = true;
  state.role = 'accountant';
  state.user = { id: null, name: 'ผู้ใช้งานสาธิต', email: '' };
  state.report = { ...emptyReport(), status: 'pending_send', receptionSavedAt: new Date().toISOString(), accountingSavedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  state.entries = seedEntries();
  elements.loginModal.close();
  render();
}

function switchDemoRole() {
  if (!state.isDemo) return showToast('บทบาทจริงกำหนดจาก Supabase', 'error');
  const roles = ['receptionist', 'accountant', 'admin'];
  state.role = roles[(roles.indexOf(state.role) + 1) % roles.length];
  render();
  showToast(`เปลี่ยนเป็น ${labels[state.role]} ในโหมดสาธิต`, 'success');
}

function downloadCsv() {
  const rows = [['วันที่', formatThaiDate(state.date)], ['รายการ', 'จำนวนคน'], ...items.map((item) => [item.name, state.entries[item.code]?.quantity || 0]), ['ยอดเข้าชมฟาร์ม', totals().farm], ['ลูกค้าเข้าพัก', totals().resort], ['ยอดรวมทั้งหมด', totals().overall]];
  const csv = `\ufeff${rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')}`;
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `รายงานลูกค้า-${formatThaiDate(state.date).replaceAll('/', '-')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function setView(view) {
  state.currentView = view;
  document.querySelectorAll('.nav-item[data-view]').forEach((button) => button.classList.toggle('active', button.dataset.view === view));
  const names = { dashboard: ['หน้าหลัก', 'สรุปยอดลูกค้าประจำวัน'], entry: ['บันทึกยอดประจำวัน', 'กรอกข้อมูลตามสิทธิ์ของผู้ใช้งาน'], history: ['รายการย้อนหลัง', 'ตรวจสอบข้อมูลรายงานย้อนหลัง'], daily: ['แดชบอร์ดรายวัน', 'สรุปยอดลูกค้าของวันที่เลือก'], weekly: ['แดชบอร์ดรายสัปดาห์', 'สัปดาห์นับจากวันจันทร์ถึงวันอาทิตย์'], monthly: ['แดชบอร์ดรายเดือน', 'ยอดรวมและยอดสะสมของเดือนที่เลือก'], yearly: ['เปรียบเทียบรายปี', 'เปรียบเทียบยอดเดือนมกราคมถึงธันวาคม'], line: ['ส่งรายงาน LINE', 'ตรวจสอบรายงานก่อนส่งเข้ากลุ่ม LINE'], settings: ['ตั้งค่าระบบ', 'ผู้ดูแลระบบกำหนดกลุ่ม LINE และเวลาแจ้งเตือน'] };
  const [title, subtitle] = names[view] || names.dashboard;
  elements.pageTitle.textContent = title;
  elements.pageSubtitle.textContent = subtitle;
  if (view === 'entry') openEntryModal();
  if (view === 'line') openLineModal();
  if (view !== 'dashboard' && view !== 'entry' && view !== 'line') showToast('โครงหน้าจอพร้อมแล้ว ส่วนรายงานเต็มจะใช้ข้อมูลจาก Supabase หลังเชื่อมต่อ', 'success');
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.append(toast);
  window.setTimeout(() => toast.remove(), 3500);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

function bindEvents() {
  elements.reportDate.addEventListener('change', async (event) => { state.date = event.target.value; if (!state.isDemo) await loadReport(); render(); });
  document.querySelector('#open-entry-button').addEventListener('click', openEntryModal);
  document.querySelector('#open-line-button').addEventListener('click', openLineModal);
  document.querySelector('#review-reminder-button').addEventListener('click', openLineModal);
  document.querySelector('#export-csv-button').addEventListener('click', downloadCsv);
  document.querySelector('#export-pdf-button').addEventListener('click', () => window.print());
  document.querySelector('#open-history-button').addEventListener('click', () => document.querySelector('#history-section').scrollIntoView({ behavior: 'smooth' }));
  document.querySelector('#view-all-history-button').addEventListener('click', () => document.querySelector('#history-section').scrollIntoView({ behavior: 'smooth' }));
  document.querySelector('#send-line-button').addEventListener('click', sendLineReport);
  elements.entryForm.addEventListener('submit', saveEntry);
  elements.loginForm.addEventListener('submit', signIn);
  document.querySelector('#demo-mode-button').addEventListener('click', setDemoMode);
  document.querySelector('#sign-out-button').addEventListener('click', signOut);
  document.querySelector('#profile-button').addEventListener('click', switchDemoRole);
  document.querySelector('#mobile-menu-button').addEventListener('click', () => document.querySelector('.sidebar').classList.toggle('open'));
  document.querySelectorAll('[data-close-modal]').forEach((button) => button.addEventListener('click', () => document.querySelector(`#${button.dataset.closeModal}`).close()));
  document.querySelectorAll('.nav-item[data-view]').forEach((button) => button.addEventListener('click', () => setView(button.dataset.view)));
}

async function init() {
  bindEvents();
  if (hasSupabaseConfig) {
    const authenticated = await loadProfile();
    if (!authenticated) elements.loginModal.showModal();
  } else {
    state.report = { ...emptyReport(), status: 'pending_send', receptionSavedAt: new Date().toISOString(), accountingSavedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  }
  render();
}

init();
