# Deployment Guide - Preschool ERP

This guide covers deploying the Preschool ERP system to staging and production environments using Docker.

## Architecture Overview

- **Frontend**: React SPA served as static files via Nginx
- **Backend**: Node.js/Express API server
- **Database**: MySQL 8.0
- **Container Registry**: Docker Hub
- **CI/CD**: GitHub Actions

## Prerequisites

1. Docker and Docker Compose installed
2. Docker Hub account
3. GitHub repository access
4. Server with Docker installed (for deployment)

## Quick Start - Local Development

```bash
# Build and run all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Access the application at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001
- MySQL: localhost:3306

## Git Workflow Setup

### 1. Create Staging Branch

```bash
# Create and push staging branch
git checkout -b staging
git push -u origin staging
```

### 2. Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add the following secrets:
- `DOCKERHUB_USERNAME`: Your Docker Hub username
- `DOCKERHUB_TOKEN`: Docker Hub access token (create at https://hub.docker.com/settings/security)

### 3. Branch Strategy

```
main (production)     ← merge from staging after testing
  ↑
staging               ← merge from feature branches
  ↑
feature/* branches    ← develop new features here
```

**Workflow:**

1. **Development**: Create feature branch from `staging`
   ```bash
   git checkout staging
   git checkout -b feature/your-feature-name
   # ... make changes ...
   git commit -m "feat: your feature"
   git push -u origin feature/your-feature-name
   ```

2. **Staging Deployment**: Merge to `staging` branch
   ```bash
   git checkout staging
   git merge feature/your-feature-name
   git push origin staging  # Triggers staging build
   ```

   This automatically:
   - Builds Docker images
   - Tags as `staging-YYYYMMDD-HHMMSS` and `staging-latest`
   - Pushes to Docker Hub

3. **Production Deployment**: Merge to `main` after testing
   ```bash
   git checkout main
   git merge staging
   git push origin main  # Triggers production build
   ```

   This automatically:
   - Builds Docker images
   - Tags as `prod-YYYYMMDD-HHMMSS` and `production-latest`
   - Pushes to Docker Hub

## Environment Configuration

### Staging Environment

1. Copy example environment file:
   ```bash
   cp .env.staging.example .env.staging
   ```

2. Edit `.env.staging` with your staging credentials:
   ```bash
   DB_PASSWORD=your_staging_db_password
   JWT_SECRET=your_staging_jwt_secret
   DOCKERHUB_USERNAME=yourusername
   ```

3. Deploy staging:
   ```bash
   docker-compose -f docker-compose.staging.yml pull
   docker-compose -f docker-compose.staging.yml up -d
   ```

### Production Environment

1. Copy example environment file:
   ```bash
   cp .env.production.example .env.production
   ```

2. Edit `.env.production` with strong production credentials:
   ```bash
   DB_PASSWORD=very_strong_password_here
   DB_ROOT_PASSWORD=very_strong_root_password
   JWT_SECRET=very_long_random_string_at_least_32_characters
   VITE_API_URL=https://api.yourdomain.com
   DOCKERHUB_USERNAME=yourusername
   ```

3. Deploy production:
   ```bash
   docker-compose -f docker-compose.prod.yml pull
   docker-compose -f docker-compose.prod.yml up -d
   ```

## Manual Build and Push

If you need to manually build and push images:

```bash
# Build images
docker build -t yourusername/preschool-erp-frontend:staging-latest ./frontend
docker build -t yourusername/preschool-erp-backend:staging-latest ./backend

# Push to Docker Hub
docker push yourusername/preschool-erp-frontend:staging-latest
docker push yourusername/preschool-erp-backend:staging-latest
```

## Database Migrations

Migrations run automatically when the backend starts. To run manually:

```bash
# Enter backend container
docker-compose exec backend sh

# Run migrations
node migrate.js

# Exit container
exit
```

### Post-Migration Integrity Check (IMPORTANT!)

After migrations complete, especially for first-time deployments or when upgrading from older schemas:

```bash
# Check database integrity
docker-compose exec backend npm run check:integrity
```

**What this does:**
- Validates all foreign key constraints are in place
- Checks for column type mismatches
- Automatically repairs missing constraints where possible
- Generates repair script for manual fixes if needed

**If issues are found:**
1. Review the generated `database_repair_script.sql`
2. Schedule a maintenance window (typically 5-15 minutes)
3. Apply the repair script during the maintenance window
4. Re-run integrity check to confirm all issues resolved

📖 **See [DATABASE_INTEGRITY_GUIDE.md](DATABASE_INTEGRITY_GUIDE.md) for detailed information**

## Monitoring and Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql

# Check container health
docker-compose ps
```

## Backup and Restore

### Backup Database

```bash
# Create backup directory
mkdir -p backups

# Backup production database
docker-compose -f docker-compose.prod.yml exec mysql mysqldump \
  -u root -p$DB_ROOT_PASSWORD preschool_erp > backups/backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Database

```bash
# Restore from backup
docker-compose -f docker-compose.prod.yml exec -T mysql mysql \
  -u root -p$DB_ROOT_PASSWORD preschool_erp < backups/backup_20240101_120000.sql
```

## Rollback Strategy

If a deployment fails, rollback to the previous version:

```bash
# Pull specific version by timestamp tag
docker pull yourusername/preschool-erp-frontend:prod-20240101-120000
docker pull yourusername/preschool-erp-backend:prod-20240101-120000

# Update docker-compose.prod.yml to use specific tags
# Then restart services
docker-compose -f docker-compose.prod.yml up -d
```

## SSL/TLS Configuration

For production HTTPS:

1. Obtain SSL certificates (Let's Encrypt recommended)
2. Place certificates in `./ssl` directory
3. Update `nginx.conf` to enable HTTPS:

```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    # ... rest of config
}
```

4. Restart frontend container:
   ```bash
   docker-compose -f docker-compose.prod.yml restart frontend
   ```

## Troubleshooting

### Database Connection Issues

```bash
# Check MySQL is running
docker-compose ps mysql

# Check MySQL logs
docker-compose logs mysql

# Test connection from backend
docker-compose exec backend node -e "require('./db.js')"
```

### Frontend Not Loading

```bash
# Check nginx logs
docker-compose logs frontend

# Verify build completed
docker-compose exec frontend ls -la /usr/share/nginx/html
```

### Permission Issues with Uploads

```bash
# Fix upload directory permissions
docker-compose exec backend chmod -R 755 /app/uploads
```

## Production Checklist

Before deploying to production:

- [ ] All environment variables set in `.env.production`
- [ ] Strong database passwords (min 16 characters)
- [ ] JWT_SECRET changed (min 32 characters)
- [ ] CORS_ORIGIN set to production domain
- [ ] SSL certificates configured
- [ ] Database backups scheduled
- [ ] Monitoring configured
- [ ] Tested on staging environment
- [ ] DNS records configured
- [ ] Firewall rules configured

## Maintenance

### Update Images

```bash
# Pull latest images
docker-compose pull

# Restart with new images
docker-compose up -d
```

### Clean Up Old Images

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune
```

## Support

For issues or questions, create an issue in the GitHub repository.
