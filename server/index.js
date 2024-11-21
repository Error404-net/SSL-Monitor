import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pg from 'pg';
import sslChecker from 'ssl-checker';
import nodemailer from 'nodemailer';
import schedule from 'node-schedule';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// Database setup
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Email transport setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Middleware
app.use(express.json());
app.use(express.static('dist'));

// Increase the request timeout
app.use((req, res, next) => {
  req.setTimeout(30000);
  res.setTimeout(30000);
  next();
});

// Check SSL certificates with increased timeout
const checkDomainSSL = async (domain) => {
  try {
    return await Promise.race([
      sslChecker(domain, { timeout: 20000 }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('SSL check timed out')), 20000)
      )
    ]);
  } catch (error) {
    throw new Error(`Failed to check SSL for ${domain}: ${error.message}`);
  }
};

// Check SSL certificates and send notifications
const checkCertificates = async () => {
  const client = await pool.connect();
  try {
    const { rows: domains } = await client.query('SELECT * FROM domains');
    
    for (const domain of domains) {
      try {
        const result = await checkDomainSSL(domain.domain);
        const daysUntilExpiry = Math.ceil(
          (new Date(result.valid_to).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysUntilExpiry <= domain.notify_days) {
          await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: domain.email,
            subject: `SSL Certificate Expiring Soon - ${domain.domain}`,
            html: `
              <h2>SSL Certificate Expiration Notice</h2>
              <p>The SSL certificate for <strong>${domain.domain}</strong> will expire in ${daysUntilExpiry} days.</p>
              <p>Expiration Date: ${new Date(result.valid_to).toLocaleDateString()}</p>
              <p>Please ensure you renew the certificate before it expires to avoid any service interruptions.</p>
            `
          });
        }
      } catch (error) {
        console.error(`Error checking SSL for ${domain.domain}:`, error);
      }
    }
  } finally {
    client.release();
  }
};

// Schedule daily certificate checks
schedule.scheduleJob('0 0 * * *', checkCertificates);

// API Routes
app.post('/api/domains', async (req, res) => {
  const client = await pool.connect();
  try {
    const { domain, email, notifyDays } = req.body;
    
    if (!domain || !email || !notifyDays) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Add retry logic for SSL check
    let retries = 3;
    let sslInfo;
    
    while (retries > 0) {
      try {
        sslInfo = await checkDomainSSL(domain);
        break;
      } catch (error) {
        retries--;
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    const { rows: [newDomain] } = await client.query(
      `INSERT INTO domains (domain, email, notify_days, valid_from, valid_to, issuer)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        domain,
        email,
        notifyDays,
        new Date(sslInfo.valid_from),
        new Date(sslInfo.valid_to),
        sslInfo.issuer.O || 'Unknown'
      ]
    );
    
    res.json(newDomain);
  } catch (error) {
    console.error('Error adding domain:', error);
    res.status(400).json({ 
      error: 'Failed to check SSL certificate. Please verify the domain is correct and accessible.' 
    });
  } finally {
    client.release();
  }
});

app.get('/api/domains', async (req, res) => {
  const client = await pool.connect();
  try {
    const { rows } = await client.query('SELECT * FROM domains ORDER BY valid_to ASC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching domains:', error);
    res.status(500).json({ error: 'Failed to fetch domains' });
  } finally {
    client.release();
  }
});

app.delete('/api/domains/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { rowCount } = await client.query('DELETE FROM domains WHERE id = $1', [id]);
    
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Domain not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting domain:', error);
    res.status(500).json({ error: 'Failed to delete domain' });
  } finally {
    client.release();
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Increase server timeout
server.timeout = 30000;