export const APPLICATION_STATUSES = [
  '申请中',
  '已拒',
  '面试',
  '终面',
  'Offer',
];

export const DISPLAY_STATUSES = APPLICATION_STATUSES;
export const WORK_MODES = ['待确认', '远程办公', '混合办公', '现场办公'];
export const EMPLOYMENT_TYPES = ['待确认', '全职', '兼职', '自由岗'];
const LEGACY_WORK_MODES = ['远程', '远程/新西兰'];
export const PRIORITIES = ['高', '中', '低'];
export const seedApplications = [];

export function createApplication(input = {}) {
  const now = new Date().toISOString();
  return {
    id: input.id || cryptoId(),
    companyName: input.companyName || '',
    roleTitle: input.roleTitle || '',
    location: input.location || '',
    roleCategory: input.roleCategory || '',
    industry: input.industry || '',
    workMode: [...WORK_MODES, ...LEGACY_WORK_MODES].includes(input.workMode) ? input.workMode : '待确认',
    employmentType: EMPLOYMENT_TYPES.includes(input.employmentType) ? input.employmentType : '待确认',
    platform: input.platform || '',
    applicationUrl: input.applicationUrl || '',
    appliedDate: input.appliedDate || '',
    appliedDateNote: input.appliedDateNote || '',
    status: normalizeStatus(input.status),
    priority: PRIORITIES.includes(input.priority) ? input.priority : '中',
    rejectionReason: input.rejectionReason || '',
    notes: input.notes || '',
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
  };
}

export function filterApplications(records, filters = {}) {
  const query = normalize(filters.query);
  return records.filter((record) => {
    const searchable = normalize([
      record.companyName,
      record.roleTitle,
      record.location,
      record.roleCategory,
      record.industry,
      record.employmentType,
      record.platform,
      record.appliedDateNote,
      record.rejectionReason,
      record.notes,
    ].join(' '));
    const matchesQuery = !query || searchable.includes(query);
    const matchesStatus = !filters.status || filters.status === 'all' || record.status === filters.status;
    return matchesQuery && matchesStatus;
  });
}

export function sortApplications(records, sort = {}) {
  const sortBy = sort.sortBy || 'companyName';
  const direction = sort.sortDirection === 'desc' ? -1 : 1;

  return [...records].sort((a, b) => {
    const valueA = sortValue(a, sortBy);
    const valueB = sortValue(b, sortBy);
    const emptyA = valueA === '';
    const emptyB = valueB === '';
    if (emptyA && emptyB) return compareText(a.companyName, b.companyName);
    if (emptyA) return 1;
    if (emptyB) return -1;
    if (sortBy === 'appliedDate') return direction * valueA.localeCompare(valueB);
    return direction * compareText(valueA, valueB);
  });
}

export function groupApplications(records, groupBy = 'none') {
  if (!groupBy || groupBy === 'none') {
    return [{ label: '', records }];
  }

  const groups = new Map();
  records.forEach((record) => {
    const label = sortValue(record, groupBy) || '未分类';
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(record);
  });

  return [...groups.entries()].map(([label, groupRecords]) => ({
    label,
    records: groupRecords,
  }));
}

export function calculateDashboardStats(records) {
  const statusCounts = Object.fromEntries(APPLICATION_STATUSES.map((status) => [status, 0]));
  records.forEach((record) => {
    statusCounts[record.status] = (statusCounts[record.status] || 0) + 1;
  });

  const total = records.length;
  const interviewCount = ['面试', '终面', 'Offer'].reduce((sum, status) => sum + (statusCounts[status] || 0), 0);
  const rejected = statusCounts['已拒'] || 0;

  return {
    total,
    statusCounts,
    applied: statusCounts['申请中'] || 0,
    rejected,
    interviewCount,
    offer: statusCounts.Offer || 0,
    noResponse: 0,
    rejectionRate: total ? roundRate((rejected / total) * 100) : 0,
    interviewRate: total ? roundRate((interviewCount / total) * 100) : 0,
  };
}

export function getDisplayStatusCount(stats, status) {
  return stats.statusCounts[status] || 0;
}

export function updateApplication(records, id, patch) {
  return records.map((record) => (
    record.id === id
      ? createApplication({ ...record, ...patch, id, createdAt: record.createdAt, updatedAt: new Date().toISOString() })
      : record
  ));
}

export function deleteApplication(records, id) {
  return records.filter((record) => record.id !== id);
}

export function serializeApplications(records) {
  return JSON.stringify(records.map((record) => createApplication(record)));
}

export function createBackupPayload(records, exportedAt = new Date().toISOString()) {
  return {
    app: 'job-application-tracker',
    version: 1,
    exportedAt,
    records: records.map((record) => createApplication(record)),
  };
}

export function restoreBackupApplications(text) {
  const parsed = JSON.parse(text);
  const records = Array.isArray(parsed) ? parsed : parsed.records;
  if (!Array.isArray(records)) throw new Error('Invalid backup file');
  return records.map((record) => createApplication(record));
}

export function restoreApplications(serialized, fallback = []) {
  try {
    const parsed = JSON.parse(serialized);
    if (!Array.isArray(parsed)) return fallback;
    return parsed.map((record) => createApplication(record));
  } catch {
    return fallback;
  }
}

function roundRate(value) {
  return Math.round(value * 10) / 10;
}

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function sortValue(record, key) {
  const values = {
    companyName: record.companyName,
    roleTitle: record.roleTitle,
    location: record.location,
    roleCategory: record.roleCategory,
    industry: record.industry,
    workMode: record.workMode,
    employmentType: record.employmentType,
    platform: record.platform,
    appliedDate: record.appliedDate,
    status: record.status,
  };
  return String(values[key] || '').trim();
}

function compareText(a, b) {
  return String(a || '').localeCompare(String(b || ''), 'en', { sensitivity: 'base', numeric: true });
}

function normalizeStatus(status) {
  if (APPLICATION_STATUSES.includes(status)) return status;
  if (['无回应', '已申请', '已保存', '审核中', '测评', '已撤回', '已过期', '', undefined, null].includes(status)) {
    return '申请中';
  }
  return '申请中';
}

function cryptoId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `application-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
