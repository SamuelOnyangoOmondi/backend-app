# EDCC (Raw Image) Integration

EDCC endpoints support storing and matching palm biometrics using raw RGB/IR images for remote identification.

## Endpoints

| Method | Path | Description |
|--------|------|--------------|
| POST | `/v1/biometrics/edcc/health-check-image` | Validate that the backend can accept raw images |
| POST | `/v1/biometrics/edcc/enroll` | Store raw images alongside palm template |
| POST | `/v1/biometrics/edcc/identify` | Match palm against stored templates (placeholder) |

All routes require `Authorization: Bearer <terminal_token>`.

## Flow

1. **Enrollment**: Device calls `/v1/students/palm` first (vendor sync), then `/v1/biometrics/edcc/enroll` with raw images when available.
2. **Identify**: Device tries local matching first; if no match, calls `/v1/biometrics/edcc/identify` as fallback.
3. **Audit**: Each identify attempt is logged to `palm_scan_events`.

## Database

- `palm_templates`: `rgb_image_enc`, `ir_image_enc` (nullable) store encrypted raw images.
- `palm_scan_events`: Logs each identify attempt (terminal_id, school_id, match_status, etc.).

## Status

- **Health-check**: Implemented; validates payload.
- **Enroll**: Implemented; updates existing palm template with raw images.
- **Identify**: Implemented with feature-based 1:N matcher (normalized correlation). Returns real matches when probe features correlate with stored templates above threshold (0.25). For production-grade accuracy, replace `edccMatcher.ts` with a vendor EDCC/NPU SDK.
