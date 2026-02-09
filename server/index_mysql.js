require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { authenticateToken, JWT_SECRET } = require('./middleware');
const db = require('./database_mysql');

const app = express();
const PORT = process.env.PORT || 3002;

// --- TMDB Config ---
const TMDB_READ_TOKEN = process.env.TMDB_READ_TOKEN;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

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
    "Popcorn Mandatory ", "Blanket Fort Mode ", "No Phones Allowed ", 
    "Critique Accents ", "Guess the Twist ", "Rate Every Outfit ",
    "Drink Every Time Someone Says 'No' ", "Lights Off ", "Surround Sound Max ",
    "Silent Snacks Only ", "Subtitles On ", "Predict the Ending ",
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

  // New Sliders Profile Text
  if (avg.safe_scary < 2) adjectives.push("Comforting");
  else if (avg.safe_scary > 3) adjectives.push("Spooky");

  if (avg.slow_fast < 2) adjectives.push("Slow-Burn");
  else if (avg.slow_fast > 3) adjectives.push("Fast-Paced");

  if (avg.indie_blockbuster < 2) adjectives.push("Artsy");
  else if (avg.indie_blockbuster > 3) adjectives.push("Big-Budget");

  if (avg.live_animated < 2) adjectives.push("Live-Action");
  else if (avg.live_animated > 3) adjectives.push("Animated");

  if (adjectives.length === 0) return "A Perfectly Balanced Movie Night";
  
  // Pick random 3 if too many
  if (adjectives.length > 3) {
      adjectives = adjectives.sort(() => 0.5 - Math.random()).slice(0, 3);
  }
  
  const last = adjectives.pop();
  return `A ${adjectives.join(", ")} and ${last} Vibe`;
};

// --- TMDB Helper Functions ---
const getTMDBHeaders = () => ({
    headers: {
        Authorization: `Bearer ${TMDB_READ_TOKEN}`,
        accept: 'application/json'
    }
});

const mapGenreIdToName = (id) => {
    const genres = {
        28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
        99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
        27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
        10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
    };
    return genres[id] || 'General';
};

const inferTone = (genre, voteAverage) => {
    if (genre === 'Horror') return 'Scary';
    if (genre === 'Comedy') return 'Silly';
    if (genre === 'Drama') return 'Emotional';
    if (genre === 'Thriller') return 'Suspenseful';
    if (genre === 'Action') return 'Exciting';
    if (genre === 'Sci-Fi') return 'Serious';
    if (genre === 'Romance') return 'Light';
    return voteAverage > 7.5 ? 'Serious' : 'Light';
};

const inferStoryType = (genre, overview) => {
    const lower = overview.toLowerCase();
    if (lower.includes('time travel') || lower.includes('mind')) return 'Mind-bending';
    if (genre === 'Sci-Fi') return 'Hero Journey';
    if (genre === 'Fantasy') return 'Quest';
    if (genre === 'Mystery') return 'Whodunit';
    return 'Classic';
};

// --- Routes ---

