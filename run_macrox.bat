@echo off
setlocal
echo Starting MacroX Development Environment...
echo.

:: Add Cargo to PATH for the current session
set "PATH=%PATH%;%USERPROFILE%\.cargo\bin"

:: Check if npm is installed
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: npm is not installed or not in PATH.
    pause
    exit /b
)

:: Free port 1420 if it's in use
echo Checking if port 1420 is free...
powershell -Command "$p = Get-NetTCPConnection -LocalPort 1420 -ErrorAction SilentlyContinue; if($p) { Get-Process -Id $p.OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue }"

:: Run the Tauri dev command
echo Running npm run tauri dev...
npm run tauri dev

if %errorlevel% neq 0 (
    echo.
    echo Application exited with an error.
    pause
)
endlocal
