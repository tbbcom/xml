'use strict';

const fs = require('fs');
const path = require('path');

const API_ROOT = 'https://www.googleapis.com/blogger/v3';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const ARTICLE_TYPES = new Set(['Article', 'BlogPosting', 'NewsArticle']);
const BLOG_ID = process.env.BLOGGER_BLOG_ID || '';
const BLOG_URL = process.env.BLOGGER_BLOG_URL || '';
const CLIENT_ID = process.env.BLOGGER_CLIENT_ID || '';
const CLIENT_SECRET = process.env.BLOGGER_CLIENT_SECRET || '';
const REFRESH_TOKEN = process.env.BLOGGER_REFRESH_TOKEN || '';
const OUT_DIR = path.resolve(process.env.CLEANUP_OUTPUT_DIR || 'reports/blogger-schema-cleanup');
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
  const args = { apply: false, max: 5, confirmBlogId: '', postIds: [] };
  for (const arg of argv.slice(2)) {
    if (arg === '--apply') args.apply = true;
    else if (arg.startsWith('--max=')) args.max = Number(arg.slice(6));
    else if (arg.startsWith('--confirm-blog-id=')) args.confirmBlogId = arg.slice(18);
    else if (arg.startsWith('--post-ids=')) args.postIds = arg.slice(11).split(',').map((v) => v.trim()).filter(Boolean);
  }
  if (!Number.isInteger(args.max) || args.max < 1 || args.max > 25) {
    throw new Error('--max must be an integer from 1 to 25');
  }
  return args;
}

function getTypes(node) {
  const type = node && node['@type'];
  return Array.isArray(type) ? type.map(String) : type ? [String(type)] : [];
}

function removeArticleNodes(value) {
  if (Array.isArray(value)) {
    if (value.length === 0) return [];
    const kept = value.map(removeArticleNodes).filter((item) => item !== undefined);
    return kept.length ? kept : undefined;
  }
  if (!value || typeof value !== 'object') return value;
  if (getTypes(value).some((type) => ARTICLE_TYPES.has(type))) return undefined;

  const output = {};
  for (const [key, child] of Object.entries(value)) {
    const cleaned = removeArticleNodes(child);
    if (cleaned !== undefined) output[key] = cleaned;
  }
  return Object.keys(output).length ? output : undefined;
}

function serializeJsonLd(value) {
  const json = JSON.stringify(value);
  let safe = '';
  for (const char of json) {
    if (char === '<') safe += '\\u003c';
    else if (char === '\u2028') safe += '\\u2028';
    else if (char === '\u2029') safe += '\\u2029';
    else safe += char;
  }
  if (JSON.stringify(JSON.parse(safe)) !== JSON.stringify(value)) {
    throw new Error('JSON-LD serialization verification failed');
  }
  return safe;
}

