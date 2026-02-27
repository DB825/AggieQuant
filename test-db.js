require('dotenv').config();
const { Pool } = require('pg');

async function testConnection() {
    console.log("Connecting to:", process.env.DATABASE_URL.split('@')[1]); // Log safely
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const res = await pool.query('SELECT NOW()');
        console.log("Connection successful! Current database time:", res.rows[0].now);

        // Let's create the table just in case so the admin panel won't crash even if empty
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS applications (
                id SERIAL PRIMARY KEY,
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                email VARCHAR(255),
                gpa NUMERIC(4, 2),
                track VARCHAR(50),
                why_quant TEXT,
                goals TEXT,
                awards TEXT,
                fun_fact TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await pool.query(createTableQuery);
        console.log("Ensured applications table exists.");

    } catch (err) {
        console.error("Connection failed:", err);
    } finally {
        await pool.end();
    }
}

testConnection();
