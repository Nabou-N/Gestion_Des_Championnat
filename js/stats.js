document.addEventListener("DOMContentLoaded", () => {
    console.log("Page des statistiques initialisée.");

    // 🔍 CORRECTION : Ciblage par ID unique (sécurisé à 100%)
    const scorersTableBody = document.getElementById("scorers-table-body");
    const assistersTableBody = document.getElementById("assisters-table-body");

    // =========================================================
    // ⚽ 1. Charger le Top 10 des Buteurs (Pichichi)
    // =========================================================
    const loadTopScorers = async () => {
        if (!scorersTableBody) return;
        try {
            const response = await fetch("/api/players/top-scorers");
            if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
            
            const players = await response.json();
            scorersTableBody.innerHTML = ""; 

            if (players.length === 0) {
                scorersTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#a0aec0; font-style:italic;">Aucun but inscrit pour le moment.</td></tr>`;
                return;
            }

            players.forEach((p, index) => {
                const row = `
                    <tr>
                        <td style="font-weight: bold; color: #a0aec0;">${index + 1}</td>
                        <td style="text-align: left; padding-left: 15px;">
                            <strong>${p.name}</strong> 
                            <span style="font-size:0.85em; color:#a0aec0;">(${p.position || 'Joueur'})</span>
                        </td>
                        <td>${p.team_name}</td>
                        <td style="font-weight: bold; color: #00ff87; font-size: 1.1em;">${p.goals_count || 0}</td>
                    </tr>
                `;
                scorersTableBody.insertAdjacentHTML("beforeend", row);
            });
        } catch (error) {
            console.error("Erreur buteurs :", error);
            scorersTableBody.innerHTML = `<tr><td colspan="4" style="color:#ff4a4a; text-align:center; font-weight:bold;">⚠️ Erreur.</td></tr>`;
        }
    };

    // =========================================================
    // 🎯 2. Charger le Top 10 des Passeurs Décisifs
    // =========================================================
    const loadTopAssisters = async () => {
        if (!assistersTableBody) {
            console.warn("Conteneur #assisters-table-body introuvable dans le HTML.");
            return;
        }

        try {
            const response = await fetch("/api/players/top-assisters");
            if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
            
            const players = await response.json();
            assistersTableBody.innerHTML = ""; 

            if (players.length === 0) {
                assistersTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#a0aec0; font-style:italic;">Aucune passe décisive enregistrée.</td></tr>`;
                return;
            }

            players.forEach((p, index) => {
                const row = `
                    <tr>
                        <td style="font-weight: bold; color: #a0aec0;">${index + 1}</td>
                        <td style="text-align: left; padding-left: 15px;"><strong>${p.name}</strong></td>
                        <td>${p.team_name}</td>
                        <td style="font-weight: bold; color: #6366f1; font-size: 1.1em;">${p.assists_count || 0}</td>
                    </tr>
                `;
                assistersTableBody.insertAdjacentHTML("beforeend", row);
            });
        } catch (error) {
            console.error("Erreur passeurs :", error);
            assistersTableBody.innerHTML = `<tr><td colspan="4" style="color:#ff4a4a; text-align:center; font-weight:bold;">⚠️ Erreur.</td></tr>`;
        }
    };

    // Lancement simultané des requêtes
    loadTopScorers();
    loadTopAssisters();
});
