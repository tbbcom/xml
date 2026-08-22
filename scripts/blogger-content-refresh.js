'use strict';

const fs = require('fs');
const path = require('path');

const API_ROOT = 'https://www.googleapis.com/blogger/v3';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const BLOG_ID = process.env.BLOGGER_BLOG_ID || '';
const BLOG_URL = process.env.BLOGGER_BLOG_URL || '';
const CLIENT_ID = process.env.BLOGGER_CLIENT_ID || '';
const CLIENT_SECRET = process.env.BLOGGER_CLIENT_SECRET || '';
const REFRESH_TOKEN = process.env.BLOGGER_REFRESH_TOKEN || '';
const OUT_DIR = path.resolve(process.env.REFRESH_OUTPUT_DIR || 'reports/blogger-content-refresh');
const ALLOWED_HOSTS = new Set(['thebukitbesi.com', 'www.thebukitbesi.com']);

function assertTbbUrl(value, label = 'URL') {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} is invalid: ${value}`);
  }
  if (url.protocol !== 'https:' || !ALLOWED_HOSTS.has(url.hostname)) {
    throw new Error(`${label} must target thebukitbesi.com, received: ${value}`);
  }
  return url;
}

function parseArgs(argv) {
  const args = { apply: false, manifest: 'content-refresh/manifest.json', confirmBlogId: '', max: 1 };
  for (const arg of argv.slice(2)) {
    if (arg === '--apply') args.apply = true;
    else if (arg.startsWith('--manifest=')) args.manifest = arg.slice(11);
    else if (arg.startsWith('--confirm-blog-id=')) args.confirmBlogId = arg.slice(18);
    else if (arg.startsWith('--max=')) args.max = Number(arg.slice(6));
  }
  if (!Number.isInteger(args.max) || args.max < 1 || args.max > 5) {
    throw new Error('--max must be an integer from 1 to 5');
  }
  return args;
}

async function request(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${text}`);
  return text ? JSON.parse(text) : {};
}

async function getAccessToken() {
  const required = {
    BLOGGER_CLIENT_ID: CLIENT_ID,
    BLOGGER_CLIENT_SECRET: CLIENT_SECRET,
    BLOGGER_REFRESH_TOKEN: REFRESH_TOKEN
  };
  for (const [name, value] of Object.entries(required)) {
    if (!value) throw new Error(`${name} is required`);
  }
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: REFRESH_TOKEN,
    grant_type: 'refresh_token'
  });
  const token = await request(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  if (!token.access_token) throw new Error('OAuth token response did not include access_token');
  return token.access_token;
}

function normalizeUrl(value) {
  try {
    const url = new URL(value);
    url.hash = '';
    url.search = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return String(value || '').replace(/\/$/, '');
  }
}

function validateHtml(html) {
  const findings = [];
  if (!html || html.trim().length < 500) findings.push('content-too-short');
  if (/<h1\b/i.test(html)) findings.push('h1-inside-post-body');
  if (/\{getToc\}|\{toc\}/i.test(html)) findings.push('unprocessed-toc-shortcode');
  const openScripts = (html.match(/<script\b/gi) || []).length;
  const closeScripts = (html.match(/<\/script>/gi) || []).length;
  if (openScripts !== closeScripts) findings.push('script-tag-imbalance');
  return findings;
}

function ensureApplySafety(args) {
  if (!BLOG_ID) throw new Error('BLOGGER_BLOG_ID is required');
  if (!BLOG_URL) throw new Error('BLOGGER_BLOG_URL is required');
  assertTbbUrl(BLOG_URL, 'BLOGGER_BLOG_URL');
  if (!args.apply) return;
  if (args.confirmBlogId !== BLOG_ID) {
    throw new Error('Apply blocked: --confirm-blog-id must exactly match BLOGGER_BLOG_ID');
  }
  if (args.max > 5) throw new Error('Apply is limited to 5 posts');
}

