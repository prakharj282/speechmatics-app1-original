@echo off
echo ===================================================
echo   UPLOADING CHANGES TO CLOUD (GitHub)
echo   This will make THIS computer the Source of Truth
echo ===================================================

:: 1. Ensure we are on the main branch (or create it from current state)
git checkout -B main

:: 2. Add all files
git add .

:: 3. Commit (if there are changes)
git commit -m "Auto-sync from Computer 1"

:: 4. Push to cloud (Force overwrites the cloud with THIS computer's version)
git push -u origin main --force

echo.
echo ===================================================
echo   DONE! Your code is now safely on the cloud.
echo   Go to Computer 2 and run 'download_changes.bat'
echo ===================================================
pause
