const db = require('./database_mysql');

async function checkUsers() {
    try {
        const [rows] = await db.query('SELECT id, username, email, is_verified, subscription_status FROM accounts');
        console.log("Accounts in DB:");
        console.table(rows);
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

checkUsers();
