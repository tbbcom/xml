# CLAUDE.md — The Bukit Besi Blogger Template

## Scope

This repository is exclusively for **thebukitbesi.com**.

- Platform: Blogger
- Locale: Malay / Malaysia (`ms-MY`)
- Production template: `asset/xml/thebukitbesi.xml`
- Template architecture: native Blogger XML + CSS + vanilla JavaScript
- Brand accent: red (`#b91c1c` baseline; refine only with approved brand assets)

## Hard Boundaries

1. Do not introduce cross-site manifests, service workers, APIs, logos, analytics IDs, advertising slot IDs, verification tags, social handles, or credentials from another website.
2. Do not use generic Blogger mutation secrets. Workflows that access Blogger must use the `TBB_BLOGGER_*` secret namespace and must verify the target hostname is `thebukitbesi.com`.
3. Never invent IDs or handles. If a TBB-specific value is not verified, omit it.
4. Production changes must remain on a feature branch until XML validation and Blogger import/render testing pass.
5. No automatic deployment to Blogger from this repository.

## Production Architecture

`asset/xml/thebukitbesi.xml` is the single source of truth.

Current design goals:

- semantic, mobile-first editorial layout
- compact sticky header
- primary navigation: Direktori, Panduan, Bantuan, Teknologi, Bukit Besi
- native Blogger search route
- native post listing; no JS-required content feed for critical homepage discovery
- one Blogger `Blog` widget
- one page-level H1 strategy
- native system font stack
- vanilla JS only
- no jQuery
- no external icon library
- inline SVG icons
- no PWA/service worker until a TBB-owned implementation is intentionally added
- no inherited third-party ad runtime

## SEO Rules

- Blogger `all-head-content` owns the canonical declaration. Do not add a second manual canonical.
- `ms-MY` and `x-default` hreflang should use the canonical URL object.
- Error, search-query, and archive views remain `noindex, follow`; normal pages remain indexable.
- Global structured data is limited to verified `Organization`, `WebSite`, and `WebPage` entities.
- Single posts may emit one `BlogPosting` entity using Blogger-author and post metadata.
- Do not invent founder, social `sameAs`, publisher logo, awards, certifications, contact points, or organizational facts.
- Post content should not contain a second Article/BlogPosting/NewsArticle schema when the template already emits the article entity.

## Performance Rules

- Keep the critical shell dependency-free.
- Use explicit image dimensions and responsive Blogger image resizing.
- Only the first likely LCP listing image may use `fetchpriority="high"`/eager loading.
- Post hero images should not be lazy-loaded when they are the likely LCP element.
- Lazy-load non-critical listing images.
- Avoid layout-changing scripts before first paint.
- Prefer transform/opacity for UI transitions.

## Development Commands

```bash
npm ci
npm test
npm run validate
```

The validator defaults to:

```text
asset/xml/thebukitbesi.xml
```

## Blogger Safety

For any API workflow:

- verify `TBB_BLOGGER_BLOG_URL` is exactly the TBB domain;
- require the expected blog ID before any apply operation;
- remain dry-run-first;
- back up affected content before mutation;
- reject resolved Blogger post URLs outside TBB;
- keep batch mutation limits small.

## Header / UX Baseline

Desktop target: 64px header. Mobile target: 58px.

Header priorities:

1. TBB brand identity
2. five primary editorial pillars
3. search
4. dark-mode toggle
5. accessible mobile menu

Do not reintroduce unrelated calculators, religious navigation, unverified social icons, heavy mega menus, or empty feed-driven sections into the primary shell.
