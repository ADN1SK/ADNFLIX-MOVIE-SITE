-- Update movies table to support TMDB metadata caching
ALTER TABLE movies 
ADD COLUMN IF NOT EXISTS backdrop_path VARCHAR(255),
ADD COLUMN IF NOT EXISTS poster_path VARCHAR(255),
ADD COLUMN IF NOT EXISTS vote_average NUMERIC(3,1),
ADD COLUMN IF NOT EXISTS tagline TEXT,
ADD COLUMN IF NOT EXISTS runtime INTEGER,
ADD COLUMN IF NOT EXISTS last_cached TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Ensure the ID column is compatible with TMDB integer IDs
-- Note: If you have existing data with SERIAL, this remains compatible.