const formidable = require('formidable');
const nodemailer = require('nodemailer');

export const config = {
    api: {
        bodyParser: false, // Disallow Next.js built-in parsing so formidable can handle the multipart/form-data
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // Ensure environment variables are set
    const { EMAIL_USER, EMAIL_PASS } = process.env;
    if (!EMAIL_USER || !EMAIL_PASS) {
        console.error("Missing EMAIL_USER or EMAIL_PASS environment variables.");
        return res.status(500).json({ error: 'Server configuration error. Contact admin.' });
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
