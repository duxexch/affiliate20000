# Hostinger Deployment Guide — dux-exch.com

## Overview

This guide deploys **AffiliateDeals** to Hostinger shared/business hosting using Node.js Manager.
The single Express server serves both the API and the React SPA static files.

---

## Step 0 — Prerequisites

- Hostinger Business Shared Hosting or higher (includes Node.js Manager)
- Domain `dux-exch.com` pointed to your Hostinger account
- A PostgreSQL database (see **Database** section below)

---

## Step 1 — Get a PostgreSQL Database

Hostinger shared hosting uses **MySQL** by default. You have two options:

### Option A — Free Cloud PostgreSQL (Recommended)
1. Go to [neon.tech](https://neon.tech) → Sign up free
2. Create a new project → Database name: `affiliatedeals`
3. Copy the **Connection string** — it looks like:
   `postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/affiliatedeals?sslmode=require`
4. Save it — you will need it as `DATABASE_URL`

### Option B — Hostinger VPS / Cloud Hosting
If you are on a Hostinger VPS, PostgreSQL can be installed directly.

---

## Step 2 — Prepare the Deployment Package

On your local machine:

```bash
# 1. Install dependencies
pnpm install

# 2. Build the deployment package
bash scripts/create-hostinger-package.sh
```

This creates **`hostinger-deploy.zip`** in your project root.

---

## Step 3 — Upload to Hostinger

1. Login to **hPanel** → **File Manager**
2. Navigate to your home directory (e.g. `/home/username/`)
3. Create a folder: `affiliatedeals`
4. Upload `hostinger-deploy.zip` into that folder
5. Right-click the zip → **Extract** → extract here

You should now have:
```
/home/username/affiliatedeals/
├── server.js        ← Hostinger startup file
├── dist/            ← Compiled Express server
├── public/          ← Built React SPA
├── package.json
└── .env.example
```

---

## Step 4 — Configure Node.js Manager in hPanel

1. hPanel → **Node.js** (or "Node.js Manager")
2. Click **Create Application**

| Field | Value |
|---|---|
| Node.js version | **20.x** or 22.x |
| Application mode | **Production** |
| Application root | `/home/username/affiliatedeals` |
| Application startup file | **server.js** |
| Application URL | `dux-exch.com` |

3. Click **Create**

---

## Step 5 — Set Environment Variables

Inside the Node.js app settings, find **Environment Variables** and add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | `postgresql://...` (from Step 1) |
| `NODE_ENV` | `production` |
| `SITE_URL` | `https://dux-exch.com` |
| `SESSION_SECRET` | any random 64-character string |

---

## Step 6 — Initialize the Database

Run once to create the database tables and seed sample data:

On Hostinger, open **Terminal** (SSH) or use Hostinger's online terminal:

```bash
cd ~/affiliatedeals

# Set DATABASE_URL temporarily
export DATABASE_URL="postgresql://..."

# Run database migrations (creates tables)
node -e "
import('./dist/index.mjs').then(() => {
  console.log('Tables created');
  setTimeout(() => process.exit(0), 3000);
});
"
```

Or if you have local access, run from your local machine:
```bash
export DATABASE_URL="postgresql://your-neon-connection-string"
pnpm --filter @workspace/db run push
```

---

## Step 7 — Restart & Go Live

1. In hPanel → Node.js → click **Restart**
2. Visit `https://dux-exch.com` — your site should be live!
3. Visit `https://dux-exch.com/admin` — login with `admin` / `admin123`
4. **Change the admin password immediately** in Admin → Settings

---

## Verifying Everything Works

| URL | Expected |
|---|---|
| `https://dux-exch.com/` | Homepage |
| `https://dux-exch.com/offers` | All Offers page |
| `https://dux-exch.com/admin` | Admin login |
| `https://dux-exch.com/api/healthz` | `{"status":"ok"}` |
| `https://dux-exch.com/api/seo/sitemap.xml` | XML sitemap |
| `https://dux-exch.com/sitemap.xml` | Redirects to above |

---

## Troubleshooting

### Site shows "Application Error"
- Check that `DATABASE_URL` is set correctly in Environment Variables
- Ensure the database tables were created (Step 6)
- Check Node.js logs in hPanel → Node.js → Logs

### 404 on page refresh (React SPA)
- This should not happen — the Express server handles SPA fallback
- If it does, ensure `STATIC_DIR` is NOT set (let server.js auto-detect)

### Database connection refused
- Neon.tech: ensure the connection string includes `?sslmode=require`
- Check the database user has full permissions on the `affiliatedeals` database

---

## Admin Default Credentials

```
Username: admin
Password: admin123
```

**Change this immediately after first login!**

---

## File Structure After Deploy

```
/home/username/affiliatedeals/
├── server.js          Startup file (configured in hPanel)
├── package.json       Minimal package manifest
├── dist/
│   ├── index.mjs      Compiled Express server (all routes bundled)
│   ├── pino-worker.mjs
│   └── ...
└── public/
    ├── index.html     React SPA entry
    └── assets/        CSS, JS, images (cached 1 day)
```
