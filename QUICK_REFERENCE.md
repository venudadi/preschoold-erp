# Preschool ERP - Quick Reference Guide

## 🚀 Deployment Status

### Current Setup
- **Platform**: DigitalOcean App Platform (Recommended)
- **Frontend**: React + Vite → Static Site (Nginx)
- **Backend**: Node.js/Express → Web Service
- **Database**: MySQL 8.0 (Managed)
- **Health Check**: `/api/health` ✓

### Files Created
- ✅ `.do/app.yaml` - Production configuration
- ✅ `.do/app.staging.yaml` - Staging configuration
- ✅ `STAGING_DEPLOYMENT_STEPS.txt` - **START HERE** for deployment
- ✅ `DIGITALOCEAN_DEPLOYMENT.md` - Comprehensive guide
- ✅ `DEPLOYMENT.md` - Docker deployment (alternative)

---

## 📋 Quick Start - Staging Deployment

### Prerequisites
1. DigitalOcean account
2. Resolve git secret issue (see below)
3. Staging branch created

### Deployment (3 Steps)
```bash
# 1. Fix git secret (REQUIRED)
# Visit: https://github.com/venudadi/preschoold-erp/security/secret-scanning/unblock-secret/33q7ZO2ikii6RoExgAjheGyw5YX
# Click "Allow secret"

# 2. Create staging branch
git checkout -b staging
git push -u origin staging

# 3. Deploy on DigitalOcean
# - Go to: https://cloud.digitalocean.com/apps
# - Click "Create App"
# - Connect GitHub repo
# - Select "staging" branch
# - Follow: STAGING_DEPLOYMENT_STEPS.txt
```

**Read**: [`STAGING_DEPLOYMENT_STEPS.txt`](./STAGING_DEPLOYMENT_STEPS.txt) for detailed walkthrough

---

## ⚠️ Git Secret Issue (MUST FIX FIRST)

**Problem**: GitHub detected Anthropic API key in `backend/.env`

**Quick Fix**:
```
Visit: https://github.com/venudadi/preschoold-erp/security/secret-scanning/unblock-secret/33q7ZO2ikii6RoExgAjheGyw5YX
Click: "Allow secret"
```

**Proper Fix** (for production):
```bash
# Install git-filter-repo
# Windows: https://github.com/newren/git-filter-repo/releases

# Remove from history
git filter-repo --path backend/.env --invert-paths --force

# Re-add remote and push
git remote add origin https://github.com/venudadi/preschoold-erp.git
git push origin main --force
```

---

## 💰 Cost Breakdown

### Staging Environment
| Component | Size | Cost |
|-----------|------|------|
| Frontend | Static Site | **FREE** |
| Backend | Basic XXS | **$5/mo** |
| Database | Dev DB (1GB) | **$7/mo** |
| **TOTAL** | | **$12/mo** |

### Production Environment
| Component | Size | Cost |
|-----------|------|------|
| Frontend | Static Site | **FREE** |
| Backend | Basic XS (×2) | **$24/mo** |
| Database | Basic 1GB | **$15/mo** |
| **TOTAL** | | **$39/mo** |

---

## 🌿 Git Workflow

```
feature/xxx → staging → main
    ↓            ↓        ↓
  develop     test     production
```

### Commands
```bash
# Feature development
git checkout -b feature/my-feature
git commit -m "feat: add feature"

# Deploy to staging
git checkout staging
git merge feature/my-feature
git push origin staging  # 🚀 Auto-deploys to staging

# Deploy to production (after testing)
git checkout main
git merge staging
git push origin main  # 🚀 Auto-deploys to production
```

---

## 🔗 Important URLs

### After Deployment
- **Staging**: `https://preschool-erp-staging-xxxxx.ondigitalocean.app`
- **Production**: `https://preschool-erp-xxxxx.ondigitalocean.app`
- **Health Check**: `https://backend-xxxxx.ondigitalocean.app/api/health`

