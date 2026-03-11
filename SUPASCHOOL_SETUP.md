# Connect the device to the Supa School dashboard

The terminal device and the Supa School website can use the **same database** for attendance and meals. The backend already writes to Supabase when configured; you only need to point it at the Supa School project and align school/student IDs.

**No manual link on the device:** Set `BACKEND_PUBLIC_URL` in the backend `.env` (e.g. your deployed URL). The device gets this URL from the backend on activation and from the Android build (reading `backend/.env` at build time). When offline, the device stores events locally and syncs when back online.

## 1. Same Supabase project

The backend writes attendance and meal records to Supabase tables `attendance_records` and `meal_records`. Supa School reads from those same tables. They must be the **same Supabase project**.

In the **backend** `.env` (in `Android/farm-to-palm/backend/`), set:

```env
# Use the same project as the Supa School web app (from supaschool/.env)
SUPABASE_URL=https://YOUR_SUPASCHOOL_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

- **SUPABASE_URL**: Must match Supa School’s `VITE_SUPABASE_URL` (e.g. from `supaschool/.env`).
- **SUPABASE_SERVICE_ROLE_KEY**: From Supabase Dashboard → Project Settings → API → `service_role` (secret). The anon key is for the browser; the backend needs the service role to insert/upsert records.

If these are missing, the backend still runs and stores events in its own Postgres (Knex), but it will **not** write to Supabase and the dashboard will not see device events.

## 2. School ID = Supa School school UUID

When the device syncs events, the backend sends `school_id` from the terminal’s config (set at activation). That value is written to `attendance_records.school_id` and `meal_records.school_id`. Supa School filters by `school_id`, so it must be the **Supa School school UUID** (from the `schools` table in Supabase).

When you create activation codes for terminals:

- The terminal’s `school_id` in the backend should be the **Supa School** school UUID.
- So when seeding or creating schools in the backend (e.g. for activation), use the same UUID as in Supa School’s `schools.id`, or map your backend school to that UUID when writing to Supabase.

Example: if in Supa School the school has `id = 'abc-123-uuid'`, then when activating a terminal, that terminal’s `school_id` should be `abc-123-uuid` so that device events appear under that school on the dashboard.

## 3. Student IDs = Supa School student UUIDs

Attendance and meal records reference `student_id`, which must be a Supa School **student UUID** (`students.id` in Supabase). The device sends `externalId` for each event; the backend uses that as `student_id` when writing to Supabase.

So on the device, **externalId** for each student must be the Supa School student UUID. The app supports that in two ways:

1. **Sync students from Supa School**  
   On the device: **Sync status** → **Sync students from Supa School**.  
   This calls the backend `GET /v1/supaschool/students`, which returns students from Supabase for the terminal’s school. The device then stores them with **id = externalId = Supabase student id**.  
   After that, when you record attendance or meals (palm or NFC), the synced events use those IDs and show up correctly on the Supa School dashboard.

2. **Enrollment**  
   When enrolling a new student on the device, use the **Supa School student UUID** as “External ID” (e.g. copy from Supa School’s Students page or API). Then that student’s events will link to the correct Supa School student.

## 4. Tables and flow summary

| Data        | Backend (Knex)     | Supabase (Supa School)     | Device                |
|------------|--------------------|-----------------------------|------------------------|
| Schools    | `schools` (for activation) | `schools`                  | —                      |
| Students   | `students` (optional)      | `students`                 | Local; `externalId` = Supabase `students.id` |
| Attendance | `attendance_events`        | `attendance_records`       | Synced via API; backend writes to both |
| Meals      | `meal_events`              | `meal_records`             | Synced via API; backend writes to both |

- Device sends events to backend `POST /v1/events/attendance/bulk` and `POST /v1/events/meals/bulk`.
- Backend stores in Knex and, if Supabase is configured, **also** upserts into Supabase `attendance_records` and `meal_records` with `source = 'farm_to_feed'`.
- Supa School dashboard reads from `attendance_records` and `meal_records`, so it sees device data as long as:
  - Backend uses the same Supabase project (step 1).
  - `school_id` is the Supa School school UUID (step 2).
  - `student_id` / device `externalId` is the Supa School student UUID (step 3).

## 5. Checklist

- [ ] Backend `.env`: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set to Supa School project.
- [ ] Terminal activation uses a `school_id` that equals the Supa School school UUID.
- [ ] On the device: run **Sync students from Supa School** (or use Supa School student UUIDs as External ID when enrolling).
- [ ] Device and backend can reach each other (same network or correct URL); run **Sync now** so events are sent to the backend and then to Supabase.

After this, attendance and meals recorded on the device should appear on the Supa School website for that school.
