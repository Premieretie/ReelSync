-- Existing Tables (Keep them, but we add new ones)

-- Accounts (Persistent Users)
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

-- Update History to support linking to an account (Persistent History)
-- We need to check if column exists first or just alter. 
-- MySQL 'IF NOT EXISTS' for columns is tricky in standard SQL, usually handled by migration scripts.
-- For this simplified env, I'll attempt to add it, or we assume this file is run to init.
-- Since tables might exist, I will use a separate ALTER statement block in the JS init if needed, 
-- but for the schema file I'll define the ideal state.

-- Modify History to have account_id
-- ALTER TABLE history ADD COLUMN account_id INT NULL;
-- ALTER TABLE history ADD FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL;
