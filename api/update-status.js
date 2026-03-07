import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

export default async function handler(req, res) {
    if (req.method !== 'POST') {
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

    const { id, status } = req.body;
    if (!id || !status) {
        return res.status(400).json({ error: 'Missing id or status.' });
    }

    try {
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        // Ensure status column exists (in case it wasn't added yet)
        await pool.query("ALTER TABLE applications ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Pending';");

        // Update the status
        const updateQuery = 'UPDATE applications SET status = $1 WHERE id = $2 RETURNING *;';
        const result = await pool.query(updateQuery, [status, id]);

        await pool.end();

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Application not found.' });
        }

        return res.status(200).json({ message: 'Status updated successfully', application: result.rows[0] });
    } catch (error) {
        console.error("Database Error:", error);
        return res.status(500).json({ error: 'Failed to update application status' });
    }
}
