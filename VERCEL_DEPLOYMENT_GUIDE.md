# Vercel Deployment Guide - Patient Telehealth Platform

## Overview
Your patient-focused telehealth app has two parts:
- **Frontend**: Next.js app (perfect for Vercel)
- **Backend**: Node.js API (needs separate hosting)

## Deployment Strategy

### Option 1: Frontend on Vercel + Backend on Railway (Recommended)

#### Step 1: Deploy Backend to Railway
```bash
# Backend is already configured for Railway with railway.toml
# Just push to Railway:
cd backend
railway login
railway link [your-railway-project]
railway up
```

#### Step 2: Deploy Frontend to Vercel

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Deploy Frontend**
```bash
cd frontend
vercel
```

### Option 2: Full-Stack Deployment on Vercel (Alternative)

If you want everything on Vercel, we can convert the backend to serverless functions.

## Quick Deployment Steps

### 1. Prepare Your Repository
```bash
# Ensure your code is pushed to GitHub
git add .
git commit -m "Patient-only app ready for deployment"
git push origin main
```

### 2. Frontend Deployment on Vercel

**Method A: Via Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Set **Root Directory** to `frontend`
5. Framework will auto-detect as "Next.js"
6. Click "Deploy"

**Method B: Via CLI**
```bash
cd frontend
vercel --prod
```

### 3. Backend Deployment Options

**Option A: Railway (Recommended)**
```bash
cd backend
railway login
railway init
railway up
```

**Option B: Render**
1. Connect your GitHub repo to [render.com](https://render.com)
2. Set **Root Directory** to `backend`
3. Build Command: `npm install`
4. Start Command: `npm start`

**Option C: Heroku**
```bash
cd backend
heroku create your-app-name
git subtree push --prefix backend heroku main
```

## Environment Variables

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app/api
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Backend (.env)
```bash
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://your-app.vercel.app
DATABASE_URL=your-database-url
# Add other backend env variables
```

## Vercel Configuration

Create `vercel.json` in your frontend directory:
```json
{
  "name": "patient-telehealth-platform",
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/"
    }
  ],
  "env": {
    "NEXT_PUBLIC_API_URL": "@api-url"
  }
}
```

## Database Setup

For production, you'll need a hosted database:

**PostgreSQL Options:**
- **Supabase**: Free tier, perfect for telehealth apps
- **Railway**: Built-in PostgreSQL
- **Neon**: Serverless PostgreSQL
- **PlanetScale**: MySQL alternative

**Setup with Supabase:**
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Run your patient-only schema:
```sql
-- Copy contents from database/patient-only-schema.sql
```

## Custom Domain (Optional)

1. In Vercel dashboard, go to your project
2. Click "Domains"
3. Add your custom domain
4. Update DNS records as shown

## Environment Setup Checklist

### Vercel (Frontend)
- [ ] `NEXT_PUBLIC_API_URL` - Your backend URL
- [ ] `NEXT_PUBLIC_APP_URL` - Your frontend URL

### Backend Host (Railway/Render/etc)
- [ ] `DATABASE_URL` - Your database connection
- [ ] `CORS_ORIGIN` - Your Vercel frontend URL
- [ ] `NODE_ENV=production`
- [ ] All other backend environment variables

## Quick Start Command

```bash
# 1. Deploy backend first
cd backend && railway up

# 2. Get your backend URL, then deploy frontend
cd ../frontend
vercel --prod

# 3. Update environment variables in both platforms
```

## Monitoring & Health Checks

Your backend already includes:
- Health endpoint: `/health`
- CORS configured
- Error handling

Monitor at:
- Vercel: Your app dashboard
- Railway: `railway status`

## Troubleshooting

**CORS Issues:**
- Ensure `CORS_ORIGIN` in backend matches your Vercel URL
- Include `https://` in the URL

**API Connection Issues:**
- Check `NEXT_PUBLIC_API_URL` matches your backend URL
- Verify backend is running with `/health` endpoint

**Build Errors:**
- Ensure all dependencies are in `package.json`
- Check Node.js version compatibility

## Production Ready Features

Your app already includes:
✅ Patient-only focused interface  
✅ Secure authentication setup  
✅ Clean database schema  
✅ Production-ready error handling  
✅ HIPAA-compliant logging middleware  
✅ Rate limiting  
✅ Helmet security headers  

## Cost Estimate

- **Vercel**: Free for personal projects, $20/month for team
- **Railway**: $5/month for backend + database
- **Total**: ~$5-25/month for a production app

Your patient telehealth platform is now ready for production deployment! 🚀
