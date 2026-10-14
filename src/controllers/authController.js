const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // 1. Chercher l'utilisateur dans PostgreSQL
    const userQuery = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (userQuery.rows.length === 0) {
      return res.status(400).json({ message: 'Identifiants incorrects.' });
    }

    // EXTRACTION FIXE : On récupère la première ligne du tableau rows
    const user = userQuery.rows[0];

    // 2. Vérifier le mot de passe haché (Bcrypt compare admin123 avec le hash)
    if (password !== user.password) {
      console.log("❌ Le mot de passe ne correspond pas !");
      return res.status(400).json({ message: 'Identifiants incorrects.' });
    }
    // 3. Générer le jeton JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'SECRET_KEY_CHAMPIONNAT',
      { expiresIn: '2h' }
    );

    res.status(200).json({ token, message: 'Connexion réussie !' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'authentification.', error: error.message });
  }
};
