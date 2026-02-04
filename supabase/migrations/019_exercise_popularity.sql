-- Add popularity column for search ranking tiebreaker.
-- Popular exercises (the ~200 most common) get a small boost when
-- search relevance scores are tied, so "Barbell Bench Press" ranks
-- above "Band Bench Press" when someone searches "bench press".
-- Values: 0 = default, 1-5 = popular (higher = more popular).

ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS popularity INTEGER DEFAULT 0;
