const pool = require('../config/db');

// ==========================================
// 1. AJOUTER UN JOUEUR À UNE ÉQUIPE (POST)
// ==========================================
exports.addPlayer = async (req, res) => {
  try {
    const { firstName, lastName, jerseyNumber, position, teamId } = req.body;

    const checkTeam = await pool.query('SELECT * FROM teams WHERE id = \$1', [teamId]);
    if (checkTeam.rows.length === 0) {
      return res.status(404).json({ message: "L'équipe spécifiée n'existe pas." });
    }

    const newPlayer = await pool.query(
      'INSERT INTO players (first_name, last_name, jersey_number, position, team_id) VALUES (\$1, \$2, \$3, \$4, \$5) RETURNING *',
      [firstName, lastName, jerseyNumber, position, teamId]
    );

    res.status(201).json({ message: 'Joueur ajouté avec succès !', player: newPlayer.rows[0] });
  } catch (error) {
    console.error("Erreur ajout joueur :", error.message);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ==========================================
// 2. RÉCUPÉRER LES JOUEURS D'UNE ÉQUIPE (GET)
// ==========================================
exports.getPlayersByTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    
    // CORRECTION : Utilisation de \$1 simple sans anti-slash bloquant
    const queryText = `
      SELECT p.id, p.first_name, p.last_name, p.jersey_number, p.position 
      FROM players p
      WHERE p.team_id = $1
      ORDER BY p.jersey_number ASC;
    `;
    
    const { rows } = await pool.query(queryText, [teamId]);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Erreur récupération effectif :", error.message);
    res.status(500).json({ message: 'Erreur serveur lors du chargement des joueurs.', error: error.message });
  }
};


// ==========================================
// 3. RÉCUPÉRER TOUS LES JOUEURS (GET)
// ==========================================
exports.getAllPlayers = async (req, res) => {
  try {
    const query = 'SELECT id, first_name, last_name, jersey_number, position, team_id FROM players ORDER BY last_name ASC;';
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Erreur serveur lors de la récupération des joueurs :", error.message);
    res.status(500).json({ message: "Erreur interne du serveur lors de la lecture des joueurs." });
  }
};
// ⚽ 1. OBTENIR LE TOP 10 DES BUTEURS (PICHICHI)
exports.getTopScorers = async (req, res) => {
  try {
    const query = `
      SELECT 
        p.id,
        p.first_name || ' ' || p.last_name AS name,
        p.position,
        t.name AS team_name,
        COUNT(g.id)::INT AS goals_count
      FROM players p
      JOIN teams t ON p.team_id = t.id
      LEFT JOIN match_goals g ON p.id = g.scorer_id
      GROUP BY p.id, t.name
      ORDER BY goals_count DESC, name ASC
      LIMIT 10; -- 📋 Limite stricte au Top 10 exigé
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors du calcul des buteurs." });
  }
};

// 🎯 2. OBTENIR LE TOP 10 DES PASSEURS
exports.getTopAssisters = async (req, res) => {
  try {
    const query = `
      SELECT 
        p.id,
        p.first_name || ' ' || p.last_name AS name,
        t.name AS team_name,
        COUNT(g.id)::INT AS assists_count
      FROM players p
      JOIN teams t ON p.team_id = t.id
      LEFT JOIN match_goals g ON p.id = g.assister_id
      GROUP BY p.id, t.name
      ORDER BY assists_count DESC, name ASC
      LIMIT 10; -- 📋 Limite stricte au Top 10 exigé
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors du calcul des passeurs." });
  }
};
