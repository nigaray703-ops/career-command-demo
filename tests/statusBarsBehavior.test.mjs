import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { access, readFile, readdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const runtimeNodeModules = resolve(dirname(process.execPath), '..', 'node_modules');
const { chromium } = await import(pathToFileURL(join(runtimeNodeModules, 'playwright', 'index.mjs')).href);
const contentTypes = { '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png' };
const browserCache = join(homedir(), 'Library', 'Caches', 'ms-playwright');
const browserCandidates = [
  chromium.executablePath(),
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ...(await readdir(browserCache).catch(() => []))
    .filter((name) => /^chromium-\d+$/.test(name))
    .map((name) => join(browserCache, name, 'chrome-mac-arm64', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing')),
];
const browserExecutable = (await Promise.all(browserCandidates.map(async (candidate) => {
  try {
    await access(candidate);
    return candidate;
  } catch {
    return '';
  }
}))).find(Boolean);
assert.ok(browserExecutable, 'the bundled Chromium executable must be available for the behavior test');

const expectedBars = [
  { count: 49, width: 34.75177304964539 },
  { count: 86, width: 60.99290780141844 },
  { count: 5, width: 3.5460992907801416 },
  { count: 0, width: 0 },
  { count: 1, width: 0.7092198581560284 },
];

let server;
let browser;
try {
  const htmlName = await selectApplicationHtml();
  server = createServer(async (request, response) => {
    const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
    const fileName = pathname === '/' ? htmlName : decodeURIComponent(pathname).replace(/^\/+/, '');
    const filePath = resolve(root, fileName);
    if (!filePath.startsWith(`${root}${sep}`) && filePath !== join(root, htmlName)) {
      response.writeHead(403).end();
      return;
    }
    try {
      const content = await readFile(filePath);
      response.writeHead(200, { 'content-type': contentTypes[extname(filePath)] || 'application/octet-stream' }).end(content);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolveServer) => server.listen(0, '127.0.0.1', resolveServer));
  const { port } = server.address();
  const origin = `http://127.0.0.1:${port}`;
  browser = await chromium.launch({ executablePath: browserExecutable, headless: true });
  const page = await browser.newPage({ viewport: { width: 551, height: 837 } });
  const requests = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.route('**/*', (route) => {
    const requestUrl = route.request().url();
    if (!requestUrl.startsWith(origin)) {
      route.abort();
      return;
    }
    if (new URL(requestUrl).pathname !== '/src/jobTrackerCloud.js') {
      route.continue();
      return;
    }
    route.fulfill({
      contentType: 'text/javascript',
      body: `
        const statuses = [
          ['申请中', 49],
          ['已拒', 86],
          ['面试', 5],
          ['终面', 0],
          ['Offer', 1],
        ];
        const records = statuses.flatMap(([status, count]) => Array.from({ length: count }, (_, index) => ({
          id: status + '-' + index,
          companyName: 'Fictional ' + status + ' Company ' + index,
          roleTitle: 'Fictional Role ' + index,
          location: 'Auckland',
          roleCategory: 'Business Analysis',
          industry: 'Technology',
          workMode: '混合办公',
          employmentType: '全职',
          platform: 'Fictional Careers',
          applicationUrl: '',
          appliedDate: '2026-08-01',
          appliedDateNote: '',
          status,
          everInterviewed: status === '面试' || status === '终面',
          priority: '中',
          rejectionReason: '',
          notes: '',
          createdAt: '2026-08-01T00:00:00.000Z',
          updatedAt: '2026-08-01T00:00:00.000Z',
        })));
        export function hasSupabaseConfig() { return true; }
        export async function getCloudSession() { return { user: { id: 'status-bar-test', email: 'status-bar-test@example.invalid', user_metadata: { full_name: 'Status Bar Test' } } }; }
        export async function onCloudAuthChange() { return null; }
        export async function loadCloudRecords() { return { records, updated_at: '2026-08-27T00:00:00.000Z' }; }
        export async function saveCloudRecords() { return '2026-08-27T00:00:00.000Z'; }
        export async function signInWithCloudProvider() {}
        export async function signOutCloudUser() {}
      `,
    });
  });

  await page.goto(`${origin}/${htmlName}#dashboard`, { waitUntil: 'networkidle' });
  const bars = await page.locator('#statusBars .status-bar-row').evaluateAll((rows) => rows.map((row) => ({
    count: Number(row.querySelector('.bar-label strong').textContent),
    width: Number.parseFloat(row.querySelector('.bar-track span').style.width),
  })));

  assert.equal(bars.length, expectedBars.length, 'the dashboard must render one bar for each current status');
  bars.forEach((bar, index) => {
    assert.equal(bar.count, expectedBars[index].count, `status row ${index + 1} must show the correct count`);
    assert.ok(
      Math.abs(bar.width - expectedBars[index].width) < 0.0001,
      `status row ${index + 1} must use its exact share of 141; expected ${expectedBars[index].width}%, received ${bar.width}%`,
    );
  });
  assert.ok(bars[2].width > bars[4].width, 'Interview 5 must render longer than Offer 1');
  assert.equal(bars[3].width, 0, 'Final 0 must render with no colored progress length');
  assert.ok(requests.every((url) => url.startsWith(origin)), 'the behavior test must not call cloud or auth services');

  console.log('dashboard status bar behavior tests passed');
} finally {
  try {
    if (browser) await browser.close();
  } finally {
    if (server?.listening) await new Promise((resolveServer, rejectServer) => server.close((error) => (error ? rejectServer(error) : resolveServer())));
  }
}

async function selectApplicationHtml() {
  const indexHtml = await readHtmlIfPresent('index.html');
  if (indexHtml?.includes('id="statusBars"')) return 'index.html';
  const productionHtml = await readHtmlIfPresent('job-tracker.html');
  assert.ok(productionHtml, 'missing selected application HTML: expected index.html with #statusBars or job-tracker.html');
  assert.match(productionHtml, /id="statusBars"/, 'selected job-tracker.html must contain the dashboard status bars');
  return 'job-tracker.html';
}

async function readHtmlIfPresent(fileName) {
  try {
    return await readFile(join(root, fileName), 'utf8');
  } catch {
    return null;
  }
}
