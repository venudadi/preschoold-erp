@echo off
REM ================================================================================
REM Git History Cleanup Script - Remove backend/.env from all commits
REM ================================================================================

echo.
echo ================================================================================
echo PRESCHOOL ERP - GIT HISTORY CLEANUP
echo ================================================================================
echo.
echo This script will remove backend/.env file from your entire git history.
echo This is necessary because GitHub detected an Anthropic API key in the file.
echo.
echo WARNING: This will rewrite git history. Make sure you have:
echo   1. No uncommitted changes (git status should be clean)
echo   2. A backup of your repository (optional but recommended)
echo.

pause

echo.
echo Step 1: Checking git status...
echo.
git status

echo.
echo Is your working directory clean? (Y/N)
set /p CLEAN_CHECK=
if /i not "%CLEAN_CHECK%"=="Y" (
    echo.
    echo Please commit or stash your changes first, then run this script again.
    pause
    exit /b 1
)

echo.
echo Step 2: Checking if git-filter-repo is installed...
echo.

where git-filter-repo >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo git-filter-repo is NOT installed.
    echo.
    echo Please install it first:
    echo.
    echo Option 1 - Using Python pip:
    echo   pip install git-filter-repo
    echo.
    echo Option 2 - Manual download:
    echo   1. Download from: https://github.com/newren/git-filter-repo/releases
    echo   2. Save git-filter-repo file to C:\Windows\System32\ or add to PATH
    echo   3. Run this script again
    echo.
    pause
    exit /b 1
)

echo git-filter-repo is installed ✓
echo.

echo Step 3: Creating backup of current state...
echo.
git branch backup-before-cleanup

echo Backup branch created: backup-before-cleanup ✓
echo.

echo Step 4: Removing backend/.env from git history...
echo This may take a few minutes...
echo.

git filter-repo --path backend/.env --invert-paths --force

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================================================
    echo SUCCESS! backend/.env has been removed from git history
    echo ================================================================================
    echo.
    echo Next steps:
    echo.
    echo 1. Re-add the remote repository:
    echo    git remote add origin https://github.com/venudadi/preschoold-erp.git
    echo.
    echo 2. Force push to update GitHub:
    echo    git push origin main --force
    echo.
    echo 3. If you have other branches, force push them too:
    echo    git push origin staging --force
    echo.
    echo 4. If the force push is rejected, you may need to temporarily disable
    echo    branch protection rules in GitHub Settings.
    echo.
    echo Your backup is saved in branch: backup-before-cleanup
    echo.
) else (
    echo.
    echo ERROR: git-filter-repo failed
    echo Please check the error message above and try again.
    echo.
)

pause
