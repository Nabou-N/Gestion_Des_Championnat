const { Pool } = require('pg');
require('dotenv').config();

// On prépare l'objet de configuration vide
let config = {};

if (process.env.DATABASE_URL) {
  // Configuration pour Render en production
  config = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Obligatoire pour Render
    }
  };
} else {
  // Configuration pour votre PC en local
  config = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME || 'mon_championnat',
    password: process.env.DB_PASSWORD || 'nabouh',
    port: process.env.DB_PORT || 5432,
  };
}

const pool = new Pool(config);

pool.on('connect', () => {
  console.log('✅ Connexion à PostgreSQL réussie !');
});

module.exports = pool;
