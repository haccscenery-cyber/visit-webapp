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
  role: 'accountant',
  user: { id: null, name: 'ผู้ใช้งาน', email: '' },
  date: localIsoDate(),
  note: '',
  report: emptyReport(),
  history: [],
  entries: emptyEntries(),
  periodReports: [],
  currentView: 'dashboard',
  period: 'daily',
  historySearch: ''
};

const elements = {
  reportDate: document.querySelector('#report-date'),
  today: document.querySelector('#today-display'),
  pageTitle: document.querySelector('#page-title'),
  pageSubtitle: document.querySelector('#page-subtitle'),
  farmEntryTable: document.querySelector('#farm-entry-table-body'),
  resortEntryTable: document.querySelector('#resort-entry-table-body'),
  farmEntryCount: document.querySelector('#farm-entry-count'),
  resortEntryCount: document.querySelector('#resort-entry-count'),
  farmTotal: document.querySelector('#farm-total'),
  farmTotalLabel: document.querySelector('#farm-total-label'),
  resortTotal: document.querySelector('#resort-total'),
  resortTotalLabel: document.querySelector('#resort-total-label'),
  overallTotal: document.querySelector('#overall-total'),
  overallTotalLabel: document.querySelector('#overall-total-label'),
  monthTotal: document.querySelector('#month-total'),
  monthTotalLabel: document.querySelector('#month-total-label'),
  tableFarmTotal: document.querySelector('#table-farm-total'),
  tableResortTotal: document.querySelector('#table-resort-total'),
  statusTitle: document.querySelector('#report-status-title'),
  statusBadge: document.querySelector('#status-badge'),
  receptionStatus: document.querySelector('#reception-status'),
  accountingStatus: document.querySelector('#accounting-status'),
  lastUpdated: document.querySelector('#last-updated'),
  reminderPanel: document.querySelector('#reminder-panel'),
  reminderTitle: document.querySelector('#reminder-title'),
  reminderDetail: document.querySelector('#reminder-detail'),
  dashboardNote: document.querySelector('#dashboard-note'),
  historyList: document.querySelector('#history-list'),
  trendSection: document.querySelector('#trend-section'),
  farmBarChart: document.querySelector('#farm-bar-chart'),
  resortBarChart: document.querySelector('#resort-bar-chart'),
  farmTrendTitle: document.querySelector('#farm-trend-title'),
  resortTrendTitle: document.querySelector('#resort-trend-title'),
  dashboardModeDescription: document.querySelector('#dashboard-mode-description'),
  pipelinePeriod: document.querySelector('#pipeline-period'),
  pipelineFlow: document.querySelector('#pipeline-flow'),
  planningInsight: document.querySelector('#planning-insight'),
  comparisonSection: document.querySelector('#comparison-section'),
  comparisonLabel: document.querySelector('#comparison-label'),
  comparisonTitle: document.querySelector('#comparison-title'),
  comparisonPeriod: document.querySelector('#comparison-period'),
  comparisonFarmTotal: document.querySelector('#comparison-farm-total'),
  comparisonResortTotal: document.querySelector('#comparison-resort-total'),
  comparisonOverallTotal: document.querySelector('#comparison-overall-total'),
  comparisonCumulativeLabel: document.querySelector('#comparison-cumulative-label'),
  comparisonCumulativeTotal: document.querySelector('#comparison-cumulative-total'),
  comparisonRowLabel: document.querySelector('#comparison-row-label'),
  comparisonRunningLabel: document.querySelector('#comparison-running-label'),
  comparisonTable: document.querySelector('#comparison-table-body'),
  reportHistoryWorkspace: document.querySelector('#report-history-workspace'),
  reportHistoryTable: document.querySelector('#report-history-table-body'),
  historySearch: document.querySelector('#history-search'),
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
  excelExportModal: document.querySelector('#excel-export-modal'),
  excelExportForm: document.querySelector('#excel-export-form'),
  exportYear: document.querySelector('#export-year'),
  exportMonth: document.querySelector('#export-month'),
  exportMonthField: document.querySelector('#export-month-field'),
  exportWeekDate: document.querySelector('#export-week-date'),
  exportWeekField: document.querySelector('#export-week-field'),
  exportSelectionSummary: document.querySelector('#export-selection-summary'),
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

function emptyEntries() {
  return Object.fromEntries(items.map((item) => [item.code, { quantity: 0, updatedAt: '', updatedBy: '' }]));
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
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(date);
  const valueFor = (type) => parts.find((part) => part.type === type)?.value || '';
  return `${valueFor('day')}/${valueFor('month')}/${Number(valueFor('year')) + 543} ${valueFor('hour')}:${valueFor('minute')} น.`;
}

function totals() {
  const farm = items.filter((item) => item.group === 'farm').reduce((sum, item) => sum + Number(state.entries[item.code]?.quantity || 0), 0);
  const resort = Number(state.entries.resort_guests?.quantity || 0);
  const monthPrefix = state.date.slice(0, 7);
  const yearPrefix = state.date.slice(0, 4);
  const reportsThroughDate = state.periodReports.filter((report) => report.date <= state.date);
  const summarizeGroups = (reports) => {
    const grouped = reports.reduce((sum, report) => ({ farm: sum.farm + report.farm, resort: sum.resort + report.resort }), { farm: 0, resort: 0 });
    return { ...grouped, overall: grouped.farm + grouped.resort };
  };
  const month = summarizeGroups(reportsThroughDate.filter((report) => report.date.startsWith(monthPrefix)));
  const year = summarizeGroups(reportsThroughDate.filter((report) => report.date.startsWith(yearPrefix)));
  return { farm, resort, overall: farm + resort, month, year };
}

function isReceptionSaved() { return Boolean(state.entries.resort_guests?.updatedAt); }
function isAccountingSaved() { return items.filter((item) => item.group === 'farm').some((item) => state.entries[item.code]?.updatedAt); }
function roleCanEdit(item) {
  if (state.role === 'admin') return true;
  if (state.role === 'receptionist' && ['sent', 'revised_pending_resend'].includes(currentStatus())) return false;
  if (state.role === 'receptionist') return true;
  return state.role === 'accountant';
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
  const periodTotal = dashboardTotals();
  elements.today.textContent = formatThaiDate(state.date, true);
  elements.reportDate.value = state.date;
  elements.farmTotal.textContent = periodTotal.farm.toLocaleString('th-TH');
  elements.resortTotal.textContent = periodTotal.resort.toLocaleString('th-TH');
  elements.overallTotal.textContent = periodTotal.overall.toLocaleString('th-TH');
  elements.monthTotal.textContent = periodTotal.cumulative.toLocaleString('th-TH');
  elements.tableFarmTotal.textContent = `${sum.farm.toLocaleString('th-TH')} คน`;
  elements.tableResortTotal.textContent = `${sum.resort.toLocaleString('th-TH')} คน`;
  elements.farmEntryCount.textContent = `${items.filter((item) => item.group === 'farm' && state.entries[item.code]?.updatedAt).length} จาก 10 รายการ`;
  elements.resortEntryCount.textContent = `${state.entries.resort_guests?.updatedAt ? 1 : 0} จาก 1 รายการ`;
  renderUser();
  renderStatus();
  renderDashboardMode();
  renderEntries();
  renderChart();
  renderPipeline();
  renderHistory();
  renderComparison();
  renderHistoryWorkspace();
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
  elements.dashboardNote.hidden = !state.report.note;
  elements.dashboardNote.textContent = state.report.note ? `หมายเหตุ: ${state.report.note}` : '';
}

function renderEntries() {
  const row = (item) => {
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
  };
  elements.farmEntryTable.innerHTML = items.filter((item) => item.group === 'farm').map(row).join('');
  elements.resortEntryTable.innerHTML = items.filter((item) => item.group === 'resort').map(row).join('');
}

function renderChart() {
  const rows = comparisonRows(state.period);
  const max = Math.max(...rows.map((row) => row.overall || 0), 1);
  const labelFor = (row) => state.period === 'daily' ? 'วันที่เลือก' : row.label.replace(/\s\d{4}$/, '').replace('วัน', '');
  const renderSeries = (element, key, label) => {
    element.innerHTML = rows.length ? rows.map((row) => {
      const value = row[key] || 0;
      return `<div class="bar-group"><span class="bar" style="height:${Math.max(2, Math.round((value / max) * 100))}%" title="${label} ${value.toLocaleString('th-TH')} คน"></span><small>${escapeHtml(labelFor(row))}</small></div>`;
    }).join('') : '<p class="empty-chart">ยังไม่มีข้อมูลในช่วงเวลานี้</p>';
  };
  renderSeries(elements.farmBarChart, 'farm', 'ยอดเข้าชมฟาร์ม');
  renderSeries(elements.resortBarChart, 'resort', 'ลูกค้าเข้าพัก');
}

function renderHistory() {
  elements.historyList.innerHTML = state.history.length ? state.history.slice(0, 4).map((log) => `<div class="history-item"><div class="history-icon"><i data-lucide="message-circle"></i></div><div><strong>รายงานฉบับที่ ${log.version || 1}</strong><span>${escapeHtml(log.sentAt || formatDateTime(log.created_at))} • ${escapeHtml(log.destination || 'กลุ่ม LINE')}</span></div><span class="badge ${statusClass(log.status || 'sent')}">${labels[log.status || 'sent']}</span></div>`).join('') : '<div class="history-item"><div><strong>ยังไม่มีประวัติการส่ง</strong><span>รายงานที่ส่งสำเร็จจะแสดงที่นี่</span></div></div>';
}

function shiftDate(iso, days) {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function mondayOfWeek(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - weekday + 1);
  return date.toISOString().slice(0, 10);
}

function reportRecord(report) {
  const quantities = new Map((report.report_entries || []).map((entry) => [entry.item_code, Number(entry.quantity || 0)]));
  const farm = items.filter((item) => item.group === 'farm').reduce((sum, item) => sum + (quantities.get(item.code) || 0), 0);
  const resort = quantities.get('resort_guests') || 0;
  return {
    date: report.report_date,
    farm,
    resort,
    overall: farm + resort,
    status: report.status,
    note: report.note || '',
    updatedAt: report.updated_at,
    quantities: Object.fromEntries(items.map((item) => [item.code, quantities.get(item.code) || 0])),
    hasData: true
  };
}

function formatThaiMonth(year, month) {
  const names = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  return `${names[month - 1]} ${Number(year) + 543}`;
}

function dashboardMeta(period = state.period) {
  return {
    daily: {
      label: 'รายวัน', title: 'เปรียบเทียบยอดประจำวันที่เลือก', period: formatThaiDate(state.date), row: 'วันที่', running: 'ยอดรวมวันนั้น',
      description: 'ยอดของวันที่เลือก พร้อมสถานะรายงานและรายการที่ต้องดำเนินการ', trend: 'กราฟยอดลูกค้าของวันที่เลือก', cumulative: 'ยอดสะสมประจำเดือน'
    },
    weekly: {
      label: 'รายสัปดาห์', title: 'เปรียบเทียบยอดวันจันทร์ถึงอาทิตย์', period: `${formatThaiDate(mondayOfWeek(state.date))} - ${formatThaiDate(shiftDate(mondayOfWeek(state.date), 6))}`, row: 'วัน', running: 'ยอดสะสมสัปดาห์',
      description: 'เปรียบเทียบยอดรายวันในสัปดาห์ที่เลือก (จันทร์ถึงอาทิตย์)', trend: 'กราฟแนวโน้มรายสัปดาห์', cumulative: 'ยอดรวมทั้งสัปดาห์'
    },
    monthly: {
      label: 'รายเดือน', title: 'สรุปยอดสะสมจากบันทึกประจำวัน', period: formatThaiMonth(state.date.slice(0, 4), Number(state.date.slice(5, 7))), row: 'วันที่บันทึก', running: 'ยอดสะสมเดือน',
      description: 'ติดตามยอดรายวัน ยอดสะสม และวันสำคัญของเดือนที่เลือก', trend: 'กราฟแนวโน้มรายวันในเดือน', cumulative: 'ยอดรวมทั้งเดือน'
    },
    yearly: {
      label: 'รายปี', title: 'เปรียบเทียบยอดสะสมรายเดือน', period: `ปี ${Number(state.date.slice(0, 4)) + 543}`, row: 'เดือน', running: 'ยอดสะสมปี',
      description: 'เปรียบเทียบยอดรายเดือนเพื่อใช้วางแผนตามฤดูกาล', trend: 'กราฟแนวโน้มรายเดือนทั้งปี', cumulative: 'ยอดรวมทั้งปี'
    }
  }[period];
}

function comparisonRows(view) {
  const records = new Map(state.periodReports.map((report) => [report.date, report]));
  if (view === 'daily') {
    const record = records.get(state.date);
    return record ? [{ ...record, label: formatThaiDate(record.date) }] : [];
  }
  if (view === 'weekly') {
    const monday = mondayOfWeek(state.date);
    return Array.from({ length: 7 }, (_, index) => {
      const date = shiftDate(monday, index);
      const record = records.get(date);
      return record ? { ...record, label: formatThaiDate(date, true) } : { date, label: formatThaiDate(date, true), farm: 0, resort: 0, overall: 0, hasData: false };
    });
  }
  if (view === 'monthly') {
    const prefix = state.date.slice(0, 7);
    return state.periodReports.filter((report) => report.date.startsWith(prefix)).map((report) => ({ ...report, label: formatThaiDate(report.date) }));
  }
  const year = state.date.slice(0, 4);
  return Array.from({ length: 12 }, (_, index) => {
    const month = String(index + 1).padStart(2, '0');
    const monthlyRecords = state.periodReports.filter((report) => report.date.startsWith(`${year}-${month}`));
    const totals = monthlyRecords.reduce((sum, report) => ({ farm: sum.farm + report.farm, resort: sum.resort + report.resort, overall: sum.overall + report.overall }), { farm: 0, resort: 0, overall: 0 });
    return { ...totals, label: formatThaiMonth(year, index + 1), hasData: monthlyRecords.length > 0, count: monthlyRecords.length };
  });
}

function dashboardTotals() {
  const rows = comparisonRows(state.period);
  const total = rows.reduce((sum, row) => ({ farm: sum.farm + row.farm, resort: sum.resort + row.resort, overall: sum.overall + row.overall }), { farm: 0, resort: 0, overall: 0 });
  const cumulative = state.period === 'daily' ? totals().month.overall : total.overall;
  return { ...total, cumulative };
}

function renderDashboardMode() {
  const meta = dashboardMeta();
  document.querySelectorAll('[data-period]').forEach((button) => {
    const active = button.dataset.period === state.period;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
  elements.dashboardModeDescription.textContent = meta.description;
  elements.farmTrendTitle.textContent = `ยอดเข้าชมฟาร์ม${meta.label}`;
  elements.resortTrendTitle.textContent = `ลูกค้าเข้าพัก${meta.label}`;
  elements.trendSection.hidden = state.currentView === 'history' || state.period === 'monthly';
  elements.farmTotalLabel.textContent = `ยอดเข้าชมฟาร์ม${meta.label}`;
  elements.resortTotalLabel.textContent = `ลูกค้าเข้าพัก${meta.label}`;
  elements.overallTotalLabel.textContent = `ยอดรวม${meta.label}`;
  elements.monthTotalLabel.textContent = meta.cumulative;
}

function renderPipeline() {
  const rows = comparisonRows(state.period).filter((row) => row.hasData !== false);
  const total = rows.length;
  const stages = [
    { label: 'รอข้อมูลบัญชี', detail: 'รับข้อมูลจากแผนกต้อนรับ', count: rows.filter((row) => row.status === 'waiting_accounting').length, tone: 'waiting' },
    { label: 'พร้อมตรวจสอบ', detail: 'บัญชีบันทึกแล้ว รอส่ง/ส่งไม่สำเร็จ', count: rows.filter((row) => ['pending_send', 'sending', 'failed', 'revised_pending_resend'].includes(row.status)).length, tone: 'review' },
    { label: 'ส่งแล้ว', detail: 'ข้อมูลพร้อมใช้อ้างอิง', count: rows.filter((row) => row.status === 'sent').length, tone: 'complete' }
  ];
  const pending = stages[0].count + stages[1].count;
  elements.pipelinePeriod.textContent = dashboardMeta().period;
  elements.pipelineFlow.innerHTML = stages.map((stage, index) => `<div class="pipeline-stage ${stage.tone}"><span class="pipeline-step">${index + 1}</span><div><strong>${stage.count.toLocaleString('th-TH')}</strong><span>${stage.label}</span><small>${stage.detail}</small></div></div>${index < stages.length - 1 ? '<i class="pipeline-arrow" data-lucide="arrow-right"></i>' : ''}`).join('');
  const best = rows.reduce((current, row) => (!current || row.overall > current.overall ? row : current), null);
  elements.planningInsight.textContent = total === 0
    ? 'ยังไม่มีข้อมูลที่บันทึกในช่วงนี้ เริ่มบันทึกข้อมูลเพื่อสร้างข้อมูลสำหรับวางแผน'
    : `มีข้อมูล ${total.toLocaleString('th-TH')} วัน/ช่วงเวลา และมี ${pending.toLocaleString('th-TH')} รายการที่ยังต้องดำเนินการ${best ? ` • ยอดสูงสุดคือ ${best.label} (${best.overall.toLocaleString('th-TH')} คน)` : ''}`;
}

function renderHistoryWorkspace() {
  const keyword = state.historySearch.trim().toLowerCase();
  const reports = [...state.periodReports].sort((a, b) => b.date.localeCompare(a.date)).filter((report) => {
    if (!keyword) return true;
    return [formatThaiDate(report.date), labels[report.status], report.status].join(' ').toLowerCase().includes(keyword);
  });
  elements.reportHistoryTable.innerHTML = reports.length ? reports.map((report) => `<tr>
    <td>${formatThaiDate(report.date)}</td><td class="number">${report.farm.toLocaleString('th-TH')}</td><td class="number">${report.resort.toLocaleString('th-TH')}</td><td class="number">${report.overall.toLocaleString('th-TH')}</td>
    <td><span class="badge ${statusClass(report.status)}">${labels[report.status]}</span></td><td>${formatDateTime(report.updatedAt)}</td>
    <td class="history-actions">
      <button class="button text edit-history-button" type="button" data-edit-date="${report.date}" ${state.role === 'accountant' || state.role === 'admin' || (state.role === 'receptionist' && !['sent', 'revised_pending_resend'].includes(report.status)) ? '' : 'disabled'}>แก้ไข</button>
      <button class="button text danger delete-history-button" type="button" data-delete-date="${report.date}" ${['accountant', 'admin'].includes(state.role) && report.date < localIsoDate() ? '' : 'disabled'}>ลบ</button>
    </td>
  </tr>`).join('') : '<tr><td colspan="7" class="muted">ไม่พบรายการในปีหรือเงื่อนไขที่เลือก</td></tr>';
}

function renderComparison() {
  const view = state.period;
  const meta = dashboardMeta(view);
  const rows = comparisonRows(view);
  const total = rows.reduce((sum, row) => ({ farm: sum.farm + row.farm, resort: sum.resort + row.resort, overall: sum.overall + row.overall }), { farm: 0, resort: 0, overall: 0 });
  elements.comparisonLabel.textContent = meta.label;
  elements.comparisonTitle.textContent = meta.title;
  elements.comparisonPeriod.textContent = meta.period;
  elements.comparisonFarmTotal.textContent = total.farm.toLocaleString('th-TH');
  elements.comparisonResortTotal.textContent = total.resort.toLocaleString('th-TH');
  elements.comparisonOverallTotal.textContent = total.overall.toLocaleString('th-TH');
  elements.comparisonCumulativeLabel.textContent = meta.running;
  elements.comparisonCumulativeTotal.textContent = total.overall.toLocaleString('th-TH');
  elements.comparisonRowLabel.textContent = meta.row;
  elements.comparisonRunningLabel.textContent = meta.running;
  let running = 0;
  elements.comparisonTable.innerHTML = rows.length ? rows.map((row) => {
    running += row.overall;
    const missing = row.hasData === false;
    return `<tr><td>${escapeHtml(row.label)}${missing ? '<br><span class="muted">ยังไม่มีบันทึก</span>' : (view === 'yearly' ? `<br><span class="muted">${row.count} วันบันทึก</span>` : '')}</td><td class="number">${row.farm.toLocaleString('th-TH')}</td><td class="number">${row.resort.toLocaleString('th-TH')}</td><td class="number">${row.overall.toLocaleString('th-TH')}</td><td class="number">${running.toLocaleString('th-TH')}</td></tr>`;
  }).join('') : '<tr><td colspan="5" class="muted">ยังไม่มีข้อมูลที่เจ้าหน้าที่บันทึกสำหรับช่วงเวลานี้</td></tr>';
}

function openEntryModal() {
  const editable = items.filter(roleCanEdit);
  if (editable.length === 0) return showToast('บทบาทนี้ไม่มีสิทธิ์แก้ไขข้อมูล', 'error');
  elements.entryRoleNote.textContent = state.role === 'receptionist'
    ? 'แผนกต้อนรับบันทึกยอดเข้าชมฟาร์มและลูกค้าเข้าพักได้ หลังบันทึก ระบบจะรอให้แผนกบัญชีตรวจสอบ ยืนยัน และส่งรายงาน'
    : 'ตรวจสอบและกรอกจำนวนลูกค้า รายการที่มีข้อมูลส่งแล้วถูกแก้ไขจะเปลี่ยนเป็นสถานะรอส่งฉบับแก้ไข';
  const groupMeta = { farm: ['ยอดเข้าชมฟาร์ม', 'รายการบัตรและแพ็กเกจเข้าชม'], resort: ['ลูกค้าบ้านพัก', 'จำนวนผู้เข้าพักรีสอร์ท'] };
  elements.entryFormList.innerHTML = ['farm', 'resort'].map((group) => {
    const groupItems = editable.filter((item) => item.group === group);
    if (!groupItems.length) return '';
    return `<section class="entry-form-group"><div class="entry-group-heading"><strong>${groupMeta[group][0]}</strong><span>${groupMeta[group][1]}</span></div>${groupItems.map((item) => {
      const quantity = Number(state.entries[item.code]?.quantity || 0);
      return `<div class="entry-field"><div><label for="entry-${item.code}">${escapeHtml(item.name)}</label><small>${item.group === 'farm' ? 'ยอดเข้าชมฟาร์ม' : 'ยอดลูกค้าเข้าพัก'}</small></div><input id="entry-${item.code}" data-item-code="${item.code}" type="number" min="0" step="1" inputmode="numeric" value="${quantity}" required /></div>`;
    }).join('')}</section>`;
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
  const payload = Object.fromEntries(Object.entries(updates).map(([code, quantity]) => [code, quantity]));
  const { error } = await supabase.rpc('save_daily_report', { p_report_date: state.date, p_entries: payload, p_note: elements.reportNote.value.trim() || null });
  if (error) return showToast(error.message, 'error');
  await loadReport();
  elements.entryModal.close();
  render();
  showToast('บันทึกข้อมูลเรียบร้อยแล้ว', 'success');
}

function openLineModal() {
  if (!roleCanSend()) return showToast('เฉพาะเจ้าหน้าที่บัญชีหรือผู้ดูแลระบบเท่านั้นที่ส่งรายงานได้', 'error');
  if (!isReceptionSaved() || !isAccountingSaved()) return showToast('กรุณากรอกข้อมูลของทั้งแผนกต้อนรับและบัญชีก่อนส่ง', 'error');
  const sum = totals();
  const version = Math.max(0, ...state.history.map((log) => Number(log.version) || 0)) + 1;
  const isRevision = state.report.status === 'revised_pending_resend';
  elements.linePreview.innerHTML = `<div class="line-card-header"><strong>${isRevision ? `รายงานฉบับแก้ไขครั้งที่ ${version}` : `รายงานฉบับที่ ${version}`}</strong><span>ยอดคนเข้าชมฟาร์มและลูกค้าเข้าพัก ประจำวันที่ ${formatThaiDate(state.date)}</span></div><div class="line-card-totals"><div><span>ยอดเข้าชมฟาร์ม</span><b>${sum.farm.toLocaleString('th-TH')} คน</b></div><div><span>ลูกค้าเข้าพัก</span><b>${sum.resort.toLocaleString('th-TH')} คน</b></div><div class="line-total-overall"><span>ยอดรวมทั้งหมด</span><strong>${sum.overall.toLocaleString('th-TH')} คน</strong></div><div class="line-total-cumulative"><span class="line-cumulative-title">ยอดสะสมเดือน<small>ถึงวันที่รายงาน</small></span><span class="line-cumulative-metrics"><span class="line-cumulative-metric"><i>เข้าชมฟาร์ม</i><b>${sum.month.farm.toLocaleString('th-TH')} คน</b></span><span class="line-cumulative-metric"><i>เข้าพัก</i><b>${sum.month.resort.toLocaleString('th-TH')} คน</b></span></span></div><div class="line-total-cumulative"><span class="line-cumulative-title">ยอดสะสมปี<small>ถึงวันที่รายงาน</small></span><span class="line-cumulative-metrics"><span class="line-cumulative-metric"><i>เข้าชมฟาร์ม</i><b>${sum.year.farm.toLocaleString('th-TH')} คน</b></span><span class="line-cumulative-metric"><i>เข้าพัก</i><b>${sum.year.resort.toLocaleString('th-TH')} คน</b></span></span></div></div>`;
  elements.lineSendNote.textContent = 'รายงานจะส่งตรงถึงเพื่อน LINE ที่เคยส่งข้อความหา OA และระบบบันทึกไว้';
  elements.lineModal.showModal();
}

async function sendLineReport() {
  const button = document.querySelector('#send-line-button');
  button.disabled = true;
  button.innerHTML = '<i data-lucide="loader-circle"></i>กำลังส่ง';
  window.lucide?.createIcons();
  try {
    let accessToken = await freshAccessToken();
    let { response, result } = await requestLineSend(accessToken);
    if (response.status === 401) {
      accessToken = await freshAccessToken(true);
      ({ response, result } = await requestLineSend(accessToken));
    }
    if (!response.ok) {
      const error = new Error(result.error || 'ไม่สามารถส่ง LINE ได้');
      error.status = response.status;
      throw error;
    }
    await loadReport();
    elements.lineModal.close();
    render();
    showToast(`ส่งรายงานทาง LINE เรียบร้อยแล้ว ${Number(result.destination_count || 1).toLocaleString('th-TH')} คน`, 'success');
  } catch (error) {
    if (error.code === 'SESSION_EXPIRED' || error.status === 401) {
      elements.lineModal.close();
      showToast('เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง', 'error');
      await signOut();
    } else {
      showToast(error.message || 'การส่งรายงานไม่สำเร็จ', 'error');
    }
  } finally {
    button.disabled = false;
    button.innerHTML = '<i data-lucide="send"></i>ส่งทาง LINE';
    window.lucide?.createIcons();
  }
}

async function freshAccessToken(forceRefresh = false) {
  let { data, error } = await supabase.auth.getSession();
  let session = data?.session;
  const expiresSoon = !session?.expires_at || (session.expires_at * 1000) - Date.now() < 120000;
  if (!error && session && (forceRefresh || expiresSoon)) {
    ({ data, error } = await supabase.auth.refreshSession(session));
    session = data?.session;
  }
  if (error || !session?.access_token) {
    const sessionError = new Error(error?.message || 'Session expired');
    sessionError.code = 'SESSION_EXPIRED';
    throw sessionError;
  }
  return session.access_token;
}

async function requestLineSend(accessToken) {
  const response = await fetch('/api/line-send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ report_date: state.date, force_resend: true })
  });
  const contentType = response.headers.get('content-type') || '';
  const result = contentType.includes('application/json') ? await response.json() : { error: await response.text() };
  return { response, result };
}

async function loadReport() {
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
  await loadPeriodReports();
  if (!report) return;
  const { data: entries, error: entriesError } = await supabase.from('report_entries').select('item_code, quantity, updated_at, profiles!report_entries_updated_by_fkey(display_name)').eq('report_id', report.id);
  if (entriesError) return showToast(entriesError.message, 'error');
  for (const entry of entries || []) {
    state.entries[entry.item_code] = { quantity: entry.quantity, updatedAt: formatDateTime(entry.updated_at).split(' ')[1] || '', updatedBy: entry.profiles?.display_name || '-' };
  }
  const { data: logs } = await supabase.from('line_delivery_logs').select('status, destination, created_at, report_versions(version_no, created_by)').eq('report_id', report.id).order('created_at', { ascending: false }).limit(8);
  state.history = (logs || []).map((log) => ({ version: log.report_versions?.version_no, status: log.status, destination: log.destination, sentAt: formatDateTime(log.created_at) }));
}

async function loadPeriodReports() {
  const year = state.date.slice(0, 4);
  const { data, error } = await supabase
    .from('daily_reports')
    .select('report_date, status, note, updated_at, report_entries(item_code, quantity)')
    .gte('report_date', [mondayOfWeek(state.date), `${year}-01-01`].sort()[0])
    .lte('report_date', [shiftDate(mondayOfWeek(state.date), 6), `${year}-12-31`].sort().at(-1))
    .order('report_date');
  if (error) {
    showToast(error.message, 'error');
    return;
  }
  state.periodReports = (data || []).map(reportRecord);
}

async function loadProfile() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;
  const { data: profile, error } = await supabase.from('profiles').select('id, display_name, role').eq('id', session.user.id).single();
  if (error) {
    showToast('ไม่พบข้อมูลสิทธิ์ผู้ใช้งาน กรุณาให้ผู้ดูแลระบบสร้าง profile', 'error');
    return false;
  }
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
    document.body.classList.remove('auth-pending');
    elements.loginModal.close();
    render();
  }
}

async function signOut() {
  await supabase.auth.signOut();
  state.role = 'accountant';
  state.user = { id: null, name: 'ผู้ใช้งาน', email: '' };
  state.report = emptyReport();
  state.entries = emptyEntries();
  state.history = [];
  state.periodReports = [];
  elements.loginForm.reset();
  elements.loginMessage.textContent = '';
  document.body.classList.add('auth-pending');
  elements.loginModal.showModal();
}

function emptyExportRecord(date) {
  return { date, farm: 0, resort: 0, overall: 0, status: null, note: '', updatedAt: null, quantities: Object.fromEntries(items.map((item) => [item.code, 0])), hasData: false };
}

function exportMeta(period, anchorDate) {
  if (period === 'weekly') return { label: 'รายสัปดาห์', period: `${formatThaiDate(mondayOfWeek(anchorDate))} - ${formatThaiDate(shiftDate(mondayOfWeek(anchorDate), 6))}` };
  if (period === 'monthly') return { label: 'รายเดือน', period: formatThaiMonth(anchorDate.slice(0, 4), Number(anchorDate.slice(5, 7))) };
  return { label: 'รายปี', period: `ปี ${Number(anchorDate.slice(0, 4)) + 543}` };
}

function selectedExportPeriod() {
  return document.querySelector('input[name="export-period"]:checked')?.value || 'yearly';
}

function exportAnchorDate() {
  const period = selectedExportPeriod();
  const year = elements.exportYear.value || state.date.slice(0, 4);
  if (period === 'weekly') return elements.exportWeekDate.value || `${year}-01-01`;
  if (period === 'monthly') return `${year}-${elements.exportMonth.value || '01'}-01`;
  return `${year}-01-01`;
}

function updateExportControls() {
  const period = selectedExportPeriod();
  elements.exportMonthField.hidden = period !== 'monthly';
  elements.exportWeekField.hidden = period !== 'weekly';
  elements.exportMonth.required = period === 'monthly';
  elements.exportWeekDate.required = period === 'weekly';
  elements.exportSelectionSummary.textContent = `ไฟล์ที่จะสร้าง: ${exportMeta(period, exportAnchorDate()).label} • ${exportMeta(period, exportAnchorDate()).period}`;
}

function openExcelExportModal() {
  const currentYear = Number(state.date.slice(0, 4));
  const reportYears = state.periodReports.map((report) => Number(report.date.slice(0, 4))).filter(Boolean);
  const years = [...new Set([...reportYears, ...Array.from({ length: 8 }, (_, index) => currentYear + 2 - index)])].sort((a, b) => b - a);
  elements.exportYear.innerHTML = years.map((year) => `<option value="${year}" ${year === currentYear ? 'selected' : ''}>${year + 543}</option>`).join('');
  elements.exportMonth.innerHTML = Array.from({ length: 12 }, (_, index) => `<option value="${String(index + 1).padStart(2, '0')}" ${index + 1 === Number(state.date.slice(5, 7)) ? 'selected' : ''}>${new Intl.DateTimeFormat('th-TH', { month: 'long' }).format(new Date(2024, index, 1))}</option>`).join('');
  elements.exportWeekDate.value = state.date;
  const preferredPeriod = ['weekly', 'monthly', 'yearly'].includes(state.period) ? state.period : 'yearly';
  const preferredRadio = document.querySelector(`input[name="export-period"][value="${preferredPeriod}"]`);
  if (preferredRadio) preferredRadio.checked = true;
  updateExportControls();
  elements.excelExportModal.showModal();
}

async function loadExportReports(period, anchorDate) {
  let startDate;
  let endDate;
  if (period === 'weekly') {
    startDate = mondayOfWeek(anchorDate);
    endDate = shiftDate(startDate, 6);
  } else if (period === 'monthly') {
    startDate = `${anchorDate.slice(0, 7)}-01`;
    const year = Number(anchorDate.slice(0, 4));
    const month = Number(anchorDate.slice(5, 7));
    endDate = `${anchorDate.slice(0, 7)}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}`;
  } else {
    startDate = `${anchorDate.slice(0, 4)}-01-01`;
    endDate = `${anchorDate.slice(0, 4)}-12-31`;
  }
  if (!supabase || !state.user.id) return state.periodReports.filter((report) => report.date >= startDate && report.date <= endDate);
  const { data, error } = await supabase
    .from('daily_reports')
    .select('report_date, status, note, updated_at, report_entries(item_code, quantity)')
    .gte('report_date', startDate)
    .lte('report_date', endDate)
    .order('report_date');
  if (error) throw error;
  return (data || []).map(reportRecord);
}

function exportDailyRecords(period, anchorDate, periodReports) {
  const records = new Map(periodReports.map((report) => [report.date, report]));
  if (period === 'weekly') {
    const monday = mondayOfWeek(anchorDate);
    return Array.from({ length: 7 }, (_, index) => records.get(shiftDate(monday, index)) || emptyExportRecord(shiftDate(monday, index)));
  }
  if (period === 'monthly') {
    const year = Number(anchorDate.slice(0, 4));
    const month = Number(anchorDate.slice(5, 7));
    const numberOfDays = new Date(year, month, 0).getDate();
    return Array.from({ length: numberOfDays }, (_, index) => {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`;
      return records.get(date) || emptyExportRecord(date);
    });
  }
  return periodReports.filter((report) => report.date.startsWith(anchorDate.slice(0, 4))).sort((a, b) => a.date.localeCompare(b.date));
}

function exportSummaryRows(dailyRecords, period, anchorDate) {
  if (period !== 'yearly') return dailyRecords.map((report) => ({ label: formatThaiDate(report.date), farm: report.farm, resort: report.resort, hasData: report.hasData }));
  const year = anchorDate.slice(0, 4);
  return Array.from({ length: 12 }, (_, index) => {
    const month = String(index + 1).padStart(2, '0');
    const records = dailyRecords.filter((report) => report.date.startsWith(`${year}-${month}`));
    return {
      label: formatThaiMonth(year, index + 1),
      farm: records.reduce((sum, report) => sum + report.farm, 0),
      resort: records.reduce((sum, report) => sum + report.resort, 0),
      count: records.filter((report) => report.hasData).length,
      quantities: Object.fromEntries(items.map((item) => [
        item.code,
        records.reduce((sum, report) => sum + Number(report.quantities[item.code] || 0), 0)
      ])),
      hasData: records.length > 0
    };
  });
}

async function downloadExcel() {
  const button = document.querySelector('#confirm-excel-export');
  if (!window.ExcelJS) return showToast('ไม่สามารถโหลดระบบสร้าง Excel ได้ กรุณาลองใหม่อีกครั้ง', 'error');
  button.disabled = true;
  try {
    const period = selectedExportPeriod();
    const anchorDate = exportAnchorDate();
    const meta = exportMeta(period, anchorDate);
    const periodReports = await loadExportReports(period, anchorDate);
    const dailyRecords = exportDailyRecords(period, anchorDate, periodReports);
    const summaryRows = exportSummaryRows(dailyRecords, period, anchorDate);
    const workbook = new window.ExcelJS.Workbook();
    workbook.creator = state.user.name || 'Scenery Farm & Resort';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.calcProperties.fullCalcOnLoad = true;

    buildSummaryWorksheet(workbook, summaryRows, meta, period);
    if (period === 'yearly') {
      buildYearlyDetailWorksheet(workbook, summaryRows, meta);
    } else {
      buildPeriodDetailWorksheet(workbook, dailyRecords, meta);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `รายงานลูกค้า-${meta.label}-${safeFilePart(meta.period)}.xlsx`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    elements.excelExportModal.close();
    showToast(`ส่งออก Excel ${meta.label}เรียบร้อยแล้ว`, 'success');
  } catch (error) {
    showToast(error.message || 'ไม่สามารถสร้างไฟล์ Excel ได้', 'error');
  } finally {
    button.disabled = false;
  }
}

function buildSummaryWorksheet(workbook, rows, meta, period) {
  const isYearly = period === 'yearly';
  const sheet = workbook.addWorksheet(isYearly ? 'รายเดือน' : 'สรุป', { views: [{ state: 'frozen', ySplit: 8, showGridLines: false }] });
  sheet.properties.defaultRowHeight = 22;
  sheet.pageSetup = { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } };
  sheet.columns = [{ width: 30 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }];
  sheet.mergeCells('A1:E1');
  sheet.getCell('A1').value = isYearly ? 'รายงานสรุปยอดลูกค้ารายเดือน Scenery Farm & Resort' : 'รายงานสรุปยอดลูกค้า Scenery Farm & Resort';
  sheet.mergeCells('A2:E2');
  sheet.getCell('A2').value = `${meta.label} • ${meta.period}`;
  styleTitle(sheet.getCell('A1'), 20);
  sheet.getRow(1).height = 36;
  styleSubtitle(sheet.getCell('A2'));

  sheet.mergeCells('A4:B4'); sheet.mergeCells('A5:B6');
  sheet.mergeCells('C4:D4'); sheet.mergeCells('C5:D6');
  sheet.getCell('A4').value = 'ยอดเข้าชมฟาร์ม';
  sheet.getCell('C4').value = 'ลูกค้าเข้าพัก';
  const tableStart = 9;
  const tableEnd = tableStart + rows.length - 1;
  const farmTotal = rows.reduce((sum, row) => sum + row.farm, 0);
  const resortTotal = rows.reduce((sum, row) => sum + row.resort, 0);
  sheet.getCell('A5').value = { formula: `SUM(B${tableStart}:B${tableEnd})`, result: farmTotal };
  sheet.getCell('C5').value = { formula: `SUM(C${tableStart}:C${tableEnd})`, result: resortTotal };
  styleSummaryCard(sheet, 4, 1, 6, 2, '#E8F4EE', '#237A4B');
  styleSummaryCard(sheet, 4, 3, 6, 4, '#EAF1FB', '#245B9A');
  sheet.getCell('E4').value = 'ยอดรวมทั้งหมด';
  sheet.getCell('E5').value = { formula: `SUM(D${tableStart}:D${tableEnd})`, result: farmTotal + resortTotal };
  sheet.mergeCells('E5:E6');
  styleSummaryCard(sheet, 4, 5, 6, 5, '#FFF4E5', '#8A4B08');

  sheet.getRow(8).values = ['ช่วงเวลา', 'ยอดเข้าชมฟาร์ม', 'ลูกค้าเข้าพัก', 'ยอดรวม', 'ยอดสะสม'];
  styleTableHeader(sheet.getRow(8));
  let running = 0;
  rows.forEach((row, index) => {
    const rowNumber = tableStart + index;
    running += row.farm + row.resort;
    sheet.getRow(rowNumber).values = [row.label, row.farm, row.resort];
    sheet.getCell(`D${rowNumber}`).value = { formula: `SUM(B${rowNumber}:C${rowNumber})`, result: row.farm + row.resort };
    sheet.getCell(`E${rowNumber}`).value = { formula: `SUM($D$${tableStart}:D${rowNumber})`, result: running };
    styleDataRow(sheet.getRow(rowNumber), index, row.hasData);
    for (let column = 2; column <= 5; column += 1) sheet.getCell(rowNumber, column).alignment = { horizontal: 'right', vertical: 'middle' };
  });
  sheet.autoFilter = `A8:E${tableEnd}`;
  setNumberFormat(sheet, tableStart, 2, tableEnd, 5, '#,##0');
  sheet.getRow(tableEnd + 2).values = ['จัดทำเมื่อ', formatDateTime(new Date().toISOString())];
  sheet.getRow(tableEnd + 2).font = { name: 'Tahoma', size: 9, color: { argb: 'FF6B7280' } };
}

function buildDailyWorksheet(workbook, records, meta) {
  const sheet = workbook.addWorksheet('รายวัน', { views: [{ state: 'frozen', ySplit: 4, showGridLines: false }] });
  sheet.pageSetup = { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
  sheet.columns = [{ width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 25 }, { width: 48 }, { width: 22 }];
  sheet.mergeCells('A1:G1');
  sheet.getCell('A1').value = `ข้อมูลรายวัน • ${meta.period}`;
  styleTitle(sheet.getCell('A1'), 18);
  sheet.getRow(1).height = 36;
  sheet.getRow(3).values = ['วันที่ (พ.ศ.)', 'ยอดเข้าชมฟาร์ม', 'ลูกค้าเข้าพัก', 'ยอดรวม', 'สถานะ', 'หมายเหตุ', 'อัปเดตล่าสุด'];
  styleTableHeader(sheet.getRow(3));
  records.forEach((record, index) => {
    const rowNumber = index + 4;
    sheet.getRow(rowNumber).values = [formatThaiDate(record.date), record.farm, record.resort, record.overall, record.hasData ? labels[record.status] : 'ยังไม่มีบันทึก', record.note || '-', record.updatedAt ? formatDateTime(record.updatedAt) : '-'];
    styleDataRow(sheet.getRow(rowNumber), index, record.hasData);
    sheet.getCell(`F${rowNumber}`).alignment = { vertical: 'top', wrapText: true };
  });
  const end = Math.max(4, records.length + 3);
  if (!records.length) sheet.getCell('A4').value = 'ยังไม่มีข้อมูลที่บันทึกในช่วงเวลานี้';
  sheet.autoFilter = `A3:G${end}`;
  setNumberFormat(sheet, 4, 2, end, 4, '#,##0');
}

function buildPeriodDetailWorksheet(workbook, records, meta) {
  const rows = records.map((record) => ({
    label: formatThaiDate(record.date),
    quantities: record.quantities,
    farm: record.farm,
    resort: record.resort,
    count: record.hasData ? 1 : 0,
    hasData: record.hasData
  }));
  buildYearlyDetailWorksheet(workbook, rows, meta, {
    sheetName: 'รายละเอียดรายวัน',
    title: `รายละเอียดรายวัน Scenery Farm & Resort • ${meta.period}`,
    periodLabel: 'วันที่',
    totalLabel: 'รวมช่วงเวลาที่เลือก',
    countLabel: 'วันที่บันทึก'
  });
}

function buildYearlyDetailWorksheet(workbook, rows, meta, options = {}) {
  const farmItems = items.filter((item) => item.group === 'farm');
  const resortItems = items.filter((item) => item.group === 'resort');
  const columns = [
    { header: options.periodLabel || 'เดือน', key: 'month', width: 24 },
    ...farmItems.map((item) => ({ header: item.name, key: item.code, width: 22 })),
    ...resortItems.map((item) => ({ header: item.name, key: item.code, width: 22 })),
    { header: 'รวมฟาร์ม', key: 'farm', width: 16 },
    { header: 'รวมเข้าพัก', key: 'resort', width: 16 },
    { header: 'รวมทั้งหมด', key: 'overall', width: 16 },
    { header: options.countLabel || 'วันที่บันทึก', key: 'count', width: 14 }
  ];
  const sheet = workbook.addWorksheet(options.sheetName || 'รายละเอียดรายเดือน', { views: [{ state: 'frozen', ySplit: 5, xSplit: 1, showGridLines: false }] });
  sheet.pageSetup = { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.2, right: 0.2, top: 0.45, bottom: 0.45, header: 0.2, footer: 0.2 } };
  sheet.columns = columns.map((column) => ({ key: column.key, width: column.width }));
  const lastColumn = columns.length;
  sheet.mergeCells(1, 1, 1, lastColumn);
  sheet.getCell(1, 1).value = options.title || `รายละเอียดรายเดือน Scenery Farm & Resort • ${meta.period}`;
  styleTitle(sheet.getCell(1, 1), 18);
  sheet.getRow(1).height = 36;

  sheet.mergeCells(3, 1, 4, 1);
  sheet.getCell(3, 1).value = 'ช่วงเวลา';
  if (farmItems.length) {
    sheet.mergeCells(3, 2, 3, farmItems.length + 1);
    sheet.getCell(3, 2).value = 'รายละเอียดผู้เข้าชมฟาร์ม';
  }
  const resortStart = farmItems.length + 2;
  if (resortItems.length) {
    sheet.mergeCells(3, resortStart, 3, resortStart + resortItems.length - 1);
    sheet.getCell(3, resortStart).value = 'รายละเอียดลูกค้าเข้าพัก';
  }
  const totalStart = farmItems.length + resortItems.length + 2;
  sheet.mergeCells(3, totalStart, 3, lastColumn);
  sheet.getCell(3, totalStart).value = 'สรุปยอด';
  columns.slice(1).forEach((column, index) => { sheet.getCell(4, index + 2).value = column.header; });
  styleTableHeader(sheet.getRow(3));
  styleTableHeader(sheet.getRow(4));
  sheet.getRow(3).height = 26;
  sheet.getRow(4).height = 42;

  const detailRows = rows.map((row) => [
    row.label,
    ...farmItems.map((item) => Number(row.quantities[item.code] || 0)),
    ...resortItems.map((item) => Number(row.quantities[item.code] || 0)),
    row.farm,
    row.resort,
    row.farm + row.resort,
    row.count
  ]);
  rows.forEach((row, index) => {
    const rowNumber = index + 5;
    sheet.getRow(rowNumber).values = detailRows[index];
    styleDataRow(sheet.getRow(rowNumber), index, row.hasData);
    for (let column = 2; column <= lastColumn; column += 1) {
      sheet.getCell(rowNumber, column).alignment = { horizontal: 'right', vertical: 'middle' };
      sheet.getCell(rowNumber, column).numFmt = '#,##0';
    }
  });

  const totalRow = rows.length + 5;
  sheet.getCell(totalRow, 1).value = options.totalLabel || 'รวมทั้งปี';
  for (let column = 2; column <= lastColumn; column += 1) {
    const letter = sheet.getColumn(column).letter;
    const result = detailRows.reduce((sum, detailRow) => sum + Number(detailRow[column - 1] || 0), 0);
    sheet.getCell(totalRow, column).value = { formula: `SUM(${letter}5:${letter}${totalRow - 1})`, result };
    sheet.getCell(totalRow, column).numFmt = '#,##0';
  }
  sheet.getRow(totalRow).height = 28;
  sheet.getRow(totalRow).eachCell((cell) => {
    cell.font = { name: 'Tahoma', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70462E' } };
    cell.alignment = { horizontal: cell.col === 1 ? 'left' : 'right', vertical: 'middle' };
  });
  sheet.autoFilter = { from: { row: 4, column: 1 }, to: { row: totalRow - 1, column: lastColumn } };
}

async function deleteHistoricalReport(reportDate) {
  if (!['accountant', 'admin'].includes(state.role)) return showToast('คุณไม่มีสิทธิ์ลบรายงานย้อนหลัง', 'error');
  if (reportDate >= localIsoDate()) return showToast('ลบได้เฉพาะรายงานย้อนหลังเท่านั้น', 'error');
  const thaiDate = formatThaiDate(reportDate);
  if (!window.confirm(`ยืนยันลบรายงานวันที่ ${thaiDate}?\n\nข้อมูล รายการย่อย และประวัติการส่งของวันนี้จะถูกลบถาวร`)) return;
  try {
    const accessToken = await freshAccessToken();
    const response = await fetch('/api/report-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ report_date: reportDate })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'ไม่สามารถลบรายงานย้อนหลังได้');
    if (state.date === reportDate) state.date = localIsoDate();
    await loadReport();
    render();
    showToast(`ลบรายงานวันที่ ${thaiDate} เรียบร้อยแล้ว`, 'success');
  } catch (error) {
    showToast(error.message || 'ไม่สามารถลบรายงานย้อนหลังได้', 'error');
  }
}

function buildDetailWorksheet(workbook, records, meta) {
  const sheet = workbook.addWorksheet('รายละเอียด', { views: [{ state: 'frozen', ySplit: 4, showGridLines: false }] });
  sheet.pageSetup = { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
  sheet.columns = [{ width: 18 }, { width: 20 }, { width: 40 }, { width: 16 }, { width: 25 }, { width: 42 }];
  sheet.mergeCells('A1:F1');
  sheet.getCell('A1').value = `รายละเอียดตามรายการ • ${meta.period}`;
  styleTitle(sheet.getCell('A1'), 18);
  sheet.getRow(1).height = 36;
  sheet.getRow(3).values = ['วันที่ (พ.ศ.)', 'กลุ่ม', 'รายการ', 'จำนวนคน', 'สถานะ', 'หมายเหตุ'];
  styleTableHeader(sheet.getRow(3));
  let rowNumber = 4;
  records.forEach((record) => {
    items.forEach((item) => {
      sheet.getRow(rowNumber).values = [formatThaiDate(record.date), item.group === 'farm' ? 'เข้าชมฟาร์ม' : 'เข้าพัก', item.name, Number(record.quantities[item.code] || 0), labels[record.status], record.note || '-'];
      styleDataRow(sheet.getRow(rowNumber), rowNumber, true);
      sheet.getCell(`F${rowNumber}`).alignment = { vertical: 'top', wrapText: true };
      rowNumber += 1;
    });
  });
  const end = Math.max(4, rowNumber - 1);
  sheet.autoFilter = `A3:F${end}`;
  setNumberFormat(sheet, 4, 4, end, 4, '#,##0');
  if (!records.length) sheet.getCell('A4').value = 'ยังไม่มีข้อมูลที่บันทึกในช่วงเวลานี้';
}

function styleTitle(cell, size) {
  cell.font = { name: 'Tahoma', size, bold: true, color: { argb: 'FFFFFFFF' } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70462E' } };
  cell.alignment = { horizontal: 'left', vertical: 'middle' };
}

function styleSubtitle(cell) {
  cell.font = { name: 'Tahoma', size: 11, color: { argb: 'FF6B4A3A' } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7F2EC' } };
  cell.alignment = { horizontal: 'left', vertical: 'middle' };
}

function styleSummaryCard(sheet, startRow, startColumn, endRow, endColumn, fillColor, textColor) {
  for (let row = startRow; row <= endRow; row += 1) {
    for (let column = startColumn; column <= endColumn; column += 1) {
      const cell = sheet.getCell(row, column);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${fillColor.slice(1)}` } };
      cell.font = { name: 'Tahoma', size: row <= 4 ? 10 : 18, bold: true, color: { argb: `FF${textColor.slice(1)}` } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    }
  }
}

function setNumberFormat(sheet, startRow, startColumn, endRow, endColumn, numberFormat) {
  for (let row = startRow; row <= endRow; row += 1) {
    for (let column = startColumn; column <= endColumn; column += 1) sheet.getCell(row, column).numFmt = numberFormat;
  }
}

function styleTableHeader(row) {
  row.height = 28;
  row.eachCell((cell) => {
    cell.font = { name: 'Tahoma', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70462E' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = { bottom: { style: 'medium', color: { argb: 'FFB78C70' } } };
  });
}

function styleDataRow(row, index, hasData) {
  row.height = 24;
  row.eachCell((cell, column) => {
    cell.font = { name: 'Tahoma', size: 10, color: { argb: hasData ? 'FF374151' : 'FF9CA3AF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: index % 2 === 0 ? 'FFFFFFFF' : 'FFF9F7F5' } };
    cell.alignment = { horizontal: column === 1 ? 'left' : (typeof cell.value === 'number' ? 'right' : 'left'), vertical: 'middle', wrapText: column > 4 };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
  });
}

function safeFilePart(value) {
  return String(value).replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, '_');
}

function setView(view) {
  state.currentView = view;
  document.querySelectorAll('.nav-item[data-view]').forEach((button) => button.classList.toggle('active', button.dataset.view === view));
  const names = { dashboard: ['แดชบอร์ดวิเคราะห์ยอดลูกค้า', 'สลับดูรายวัน รายสัปดาห์ รายเดือน และรายปีได้ในหน้าเดียว'], entry: ['บันทึกยอดประจำวัน', 'กรอกข้อมูลตามสิทธิ์ของผู้ใช้งาน'], history: ['รายการย้อนหลัง', 'ค้นหา ตรวจสอบ และแก้ไขข้อมูลย้อนหลัง'], line: ['ส่งรายงาน LINE', 'ตรวจสอบรายงานก่อนส่งเข้ากลุ่ม LINE'], settings: ['ตั้งค่าระบบ', 'ผู้ดูแลระบบกำหนดกลุ่ม LINE และเวลาแจ้งเตือน'] };
  const [title, subtitle] = names[view] || names.dashboard;
  elements.pageTitle.textContent = title;
  elements.pageSubtitle.textContent = subtitle;
  const isHistory = view === 'history';
  document.querySelectorAll('[data-dashboard-section]').forEach((section) => { section.hidden = isHistory; });
  elements.reportHistoryWorkspace.hidden = !isHistory;
  if (view === 'entry') openEntryModal();
  if (view === 'line') openLineModal();
  render();
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
  elements.reportDate.addEventListener('change', async (event) => { state.date = event.target.value; if (state.user.id) await loadReport(); render(); });
  document.querySelector('#open-entry-button').addEventListener('click', openEntryModal);
  document.querySelector('#open-line-button').addEventListener('click', openLineModal);
  document.querySelector('#review-reminder-button').addEventListener('click', openLineModal);
  document.querySelector('#export-excel-button').addEventListener('click', openExcelExportModal);
  elements.excelExportForm.addEventListener('submit', (event) => { event.preventDefault(); downloadExcel(); });
  document.querySelectorAll('input[name="export-period"]').forEach((input) => input.addEventListener('change', updateExportControls));
  elements.exportYear.addEventListener('change', () => {
    if (selectedExportPeriod() === 'weekly' && elements.exportWeekDate.value) elements.exportWeekDate.value = `${elements.exportYear.value}${elements.exportWeekDate.value.slice(4)}`;
    updateExportControls();
  });
  elements.exportMonth.addEventListener('change', updateExportControls);
  elements.exportWeekDate.addEventListener('change', () => {
    if (elements.exportWeekDate.value) elements.exportYear.value = elements.exportWeekDate.value.slice(0, 4);
    updateExportControls();
  });
  document.querySelector('#export-pdf-button').addEventListener('click', () => window.print());
  document.querySelector('#open-history-button').addEventListener('click', () => setView('history'));
  document.querySelector('#view-all-history-button').addEventListener('click', () => setView('history'));
  document.querySelectorAll('[data-period]').forEach((button) => button.addEventListener('click', () => { state.period = button.dataset.period; setView('dashboard'); }));
  elements.historySearch.addEventListener('input', (event) => { state.historySearch = event.target.value; renderHistoryWorkspace(); });
  document.querySelector('#history-use-selected-date').addEventListener('click', () => setView('dashboard'));
  elements.reportHistoryTable.addEventListener('click', async (event) => {
    const deleteButton = event.target.closest('[data-delete-date]');
    if (deleteButton) return deleteHistoricalReport(deleteButton.dataset.deleteDate);
    const editButton = event.target.closest('[data-edit-date]');
    if (!editButton) return;
    state.date = editButton.dataset.editDate;
    await loadReport();
    setView('dashboard');
    openEntryModal();
  });
  document.querySelector('#send-line-button').addEventListener('click', sendLineReport);
  elements.entryForm.addEventListener('submit', saveEntry);
  elements.loginForm.addEventListener('submit', signIn);
  document.querySelector('#sign-out-button').addEventListener('click', signOut);
  document.querySelector('#mobile-menu-button').addEventListener('click', () => document.querySelector('.sidebar').classList.toggle('open'));
  document.querySelector('.main-content').addEventListener('click', () => document.querySelector('.sidebar').classList.remove('open'));
  document.querySelectorAll('[data-close-modal]').forEach((button) => button.addEventListener('click', () => document.querySelector(`#${button.dataset.closeModal}`).close()));
  document.querySelectorAll('.nav-item[data-view]').forEach((button) => button.addEventListener('click', () => {
    document.querySelector('.sidebar').classList.remove('open');
    setView(button.dataset.view);
  }));
}

async function init() {
  document.body.classList.add('auth-pending');
  bindEvents();
  if (hasSupabaseConfig) {
    const authenticated = await loadProfile();
    if (authenticated) {
      document.body.classList.remove('auth-pending');
      render();
      return;
    }
    elements.loginModal.showModal();
  } else {
    elements.loginMessage.textContent = 'ระบบยังไม่ได้กำหนด Supabase URL และ Publishable Key';
    elements.loginModal.showModal();
  }
}

init();
