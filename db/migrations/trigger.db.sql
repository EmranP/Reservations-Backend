-- ========================
-- 5. TRIGGERS
-- ========================

-- Обновление updated_at на изменение в каждой таблице
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'users', 'rooms', 'occupied_rooms', 'reviews', 'tokens', 'accounts'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_timestamp_%1$I ON %1$I; 
      CREATE TRIGGER set_timestamp_%1$I
        BEFORE UPDATE ON public.%1$I
        FOR EACH ROW
        EXECUTE FUNCTION public.update_timestamp();',
      tbl
    );
  END LOOP;
END;
$$;
