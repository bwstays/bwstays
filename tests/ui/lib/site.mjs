// Shared helpers for the UI tests: the deployed file list, URL -> file mapping, a local copy of the
// site served under https://www.bwstays.com (so absolute links work), and Chrome start-up.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
export const SITE = 'https://www.bwstays.com';
const SITE_HOSTS = new Set(['www.bwstays.com', 'bwstays.com']);

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'application/javascript; charset=utf-8', '.mjs': 'application/javascript',
  '.json': 'application/json', '.map': 'application/json', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.xsl': 'application/xml',
  '.kml': 'application/vnd.google-earth.kml+xml', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.pdf': 'application/pdf', '.webmanifest': 'application/manifest+json', '.mp4': 'video/mp4', '.webm': 'video/webm',
};

/**
 * The files GitHub Pages publishes: the files tracked by git (an untracked local file is not live).
 * Paths are case-sensitive, as on GitHub Pages; Windows would otherwise hide a wrong-case link.
 */
export function deployedFiles() {
  try {
    const out = execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    return new Set(out.split('\0').filter(Boolean));
  } catch {
    const all = new Set();
    const walk = (d) => { for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) { const p = d ? `${d}/${e.name}` : e.name; if (e.name.startsWith('.git') || e.name === 'node_modules') continue; if (e.isDirectory()) walk(p); else all.add(p); } };
    walk('');
    return all;
  }
}

export const isSiteUrl = (u) => { try { return SITE_HOSTS.has(new URL(u).hostname); } catch { return false; } };

/** Site URL -> repository file the way GitHub Pages resolves it, or null (404). */
export function fileFor(url, files) {
  let p;
  try { p = decodeURIComponent(new URL(url).pathname); } catch { return null; }
  p = p.replace(/^\/+/, '');
  if (p === '' || p.endsWith('/')) p += 'index.html';
  if (files.has(p)) return p;
  if (files.has(`${p}.html`)) return `${p}.html`; // GitHub Pages serves /page as page.html
  if (files.has(`${p}/index.html`)) return `${p}/index.html`;
  return null;
}

/** Path of the page without its hash/query, for de-duplicating link targets. */
export const pageKey = (url) => { const u = new URL(url); return `${u.origin}${u.pathname}`; };

/** Start Chrome through playwright-core (PLAYWRIGHT_CORE / CHROME_PATH as for scripts/prerender.mjs). */
export async function launchChrome() {
  let pw;
  try { pw = await import(process.env.PLAYWRIGHT_CORE ? pathToFileURL(process.env.PLAYWRIGHT_CORE).href : 'playwright-core'); }
  catch (e) {
    console.error(process.env.PLAYWRIGHT_CORE
      ? `playwright-core could not be loaded from PLAYWRIGHT_CORE=${process.env.PLAYWRIGHT_CORE}\n  (${e.message.split('\n')[0]})`
      : `playwright-core is not installed in ${ROOT}\n  Run these two commands, then start the test again:\n    cd /d "${ROOT}"\n    npm install`);
    process.exit(2);
  }
  const chromium = pw.chromium ?? pw.default?.chromium;
  const candidates = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium-browser', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean);
  const executablePath = candidates.find((c) => fs.existsSync(c));
  const args = ['--disable-popup-blocking']; // links with target=_blank are clicked by script
  return chromium.launch(executablePath ? { executablePath, args } : { channel: 'chrome', args });
}

/**
 * Serve the repository for https://www.bwstays.com/* in this browser context. Other hosts are
 * blocked while pages load (fast, repeatable, nothing is sent to third parties).
 * hooks.onSiteMissing(url, request) is called for every site URL that would be a 404,
 * hooks.onBlocked(request) for every outside request that was not let through.
 * hooks.intercept(request) may return true to take over a request (used to catch link clicks).
 */
export async function serveSite(context, files, hooks = {}) {
  const notFound = files.has('404.html') ? fs.readFileSync(path.join(ROOT, '404.html')) : 'not found';
  await context.route('**/*', async (route) => {
    const req = route.request();
    const url = req.url();
    if (hooks.intercept && (await hooks.intercept(req, route))) return;
    if (!/^https?:/.test(url)) return route.continue();
    if (!isSiteUrl(url)) { hooks.onBlocked?.(req); return route.abort('blockedbyclient'); }
    const f = fileFor(url, files);
    if (!f) {
      hooks.onSiteMissing?.(url, req);
      return route.fulfill({ status: 404, body: notFound, contentType: 'text/html; charset=utf-8' });
    }
    return route.fulfill({ status: 200, body: fs.readFileSync(path.join(ROOT, f)), contentType: MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' });
  });
}

/** Run fn over items with at most n at a time. */
export async function pool(items, n, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i], i); }
  }));
  return out;
}
