import {
  APPLICATION_STATUSES,
  DISPLAY_STATUSES,
  EMPLOYMENT_TYPES,
  WORK_MODES,
  calculateDashboardStats,
  createApplication,
  deleteApplication,
  filterApplications,
  getDisplayStatusCount,
  groupApplications,
  restoreApplications,
  serializeApplications,
  sortApplications,
  updateApplication,
} from './jobTrackerLogic.js';
import {
  getCloudSession,
  hasSupabaseConfig,
  loadCloudRecords,
  onCloudAuthChange,
  saveCloudRecords,
  signInWithCloudProvider,
  signOutCloudUser,
} from './jobTrackerCloud.js';

const VIEW_STORAGE_KEY = 'job-application-tracker-active-view';
const LANGUAGE_STORAGE_KEY = 'job-application-tracker-language';
const SORT_STORAGE_KEY = 'job-application-tracker-sort';
const BACKUP_REMINDER_RECORD_LIMIT = 40;
const statusColors = {
  申请中: '#2563eb',
  无回应: '#8aa4c7',
  面试: '#8b5cf6',
  终面: '#4f46e5',
  Offer: '#16a34a',
  已拒: '#ef8a8a',
  已关闭: '#94a3b8',
};

const i18n = {
  zh: {
    pageTitle: '求职申请追踪器',
    brand: '求职申请追踪器',
    navDashboard: '首页',
    navApplications: '申请列表',
    recordUnit: '条申请记录',
    heroTitle: '把每一次投递，整理成清晰进度。',
    heroText: '登录后查看自己的求职申请、状态分布和转化率。每个账号的数据独立保存。',
    gateLogin: '使用 Google 登录',
    gateStatusReady: '仅授权用户可访问自己的申请记录。',
    gateStatusMissing: '需要先配置 Supabase',
    gateStatusLoading: '正在检查登录状态',
    topTitle: '求职申请追踪器',
    topText: '记录投递状态、候选人中心、面试进度和转化情况。',
    addApplication: '+ 添加申请',
    cloudTitle: '云端账号',
    cloudSignedOut: '未登录',
    cloudSignedIn: '已登录',
    cloudSaving: '保存中',
    cloudSaved: '已保存到云端',
    cloudLoaded: '已从云端加载',
    cloudError: '云端暂不可用',
    lastSynced: '上次同步',
    neverSynced: '尚未同步',
    backupReminder: '记录较多，请及时导出备份',
    signOut: '退出登录',
    downloadData: '下载数据',
    uploadData: '上传数据',
    exportDone: '备份已下载',
    importDone: '备份已恢复',
    importFailed: '无法读取这个备份文件',
    importConfirm: '上传备份会替换当前账号里的申请列表。确定继续吗？',
    language: '语言',
    dashboard: '首页',
    distribution: '状态分布',
    distributionHint: '按当前状态统计申请分布。',
    rates: '转化率',
    total: '总申请数',
    active: '申请中',
    rejected: '已拒',
    interview: '面试',
    final: '终面',
    offer: 'Offer',
    rejectionRate: '拒信率',
    interviewRate: '面试率',
    totalHint: '全部已记录申请',
    activeHint: '流程中/无回应',
    rejectedHint: '已拒绝',
    interviewHint: '已进入面试阶段',
    finalHint: '进入最终面试',
    offerHint: '已收到 Offer',
    rejectionRateHint: '已拒申请比例',
    interviewRateHint: '面试及以上阶段比例',
    listTitle: '申请列表',
    listHint: '搜索公司或岗位，筛选状态，并维护每条申请记录。',
    searchPlaceholder: '搜索公司或岗位',
    allStatuses: '全部状态',
    sort: '排序',
    direction: '方向',
    group: '分类',
    asc: '升序',
    desc: '降序',
    noGroup: '不分类',
    byCompany: '按公司',
    byRole: '按岗位类型',
    byMode: '按工作模式',
    byEmploymentType: '按岗位类型',
    byPlatform: '按申请平台',
    byStatus: '按当前状态',
    companyAZ: '公司 A-Z',
    roleAZ: '岗位 A-Z',
    appliedDate: '申请日期',
    location: '所在地',
    workMode: '工作模式',
    employmentType: '岗位类型',
    platform: '申请平台',
    status: '当前状态',
    index: '序号',
    company: '公司',
    role: '岗位',
    candidateHome: '候选人中心',
    rejectionReason: '被拒理由',
    notes: '备注',
    actions: '操作',
    edit: '编辑',
    delete: '删除',
    open: '打开',
    emptyTitle: '没有找到申请记录',
    emptyText: '换个关键词或状态筛选试试。',
    addMode: '添加申请',
    editMode: '编辑申请',
    newRecord: '新的申请记录',
    companyName: '公司名称',
    roleTitle: '岗位名称',
    candidateUrl: '候选人中心网址',
    dateNote: '日期备注',
    optional: '可选',
    platformPlaceholder: 'LinkedIn、Seek、公司官网',
    urlPlaceholder: '只保留完全正确的网址',
    allInitials: '全',
    rejectionReasonPlaceholder: '手动填写被拒原因',
    notesPlaceholder: '额外备注',
    cancel: '取消',
    close: '关闭',
    save: '保存申请',
    unsavedTitle: '保存这次编辑？',
    unsavedText: '这条申请里有未保存的内容。',
    keepEditing: '继续编辑',
    discard: '直接关闭',
    saveClose: '保存并关闭',
    deleteTitle: '删除这条申请？',
    deleteText: '删除后，这条记录会从求职申请追踪器里移除。',
    uncategorized: '未分类',
    loginRequired: '请先登录查看申请数据',
  },
  en: {
    pageTitle: 'Career Command Center',
    brand: 'Career Command Center',
    navDashboard: 'Dashboard',
    navApplications: 'Applications',
    recordUnit: 'applications',
    heroTitle: 'Turn every application into clear progress.',
    heroText: 'Sign in to view your own applications, status mix, and conversion rates. Each account keeps its data separately.',
    gateLogin: 'Sign in with Google',
    gateStatusReady: 'Only authorized users can access their own application records.',
    gateStatusMissing: 'Supabase config required',
    gateStatusLoading: 'Checking sign-in',
    topTitle: 'Career Command Center',
    topText: 'Track application status, candidate homes, interview progress, and conversion rates.',
    addApplication: '+ Add Application',
    cloudTitle: 'Cloud account',
    cloudSignedOut: 'Signed out',
    cloudSignedIn: 'Signed in',
    cloudSaving: 'Saving',
    cloudSaved: 'Saved to cloud',
    cloudLoaded: 'Loaded from cloud',
    cloudError: 'Cloud unavailable',
    lastSynced: 'Last synced',
    neverSynced: 'Not synced yet',
    backupReminder: 'Many records saved. Download a backup soon.',
    signOut: 'Sign out',
    downloadData: 'Download data',
    uploadData: 'Upload data',
    exportDone: 'Backup downloaded',
    importDone: 'Backup restored',
    importFailed: 'This backup file could not be read',
    importConfirm: 'Uploading a backup will replace the applications in this account. Continue?',
    language: 'Language',
    dashboard: 'Dashboard',
    distribution: 'Status Distribution',
    distributionHint: 'Current application status breakdown.',
    rates: 'Conversion Rates',
    total: 'Total',
    active: 'Active',
    rejected: 'Rejected',
    interview: 'Interview',
    final: 'Final',
    offer: 'Offer',
    rejectionRate: 'Rejection Rate',
    interviewRate: 'Interview Rate',
    totalHint: 'All recorded applications',
    activeHint: 'Still in progress',
    rejectedHint: 'Rejected / closed',
    interviewHint: 'Reached interview stage',
    finalHint: 'Final round',
    offerHint: 'Offer received',
    rejectionRateHint: 'Rejected application share',
    interviewRateHint: 'Interview or later stage share',
    listTitle: 'Applications',
    listHint: 'Search, filter, sort, group, edit, and delete application records.',
    searchPlaceholder: 'Search company or role',
    allStatuses: 'All statuses',
    sort: 'Sort',
    direction: 'Direction',
    group: 'Group',
    asc: 'Ascending',
    desc: 'Descending',
    noGroup: 'No grouping',
    byCompany: 'By company',
    byRole: 'By role type',
    byMode: 'By work mode',
    byEmploymentType: 'By job type',
    byPlatform: 'By platform',
    byStatus: 'By status',
    companyAZ: 'Company A-Z',
    roleAZ: 'Role A-Z',
    appliedDate: 'Applied Date',
    location: 'Location',
    workMode: 'Work Mode',
    employmentType: 'Job Type',
    platform: 'Platform',
    status: 'Status',
    index: '#',
    company: 'Company',
    role: 'Role',
    candidateHome: 'Candidate Home',
    rejectionReason: 'Rejection Reason',
    notes: 'Notes',
    actions: 'Actions',
    edit: 'Edit',
    delete: 'Delete',
    open: 'Open',
    emptyTitle: 'No applications found',
    emptyText: 'Try another keyword or status filter.',
    addMode: 'Add Application',
    editMode: 'Edit Application',
    newRecord: 'New application record',
    companyName: 'Company',
    roleTitle: 'Role',
    candidateUrl: 'Candidate home URL',
    dateNote: 'Date note',
    optional: 'Optional',
    platformPlaceholder: 'LinkedIn, SEEK, company site',
    urlPlaceholder: 'Only keep fully verified URLs',
    allInitials: 'All',
    rejectionReasonPlaceholder: 'Write the rejection reason manually',
    notesPlaceholder: 'Extra notes',
    cancel: 'Cancel',
    close: 'Close',
    save: 'Save Application',
    unsavedTitle: 'Save these changes?',
    unsavedText: 'This application has unsaved edits.',
    keepEditing: 'Keep editing',
    discard: 'Close without saving',
    saveClose: 'Save and close',
    deleteTitle: 'Delete this application?',
    deleteText: 'This record will be removed from your tracker.',
    uncategorized: 'Uncategorized',
    loginRequired: 'Sign in to view application data',
  },
};

