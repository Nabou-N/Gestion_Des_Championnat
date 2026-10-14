// 🔐 SÉCURITÉ GLOBALE : Récupération du jeton pour tout le fichier
const token = localStorage.getItem('adminToken');

// Si aucun jeton n'est trouvé, on bloque l'accès visuel et on redirige instantanément
if (!token) {
    alert("⛔ Accès interdit ! Veuillez vous connecter d'abord.");
    window.location.replace('login.html');
}

// Tout le code s'exécute une fois le DOM chargé
document.addEventListener("DOMContentLoaded", () => {

    console.log("⚙️ Dashboard initialisé avec succès.");

    // Tableaux de stockage temporaires pour accumuler les événements avant l'envoi final
    let currentMatchGoals = [];
    let currentMatchCards = [];
    let allMatchesList = [];
    let allPlayersList = [];

    // Sélecteurs des éléments du DOM
    const scoreMatchSelect = document.getElementById("scoreMatchSelect");
    const eventsSection = document.getElementById("eventsSection");

    // =========================================================
    // 0. GESTION DE LA DÉCONNEXION (LOGOUT)
    // =========================================================
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('adminToken');
            alert("👋 Déconnexion réussie ! Vos accès sont verrouillés.");
            window.location.replace('login.html');
        });
    }

    // =========================================================
    // 1. FORMULAIRE : CRÉATION D'UNE ÉQUIPE (POST)
    // =========================================================
    const teamForm = document.getElementById('teamForm');
    if (teamForm) {
        teamForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const teamData = {
                name: document.getElementById('teamName').value,
                city: document.getElementById('teamCity').value,
                foundedYear: parseInt(document.getElementById('teamYear').value) || null,
                logoUrl: "https://example.com"
            };

            try {
                const response = await fetch("/api/teams", {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(teamData)
                });

                const result = await response.json();

                if (response.ok) {
                    alert(`✅ Équipe "${teamData.name}" ajoutée avec succès !`);
                    teamForm.reset();
                    // Synchronisation : recharge la liste des équipes dans le formulaire des joueurs
                    loadTeamsToPlayerForm();
                } else {
                    alert(`⚠️ Erreur : ${result.message}`);
                }
            } catch (error) {
                alert("❌ Impossible de joindre le serveur pour créer l'équipe.");
            }
        });
    }

    // =========================================================
    // 2.A FONCTION : CHARGEMENT DES MATCHS PROGRAMMÉS (SELECT)
    // =========================================================
    const loadMatchesToSelect = async () => {
        if (!scoreMatchSelect) return;

        try {
            const response = await fetch("/api/matches");
            if (!response.ok) throw new Error("Erreur de récupération des matchs");

            allMatchesList = await response.json();
            scoreMatchSelect.innerHTML = '<option value="">-- Choisissez un match à clôturer --</option>';

            const upcomingMatches = allMatchesList.filter(m => m.status === 'scheduled' || m.status === 'Scheduled');

            if (upcomingMatches.length === 0) {
                scoreMatchSelect.innerHTML = '<option value="">🎉 Tous les matchs ont été joués !</option>';
                if (eventsSection) eventsSection.style.display = "none";
                return;
            }

            upcomingMatches.forEach(match => {
                const option = document.createElement("option");
                option.value = match.id;
                option.textContent = `J${match.round_number} : ${match.home_team_name} 🆚 ${match.away_team_name}`;
                scoreMatchSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Erreur chargement sélecteur matchs :", error);
            scoreMatchSelect.innerHTML = '<option value="">❌ Erreur de chargement des matchs</option>';
        }
    };

    // =========================================================
    // 2.B FONCTION : CHARGEMENT BRUT DE TOUS LES JOUEURS (SELECT)
    // =========================================================
    const loadPlayersToSelects = async () => {
        try {
            const response = await fetch("/api/players");
            if (!response.ok) throw new Error("Impossible de récupérer les joueurs");
            allPlayersList = await response.json();
        } catch (err) {
            console.error("Erreur lors du chargement des joueurs :", err);
        }
    };

    // =========================================================
    // 2.C FONCTION : CHARGEMENT DES ÉQUIPES DANS LE FORMULAIRE JOUEUR
    // =========================================================
    const loadTeamsToPlayerForm = async () => {
        const playerTeamSelect = document.getElementById("playerTeamId");
        if (!playerTeamSelect) return;

        try {
            const response = await fetch("/api/teams");
            if (!response.ok) throw new Error("Erreur de récupération des équipes");

            const teams = await response.json();
            playerTeamSelect.innerHTML = '<option value="">-- Choisissez une équipe --</option>';

            if (teams.length === 0) {
                playerTeamSelect.innerHTML = '<option value="">⚠️ Aucune équipe enregistrée</option>';
                return;
            }

            teams.forEach(team => {
                const option = document.createElement("option");
                option.value = team.id;
                option.textContent = team.name;
                playerTeamSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Erreur chargement sélecteur équipes joueur :", error);
            playerTeamSelect.innerHTML = '<option value="">❌ Erreur de chargement des équipes</option>';
        }
    };

    // Appels d'initialisation au chargement de la page
    loadMatchesToSelect();
    loadPlayersToSelects();
    loadTeamsToPlayerForm();
    // =========================================================================
    // 🎛️ FILTRAGE STRICT EN TEMPS RÉEL : CLUBS DOMICILE VS EXTÉRIEUR
    // =========================================================================
    if (scoreMatchSelect) {
        scoreMatchSelect.addEventListener("change", (e) => {
            const selectedMatchId = parseInt(e.target.value);
            
            if (isNaN(selectedMatchId)) {
                if (eventsSection) eventsSection.style.display = "none";
                return;
            }

            const match = allMatchesList.find(m => m.id === selectedMatchId);
            if (!match) return;

            // Rendre visible le bloc de composition dynamique
            if (eventsSection) eventsSection.style.display = "flex";

            // Dynamiser visuellement les labels et titres avec les vrais noms des clubs
            document.getElementById("labelHome").textContent = `Score de ${match.home_team_name} (Dom)`;
            document.getElementById("labelAway").textContent = `Score de ${match.away_team_name} (Ext)`;
            document.getElementById("titleHomeTeam").textContent = `🏡 Buteurs & Cartons : ${match.home_team_name}`;
            document.getElementById("titleAwayTeam").textContent = `🚀 Buteurs & Cartons : ${match.away_team_name}`;

            // Séparation des joueurs selon l'équipe liée au match
            const homePlayers = allPlayersList.filter(p => parseInt(p.team_id) === parseInt(match.home_team_id));
            const awayPlayers = allPlayersList.filter(p => parseInt(p.team_id) === parseInt(match.away_team_id));

            // Helper interne pour remplir une liste déroulante filtrée
            const populateSelect = (selectId, players, defaultText) => {
                const selectEl = document.getElementById(selectId);
                if (!selectEl) return;
                selectEl.innerHTML = `<option value="">-- ${defaultText} --</option>`;
                players.forEach(p => {
                    const displayName = p.name ? p.name : `${p.first_name || p.firstname || ''} ${p.last_name || p.lastname || ''}`.trim();
                    selectEl.insertAdjacentHTML("beforeend", `<option value="${p.id}">${displayName}</option>`);
                });
            };

            // Remplissage sélectif Domicile
            populateSelect("homeScorerSelect", homePlayers, "Buteur");
            populateSelect("homeAssisterSelect", homePlayers, "Passeur");
            populateSelect("homeCardPlayerSelect", homePlayers, "Joueur Sanctionné");

            // Remplissage sélectif Extérieur
            populateSelect("awayScorerSelect", awayPlayers, "Buteur");
            populateSelect("awayAssisterSelect", awayPlayers, "Passeur");
            populateSelect("awayCardPlayerSelect", awayPlayers, "Joueur Sanctionné");
        });
    }

    // =========================================================================
    // 2.D INTERACTION DES BOUTONS "+" (SYNCHRONISATION ET ACCUMULATION)
    // =========================================================================
    
    // 🏠 BUT DOMICILE (+) avec synchronisation immédiate du score en haut
    document.getElementById("addHomeGoalBtn").addEventListener("click", () => {
        const select = document.getElementById("homeScorerSelect");
        const assisterSelect = document.getElementById("homeAssisterSelect");
        const minute = parseInt(document.getElementById("homeGoalMinute").value);
        const scoreHomeInput = document.getElementById("scoreHome");

        if (!select.value || isNaN(minute)) return alert("⚠️ Veuillez sélectionner un buteur et indiquer la minute !");

        currentMatchGoals.push({ scorer_id: parseInt(select.value), assister_id: assisterSelect.value ? parseInt(assisterSelect.value) : null, minute });
        
        let currentHomeScore = parseInt(scoreHomeInput.value) || 0;
        scoreHomeInput.value = currentHomeScore + 1;

        document.getElementById("temporaryGoalsList").insertAdjacentHTML("beforeend", `<li>⚽ ${minute}' - ${select.options[select.selectedIndex].text} (Domicile)</li>`);
        document.getElementById("homeGoalMinute").value = "";
    });

    // 🚀 BUT EXTÉRIEUR (+) avec synchronisation immédiate du score en haut
    document.getElementById("addAwayGoalBtn").addEventListener("click", () => {
        const select = document.getElementById("awayScorerSelect");
        const assisterSelect = document.getElementById("awayAssisterSelect");
        const minute = parseInt(document.getElementById("awayGoalMinute").value);
        const scoreAwayInput = document.getElementById("scoreAway");

        if (!select.value || isNaN(minute)) return alert("⚠️ Veuillez sélectionner un buteur et indiquer la minute !");

        currentMatchGoals.push({ scorer_id: parseInt(select.value), assister_id: assisterSelect.value ? parseInt(assisterSelect.value) : null, minute });
        
        let currentAwayScore = parseInt(scoreAwayInput.value) || 0;
        scoreAwayInput.value = currentAwayScore + 1;

        document.getElementById("temporaryGoalsList").insertAdjacentHTML("beforeend", `<li>⚽ ${minute}' - ${select.options[select.selectedIndex].text} (Extérieur)</li>`);
        document.getElementById("awayGoalMinute").value = "";
    });

    // CARTON DOMICILE (+)
    document.getElementById("addHomeCardBtn").addEventListener("click", () => {
        const select = document.getElementById("homeCardPlayerSelect");
        const type = document.getElementById("homeCardTypeSelect").value;
        const minute = parseInt(document.getElementById("homeCardMinute").value);
        
        if (!select.value || isNaN(minute)) return alert("⚠️ Veuillez sélectionner un joueur et indiquer la minute !");
        
        currentMatchCards.push({ player_id: parseInt(select.value), card_type: type, minute });
        const emoji = type === 'Yellow' ? '🟨' : '🟥';
        document.getElementById("temporaryCardsList").insertAdjacentHTML("beforeend", `<li>${emoji} ${minute}' - ${select.options[select.selectedIndex].text} (Domicile)</li>`);
        document.getElementById("homeCardMinute").value = "";
    });

    // CARTON EXTÉRIEUR (+)
    document.getElementById("addAwayCardBtn").addEventListener("click", () => {
        const select = document.getElementById("awayCardPlayerSelect");
        const type = document.getElementById("awayCardTypeSelect").value;
        const minute = parseInt(document.getElementById("awayCardMinute").value);
        
        if (!select.value || isNaN(minute)) return alert("⚠️ Veuillez sélectionner un joueur et indiquer la minute !");
        
        currentMatchCards.push({ player_id: parseInt(select.value), card_type: type, minute });
        const emoji = type === 'Yellow' ? '🟨' : '🟥';
        document.getElementById("temporaryCardsList").insertAdjacentHTML("beforeend", `<li>${emoji} ${minute}' - ${select.options[select.selectedIndex].text} (Extérieur)</li>`);
        document.getElementById("awayCardMinute").value = "";
    });

    // =========================================================
    // 2.E SOUMISSION COMPLÈTE DE LA FEUILLE DE MATCH (PUT)
    // =========================================================

    const matchForm = document.getElementById("matchForm");
    if (matchForm) {
        matchForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            if (!scoreMatchSelect) return;
            const matchId = parseInt(scoreMatchSelect.value);
            
            // 🔍 DÉTECTION ROBUSTE : On cherche l'élément sous ses deux formes d'ID possibles
            const homeScoreEl = document.getElementById("scoreHome") || document.getElementById("homeScore");
            const awayScoreEl = document.getElementById("scoreAway") || document.getElementById("awayScore");

            if (!homeScoreEl || !awayScoreEl) {
                alert("❌ Erreur structurelle HTML : Les champs de saisie du score (scoreHome / scoreAway) sont introuvables.");
                return;
            }

            const homeScore = parseInt(homeScoreEl.value) || 0;
            const awayScore = parseInt(awayScoreEl.value) || 0;

            if (isNaN(matchId)) {
                alert("⚠️ Veuillez sélectionner un match dans la liste !");
                return;
            }

            const bodyPayload = {
                homeScore: homeScore,
                awayScore: awayScore,
                goals: currentMatchGoals,
                cards: currentMatchCards
            };

            try {
                const response = await fetch(`/api/matches/${matchId}/score`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(bodyPayload)
                });

                if (response.ok) {
                    alert("🏆 Feuille de match globale enregistrée avec succès (Scores, Buteurs & Cartons) !");
                    matchForm.reset();
                    
                    currentMatchGoals = [];
                    currentMatchCards = [];
                    document.getElementById("temporaryGoalsList").innerHTML = "";
                    document.getElementById("temporaryCardsList").innerHTML = "";
                    
                    if (eventsSection) eventsSection.style.display = "none";
                    loadMatchesToSelect(); 
                } else {
                    const result = await response.json();
                    alert(`⚠️ Échec : ${result.message}`);
                }
            } catch (error) {
                console.error(error);
                alert("❌ Erreur réseau lors de la mise à jour de la feuille de match.");
            }
        });
    }

    // ===============================================
    // 3. ACTION : GENERATEUR DE CALENDRIER AUTOMATIQUE (POST)
    // ===============================================
    const generateCalendarBtn = document.getElementById('generateCalendarBtn');
    if (generateCalendarBtn) {
        generateCalendarBtn.addEventListener('click', async () => {
            const confirmation = confirm(
                "⚠️ Attention : Générer un nouveau calendrier effacera les anciens matchs non clôturés. Continuer ?"
            );
            if (!confirmation) return;
            
            try {
                const response = await fetch("/api/matches/generate-calendar", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });

                const result = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(result.message || `Erreur HTTP ${response.status}`);
                }

                alert(result.message || "✅ Calendrier généré avec succès !");
                loadMatchesToSelect(); // Actualise le sélecteur après génération
                
            } catch (error) {
                console.error("Erreur de génération du calendrier :", error);
                alert("❌ Impossible de générer le calendrier : " + error.message);
            }
        });
    }

    // ==========================================
    // 4. FORMULAIRE : AJOUT D'UN JOUEUR (POST)
    // ==========================================
    const playerForm = document.getElementById("playerForm");
    if (playerForm) {
        playerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const firstNameEl = document.getElementById("playerFirstName");
            const lastNameEl = document.getElementById("playerLastName");
            const jerseyEl = document.getElementById("playerJersey");
            const positionEl = document.getElementById("playerPosition");
            const teamIdEl = document.getElementById("playerTeamId");

            if (!firstNameEl || !lastNameEl || !jerseyEl || !positionEl || !teamIdEl) {
                alert("Erreur structurelle : champs de saisie introuvables.");
                return;
            }

            const teamId = parseInt(teamIdEl.value, 10);
            if (isNaN(teamId)) {
                alert("⚠️ Veuillez sélectionner une équipe valide dans la liste !");
                return;
            }

            const playerData = {
                firstName: firstNameEl.value.trim(),
                lastName: lastNameEl.value.trim(),
                jerseyNumber: parseInt(jerseyEl.value, 10),
                position: positionEl.value,
                teamId: teamId
            };

            try {
                const response = await fetch("/api/players", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(playerData)
                });

                const result = await response.json();

                if (response.ok) {
                    alert(`✅ Joueur "${playerData.firstName} ${playerData.lastName}" enregistré avec succès !`);
                    playerForm.reset();
                    loadPlayersToSelects(); // Rafraîchit instantanément la mémoire globale des joueurs
                } else {
                    alert(`⚠️ Le serveur a refusé l'ajout : ${result.message}`);
                }
            } catch (error) {
                console.error("❌ Erreur critique lors de l'appel réseau :", error);
                alert("❌ Impossible de joindre le serveur pour ajouter le joueur.");
            }
        });
    }
});

// SÉCURITÉ ULTRA-RAPIDE : S'exécute immédiatement au chargement brut du fichier (Anti-Bypass)
(function() {
    const checkToken = localStorage.getItem('adminToken');
    if (!checkToken) {
        window.location.replace('login.html');
    } else {
        document.documentElement.style.setProperty('display', 'block');
        window.addEventListener('DOMContentLoaded', () => {
            document.body.style.display = 'block';
        });
    }
})();
