# The Bukit Besi Blogger Template — Setup & Validation

This repository contains the Blogger XML template for **thebukitbesi.com**.

## Requirements

- Node.js 18+
- Git
- GitHub access to `tbbcom/xml`

## Local validation

```bash
git clone https://github.com/tbbcom/xml.git
cd xml
npm ci
npm test
npm run validate
```

Production source:

```text
asset/xml/thebukitbesi.xml
```

## Deployment rule

The repository does not auto-deploy to Blogger. Validate on a feature branch, back up the current Blogger theme, import the XML into a Blogger test/preview context first, then publish manually only after render, schema, responsive and Core Web Vitals checks pass.

Any Blogger API workflow must use TBB-specific `TBB_BLOGGER_*` secrets and verify the target hostname before reading or changing content.
