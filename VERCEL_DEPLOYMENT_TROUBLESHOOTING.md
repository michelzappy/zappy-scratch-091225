# Vercel Deployment Troubleshooting Guide

## Current Issues and Solutions

### Issue: Deployment Failing After Mock Data Elimination

**Root Cause Analysis:**
The deployment is failing due to several configuration issues that arose after replacing mock data with real API calls:

1. **Incorrect Backend Entry Point**: The `backend/server.js` file exists but imports non-existent route files
2. **Monorepo Build Configuration**: The build process wasn't properly configured for the monorepo structure
3. **Missing Environment Variables**: API calls now require proper backend connectivity

### Solutions Implemented

#### 1. Fixed Package.json Scripts
**File**: `package.json` (root)
```json
{
  "scripts": {
    "install:backend": "cd backend && npm install",
    "install:frontend": "cd frontend && npm install", 
    "install:all": "npm run install:backend && npm run install:frontend",
    "build:backend": "cd backend && npm install",
    "build:frontend": "cd frontend && npm run build",
    "build": "npm run build:backend && npm run build:frontend",
    "start:backend": "cd backend && npm start",
    "start:frontend": "cd frontend && npm start",
    "start": "npm run start:backend"
  },
  "workspaces": ["frontend", "backend"]
}
```

#### 2. Updated Vercel Configuration
**File**: `vercel.json`
```json
{
  "version": 2,
  "builds": [
    {
      "src": "backend/package.json",
      "use": "@vercel/node",
      "config": {
        "includeFiles": ["backend/**"]
      }
    },
    {
      "src": "frontend/package.json", 
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/backend/src/app.js"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "backend/src/app.js": {
      "maxDuration": 30
    }
  }
}
```

### Key Changes Made

#### Backend Entry Point Clarification
- **Correct Entry Point**: `backend/src/app.js` (main application server)
- **Incorrect Entry Point**: `backend/server.js` (outdated/incomplete server)

The `backend/server.js` file imports routes that don't exist:
```javascript
// These imports FAIL because the files don't exist:
import authRoutes from './routes/auth.routes.js';
import consultationRoutes from './routes/consultation.routes.js';
// etc.
```

The actual routes are in `backend/src/routes/`:
- `backend/src/routes/auth.js`
- `backend/src/routes/consultations.js`
- etc.

#### Frontend Build Process
- **Local Build**: ✅ Working (`npm run build` in frontend directory)
- **Vercel Build**: Now configured to use proper monorepo structure

### Environment Variables Required

For successful deployment, ensure these environment variables are set in Vercel:

#### Backend Environment Variables
```
NODE_ENV=production
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=your_frontend_url
```

#### Frontend Environment Variables
```
NEXT_PUBLIC_API_URL=your_backend_api_url
```

### Deployment Steps

#### 1. Pre-deployment Checklist
- [ ] Verify frontend builds locally: `cd frontend && npm run build`
- [ ] Verify backend starts locally: `cd backend && npm start`
- [ ] Check all environment variables are set in Vercel dashboard
- [ ] Ensure database is accessible from Vercel

#### 2. Deployment Process
1. **Push to Repository**: Ensure all changes are committed and pushed
2. **Vercel Auto-Deploy**: Vercel should automatically detect changes
3. **Monitor Build Logs**: Check Vercel dashboard for build progress
4. **Test Deployment**: Verify both frontend and API endpoints work

#### 3. Common Deployment Errors and Solutions

**Error**: "Cannot find module './routes/auth.routes.js'"
**Solution**: This indicates Vercel is trying to use `backend/server.js` instead of `backend/src/app.js`
- Verify `vercel.json` routes point to `/backend/src/app.js`
- Check that build configuration uses `backend/package.json`

**Error**: "Build failed - Frontend build errors"
**Solution**: 
- Check TypeScript errors in components
- Verify all imports are correct
- Ensure API client is properly configured

**Error**: "API routes returning 404"
**Solution**:
- Verify backend routes are properly configured in `backend/src/app.js`
- Check that API calls use correct endpoint URLs
- Ensure CORS is properly configured

### Testing Deployment

#### Local Testing
```bash
# Test frontend build
cd frontend
npm run build
npm start

# Test backend
cd backend  
npm start

# Test API endpoints
curl http://localhost:3001/api/auth/profile
```

#### Production Testing
```bash
# Test deployed frontend
curl https://your-app.vercel.app

# Test deployed API
curl https://your-app.vercel.app/api/auth/profile
```

### Rollback Plan

If deployment continues to fail:

1. **Immediate Rollback**: Revert to previous working commit
2. **Gradual Migration**: Re-implement API integration component by component
3. **Fallback Strategy**: Temporarily restore mock data for critical components

### Monitoring and Maintenance

#### Post-Deployment Monitoring
- [ ] Monitor Vercel function logs for errors
- [ ] Check API response times and error rates
- [ ] Verify all frontend components load correctly
- [ ] Test user authentication and data loading

#### Performance Optimization
- [ ] Implement API response caching
- [ ] Optimize database queries
- [ ] Add error boundaries for better UX
- [ ] Monitor bundle sizes and loading times

## Current Status

✅ **Frontend Build**: Working locally
✅ **Backend Server**: Running locally  
✅ **API Integration**: All components updated
⚠️ **Vercel Deployment**: Configuration updated, needs testing
⚠️ **Environment Variables**: Need to be configured in Vercel dashboard

## Next Steps

1. **Configure Environment Variables** in Vercel dashboard
2. **Test Deployment** with updated configuration
3. **Monitor Build Logs** for any remaining issues
4. **Verify API Connectivity** between frontend and backend
5. **Test All Components** to ensure proper functionality

---

**Last Updated**: 2025-01-18
**Status**: Configuration Updated - Ready for Testing