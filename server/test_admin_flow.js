const axios = require('axios');

async function testAdmin() {
    try {
        console.log("1. Clearing Database...");
        const clearRes = await axios.delete('http://localhost:3002/api/admin/movies');
        console.log("Clear Result:", clearRes.data);

        console.log("2. Seeding from TMDB (1 page)...");
        const seedRes = await axios.post('http://localhost:3002/api/admin/seed-tmdb', {
            pages: 1,
            type: 'popular'
        });
        console.log("Seed Result:", seedRes.data);
        
    } catch (e) {
        console.error("Error:", e.response ? e.response.data : e.message);
    }
}

testAdmin();
