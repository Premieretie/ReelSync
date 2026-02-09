const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE, // Connect directly to DB after init
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initDb() {
  // Create a separate connection to check/create database first
  const setupConnection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD
  });
  
  try {
    await setupConnection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.MYSQL_DATABASE}`);
    await setupConnection.end();

    const connection = await pool.getConnection();
    
    // Movies Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS movies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        movie_title VARCHAR(255) NOT NULL,
        year INT,
        genre VARCHAR(100),
        sub_genre VARCHAR(100),
        story_type VARCHAR(100),
        tone VARCHAR(100),
        main_theme VARCHAR(100),
        setting_location VARCHAR(100),
        director VARCHAR(100),
        rating DECIMAL(3, 1),
        poster_path VARCHAR(255)
      )
    `);

    // Sessions
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(10) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Users
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id INT,
        nickname VARCHAR(255),
        slider_values JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
      )
    `);

    // History
    await connection.query(`
      CREATE TABLE IF NOT EXISTS history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id INT,
        movie_id INT,
        movie_title VARCHAR(255),
        movie_data JSON,
        watched_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        rating INT,
        FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
      )
    `);

    // Shared List
    await connection.query(`
      CREATE TABLE IF NOT EXISTS shared_list (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id INT,
        movie_id INT,
        movie_data JSON,
        added_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
      )
    `);

    // Votes
    await connection.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id INT,
        movie_id INT,
        user_id INT,
        vote_value INT,
        FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Seed Sample Data if empty
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM movies');
    if (rows[0].count === 0) {
        console.log("Seeding movies...");
        const sql = `INSERT INTO movies (movie_title, year, genre, sub_genre, story_type, tone, main_theme, setting_location, director, rating) VALUES ?`;
        const values = [
            ['The Shawshank Redemption', 1994, 'Drama', 'Prison', 'Redemption', 'Serious', 'Hope', 'Prison', 'Frank Darabont', 9.3],
            ['The Dark Knight', 2008, 'Action', 'Superhero', 'Crime', 'Dark', 'Chaos', 'Gotham', 'Christopher Nolan', 9.0],
            ['Inception', 2010, 'Sci-Fi', 'Heist', 'Mind-bending', 'Serious', 'Dreams', 'Mind', 'Christopher Nolan', 8.8],
            ['Pulp Fiction', 1994, 'Crime', 'Black Comedy', 'Non-linear', 'Quirky', 'Redemption', 'Los Angeles', 'Quentin Tarantino', 8.9],
            ['Forrest Gump', 1994, 'Drama', 'Romance', 'Epic', 'Emotional', 'Destiny', 'USA', 'Robert Zemeckis', 8.8],
            ['The Matrix', 1999, 'Sci-Fi', 'Cyberpunk', 'Hero Journey', 'Serious', 'Reality', 'Simulation', 'Lana Wachowski', 8.7],
            ['Monty Python and the Holy Grail', 1975, 'Comedy', 'Satire', 'Quest', 'Silly', 'Absurdism', 'England', 'Terry Gilliam', 8.2],
            ['The Grand Budapest Hotel', 2014, 'Comedy', 'Drama', 'Caper', 'Quirky', 'Loyalty', 'Hotel', 'Wes Anderson', 8.1],
            ['Interstellar', 2014, 'Sci-Fi', 'Space', 'Exploration', 'Emotional', 'Love', 'Space', 'Christopher Nolan', 8.6],
            ['Parasite', 2019, 'Thriller', 'Dark Comedy', 'Social Satire', 'Dark', 'Class', 'Seoul', 'Bong Joon-ho', 8.5]
        ];
        await connection.query(sql, [values]);
    }

    console.log("Database initialized successfully");
    connection.release();
  } catch (err) {
    console.error("Error initializing database:", err);
  }
}

// Initialize on require
initDb();

module.exports = {
    query: (text, params) => pool.execute(text, params),
    pool
};
