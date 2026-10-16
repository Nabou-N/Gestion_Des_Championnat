const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { buildAuthCookie, clearAuthCookie } = require('../middlewares/pageAuth');

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

    // 4. Cookie de session (HttpOnly) : permet au serveur de n'afficher dashboard.html qu'aux personnes connectées
    res.setHeader('Set-Cookie', buildAuthCookie(token, req));

    res.status(200).json({ token, message: 'Connexion réussie !' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'authentification.', error: error.message });
  }
};

// Vérifie qu'un jeton est valide (la route est protégée par verifyToken) : sert à afficher le lien « Admin »
exports.me = (req, res) => {
  res.status(200).json({ authenticated: true, role: req.user.role });
};

// Déconnexion : supprime le cookie de session (le navigateur supprime lui-même le jeton du localStorage)
exports.logout = (req, res) => {
  res.setHeader('Set-Cookie', clearAuthCookie(req));
  res.status(200).json({ message: 'Déconnexion réussie.' });
};
