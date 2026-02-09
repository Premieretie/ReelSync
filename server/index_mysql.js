require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticateToken, JWT_SECRET } = require('./middleware');
const db = require('./database_mysql');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors({
  origin: ['http://localhost:5173', 'https://premieretie.github.io', 'https://borty-ernesto-fairily.ngrok-free.dev'],
  credentials: true
}));
app.use(express.json());

// --- Helper Functions ---

const generateSessionCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const getRandomModifiers = () => {
  const modifiers = [
    "Popcorn Mandatory 🍿", "Blanket Fort Mode ⛺", "No Phones Allowed 📵", 
    "Critique Accents 🗣️", "Guess the Twist 😱", "Rate Every Outfit 👗",
    "Drink Every Time Someone Says 'No' 🥤", "Lights Off 🌑", "Surround Sound Max 🔊",
    "Silent Snacks Only 🤫", "Subtitles On 📝", "Predict the Ending 🔮"
  ];
  const shuffled = modifiers.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
};

const generateNightProfile = (avg) => {
  let adjectives = [];
  if (avg.brainy_easy < 2) adjectives.push("Intellectual");
  else if (avg.brainy_easy > 3) adjectives.push("Chill");
  
  if (avg.emotional_light < 2) adjectives.push("Deeply Emotional");
  else if (avg.emotional_light > 3) adjectives.push("Lighthearted");

  if (avg.action_dialogue < 2) adjectives.push("Adrenaline-Fueled");
  else if (avg.action_dialogue > 3) adjectives.push("Dialogue-Heavy");

  if (avg.realistic_weird < 2) adjectives.push("Grounded");
  else if (avg.realistic_weird > 3) adjectives.push("Wonderfully Weird");

  if (avg.classic_modern < 2) adjectives.push("Vintage");
  else if (avg.classic_modern > 3) adjectives.push("Modern");

  if (adjectives.length === 0) return "A Perfectly Balanced Movie Night";
  
  const last = adjectives.pop();
  return `A ${adjectives.join(", ")} and ${last} Vibe`;
};

// --- Routes ---

