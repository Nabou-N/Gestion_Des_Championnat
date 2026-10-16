// =========================================================================
// MENU : le lien « Admin » n'apparaît que pour une personne connectée
// -------------------------------------------------------------------------
// Dans le HTML, le lien est caché par défaut (style="display: none;").
//  1. On lit le jeton enregistré à la connexion et on vérifie qu'il est lisible
//     et non expiré : si oui, le lien s'affiche tout de suite.
//  2. On demande ensuite au serveur de confirmer (/api/auth/me). S'il refuse
//     le jeton (401/403), le lien est recaché et le jeton supprimé.
//     Si le serveur ne répond pas ou ne connaît pas cette route (ancienne
//     version non redémarrée), le lien reste affiché.
// Ce lien n'est qu'un confort d'affichage : le dashboard reste de toute façon
// protégé côté serveur.
// =========================================================================

// Lit la date d'expiration (en secondes) écrite dans un jeton JWT ; null si le jeton est illisible
function readTokenExpiry(token) {
    try {
        const payload = token.split('.')[1];
        const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        const exp = JSON.parse(json).exp;
        return typeof exp === 'number' ? exp : null;
    } catch (error) {
        return null;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const adminLinks = document.querySelectorAll('a[href="dashboard.html"], a[href="/dashboard.html"]');
    if (adminLinks.length === 0) return;

    const showAdminLinks = (visible) => {
        adminLinks.forEach(link => { link.style.display = visible ? '' : 'none'; });
    };

    let token = null;
    try {
        token = localStorage.getItem('adminToken');
    } catch (error) {
        return; // stockage du navigateur indisponible : on laisse le lien caché
    }
    if (!token) return;

    // Étape 1 : vérification locale (jeton lisible et pas expiré)
    const expiry = readTokenExpiry(token);
    if (expiry === null || expiry * 1000 <= Date.now()) {
        localStorage.removeItem('adminToken');
        return;
    }
    showAdminLinks(true);

    // Étape 2 : confirmation par le serveur
    try {
        const response = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401 || response.status === 403) {
            showAdminLinks(false);
            localStorage.removeItem('adminToken');
        }
    } catch (error) {
        console.warn('Vérification de connexion impossible :', error);
    }
});
