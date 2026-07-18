const SESSION_KEY = 'career-command-demo-session';
const RECORDS_KEY = 'career-command-demo-records';
const listeners = new Set();

const fakeSession = {
  user: {
    id: 'demo-user',
    email: 'demo@example.com',
    user_metadata: {
      full_name: 'Demo User',
    },
  },
};

const seedRecords = [
  {
    id: 'demo-aurora-ops',
    companyName: 'Aurora Studio',
    roleTitle: 'Operations Coordinator',
    location: 'Auckland',
    workMode: '混合办公',
    employmentType: '全职',
    platform: 'LinkedIn',
    applicationUrl: 'https://example.com/candidate/aurora',
    appliedDate: '2026-07-02',
    status: '申请中',
    rejectionReason: '',
    notes: 'Follow-up scheduled next week.',
  },
  {
    id: 'demo-summit-product',
    companyName: 'Summit Cloud',
    roleTitle: 'Product Assistant',
    location: 'Wellington',
    workMode: '远程办公',
    employmentType: '全职',
    platform: 'Company Careers',
    applicationUrl: 'https://example.com/candidate/summit',
    appliedDate: '2026-07-04',
    status: '面试',
    rejectionReason: '',
    notes: 'First interview completed.',
  },
  {
    id: 'demo-harbour-analyst',
    companyName: 'Harbour Analytics',
    roleTitle: 'Junior Business Analyst',
    location: 'Christchurch',
    workMode: '现场办公',
    employmentType: '全职',
    platform: 'SEEK',
    applicationUrl: '',
    appliedDate: '2026-07-06',
    status: '已拒',
    rejectionReason: 'Role required more local industry experience.',
    notes: 'Keep for future analyst openings.',
  },
  {
    id: 'demo-nova-support',
    companyName: 'Nova Retail Group',
    roleTitle: 'Customer Success Specialist',
    location: 'Auckland',
    workMode: '混合办公',
    employmentType: '全职',
    platform: 'Indeed',
    applicationUrl: 'https://example.com/candidate/nova',
    appliedDate: '2026-07-09',
    status: '终面',
    rejectionReason: '',
    notes: 'Final round with hiring manager.',
  },
  {
    id: 'demo-kinetic-marketing',
    companyName: 'Kinetic Labs',
    roleTitle: 'Marketing Coordinator',
    location: 'Remote',
    workMode: '远程办公',
    employmentType: '兼职',
    platform: 'Referral',
    applicationUrl: 'https://example.com/candidate/kinetic',
    appliedDate: '',
    appliedDateNote: 'Offer received',
    status: 'Offer',
    rejectionReason: '',
    notes: 'Reviewing package.',
  },
];

export function hasSupabaseConfig() {
  return true;
}

export async function getCloudSession() {
  return localStorage.getItem(SESSION_KEY) ? fakeSession : null;
}

export async function onCloudAuthChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export async function signInWithCloudProvider() {
  localStorage.setItem(SESSION_KEY, '1');
  if (!localStorage.getItem(RECORDS_KEY)) {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(seedRecords));
  }
  await notify(fakeSession);
}

export async function signOutCloudUser() {
  localStorage.removeItem(SESSION_KEY);
  await notify(null);
}

export async function loadCloudRecords() {
  const raw = localStorage.getItem(RECORDS_KEY);
  const records = raw ? JSON.parse(raw) : seedRecords;
  return {
    records,
    updated_at: new Date().toISOString(),
  };
}

export async function saveCloudRecords(_userId, records) {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  return new Date().toISOString();
}

async function notify(session) {
  for (const listener of listeners) {
    await listener(session);
  }
}
