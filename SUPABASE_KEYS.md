# Supabase Keys for Palm Enrollment

For palm enrollment status to show on SupaSchool, the backend must write to Supabase. **Use the correct key:**

## Required: Service Role Key (NOT Anon Key)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your Project
2. **Project Settings** → **API**
3. Under **Project API keys**, copy the **`service_role`** key (the secret one)
4. It's a long JWT string starting with `eyJ...`
5. Set in `.env`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

**Do NOT use the `anon` key** (often shorter, may start with `sb_publishable_`). The anon key has restricted permissions; the service_role key bypasses RLS and allows the backend to write to `palm_enrollment`.

## Verify

After setting the correct key and redeploying:
- Enroll a palm on the device
- Open SupaSchool → Student Profiles → View Profile
- You should see "Palm registered" within seconds
