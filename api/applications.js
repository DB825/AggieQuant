import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // Check for admin authorization
    const adminSecret = process.env.ADMIN_SECRET;
    const providedSecret = req.headers['authorization'];

    if (!adminSecret || providedSecret !== `Bearer ${adminSecret}`) {
        return res.status(401).json({ error: 'Unauthorized. Invalid or missing Admin Secret.' });
    }

    if (!process.env.DATABASE_URL) {
        return res.status(500).json({ error: 'Database is not configured.' });
    }

    try {
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        const query = 'SELECT * FROM applications ORDER BY created_at DESC;';
        const result = await pool.query(query);

        await pool.end();

        return res.status(200).json(result.rows);
    } catch (error) {
        console.error("Database Error:", error);
        return res.status(500).json({ error: 'Failed to fetch applications' });
    }
}
