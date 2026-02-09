@echo off
echo Starting MovieBuff...
cd movieBuff
start "MovieBuff Server" cmd /k "cd server && npm start"
start "MovieBuff Client" cmd /k "cd client && npm run dev"
echo Done.
