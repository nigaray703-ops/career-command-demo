import {
  APPLICATION_STATUSES,
  WORK_MODES,
  calculateDashboardStats,
  createApplication,
  createBackupPayload,
  deleteApplication,
  filterApplications,
  getDisplayStatusCount,
  groupApplications,
  restoreApplications,
  sortApplications,
  updateApplication,
} from './jobTrackerLogic.js';

const STORAGE_KEY = 'career-command-demo-applications';
const VIEW_STORAGE_KEY = 'career-command-demo-view';
const SORT_STORAGE_KEY = 'career-command-demo-sort';

const statusColors = {
  申请中: '#2563eb',
  面试: '#8b5cf6',
  终面: '#4f46e5',
  Offer: '#16a34a',
  已拒: '#ef8a8a',
};

const seedApplications = [
  {
    id: 'demo-aurora-ops',
    companyName: 'Aurora Studio',
    roleTitle: 'Operations Coordinator',
    location: 'Auckland',
    workMode: '混合办公',
    platform: 'LinkedIn',
    applicationUrl: 'https://example.com/candidate/aurora',
    appliedDate: '2026-06-03',
    status: '申请中',
  },
  {
    id: 'demo-summit-product',
    companyName: 'Summit Cloud',
    roleTitle: 'Product Assistant',
    location: 'Wellington',
    workMode: '远程办公',
    platform: 'Company Careers',
    applicationUrl: 'https://example.com/candidate/summit',
    appliedDate: '2026-06-05',
    status: '面试',
  },
  {
    id: 'demo-harbour-analyst',
    companyName: 'Harbour Analytics',
    roleTitle: 'Junior Business Analyst',
    location: 'Christchurch',
    workMode: '现场办公',
    platform: 'SEEK',
    applicationUrl: 'https://example.com/candidate/harbour',
    appliedDate: '2026-06-09',
    status: '已拒',
  },
  {
    id: 'demo-nova-support',
    companyName: 'Nova Retail Group',
    roleTitle: 'Customer Success Specialist',
    location: 'Auckland',
    workMode: '混合办公',
    platform: 'Indeed',
    applicationUrl: 'https://example.com/candidate/nova',
    appliedDate: '2026-06-12',
    status: '终面',
  },
  {
    id: 'demo-kinetic-marketing',
    companyName: 'Kinetic Labs',
    roleTitle: 'Marketing Coordinator',
    location: 'Remote',
    workMode: '远程办公',
    platform: 'Referral',
    applicationUrl: 'https://example.com/candidate/kinetic',
    appliedDate: '2026-06-14',
    status: 'Offer',
  },
  {
    id: 'demo-civic-admin',
    companyName: 'Civic Services NZ',
    roleTitle: 'Administration Assistant',
    location: 'Hamilton',
    workMode: '现场办公',
    platform: 'Company Careers',
    applicationUrl: '',
    appliedDate: '2026-06-17',
    appliedDateNote: '等待确认',
    status: '申请中',
  },
];

const state = {
  applications: loadApplications(),
  view: localStorage.getItem(VIEW_STORAGE_KEY) || 'dashboard',
  filters: { query: '', status: 'all' },
  sort: loadSort(),
  pendingDeleteId: '',
};

const els = {
  navItems: document.querySelectorAll('[data-view]'),
  views: document.querySelectorAll('.view'),
  addButton: document.querySelector('#addApplicationButton'),
  resetButton: document.querySelector('#resetDemoButton'),
  exportButton: document.querySelector('#exportDataButton'),
  sidebarTotal: document.querySelector('#sidebarTotal'),
  metricGrid: document.querySelector('#metricGrid'),
  statusDonut: document.querySelector('#statusDonut'),
  statusBars: document.querySelector('#statusBars'),
  rateCards: document.querySelector('#rateCards'),
  applicationRows: document.querySelector('#applicationRows'),
  emptyState: document.querySelector('#emptyState'),
  search: document.querySelector('#applicationSearch'),
  statusFilter: document.querySelector('#statusFilter'),
  sortBy: document.querySelector('#sortBy'),
  sortDirection: document.querySelector('#sortDirection'),
  groupBy: document.querySelector('#groupBy'),
  dialog: document.querySelector('#applicationDialog'),
  deleteDialog: document.querySelector('#deleteDialog'),
  form: document.querySelector('#applicationForm'),
  dialogMode: document.querySelector('#dialogMode'),
  dialogTitle: document.querySelector('#dialogTitle'),
  statusOptions: document.querySelector('#statusOptions'),
  workModeOptions: document.querySelector('#workModeOptions'),
};

