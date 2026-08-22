# Setup and validation

This guide covers local validation and safe manual preview of the The Bukit Besi Blogger template.

## Requirements

- Node.js 18 or newer
- npm
- Git
- access to `tbbcom/xml`
- access to a Blogger test blog or Theme preview for render verification

## Install

```bash
git clone https://github.com/tbbcom/xml.git
cd xml
npm ci
```

Production template:

```text
asset/xml/thebukitbesi.xml
```

## Validate locally

Run both checks after every template or validator change:

```bash
npm test
npm run validate
```

Useful scripts:

| Command | Purpose |
|---|---|
| `npm test` | Run regression tests |
| `npm run validate` | Validate the production XML |
| `npm run lint` | Alias for XML validation |
| `npm run audit:blogger` | Read-only Blogger schema/content audit |
| `npm run cleanup:blogger:dry-run` | Preview a guarded schema cleanup |

Do not run an apply operation until its dry-run output and backups have been reviewed.

## Feature-branch workflow

```bash
git switch -c fix/short-description
npm test
npm run validate
```

Keep commits focused. Do not combine unrelated visual redesigns, schema changes and maintenance-script changes in one review unless they are inseparable.

## Blogger import and preview

1. Download a backup of the current live theme from Blogger.
2. Use a test blog when possible.
3. Import `asset/xml/thebukitbesi.xml`.
4. Confirm Blogger accepts and saves the XML without silently removing required markup.
5. Test the rendered output—not only the repository source.

Never use an Ilmu Alam or unrelated website as the preview/deployment target.

## Render verification matrix

| View | Minimum checks |
|---|---|
| Homepage | hero/H1, grid, thumbnails, pagination, header, footer |
| Single post | one H1, post image/LCP, author/date, schema, related posts |
| Static page | title hierarchy, content width, navigation |
| Label/archive | robots policy, grid, pagination, responsive layout |
| Search | query submission, results, empty state, keyboard/focus behavior |
| Error page | noindex behavior, recovery navigation |
| Mobile | menu, tap targets, overflow, image sizing, sticky UI |
| Desktop | container widths, multi-column grids, header and CLS |

## SEO and structured-data checks

Verify rendered HTML for:

- one canonical supplied through Blogger `all-head-content`
- `noindex, follow` only on intended error/search/archive views
- one correct page-level H1
- one Article-family entity on single posts
- no duplicated Organization, WebSite or WebPage entities
- accurate URL, headline, image, author and date values
- no invented social handles, publisher logo or organization facts

Use Google's Rich Results Test for supported types and a general JSON-LD validator for the complete graph.

## Core Web Vitals checks

Test at least the homepage and a representative image-heavy post.

- LCP: likely hero/post image is discoverable early and not lazy-loaded
- CLS: images, embeds and ad candidates have reserved dimensions
- INP: search/menu/share interactions avoid heavy synchronous work
- mobile: test on a throttled mid-range profile, not desktop alone

Repository tests are guardrails; they do not replace live Blogger render and field-data verification.

## Blogger API credentials

Use only repository secrets prefixed with `TBB_BLOGGER_`. Required values depend on the selected workflow and may include:

- `TBB_BLOGGER_BLOG_URL`
- `TBB_BLOGGER_BLOG_ID`
- `TBB_BLOGGER_API_KEY`
- `TBB_BLOGGER_CLIENT_ID`
- `TBB_BLOGGER_CLIENT_SECRET`
- `TBB_BLOGGER_REFRESH_TOKEN`

The URL must be the verified The Bukit Besi hostname. Never place credentials or private IDs in commits, issues, logs or screenshots.

## Deployment

There is no automatic theme deployment. After all checks pass:

1. retain the live-theme backup;
2. publish manually in Blogger;
3. smoke-test the live site;
4. monitor Search Console and CWV trends;
5. roll back using the backup if a material regression appears.
