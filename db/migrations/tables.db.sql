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
	role INTEGER NOT NULL DEFAULT 1 CHECK (role in (0, 1)),
	activation_link TEXT,
	reset_pass_link TEXT,
	is_verify BOOLEAN NOT NULL DEFAULT FALSE,
	enable_reset_pass BOOLEAN NOT NULL DEFAULT FALSE,
	enable_two_auth_code BOOLEAN NOT NULL DEFAULT FALSE,
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
	description VARCHAR(500) NOT NULL,
	status status_mood NOT NULL DEFAULT 'FREE',
	image_url TEXT,
	created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Occupied Rooms
CREATE TABLE IF NOT EXISTS public.occupied_rooms (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
	room_id UUID UNIQUE REFERENCES public.rooms(id) ON DELETE CASCADE,
	status status_mood NOT NULL DEFAULT 'BUYS',
	total_price NUMERIC(10, 2) NOT NULL,
	residence_time TIMESTAMP NOT NULL,
	created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
	room_id UUID UNIQUE REFERENCES public.rooms(id) ON DELETE CASCADE,
	review VARCHAR(350),
	created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
