const jwt = require('jsonwebtoken');

// =========================================================================
// PROTECTION DES PAGES (ex. dashboard.html)
// -------------------------------------------------------------------------
// Une page HTML ne peut pas envoyer l'en-tête "Authorization" quand on y
// navigue. À la connexion, le serveur dépose donc le même jeton JWT dans un
// cookie HttpOnly (illisible depuis JavaScript). Avant de servir le dashboard,
// le serveur vérifie ce cookie : sans jeton valide, il redirige vers login.html.
// =========================================================================

const COOKIE_NAME = 'admin_session';
const COOKIE_MAX_AGE_SECONDS = 2 * 60 * 60; // même durée que le jeton JWT (2h)

// Même clé que authController.js et authMiddleware.js (lue à l'appel, pas au chargement)
const getSecret = () => process.env.JWT_SECRET || 'SECRET_KEY_CHAMPIONNAT';

const isHttps = (req) => req.secure || req.headers['x-forwarded-proto'] === 'https';

// Lit un cookie dans l'en-tête "Cookie" (pas besoin de la librairie cookie-parser)
function readCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() === name) {
      return part.slice(separator + 1).trim();
    }
  }
  return null;
}

// En-tête Set-Cookie envoyé à la connexion
function buildAuthCookie(token, req) {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${COOKIE_MAX_AGE_SECONDS}${isHttps(req) ? '; Secure' : ''}`;
}

// En-tête Set-Cookie envoyé à la déconnexion (supprime le cookie)
function clearAuthCookie(req) {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${isHttps(req) ? '; Secure' : ''}`;
}

// Middleware : laisse passer uniquement si le cookie contient un jeton JWT valide
function requireLoginPage(req, res, next) {
  // Ne jamais garder la page admin en cache (sinon le bouton "Retour" la réaffiche après déconnexion)
  res.setHeader('Cache-Control', 'no-store');

  try {
    const token = readCookie(req, COOKIE_NAME);
    if (!token) throw new Error('Aucun cookie de session.');
    req.user = jwt.verify(token, getSecret());
    return next();
  } catch (error) {
    return res.redirect('/login.html');
  }
}

module.exports = { requireLoginPage, buildAuthCookie, clearAuthCookie };
