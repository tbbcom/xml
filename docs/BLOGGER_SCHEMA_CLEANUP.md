# The Bukit Besi — Safe Blogger Schema Cleanup

This tool removes only embedded `Article`, `BlogPosting`, and `NewsArticle` JSON-LD from TBB post bodies while preserving unrelated schema such as `FAQPage`, `HowTo`, `VideoObject`, and `WebApplication`.

## Safety defaults

- Dry-run first.
- Apply mode is limited to 10 posts per run.
- Every selected post receives `.before.html` and `.after.html` backups.
- A `manifest.json` records each proposed or applied change.
- Apply is blocked unless `--confirm-blog-id` exactly matches the configured TBB blog ID.
- The script rejects any resolved post URL outside `thebukitbesi.com`.
- Invalid JSON-LD is left untouched.
- The cleanup changes only the post content field.

## GitHub secrets

Use only:

- `TBB_BLOGGER_BLOG_ID`
- `TBB_BLOGGER_BLOG_URL`
- `TBB_BLOGGER_CLIENT_ID`
- `TBB_BLOGGER_CLIENT_SECRET`
- `TBB_BLOGGER_REFRESH_TOKEN`

Never reuse credentials belonging to another site.

## Local dry-run

Map your local TBB credentials to the environment names consumed by the script:

```bash
BLOGGER_BLOG_ID="YOUR_TBB_BLOG_ID" \
BLOGGER_BLOG_URL="https://www.thebukitbesi.com/" \
BLOGGER_CLIENT_ID="..." \
BLOGGER_CLIENT_SECRET="..." \
BLOGGER_REFRESH_TOKEN="..." \
npm run cleanup:blogger:dry-run
```

Target explicit post IDs when possible:

```bash
npm run cleanup:blogger -- --post-ids=POST_ID_1,POST_ID_2 --max=2
```

## Apply

After reviewing the generated backups:

```bash
npm run cleanup:blogger -- --apply --post-ids=POST_ID_1,POST_ID_2 --max=2 --confirm-blog-id=YOUR_TBB_BLOG_ID
```

After each apply batch, verify rendered content, structured data and article layout before processing more posts.
