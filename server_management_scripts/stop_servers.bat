@echo off
REM Stop all node processes (backend and frontend)
taskkill /F /IM node.exe
REM Optionally, close all cmd windows started by the scripts (if needed)
echo All Node.js servers stopped.
pause