async function findPost(accessToken, item) {
  assertTbbUrl(item.url, 'Manifest post URL');
  if (item.postId) {
    const post = await request(`${API_ROOT}/blogs/${BLOG_ID}/posts/${item.postId}?fetchBody=true`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    assertTbbUrl(post.url, 'Resolved Blogger post URL');
    return post;
  }
  const expected = normalizeUrl(item.url);
  let pageToken = '';
  do {
    const params = new URLSearchParams({ fetchBodies: 'true', status: 'live', maxResults: '500' });
    if (pageToken) params.set('pageToken', pageToken);
    const page = await request(`${API_ROOT}/blogs/${BLOG_ID}/posts?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const found = (page.items || []).find((post) => normalizeUrl(post.url) === expected);
    if (found) {
      assertTbbUrl(found.url, 'Resolved Blogger post URL');
      return found;
    }
    pageToken = page.nextPageToken || '';
  } while (pageToken);
  throw new Error(`Post not found for URL: ${item.url}`);
}

async function patchPost(accessToken, postId, payload) {
  return request(`${API_ROOT}/blogs/${BLOG_ID}/posts/${postId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

async function main() {
  const args = parseArgs(process.argv);
  ensureApplySafety(args);
  const manifestPath = path.resolve(args.manifest);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const items = Array.isArray(manifest.posts) ? manifest.posts.slice(0, args.max) : [];
  if (!items.length) throw new Error('Manifest has no posts');
  for (const item of items) assertTbbUrl(item.url, 'Manifest post URL');

  const token = await getAccessToken();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const runDir = path.join(OUT_DIR, stamp);
  fs.mkdirSync(runDir, { recursive: true });
  const results = [];

  for (const item of items) {
    const post = await findPost(token, item);
    const expectedUrl = normalizeUrl(item.url);
    if (normalizeUrl(post.url) !== expectedUrl) throw new Error(`URL mismatch for post ${post.id}`);
    if (item.expectedCurrentTitle && post.title !== item.expectedCurrentTitle) {
      throw new Error(`Title mismatch for ${post.url}. Expected: ${item.expectedCurrentTitle}. Found: ${post.title}`);
    }

    const contentPath = path.resolve(path.dirname(manifestPath), item.contentFile);
    const newContent = fs.readFileSync(contentPath, 'utf8').trim();
    const findings = validateHtml(newContent);
    if (findings.length) throw new Error(`Validation failed for ${item.url}: ${findings.join(', ')}`);

    const payload = { title: item.newTitle, content: newContent };
    if (Array.isArray(item.labels) && item.labels.length) payload.labels = item.labels;

    fs.writeFileSync(path.join(runDir, `${post.id}.before.html`), post.content || '');
    fs.writeFileSync(path.join(runDir, `${post.id}.after.html`), newContent);
    fs.writeFileSync(path.join(runDir, `${post.id}.payload.json`), JSON.stringify(payload, null, 2));

    const result = {
      id: post.id,
      url: post.url,
      oldTitle: post.title,
      newTitle: item.newTitle,
      oldBytes: Buffer.byteLength(post.content || ''),
      newBytes: Buffer.byteLength(newContent),
      searchDescription: item.searchDescription || '',
      searchDescriptionNote: 'Blogger Posts API v3 does not expose a per-post search-description field; set this manually in Blogger editor.',
      applied: false
    };

    if (args.apply) {
      const updated = await patchPost(token, post.id, payload);
      assertTbbUrl(updated.url, 'Updated Blogger post URL');
      result.applied = true;
      result.updatedTitle = updated.title;
      result.updatedUrl = updated.url;
    }
    results.push(result);
  }

  fs.writeFileSync(path.join(runDir, 'manifest.json'), JSON.stringify({
    mode: args.apply ? 'apply' : 'dry-run',
    blogId: BLOG_ID,
    blogUrl: BLOG_URL,
    generatedAt: new Date().toISOString(),
    posts: results
  }, null, 2));
  console.log(`${args.apply ? 'Applied' : 'Dry-run generated for'} ${results.length} TBB post(s). Output: ${runDir}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { parseArgs, normalizeUrl, validateHtml, ensureApplySafety, assertTbbUrl };
