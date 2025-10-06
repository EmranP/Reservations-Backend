-- ========================
-- 3. TABLES
-- ========================

-- USERS
CREATE TABLE IF NOT EXISTS public.users (
	id SERIAL PRIMARY KEY,
	first_name VARCHAR(100) NOT NULL,
	last_name VARCHAR(100) NOT NULL,
	email VARCHAR(100) NOT NULL,
	phone VARCHAR(20) NOT NULL,
	password TEXT NOT NULL,
	avatar TEXT,
	role INTEGER NOT NULL DEFAULT 1 CHECK (role in (0, 1)),
	activation_link TEXT,
	is_verify BOOLEAN NOT NULL DEFAULT FALSE,
 	created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- TOKENS
CREATE TABLE IF NOT EXISTS public.tokens (
	id SERIAL PRIMARY KEY,
	user_id INTEGER UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
	refresh_token TEXT NOT NULL,
	created_at TIMESTAMP DEFAULT now()
);

-- Rooms
CREATE TABLE IF NOT EXISTS public.rooms (
	id SERIAL PRIMARY KEY,
	price NUMERIC(10,2) NOT NULL,
	quality VARCHAR(35) NOT NULL,
	description VARCHAR(500) NOT NULL,
	status status_mood NOT NULL  DEFAULT 'FREE',
	image_url TEXT,
	created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Occupied Rooms
CREATE TABLE IF NOT EXISTS public.occupied_rooms (
	id SERIAL PRIMARY KEY,
	user_id INTEGER UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
	room_id INTEGER UNIQUE REFERENCES public.rooms(id) ON DELETE CASCADE,
	status status_mood NOT NULL DEFAULT 'BUYS',
	total_price NUMERIC(10, 2) NOT NULL,
	residence_time TIMESTAMP NOT NULL,
	created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
	id SERIAL PRIMARY KEY,
	user_id INTEGER UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
	room_id INTEGER UNIQUE REFERENCES public.rooms(id) ON DELETE CASCADE,
	review VARCHAR(350),
	created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
