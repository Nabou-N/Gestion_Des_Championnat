// Attendre que la page HTML index.html soit totalement chargée
document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.getElementById("ranking-table");
    const matchesContainer = document.getElementById("matches-container");

    // =========================================================
    // 1. FONCTION : Charger le classement dynamique (Style LaLiga)
    // =========================================================
    const loadRanking = async () => {
        try {
            const response = await fetch("/api/teams/ranking");
            
            if (!response.ok) {
                throw new Error("Erreur lors de la récupération des données serveurs");
            }
            
            const teams = await response.json();
            tableBody.innerHTML = ""; // Nettoyer les lignes de démonstration

            if (teams.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="10" style="text-align:center; color: var(--text-muted);">Aucune équipe enregistrée pour le moment.</td></tr>`;
                return;
            }

            // Générer et injecter les lignes pour chaque équipe
            teams.forEach((team, index) => {
                const position = index + 1;
                let zoneClass = "";

                // Règles de qualification LaLiga espagnole
                if (position <= 4) {
                    zoneClass = "cl-zone"; // Top 4 -> Ligue des Champions
                } else if (position === 5 || position === 6) {
                    zoneClass = "el-zone"; // 5ème et 6ème -> Ligue Europa
                } else if (position >= 18) {
                    zoneClass = "relegation-zone"; // 3 derniers -> Relégation D2
                }

                const dbValue = team.goal_difference !== undefined ? team.goal_difference : ((team.goals_for || 0) - (team.goals_against || 0));
                let diffSign = "";
                if (dbValue > 0) diffSign = "+";

                const row = `
                    <tr>
                        <td class="${zoneClass}">${position}</td>
                        <td style="text-align: left; padding-left: 10px;"><strong>${team.name}</strong> <span style="font-size: 0.85em; color: var(--text-muted);">(${team.city || ''})</span></td>
                        <td>${team.played || 0}</td>
                        <td>${team.won || 0}</td>
                        <td>${team.drawn || 0}</td>
                        <td>${team.lost || 0}</td>
                        <td>${team.goals_for || 0}</td>
                        <td>${team.goals_against || 0}</td>
                        <td style="font-weight: bold; color: ${dbValue > 0 ? '#2ecc71' : dbValue < 0 ? '#e74c3c' : 'inherit'}">${diffSign}${dbValue}</td>
                        <td><strong>${team.points || 0}</strong></td>
                    </tr>
                `;
                tableBody.insertAdjacentHTML("beforeend", row);
            });

        } catch (error) {
            console.error("❌ Erreur Classement :", error);
            tableBody.innerHTML = `
                <tr>
                    <td colspan="10" style="text-align:center; color: #ff4a4a; padding: 20px;">
                        Impossible de se connecter à la base de données du championnat.
                    </td>
                </tr>`;
        }
    };

    // =========================================================
    // 2. FONCTION : Charger le calendrier et gérer le filtre en temps réel
    // =========================================================
    const loadCalendarWithFilter = async () => {
        if (!matchesContainer) return;

        try {
            const response = await fetch("/api/matches");
            if (!response.ok) throw new Error("Erreur lors de la récupération des matchs");
            
            const matches = await response.json();
            const roundFilter = document.getElementById("roundFilter");

            if (matches.length === 0) {
                matchesContainer.innerHTML = "<p style='font-style: italic; opacity: 0.6;'>Aucun match planifié dans le calendrier.</p>";
                return;
            }

            // 1. Détecter dynamiquement le nombre total de journées générées
            const rounds = [...new Set(matches.map(m => m.round_number))].sort((a, b) => a - b);
            
            // 2. Remplir le menu déroulant (<select>) avec les journées disponibles
            roundFilter.innerHTML = "";
            rounds.forEach(round => {
                const option = document.createElement("option");
                option.value = round;
                option.textContent = `Journée ${round}`;
                roundFilter.appendChild(option);
            });

            // 3. Trouver la journée active (la première journée ayant des matchs non joués)
            let activeRound = rounds[0] || 1;
            const nextUpcomingMatch = matches.find(m => m.status === 'scheduled');
            if (nextUpcomingMatch) {
                activeRound = nextUpcomingMatch.round_number;
            }
            
            // Sélectionner par défaut la journée active
            roundFilter.value = activeRound;

            // 4. Fonction interne pour afficher les matchs d'une journée spécifique
            const displayMatchesByRound = (targetRound) => {
                matchesContainer.innerHTML = "";
                
                const filteredMatches = matches.filter(m => m.round_number == targetRound);

                if (filteredMatches.length === 0) {
                    matchesContainer.innerHTML = "<p style='font-style: italic; opacity: 0.6;'>Aucun match pour cette journée.</p>";
                    return;
                }

                filteredMatches.forEach(match => {
                    const scoreDisplay = match.status === 'finished' 
                        ? `${match.home_score} - ${match.away_score}` 
                        : "vs";
                        
                    const badgeStatus = match.status === 'finished'
                        ? `<span style="font-size: 0.7em; background: #2ecc71; color: white; padding: 2px 6px; border-radius: 3px; margin-left: 5px;">Terminé</span>`
                        : `<span style="font-size: 0.7em; background: #3498db; color: white; padding: 2px 6px; border-radius: 3px; margin-left: 5px;">À venir</span>`;

                    const card = `
                        <div class="match-card" style="border-left: 4px solid ${match.status === 'finished' ? '#2ecc71' : '#3498db'}">
                            <div>
                                <span class="match-teams">${match.home_team_name || 'Équipe Dom'} 🆚 ${match.away_team_name || 'Équipe Ext'}</span>
                                ${badgeStatus}
                            </div>
                            <div class="match-score" style="background: ${match.status === 'finished' ? '#111' : '#7f8c8d'};">${scoreDisplay}</div>
                        </div>
                    `;
                    matchesContainer.insertAdjacentHTML("beforeend", card);
                });
            };

            // Initialiser l'affichage sur la journée active (les matchs suivants)
            displayMatchesByRound(activeRound);

            // 5. FILTRE EN TEMPS RÉEL : Changement instantané au clic dans le menu déroulant
            roundFilter.addEventListener("change", (e) => {
                displayMatchesByRound(e.target.value);
            });

        } catch (error) {
            console.error("❌ Erreur Calendrier :", error);
            matchesContainer.innerHTML = "<p style='color:#ff4a4a;'>Impossible de charger le calendrier.</p>";
        }
    };

    // Lancement automatique au démarrage
    loadRanking();
    loadCalendarWithFilter(); // L'ancienne fonction loadRecentMatches est maintenant totalement écrasée et remplacée
});
