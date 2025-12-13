-- ========================
-- 3. TYPES
-- ========================


DO $$
BEGIN
  IF NOT EXISTS (
		SELECT 1 FROM pg_type t
		JOIN pg_namespace n ON n.oid = t.typnamespace 
		WHERE t.typname = 'status_mood'
    AND n.nspname = 'public') THEN
    CREATE TYPE public.status_mood AS ENUM ('FREE', 'BUYS');
  END IF;

  IF NOT EXISTS (
		SELECT 1 FROM pg_type t 
		JOIN pg_namespace n ON n.oid = t.typnamespace 
		WHERE t.typname = 'auth_method'
    AND n.nspname = 'public') 
		THEN
    CREATE TYPE public.auth_method AS ENUM 
		('CREDENTIALS', 'GOOGLE', 'GITHUB', 'TELEGRAM');
  END IF;
END
$$;