const state = {
  applications: [],
  session: null,
  cloudReady: hasSupabaseConfig(),
  cloudMessage: '',
  cloudMessageKey: '',
  lastSyncedAt: '',
  language: localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'zh',
  view: getInitialView(),
  filters: { query: '', status: 'all', initial: 'all' },
  sort: getInitialSort(),
  pendingDeleteId: '',
  formSnapshot: '',
  saveTimer: null,
};

const els = {
  body: document.body,
  title: document.querySelector('title'),
  loginGate: document.querySelector('#loginGate'),
  gateLanguage: document.querySelector('#gateLanguageSelect'),
  gateLogin: document.querySelector('#gateGoogleLoginButton'),
  gateCloudStatus: document.querySelector('#gateCloudStatus'),
  appLanguage: document.querySelector('#appLanguageSelect'),
  cloudStatus: document.querySelector('#cloudStatus'),
  syncStatus: document.querySelector('#syncStatus'),
  cloudProfile: document.querySelector('#cloudProfile'),
  cloudAvatar: document.querySelector('#cloudAvatar'),
  cloudName: document.querySelector('#cloudName'),
  cloudEmail: document.querySelector('#cloudEmail'),
  signOutButton: document.querySelector('#signOutButton'),
  exportDataButton: document.querySelector('#exportDataButton'),
  importDataButton: document.querySelector('#importDataButton'),
  importDataInput: document.querySelector('#importDataInput'),
  navItems: document.querySelectorAll('[data-view]'),
  views: document.querySelectorAll('.view'),
  addButton: document.querySelector('#addApplicationButton'),
  sidebarTotal: document.querySelector('#sidebarTotal'),
  metricGrid: document.querySelector('#metricGrid'),
  statusDonut: document.querySelector('#statusDonut'),
  statusBars: document.querySelector('#statusBars'),
  rateCards: document.querySelector('#rateCards'),
  applicationRows: document.querySelector('#applicationRows'),
  alphabetIndex: document.querySelector('#alphabetIndex'),
  emptyState: document.querySelector('#emptyState'),
  search: document.querySelector('#applicationSearch'),
  statusFilter: document.querySelector('#statusFilter'),
  sortBy: document.querySelector('#sortBy'),
  sortDirection: document.querySelector('#sortDirection'),
  groupBy: document.querySelector('#groupBy'),
  dialog: document.querySelector('#applicationDialog'),
  unsavedDialog: document.querySelector('#unsavedDialog'),
  deleteDialog: document.querySelector('#deleteDialog'),
  form: document.querySelector('#applicationForm'),
  dialogMode: document.querySelector('#dialogMode'),
  dialogTitle: document.querySelector('#dialogTitle'),
  statusOptions: document.querySelector('#statusOptions'),
  workModeOptions: document.querySelector('#workModeOptions'),
  employmentTypeOptions: document.querySelector('#employmentTypeOptions'),
};

