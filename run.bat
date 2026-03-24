@echo off
echo Building the application...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b %errorlevel%
)

echo Starting Electron...
call npm start
pause
