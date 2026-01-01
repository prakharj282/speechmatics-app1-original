@echo off
echo ===================================================
echo   DOWNLOADING CHANGES FROM CLOUD (GitHub)
echo   This will overwrite local changes with the Cloud version
echo ===================================================

:: 1. Fetch latest info from cloud
git fetch origin

:: 2. Force local files to match the cloud's main branch
git reset --hard origin/main

echo.
echo ===================================================
echo   DONE! Your computer is now synced with the cloud.
echo ===================================================
pause
