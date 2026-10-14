
-- 1. Table des Équipes
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    city VARCHAR(100) NOT NULL,
    founded_year INT,
    logo_url VARCHAR(255),
    points INT DEFAULT 0,
    played INT DEFAULT 0,
    won INT DEFAULT 0,
    drawn INT DEFAULT 0,
    lost INT DEFAULT 0,
    goals_for INT DEFAULT 0,
    goals_against INT DEFAULT 0
);

-- 2. Table des Joueurs
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    jersey_number INT NOT NULL,
    position VARCHAR(50) NOT NULL,
    team_id INT REFERENCES teams(id) ON DELETE CASCADE
);

-- 3. Table des Matchs
CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    home_team_id INT REFERENCES teams(id) ON DELETE CASCADE,
    away_team_id INT REFERENCES teams(id) ON DELETE CASCADE,
    match_date TIMESTAMP NOT NULL,
    stadium VARCHAR(150),
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'finished')),
    home_score INT DEFAULT 0,
    away_score INT DEFAULT 0
);
