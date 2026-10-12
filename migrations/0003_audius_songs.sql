-- Audius song snapshots.
-- When a sender picks a song from the Audius catalog we freeze the facts
-- the letter shows (title, artist, artwork, length, canonical link) so the
-- card never depends on a live lookup to render. song_id keeps pointing at
-- the Audius track and /api/audius/stream/<song_id> resolves fresh audio
-- at play time.

ALTER TABLE cards ADD COLUMN song_title TEXT;
ALTER TABLE cards ADD COLUMN song_artist TEXT;
ALTER TABLE cards ADD COLUMN song_artwork TEXT;
ALTER TABLE cards ADD COLUMN song_duration INTEGER;
ALTER TABLE cards ADD COLUMN song_permalink TEXT;
