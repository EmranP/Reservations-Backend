-- ========================
-- 6. Migration edit
-- ========================

-- ALTER TABLE rooms DROP COLUMN status CASCADE;
-- ALTER TABLE occupied_rooms DROP COLUMN status CASCADE;

-- ALTER TABLE rooms ADD COLUMN status status_mood NOT NULL DEFAULT 'FREE';
-- ALTER TABLE occupied_rooms ADD COLUMN status status_mood NOT NULL DEFAULT 'BUYS';