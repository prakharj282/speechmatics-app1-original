@echo off
echo Starting Sales Copilot Bridge...

:: 1. Navigate to the project folder relative to this script
:: %~dp0 is the folder where this .bat file lives.
cd /d "%~dp0speechmatics-diarization-app"

:: 2. Auto-Install Dependencies if missing (First run on new PC)
if not exist "node_modules" (
    echo First time run detected! Installing dependencies...
    echo This may take a few minutes. Please wait.
    call npm install
)

:: 3. Open the Browser
start http://localhost:5180

:: 4. Run the Server
echo Starting the server process...
call npm.cmd run dev

echo.
echo Server stopped.
pause
