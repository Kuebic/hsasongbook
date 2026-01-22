# Deployment Guide

This guide covers deploying HSA Songbook to **Vercel** (frontend) + **Convex** (backend).

## Architecture

```
Production:
  Vercel (main branch) ──→ Convex Production
  yourdomain.com             (prod deployment)

Preview/Staging:
  Vercel (PR branches) ──→ Convex Development
  pr-123.vercel.app          (dev deployment)
```

## Prerequisites

- GitHub repository connected
- Convex account at [dashboard.convex.dev](https://dashboard.convex.dev)
- Vercel account at [vercel.com](https://vercel.com)

---

## Step 1: Create Convex Production Deployment

You already have a dev deployment. Now create a production one:

```bash
# Deploy to production (creates prod deployment if it doesn't exist)
npx convex deploy
```

This will:
1. Create a new production deployment (e.g., `prod:fleet-parrot-532`)
2. Give you a production URL (e.g., `https://fleet-parrot-532.convex.cloud`)

**Save your production Convex URL** - you'll need it for Vercel.

### Set Production Environment Variables in Convex

If you're using R2 for profile pictures, set the same env vars for production:

```bash
npx convex env set R2_ENDPOINT https://<ACCOUNT_ID>.r2.cloudflarestorage.com --prod
npx convex env set R2_ACCESS_KEY_ID <your-access-key> --prod
npx convex env set R2_SECRET_ACCESS_KEY <your-secret-key> --prod
npx convex env set R2_BUCKET hsasongbook-files --prod
```

---

## Step 2: Deploy to Vercel

### Option A: Via Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (follow prompts)
vercel

# Link to your GitHub repo for automatic deployments
vercel link
```

### Option B: Via Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel auto-detects Vite - accept defaults
4. Add environment variable (see Step 3)
5. Deploy

---

## Step 3: Configure Environment Variables in Vercel

Go to your Vercel project → **Settings** → **Environment Variables**

### Production (main branch)

| Variable | Value | Environment |
|----------|-------|-------------|
| `VITE_CONVEX_URL` | `https://your-prod-deployment.convex.cloud` | Production |

### Preview (PR branches) - Optional but Recommended

| Variable | Value | Environment |
|----------|-------|-------------|
| `VITE_CONVEX_URL` | `https://your-dev-deployment.convex.cloud` | Preview |

This way:
- **Production** (`main` branch) → uses Convex production data
- **Preview** (PR branches) → uses Convex dev data (safe for testing)

---

## Step 4: Connect GitHub for Auto-Deploy

If you used `vercel link` or imported via dashboard, this is already done.

Every push to `main` → deploys to production
Every PR → creates a preview deployment with unique URL

---

## Step 5: Custom Domain (Optional)

1. In Vercel → **Settings** → **Domains**
2. Add your domain (e.g., `hsasongbook.com`)
3. Follow DNS instructions (usually add CNAME record)

---

## Deployment Workflow

### Daily Development

```bash
# Local development
npm run dev              # Vite dev server
npx convex dev           # Convex dev server (separate terminal)

# Make changes, commit, push
git add .
git commit -m "feat: add new feature"
git push origin feature-branch
```

### Testing Changes

1. Create a PR on GitHub
2. Vercel automatically creates preview URL (e.g., `pr-123-hsasongbook.vercel.app`)
3. Test on preview URL (uses Convex dev data)
4. Merge PR when ready

### Deploying to Production

```bash
# Merge PR to main (via GitHub)
# OR push directly to main
git checkout main
git merge feature-branch
git push origin main

# Deploy Convex schema/functions if changed
npx convex deploy
```

Vercel automatically deploys when `main` is updated.

---

## Environment Summary

| Environment | Frontend | Backend | Data |
|-------------|----------|---------|------|
| **Local** | `localhost:5173` | Convex dev | Dev data |
| **Preview** | `*.vercel.app` | Convex dev | Dev data |
| **Production** | `yourdomain.com` | Convex prod | Prod data |

---

## Troubleshooting

### Build Fails on Vercel

Check that:
1. `VITE_CONVEX_URL` is set in Vercel environment variables
2. Build command is `npm run build` (should auto-detect)
3. Output directory is `dist` (should auto-detect)

### Convex Functions Not Working

```bash
# Re-deploy Convex functions to production
npx convex deploy

# Check logs
npx convex logs --prod
```

### SPA Routing Issues (404 on refresh)

The `vercel.json` file handles this. If issues persist, verify rewrites config.

---

## Costs

| Service | Free Tier | Typical Usage |
|---------|-----------|---------------|
| Vercel | 100GB bandwidth, 100 builds/day | Well under for small apps |
| Convex | 1M function calls, 1GB storage | Well under for tens of users |

**Estimated cost: $0/month** for your scale.