// Admin: Seed from TMDB
app.post('/api/admin/seed-tmdb', async (req, res) => {
    const { pages = 1, type = 'popular' } = req.body;
    
    if (!TMDB_READ_TOKEN) {
        return res.status(500).json({ error: "TMDB_READ_TOKEN not configured in server" });
    }

    try {
        let moviesAdded = 0;
        
        for (let p = 1; p <= pages; p++) {
            const endpoint = type === 'top_rated' ? '/movie/top_rated' : '/movie/popular';
            const response = await axios.get(`${TMDB_BASE_URL}${endpoint}?language=en-US&page=${p}`, getTMDBHeaders());
            
            const results = response.data.results;
            
            for (const item of results) {
                // Check if exists
                const [existing] = await db.query('SELECT * FROM movies WHERE movie_title = ?', [item.title]);
                
                // If exists and has overview, skip (already complete)
                if (existing.length > 0 && existing[0].overview) {
                    continue;
                }

                // Fetch details for Director, Videos, and Metadata
                const detailsRes = await axios.get(`${TMDB_BASE_URL}/movie/${item.id}?append_to_response=credits,videos`, getTMDBHeaders());
                const details = detailsRes.data;

                const director = details.credits.crew.find(c => c.job === 'Director')?.name || 'Unknown';
                const trailer = details.videos.results.find(v => v.type === 'Trailer' && v.site === 'YouTube')?.key || null;
                
                // New Metadata
                const overview = details.overview || '';
                const runtime = details.runtime || 0;
                const original_language = details.original_language || 'en';
                const origin_country = details.production_countries?.[0]?.iso_3166_1 || (details.origin_country?.[0]) || 'Unknown';
                const cast = details.credits.cast?.slice(0, 5).map(c => c.name) || [];

                const genre = mapGenreIdToName(item.genre_ids[0]);
                const sub_genre = item.genre_ids[1] ? mapGenreIdToName(item.genre_ids[1]) : 'General';
                const tone = inferTone(genre, item.vote_average);
                const story_type = inferStoryType(genre, item.overview || '');
                const year = item.release_date ? parseInt(item.release_date.split('-')[0]) : 0;

                if (existing.length > 0) {
                    // Update existing record with new metadata
                    await db.query(
                        `UPDATE movies SET 
                        overview = ?, runtime = ?, original_language = ?, origin_country = ?, cast = ?, youtube_key = COALESCE(youtube_key, ?)
                        WHERE id = ?`,
                        [overview, runtime, original_language, origin_country, JSON.stringify(cast), trailer, existing[0].id]
                    );
                    // console.log(`Updated metadata for: ${item.title}`);
                } else {
                    // Insert new record
                    await db.query(
                        `INSERT INTO movies 
                        (movie_title, year, genre, sub_genre, story_type, tone, main_theme, setting_location, director, rating, poster_path, youtube_key, overview, runtime, original_language, origin_country, cast) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            item.title,
                            year,
                            genre,
                            sub_genre,
                            story_type,
                            tone,
                            'Entertainment', // Default main_theme
                            'Unknown',       // Default setting
                            director,
                            item.vote_average,
                            item.poster_path,
                            trailer,
                            overview,
                            runtime,
                            original_language,
                            origin_country,
                            JSON.stringify(cast)
                        ]
                    );
                    moviesAdded++;
                }
            }
        }

        res.json({ success: true, message: `Processed ${pages} pages. Added ${moviesAdded} new movies. Existing movies were updated with new details.` });

    } catch (err) {
        console.error("TMDB Import Error:", err.message);
        res.status(500).json({ error: "Failed to import from TMDB", details: err.message });
    }
});

// Admin: Clear Movies
app.delete('/api/admin/movies', async (req, res) => {
    try {
        await db.query('DELETE FROM movies');
        // Reset Auto Increment
        await db.query('ALTER TABLE movies AUTO_INCREMENT = 1');
        res.json({ success: true, message: "Movies table cleared" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

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
app.get('/api/movies/trailers', async (req, res) => {
    try {
        // Get random movies that have a youtube key
        const [rows] = await db.query(`
            SELECT id, movie_title, youtube_key 
            FROM movies 
            WHERE youtube_key IS NOT NULL AND youtube_key != '' 
            ORDER BY RAND() 
            LIMIT 60
        `);
        
        const results = rows.map(r => ({
            id: r.id,
            title: r.movie_title,
            // Take the first key if there are multiple
            key: r.youtube_key.split(',')[0].trim()
        }));
        
        res.json({ results });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/recommendations', async (req, res) => {
  const { users } = req.body;
  if (!users || users.length === 0) return res.status(400).json({ error: "No users provided" });

  const keys = [
      'brainy_easy', 'emotional_light', 'action_dialogue', 'realistic_weird', 'classic_modern',
      'safe_scary', 'slow_fast', 'indie_blockbuster', 'live_animated'
  ];
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

  // New Filters
  if (avg.safe_scary < 2) conditions.push("(genre NOT IN ('Horror', 'Thriller') AND tone NOT IN ('Dark', 'Scary', 'Violent', 'Ominous'))");
  else if (avg.safe_scary > 3) conditions.push("(genre IN ('Horror', 'Thriller') OR tone IN ('Dark', 'Scary', 'Suspenseful'))");

  if (avg.slow_fast < 2) conditions.push("(genre IN ('Drama', 'Documentary', 'Romance') OR tone IN ('Slow', 'Quiet', 'Atmospheric'))");
  else if (avg.slow_fast > 3) conditions.push("(genre IN ('Action', 'Adventure', 'Thriller', 'Sci-Fi') OR tone IN ('Exciting', 'Intense', 'Fast-paced'))");

  if (avg.indie_blockbuster < 2) conditions.push("(sub_genre IN ('Indie', 'Arthouse', 'Foreign') OR rating > 8.5)");
  else if (avg.indie_blockbuster > 3) conditions.push("(genre IN ('Action', 'Adventure', 'Sci-Fi', 'Fantasy') AND year >= 2000)");

  if (avg.live_animated < 2) conditions.push("genre != 'Animation'");
  else if (avg.live_animated > 3) conditions.push("genre = 'Animation'");

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
        overview: m.overview || `${m.genre} - ${m.story_type}. ${m.tone} tone, featuring ${m.main_theme}. Set in ${m.setting_location}.`,
        release_date: `${m.year}-01-01`,
        vote_average: Number(m.rating),
        poster_path: m.poster_path,
        // New metadata
        runtime: m.runtime,
        original_language: m.original_language,
        origin_country: m.origin_country,
        cast: (typeof m.cast === 'string' ? JSON.parse(m.cast) : m.cast) || []
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
    const [rows] = await db.query(`
        SELECT sl.*, 
        COALESCE(SUM(CASE WHEN v.vote_value = 1 THEN 1 ELSE 0 END), 0) as likes,
        COALESCE(SUM(CASE WHEN v.vote_value = -1 THEN 1 ELSE 0 END), 0) as dislikes
        FROM shared_list sl
        LEFT JOIN votes v ON sl.session_id = v.session_id AND sl.movie_id = v.movie_id
        WHERE sl.session_id = ?
        GROUP BY sl.id
    `, [req.params.id]);
    
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
    // Check if user already voted
    const [existing] = await db.query(`SELECT id FROM votes WHERE session_id = ? AND movie_id = ? AND user_id = ?`, [session_id, movie_id, user_id]);
    
    if (existing.length > 0) {
        await db.query(`UPDATE votes SET vote_value = ? WHERE id = ?`, [vote_value, existing[0].id]);
    } else {
        await db.query(`INSERT INTO votes (session_id, movie_id, user_id, vote_value) VALUES (?, ?, ?, ?)`,
          [session_id, movie_id, user_id, vote_value]
        );
    }

    // Check for double dislikes
    const [counts] = await db.query(`
        SELECT 
            COALESCE(SUM(CASE WHEN vote_value = -1 THEN 1 ELSE 0 END), 0) as dislikes
        FROM votes 
        WHERE session_id = ? AND movie_id = ?
    `, [session_id, movie_id]);

    if (counts[0].dislikes >= 2) {
        await db.query(`DELETE FROM shared_list WHERE session_id = ? AND movie_id = ?`, [session_id, movie_id]);
        await db.query(`DELETE FROM votes WHERE session_id = ? AND movie_id = ?`, [session_id, movie_id]); // Cleanup votes
        return res.json({ success: true, removed: true });
    }

    res.json({ success: true, removed: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Rock Paper Scissors Mini-game
const rpsGames = {}; // In-memory store for simplicity (or use DB for persistence)

app.post('/api/game/rps/move', (req, res) => {
    const { session_id, user_id, move } = req.body; // move: 'rock', 'paper', 'scissors'
    
    if (!rpsGames[session_id]) {
        rpsGames[session_id] = { moves: {}, result: null };
    }

    rpsGames[session_id].moves[user_id] = move;

    // Check if 2 players have moved
    const playerIds = Object.keys(rpsGames[session_id].moves);
    if (playerIds.length === 2) {
        const p1 = playerIds[0];
        const p2 = playerIds[1];
        const m1 = rpsGames[session_id].moves[p1];
        const m2 = rpsGames[session_id].moves[p2];

        let winner = null;
        if (m1 === m2) winner = 'draw';
        else if (
            (m1 === 'rock' && m2 === 'scissors') ||
            (m1 === 'paper' && m2 === 'rock') ||
            (m1 === 'scissors' && m2 === 'paper')
        ) {
            winner = p1;
        } else {
            winner = p2;
        }

        rpsGames[session_id].result = { winner, moves: rpsGames[session_id].moves };
    }

    res.json({ success: true });
});

app.get('/api/game/rps/:session_id', (req, res) => {
    const game = rpsGames[req.params.session_id];
    res.json(game || { moves: {}, result: null });
});

app.post('/api/game/rps/:session_id/reset', (req, res) => {
    delete rpsGames[req.params.session_id];
    res.json({ success: true });
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
