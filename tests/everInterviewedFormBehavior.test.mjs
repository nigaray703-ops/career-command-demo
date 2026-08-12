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
  const page = await browser.newPage();
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
        const record = {
          id: 'fictional-existing-true',
          companyName: 'Fictional Workflow Co',
          roleTitle: 'Fictional Operations Role',
          roleCategory: 'Business Analysis',
          industry: 'Finance',
          status: '申请中',
          everInterviewed: true,
          priority: '高',
        };
        export function hasSupabaseConfig() { return true; }
        export async function getCloudSession() { return { user: { id: 'form-behavior-test', email: 'form-behavior-test@example.invalid', user_metadata: { full_name: 'Form Behavior Test' } } }; }
        export async function onCloudAuthChange() { return null; }
        export async function loadCloudRecords() { return { records: [record], updated_at: '2026-08-12T00:00:00.000Z' }; }
        export async function saveCloudRecords(_userId, records) { globalThis.__jobTrackerFormBehaviorSavedRecords = records; return '2026-08-12T00:00:00.000Z'; }
        export async function signInWithCloudProvider() {}
        export async function signOutCloudUser() {}
      `,
    });
  });
  await page.goto(`${origin}/${htmlName}`, { waitUntil: 'networkidle' });
  await page.locator('[data-view="applications"]').click();
  await page.locator('[data-action="edit"][data-id="fictional-existing-true"]').click();

  const status = page.locator('#statusOptions');
  const everInterviewed = page.locator('#everInterviewed');
  assert.equal(await everInterviewed.isChecked(), true, 'editing an existing true record must open checked');
  assert.equal(await everInterviewed.isEnabled(), true, 'an Active record must keep the checkbox editable');

  await status.selectOption('面试');
  assert.equal(await everInterviewed.isChecked(), true, 'Interview must force historical interview true');
  assert.equal(await everInterviewed.isDisabled(), true, 'Interview must disable the historical interview checkbox');

  await status.selectOption('终面');
  assert.equal(await everInterviewed.isChecked(), true, 'Final must force historical interview true');
  assert.equal(await everInterviewed.isDisabled(), true, 'Final must disable the historical interview checkbox');

  for (const editableStatus of ['申请中', '已拒', 'Offer']) {
    await status.selectOption(editableStatus);
    assert.equal(await everInterviewed.isChecked(), true, `${editableStatus} must preserve historical interview true`);
    assert.equal(await everInterviewed.isEnabled(), true, `${editableStatus} must re-enable the checkbox`);
  }

  await everInterviewed.uncheck();
  assert.equal(await everInterviewed.isChecked(), false, 'an editable historical interview checkbox must allow explicit unchecking');

  await status.selectOption('面试');
  assert.equal(await everInterviewed.isChecked(), true, 'a forced checkbox must be restored to true before saving');
  assert.equal(await everInterviewed.isDisabled(), true, 'a forced checkbox must remain disabled before saving');
  await page.locator('#applicationForm button[value="save"]').click();

  await page.waitForFunction(() => Array.isArray(window.__jobTrackerFormBehaviorSavedRecords), undefined, { timeout: 1200 });
  const saved = await page.evaluate(() => window.__jobTrackerFormBehaviorSavedRecords.find((record) => record.id === 'fictional-existing-true'));
  assert.equal(saved.status, '面试', 'saving must keep the selected interview-stage status');
  assert.equal(saved.everInterviewed, true, 'saving a disabled forced checkbox must persist true');
  assert.equal(saved.roleCategory, 'Business Analysis', 'saving form-only edits must preserve the hidden role category');
  assert.equal(saved.industry, 'Finance', 'saving form-only edits must preserve the hidden industry');
  assert.equal(saved.priority, '高', 'saving form-only edits must preserve the hidden priority');
  assert.ok(requests.every((url) => url.startsWith(origin)), 'the behavior test must not call cloud or auth services during any interaction');

  console.log('historical interview form behavior tests passed');
} finally {
  try {
    if (browser) await browser.close();
  } finally {
    if (server?.listening) await new Promise((resolveServer, rejectServer) => server.close((error) => (error ? rejectServer(error) : resolveServer())));
  }
}

async function selectApplicationHtml() {
  const indexHtml = await readHtmlIfPresent('index.html');
  if (indexHtml?.includes('id="applicationForm"')) return 'index.html';
  const productionHtml = await readHtmlIfPresent('job-tracker.html');
  assert.ok(productionHtml, 'missing selected application HTML: expected index.html with #applicationForm or job-tracker.html');
  assert.match(productionHtml, /id="applicationForm"/, 'selected job-tracker.html must contain the application form');
  return 'job-tracker.html';
}

async function readHtmlIfPresent(fileName) {
  try {
    return await readFile(join(root, fileName), 'utf8');
  } catch {
    return null;
  }
}
