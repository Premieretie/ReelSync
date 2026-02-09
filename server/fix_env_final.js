const fs = require('fs');
const path = require('path');

const tokenPart1 = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmYWMxNDY4Mzk1NWU4MDZkMTBiOTMwYWU4MzFhNmM4OSIsIm5iZiI6MTc3MDU5ODIxOS40NTcsInN1YiI6IjY5ODkyZjRiMGFlOWRkZjljNjhlNzEyZiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.HB2VFZQKkpMAr6WBb6tPMqpDCLAAtQ7NwRJlJNlijqA";
const apiKey = "fac14683955e806d10b930ae831a6c89";

const envContent = [
    "PORT=3002",
    "MYSQL_HOST=localhost",
    "MYSQL_USER=root",
    "MYSQL_PASSWORD=LetHerRip69!",
    "MYSQL_DATABASE=moviebuff_db",
    `TMDB_READ_TOKEN=${tokenPart1}`,
    `TMDB_API_KEY=${apiKey}`
].join('\n');

fs.writeFileSync(path.join(__dirname, '.env'), envContent);
console.log('.env file repaired successfully');
