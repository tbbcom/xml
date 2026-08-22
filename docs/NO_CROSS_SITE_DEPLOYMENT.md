# No Cross-Site Deployment Policy

This repository is for The Bukit Besi only.

Rules:

1. Never deploy from this repository to `ilmualam.com`.
2. Never use Ilmu Alam Blogger blog IDs, OAuth targets, PWA manifests, GitHub Pages assets, branding, social handles, or site-specific APIs in TBB production code.
3. Never use automatic fork/upstream synchronization as a deployment mechanism.
4. Any Blogger API write workflow must verify the exact TBB blog ID before mutation and default to dry-run where applicable.
5. `ilmualam/xml` must be treated as a separate, read-only external project during TBB work.
6. TBB production assets should resolve only to TBB-owned or neutral third-party origins required for site functionality.
