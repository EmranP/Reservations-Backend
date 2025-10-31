-- ========================
-- 5. TRIGGERS
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
