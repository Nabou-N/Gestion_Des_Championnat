// =====================================================================
// initDb.js : prépare la base PostgreSQL au démarrage.
//
// - Crée les tables qui n'existent pas encore.
// - Ajoute les colonnes qui manquent (sans toucher aux données existantes).
// - Ne supprime JAMAIS rien. Peut être relancé autant de fois que voulu.
// - Crée un compte admin si ADMIN_EMAIL et ADMIN_PASSWORD sont définis.
//
// Utilisation sur Render (Start Command) :
//     node initDb.js && node serveur.js
// =====================================================================
const pool = require('./src/config/db');

const TABLES = ['teams', 'players', 'matches', 'match_goals', 'match_cards', 'users'];

const MIGRATION = [
  // ---------- 1. Tables ----------
  `CREATE TABLE IF NOT EXISTS teams (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL,
      city VARCHAR(100) NOT NULL,
      founded_year INT,
      logo_url VARCHAR(255),
      points INT DEFAULT 0,
      played INT DEFAULT 0,
      won INT DEFAULT 0,
      drawn INT DEFAULT 0,
      lost INT DEFAULT 0,
      goals_for INT DEFAULT 0,
      goals_against INT DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS players (
      id SERIAL PRIMARY KEY,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      jersey_number INT NOT NULL,
      position VARCHAR(50) NOT NULL,
      team_id INT REFERENCES teams(id) ON DELETE CASCADE,
      goals INT DEFAULT 0,
      assists INT DEFAULT 0,
      yellow_cards INT DEFAULT 0,
      red_cards INT DEFAULT 0,
      name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED
  )`,
  `CREATE TABLE IF NOT EXISTS matches (
      id SERIAL PRIMARY KEY,
      round_number INT,
      home_team_id INT REFERENCES teams(id) ON DELETE CASCADE,
      away_team_id INT REFERENCES teams(id) ON DELETE CASCADE,
      match_date TIMESTAMP,
      stadium VARCHAR(150),
      status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'finished')),
      home_score INT DEFAULT 0,
      away_score INT DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS match_goals (
      id SERIAL PRIMARY KEY,
      match_id INT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      scorer_id INT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      assister_id INT REFERENCES players(id) ON DELETE SET NULL,
      minute INT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS match_cards (
      id SERIAL PRIMARY KEY,
      match_id INT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      player_id INT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      card_type VARCHAR(20) NOT NULL,
      minute INT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(150) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) DEFAULT 'admin'
  )`,

  // ---------- 2. Colonnes qui peuvent manquer dans une ancienne base ----------
  `ALTER TABLE teams ADD COLUMN IF NOT EXISTS city VARCHAR(100)`,
  `ALTER TABLE teams ADD COLUMN IF NOT EXISTS founded_year INT`,
  `ALTER TABLE teams ADD COLUMN IF NOT EXISTS logo_url VARCHAR(255)`,
  `ALTER TABLE teams ADD COLUMN IF NOT EXISTS points INT DEFAULT 0`,
  `ALTER TABLE teams ADD COLUMN IF NOT EXISTS played INT DEFAULT 0`,
  `ALTER TABLE teams ADD COLUMN IF NOT EXISTS won INT DEFAULT 0`,
  `ALTER TABLE teams ADD COLUMN IF NOT EXISTS drawn INT DEFAULT 0`,
  `ALTER TABLE teams ADD COLUMN IF NOT EXISTS lost INT DEFAULT 0`,
  `ALTER TABLE teams ADD COLUMN IF NOT EXISTS goals_for INT DEFAULT 0`,
  `ALTER TABLE teams ADD COLUMN IF NOT EXISTS goals_against INT DEFAULT 0`,

  `ALTER TABLE players ADD COLUMN IF NOT EXISTS goals INT DEFAULT 0`,
  `ALTER TABLE players ADD COLUMN IF NOT EXISTS assists INT DEFAULT 0`,
  `ALTER TABLE players ADD COLUMN IF NOT EXISTS yellow_cards INT DEFAULT 0`,
  `ALTER TABLE players ADD COLUMN IF NOT EXISTS red_cards INT DEFAULT 0`,
  `ALTER TABLE players ADD COLUMN IF NOT EXISTS name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED`,

  `ALTER TABLE matches ADD COLUMN IF NOT EXISTS round_number INT`,
  `ALTER TABLE matches ADD COLUMN IF NOT EXISTS stadium VARCHAR(150)`,
  `ALTER TABLE matches ADD COLUMN IF NOT EXISTS home_score INT DEFAULT 0`,
  `ALTER TABLE matches ADD COLUMN IF NOT EXISTS away_score INT DEFAULT 0`,
  // La génération du calendrier crée des matchs sans date : la colonne doit l'accepter.
  `ALTER TABLE matches ALTER COLUMN match_date DROP NOT NULL`,

  `ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'admin'`,
];

async function createAdmin(client) {
  const email = (process.env.ADMIN_EMAIL || '').trim();
  const password = process.env.ADMIN_PASSWORD || '';
  if (!email || !password) {
    console.log("ℹ️  ADMIN_EMAIL / ADMIN_PASSWORD non définis : aucun compte admin créé.");
    return;
  }
  try {
    const result = await client.query(
      `INSERT INTO users (email, password, role)
       SELECT $1::varchar, $2::varchar, 'admin'
       WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = $1::varchar)`,
      [email, password]
    );
    console.log(result.rowCount === 1
      ? `✅ Compte admin créé : ${email}`
      : `ℹ️  Le compte ${email} existe déjà : laissé tel quel.`);
  } catch (error) {
    // Ne bloque pas le démarrage : on affiche la cause pour la corriger.
    console.warn('⚠️  Impossible de créer le compte admin :', error.message);
  }
}

async function printSummary(client) {
  console.log('--- Contenu de la base ---');
  for (const table of TABLES) {
    const count = await client.query(`SELECT COUNT(*)::int AS n FROM ${table}`);
    console.log(`  ${table.padEnd(12)} : ${count.rows[0].n} ligne(s)`);
  }
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const sql of MIGRATION) {
      await client.query(sql);
    }
    await client.query('COMMIT');
    console.log('✅ Base de données prête (tables et colonnes vérifiées).');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('❌ Échec de la préparation de la base :', error.message);
    client.release();
    await pool.end();
    process.exit(1);
  }

  await createAdmin(client);
  await printSummary(client);
  client.release();
  await pool.end();
}

main().catch((error) => {
  console.error('❌ Erreur inattendue dans initDb.js :', error);
  process.exit(1);
});
