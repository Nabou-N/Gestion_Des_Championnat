console.log("🚀 Étape 1 : Le fichier js/login.js est correctement lu par le navigateur.");


document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 Étape 2 : Le DOM est chargé, recherche du formulaire...");
    const loginForm = document.getElementById('loginForm');

    if (!loginForm) {
        console.error("❌ Étape 2 ÉCHOUÉE : Le formulaire avec l'ID 'loginForm' est introuvable. Vérifiez votre fichier login.html !");
        return;
    }

    console.log("✅ Étape 3 : Le formulaire a été trouvé ! Écoute du bouton activée.");

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("➡️ Étape 4 : Le clic sur le bouton a fonctionné ! Récupération des champs...");

        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        if (!emailInput || !passwordInput) {
            console.error("❌ Étape 4 ÉCHOUÉE : Les balises <input> avec l'id 'email' ou 'password' n'existent pas dans votre HTML.");
            alert("Erreur structurelle : champs de saisie introuvables.");
            return;
        }

        const email = emailInput.value;
        const password = passwordInput.value;

        console.log("⚡ Étape 5 : Envoi des données vers le serveur Node pour :", email);

        try {
            const response = await fetch('http://127.0.0.1:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            console.log("⚡ Étape 6 : Statut de la réponse du serveur :", response.status);
            const data = await response.json();

            if (response.ok) {
                console.log("🎉 Étape 7 : Authentification validée !");
                localStorage.setItem('adminToken', data.token);
                alert('✅ Connexion réussie !');
                window.location.href = 'dashboard.html';
            } else {
                console.warn("⚠️ Le serveur a rejeté les identifiants :", data.message);
                alert(`⚠️ Échec : ${data.message}`);
            }
        } catch (error) {
            console.error('❌ Étape 5 ÉCHOUÉE (Erreur Réseau) :', error);
            alert('❌ Impossible de joindre le serveur. Vérifiez que votre terminal affiche bien la réussite de la connexion.');
        }
    });
});
