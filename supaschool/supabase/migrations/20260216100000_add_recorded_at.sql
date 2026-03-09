-- Add recorded_at for device scan timestamp (when palm was scanned)
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS recorded_at timestamptz;
ALTER TABLE public.meal_records ADD COLUMN IF NOT EXISTS recorded_at timestamptz;
