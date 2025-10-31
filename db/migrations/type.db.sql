-- ========================
-- 3. TYPES
-- ========================

DROP TYPE IF EXISTS status_mood CASCADE;

CREATE TYPE status_mood AS ENUM ('FREE', 'BUYS');