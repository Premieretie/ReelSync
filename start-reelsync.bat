@echo off
echo Starting ReelSync...
start "ReelSync Server" cmd /k "cd server && npm start"
start "ReelSync Client" cmd /k "cd client && npm run dev"
echo Done.
