# SSL Certificate Monitor

A modern web application to monitor SSL/TLS certificate expiration dates and receive email notifications before they expire.

## Features

- 🔒 Monitor SSL/TLS certificates for multiple domains
- 📧 Email notifications before certificate expiration
- 🌓 Dark mode support
- 📊 Beautiful, responsive dashboard
- 🔄 Real-time updates
- 🐳 Docker support for easy deployment

## Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)

## Quick Start with Docker

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ssl-monitor
   ```

2. Create your environment file:
   ```bash
   cp .env.example .env
   ```

3. Edit the `.env` file with your configuration:
   - Set a secure PostgreSQL password
   - Configure your SMTP settings for email notifications

4. Start the application:
   ```bash
   docker-compose up -d
   ```

5. Access the application at `http://localhost:3000`

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create and configure your `.env` file as described above

3. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` or `production` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `your_secure_password` |
| `DATABASE_URL` | Database connection URL | `postgresql://postgres:password@localhost:5432/sslmonitor` |
| `SMTP_HOST` | SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | `your_email@gmail.com` |
| `SMTP_PASS` | SMTP password | `your_app_specific_password` |
| `SMTP_FROM` | Sender email address | `noreply@yourdomain.com` |

## Database Schema

The application uses PostgreSQL with the following schema:

```sql
CREATE TABLE domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  notify_days INTEGER NOT NULL,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
  valid_to TIMESTAMP WITH TIME ZONE NOT NULL,
  issuer VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_domains_valid_to ON domains(valid_to);
```

## Production Deployment

1. Ensure your server has Docker and Docker Compose installed

2. Configure your environment variables for production:
   - Use a secure PostgreSQL password
   - Configure your production SMTP server
   - Set `NODE_ENV=production`

3. Deploy using Docker Compose:
   ```bash
   docker-compose up -d
   ```

4. Set up a reverse proxy (like Nginx) with SSL/TLS for production use

## Backup and Restore

Backup PostgreSQL data:
```bash
docker-compose exec db pg_dump -U postgres sslmonitor > backup.sql
```

Restore from backup:
```bash
docker-compose exec -T db psql -U postgres sslmonitor < backup.sql
```

## License

MIT License