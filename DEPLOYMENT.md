# Deploying MARQIX SHOPPING MALL

This guide covers deploying the backend (`server/`) and frontend (`client/`)
to **Render** (recommended — generous free tier, simplest setup). Railway
works almost identically if you prefer it; notes on the differences are at
the bottom.

Your database is already live on Supabase, so no database deployment step
is needed — you're just deploying the two apps that talk to it.

---

## Prerequisites

1. Push this project to a **GitHub repository** (Render/Railway both deploy
   from a connected Git repo, not by file upload).
   ```bash
   cd ecommerce
   git init
   git add .
   git commit -m "Initial commit"
   # create a repo on GitHub first, then:
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git branch -M main
   git push -u origin main
   ```
   Make sure `.env` is **not** committed (see `.gitignore` below) — only
   `.env.example` should be in the repo. Your real secrets get entered
   directly into Render's dashboard instead.

2. Add a `.gitignore` if you don't already have one:
   ```
   node_modules/
   .env
   build/
   ```

---

## Part 1: Deploy the backend (server/)

1. Go to [render.com](https://render.com) → sign up/log in → **New +** → **Web Service**
2. Connect your GitHub repo, select it
3. Configure:
   - **Root Directory:** `server`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free (fine for testing)
4. Add environment variables (Render dashboard → Environment tab) — copy
   these from your local `server/.env`:
   - `DATABASE_URL` — your Supabase **Session pooler** connection string
   - `JWT_SECRET` — your secret
   - `JWT_EXPIRES_IN` — e.g. `7d`
   - `PORT` — Render sets this automatically; you can leave your code as-is
     since it already does `process.env.PORT || 5000`
   - `CLIENT_URL` — leave this for now, you'll fill it in after deploying
     the frontend (Part 2) — it's needed for CORS to allow your frontend's
     domain to call this API
5. Click **Create Web Service**. Wait for the build/deploy to finish.
6. Once live, note your backend's URL, e.g.:
   `https://marqix-server.onrender.com`
7. Test it: visit `https://marqix-server.onrender.com/api/health` — you
   should see the same JSON you saw on localhost.

**Note on Render's free tier:** free web services spin down after 15
minutes of inactivity and take ~30-60 seconds to wake up on the next
request. This is normal — fine for testing/demos, but for a real store
you'd want a paid instance to avoid the cold-start delay.

---

## Part 2: Deploy the frontend (client/)

1. Render dashboard → **New +** → **Static Site**
2. Connect the same GitHub repo
3. Configure:
   - **Root Directory:** `client`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `build`
4. Add environment variable:
   - `REACT_APP_API_URL` → `https://marqix-server.onrender.com/api`
     (your backend URL from Part 1, with `/api` on the end)
5. Click **Create Static Site**. Wait for the build to finish.
6. Note your frontend's URL, e.g.:
   `https://marqix-shopping-mall.onrender.com`

## Part 3: Connect them (fix CORS)

Go back to your **backend** service on Render → Environment tab → update:
- `CLIENT_URL` → `https://marqix-shopping-mall.onrender.com` (your actual
  frontend URL from Part 2, no trailing slash)

Save — Render will automatically redeploy the backend with the new value.
This is what allows your frontend's domain to make API requests without
being blocked by CORS.

---

## Part 4: Final test

Visit your live frontend URL and run through the full flow: register →
browse → add to cart → checkout → view order tracking. Everything should
work exactly like it did on localhost, just publicly accessible now.

---

## Deploying to Railway (detailed)

Railway works from the same GitHub repo, but has two important differences
from Render worth knowing upfront:
- Railway doesn't have a dedicated "static site" hosting type like Render
  — your frontend needs an actual start command that serves the built
  files (we'll use the `serve` package for this).
- For a monorepo like ours, each service needs its **Root Directory** set
  in its own service settings so Railway knows which subfolder to build.

### 1. Create the project and backend service
1. Go to [railway.com](https://railway.com) → **New Project** → **Deploy from GitHub repo**
2. Select your `e-commerce-web` repo. Railway creates one service.
3. Click that service → **Settings** tab:
   - **Root Directory:** `server`
   - **Build Command:** leave default (Railway auto-runs `npm install`)
   - **Start Command:** `npm start`
4. Go to the **Variables** tab and add:
   - `DATABASE_URL` — your Supabase Session pooler connection string
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN` — e.g. `7d`
   - `CLIENT_URL` — leave a placeholder for now (e.g. `http://localhost:3000`), you'll update it in step 4
5. Go to **Settings → Networking → Generate Domain**. Railway gives you a
   public URL like `https://marqix-server-production.up.railway.app`.
   Test it: visit `<that-url>/api/health`.

### 2. Add the frontend as a second service
1. In the same Railway project, click **+ New** → **GitHub Repo** → select
   the same repo again (this adds a second service from it)
2. Click the new service → **Settings**:
   - **Root Directory:** `client`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npx serve -s build -l $PORT`
     (`serve` is a tiny static file server; `npx` fetches it on the fly so
     you don't need to add it to `package.json`. `$PORT` is provided
     automatically by Railway.)
3. **Variables** tab, add:
   - `REACT_APP_API_URL` → `https://marqix-server-production.up.railway.app/api`
     (your backend's domain from step 1, with `/api` on the end)

   Important: Create React App bakes `REACT_APP_*` variables into the
   build at **build time**, not runtime — so this variable must be set
   *before* you deploy/redeploy this service, otherwise the frontend will
   still be pointing at `localhost`.
4. **Settings → Networking → Generate Domain** for this service too.
   You'll get something like `https://marqix-client-production.up.railway.app`.

### 3. Connect them (fix CORS)
Go back to the **backend** service → Variables → update:
- `CLIENT_URL` → your frontend's actual Railway domain from step 2

Redeploy the backend service (Railway usually redeploys automatically
when a variable changes — if not, click **Deploy** manually).

### 4. Final test
Visit your frontend's Railway domain and run through the full flow:
register → browse → cart → checkout → order tracking.

**Alternative for the frontend specifically:** since `client/` is a plain
static React build, **Vercel** or **Netlify** are also excellent (and
handle static hosting more natively than Railway) — connect the repo, set
root directory to `client`, build command `npm run build`, output
directory `build`, add the `REACT_APP_API_URL` env var, deploy. Either
works fine alongside a Railway-hosted backend.

---

## Environment variable summary

| Variable            | Where         | Value |
|----------------------|---------------|--------|
| `DATABASE_URL`        | Backend host   | Supabase Session pooler connection string |
| `JWT_SECRET`           | Backend host   | Your secret |
| `JWT_EXPIRES_IN`        | Backend host   | e.g. `7d` |
| `CLIENT_URL`             | Backend host   | Your deployed frontend's URL |
| `REACT_APP_API_URL`      | Frontend host  | Your deployed backend's URL + `/api` (must be set **before** building on Railway/CRA) |
