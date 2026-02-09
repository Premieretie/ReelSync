const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
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
        is_public BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add is_public to sessions if it doesn't exist
    try {
        await connection.query(`ALTER TABLE sessions ADD COLUMN is_public BOOLEAN DEFAULT FALSE`);
    } catch (e) {
        if (e.code !== 'ER_DUP_FIELDNAME') {
            // console.log("Note: is_public column might already exist", e.message);
        }
    }

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
        account_id INT,
        FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE,
        FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE SET NULL
      )
    `);

    try {
        await connection.query(`ALTER TABLE history ADD COLUMN account_id INT`);
        await connection.query(`ALTER TABLE history ADD CONSTRAINT fk_history_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL`);
    } catch (e) {
        if (e.code !== 'ER_DUP_FIELDNAME') {
             // console.log("Columns might already exist", e.message);
        }
    }

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

    // --- Auth Tables ---

    // Accounts
    await connection.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        is_verified BOOLEAN DEFAULT FALSE,
        verification_token VARCHAR(255),
        subscription_status ENUM('inactive', 'active') DEFAULT 'inactive',
        subscription_end_date DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add new columns to accounts if they don't exist (Migration)
    try {
        await connection.query(`ALTER TABLE accounts ADD COLUMN email VARCHAR(255) UNIQUE`);
        await connection.query(`ALTER TABLE accounts ADD COLUMN is_verified BOOLEAN DEFAULT FALSE`);
        await connection.query(`ALTER TABLE accounts ADD COLUMN verification_token VARCHAR(255)`);
        await connection.query(`ALTER TABLE accounts ADD COLUMN subscription_status ENUM('inactive', 'active') DEFAULT 'inactive'`);
        await connection.query(`ALTER TABLE accounts ADD COLUMN subscription_end_date DATETIME`);
        console.log("Migration: Added new columns to accounts table.");
    } catch (e) {
        if (e.code !== 'ER_DUP_FIELDNAME') {
             console.error("Migration Error (Non-fatal if columns exist):", e.message);
        }
    }

    // Favorites
    await connection.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        account_id INT,
        movie_id INT,
        movie_data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE CASCADE,
        UNIQUE KEY unique_fav (account_id, movie_id)
      )
    `);

    // Add account_id to history if it doesn't exist
    try {
        await connection.query(`ALTER TABLE history ADD COLUMN account_id INT NULL`);
        await connection.query(`ALTER TABLE history ADD FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL`);
    } catch (e) {
        if (e.code !== 'ER_DUP_FIELDNAME') {
            // console.log("Note: account_id column might already exist", e.message);
        }
    }

    // Add youtube_key to movies if it doesn't exist
    try {
        await connection.query(`ALTER TABLE movies ADD COLUMN youtube_key VARCHAR(50)`);
    } catch (e) {
        if (e.code !== 'ER_DUP_FIELDNAME') {
            // console.log("Note: youtube_key column might already exist", e.message);
        }
    }
    
    // Seed Sample Data if empty
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM movies');
    if (rows[0].count === 0) {
        console.log("Seeding movies...");
        const sql = `INSERT INTO movies (movie_title, year, genre, sub_genre, story_type, tone, main_theme, setting_location, director, rating, youtube_key) VALUES ?`;
        const values = [
            ['The Shawshank Redemption', 1994, 'Drama', 'Prison', 'Redemption', 'Serious', 'Hope', 'Prison', 'Frank Darabont', 9.3, 'PLl99DlL6b4'],
            ['The Dark Knight', 2008, 'Action', 'Superhero', 'Crime', 'Dark', 'Chaos', 'Gotham', 'Christopher Nolan', 9.0, 'EXeTwQWrcwY'],
            ['Inception', 2010, 'Sci-Fi', 'Heist', 'Mind-bending', 'Serious', 'Dreams', 'Mind', 'Christopher Nolan', 8.8, 'YoHD9XEInc0'],
            ['Pulp Fiction', 1994, 'Crime', 'Black Comedy', 'Non-linear', 'Quirky', 'Redemption', 'Los Angeles', 'Quentin Tarantino', 8.9, 's7EdQ4FqbhY'],
            ['Forrest Gump', 1994, 'Drama', 'Romance', 'Epic', 'Emotional', 'Destiny', 'USA', 'Robert Zemeckis', 8.8, 'bLvqoHBptjg'],
            ['The Matrix', 1999, 'Sci-Fi', 'Cyberpunk', 'Hero Journey', 'Serious', 'Reality', 'Simulation', 'Lana Wachowski', 8.7, 'vKQi3bBA1y8'],
            ['Monty Python and the Holy Grail', 1975, 'Comedy', 'Satire', 'Quest', 'Silly', 'Absurdism', 'England', 'Terry Gilliam', 8.2, 'urRkGvhXc8w'],
            ['The Grand Budapest Hotel', 2014, 'Comedy', 'Drama', 'Caper', 'Quirky', 'Loyalty', 'Hotel', 'Wes Anderson', 8.1, '1Fg5iWmQjwk'],
            ['Interstellar', 2014, 'Sci-Fi', 'Space', 'Exploration', 'Emotional', 'Love', 'Space', 'Christopher Nolan', 8.6, 'zSWdZVtXT7E'],
            ['Parasite', 2019, 'Thriller', 'Dark Comedy', 'Social Satire', 'Dark', 'Class', 'Seoul', 'Bong Joon-ho', 8.5, '5xH0HfJHsaY'],
            
            // New Movies for new sliders
            ['Get Out', 2017, 'Horror', 'Thriller', 'Psychological', 'Scary', 'Racism', 'USA', 'Jordan Peele', 7.7, 'DzfpyUB60YY'],
            ['Spirited Away', 2001, 'Animation', 'Fantasy', 'Coming of Age', 'Whimsical', 'Identity', 'Bathhouse', 'Hayao Miyazaki', 8.6, 'ByXuk9QqQkk'],
            ['Mad Max: Fury Road', 2015, 'Action', 'Post-Apocalyptic', 'Chase', 'Intense', 'Survival', 'Wasteland', 'George Miller', 8.1, 'hEJnMQG9ev8'],
            ['Eternal Sunshine of the Spotless Mind', 2004, 'Romance', 'Sci-Fi', 'Mind-bending', 'Emotional', 'Memory', 'Mind', 'Michel Gondry', 8.3, '07-QBnEkgXU'],
            ['The Shining', 1980, 'Horror', 'Psychological', 'Haunted House', 'Scary', 'Isolation', 'Hotel', 'Stanley Kubrick', 8.4, 'S014oGZiSdI'],
            ['Spider-Man: Into the Spider-Verse', 2018, 'Animation', 'Superhero', 'Origin Story', 'Exciting', 'Family', 'NYC', 'Rodney Rothman', 8.4, 'g4Hbz2jLxvQ'],
            ['Arrival', 2016, 'Sci-Fi', 'Drama', 'First Contact', 'Slow', 'Communication', 'Global', 'Denis Villeneuve', 7.9, 'tFMo3UJ4B4g'],
            ['Knives Out', 2019, 'Comedy', 'Mystery', 'Whodunit', 'Quirky', 'Family', 'Mansion', 'Rian Johnson', 7.9, 'qGqiHJTsRkQ'],
            ['Hereditary', 2018, 'Horror', 'Drama', 'Occult', 'Disturbing', 'Grief', 'Home', 'Ari Aster', 7.3, 'V6wWKNij_1M'],
            ['Paddington 2', 2017, 'Comedy', 'Family', 'Adventure', 'Comforting', 'Kindness', 'London', 'Paul King', 7.8, '52x5HJ9H8DM']
        ];
        await connection.query(sql, [values]);
    } else {
        // Update existing rows with youtube keys if they are missing (Best effort for sample data)
        const updates = [
            ['The Shawshank Redemption', 'PLl99DlL6b4'],
            ['The Dark Knight', 'EXeTwQWrcwY'],
            ['Inception', 'YoHD9XEInc0'],
            ['Pulp Fiction', 's7EdQ4FqbhY'],
            ['Forrest Gump', 'bLvqoHBptjg'],
            ['The Matrix', 'vKQi3bBA1y8'],
            ['Monty Python and the Holy Grail', 'urRkGvhXc8w'],
            ['The Grand Budapest Hotel', '1Fg5iWmQjwk'],
            ['Interstellar', 'zSWdZVtXT7E'],
            ['Parasite', '5xH0HfJHsaY']
        ];
        for (const [title, key] of updates) {
            await connection.query('UPDATE movies SET youtube_key = ? WHERE movie_title = ? AND (youtube_key IS NULL OR youtube_key = "")', [key, title]);
        }
    }

    // Ensure new slider movies exist (Upsert-like behavior)
    const newSliderMovies = [
        ['Get Out', 2017, 'Horror', 'Thriller', 'Psychological', 'Scary', 'Racism', 'USA', 'Jordan Peele', 7.7, 'DzfpyUB60YY'],
        ['Spirited Away', 2001, 'Animation', 'Fantasy', 'Coming of Age', 'Whimsical', 'Identity', 'Bathhouse', 'Hayao Miyazaki', 8.6, 'ByXuk9QqQkk'],
        ['Mad Max: Fury Road', 2015, 'Action', 'Post-Apocalyptic', 'Chase', 'Intense', 'Survival', 'Wasteland', 'George Miller', 8.1, 'hEJnMQG9ev8'],
        ['Eternal Sunshine of the Spotless Mind', 2004, 'Romance', 'Sci-Fi', 'Mind-bending', 'Emotional', 'Memory', 'Mind', 'Michel Gondry', 8.3, '07-QBnEkgXU'],
        ['The Shining', 1980, 'Horror', 'Psychological', 'Haunted House', 'Scary', 'Isolation', 'Hotel', 'Stanley Kubrick', 8.4, 'S014oGZiSdI'],
        ['Spider-Man: Into the Spider-Verse', 2018, 'Animation', 'Superhero', 'Origin Story', 'Exciting', 'Family', 'NYC', 'Rodney Rothman', 8.4, 'g4Hbz2jLxvQ'],
        ['Arrival', 2016, 'Sci-Fi', 'Drama', 'First Contact', 'Slow', 'Communication', 'Global', 'Denis Villeneuve', 7.9, 'tFMo3UJ4B4g'],
        ['Knives Out', 2019, 'Comedy', 'Mystery', 'Whodunit', 'Quirky', 'Family', 'Mansion', 'Rian Johnson', 7.9, 'qGqiHJTsRkQ'],
        ['Hereditary', 2018, 'Horror', 'Drama', 'Occult', 'Disturbing', 'Grief', 'Home', 'Ari Aster', 7.3, 'V6wWKNij_1M'],
        ['Paddington 2', 2017, 'Comedy', 'Family', 'Adventure', 'Comforting', 'Kindness', 'London', 'Paul King', 7.8, '52x5HJ9H8DM']
    ];

    for (const movie of newSliderMovies) {
        const [exists] = await connection.query('SELECT id FROM movies WHERE movie_title = ?', [movie[0]]);
        if (exists.length === 0) {
            await connection.query(
                `INSERT INTO movies (movie_title, year, genre, sub_genre, story_type, tone, main_theme, setting_location, director, rating, youtube_key) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                movie
            );
            console.log(`Added new movie: ${movie[0]}`);
        }
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
