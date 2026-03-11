# Use a public URL so the device works from anywhere

The device is configured to **prefer the cloud (Supabase)** and only use a local backend when the primary URL is unreachable.

- **Primary API URL** = your deployed backend or tunnel URL (e.g. `https://your-app.up.railway.app`). The device uses this when online; the backend writes to Supabase, so the Supa School dashboard stays in sync.
- **Fallback API URL** (optional) = local backend (e.g. `http://192.168.1.5:3000`). Used only when the primary is unreachable (no internet or cloud down). Set this in **Settings** on the device if you want offline/local use at a site with a local server.

When the Android device is **not** on the same WiFi as your Mac, it cannot use `http://192.168.x.x:3000` as the primary URL. Use a **public URL** as primary and optionally set the LAN URL as fallback.

You have two options for the **primary** URL:

---

## Option A: Tunnel (quick – for testing)

Expose your **local** backend with a tunnel. The tunnel gives you a public HTTPS URL that forwards to `localhost:3000`.

### ngrok (free tier)

1. Sign up at [ngrok.com](https://ngrok.com) and install the CLI.
2. Start your backend on the Mac:
   ```bash
   cd Android/farm-to-palm/backend
   npm run dev
   ```
3. In another terminal, run:
   ```bash
   ngrok http 3000
   ```
4. ngrok prints a URL like **`https://abc123.ngrok-free.app`**. Copy it.
5. On the device: **Settings → API base URL** → paste that URL (e.g. `https://abc123.ngrok-free.app`) → **Save URL**.

The device can now sync from anywhere. When you stop ngrok, the URL changes (free tier); restart ngrok and update the URL on the device if needed.

### Cloudflare Tunnel (free, stable URL possible)

1. Install [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/).
2. With the backend running:
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```
3. Use the printed `*.trycloudflare.com` URL on the device as the API base URL.

---

## Option B: Deploy the backend (for production / “always on”)

Deploy the backend to a host so it has a **fixed public URL** and runs 24/7 (no need to keep your Mac on).

### 1. Deploy the backend

Deploy this folder (`Android/farm-to-palm/backend`) to a service that runs Node.js, for example:

| Service | Notes |
|--------|--------|
| **Railway** | [railway.app](https://railway.app) – **Full step-by-step:** see **[RAILWAY_SETUP.md](RAILWAY_SETUP.md)** in this folder. |
| **Render** | [render.com](https://render.com) – Web Service, connect repo, build `npm install`, start `npm run dev` or `node dist/index.js` if you add a build step. |
| **Fly.io** | [fly.io](https://fly.io) – `fly launch` in the backend folder, set secrets, deploy. |
| **VPS** (DigitalOcean, etc.) | Run Node on a server and put Nginx/Caddy in front; use the server’s IP or domain. |

Set these **environment variables** on the host (same as local `.env`):

- `DATABASE_URL` – Postgres (many hosts offer Postgres)
- `JWT_SECRET`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` – for Supa School
- `PORT` – often set by the host (e.g. `3000` or `PORT` from env)

### 2. Use the deployed URL on the device

After deploy you get a URL like:

- `https://your-backend.up.railway.app`  
- or `https://your-backend.onrender.com`  
- or your own domain.

On the device: **Settings → API base URL** → paste that URL → **Save URL**. No need for the device to be near your Mac.

---

## Summary

| Goal | Use |
|------|-----|
| Test from another network / away from Mac | **Option A** – ngrok or Cloudflare Tunnel to your local backend |
| Always-on, no Mac required | **Option B** – Deploy backend to Railway, Render, Fly.io, or a VPS |

In both cases, set **API base URL** on the device to the **public HTTPS URL** (tunnel or deployed). Then “Sync students from Supa School”, attendance, and meals work from anywhere.
