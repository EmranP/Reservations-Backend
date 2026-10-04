-- ========================
-- 4. TABLES
-- ========================

-- USERS
CREATE TABLE IF NOT EXISTS public.users (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	first_name VARCHAR(100) NOT NULL,
	last_name VARCHAR(100),
	email VARCHAR(100) NOT NULL,
	phone VARCHAR(20) NOT NULL DEFAULT '+993',
	password TEXT NOT NULL,
	picture TEXT,
	expire_picture_url TIMESTAMP DEFAULT NULL,
	role INTEGER NOT NULL DEFAULT 1 CHECK (role in (0, 1)),
	activation_link TEXT,
	reset_pass_link TEXT,
	is_verify BOOLEAN NOT NULL DEFAULT FALSE,
	enable_reset_pass BOOLEAN NOT NULL DEFAULT FALSE,
	enable_two_factory_challenge BOOLEAN NOT NULL DEFAULT FALSE,
	method auth_method NOT NULL DEFAULT 'CREDENTIALS',
 	created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- ACCOUNTS
CREATE TABLE IF NOT EXISTS public.accounts (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
	provider TEXT,
	types TEXT,
	access_token TEXT,
	refresh_token TEXT,
	refresh_token_iv TEXT,
	refresh_token_tag TEXT,
	expires_in TIMESTAMP DEFAULT NULL,
	created_at TIMESTAMP DEFAULT now(),
	updated_at TIMESTAMP DEFAULT now()
);

-- TOKENS
CREATE TABLE IF NOT EXISTS public.tokens (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
	refresh_token TEXT NOT NULL,
	is_two_auth_code INTEGER DEFAULT NULL,
	expires_token_at TIMESTAMP DEFAULT NULL,
	expires_forget_pass TIMESTAMP DEFAULT NULL, 
	expires_two_auth_code TIMESTAMP DEFAULT NULL,
	state_auth TEXT,
	created_at TIMESTAMP DEFAULT now(),
	updated_at TIMESTAMP DEFAULT now()
);


-- Rooms
CREATE TABLE IF NOT EXISTS public.rooms (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	price NUMERIC(10,2) NOT NULL,
	quality VARCHAR(35) NOT NULL,
	description VARCHAR(500),
	status status_mood NOT NULL DEFAULT 'FREE',
	picture TEXT,
	expire_picture_url TIMESTAMP DEFAULT NULL,
	created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Orders
CREATE TABLE IF NOT EXISTS public.orders (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
	room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
	total_price NUMERIC(10, 2) NOT NULL,
	residence_time TIMESTAMP NOT NULL,
	status payment_status NOT NULL DEFAULT 'waiting_for_capture',
	created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Payment
CREATE TABLE IF NOT EXISTS public.payment (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
	user_id UUID REFERENCES public.users(id) ON DELETE CASCaDE,
	status payment_status NOT NULL DEFAULT 'waiting_for_capture',
	paid BOOLEAN NOT NULL DEFAULT TRUE,
	amount_value DECIMAL(10, 2),
	amount_currency TEXT,
	description TEXT,
	payment_method_type TEXT NOT NULL DEFAULT 'bank_card',
	payment_method_saved BOOLEAN NOT NULL DEFAULT FALSE,
	refundable BOOLEAN NOT NULL DEFAULT FALSE,
	test BOOLEAN NOT NULL DEFAULT FALSE,
	created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);


-- Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
	room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
	review VARCHAR(1000),
	rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
	created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

