// Requête SQL avancée pour générer le classement en temps réel
const getLaLigaStanding = async () => {
    const query = `
        SELECT 
            t.id,
            t.name,
            t.short_name,
            t.logo_url,
            COUNT(m.id) FILTER (WHERE m.status = 'FINISHED') AS played,
            -- Calcul des Points
            SUM(
                CASE 
                    WHEN m.status != 'FINISHED' THEN 0
                    WHEN (m.home_team_id = t.id AND m.home_score > m.away_score) OR (m.away_team_id = t.id AND m.away_score > m.home_score) THEN 3
                    WHEN m.home_score = m.away_score THEN 1
                    ELSE 0
                END
            ) AS points,
            -- Victoires, Nuls, Défaites
            COUNT(m.id) FILTER (WHERE m.status = 'FINISHED' AND ((m.home_team_id = t.id AND m.home_score > m.away_score) OR (m.away_team_id = t.id AND m.away_score > m.home_score))) AS wins,
            COUNT(m.id) FILTER (WHERE m.status = 'FINISHED' AND m.home_score = m.away_score) AS draws,
            COUNT(m.id) FILTER (WHERE m.status = 'FINISHED' AND ((m.home_team_id = t.id AND m.home_score < m.away_score) OR (m.away_team_id = t.id AND m.away_score < m.home_score))) AS losses,
            -- Buts Pour, Contre et Différence
            COALESCE(SUM(CASE WHEN m.home_team_id = t.id THEN m.home_score WHEN m.away_team_id = t.id THEN m.away_score END), 0) AS goals_for,
            COALESCE(SUM(CASE WHEN m.home_team_id = t.id THEN m.away_score WHEN m.away_team_id = t.id THEN m.home_score END), 0) AS goals_against,
            (COALESCE(SUM(CASE WHEN m.home_team_id = t.id THEN m.home_score WHEN m.away_team_id = t.id THEN m.away_score END), 0) - 
             COALESCE(SUM(CASE WHEN m.home_team_id = t.id THEN m.away_score WHEN m.away_team_id = t.id THEN m.home_score END), 0)) AS goal_difference
        FROM teams t
        LEFT JOIN matches m ON (m.home_team_id = t.id OR m.away_team_id = t.id)
        GROUP BY t.id
        ORDER BY points DESC, goal_difference DESC, goals_for DESC;
    `;
    
    const res = await pool.query(query);
    return res.rows;
};
