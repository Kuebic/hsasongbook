# Syncing Production Data to Dev

Guide for copying production database to your local dev environment.

## Prerequisites

1. **Separate R2 bucket for dev** (one-time setup):
   - In Cloudflare dashboard: R2 → Create bucket → `hsasongbook-files-dev`
   - Configure dev: `npx convex env set R2_BUCKET "hsasongbook-files-dev"`

## Manual Sync Process

```bash
# 1. Export production database
npx convex export --prod --path ./prod-snapshot.zip

# 2. Import into dev (replaces all dev data)
npx convex import ./prod-snapshot.zip --replace

# 3. Cleanup
rm ./prod-snapshot.zip
```

## Automated Script (Optional)

Create `scripts/sync-prod-to-dev.sh`:

```bash
#!/bin/bash
set -e

SNAPSHOT_FILE="./prod-snapshot.zip"

echo "=== Syncing Production Database to Dev ==="

echo "Exporting production database..."
npx convex export --prod --path "$SNAPSHOT_FILE"

echo "Importing into dev..."
npx convex import "$SNAPSHOT_FILE" --replace

echo "Cleanup..."
rm "$SNAPSHOT_FILE"

echo "Done! Dev database now mirrors production."
echo "Note: Audio files are NOT synced (separate R2 buckets)."
```

Add to `package.json`:
```json
"sync-prod-to-dev": "bash scripts/sync-prod-to-dev.sh"
```

## What Gets Synced

| Data | Synced? | Notes |
|------|---------|-------|
| Songs | Yes | All metadata, bible verses, themes |
| Arrangements | Yes | ChordPro content, settings, keys |
| Setlists | Yes | All setlist data and ordering |
| Users | Yes | User records (need to re-auth on dev) |
| Audio files | No | R2 keys exist but files are in prod bucket |
| Attachments | No | Same - keys exist, files don't |

## Verification

After syncing:
1. Open app and verify songs/arrangements appear
2. ChordPro content should display correctly
3. Audio play buttons will fail (expected - files are in prod bucket)
4. Check Convex dashboard to compare table row counts

## Safety Notes

- Dev and prod use separate R2 buckets, so file operations in dev won't affect prod
- User sessions are environment-specific - users need to re-authenticate on dev
- All `_id` references are preserved, maintaining relationships between records
