@echo off
echo Deploying ReelSync Client to GitHub Pages...
cd client
echo Cleaning old build...
if exist dist rmdir /s /q dist
echo Building...
call npm run build
echo Pushing to GitHub...
call npx gh-pages -d dist
echo.
echo ========================================================
echo Deployment Complete!
echo 1. Wait 2-3 minutes for GitHub to process.
echo 2. Open your site in an INCOGNITO window.
echo 3. If you see an ngrok warning, click "Visit Site".
echo ========================================================
pause
