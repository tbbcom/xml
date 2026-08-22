'use strict';

const fs = require('fs');
const path = require('path');

const URLS = (process.env.AUDIT_URLS || 'https://www.thebukitbesi.com/')
  .split(',').map((value) => value.trim()).filter(Boolean);
const OUT_DIR = path.resolve(process.env.LIVE_AUDIT_OUTPUT_DIR || 'reports/live-jsonld-audit');
const ALLOWED_HOSTS = new Set(['thebukitbesi.com', 'www.thebukitbesi.com']);

function decodeEntities(value) {
  return String(value || '')
    .replace(/&quot;/g, '"').replace(/&#34;/g, '"')
    .replace(/&apos;/g, "'").replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

function assertAllowedUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || !ALLOWED_HOSTS.has(url.hostname)) {
    throw new Error(`Refusing non-TBB URL: ${value}`);
  }
  return url;
}

function inspectHtml(html) {
  const source = String(html || '');
  const jsonLdOpenings = [...source.matchAll(/<script\b[^>]*type\s*=\s*['"]application\/ld\+json['"][^>]*>/gi)];
  const allScriptOpenings = (source.match(/<script\b/gi) || []).length;
  const allScriptClosings = (source.match(/<\/script\s*>/gi) || []).length;
  const blocks = [];
  const re = /<script\b[^>]*type\s*=\s*['"]application\/ld\+json['"][^>]*>([\s\S]*?)<\/script\s*>/gi;
  let match;
  while ((match = re.exec(source))) {
    const raw = decodeEntities(match[1]).trim();
    try {
      const parsed = JSON.parse(raw);
      blocks.push({ valid: true, type: parsed && parsed['@type'] || null, rawLength: raw.length });
    } catch (error) {
      blocks.push({ valid: false, error: error.message, rawPreview: raw.slice(0, 1000) });
    }
  }
  return {
    jsonLdOpeningCount: jsonLdOpenings.length,
    jsonLdClosedBlockCount: blocks.length,
    unterminatedJsonLdCount: Math.max(0, jsonLdOpenings.length - blocks.length),
    allScriptOpenings,
    allScriptClosings,
    scriptTagImbalance: allScriptOpenings - allScriptClosings,
    invalidJsonLdCount: blocks.filter((block) => !block.valid).length,
    blocks
  };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const results = [];
  for (const value of URLS) {
    const urlObject = assertAllowedUrl(value);
    const url = urlObject.href;
    const response = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TheBukitBesiSchemaAudit/1.0)' }
    });
    const finalUrl = new URL(response.url);
    if (!ALLOWED_HOSTS.has(finalUrl.hostname)) {
      throw new Error(`Refusing redirect outside TBB: ${response.url}`);
    }
    const html = await response.text();
    const report = {
      url,
      finalUrl: response.url,
      status: response.status,
      contentType: response.headers.get('content-type') || '',
      fetchedAt: new Date().toISOString(),
      ...inspectHtml(html)
    };
    results.push(report);
    const slug = urlObject.pathname.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home';
    fs.writeFileSync(path.join(OUT_DIR, `${slug}.html`), html);
  }
  fs.writeFileSync(path.join(OUT_DIR, 'report.json'), JSON.stringify({ results }, null, 2));
  const failed = results.some((item) => item.unterminatedJsonLdCount || item.scriptTagImbalance || item.invalidJsonLdCount);
  console.log(JSON.stringify(results, null, 2));
  if (failed) process.exitCode = 2;
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}

module.exports = { inspectHtml, decodeEntities, assertAllowedUrl };
