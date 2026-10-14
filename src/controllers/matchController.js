const pool = require('../config/db');

// =========================================================================
// OUTIL : EXÉCUTER UNE TRANSACTION POSTGRESQL (SÉCURITÉ ANTI-CRASH)
// =========================================================================
async function executeTransaction(callback) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        try {
            await client.query('ROLLBACK');
        } catch (rollbackError) {
            console.error('Erreur rollback :', rollbackError.message);
        }
        throw error;
    } finally {
        client.release();
    }
}

// =========================================================================
// 1. GÉNÉRER LE CALENDRIER COMPLET (MATCHS ALLER-RETOUR)
// =========================================================================
exports.generateCalendar = async (req, res) => {
    try {
        const result = await pool.query('SELECT id FROM teams ORDER BY id ASC');
        let teams = result.rows.map(row => row.id);

        if (teams.length < 2) {
            return res.status(400).json({
                message: 'Il faut au moins 2 équipes pour générer le championnat !'
            });
        }

        if (teams.length % 2 !== 0) {
            teams.push(null);
        }

        const numTeams = teams.length;
        const totalRounds = numTeams - 1;
        const matchesPerRound = numTeams / 2;
        const firstLegMatches = [];

        // Génération de l'Algorithme de Berger pour la Phase Aller
        for (let round = 0; round < totalRounds; round++) {
            for (let i = 0; i < matchesPerRound; i++) {
                const home = teams[i];
                const away = teams[numTeams - 1 - i];

                if (home !== null && away !== null) {
                    firstLegMatches.push({
                        round_number: round + 1,
                        home_team_id: round % 2 === 0 ? home : away,
                        away_team_id: round % 2 === 0 ? away : home
                    });
                }
            }
            // Rotation circulaire des clubs pour équilibrer le calendrier
            teams.splice(1, 0, teams.pop());
        }

        const allMatches = [...firstLegMatches];
        // Génération automatique de la Phase Retour (Inversion stricte des rôles)
        for (const match of firstLegMatches) {
            allMatches.push({
                round_number: match.round_number + totalRounds,
                home_team_id: match.away_team_id,
                away_team_id: match.home_team_id
            });
        }

        await executeTransaction(async client => {
            // Nettoyage complet des anciens matchs non clôturés pour la nouvelle saison
            await client.query(`
                DELETE FROM matches
                WHERE LOWER(COALESCE(status, 'scheduled')) = 'scheduled'
            `);

            // Réinitialisation absolue des points du classement général (Style LaLiga)
            await client.query(`
                UPDATE teams
                SET played = 0, won = 0, drawn = 0, lost = 0,
                    goals_for = 0, goals_against = 0, points = 0
            `);

            // Insertion groupée optimisée par lots pour éviter les saturations réseau
            const batchSize = 300;

            for (let i = 0; i < allMatches.length; i += batchSize) {
                const batch = allMatches.slice(i, i + batchSize);
                const values = [];
                const placeholders = [];

                batch.forEach((match, index) => {
                    const offset = index * 3;
                    placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, 'scheduled')`);
                    values.push(match.round_number, match.home_team_id, match.away_team_id);
                });

                await client.query(`
                    INSERT INTO matches (round_number, home_team_id, away_team_id, status)
                    VALUES ${placeholders.join(', ')}
                `, values);
            }
        });

        return res.status(201).json({
            message: `🎉 Championnat configuré ! ${allMatches.length} matchs créés.`,
            totalMatches: allMatches.length,
            totalRounds: totalRounds * 2
        });

    } catch (error) {
        console.error('Erreur génération calendrier :', error);
        return res.status(500).json({
            message: 'Erreur lors de la génération du calendrier.',
            error: error.message
        });
    }
};
// =========================================================================
// 2. ENREGISTRER LE SCORE ET METTRE À JOUR LES STATISTIQUES (INC. COMPTEURS PLAYERS)
// =========================================================================
exports.updateScore = async (req, res) => {
    const matchId = Number(req.params.id);
    const { homeScore, awayScore, goals = [], cards = [] } = req.body;

    if (!Number.isInteger(matchId) || matchId <= 0) {
        return res.status(400).json({ message: 'ID du match invalide.' });
    }

    if (!Number.isInteger(Number(homeScore)) || !Number.isInteger(Number(awayScore)) || Number(homeScore) < 0 || Number(awayScore) < 0) {
        return res.status(400).json({ message: 'Les scores doivent être des nombres entiers positifs ou nuls.' });
    }

    if (!Array.isArray(goals) || !Array.isArray(cards)) {
        return res.status(400).json({ message: 'Les buts et les cartons doivent être des tableaux.' });
    }

    try {
        await executeTransaction(async client => {
            const matchQuery = await client.query('SELECT * FROM matches WHERE id = \$1 FOR UPDATE', [matchId]);
            if (matchQuery.rows.length === 0) {
                const error = new Error('Match non trouvé.');
                error.statusCode = 404;
                throw error;
            }

            const match = matchQuery.rows[0];
            if (match.status === 'finished') {
                const error = new Error('Ce match a déjà été clôturé.');
                error.statusCode = 400;
                throw error;
            }

            const hs = Number(homeScore);
            const as = Number(awayScore);

            // Mise à jour de la table principale du match
            await client.query(`UPDATE matches SET home_score = $1, away_score = $2, status = 'finished' WHERE id = $3`, [hs, as, matchId]);

            let homePoints = 0, awayPoints = 0;
            let hWon = 0, hDrawn = 0, hLost = 0;
            let aWon = 0, aDrawn = 0, aLost = 0;

            if (hs > as) { homePoints = 3; hWon = 1; aLost = 1; } 
            else if (hs < as) { awayPoints = 3; aWon = 1; hLost = 1; } 
            else { homePoints = 1; awayPoints = 1; hDrawn = 1; aDrawn = 1; }

            // Distribution des points à l'équipe domicile
            await client.query(`
                UPDATE teams SET played = played + 1, won = won + $1, drawn = drawn + $2, lost = lost + $3,
                    goals_for = goals_for + $4, goals_against = goals_against + $5, points = points + $6 WHERE id = $7
            `, [hWon, hDrawn, hLost, hs, as, homePoints, match.home_team_id]);

            // Distribution des points à l'équipe extérieur
            await client.query(`
                UPDATE teams SET played = played + 1, won = won + $1, drawn = drawn + $2, lost = lost + $3,
                    goals_for = goals_for + $4, goals_against = goals_against + $5, points = points + $6 WHERE id = $7
            `, [aWon, aDrawn, aLost, as, hs, awayPoints, match.away_team_id]);

            // ⚡ SYNCHRONISATION DES BUTS : Incrémente +1 goals/assists dans public.players !
            for (const goal of goals) {
                await client.query(`INSERT INTO match_goals (match_id, scorer_id, assister_id, minute) VALUES ($1, $2, $3, $4)`, 
                    [matchId, goal.scorer_id, goal.assister_id || null, goal.minute]);

                await client.query(`UPDATE players SET goals = COALESCE(goals, 0) + 1 WHERE id = $1`, [goal.scorer_id]);

                if (goal.assister_id) {
                    await client.query(`UPDATE players SET assists = COALESCE(assists, 0) + 1 WHERE id = $1`, [goal.assister_id]);
                }
            }

            // ⚡ SYNCHRONISATION DES CARTONS : Incrémente +1 yellow_cards/red_cards dans public.players !
            for (const card of cards) {
                await client.query(`INSERT INTO match_cards (match_id, player_id, card_type, minute) VALUES ($1, $2, $3, $4)`,
                    [matchId, card.player_id, card.card_type, card.minute]);

                if (card.card_type === 'Yellow' || card.card_type === 'yellow') {
                    await client.query(`UPDATE players SET yellow_cards = COALESCE(yellow_cards, 0) + 1 WHERE id = $1`, [card.player_id]);
                } else if (card.card_type === 'Red' || card.card_type === 'red') {
                    await client.query(`UPDATE players SET red_cards = COALESCE(red_cards, 0) + 1 WHERE id = $1`, [card.player_id]);
                }
            }
        });

        return res.status(200).json({ message: '🏆 Feuille de match enregistrée et statistiques mises à jour !' });

    } catch (error) {
        console.error('Erreur mise à jour score :', error);
        return res.status(error.statusCode || 500).json({
            message: error.message || 'Erreur lors de la mise à jour de la feuille de match.'
        });
    }
};
// =========================================================================
// 3. PLANIFIER UN MATCH MANUELLEMENT
// =========================================================================
exports.createMatch = async (req, res) => {
    try {
        const { homeTeamId, awayTeamId, matchDate, stadium } = req.body;

        if (!homeTeamId || !awayTeamId || Number(homeTeamId) === Number(awayTeamId)) {
            return res.status(400).json({ message: 'Sélectionnez deux équipes différentes.' });
        }

        const teamsResult = await pool.query('SELECT id FROM teams WHERE id IN (\$1, \$2)', [homeTeamId, awayTeamId]);
        if (teamsResult.rows.length !== 2) {
            return res.status(400).json({ message: "L'une des deux équipes n'existe pas." });
        }

        const result = await pool.query(`
            INSERT INTO matches (home_team_id, away_team_id, match_date, stadium, status)
            VALUES ($1, $2, $3, $4, 'scheduled') RETURNING *
        `, [homeTeamId, awayTeamId, matchDate || null, stadium || null]);

        return res.status(201).json({ message: 'Match planifié avec succès !', match: result.rows[0] });

    } catch (error) {
        console.error('Erreur création match :', error);
        return res.status(500).json({ message: 'Erreur serveur lors de la planification.' });
    }
};

// =========================================================================
// 4. RÉCUPÉRER TOUS LES MATCHS (POUR LE DASHBOARD ET LE SÉLECTEUR)
// =========================================================================
exports.getAllMatches = async (req, res) => {
    try {
        const query = `
          SELECT m.id, m.round_number, m.home_score, m.away_score, m.status, m.home_team_id, m.away_team_id,
            COALESCE(t1.name, 'Équipe Inconnue') AS home_team_name, COALESCE(t2.name, 'Équipe Inconnue') AS away_team_name
          FROM matches m LEFT JOIN teams t1 ON m.home_team_id = t1.id LEFT JOIN teams t2 ON m.away_team_id = t2.id
          ORDER BY m.round_number ASC, m.id ASC;
        `;
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Erreur récupération matchs :", error.message);
        res.status(500).json({ message: "Erreur serveur lors de la récupération des matchs." });
    }
};

// =========================================================================
// 5. RÉCUPÉRER LES ÉVÉNEMENTS D'UN MATCH EXÉCUTÉ
// =========================================================================
exports.getMatchEvents = async (req, res) => {
    const matchId = Number(req.params.id);
    if (!Number.isInteger(matchId) || matchId <= 0) {
        return res.status(400).json({ message: 'ID du match invalide.' });
    }
    try {
        const result = await pool.query(`
            SELECT g.id, g.match_id, g.minute, g.scorer_id, g.assister_id, p1.name AS scorer_name, p2.name AS assister_name
            FROM match_goals g LEFT JOIN players p1 ON p1.id = g.scorer_id LEFT JOIN players p2 ON p2.id = g.assister_id
            WHERE g.match_id = $1 ORDER BY g.minute ASC, g.id ASC
        `, [matchId]);
        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erreur événements match :', error.message);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des événements.' });
    }
};

// =========================================================================
// 6. AJOUTER UN ÉVÉNEMENT (BUT) À UN MATCH INDIVIDUELLEMENT
// =========================================================================
exports.addMatchEvent = async (req, res) => {
    const matchId = Number(req.params.id);
    const { scorer_id, assister_id, minute } = req.body;

    if (!Number.isInteger(matchId) || matchId <= 0) {
        return res.status(400).json({ message: 'ID du match invalide.' });
    }
    if (!Number.isInteger(Number(scorer_id)) || Number(scorer_id) <= 0 || !Number.isInteger(Number(minute)) || Number(minute) < 0) {
        return res.status(400).json({ message: 'Le buteur et une minute valide sont obligatoires.' });
    }
    try {
        const match = await pool.query('SELECT id FROM matches WHERE id = \$1', [matchId]);
        if (match.rows.length === 0) return res.status(404).json({ message: 'Match non trouvé.' });

        const scorer = await pool.query('SELECT id FROM players WHERE id = \$1', [Number(scorer_id)]);
        if (scorer.rows.length === 0) return res.status(400).json({ message: 'Le joueur buteur est introuvable.' });

        if (assister_id) {
            const assister = await pool.query('SELECT id FROM players WHERE id = \$1', [Number(assister_id)]);
            if (assister.rows.length === 0) return res.status(400).json({ message: 'Le joueur passeur est introuvable.' });
        }

        const result = await pool.query(`
            INSERT INTO match_goals (match_id, scorer_id, assister_id, minute) VALUES ($1, $2, $3, $4) RETURNING *
        `, [matchId, Number(scorer_id), assister_id ? Number(assister_id) : null, Number(minute)]);

        return res.status(201).json({ message: 'Événement ajouté avec succès.', event: result.rows[0] });
    } catch (error) {
        console.error('Erreur ajout événement :', error);
        return res.status(500).json({ message: "Erreur lors de l'ajout de l'événement." });
    }
};
