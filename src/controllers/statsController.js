const pool = require('../config/db');

// ⚽ Récupérer les meilleurs buteurs
exports.getTopScorers = async (req, res) => {
  try {
    const queryText = `
      SELECT p.first_name, p.last_name, p.goals, p.position, t.name AS team_name
      FROM players p
      JOIN teams t ON p.team_id = t.id
      ORDER BY p.goals DESC, p.last_name ASC
      LIMIT 10;
    `;
    const { rows } = await pool.query(queryText);
    return res.status(200).json(rows);
  } catch (error) {
    console.error("Erreur SQL Buteurs :", error.message);
    return res.status(500).json({ message: 'Erreur lors du calcul des buteurs', error: error.message });
  }
};

// 🎯 Récupérer les meilleurs passeurs
exports.getTopAssisters = async (req, res) => {
  try {
    const queryText = `
      SELECT p.first_name, p.last_name, p.assists, p.position, t.name AS team_name
      FROM players p
      JOIN teams t ON p.team_id = t.id
      ORDER BY p.assists DESC, p.last_name ASC
      LIMIT 10;
    `;
    const { rows } = await pool.query(queryText);
    return res.status(200).json(rows);
  } catch (error) {
    console.error("Erreur SQL Passeurs :", error.message);
    return res.status(500).json({ message: 'Erreur lors du calcul des passeurs', error: error.message });
  }
};
