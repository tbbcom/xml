# The Bukit Besi Blogger Template

Source code, validation tools and guarded maintenance workflows for [thebukitbesi.com](https://www.thebukitbesi.com/).

> This repository is exclusively for The Bukit Besi. It does not contain or deploy assets for Ilmu Alam or any other website.

## Production source

```text
asset/xml/thebukitbesi.xml
```

This file is the single source of truth for the Blogger theme. Repository changes do not deploy automatically to Blogger.

## Design and engineering goals

- mobile-first Malaysian editorial experience
- semantic Blogger XML and HTML
- strong Search and Google News foundations
- one clear page-level H1
- valid, non-duplicated structured data
- responsive image and thumbnail handling
- accessible navigation, search and controls
- excellent LCP, CLS and INP
- low-dependency, maintainable code

## Technology

- Blogger XML
- semantic HTML
- modern CSS and custom properties
- vanilla JavaScript
- native browser APIs
- inline SVG
- Node.js validation and regression tests

The production template intentionally excludes jQuery, runtime CSS frameworks, external icon libraries, inherited advertising runtimes and cross-site PWA dependencies.

## Repository map

| Path | Purpose |
|---|---|
| `asset/xml/thebukitbesi.xml` | Production Blogger template |
| `scripts/xml-lint.js` | XML and template validation |
| `scripts/blogger-*.js` | Guarded Blogger audit/maintenance tools |
| `tests/` | Regression tests |
| `.github/workflows/` | Validation and manual maintenance workflows |
| `SETUP.md` | Local setup and Blogger preview procedure |
| `CONTRIBUTING.md` | Contribution and review requirements |
| `SECURITY.md` | Private vulnerability and credential guidance |
| `CLAUDE.md` | Repository-specific implementation boundaries |

## Quick start

Requirements: Node.js 18+ and npm.

```bash
git clone https://github.com/tbbcom/xml.git
cd xml
npm ci
npm test
npm run validate
```

Both test commands must pass before a template change is considered ready for Blogger preview.

## Safe release flow

1. Create a feature branch.
2. Update only the intended files.
3. Run `npm test` and `npm run validate`.
4. Back up the current live Blogger theme.
5. Import the candidate XML into a Blogger test or preview context.
6. Verify homepage, post, static page, label, search and error views on mobile and desktop.
7. Validate headings, canonical/robots output and JSON-LD.
8. Check thumbnails and reserve image/ad dimensions to prevent CLS.
9. Run Lighthouse or PageSpeed checks on representative pages.
10. Merge only after review; publish to Blogger manually.

## Required visual and technical checks

- homepage/category grids do not collapse or overflow
- search opens, closes, submits and remains keyboard accessible
- featured, related and popular thumbnails render or fall back safely
- exactly one appropriate H1 is rendered per page type
- no duplicate Article-family JSON-LD is emitted
- mobile menu, navigation and long content remain responsive
- no horizontal scrolling at common mobile widths
- LCP candidates are not lazy-loaded
- dynamic elements do not introduce avoidable CLS
- interaction handlers remain lightweight for INP

## Blogger workflow safety

All Blogger API workflows are dry-run-first and restricted to The Bukit Besi.

- secrets use the `TBB_BLOGGER_*` namespace
- the target hostname must resolve to `thebukitbesi.com`
- write operations require explicit blog-ID confirmation
- backups are created before content mutation
- batch limits remain intentionally small
- no workflow automatically publishes the Blogger theme

## Documentation

See [SETUP.md](SETUP.md) for installation and preview instructions, [CONTRIBUTING.md](CONTRIBUTING.md) for change requirements and [SECURITY.md](SECURITY.md) for private security reporting.

## License

See [LICENSE](LICENSE).
