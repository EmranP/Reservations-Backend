-- ========================
-- 2. FUNCTIONS
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
