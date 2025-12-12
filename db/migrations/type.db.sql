-- ========================
-- 3. TYPES
-- ========================

DROP TYPE IF EXISTS status_mood CASCADE;
DROP TYPE IF EXISTS auth_method CASCADE;

CREATE TYPE status_mood AS ENUM ('FREE', 'BUYS');

CREATE TYPE auth_method AS ENUM ('CREDENTIALS', 'GOOGLE', 'GITHUB', 'TELEGRAM');