initialize();

async function initialize() {
  els.body.classList.add('auth-pending');
  initializeOptions();
  bindEvents();
  applyLanguage();
  renderAuthState();

  try {
    const session = await getCloudSession();
    await handleSession(session);
    await onCloudAuthChange(handleSession);
  } catch (error) {
    state.cloudMessage = `${text('cloudError')}: ${error.message}`;
    await handleSession(null);
  }
}

function bindEvents() {
  els.gateLogin?.addEventListener('click', async () => {
    if (!state.cloudReady) return;
    state.cloudMessageKey = 'gateStatusLoading';
    renderAuthState();
    try {
      await signInWithCloudProvider('google');
    } catch (error) {
      state.cloudMessageKey = '';
      state.cloudMessage = `${text('cloudError')}: ${error.message}`;
      renderAuthState();
    }
  });

  els.signOutButton?.addEventListener('click', async () => {
    await signOutCloudUser();
    await handleSession(null);
  });

  els.exportDataButton?.addEventListener('click', () => {
    if (!state.session) return;
    exportDataBackup();
  });

  els.importDataButton?.addEventListener('click', () => {
    if (!state.session) return;
    els.importDataInput?.click();
  });

  els.importDataInput?.addEventListener('change', async (event) => {
    const [file] = event.target.files || [];
    if (!file || !state.session) return;
    if (!window.confirm(text('importConfirm'))) {
      event.target.value = '';
      return;
    }
    await importDataBackup(file);
    event.target.value = '';
  });

  [els.gateLanguage, els.appLanguage].forEach((select) => {
    select?.addEventListener('change', (event) => {
      state.language = event.target.value;
      localStorage.setItem(LANGUAGE_STORAGE_KEY, state.language);
      applyLanguage();
      render();
    });
  });

  els.navItems.forEach((button) => {
    button.addEventListener('click', () => {
      setView(button.dataset.view);
      render();
    });
  });

  els.addButton.addEventListener('click', () => openForm());
  els.search.addEventListener('input', (event) => {
    state.filters.query = event.target.value;
    renderApplications();
  });
  els.statusFilter.addEventListener('change', (event) => {
    state.filters.status = event.target.value;
    renderApplications();
  });
  els.alphabetIndex?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-initial]');
    if (!button || button.disabled) return;
    state.filters.initial = button.dataset.initial;
    renderApplications();
  });
  els.sortBy.addEventListener('change', (event) => {
    state.sort.sortBy = event.target.value;
    rememberSort();
    renderApplications();
  });
  els.sortDirection.addEventListener('change', (event) => {
    state.sort.sortDirection = event.target.value;
    rememberSort();
    renderApplications();
  });
  els.groupBy.addEventListener('change', (event) => {
    state.sort.groupBy = event.target.value;
    rememberSort();
    renderApplications();
  });

  els.form.addEventListener('submit', (event) => {
    if (event.submitter?.value === 'cancel') {
      if (shouldCloseFormWithoutPrompt()) return;
      event.preventDefault();
      els.unsavedDialog.showModal();
      return;
    }
    event.preventDefault();
    saveForm();
    els.dialog.close();
  });

  els.dialog.addEventListener('cancel', (event) => {
    if (shouldCloseFormWithoutPrompt()) return;
    event.preventDefault();
    els.unsavedDialog.showModal();
  });

  els.unsavedDialog.addEventListener('close', () => {
    if (els.unsavedDialog.returnValue === 'discard') els.dialog.close('discard');
    if (els.unsavedDialog.returnValue === 'save') {
      saveForm();
      els.dialog.close('save');
    }
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

async function handleSession(session) {
  state.session = session;
  if (!session) {
    state.applications = [];
    state.cloudMessage = '';
    state.cloudMessageKey = state.cloudReady ? 'gateStatusReady' : 'gateStatusMissing';
    state.lastSyncedAt = '';
    render();
    return;
  }

  state.cloudMessage = '';
  state.cloudMessageKey = 'gateStatusLoading';
  renderAuthState();
  try {
    const cloudData = await loadCloudRecords(session.user.id);
    state.applications = cloudData?.records ? restoreApplications(JSON.stringify(cloudData.records), []) : [];
    state.lastSyncedAt = cloudData?.updated_at || '';
    state.cloudMessageKey = cloudData?.records ? 'cloudLoaded' : 'cloudSaved';
    if (!cloudData?.records) state.lastSyncedAt = await saveCloudRecords(session.user.id, []);
  } catch (error) {
    state.applications = [];
    state.cloudMessageKey = '';
    state.cloudMessage = `${text('cloudError')}: ${error.message}`;
  }
  render();
}

function initializeOptions() {
  els.statusFilter.innerHTML = option('all', text('allStatuses')) + APPLICATION_STATUSES.map((status) => option(status, statusLabel(status))).join('');
  els.statusOptions.innerHTML = APPLICATION_STATUSES.map((status) => option(status, statusLabel(status))).join('');
  els.workModeOptions.innerHTML = WORK_MODES.map((mode) => option(mode, modeLabel(mode))).join('');
  els.employmentTypeOptions.innerHTML = EMPLOYMENT_TYPES.map((type) => option(type, employmentTypeLabel(type))).join('');
  els.statusFilter.value = state.filters.status;
  els.sortBy.value = state.sort.sortBy;
  els.sortDirection.value = state.sort.sortDirection;
  els.groupBy.value = state.sort.groupBy;
}

function render() {
  renderAuthState();
  renderShell();
  if (!state.session) return;
  renderDashboard();
  renderApplications();
}

function renderAuthState() {
  const signedIn = Boolean(state.session);
  els.body.classList.toggle('auth-pending', false);
  els.body.classList.toggle('is-signed-out', !signedIn);
  els.body.classList.toggle('is-signed-in', signedIn);
  if (els.gateLogin) els.gateLogin.disabled = !state.cloudReady;
  if (els.exportDataButton) els.exportDataButton.disabled = !signedIn;
  if (els.importDataButton) els.importDataButton.disabled = !signedIn;
  const cloudMessage = state.cloudMessage || (state.cloudMessageKey ? text(state.cloudMessageKey) : '');
  if (els.gateCloudStatus) els.gateCloudStatus.textContent = cloudMessage || (state.cloudReady ? text('gateStatusReady') : text('gateStatusMissing'));
  if (els.cloudStatus) els.cloudStatus.textContent = cloudMessage || (signedIn ? text('cloudSignedIn') : text('cloudSignedOut'));
  if (els.syncStatus) els.syncStatus.textContent = syncStatusText(signedIn);
  const user = state.session?.user;
  if (user && els.cloudProfile) {
    const meta = user.user_metadata || {};
    const displayName = meta.full_name || meta.name || user.email || text('cloudSignedIn');
    els.cloudName.textContent = displayName;
    els.cloudEmail.textContent = user.email || '';
    els.cloudAvatar.src = meta.avatar_url || fallbackAvatar(displayName);
    els.cloudAvatar.alt = displayName;
    els.cloudProfile.hidden = false;
  } else if (els.cloudProfile) {
    els.cloudProfile.hidden = true;
  }
}

function renderShell() {
  els.sidebarTotal.textContent = state.session ? state.applications.length : 0;
  els.navItems.forEach((button) => button.classList.toggle('active', button.dataset.view === state.view));
  els.views.forEach((view) => view.classList.toggle('active', view.id === `${state.view}View`));
}

function getInitialView() {
  const hashView = window.location.hash.replace('#', '');
  const storedView = localStorage.getItem(VIEW_STORAGE_KEY);
  if (['dashboard', 'applications'].includes(hashView)) return hashView;
  if (['dashboard', 'applications'].includes(storedView)) return storedView;
  return 'dashboard';
}

function getInitialSort() {
  const defaults = { sortBy: 'companyName', sortDirection: 'asc', groupBy: 'none' };
  try {
    const parsed = JSON.parse(localStorage.getItem(SORT_STORAGE_KEY) || '{}');
    return {
      sortBy: ['companyName', 'roleTitle', 'appliedDate', 'location', 'workMode', 'employmentType', 'platform', 'status'].includes(parsed.sortBy) ? parsed.sortBy : defaults.sortBy,
      sortDirection: ['asc', 'desc'].includes(parsed.sortDirection) ? parsed.sortDirection : defaults.sortDirection,
      groupBy: ['none', 'companyName', 'workMode', 'employmentType', 'platform', 'status'].includes(parsed.groupBy) ? parsed.groupBy : defaults.groupBy,
    };
  } catch {
    return defaults;
  }
}

function rememberSort() {
  localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify(state.sort));
}

function setView(view) {
  if (!['dashboard', 'applications'].includes(view)) return;
  state.view = view;
  localStorage.setItem(VIEW_STORAGE_KEY, view);
  window.history.replaceState(null, '', `#${view}`);
}

function renderDashboard() {
  const stats = calculateDashboardStats(state.applications);
  const cards = [
    ['total', stats.total, text('totalHint')],
    ['active', stats.applied, text('activeHint')],
    ['rejected', stats.rejected, text('rejectedHint')],
    ['interview', stats.statusCounts['面试'] || 0, text('interviewHint')],
    ['offer', stats.offer, text('offerHint')],
    ['rejectionRate', `${stats.rejectionRate}%`, text('rejectionRateHint')],
    ['interviewRate', `${stats.interviewRate}%`, text('interviewRateHint')],
  ];

  els.metricGrid.innerHTML = cards.map(([key, value, hint]) => `
    <article class="metric-card">
      <span>${escapeHtml(text(key))}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(hint)}</small>
    </article>
  `).join('');

  renderDonut(stats);
  renderStatusBars(stats);
  els.rateCards.innerHTML = [
    rateTemplate(text('rejectionRate'), stats.rejectionRate, text('rejectionRateHint')),
    rateTemplate(text('interviewRate'), stats.interviewRate, text('interviewRateHint')),
  ].join('');
}

function renderDonut(stats) {
  const entries = DISPLAY_STATUSES
    .map((status) => [status, getDisplayStatusCount(stats, status)])
    .filter(([, count]) => count > 0);

  if (!entries.length) {
    els.statusDonut.style.background = '#e5e7eb';
    els.statusDonut.innerHTML = '<span>0</span>';
    return;
  }

  let cursor = 0;
  const segments = entries.map(([status, count]) => {
    const start = cursor;
    const end = cursor + (count / displayStatusTotal(stats)) * 100;
    cursor = end;
    return `${statusColors[status]} ${start}% ${end}%`;
  });
  els.statusDonut.style.background = `conic-gradient(${segments.join(', ')})`;
  els.statusDonut.innerHTML = `<span>${stats.total}</span>`;
}

function renderStatusBars(stats) {
  els.statusBars.innerHTML = DISPLAY_STATUSES.map((status) => {
    const count = getDisplayStatusCount(stats, status);
    const width = stats.total ? Math.max(4, (count / stats.total) * 100) : 0;
    return `
      <div class="status-bar-row">
        <div class="bar-label"><span>${escapeHtml(statusLabel(status))}</span><strong>${count}</strong></div>
        <div class="bar-track"><span style="width:${width}%; background:${statusColors[status]}"></span></div>
      </div>
    `;
  }).join('');
}

function displayStatusTotal(stats) {
  return DISPLAY_STATUSES.reduce((sum, status) => sum + getDisplayStatusCount(stats, status), 0) || stats.total || 1;
}

function renderApplications() {
  const baseFilters = { ...state.filters, initial: 'all' };
  const baseVisible = filterApplications(state.applications, baseFilters);
  const visible = sortApplications(filterApplications(state.applications, state.filters), state.sort);
  const groups = groupApplications(visible, state.sort.groupBy);
  renderAlphabetIndex(baseVisible);
  els.applicationRows.innerHTML = groups.map((group) => {
    const groupHeader = group.label ? `
      <tr class="group-row">
        <td colspan="9">${escapeHtml(groupDisplayLabel(group.label))}<span>${group.records.length}</span></td>
      </tr>
    ` : '';
    const rows = group.records.map((record) => `
        <tr>
          <td data-label="${escapeHtml(text('company'))}"><strong class="company-cell">${escapeHtml(record.companyName)}</strong></td>
          <td data-label="${escapeHtml(text('role'))}"><span class="role-cell">${escapeHtml(record.roleTitle)}</span></td>
          <td data-label="${escapeHtml(text('status'))}">${statusBadge(record.status)}</td>
          <td data-label="${escapeHtml(text('appliedDate'))}">${formatAppliedDate(record)}</td>
          <td data-label="${escapeHtml(text('location'))}">${escapeHtml(record.location || '-')}</td>
          <td data-label="${escapeHtml(text('workMode'))}">${escapeHtml(modeLabel(record.workMode) || '-')}</td>
          <td data-label="${escapeHtml(text('employmentType'))}">${escapeHtml(employmentTypeLabel(record.employmentType) || '-')}</td>
          <td data-label="${escapeHtml(text('candidateHome'))}">${candidateHomeLink(record)}</td>
          <td data-label="${escapeHtml(text('actions'))}">
            <div class="row-actions">
              <button type="button" data-action="edit" data-id="${escapeHtml(record.id)}">${text('edit')}</button>
              <button type="button" data-action="delete" data-id="${escapeHtml(record.id)}">${text('delete')}</button>
            </div>
          </td>
        </tr>
      `).join('');
    return `${groupHeader}${rows}`;
  }).join('');
  els.emptyState.hidden = visible.length > 0;
}

function renderAlphabetIndex(records) {
  if (!els.alphabetIndex) return;
  const available = new Set(records.map((record) => companyInitial(record.companyName)));
  const letters = ['all', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
  els.alphabetIndex.innerHTML = letters.map((letter) => {
    const active = state.filters.initial === letter;
    const disabled = letter !== 'all' && !available.has(letter);
    const label = letter === 'all' ? text('allInitials') : letter;
    return `<button type="button" data-initial="${letter}" class="${active ? 'active' : ''}" ${disabled ? 'disabled' : ''}>${escapeHtml(label)}</button>`;
  }).join('');
}

function companyInitial(value) {
  const initial = String(value || '').trim().slice(0, 1).toUpperCase();
  return /^[A-Z]$/.test(initial) ? initial : '#';
}

function openForm(record = null) {
  els.form.reset();
  els.dialogMode.textContent = record ? text('editMode') : text('addMode');
  els.dialogTitle.textContent = record ? `${record.companyName} · ${record.roleTitle}` : text('newRecord');
  const application = record || createApplication();
  Object.entries(application).forEach(([key, value]) => {
    if (els.form.elements[key]) els.form.elements[key].value = value;
  });
  if (!record) els.form.elements.id.value = '';
  state.formSnapshot = formSnapshot();
  els.dialog.showModal();
}

function saveForm() {
  const data = Object.fromEntries(new FormData(els.form).entries());
  const application = createApplication(data);
  state.applications = data.id
    ? updateApplication(state.applications, data.id, application)
    : [application, ...state.applications];
  persist();
  render();
}

function shouldCloseFormWithoutPrompt() {
  return formSnapshot() === state.formSnapshot;
}

function formSnapshot() {
  const data = Object.fromEntries(new FormData(els.form).entries());
  delete data.id;
  return JSON.stringify(data);
}

function rateTemplate(label, value, hint) {
  return `
    <article class="rate-card">
      <div><span>${escapeHtml(label)}</span><strong>${value}%</strong></div>
      <div class="rate-track"><span style="width:${Math.min(100, value)}%"></span></div>
      <p>${escapeHtml(hint)}</p>
    </article>
  `;
}

function statusBadge(status) {
  return `<span class="status-badge" style="--status-color:${statusColors[status] || '#64748b'}">${escapeHtml(statusLabel(status))}</span>`;
}

function candidateHomeLink(record) {
  if (!record.applicationUrl) return '';
  return `<a class="table-link" href="${escapeHtml(record.applicationUrl)}" target="_blank" rel="noreferrer">链接</a>`;
}

function persist() {
  state.cloudMessage = '';
  state.cloudMessageKey = 'cloudSaving';
  renderAuthState();
  clearTimeout(state.saveTimer);
  state.saveTimer = setTimeout(async () => {
    try {
      if (state.session) state.lastSyncedAt = await saveCloudRecords(state.session.user.id, state.applications);
      state.cloudMessageKey = 'cloudSaved';
    } catch (error) {
      state.cloudMessageKey = '';
      state.cloudMessage = `${text('cloudError')}: ${error.message}`;
    }
    renderAuthState();
  }, 200);
}

function exportDataBackup() {
  const payload = {
    app: 'career-command-center',
    version: 1,
    exportedAt: new Date().toISOString(),
    records: JSON.parse(serializeApplications(state.applications)),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `career-command-center-backup-${date}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  state.cloudMessage = '';
  state.cloudMessageKey = 'exportDone';
  renderAuthState();
}

async function importDataBackup(file) {
  try {
    const raw = await file.text();
    const parsed = JSON.parse(raw);
    const records = Array.isArray(parsed) ? parsed : parsed.records;
    if (!Array.isArray(records)) throw new Error('Invalid backup shape');
    state.applications = restoreApplications(JSON.stringify(records), []);
    state.lastSyncedAt = await saveCloudRecords(state.session.user.id, state.applications);
    state.cloudMessage = '';
    state.cloudMessageKey = 'importDone';
    render();
  } catch (error) {
    state.cloudMessageKey = '';
    state.cloudMessage = `${text('importFailed')}: ${error.message}`;
    renderAuthState();
  }
}

function applyLanguage() {
  document.documentElement.lang = state.language === 'en' ? 'en' : 'zh-CN';
  els.body.classList.toggle('is-lang-en', state.language === 'en');
  els.body.classList.toggle('is-lang-zh', state.language !== 'en');
  els.title.textContent = text('pageTitle');
  [els.gateLanguage, els.appLanguage].forEach((select) => {
    if (select) select.value = state.language;
  });
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    node.textContent = text(node.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
    node.placeholder = text(node.dataset.i18nPlaceholder);
  });
  document.querySelectorAll('[data-i18n-aria-label]').forEach((node) => {
    node.setAttribute('aria-label', text(node.dataset.i18nAriaLabel));
  });
  initializeOptions();
}

function text(key) {
  return i18n[state.language][key] || i18n.zh[key] || key;
}

function statusLabel(status) {
  const labels = {
    en: { 申请中: 'Active', 已拒: 'Rejected', 面试: 'Interview', 终面: 'Final', Offer: 'Offer' },
    zh: { 申请中: '申请中', 已拒: '已拒', 面试: '面试', 终面: '终面', Offer: 'Offer' },
  };
  return labels[state.language][status] || status;
}

function modeLabel(mode) {
  const labels = {
    en: { 待确认: 'TBC', 远程办公: 'Remote', 远程: 'Remote', 混合办公: 'Hybrid', 现场办公: 'On-site', '远程/新西兰': 'Remote' },
    zh: { 待确认: '待确认', 远程办公: '远程办公', 远程: '远程办公', 混合办公: '混合办公', 现场办公: '现场办公', '远程/新西兰': '远程办公' },
  };
  return labels[state.language][mode] || mode;
}

function employmentTypeLabel(type) {
  const labels = {
    en: { 待确认: 'TBC', 全职: 'Full-time', 兼职: 'Part-time', 固定期限: 'Fixed-term', 合同工: 'Contract', 临时工: 'Temporary', 实习: 'Internship', 自由职业: 'Freelance', 自由岗: 'Freelance' },
    zh: { 待确认: '待确认', 全职: '全职', 兼职: '兼职', 固定期限: '固定期限', 合同工: '合同工', 临时工: '临时工', 实习: '实习', 自由职业: '自由职业', 自由岗: '自由职业' },
  };
  return labels[state.language][type] || type;
}

function formatOptionalText(value) {
  const textValue = String(value || '').trim();
  return textValue ? escapeHtml(textValue) : '-';
}

function groupDisplayLabel(label) {
  if (label === '未分类') return text('uncategorized');
  if (APPLICATION_STATUSES.includes(label)) return statusLabel(label);
  if (EMPLOYMENT_TYPES.includes(label)) return employmentTypeLabel(label);
  return modeLabel(label);
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(state.language === 'en' ? 'en-NZ' : 'zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function formatAppliedDate(record) {
  if (record.appliedDate) return formatDate(record.appliedDate);
  return record.appliedDateNote ? escapeHtml(record.appliedDateNote) : '';
}

function syncStatusText(signedIn) {
  if (!signedIn) return '';
  const base = state.lastSyncedAt
    ? `${text('lastSynced')}：${formatSyncTime(state.lastSyncedAt)}`
    : `${text('lastSynced')}：${text('neverSynced')}`;
  if (!state.lastSyncedAt || state.applications.length >= BACKUP_REMINDER_RECORD_LIMIT) {
    return `${base} · ${text('backupReminder')}`;
  }
  return base;
}

function formatSyncTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(state.language === 'en' ? 'en-NZ' : 'zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function option(value, label) {
  return `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function fallbackAvatar(name) {
  const initial = String(name || 'U').trim().slice(0, 1).toUpperCase() || 'U';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#2563eb"/><stop offset="1" stop-color="#14b8a6"/></linearGradient></defs>
      <rect width="72" height="72" rx="36" fill="url(#g)"/>
      <text x="36" y="45" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="800" fill="white">${escapeHtml(initial)}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
