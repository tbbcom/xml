# Security Policy

## Scope

This repository contains the Blogger template and maintenance tooling for **thebukitbesi.com**.

## Reporting

Report suspected vulnerabilities privately to the repository maintainers. Do not publish credentials, Blogger IDs, OAuth tokens, API keys, cookies, private URLs, or exploit details in public issues or pull requests.

## Credential rules

- Never commit secrets.
- Blogger workflows must use the `TBB_BLOGGER_*` secret namespace.
- Write-capable scripts must verify the TBB hostname and expected blog ID before mutation.
- Do not reuse credentials from another website.
- Production deployment remains manual; repository changes do not auto-deploy to Blogger.

## Supported source

Only the current `main` branch and active release/maintenance branches are supported after they pass review and validation.
