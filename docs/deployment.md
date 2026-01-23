# Pamelo Bot Deployment Guide

This guide details how to deploy the Pamelo Trading Bot ecosystem. The architecture consists of two parts:

1.  **State & Background Layer**: Redis (Hosted on Render.com)
2.  **Application Layer**: Next.js App + Background Workers (Hosted on Netlify)

---

## 1. Deploying Redis (Render.com)

We use Render for a managed Redis instance to store Price History (EMA), Funding Rates, and Worker Queues.

1.  **Sign Up**: Go to [render.com](https://render.com) and create an account.
2.  **Create Redis**:
    - Click **New +** -> **Redis**.
    - **Name**: `pamelo-redis`
    - **Region**: `Frankfurt (EU Central)` (or closest to your users).
    - **Plan**: `Free` (good for testing) or `Starter` ($0.25/mo) for persistence.
    - **Max Memory Policy**: `noeviction` (Critical for queue safety).
3.  **Get Connection String**:
    - Copy the `Internal Redis URL` (if deploying app on Render too) or `External Redis URL` (if deploying App on Netlify).
    - Format: `rediss://:password@host:port`

---

## 2. Deploying Application (Netlify)

The Next.js application hosts both the UI and the API Routes that process the background jobs (via Serverless functions or Edge capabilities).

1.  **Push Code**: Ensure your code is pushed to a GitHub repository.
2.  **New Site**: Log in to Netlify -> **Add new site** -> **Import from Git**.
3.  **Configure Build**:
    - **Build Command**: `npm run build`
    - **Publish Directory**: `.next`
    - **Netlify Plugins**: Ensure `Next.js Runtime` is installed (automatic).
4.  **Environment Variables**:
    Go to **Site Settings** -> **Environment Variables** and add:

    | Variable                     | Description                    | Example                        |
    | :--------------------------- | :----------------------------- | :----------------------------- |
    | `NEXT_PUBLIC_IS_TESTNET`     | Toggle Testnet/Mainnet         | `true`                         |
    | `REDIS_URL`                  | Connection string from Render  | `rediss://:pass@host:port`     |
    | `DATABASE_URL`               | PostgreSQL Connection String   | `postgres://user:pass@host/db` |
    | `KEEPER_MNEMONIC`            | Seed phrase for the Bot Wallet | `word1 word2 ... word24`       |
    | `NEXT_PUBLIC_KEEPER_ADDRESS` | Address of Bot Wallet          | `EQ...`                        |
    | `STORM_API_KEY`              | Storm Trade API Key            | `st_...`                       |
    | `STON_API_KEY`               | Ston.fi API Key (Optional)     | `sf_...`                       |

5.  **Deploy**: Click **Deploy Site**.

---

## 3. Database (PostgreSQL)

You need a Postgres database for user state and position tracking.

- **Option A**: Use **Supabase** (Recommended). Create a project, get the `Connection String`.
- **Option B**: Use **Render PostgreSQL**.

**Migration**:
Once deployed, run the Prisma migration command locally (pointing to the production DB) or add it to the build command:

```bash
npx prisma migrate deploy
```

---

## 4. Verification

1.  **Health Check**: Visit `https://your-site.netlify.app/api/health`.
2.  **Worker Check**: Check Netlify Function logs to ensure `safetyCheckJob` and `fundingJob` are firing.
3.  **Redis Connection**: Ensure no "ECONNREFUSED" errors in logs.

---

**Security Note**: Never share your `KEEPER_MNEMONIC` or `DATABASE_URL` in public repos.
