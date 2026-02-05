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
		('CREDENTIALS', 'GOOGLE', 'GITHUB', 'YANDEX', 'TELEGRAM');
  END IF;

	IF NOT EXISTS (
		SELECT 1 FROM pg_type t
		JOIN pg_namespace n ON n.oid = t.typnamespace
		WHERE t.typname = 'payment_event'
		AND n.nspname = 'public' ) THEN
		CREATE TYPE public.payment_event AS ENUM (
			'payment.waiting_for_capture', 
			'payment.succeeded',
			'payment.canceled',
			'payment_method.active',
			'refund.succeeded',
			'payout.succeeded',
			'payout.canceled',
			'deal.closed'
		);
	END IF;

	IF NOT EXISTS (
		SELECT 1 FROM pg_type t
		JOIN pg_namespace n ON n.oid = t.typnamespace
		WHERE t.typname = 'payment_status'
		AND n.nspname = 'public' ) THEN
		CREATE TYPE public.payment_status AS ENUM (
			'pending', 
			'waiting_for_capture',
			'succeeded',
			'canceled'
		);
	END IF;
	
END
$$;

