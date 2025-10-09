# Quick Start - Deployment Setup

## ⚠️ Important: Secret in Git History

GitHub has detected an Anthropic API key in your git history (`backend/.env` file). Before you can push to the staging branch, you need to resolve this.

### Option 1: Allow the Secret (Quick but not recommended for production)

Follow this GitHub URL to allow the secret:
https://github.com/venudadi/preschoold-erp/security/secret-scanning/unblock-secret/33q7ZO2ikii6RoExgAjheGyw5YX

### Option 2: Clean Git History (Recommended)

Remove the secret from git history:

```bash
# Install git-filter-repo (recommended tool)
# Windows: Download from https://github.com/newren/git-filter-repo/releases
# Linux/Mac: pip install git-filter-repo

# Clean the file from history
git filter-repo --path backend/.env --invert-paths

# Force push to update remote
git push origin main --force
```

### Option 3: Fresh Start (Simplest for new repos)

If this is a new deployment:

1. Create a new empty repository on GitHub
2. Update remote URL:
   ```bash
   git remote set-url origin <new-repo-url>
   git push -u origin main
   ```

## Setting Up Deployment

Once the secret issue is resolved:

### 1. Create Staging Branch

```bash
git checkout -b staging
git push -u origin staging
```

### 2. Configure GitHub Secrets

Go to: Repository → Settings → Secrets and variables → Actions

Add these secrets:
- `DOCKERHUB_USERNAME`: Your Docker Hub username
- `DOCKERHUB_TOKEN`: Create at https://hub.docker.com/settings/security

### 3. Configure Environment Files

**Staging:**
```bash
cp .env.staging.example .env.staging
# Edit .env.staging with your staging credentials
```

**Production:**
```bash
cp .env.production.example .env.production
# Edit .env.production with strong production credentials
```

**IMPORTANT:** Never commit `.env.staging` or `.env.production` files!

### 4. Deploy

**Local Development:**
```bash
docker-compose up -d
```

**Staging:**
```bash
export DOCKERHUB_USERNAME=yourusername
docker-compose -f docker-compose.staging.yml pull
docker-compose -f docker-compose.staging.yml up -d
```

**Production:**
```bash
export DOCKERHUB_USERNAME=yourusername
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## Git Workflow

```
feature/new-feature → staging → main (production)
```

1. **Develop**: Create feature branch from staging
2. **Test**: Merge to staging, automatic build triggered
3. **Deploy**: Merge staging to main, production build triggered

## What's Been Set Up

✅ **Frontend**: Dockerfile with Nginx (static site hosting)
✅ **Backend**: Dockerfile with Node.js
✅ **Database**: MySQL 8.0 with migrations
✅ **CI/CD**: GitHub Actions for automatic builds
✅ **Environments**: Separate staging and production configs
✅ **Monitoring**: Health checks and logging
✅ **Documentation**: Complete deployment guide in DEPLOYMENT.md

## Next Steps

1. Resolve the git secret issue (see above)
2. Configure GitHub secrets for Docker Hub
3. Set up environment files (.env.staging, .env.production)
4. Test local deployment: `docker-compose up -d`
5. Push to staging for automatic build

## Support

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive documentation.

## Database Migration Fixed

✅ Migration 028 (student pause functionality) - Fixed
✅ Migration 029 (digital portfolio schema) - Fixed
✅ All migrations now run successfully with proper error handling
