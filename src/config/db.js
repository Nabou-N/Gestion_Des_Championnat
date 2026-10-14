const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  // Exemple de configuration locale standard
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  database: process.env.DB_NAME || 'mon_championnat',
  password: process.env.DB_PASSWORD || 'nabouh',
  port: process.env.DB_PORT || 5432,
});

pool.on('connect', () => {
  console.log('✅ Connexion à PostgreSQL réussie !');
});

module.exports = pool;
