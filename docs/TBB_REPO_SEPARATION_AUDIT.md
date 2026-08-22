# TBB Repository Separation Audit

Status: in progress

Goal: make `tbbcom/xml` fully independent from Ilmu Alam and prevent accidental cross-site updates.

## Safety rules

- `ilmualam/xml` is read-only from this workflow and must never be modified from TBB work.
- TBB production changes must not reference Ilmu Alam domains, GitHub Pages, PWA manifests, branding, Quran APIs, Ilmu Alam social handles, Blogger IDs, or Ilmu Alam-specific assets.
- No upstream/fork sync should be used as a deployment mechanism.
- Any Blogger write workflow must require explicit TBB blog identity checks and must not reuse Ilmu Alam blog credentials/IDs.
- TBB template source of truth will be renamed away from `ilmualam.xml` only after dependency cleanup and validation.

## Confirmed legacy contamination in current TBB template

- Ilmu Alam theme naming and green design tokens.
- Ilmu Alam PWA manifest and app title.
- Ilmu Alam/Quran API preconnects and Arabic font stack.
- Ilmu Alam logo/widget metadata.
- Ilmu Alam-related prototype metadata in `asset/index.html`.

## Migration strategy

1. Audit all Ilmu Alam references in repository.
2. Audit GitHub Actions for Blogger IDs/secrets and cross-repo operations.
3. Remove Ilmu Alam-only runtime dependencies from TBB template.
4. Replace TBB branding/design tokens and header/navigation.
5. Create a TBB-specific template source file and tests.
6. Validate XML, schema, search/feed behavior, thumbnails, responsive layout, and CWV regressions.
7. Only then deploy to Blogger.
