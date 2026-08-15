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
assert.ok(browserExecutable, 'the bundled Chromium executable must be available for the responsive layout test');

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
  const context = await browser.newContext({ viewport: { width: 898, height: 994 } });
  const page = await context.newPage();
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
        const records = [{
          id: 'fictional-responsive-record',
          companyName: 'Fictional Alpha Labs',
          roleTitle: 'Fictional Systems Analyst',
          roleCategory: 'Business Analysis',
          industry: 'Technology',
          status: '申请中',
          everInterviewed: false,
          priority: '中',
          appliedDate: '2026-08-01',
          appliedDateNote: '',
          location: 'Auckland',
          workMode: '混合办公',
          employmentType: '全职',
          platform: 'Example Careers',
          applicationUrl: 'https://example.com/candidate-home',
          rejectionReason: '',
          notes: '',
        }, {
          id: 'fictional-responsive-record-two',
          companyName: 'Fictional Beta Studio',
          roleTitle: 'Fictional Support Analyst',
          roleCategory: 'Application Support',
          industry: 'Professional Services',
          status: '已拒',
          everInterviewed: false,
          priority: '低',
          appliedDate: '2026-08-02',
          appliedDateNote: '',
          location: 'Wellington',
          workMode: '远程办公',
          employmentType: '固定期限',
          platform: 'Example Jobs',
          applicationUrl: 'https://example.com/second-candidate-home',
          rejectionReason: 'Fictional test outcome',
          notes: '',
        }];
        export function hasSupabaseConfig() { return true; }
        export async function getCloudSession() { return { user: { id: 'responsive-layout-test', email: 'responsive-layout@example.invalid', user_metadata: { full_name: 'Responsive Layout Test' } } }; }
        export async function onCloudAuthChange() { return null; }
        export async function loadCloudRecords() { return { records, updated_at: '2026-08-13T00:00:00.000Z' }; }
        export async function saveCloudRecords() { throw new Error('responsive layout test must not save'); }
        export async function signInWithCloudProvider() {}
        export async function signOutCloudUser() {}
      `,
    });
  });

  await page.goto(`${origin}/${htmlName}`, { waitUntil: 'networkidle' });
  const touchIcon = await page.evaluate(async () => {
    const link = document.querySelector('link[rel="apple-touch-icon"]');
    if (!link) return null;
    const image = new Image();
    const loaded = new Promise((resolveImage) => {
      image.addEventListener('load', () => resolveImage(true), { once: true });
      image.addEventListener('error', () => resolveImage(false), { once: true });
    });
    image.src = link.href;
    const didLoad = await loaded;
    return {
      href: link.href,
      didLoad,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
    };
  });
  assert.ok(touchIcon, 'the page must expose an Apple touch icon');
  const legacyTouchIconResponse = await page.request.get(`${origin}/assets/apple-touch-icon.png`);
  assert.equal(
    legacyTouchIconResponse.status(),
    404,
    'the unrelated legacy mobile icon must not remain publicly served',
  );
  assert.match(
    touchIcon.href,
    /\/assets\/job-tracker-icon-192\.png\?v=20260813-mobile-index-icon-stability$/,
    'mobile home-screen installs must use the Career Command Center icon',
  );
  assert.equal(touchIcon.didLoad, true, 'the Career Command Center Apple touch icon must load');
  assert.deepEqual(
    [touchIcon.naturalWidth, touchIcon.naturalHeight],
    [192, 192],
    'the linked Career Command Center icon must expose its complete square artwork',
  );
  await page.locator('[data-view="applications"]').click();
  await page.locator('#applicationRows tr:not(.group-row)').first().waitFor();

  const comfortableLayout = await page.evaluate(() => {
    const row = document.querySelector('#applicationRows tr:not(.group-row)');
    const cells = [...row.children];
    const boxes = cells.map((cell) => {
      const rect = cell.getBoundingClientRect();
      const style = getComputedStyle(cell);
      return {
        display: style.display,
        top: rect.top,
        bottom: rect.bottom,
        centerY: rect.top + rect.height / 2,
        borderBottomWidth: style.borderBottomWidth,
      };
    });
    return {
      cells: boxes,
      rowBorderBottomWidth: getComputedStyle(row).borderBottomWidth,
    };
  });

  assert.deepEqual(
    comfortableLayout.cells.slice(4, 7).map((cell) => cell.display),
    ['none', 'none', 'none'],
    'Location, Work Mode, and Job Type must stay hidden in the comfortable layout',
  );
  const firstLine = [0, 2, 3, 7].map((index) => comfortableLayout.cells[index]);
  const secondLine = [1, 8].map((index) => comfortableLayout.cells[index]);
  assert.ok(firstLine.every((cell) => Math.abs(cell.top - firstLine[0].top) <= 1), 'Company, Date, Status, and Candidate Home must share the first visual row');
  assert.ok(secondLine.every((cell) => Math.abs(cell.top - secondLine[0].top) <= 1), 'Role and Actions must share the second visual row');
  assert.ok(secondLine[0].top >= firstLine[0].bottom - 1, 'the record must contain only the two approved visual grid rows');
  assert.ok(Math.abs(secondLine[0].centerY - secondLine[1].centerY) <= 2, 'Role and Actions centers must differ by at most 2px');
  assert.equal(comfortableLayout.rowBorderBottomWidth, '1px', 'the full record must own its continuous separator');
  assert.ok(comfortableLayout.cells.every((cell) => cell.borderBottomWidth === '0px'), 'record cells must not break the full-row separator');

  await page.locator('#appLanguageSelect').selectOption('en');
  await page.waitForFunction(() => document.body.classList.contains('is-lang-en'));
  const comfortableEnglish = await page.evaluate(() => {
    const wrap = document.querySelector('.applications-view .table-wrap');
    const candidateHeader = document.querySelector('.applications-view thead th:nth-child(8)');
    const box = candidateHeader.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(candidateHeader);
    const textFragments = [...range.getClientRects()]
      .filter((value) => value.width > 0 && value.height > 0)
      .map((value) => ({ left: value.left, right: value.right }));
    return {
      wrapClientWidth: wrap.clientWidth,
      wrapScrollWidth: wrap.scrollWidth,
      candidateBox: { left: box.left, right: box.right },
      textFragments,
    };
  });
  assert.ok(
    comfortableEnglish.wrapScrollWidth <= comfortableEnglish.wrapClientWidth,
    'the 898px English comfortable table must not have internal horizontal overflow',
  );
  assert.ok(
    comfortableEnglish.textFragments.every((fragment) => (
      fragment.left >= comfortableEnglish.candidateBox.left - 0.5
      && fragment.right <= comfortableEnglish.candidateBox.right + 0.5
    )),
    'the 898px English Candidate Home header text must stay inside its own cell',
  );

  for (const language of ['zh', 'en']) {
    await page.locator('#appLanguageSelect').selectOption(language);
    await page.waitForFunction((value) => document.body.classList.contains(`is-lang-${value}`), language);
    for (const width of [1025, 1200]) {
      await page.setViewportSize({ width, height: 900 });
      const desktopLayout = await page.evaluate(() => {
      const wrap = document.querySelector('.applications-view .table-wrap');
      const table = document.querySelector('.applications-view .table-wrap table');
      const headers = [...table.tHead.rows[0].cells];
      const firstRowCells = [...document.querySelector('#applicationRows tr:not(.group-row)').cells];
      const rect = (node) => {
        const value = node.getBoundingClientRect();
        return { left: value.left, right: value.right, width: value.width };
      };
      const textRects = (node) => {
        const range = document.createRange();
        range.selectNodeContents(node);
        return [...range.getClientRects()]
          .filter((value) => value.width > 0 && value.height > 0)
          .map((value) => ({ left: value.left, right: value.right, width: value.width }));
      };
      const candidateHomeLink = firstRowCells[7].querySelector('a');
      const actionButtons = [...firstRowCells[8].querySelectorAll('button')];
      return {
        clientWidth: document.documentElement.clientWidth,
        documentScrollWidth: document.documentElement.scrollWidth,
        wrapClientWidth: wrap.clientWidth,
        wrapScrollWidth: wrap.scrollWidth,
        tableScrollWidth: table.scrollWidth,
        wrap: rect(wrap),
        table: rect(table),
        headers: headers.map((header) => ({ box: rect(header), text: textRects(header) })),
        firstRowCells: firstRowCells.map(rect),
        candidateHomeLink: candidateHomeLink
          ? { box: rect(candidateHomeLink), text: textRects(candidateHomeLink) }
          : null,
        actionButtons: actionButtons.map((button) => ({ box: rect(button), text: textRects(button) })),
        candidateHomeText: headers[7].textContent.trim().toUpperCase(),
        actionsText: headers[8].textContent.trim().toUpperCase(),
      };
    });
      const label = `${language} ${width}px`;
      const isWithinWrap = (box) => box.left >= desktopLayout.wrap.left - 0.5 && box.right <= desktopLayout.wrap.right + 0.5;
      assert.ok(isWithinWrap(desktopLayout.table), `the ${label} table must fit within the visible Applications wrap`);
      assert.ok(desktopLayout.headers.every(({ box }) => isWithinWrap(box)), `all nine ${label} headers must be visible inside the Applications wrap`);
      assert.ok(desktopLayout.firstRowCells.every(isWithinWrap), `all nine ${label} first-row cells must be visible inside the Applications wrap`);
      if (language === 'en') {
        assert.equal(desktopLayout.candidateHomeText, 'CANDIDATE HOME', `the complete ${width}px Candidate Home header must remain visible`);
        assert.equal(desktopLayout.actionsText, 'ACTIONS', `the ${width}px Actions header must remain in the initial visible view`);
      }
    const isWithin = (inner, outer) => inner.left >= outer.left - 0.5 && inner.right <= outer.right + 0.5;
    assert.ok(
      desktopLayout.headers.every(({ box, text }) => text.every((fragment) => isWithin(fragment, box))),
      `every ${label} header text fragment must stay inside its own header cell`,
    );
      assert.ok(desktopLayout.candidateHomeLink, `the ${label} Candidate Home link must exist`);
    assert.ok(
      desktopLayout.candidateHomeLink.text.every((fragment) => isWithin(fragment, desktopLayout.candidateHomeLink.box)),
      `the ${label} Candidate Home link text must stay inside its link box`,
    );
      assert.equal(desktopLayout.actionButtons.length, 2, `the ${label} row must expose both action buttons`);
    assert.ok(
      desktopLayout.actionButtons.every(({ box }) => isWithin(box, desktopLayout.firstRowCells[8])),
      `both ${label} action buttons must stay inside the Actions cell`,
    );
    assert.ok(
      desktopLayout.actionButtons.every(({ box, text }) => text.every((fragment) => isWithin(fragment, box))),
      `both ${label} action labels must stay inside their own buttons`,
    );
      assert.ok(desktopLayout.wrapScrollWidth <= desktopLayout.wrapClientWidth, `the ${label} Applications wrap must not have internal horizontal overflow`);
      assert.ok(desktopLayout.tableScrollWidth <= desktopLayout.wrapClientWidth, `the ${label} nine-column table must not exceed the visible wrap width`);
      assert.equal(desktopLayout.documentScrollWidth, desktopLayout.clientWidth, `the ${label} document must not have horizontal overflow`);
    }
  }
  for (const language of ['zh', 'en']) {
    await page.setViewportSize({ width: 481, height: 994 });
    await page.locator('#appLanguageSelect').selectOption(language);
    await page.waitForFunction((value) => document.body.classList.contains(`is-lang-${value}`), language);
    await page.evaluate(() => {
      document.body.style.minHeight = '2200px';
      window.scrollTo(0, 0);
    });
    const phoneRail = await page.evaluate(() => {
      const addButton = document.querySelector('#addApplicationButton').getBoundingClientRect();
      const rail = document.querySelector('.applications-view .alphabet-index').getBoundingClientRect();
      const table = document.querySelector('.applications-view .table-wrap').getBoundingClientRect();
      return {
        viewportWidth: innerWidth,
        add: { left: addButton.left, right: addButton.right, top: addButton.top, bottom: addButton.bottom },
        rail: { left: rail.left, right: rail.right, top: rail.top, bottom: rail.bottom },
        table: { left: table.left, right: table.right, top: table.top, bottom: table.bottom },
        position: getComputedStyle(document.querySelector('.applications-view .alphabet-index')).position,
      };
    });
    const overlapX = Math.max(0, Math.min(phoneRail.add.right, phoneRail.rail.right) - Math.max(phoneRail.add.left, phoneRail.rail.left));
    const overlapY = Math.max(0, Math.min(phoneRail.add.bottom, phoneRail.rail.bottom) - Math.max(phoneRail.add.top, phoneRail.rail.top));
    assert.ok(
      overlapX === 0 || overlapY === 0,
      `the ${language} 481px alphabet rail must not overlap Add Application: ${JSON.stringify({ add: phoneRail.add, rail: phoneRail.rail, overlapX, overlapY })}`,
    );
    assert.equal(phoneRail.position, 'fixed', `the ${language} 481px alphabet rail must stay fixed to the mobile viewport`);
    assert.ok(phoneRail.rail.left >= phoneRail.table.right - 0.5, `the ${language} 481px alphabet rail must not cover the table`);
    assert.ok(phoneRail.rail.right <= phoneRail.viewportWidth + 0.5, `the ${language} 481px alphabet rail must remain inside the mobile viewport`);

    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForFunction(() => window.scrollY >= 599);
    const scrolledRail = await page.evaluate(() => {
      const rail = document.querySelector('.applications-view .alphabet-index').getBoundingClientRect();
      return { left: rail.left, top: rail.top };
    });
    assert.ok(Math.abs(scrolledRail.left - phoneRail.rail.left) <= 1, `the ${language} 481px alphabet rail must not move horizontally while the page scrolls`);
    assert.ok(Math.abs(scrolledRail.top - phoneRail.rail.top) <= 1, `the ${language} 481px alphabet rail must not move vertically while the page scrolls`);

    await page.setViewportSize({ width: 481, height: 744 });
    await page.evaluate(() => window.scrollTo(0, 0));
    const shortRailBeforeScroll = await page.evaluate(() => {
      const rail = document.querySelector('.applications-view .alphabet-index').getBoundingClientRect();
      return { left: rail.left, top: rail.top, bottom: rail.bottom, viewportHeight: innerHeight };
    });
    assert.ok(shortRailBeforeScroll.top >= 0 && shortRailBeforeScroll.bottom <= shortRailBeforeScroll.viewportHeight, `the ${language} short-phone alphabet rail must fit inside the viewport`);
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForFunction(() => window.scrollY >= 599);
    const shortRailAfterScroll = await page.evaluate(() => {
      const rail = document.querySelector('.applications-view .alphabet-index').getBoundingClientRect();
      return { left: rail.left, top: rail.top };
    });
    assert.ok(Math.abs(shortRailAfterScroll.left - shortRailBeforeScroll.left) <= 1, `the ${language} short-phone alphabet rail must keep its horizontal viewport position while scrolling`);
    assert.ok(Math.abs(shortRailAfterScroll.top - shortRailBeforeScroll.top) <= 1, `the ${language} short-phone alphabet rail must keep its vertical viewport position while scrolling`);

    await page.setViewportSize({ width: 751, height: 881 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.applications-view .alphabet-index')).getPropertyValue('--alphabet-index-top').trim() !== '');
    const halfScreenRailBeforeScroll = await page.evaluate(() => {
      const railElement = document.querySelector('.applications-view .alphabet-index');
      const rail = railElement.getBoundingClientRect();
      const addButton = document.querySelector('#addApplicationButton').getBoundingClientRect();
      const panel = document.querySelector('.applications-view .panel').getBoundingClientRect();
      return {
        left: rail.left,
        right: rail.right,
        top: rail.top,
        bottom: rail.bottom,
        addButtonRight: addButton.right,
        panelRight: panel.right,
        panelTop: panel.top,
        viewportWidth: innerWidth,
        viewportHeight: innerHeight,
        position: getComputedStyle(railElement).position,
        clientHeight: railElement.clientHeight,
        scrollHeight: railElement.scrollHeight,
        measuredTop: getComputedStyle(railElement).getPropertyValue('--alphabet-index-top'),
      };
    });
    assert.equal(halfScreenRailBeforeScroll.position, 'fixed', `the ${language} 751px alphabet rail must stay fixed to the viewport`);
    assert.ok(Math.abs(halfScreenRailBeforeScroll.addButtonRight - halfScreenRailBeforeScroll.panelRight) <= 1, `the ${language} 751px Add Application button and Applications panel must share one right edge`);
    assert.ok(halfScreenRailBeforeScroll.left >= halfScreenRailBeforeScroll.addButtonRight - 0.5, `the ${language} 751px alphabet rail must not cover the Add Application button`);
    assert.ok(halfScreenRailBeforeScroll.left >= 0 && halfScreenRailBeforeScroll.right <= halfScreenRailBeforeScroll.viewportWidth, `the ${language} 751px alphabet rail must stay inside the right edge of the viewport`);
    assert.ok(halfScreenRailBeforeScroll.top >= 0 && halfScreenRailBeforeScroll.bottom <= halfScreenRailBeforeScroll.viewportHeight, `the ${language} 751px alphabet rail must fit completely inside the viewport`);
    assert.ok(halfScreenRailBeforeScroll.scrollHeight <= halfScreenRailBeforeScroll.clientHeight, `the ${language} 751px alphabet rail must show every letter without its own scrollbar`);
    assert.ok(Math.abs(halfScreenRailBeforeScroll.top - halfScreenRailBeforeScroll.panelTop) <= 1, `the ${language} 751px alphabet rail top must align with the Applications panel top: ${JSON.stringify(halfScreenRailBeforeScroll)}`);
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForFunction(() => window.scrollY >= 599);
    const halfScreenRailAfterScroll = await page.evaluate(() => {
      const rail = document.querySelector('.applications-view .alphabet-index').getBoundingClientRect();
      return { left: rail.left, top: rail.top };
    });
    assert.ok(Math.abs(halfScreenRailAfterScroll.left - halfScreenRailBeforeScroll.left) <= 1, `the ${language} 751px alphabet rail must not move horizontally while the page scrolls`);
    assert.ok(Math.abs(halfScreenRailAfterScroll.top - halfScreenRailBeforeScroll.top) <= 1, `the ${language} 751px alphabet rail must not move vertically while the page scrolls`);
  }
  assert.ok(requests.every((url) => url.startsWith(origin)), 'the responsive layout test must abort every non-local request');

  console.log('responsive Applications layout behavior tests passed');
} finally {
  try {
    if (browser) await browser.close();
  } finally {
    if (server?.listening) await new Promise((resolveServer, rejectServer) => server.close((error) => (error ? rejectServer(error) : resolveServer())));
  }
}

async function selectApplicationHtml() {
  const indexHtml = await readHtmlIfPresent('index.html');
  if (indexHtml?.includes('id="applicationRows"')) return 'index.html';
  const productionHtml = await readHtmlIfPresent('job-tracker.html');
  assert.ok(productionHtml, 'missing selected application HTML: expected index.html or job-tracker.html');
  assert.match(productionHtml, /id="applicationRows"/, 'selected job-tracker.html must contain the Applications table');
  return 'job-tracker.html';
}

async function readHtmlIfPresent(fileName) {
  try {
    return await readFile(join(root, fileName), 'utf8');
  } catch {
    return null;
  }
}
