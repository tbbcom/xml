# Security policy

## Scope

This repository contains the Blogger template and guarded maintenance tooling for **thebukitbesi.com**.

Supported code includes the current `main` branch and active release or maintenance branches after review and validation. Historical, abandoned and third-party forks are not supported.

## Private reporting

Report suspected vulnerabilities privately to the repository maintainers. Do not disclose exploitable details in a public issue or pull request.

Include:

- affected file, workflow or URL
- clear reproduction steps
- expected versus actual behavior
- likely impact
- a minimal proof of concept with secrets removed
- suggested remediation, if known

## Never publish

- Blogger blog IDs
- OAuth client secrets or refresh tokens
- API keys
- cookies or session data
- GitHub secrets
- private preview URLs
- unredacted workflow logs
- credentials or identifiers belonging to another website

If a secret is exposed, revoke or rotate it immediately before relying on a repository-only cleanup.

## Credential and workflow controls

- secrets must use the `TBB_BLOGGER_*` namespace
- write-capable tools must verify the TBB hostname and expected blog ID
- workflows remain dry-run-first
- content backups are required before mutation
- apply batches remain intentionally limited
- resolved post URLs outside The Bukit Besi must be rejected
- production theme deployment remains manual
- credentials must never be copied between websites

## Supply-chain guidance

Keep GitHub Actions pinned to trusted major versions and review dependency updates before merging. Avoid adding runtime packages or remote scripts when a native browser or repository-local solution is sufficient.

## Security-sensitive changes

Changes affecting authentication, secrets, workflows, content mutation, external scripts, service workers, analytics, advertisements or deployment require explicit review and Blogger target verification.
