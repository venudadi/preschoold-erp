@echo off
REM ================================================================================
REM Push Cleaned Git History to GitHub
REM ================================================================================

echo.
echo ================================================================================
echo PUSH CLEANED HISTORY TO GITHUB
echo ================================================================================
echo.
echo This script will help you push the cleaned git history to GitHub.
echo The backend/.env file has been removed from all commits.
echo.

REM Check if we're on main branch
git branch --show-current > temp_branch.txt
set /p CURRENT_BRANCH=<temp_branch.txt
del temp_branch.txt

if not "%CURRENT_BRANCH%"=="main" (
    echo ERROR: Not on main branch (currently on %CURRENT_BRANCH%)
    echo Please run: git checkout main
    pause
    exit /b 1
)

echo Current branch: %CURRENT_BRANCH% ✓
echo.

echo ================================================================================
echo AUTHENTICATION OPTIONS
echo ================================================================================
echo.
echo Choose how you want to authenticate:
echo.
echo 1. Use GitHub Personal Access Token (Recommended)
echo 2. Use SSH key
echo 3. Try current credentials (may fail if not configured)
echo.
set /p AUTH_CHOICE=Enter choice (1, 2, or 3):

if "%AUTH_CHOICE%"=="1" goto TOKEN_AUTH
if "%AUTH_CHOICE%"=="2" goto SSH_AUTH
if "%AUTH_CHOICE%"=="3" goto CURRENT_AUTH

echo Invalid choice. Exiting.
pause
exit /b 1

:TOKEN_AUTH
echo.
echo ================================================================================
echo PERSONAL ACCESS TOKEN AUTHENTICATION
echo ================================================================================
echo.
echo First, create a Personal Access Token:
echo 1. Go to: https://github.com/settings/tokens
echo 2. Click "Generate new token (classic)"
echo 3. Select scopes: repo (full control)
echo 4. Click "Generate token"
echo 5. Copy the token
echo.
echo Opening GitHub tokens page in browser...
start https://github.com/settings/tokens
echo.
echo.
set /p TOKEN=Paste your GitHub Personal Access Token here:

if "%TOKEN%"=="" (
    echo ERROR: No token provided
    pause
    exit /b 1
)

echo.
echo Pushing to GitHub using token...
echo.

git push https://%TOKEN%@github.com/venudadi/preschoold-erp.git main --force

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================================================
    echo SUCCESS! Main branch pushed successfully
    echo ================================================================================
    echo.
    echo Updating remote URL to use token for future pushes...
    git remote set-url origin https://%TOKEN%@github.com/venudadi/preschoold-erp.git
    echo.
    echo Now pushing staging branch...
    git checkout -b staging 2>nul || git checkout staging
    git push origin staging --force
    echo.
    echo ✓ Both main and staging branches pushed successfully!
    echo.
    goto SUCCESS
) else (
    echo.
    echo ERROR: Push failed. Please check:
    echo 1. Token is valid and has 'repo' scope
    echo 2. You have write access to the repository
    echo.
    pause
    exit /b 1
)

:SSH_AUTH
echo.
echo ================================================================================
echo SSH KEY AUTHENTICATION
echo ================================================================================
echo.
echo Checking for SSH key...
if exist "%USERPROFILE%\.ssh\id_rsa.pub" (
    echo SSH key found: %USERPROFILE%\.ssh\id_rsa.pub
    echo.
    echo Your public key:
    type "%USERPROFILE%\.ssh\id_rsa.pub"
    echo.
    echo.
    echo Copy the key above and add it to GitHub:
    echo 1. Go to: https://github.com/settings/keys
    echo 2. Click "New SSH key"
    echo 3. Paste the key
    echo 4. Click "Add SSH key"
    echo.
    start https://github.com/settings/keys
    echo.
    pause
) else (
    echo No SSH key found. Generating one...
    ssh-keygen -t rsa -b 4096 -C "venuvikasdadi@gmail.com"
    echo.
    echo SSH key generated. Add it to GitHub (opening browser...)
    start https://github.com/settings/keys
    echo.
    echo Copy this key:
    type "%USERPROFILE%\.ssh\id_rsa.pub"
    echo.
    pause
)

echo.
echo Changing remote to use SSH...
git remote set-url origin git@github.com:venudadi/preschoold-erp.git
echo.
echo Pushing to GitHub using SSH...
git push origin main --force

if %ERRORLEVEL% EQU 0 (
    echo.
    echo SUCCESS! Main branch pushed successfully
    echo.
    git checkout -b staging 2>nul || git checkout staging
    git push origin staging --force
    echo.
    goto SUCCESS
) else (
    echo.
    echo ERROR: SSH push failed
    echo.
    pause
    exit /b 1
)

:CURRENT_AUTH
echo.
echo Attempting push with current credentials...
echo.
git push origin main --force

if %ERRORLEVEL% EQU 0 (
    echo.
    echo SUCCESS! Main branch pushed successfully
    echo.
    git checkout -b staging 2>nul || git checkout staging
    git push origin staging --force
    echo.
    goto SUCCESS
) else (
    echo.
    echo ERROR: Push failed with current credentials
    echo Please choose option 1 or 2 for authentication
    echo.
    pause
    exit /b 1
)

:SUCCESS
echo ================================================================================
echo DEPLOYMENT READY!
echo ================================================================================
echo.
echo ✓ Git history cleaned (backend/.env removed)
echo ✓ Main branch pushed to GitHub
echo ✓ Staging branch created and pushed
echo ✓ Ready for DigitalOcean deployment
echo.
echo Next steps:
echo 1. Go to: https://github.com/venudadi/preschoold-erp
echo 2. Verify both main and staging branches exist
echo 3. Open: STAGING_DEPLOYMENT_STEPS.txt
echo 4. Go to STEP 3: "CREATE DIGITALOCEAN ACCOUNT"
echo 5. Follow the deployment guide
echo.
pause
