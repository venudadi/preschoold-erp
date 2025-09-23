@echo off
REM Instructions for starting servers in VS Code integrated terminals
echo ========================================
echo  PRESCHOOL ERP - SERVER STARTUP GUIDE
echo ========================================
echo.
echo To start both servers in VS Code integrated terminals:
echo.
echo METHOD 1: Using batch files (Windows CMD)
echo 1. Open VS Code integrated terminal (Ctrl+`)
echo 2. In first terminal, run:
echo    .\server_management_scripts\start_backend.bat
echo.
echo 3. Open a new terminal (Ctrl+Shift+`)
echo 4. In second terminal, run:
echo    .\server_management_scripts\start_frontend.bat
echo.
echo METHOD 2: Direct commands (PowerShell)
echo 1. Backend terminal:  cd backend; npm start
echo 2. Frontend terminal: cd frontend; npm run dev
echo.
echo METHOD 3: Direct commands (CMD)
echo 1. Backend terminal:  cd backend ^&^& npm start
echo 2. Frontend terminal: cd frontend ^&^& npm run dev
echo.
echo Both servers will be visible in your VS Code terminals
echo Backend: http://localhost:5001
echo Frontend: http://localhost:5173 (or next available port)
echo.
pause
