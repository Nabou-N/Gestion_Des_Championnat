const pool = require('../config/db');

// 1. Créer une nouvelle équipe (POST)
exports.createTeam = async (req, res) => {
  try {
    const { name, city, foundedYear, logoUrl } = req.body;

    // Vérifier si l'équipe existe déjà
    const checkTeam = await pool.query('SELECT * FROM teams WHERE name = \$1', [name]);
    if (checkTeam.rows.length > 0) {
      return res.status(400).json({ message: 'Une équipe porte déjà ce nom.' });
    }

    // Insérer l'équipe dans PostgreSQL
    const newTeam = await pool.query(
      'INSERT INTO teams (name, city, founded_year, logo_url) VALUES (\$1, \$2, \$3, \$4) RETURNING *',
      [name, city, foundedYear, logoUrl]
    );

    res.status(201).json({ message: 'Équipe créée avec succès !', team: newTeam.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// 2. Récupérer le classement complet (GET)
exports.getLeaderboard = async (req, res) => {
  try {
    const queryText = `
      SELECT id, name, city, points, played, won, drawn, lost, goals_for, goals_against,
             (goals_for - goals_against) AS goal_difference
      FROM teams
      ORDER BY points DESC, goal_difference DESC, goals_for DESC;
    `;
    const { rows } = await pool.query(queryText);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du chargement du classement.', error: error.message });
  }
};
// ✅ À ajouter à la fin de src/controllers/teamController.js pour corriger le plantage
exports.getAllTeams = async (req, res) => {
  try {
    const query = 'SELECT id, name, city, points FROM teams ORDER BY name ASC;';
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Erreur serveur lors de la récupération des équipes :", error.message);
    res.status(500).json({ message: "Erreur interne lors de la lecture des équipes." });
  }
};
