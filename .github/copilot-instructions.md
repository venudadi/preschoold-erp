# Preschool ERP System - AI Development Guide

## Architecture Overview

This is a full-stack Preschool Enterprise Resource Planning (ERP) system with:

- **Frontend**: React 18 with Vite, Material-UI, React Router
- **Backend**: Node.js with Express.js using ES modules
- **Database**: MySQL with 30+ migration files
- **Real-time**: Socket.io for WebSockets
- **Security**: JWT + Session tokens + CSRF protection

## Key Concepts

### Multi-Center Design
The system supports managing multiple preschool centers within one installation. All data is segregated by `center_id` in most tables. Ensure queries include center filtering.

### Role-Based Security
The system implements 8 distinct user roles with hierarchical permissions:
- `super_admin` → `owner` → `financial_manager` → `center_director` → `admin` → `academic_coordinator` → `teacher` → `parent`

### Authentication Flow
Authentication requires three tokens:
1. JWT token (`Authorization: Bearer xxx`)
2. Session token (`x-session-token` header)
3. CSRF token (`x-csrf-token` header)

Example from `authRoutes.js`:
```javascript
// After successful login:
const { sessionToken, csrfToken } = await createSession(user.id, ipAddress, userAgent);
```

## Development Workflow

### Setting Up Local Environment
1. Create `.env` file in root and backend directory with:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=preschool_erp
   JWT_SECRET=your_secure_jwt_secret
   JWT_REFRESH_SECRET=your_secure_refresh_secret
   FRONTEND_URL=http://localhost:5173
   ```

2. Install dependencies:
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. Run database migrations:
   ```bash
   cd backend && npm run migrate
   ```

### Running the Application
- Backend: `cd backend && npm run dev`
- Frontend: `cd frontend && npm run dev`

### Testing
- E2E tests: `npm run test:e2e`
- Create test users: `npm run setup:test-users`

## Coding Patterns

### API Route Pattern
Routes follow a structured pattern with validation, sanitization and rate-limiting:

```javascript
router.post(
  '/endpoint',
  validateInput([validationRules.email, validationRules.password]),
  async (req, res) => {
    try {
      // Implementation...
    } catch (error) {
      // Error handling with specific error codes
    }
  }
);
```

### Error Handling
Error responses include message and code:
```javascript
res.status(401).json({ 
  message: 'Authentication failed', 
  code: 'AUTH_FAILED' 
});
```

### Database Queries
Prefer parameterized queries for security:
```javascript
const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
```

## File Structure

- `/backend` - Express server with individual route files
- `/frontend` - React SPA with MUI components
- `/db_schema` - Database migration files
- `/testing_logs` - E2E test results
- `/uploads` - Local file upload storage

## Common Tasks

### Adding New API Endpoint
1. Create route handler in appropriate file (e.g., `studentRoutes.js`)
2. Add validation rules
3. Implement database queries with proper error handling
4. Add route to `index.js`

### Adding Frontend Feature
1. Create component in `/frontend/src/components`
2. Add page in `/frontend/src/pages` if needed
3. Update route in `App.jsx`
4. Add to navigation in `DashboardLayout.jsx`

## Testing
Always run E2E tests after significant changes:
```bash
npm run test:e2e
```