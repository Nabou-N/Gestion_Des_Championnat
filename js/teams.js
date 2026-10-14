document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("teams-container");

    // ==========================================
    // 1. Charger toutes les équipes existantes
    // ==========================================
    const loadTeams = async () => {
        try {
            // Utilisation du chemin relatif propre exigé par le navigateur
            const response = await fetch("/api/teams");
            const teams = await response.json();

            if (!container) return;
            container.innerHTML = "";

            if (teams.length === 0) {
                container.innerHTML = "<p style='text-align:center; color: #a0aec0;'>Aucune équipe enregistrée pour le moment.</p>";
                return;
            }

            teams.forEach(team => {
                const card = `
                    <div class="team-card" data-id="${team.id}" style="background: #1e293b; border: 1px solid rgba(255, 255, 255, 0.05); padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.2); transition: transform 0.2s, border-color 0.2s;">
                        <h2 style="color: #00ff87; margin-top: 0; margin-bottom: 8px; font-size: 1.5em; font-weight: bold;">${team.name}</h2>
                        <p style="color: #a0aec0; font-size: 0.9em; margin: 4px 0;">📍 Ville : <span style="color: #fff;">${team.city}</span></p>
                        <p style="color: #a0aec0; font-size: 0.9em; margin: 4px 0; margin-bottom: 15px;">📋 Entraîneur : <span style="color: #fff;">${team.coach || 'Non défini'}</span></p>
                        
                        <!-- Bouton synchronisé avec le violet/indigo de votre barre de navigation LiveLeague -->
                        <button class="view-btn" style="background: #6366f1; color: #fff; border: none; padding: 8px 16px; font-weight: bold; border-radius: 6px; cursor: pointer; width: 100%; transition: background 0.2s;">Voir l'effectif</button>
                        
                        <div class="players-list" id="players-team-${team.id}" style="display: none; margin-top: 15px; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 12px;">
                            <p style="text-align:center; font-size:0.85em; color:#a0aec0; font-style: italic;">Chargement des joueurs...</p>
                        </div>
                    </div>
                `;
                container.insertAdjacentHTML("beforeend", card);
            });

            // Associer l'événement de clic uniquement au bouton "Voir l'effectif"
            document.querySelectorAll(".team-card").forEach(card => {
                const btn = card.querySelector(".view-btn");
                if (btn) {
                    // Effets de survol (hover) sur le bouton violet
                    btn.addEventListener("mouseover", () => btn.style.background = "#4f46e5");
                    btn.addEventListener("mouseout", () => btn.style.background = "#6366f1");

                    btn.addEventListener("click", (e) => {
                        e.stopPropagation();
                        togglePlayers(card.dataset.id, btn);
                    });
                }
            });

        } catch (error) {
            console.error("Erreur chargement équipes :", error);
            if (container) {
                container.innerHTML = "<p style='text-align:center; color:#ff4a4a; font-weight: bold;'>❌ Erreur lors du chargement des équipes.</p>";
            }
        }
    };

    // ==========================================
    // 2. Dérouler ou enrouler la liste des joueurs
    // ==========================================
    const togglePlayers = async (teamId, buttonElement) => {
        const listDiv = document.getElementById(`players-team-${teamId}`);
        if (!listDiv) return;
        
        // Si la liste est visible, on la replie simplement et on change le texte du bouton
        if (listDiv.style.display === "block") {
            listDiv.style.display = "none";
            buttonElement.textContent = "Voir l'effectif";
            buttonElement.style.background = "#6366f1";
            return;
        }

        // Si on l'ouvre, on change la couleur du bouton en mode "Actif" (fond sombre)
        listDiv.style.display = "block";
        buttonElement.textContent = "Masquer l'effectif";
        listDiv.innerHTML = "<p style='text-align:center; font-size:0.85em; color:#a0aec0; font-style: italic;'>Chargement des joueurs...</p>";

        try {
            const response = await fetch(`/api/players/team/${teamId}`);
            const players = await response.json();

            listDiv.innerHTML = "";
            if (players.length === 0) {
                listDiv.innerHTML = "<p style='font-size:0.85em; text-align:center; color:#a0aec0; padding: 5px; font-style: italic;'>Aucun joueur dans l'effectif.</p>";
                return;
            }

            players.forEach(player => {
                const displayName = player.name ? player.name : `${player.first_name || player.firstname || ''} ${player.last_name || player.lastname || ''}`.trim();
                const jersey = player.jersey_number !== undefined ? player.jersey_number : (player.jerseyNumber !== undefined ? player.jerseyNumber : '?');

                const item = `
                    <div class="player-item" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 0.9em; background: rgba(255,255,255,0.03); padding: 8px 10px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.02);">
                        <span style="color: #fff;"><span style="color: #6366f1; font-weight: bold; margin-right: 5px;">#${jersey}</span> <strong>${displayName}</strong></span>
                        <span style="color: #00ff87; font-size:0.85em; background: rgba(0, 255, 135, 0.1); padding: 2px 6px; border-radius: 4px; font-weight: bold;">${player.position || 'Non défini'}</span>
                    </div>
                `;
                listDiv.insertAdjacentHTML("beforeend", item);
            });
        } catch (error) {
            console.error("Erreur effectif :", error);
            listDiv.innerHTML = "<p style='font-size:0.85em; text-align:center; color:#ff4a4a; font-weight: bold;'>⚠️ Impossible de charger l'effectif.</p>";
        }
    };

    loadTeams();
});
