@echo off
REM Run DB migration (example: using sequelize-cli, adjust as needed)
REM npm run migrate

REM Run backend health check (simple: check if server starts, or run a health endpoint)
cd backend
start /B cmd /C "npm start > health_check.log 2>&1 && curl http://localhost:3001/health || echo Backend health check failed! > health_check_error.log && exit /b 1"

REM Optionally, parse health_check.log for errors and alert
REM (Add more sophisticated checks as needed)

echo Health check script executed. See health_check.log and health_check_error.log for results.
