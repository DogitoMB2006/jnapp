-- is_group_member is called from RLS and SECURITY DEFINER heist RPCs. Pin name
-- resolution so callers cannot influence objects resolved by its existing body.
ALTER FUNCTION public.is_group_member(uuid)
  SET search_path = pg_catalog, public, pg_temp;
