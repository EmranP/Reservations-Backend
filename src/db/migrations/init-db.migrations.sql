-- ========================
-- 1. FUNCTIONS
-- ========================

-- Удалим функции, если уже существуют
DROP FUNCTION IF EXISTS public.update_timestamp() CASCADE;

-- Функция для авто-обновления updated_at
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

-- ========================
-- 2. TABLES
-- ========================

-- USERS
CREATE TABLE IF NOT EXISTS public.users (
	id SERIAL PRIMARY KEY,
	first_name VARCHAR(100) NOT NULL,
	last_name VARCHAR(100) NOT NULL,
	phone VARCHAR(20) NOT NULL,
	role INTEGER NOT NULL DEFAULT 1 CHECK (role in (0, 1)),
	activation_link TEXT,
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
	status VARCHAR(50) NOT NULL,
	image_url TEXT,
	created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Occupied Rooms
CREATE TABLE IF NOT EXISTS public.occupied_rooms (
	id SERIAL PRIMARY KEY,
	user_id INTEGER UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
	room_id INTEGER UNIQUE REFERENCES public.rooms(id) ON DELETE CASCADE,
	status VARCHAR(50) NOT NULL,
	total_price NUMERIC(10, 2) NOT NULL,
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

-- ========================
-- 3. TRIGGERS
-- ========================

-- Обновление updated_at на изменение в каждой таблице
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'users', 'rooms', 'occupied_rooms', 'reviews'
  ] LOOP
    EXECUTE format(
      'CREATE OR REPLACE TRIGGER set_timestamp_%1$I
        BEFORE UPDATE ON public.%1$I
        FOR EACH ROW
        EXECUTE FUNCTION public.update_timestamp();',
      tbl
    );
  END LOOP;
END;
$$;
