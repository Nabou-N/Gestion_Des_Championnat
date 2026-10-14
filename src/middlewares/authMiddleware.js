const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Récupérer le token depuis l'en-tête Authorization (format: Bearer <TOKEN>)
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Accès refusé. Aucun token fourni.' });
  }

  try {
    // Vérifier et décoder le token avec votre clé secrète
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SECRET_KEY_CHAMPIONNAT');
    req.user = decoded; // Ajoute les infos de l'utilisateur décodé à la requête
    next(); // Autorise le passage au contrôleur suivant
  } catch (error) {
    res.status(403).json({ message: 'Token invalide ou expiré.' });
  }
};