initialize();

function initialize() {
  initializeOptions();
  bindEvents();
  setView(state.view);
  render();
}

function initializeOptions() {
  els.statusFilter.innerHTML = option('all', '全部状态') + APPLICATION_STATUSES.map((status) => option(status, status)).join('');
  els.statusOptions.innerHTML = APPLICATION_STATUSES.map((status) => option(status, status)).join('');
  els.workModeOptions.innerHTML = WORK_MODES.map((mode) => option(mode, mode)).join('');
  els.sortBy.value = state.sort.sortBy;
  els.sortDirection.value = state.sort.sortDirection;
  els.groupBy.value = state.sort.groupBy;
}

function bindEvents() {
  els.navItems.forEach((button) => {
    button.addEventListener('click', () => {
      setView(button.dataset.view);
      render();
    });
  });

  els.addButton.addEventListener('click', () => openForm());
  els.resetButton.addEventListener('click', () => {
    state.applications = seedApplications.map((item) => createApplication(item));
    persist();
    render();
  });
  els.exportButton.addEventListener('click', exportDataBackup);
  els.search.addEventListener('input', (event) => {
    state.filters.query = event.target.value;
    renderApplications();
  });
  els.statusFilter.addEventListener('change', (event) => {
    state.filters.status = event.target.value;
    renderApplications();
  });
  els.sortBy.addEventListener('change', rememberSortFromControls);
  els.sortDirection.addEventListener('change', rememberSortFromControls);
  els.groupBy.addEventListener('change', rememberSortFromControls);

  els.form.addEventListener('submit', (event) => {
    if (event.submitter?.value === 'cancel') return;
    event.preventDefault();
    saveForm();
    els.dialog.close();
  });

  els.applicationRows.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const id = button.dataset.id;
    if (button.dataset.action === 'edit') openForm(state.applications.find((item) => item.id === id));
    if (button.dataset.action === 'delete') {
      state.pendingDeleteId = id;
      els.deleteDialog.showModal();
    }
  });

  els.deleteDialog.addEventListener('close', () => {
    if (els.deleteDialog.returnValue === 'delete' && state.pendingDeleteId) {
      state.applications = deleteApplication(state.applications, state.pendingDeleteId);
      state.pendingDeleteId = '';
      persist();
      render();
    }
  });
}

function render() {
  renderShell();
  renderDashboard();
  renderApplications();
}

function renderShell() {
  els.sidebarTotal.textContent = String(state.applications.length);
}

function renderDashboard() {
  const stats = calculateDashboardStats(state.applications);
  const metrics = [
    ['总申请数', stats.total, '全部演示申请'],
    ['申请中', stats.applied, '流程中/无回应'],
    ['已拒', stats.rejected, '已拒绝'],
    ['面试', stats.interviewCount, '面试及以上'],
    ['Offer', stats.offer, '已收到 Offer'],
  ];

  els.metricGrid.innerHTML = metrics.map(([label, value, hint]) => `
    <article class="metric-card">
      <span>${label}</span>
      <strong>${value}</strong>
      <p>${hint}</p>
    </article>
  `).join('');

  const total = Math.max(stats.total, 1);
  let start = 0;
  const segments = APPLICATION_STATUSES.map((status) => {
    const value = getDisplayStatusCount(stats, status);
    const degrees = (value / total) * 360;
    const segment = `${statusColors[status]} ${start}deg ${start + degrees}deg`;
    start += degrees;
    return segment;
  });
  els.statusDonut.style.background = stats.total
    ? `conic-gradient(${segments.join(', ')})`
    : 'conic-gradient(#d8e1ee 0deg 360deg)';
  els.statusDonut.innerHTML = `<span>${stats.total}<small>总数</small></span>`;

  els.statusBars.innerHTML = APPLICATION_STATUSES.map((status) => {
    const value = getDisplayStatusCount(stats, status);
    const width = stats.total ? Math.max((value / stats.total) * 100, value ? 6 : 0) : 0;
    return `
      <div class="status-bar-row">
        <div><span class="status-dot" style="background:${statusColors[status]}"></span>${status}<strong>${value}</strong></div>
        <span><i style="width:${width}%; background:${statusColors[status]}"></i></span>
      </div>
    `;
  }).join('');

  els.rateCards.innerHTML = [
    ['拒信率', `${stats.rejectionRate}%`, '已拒申请比例'],
    ['面试率', `${stats.interviewRate}%`, '面试及以上阶段比例'],
  ].map(([label, value, hint]) => `
    <article class="rate-card">
      <span>${label}</span>
      <strong>${value}</strong>
      <p>${hint}</p>
    </article>
  `).join('');
}

