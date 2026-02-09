CREATE DATABASE IF NOT EXISTS moviebuff_db;
USE moviebuff_db;

-- Movies Table
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
  poster_path VARCHAR(255),
  youtube_key VARCHAR(50)
);

-- Users (now 'accounts' for auth)
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
);

-- Favorites (Linked to Accounts)
CREATE TABLE IF NOT EXISTS favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  account_id INT,
  movie_id INT,
  movie_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  UNIQUE KEY unique_fav (account_id, movie_id)
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(10) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT,
  nickname VARCHAR(255),
  slider_values JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- History
CREATE TABLE IF NOT EXISTS history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT,
  movie_id INT,
  movie_title VARCHAR(255),
  movie_data JSON,
  watched_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  rating INT,
  FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Shared List
CREATE TABLE IF NOT EXISTS shared_list (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT,
  movie_id INT,
  movie_data JSON,
  added_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Votes
CREATE TABLE IF NOT EXISTS votes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT,
  movie_id INT,
  user_id INT,
  vote_value INT,
  FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
