# The Bukit Besi — Blogger API Audit Setup

This repository includes a read-only audit for JSON-LD, duplicate schema signals, broken TOC shortcodes and post-level SEO hygiene on **thebukitbesi.com**.

## Read-only audit

The audit:

- reads published posts through Blogger API v3;
- detects Article-family and supporting JSON-LD types;
- flags invalid JSON-LD, duplicated schema types, post-body H1 tags, missing image alt text and unprocessed TOC shortcodes;
- writes reports under `reports/blogger-schema-audit/`;
- does not send Blogger write requests.

## GitHub secrets

Use the TBB-specific namespace only:

- `TBB_BLOGGER_API_KEY`
- `TBB_BLOGGER_BLOG_ID`
- `TBB_BLOGGER_BLOG_URL`

`TBB_BLOGGER_BLOG_URL` must be the canonical TBB hostname. The workflow and audit script refuse non-TBB targets.

## Local run

The scripts consume generic environment-variable names internally, so map your local TBB values explicitly:

```bash
BLOGGER_API_KEY="your-tbb-key" \
BLOGGER_BLOG_ID="your-tbb-blog-id" \
BLOGGER_BLOG_URL="https://www.thebukitbesi.com/" \
npm run audit:blogger
```

Optional test limit:

```bash
BLOGGER_MAX_RESULTS=20 npm run audit:blogger
```

## Safety

Do not use audit findings as permission for bulk editing. Review affected URLs, compare body schema with the rendered template, and validate representative posts before any cleanup operation.
