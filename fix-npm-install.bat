@echo off
echo Fixing npm install issues with Windows path spaces...
echo.

REM Get the short path name for the current directory
for %%i in ("%CD%") do set SHORT_PATH=%%~si

echo Current directory: %CD%
echo Short path: %SHORT_PATH%
echo.

REM Change to frontend directory using short path
cd /d "%SHORT_PATH%\frontend"

echo Cleaning npm cache...
npm cache clean --force

echo.
echo Removing node_modules...
if exist node_modules rmdir /s /q node_modules

echo.
echo Removing package-lock.json...
if exist package-lock.json del package-lock.json

echo.
echo Installing dependencies using short path...
npm install --no-optional --legacy-peer-deps

echo.
echo Attempting build...
npm run build

echo.
echo Done! Check output above for any remaining errors.
pause