// 0. Auth Routes
app.post('/api/auth/register', async (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password || !email) return res.status(400).json({ error: "Username, email, and password required" });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    const [result] = await db.query(
      `INSERT INTO accounts (username, email, password_hash, verification_token, is_verified, subscription_status) VALUES (?, ?, ?, ?, FALSE, 'inactive')`, 
      [username, email, hashedPassword, verificationToken]
    );
    
    // MOCK EMAIL SENDING
    console.log("---------------------------------------------------");
    console.log(`📧 MOCK EMAIL TO: ${email}`);
    console.log(`Subject: Verify your ReelSync Account`);
    console.log(`Link: http://localhost:5173/verify/${verificationToken}`);
    console.log("---------------------------------------------------");

    res.json({ message: "Registration successful. Please check your email to verify account." });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: "Username or Email already exists" });
    }
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/verify', async (req, res) => {
    const { token } = req.body;
    console.log(`Verifying token: '${token}'`);
    try {
        const [users] = await db.query(`SELECT * FROM accounts WHERE verification_token = ?`, [token]);
        console.log(`Found users: ${users.length}`);
        if (users.length === 0) {
             // Debug: check if any tokens exist
             const [all] = await db.query(`SELECT id, username, verification_token FROM accounts`);
             console.log("Current tokens in DB:", all);
             return res.status(400).json({ error: "Invalid token" });
        }
        
        const user = users[0];
        await db.query(`UPDATE accounts SET is_verified = TRUE, verification_token = NULL WHERE id = ?`, [user.id]);
        
        res.json({ success: true, username: user.username });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/subscribe', async (req, res) => {
    const { username, payment_token } = req.body; // Mock payment token
    if (!username) return res.status(400).json({ error: "Username required" });

    try {
        // Mock Payment Validation
        console.log(`Processing payment for ${username}... Success!`);
        
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        await db.query(`UPDATE accounts SET subscription_status = 'active', subscription_end_date = ? WHERE username = ?`, [nextMonth, username]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [users] = await db.query(`SELECT * FROM accounts WHERE username = ?`, [username]);
    if (users.length === 0) return res.status(401).json({ error: "Invalid credentials" });

    const user = users[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    if (!user.is_verified) {
        return res.status(403).json({ error: "Please verify your email address first." });
    }

    if (user.subscription_status !== 'active') {
        // Check if expired
        // For now, simple check.
        return res.status(403).json({ error: "Subscription required", needs_subscription: true, username: user.username });
    }

    const token = jwt.sign({ 
        id: user.id, 
        username: user.username, 
        subscription_status: user.subscription_status 
    }, JWT_SECRET);
    
    res.json({ 
        token, 
        user: { 
            id: user.id, 
            username: user.username, 
            subscription_status: user.subscription_status 
        } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// 0.1 Account Features (Favorites & History)
app.get('/api/account/favorites', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT * FROM favorites WHERE account_id = ? ORDER BY created_at DESC`, [req.user.id]);
    res.json(rows.map(r => ({
      ...r,
      movie_data: (typeof r.movie_data === 'string') ? JSON.parse(r.movie_data) : r.movie_data
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/account/favorites', authenticateToken, async (req, res) => {
  const { movie_id, movie_data } = req.body;
  try {
    await db.query(`INSERT INTO favorites (account_id, movie_id, movie_data) VALUES (?, ?, ?)`,
      [req.user.id, movie_id, JSON.stringify(movie_data)]
    );
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.json({ success: true }); // Already favorited
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/account/favorites/:movieId', authenticateToken, async (req, res) => {
  try {
    await db.query(`DELETE FROM favorites WHERE account_id = ? AND movie_id = ?`, [req.user.id, req.params.movieId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/account/history', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT * FROM history WHERE account_id = ? ORDER BY watched_on DESC`, [req.user.id]);
    res.json(rows.map(r => ({
      ...r,
      movie_data: (typeof r.movie_data === 'string') ? JSON.parse(r.movie_data) : r.movie_data
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 1. Session Management
app.post('/api/session', async (req, res) => {
  const code = generateSessionCode();
  try {
    const [result] = await db.query(`INSERT INTO sessions (code) VALUES (?)`, [code]);
    res.json({ id: result.insertId, code });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/session/:code', async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT * FROM sessions WHERE code = ?`, [req.params.code]);
    if (rows.length === 0) return res.status(404).json({ error: "Session not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/session/id/:id', async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT * FROM sessions WHERE id = ?`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Session not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/session/:id/visibility', async (req, res) => {
  const { is_public } = req.body;
  try {
    await db.query(`UPDATE sessions SET is_public = ? WHERE id = ?`, [is_public, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. User & Sliders
app.post('/api/join', async (req, res) => {
  const { session_id, nickname, slider_values } = req.body;
  try {
    const [result] = await db.query(`INSERT INTO users (session_id, nickname, slider_values) VALUES (?, ?, ?)`,
      [session_id, nickname, JSON.stringify(slider_values)] 
    );
    res.json({ id: result.insertId, session_id, nickname });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/session/:id/users', async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT * FROM users WHERE session_id = ?`, [req.params.id]);
    res.json(rows.map(u => ({
        ...u, 
        slider_values: (typeof u.slider_values === 'string') ? JSON.parse(u.slider_values) : u.slider_values
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Recommendation Engine (Local DB)
app.post('/api/recommendations', async (req, res) => {
  const { users } = req.body;
  if (!users || users.length === 0) return res.status(400).json({ error: "No users provided" });

  const keys = ['brainy_easy', 'emotional_light', 'action_dialogue', 'realistic_weird', 'classic_modern'];
  let avg = {};
  
  keys.forEach(k => {
    let sum = 0;
    users.forEach(u => sum += (u.slider_values[k] || 2.5)); 
    avg[k] = sum / users.length;
  });

  // Build Dynamic Query based on preferences
  let conditions = [];
  
  if (avg.brainy_easy < 2) conditions.push("(genre IN ('Documentary', 'Drama', 'Sci-Fi') OR story_type = 'Mind-bending')");
  else if (avg.brainy_easy > 3) conditions.push("(genre IN ('Comedy', 'Action', 'Adventure') OR tone IN ('Silly', 'Light'))");

  if (avg.emotional_light < 2) conditions.push("tone IN ('Serious', 'Emotional', 'Dark')");
  else if (avg.emotional_light > 3) conditions.push("tone IN ('Light', 'Quirky', 'Silly')");

  if (avg.action_dialogue < 2) conditions.push("genre IN ('Action', 'Adventure', 'War')");
  else if (avg.action_dialogue > 3) conditions.push("genre IN ('Drama', 'Romance')");

  if (avg.realistic_weird < 2) conditions.push("(story_type NOT IN ('Mind-bending', 'Cyberpunk', 'Fantasy') AND genre != 'Sci-Fi')");
  else if (avg.realistic_weird > 3) conditions.push("(story_type IN ('Mind-bending', 'Surreal') OR tone IN ('Quirky', 'Absurdism') OR genre IN ('Sci-Fi', 'Fantasy'))");

  if (avg.classic_modern < 2) conditions.push("year < 2000");
  else if (avg.classic_modern > 3) conditions.push("year >= 2000");

  let sql = "SELECT * FROM movies";
  if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
  }
  
  sql += " ORDER BY RAND() LIMIT 20";

  try {
    let [movies] = await db.query(sql);
    
    // Fallback
    if (movies.length === 0) {
        const [fallback] = await db.query("SELECT * FROM movies ORDER BY rating DESC LIMIT 10");
        movies.push(...fallback);
    }

    // Map DB fields to Frontend expected fields (TMDB format)
    const results = movies.map(m => ({
        id: m.id,
        title: m.movie_title,
        overview: `${m.genre} - ${m.story_type}. ${m.tone} tone, featuring ${m.main_theme}. Set in ${m.setting_location}.`,
        release_date: `${m.year}-01-01`,
        vote_average: Number(m.rating),
        poster_path: m.poster_path // might be null
    }));

    const profile = generateNightProfile(avg);
    const modifiers = getRandomModifiers();

    res.json({ results, profile, modifiers, avg_sliders: avg });
  } catch (error) {
    console.error("DB Error:", error.message);
    res.status(500).json({ error: "Failed to fetch recommendations" });
  }
});

app.get('/api/movie/:id/videos', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT youtube_key FROM movies WHERE id = ?', [req.params.id]);
        if (rows.length > 0 && rows[0].youtube_key) {
            // Support multiple keys separated by comma
            const keys = rows[0].youtube_key.split(',').map(k => k.trim()).filter(k => k);
            const results = keys.map((key, index) => ({
                id: `${rows[0].id}-${index}`,
                key: key,
                site: "YouTube",
                type: "Trailer",
                name: `Trailer ${index + 1}`
            }));
            
            res.json({ results });
        } else {
            res.json({ results: [] });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Shared List
app.post('/api/list/add', async (req, res) => {
  const { session_id, movie_id, movie_data, added_by } = req.body;
  try {
    const [result] = await db.query(`INSERT INTO shared_list (session_id, movie_id, movie_data, added_by) VALUES (?, ?, ?, ?)`,
      [session_id, movie_id, JSON.stringify(movie_data), added_by]
    );
    res.json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/session/:id/list', async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT * FROM shared_list WHERE session_id = ?`, [req.params.id]);
    res.json(rows.map(r => ({
        ...r, 
        movie_data: (typeof r.movie_data === 'string') ? JSON.parse(r.movie_data) : r.movie_data
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/vote', async (req, res) => {
  const { session_id, movie_id, user_id, vote_value } = req.body;
  try {
    await db.query(`INSERT INTO votes (session_id, movie_id, user_id, vote_value) VALUES (?, ?, ?, ?)`,
      [session_id, movie_id, user_id, vote_value]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. History
app.post('/api/history', async (req, res) => {
    const { session_id, movie_id, movie_title, movie_data, rating, account_id } = req.body;
    try {
        const [result] = await db.query(`INSERT INTO history (session_id, movie_id, movie_title, movie_data, rating, account_id) VALUES (?, ?, ?, ?, ?, ?)`,
            [session_id, movie_id, movie_title, JSON.stringify(movie_data), rating, account_id || null]
        );
        res.json({ id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/history/:session_id', async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT * FROM history WHERE session_id = ? ORDER BY watched_on DESC`, [req.params.session_id]);
        res.json(rows.map(r => ({
            ...r, 
            movie_data: (typeof r.movie_data === 'string') ? JSON.parse(r.movie_data) : r.movie_data
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
