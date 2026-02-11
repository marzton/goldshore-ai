# Legacy Snapshot Archive (2025-11-28)

This directory stores historical `*.legacy-20251128.*` snapshots moved out of active application roots to keep runtime/code paths clean while retaining reference copies for auditing, rollback comparison, or migration notes.

## Source locations

Files were archived from:

- `apps/gs-admin`
- `apps/gs-api`
- `apps/gs-gateway`
- `apps/gs-web`

## Notes

- Original relative paths are preserved under this archive directory.
- These files are not part of active builds/deployments and should only be used for historical reference.

## 2026-02 cleanup note

As part of a follow-up cleanup, any remaining `*.legacy-20251128.*` files were removed from active app roots so only archived copies remain under this directory.