function cleanJsonLd(html) {
  const changes = [];
  const re = /(<script\b[^>]*type\s*=\s*['"]application\/ld\+json['"][^>]*>)([\s\S]*?)(<\/script>)/gi;
  const cleanedHtml = String(html || '').replace(re, (full, openTag, raw, closeTag) => {
    let parsed;
    try {
      parsed = JSON.parse(raw.trim());
    } catch {
      return full;
    }

    const cleaned = removeArticleNodes(parsed);
    if (cleaned === undefined) {
      changes.push({ action: 'remove-block', removedTypes: getTypes(parsed) });
      return '';
    }

    if (JSON.stringify(parsed) !== JSON.stringify(cleaned)) {
      const serialized = serializeJsonLd(cleaned);
      changes.push({
        action: 'replace-block',
        reason: 'mixed-schema-block',
        removedTypes: ['Article/BlogPosting/NewsArticle']
      });
      return `${openTag}${serialized}${closeTag}`;
    }

    return full;
  });

  return { cleanedHtml, changes };
}

async function request(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${await response.text()}`);
  return response.json();
}

async function getAccessToken() {
  for (const [name, value] of Object.entries({
    BLOGGER_CLIENT_ID: CLIENT_ID,
    BLOGGER_CLIENT_SECRET: CLIENT_SECRET,
    BLOGGER_REFRESH_TOKEN: REFRESH_TOKEN
  })) {
    if (!value) throw new Error(`${name} is required for OAuth access`);
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
  return token.access_token;
}

function assertPostTargetsTbb(post) {
  if (!post || !post.url) throw new Error('Blogger post is missing URL');
  assertTbbUrl(post.url, 'Blogger post URL');
  return post;
}

async function* listPosts(accessToken, postIds) {
  if (postIds.length) {
    const posts = await Promise.all(postIds.map((id) => request(
      `${API_ROOT}/blogs/${BLOG_ID}/posts/${id}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )));
    for (const post of posts) yield assertPostTargetsTbb(post);
    return;
  }

  let pageToken = '';
  do {
    const params = new URLSearchParams({ fetchBodies: 'true', status: 'live', maxResults: '500' });
    if (pageToken) params.set('pageToken', pageToken);
    const page = await request(`${API_ROOT}/blogs/${BLOG_ID}/posts?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    for (const post of (page.items || [])) yield assertPostTargetsTbb(post);
    pageToken = page.nextPageToken || '';
  } while (pageToken);
}

async function updatePost(accessToken, post, content) {
  assertPostTargetsTbb(post);
  const updated = await request(`${API_ROOT}/blogs/${BLOG_ID}/posts/${post.id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ content })
  });
  return assertPostTargetsTbb(updated);
}

function ensureApplySafety(args) {
  if (!BLOG_ID) throw new Error('BLOGGER_BLOG_ID is required');
  if (!BLOG_URL) throw new Error('BLOGGER_BLOG_URL is required');
  assertTbbUrl(BLOG_URL, 'BLOGGER_BLOG_URL');
  if (!args.apply) return;
  if (args.confirmBlogId !== BLOG_ID) {
    throw new Error('Apply blocked: --confirm-blog-id must exactly match BLOGGER_BLOG_ID');
  }
  if (args.max > 10) throw new Error('Apply is limited to 10 posts');
}

async function main() {
  const args = parseArgs(process.argv);
  ensureApplySafety(args);

  const token = await getAccessToken();
  const candidates = [];
  for await (const post of listPosts(token, args.postIds)) {
    const result = cleanJsonLd(post.content || '');
    const hasAutomaticChange = result.cleanedHtml !== (post.content || '');
    const hasReviewFinding = result.changes.length > 0;
    if (hasAutomaticChange || hasReviewFinding) {
      candidates.push({ post, result, hasAutomaticChange });
      if (candidates.length >= args.max) break;
    }
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const runDir = path.join(OUT_DIR, stamp);
  fs.mkdirSync(runDir, { recursive: true });
  const manifest = [];

  for (const { post, result, hasAutomaticChange } of candidates) {
    assertPostTargetsTbb(post);
    fs.writeFileSync(path.join(runDir, `${post.id}.before.html`), post.content || '');
    fs.writeFileSync(path.join(runDir, `${post.id}.after.html`), result.cleanedHtml);
    const item = {
      id: post.id,
      title: post.title,
      url: post.url,
      changes: result.changes,
      automaticChange: hasAutomaticChange,
      applied: false
    };
    if (args.apply && hasAutomaticChange) {
      await updatePost(token, post, result.cleanedHtml);
      item.applied = true;
    }
    manifest.push(item);
  }

  fs.writeFileSync(
    path.join(runDir, 'manifest.json'),
    JSON.stringify({
      mode: args.apply ? 'apply' : 'dry-run',
      blogId: BLOG_ID,
      blogUrl: BLOG_URL,
      generatedAt: new Date().toISOString(),
      posts: manifest
    }, null, 2)
  );

  console.log(`${args.apply ? 'Applied' : 'Dry-run generated for'} ${manifest.length} TBB posts. Output: ${runDir}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { parseArgs, getTypes, removeArticleNodes, serializeJsonLd, cleanJsonLd, ensureApplySafety, assertTbbUrl, assertPostTargetsTbb };