function renderApplications() {
  const filtered = sortApplications(filterApplications(state.applications, state.filters), state.sort);
  const groups = groupApplications(filtered, state.sort.groupBy);
  els.emptyState.hidden = filtered.length > 0;

  els.applicationRows.innerHTML = groups.map((group) => {
    const heading = group.label ? `<tr class="group-row"><td colspan="9">${group.label}</td></tr>` : '';
    const rows = group.records.map((record) => `
      <tr>
        <td><strong>${escapeHtml(record.companyName)}</strong></td>
        <td>${escapeHtml(record.roleTitle)}</td>
        <td><span class="status-pill" data-status="${record.status}">${record.status}</span></td>
        <td>${escapeHtml(record.appliedDate || record.appliedDateNote || '')}</td>
        <td>${escapeHtml(record.platform)}</td>
        <td>${escapeHtml(record.location)}</td>
        <td>${escapeHtml(record.workMode)}</td>
        <td>${record.applicationUrl ? `<a href="${escapeAttribute(record.applicationUrl)}" target="_blank" rel="noreferrer">打开</a>` : ''}</td>
        <td>
          <div class="row-actions">
            <button class="ghost-button" type="button" data-action="edit" data-id="${record.id}">编辑</button>
            <button class="danger-button" type="button" data-action="delete" data-id="${record.id}">删除</button>
          </div>
        </td>
      </tr>
    `).join('');
    return heading + rows;
  }).join('');
}

function openForm(record) {
  const item = record || createApplication();
  els.dialogMode.textContent = record ? '编辑申请' : '添加申请';
  els.dialogTitle.textContent = record ? `${record.companyName} - ${record.roleTitle}` : '新的演示记录';
  els.form.elements.id.value = item.id;
  els.form.elements.companyName.value = item.companyName;
  els.form.elements.roleTitle.value = item.roleTitle;
  els.form.elements.location.value = item.location;
  els.form.elements.workMode.value = item.workMode;
  els.form.elements.platform.value = item.platform;
  els.form.elements.applicationUrl.value = item.applicationUrl;
  els.form.elements.appliedDate.value = item.appliedDate;
  els.form.elements.appliedDateNote.value = item.appliedDateNote;
  els.form.elements.status.value = item.status;
  els.dialog.showModal();
}

function saveForm() {
  const formData = Object.fromEntries(new FormData(els.form).entries());
  const exists = state.applications.some((item) => item.id === formData.id);
  state.applications = exists
    ? updateApplication(state.applications, formData.id, formData)
    : [createApplication(formData), ...state.applications];
  persist();
  render();
}

function setView(view) {
  state.view = view || 'dashboard';
  localStorage.setItem(VIEW_STORAGE_KEY, state.view);
  els.navItems.forEach((button) => button.classList.toggle('active', button.dataset.view === state.view));
  els.views.forEach((viewEl) => viewEl.classList.toggle('active', viewEl.id === `${state.view}View`));
}

function rememberSortFromControls() {
  state.sort = {
    sortBy: els.sortBy.value,
    sortDirection: els.sortDirection.value,
    groupBy: els.groupBy.value,
  };
  localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify(state.sort));
  renderApplications();
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.applications));
}

function loadApplications() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return seedApplications.map((item) => createApplication(item));
  return restoreApplications(stored, seedApplications.map((item) => createApplication(item)));
}

function loadSort() {
  try {
    return { sortBy: 'companyName', sortDirection: 'asc', groupBy: 'none', ...JSON.parse(localStorage.getItem(SORT_STORAGE_KEY) || '{}') };
  } catch {
    return { sortBy: 'companyName', sortDirection: 'asc', groupBy: 'none' };
  }
}

function exportDataBackup() {
  const payload = createBackupPayload(state.applications);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `career-command-demo-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function option(value, label) {
  return `<option value="${escapeAttribute(value)}">${escapeHtml(label)}</option>`;
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}