### DigitalOcean
- **Apps Dashboard**: https://cloud.digitalocean.com/apps
- **Documentation**: https://docs.digitalocean.com/products/app-platform/
- **Support**: https://cloud.digitalocean.com/support

### GitHub
- **Repository**: https://github.com/venudadi/preschoold-erp
- **Secret Alert**: https://github.com/venudadi/preschoold-erp/security/secret-scanning

---

## 🛠️ Environment Variables

### Required for Backend
```bash
NODE_ENV=staging                              # or production
PORT=5001
JWT_SECRET=your_strong_random_secret_here    # Generate new!
DB_HOST=${preschool-db.HOSTNAME}             # Auto-injected
DB_PORT=${preschool-db.PORT}                 # Auto-injected
DB_USER=${preschool-db.USERNAME}             # Auto-injected
DB_PASSWORD=${preschool-db.PASSWORD}         # Auto-injected
DB_NAME=${preschool-db.DATABASE}             # Auto-injected
```

### Required for Frontend
```bash
VITE_API_URL=${backend.PUBLIC_URL}           # Auto-injected
```

### Generate JWT_SECRET
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## ✅ Deployment Checklist

### Before Staging Deployment
- [ ] Git secret issue resolved
- [ ] Staging branch created
- [ ] DigitalOcean account created
- [ ] JWT_SECRET generated

### During Deployment
- [ ] Connected GitHub repository
- [ ] Selected "staging" branch
- [ ] Configured 3 components (frontend, backend, database)
- [ ] Set environment variables
- [ ] Added PRE_DEPLOY migration job

### After Deployment
- [ ] All components show "Active" status
- [ ] Can access staging URL
- [ ] Login works
- [ ] No errors in logs
- [ ] Database connected
- [ ] Auto-deploy tested

### Before Production
- [ ] Tested thoroughly on staging
- [ ] Fixed all bugs
- [ ] Generated new production JWT_SECRET
- [ ] Configured production database
- [ ] Set up monitoring/alerts
- [ ] Custom domain configured (optional)

---

## 📚 Documentation Files

| File | Purpose | When to Use |
|------|---------|-------------|
| **STAGING_DEPLOYMENT_STEPS.txt** | Step-by-step staging deployment | **START HERE** |
| DIGITALOCEAN_DEPLOYMENT.md | Comprehensive DO guide | Reference guide |
| DEPLOYMENT.md | Docker deployment | Alternative method |
| DEPLOYMENT_QUICK_START.md | Docker quick start | Docker users |
| QUICK_REFERENCE.md | This file | Quick lookup |

---

## 🔍 Troubleshooting

### Build Fails
```bash
# Check build logs in DigitalOcean console
# Common fix: Ensure --legacy-peer-deps in build command
```

### Database Connection Failed
```bash
# Verify environment variables use ${preschool-db.XXX} format
# Check database is in "Active" state
```

### Frontend Shows White Screen
```bash
# Check browser console (F12)
# Verify VITE_API_URL is set
# Verify output directory is /dist
```

### Can't Push to Staging Branch
```bash
# Git secret issue - see "Git Secret Issue" section above
```

**Full troubleshooting**: See STAGING_DEPLOYMENT_STEPS.txt (Troubleshooting section)

---

## 🎯 Next Steps

1. **Read**: [`STAGING_DEPLOYMENT_STEPS.txt`](./STAGING_DEPLOYMENT_STEPS.txt)
2. **Fix**: Git secret issue (Step 1 in deployment guide)
3. **Deploy**: Follow steps 2-13 in deployment guide
4. **Test**: Verify staging works perfectly
5. **Production**: Deploy to main branch when ready

---

## 📞 Support

- **Issues**: https://github.com/venudadi/preschoold-erp/issues
- **DigitalOcean Support**: https://cloud.digitalocean.com/support
- **Documentation**: See files listed above

---

**Last Updated**: 2025-01-09
**Deployment Method**: DigitalOcean App Platform
**Status**: Ready for staging deployment ✅
