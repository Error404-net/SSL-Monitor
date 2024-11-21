import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const migrations = [
  `
  CREATE TABLE IF NOT EXISTS domains (
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

  CREATE INDEX IF NOT EXISTS idx_domains_valid_to ON domains(valid_to);
  `
];

async function migrate() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        migration INTEGER NOT NULL UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Get applied migrations
    const { rows } = await client.query('SELECT migration FROM migrations ORDER BY migration ASC');
    const appliedMigrations = rows.map(row => row.migration);
    
    // Apply new migrations
    for (let i = 0; i < migrations.length; i++) {
      if (!appliedMigrations.includes(i)) {
        console.log(`Applying migration ${i}...`);
        await client.query(migrations[i]);
        await client.query('INSERT INTO migrations (migration) VALUES ($1)', [i]);
        console.log(`Migration ${i} applied successfully`);
      }
    }
    
    await client.query('COMMIT');
    console.log('All migrations completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();