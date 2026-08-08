-- Animated card border decorations cost 3 diamonds

CREATE OR REPLACE FUNCTION public.decoration_cost(p_item_id text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = pg_catalog, public, pg_temp
AS $function$
  SELECT CASE p_item_id
    WHEN 'bubble-spark' THEN 5
    WHEN 'bubble-rose' THEN 8
    WHEN 'bubble-midnight' THEN 12
    WHEN 'bubble-nebula' THEN 30
    WHEN 'card-aurora-circuit' THEN 3
    WHEN 'card-ember-crown' THEN 3
    WHEN 'card-celestial-bloom' THEN 3
    ELSE NULL
  END
$function$;
