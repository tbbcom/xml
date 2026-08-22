# Contributing

Thank you for improving the The Bukit Besi Blogger template.

## Scope

This repository is exclusively for `thebukitbesi.com`. Do not add assets, credentials, APIs, manifests, service workers, branding or runtime dependencies from another website.

## Before changing code

1. Start from the latest target branch.
2. Create a focused feature branch.
3. Back up the live Blogger theme before any manual preview or publication.
4. Keep `asset/xml/thebukitbesi.xml` as the single production source.
5. Never commit credentials or private Blogger identifiers.

## Development rules

- use semantic Blogger XML and HTML
- use modern CSS and vanilla JavaScript
- do not add jQuery or a runtime UI framework
- prefer native browser APIs and inline SVG
- preserve keyboard access, visible focus and appropriate ARIA behavior
- keep critical content available without a JavaScript-only feed
- avoid layout shifts and heavy synchronous interaction handlers
- do not add unverified structured-data claims

## Required checks

```bash
npm ci
npm test
npm run validate
```

For template changes, manually test:

- homepage and label/category grids
- native search and empty/error states
- featured, related and popular thumbnails
- homepage, post and static-page H1 behavior
- canonical, robots and JSON-LD in rendered HTML
- mobile navigation, tap targets and horizontal overflow
- representative LCP, CLS and INP behavior

## Pull requests

Keep a pull request narrow enough to review safely. Its description should include:

- problem and root cause
- affected files
- user-visible impact
- screenshots for visual changes
- commands and manual views tested
- SEO, accessibility and CWV risks
- rollback approach

Do not mark a Blogger template pull request ready until Blogger import/preview testing is complete. Passing repository tests alone is insufficient.

## Commit style

Use short imperative messages with a useful scope, for example:

```text
fix(search): preserve thumbnail fallback
perf(images): reserve listing dimensions
docs: clarify Blogger release checks
```

## Deployment boundary

Merging does not deploy the theme. Production publication is a separate, manual Blogger action after backup, review and live smoke testing.
