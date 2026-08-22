# The Bukit Besi Blogger Template

Production source and supporting validation tools for **thebukitbesi.com**.

## Source of truth

```text
asset/xml/thebukitbesi.xml
```

## Stack

- Blogger XML
- semantic HTML
- CSS custom properties
- vanilla JavaScript
- inline SVG
- Node-based regression tests

No jQuery, external UI framework, cross-site PWA, inherited third-party ad runtime or unverified site credentials are part of the production template.

## Validate

```bash
npm ci
npm test
npm run validate
```

All Blogger API workflows are dry-run-first and restricted to TBB-specific credentials and the TBB hostname.
