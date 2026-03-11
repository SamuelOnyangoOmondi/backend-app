# Verify Sync Students Endpoint After Deploy

The endpoint **does exist** in this codebase:

- **Method:** `GET`
- **Path:** `/v1/supaschool/students`
- **Auth:** `Authorization: Bearer <terminal-jwt>`
- **Registered in:** `src/index.ts` (so it is always loaded, not only via plugin)

## 1. Check that the route is deployed

After deploying to Railway, open in a browser (no auth needed):

```
https://YOUR-RAILWAY-URL/routes
```

Example: `https://your-app.up.railway.app/routes`

You should see JSON with:

- `supaschoolRoutes`: array including `{ "method": "GET", "url": "/v1/supaschool/students" }`
- `total`: number of routes

If **`/v1/supaschool/students` is not** in `supaschoolRoutes`:

- Railway may be running an old build. In Railway: **Redeploy** → **Clear build cache and redeploy**.
- Confirm **Root Directory** is empty (or the folder that contains `package.json` and `src/`).
- Confirm **Build** runs `npm run build` and **Start** runs `npm start` (or `node dist/index.js`).

## 2. Check Supa School is reachable (no auth)

```
https://YOUR-RAILWAY-URL/v1/supaschool/ping
```

Expected: `{"ok":true,"message":"Supa School routes active"}`

If this works but the app still gets 404 on sync:

- The device may be using a **different base URL** (e.g. old Railway URL or typo). On the device, check **Settings** or activation and set the API base URL to your exact Railway URL with **no** trailing slash, e.g. `https://your-app.up.railway.app`.

## 3. Sync students (with auth)

The app calls:

```
GET https://YOUR-RAILWAY-URL/v1/supaschool/students
Authorization: Bearer <terminal-token>
```

- 200: returns `{ "students": [ ... ] }`
- 401: invalid or expired token → re-activate the device
- 503: Supabase not configured on backend → set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Railway
