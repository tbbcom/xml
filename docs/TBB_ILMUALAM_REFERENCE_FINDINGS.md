# TBB Ilmu Alam Reference Findings

Confirmed in `tbbcom/xml`:

- Production Blogger template file is still named `asset/xml/ilmualam.xml`.
- `.github/workflows/live-jsonld-audit.yml` defaults to an `ilmualam.com` URL.
- `.github/workflows/fix-theme-jsonld-keywords.yml` reads `asset/xml/ilmualam.xml` and creates an `ilmualam-fixed-theme-xml` artifact.
- Repository-wide search returns Ilmu Alam references in setup/docs, scripts, tests, audit materials, prototype HTML, package metadata, and workflow files.

These references must be classified into:

1. production/runtime dependencies — remove or replace immediately for TBB;
2. tooling paths/names — rename to TBB;
3. historical audit/docs — archive or rewrite so they cannot be mistaken for TBB production configuration.

No evidence from the inspected workflows shows automatic deployment from TBB to Ilmu Alam. The two inspected workflows are manual (`workflow_dispatch`) and use `contents: read`; one audits a live URL and one generates an artifact only.
