# Deploy the Farm-to-Palm backend to Railway

Use these steps to host the backend on [Railway](https://railway.app) so the device can use it from anywhere (no manual link; set `BACKEND_PUBLIC_URL` once and the device gets it from .env).

---

## 1. Prerequisites

- A [Railway](https://railway.app) account (sign up with GitHub).
- Your backend code in a **Git repository** (e.g. GitHub). Railway deploys from a repo or from the Railway CLI.

---

## 2. Create a new project on Railway

1. Go to [railway.app](https://railway.app) and log in.
2. Click **New Project**.
3. Choose **Deploy from GitHub repo** (recommended):
   - Connect your GitHub account if needed.
   - Select the repository that contains this backend (e.g. the repo that has `Android/farm-to-palm/backend`).
   - If the backend is in a subfolder, you’ll set the **Root Directory** in step 4.
4. Or choose **Empty Project** and we’ll add a service and connect the repo later.

---

## 3. Add a Postgres database

1. In your Railway project, click **+ New**.
2. Select **Database** → **PostgreSQL**.
3. Railway creates a Postgres service and exposes a `DATABASE_URL` variable.
4. Click the Postgres service → **Variables** (or **Connect**) and copy the **Connection URL** (or note that it’s linked to the app as `DATABASE_URL`).

---

## 4. Set Root Directory so Railway builds the backend folder (required)

Railway does **not** let you pick a folder when you first connect the repo—it uses the whole repo. So the first deploy fails. Fix it by setting **Root Directory** on the backend service:

1. In your Railway project, click the **backend service** (the one connected to GitHub).
2. Open the **Settings** tab for that service.
3. Find the **Source** section (or **Build** / **General**).
4. Look for **Root Directory** (or **Add Root Directory**). Enter exactly:
   ```text
   Android/farm-to-palm/backend
   ```
   Use this path if your repo root contains an `Android` folder; if your repo root is already the `Android` folder, use:
   ```text
   farm-to-palm/backend
   ```
5. Save. Railway will redeploy using only that folder (where `package.json` and `src/` live).

**If you don’t see Root Directory:** Some plans or UI versions put it under **Settings → Source → Root Directory**. If it’s missing, use the alternative below.

**Alternative – backend-only repo (if Root Directory is missing in your Railway UI):**

1. Create a new GitHub repo (e.g. `farm-to-palm-backend`).
2. Copy only the backend folder contents (not the folder itself) into that repo:
   ```bash
   cd /path/to/this/repo
   mkdir -p /tmp/backend-deploy && cp -R Android/farm-to-palm/backend/* /tmp/backend-deploy/
   cd /tmp/backend-deploy && git init && git add -A && git commit -m "Backend for Railway"
   git remote add origin https://github.com/YOUR_USER/farm-to-palm-backend.git
   git push -u origin main
   ```
3. In Railway, create a **New Project** → **Deploy from GitHub repo** and select this new repo. The repo root is the backend, so no Root Directory is needed.

---

## 5. Configure build and start

Railway usually auto-detects Node: it runs `npm install`, then `npm run build` (if present), then `npm start` (or `node .`). Our backend has:

- **Build:** `npm run build` (outputs to `dist/`)
- **Start:** `npm start` → `node dist/index.js`

In the backend service:

1. Open **Settings** (or the service’s **Settings** tab).
2. **Build Command:** `npm run build` (or leave default if it already runs this).
3. **Start Command:** `npm start` (or `node dist/index.js`).
4. **Root Directory:** must be the directory that contains `package.json` (e.g. `Android/farm-to-palm/backend`).

---

## 6. Set environment variables

In the **backend service** (not the Postgres one), open **Variables** and add:

| Variable | Value | Required |
|----------|--------|----------|
| `DATABASE_URL` | Postgres connection string | Yes |
| `JWT_SECRET` | A long random string (e.g. `openssl rand -hex 32`) | Yes |
| `PORT` | `3000` (or leave unset; Railway often sets it) | Optional |
| `BACKEND_PUBLIC_URL` | Your Railway app URL (see step 7) | Yes (for device) |
| `SUPABASE_URL` | Supa School Supabase project URL (from supaschool `.env`) | If using Supa School |
| `SUPABASE_SERVICE_ROLE_KEY` | Supa School Supabase service role key | If using Supa School |
| `BIOMETRIC_ENC_KEY` | 32-byte hex (e.g. `openssl rand -hex 32`) | Optional |

**How to get `DATABASE_URL`:**

- In the same Railway project, click the **Postgres** service.
- Go to **Variables** or **Connect** and copy the **Postgres URL** / `DATABASE_URL`.
- Paste it into the **backend** service’s variables (Railway can also “Reference” it if you add the Postgres service as a dependency).

**`BACKEND_PUBLIC_URL`:** After the first deploy, Railway gives you a URL like `https://your-service.up.railway.app`. Put that exact URL in `BACKEND_PUBLIC_URL` (no trailing slash). You can set it after the first deploy (step 7).

---

## 7. Run database migrations

The backend uses Knex migrations. Run them once (and after schema changes) against the Railway Postgres.

**Option A – Release command (recommended):**

1. In the backend service → **Settings**.
2. Find **Deploy** or **Build** section.
3. Set **Release Command** (or “Custom start”) to:  
   `npm run migrate && npm start`  
   so migrations run before each start.  
   Or use a one-off command (Option B) for the first run.

**Option B – One-off from your machine:**

1. Install Railway CLI: `npm i -g @railway/cli` (or see [railway.app/docs](https://docs.railway.app)).
2. Log in: `railway login`.
3. Link the project: `cd Android/farm-to-palm/backend` then `railway link` and select the project and backend service.
4. Run migrations using the linked env:  
   `railway run npm run migrate`  
   This uses the service’s `DATABASE_URL`.

**Option C – From Railway dashboard:**

- If your plan supports it, open a **Shell** for the backend service and run `npm run migrate` there (with `DATABASE_URL` already set).

---

## 8. Deploy and get the public URL

1. Trigger a deploy (push to the connected branch or click **Deploy** in Railway).
2. When the build and start succeed, open the backend service → **Settings** → **Networking** (or **Generate Domain**).
3. Click **Generate Domain**. Railway will give a URL like:  
   `https://farm-to-palm-backend-production.up.railway.app`
4. Copy this URL and add (or update) in the backend service **Variables**:
   - `BACKEND_PUBLIC_URL` = `https://your-actual-domain.up.railway.app` (no trailing slash).
5. Redeploy once so the app starts with the correct `BACKEND_PUBLIC_URL` (optional but recommended).

---

## 9. Update your local `.env` (for devices that read it at build time)

In **`Android/farm-to-palm/backend/.env`** (local), set the same public URL so the Android app and activation flow use it:

```env
BACKEND_PUBLIC_URL=https://your-actual-domain.up.railway.app
```

Keep other local vars (e.g. local `DATABASE_URL` for local dev). For production, the device and backend use the Railway URL from this variable.

---

## 10. Seed data (optional)

If you need schools/terminals for activation:

- From your machine (with Railway CLI linked):  
  `railway run npm run seed`  
- Or run the seed script against the production DB using the same `DATABASE_URL` (e.g. in a one-off shell or locally with `DATABASE_URL` set to the Railway Postgres URL).

---

## 11. Checklist

- [ ] Railway project created; Postgres and backend services added.
- [ ] Backend **Root Directory** = path to backend (e.g. `Android/farm-to-palm/backend`).
- [ ] **Build** = `npm run build`, **Start** = `npm start`.
- [ ] Variables set: `DATABASE_URL`, `JWT_SECRET`, `BACKEND_PUBLIC_URL`, and (if needed) `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] Domain generated; `BACKEND_PUBLIC_URL` set to that domain.
- [ ] Migrations run (`railway run npm run migrate` or release command).
- [ ] Backend `.env` (local) has `BACKEND_PUBLIC_URL` for device/build.
- [ ] Test: open `https://your-domain.up.railway.app/health` in a browser; you should get `{"ok":true}`.

After this, the device can use the backend from anywhere; set `BACKEND_PUBLIC_URL` in .env and the device gets the link from the backend on activation and defaults to local storage when offline.
