const { Pool } = require('pg');
require('dotenv').config();

// On vérifie si Render nous fournit une URL de connexion complète (DATABASE_URL)
const isProduction = process.env.DATABASE_URL;

const pool = new Pool({
  if (isProduction) {
    // Configuration pour Render en production
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Obligatoire pour se connecter aux serveurs de Render
    }
  } else {
    // Votre configuration locale actuelle (sur votre PC)
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME || 'mon_championnat',
    password: process.env.DB_PASSWORD || 'nabouh',
    port: process.env.DB_PORT || 5432,
  }
});

pool.on('connect', () => {
  console.log('✅ Connexion à PostgreSQL réussie !');
});

module.exports = pool;
