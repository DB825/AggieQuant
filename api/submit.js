require('dotenv').config();
const formidable = require('formidable');
const nodemailer = require('nodemailer');
const { Pool } = require('pg');

const config = {
    api: {
        bodyParser: false, // Disallow Next.js built-in parsing so formidable can handle the multipart/form-data
    },
};

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // Check if email variables are set (optional notifications)
    const { EMAIL_USER, EMAIL_PASS } = process.env;
    const sendEmails = !!(EMAIL_USER && EMAIL_PASS);

    if (!sendEmails) {
        console.warn("EMAIL_USER or EMAIL_PASS not set. Email notifications are disabled.");
    }

    const form = formidable({ multiples: false }); // We expect one resume file max

    return new Promise((resolve, reject) => {
        form.parse(req, async (err, fields, files) => {
            if (err) {
                console.error("Form parsing error:", err);
                res.status(500).json({ error: 'Error parsing form data' });
                return resolve();
            }

            // Extract fields (formidable sometimes wraps fields in arrays in newer versions, handle both)
            const firstName = Array.isArray(fields['first-name']) ? fields['first-name'][0] : fields['first-name'];
            const lastName = Array.isArray(fields['last-name']) ? fields['last-name'][0] : fields['last-name'];
            const email = Array.isArray(fields['tamu-email']) ? fields['tamu-email'][0] : fields['tamu-email'];
            const gpa = Array.isArray(fields['gpa']) ? fields['gpa'][0] : fields['gpa'];
            const track = Array.isArray(fields['track']) ? fields['track'][0] : fields['track'];
            const whyQuant = Array.isArray(fields['why-quant']) ? fields['why-quant'][0] : fields['why-quant'];
            const goals = Array.isArray(fields['goals']) ? fields['goals'][0] : fields['goals'];
            const awards = Array.isArray(fields['awards']) ? fields['awards'][0] : fields['awards'];
            const funFact = Array.isArray(fields['fun-fact']) ? fields['fun-fact'][0] : fields['fun-fact'];

            // Extract uploaded resume file
            const resumeFile = Array.isArray(files.resume) ? files.resume[0] : files.resume;

            try {
                // Connect to PostgreSQL and insert application
                if (process.env.DATABASE_URL) {
                    const pool = new Pool({
                        connectionString: process.env.DATABASE_URL,
                        ssl: { rejectUnauthorized: false }
                    });

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

                    const insertQuery = `
                        INSERT INTO applications (first_name, last_name, email, gpa, track, why_quant, goals, awards, fun_fact)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    `;
                    const values = [firstName, lastName, email, gpa, track, whyQuant, goals, awards, funFact];
                    await pool.query(insertQuery, values);

                    // Release the pool
                    await pool.end();
                } else {
                    console.warn("DATABASE_URL is not set. Skipping database insertion.");
                }
                if (sendEmails) {
                    // Configure Nodemailer Transport
                    const transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: EMAIL_USER,
                            pass: EMAIL_PASS,
                        },
                    });

                    // Construct HTML Email Content
                    const htmlContent = `
              <h2>New AggieQuant Member Application</h2>
              <p><strong>Name:</strong> ${firstName} ${lastName}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>GPA:</strong> ${gpa}</p>
              <p><strong>Track Preference:</strong> ${track}</p>
              <hr />
              <h3>Application Responses:</h3>
              <p><strong>Why Quant?</strong><br/>${whyQuant}</p>
              <p><strong>Goals & Expectations:</strong><br/>${goals}</p>
              <p><strong>Awards:</strong><br/>${awards || 'None listed'}</p>
              <p><strong>Fun Fact:</strong><br/>${funFact}</p>
            `;

                    // Configure Email Options
                    const mailOptions = {
                        from: `"AggieQuant Application" <${EMAIL_USER}>`,
                        to: EMAIL_USER, // Send to the configured environment variable email
                        replyTo: email, // If you hit reply, it replies to the applicant
                        subject: `New Application: ${firstName} ${lastName} - ${track.toUpperCase()}`,
                        html: htmlContent,
                    };

                    // Attach Resume if it exists
                    if (resumeFile) {
                        mailOptions.attachments = [
                            {
                                filename: resumeFile.originalFilename || 'resume.pdf',
                                path: resumeFile.filepath, // Path to the temporarily uploaded file
                            },
                        ];
                    }

                    // Send Email
                    await transporter.sendMail(mailOptions);
                }

                // Redirect user back to home page with a success anchor (or similar)
                // Note: For a seamless experience, you'd ideally have a /success.html page.
                // For now, redirecting to the homepage.
                res.writeHead(302, { Location: '/index.html?success=true' });
                res.end();
                return resolve();

            } catch (sendError) {
                console.error("Nodemailer Error:", sendError);
                res.status(500).json({ error: 'Failed to send email' });
                return resolve();
            }
        });
    });
}
