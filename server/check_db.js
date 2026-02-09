const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE
        });
        const [rows] = await connection.query('SELECT COUNT(*) as count FROM movies');
        console.log('Current Movie Count:', rows[0].count);
        
        const [samples] = await connection.query('SELECT movie_title FROM movies LIMIT 5');
        console.log('Sample Titles:', samples.map(m => m.movie_title));

        await connection.end();
    } catch (err) {
        console.error('Error:', err.message);
    }
}

check();
