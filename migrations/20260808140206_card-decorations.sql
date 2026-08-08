ALTER TABLE public.user_diamonds
  ADD COLUMN equipped_card_decor text;

ALTER TABLE public.profiles
  ADD COLUMN equipped_card_decor text;

CREATE OR REPLACE FUNCTION public.decoration_target(p_item_id text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = pg_catalog, public, pg_temp
AS $function$
  SELECT CASE
    WHEN p_item_id IN ('bubble-spark', 'bubble-rose', 'bubble-midnight', 'bubble-nebula') THEN 'bubble'
    WHEN p_item_id IN ('card-aurora-circuit', 'card-ember-crown', 'card-celestial-bloom') THEN 'card'
    ELSE NULL
  END
$function$;

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

CREATE OR REPLACE FUNCTION public.purchase_decoration(p_item_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_cost integer := public.decoration_cost(p_item_id);
  v_amount integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;
  IF v_cost IS NULL THEN
    RAISE EXCEPTION 'invalid_decoration';
  END IF;

  INSERT INTO public.user_diamonds (user_id, amount)
  VALUES (v_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT amount INTO v_amount
  FROM public.user_diamonds
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF EXISTS (
    SELECT 1 FROM public.user_decoration_purchases
    WHERE user_id = v_user_id AND item_id = p_item_id
  ) THEN
    RAISE EXCEPTION 'already_owned';
  END IF;
  IF v_amount < v_cost THEN
    RAISE EXCEPTION 'not_enough_diamonds';
  END IF;

  UPDATE public.user_diamonds
  SET amount = amount - v_cost, updated_at = now()
  WHERE user_id = v_user_id
  RETURNING amount INTO v_amount;

  INSERT INTO public.user_decoration_purchases (user_id, item_id)
  VALUES (v_user_id, p_item_id);

  RETURN jsonb_build_object('amount', v_amount, 'item_id', p_item_id);
END
$function$;

CREATE OR REPLACE FUNCTION public.equip_decoration(p_item_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_target text := public.decoration_target(p_item_id);
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;
  IF v_target IS NULL THEN
    RAISE EXCEPTION 'invalid_decoration';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.user_decoration_purchases
    WHERE user_id = v_user_id AND item_id = p_item_id
  ) THEN
    RAISE EXCEPTION 'decoration_not_owned';
  END IF;

  IF v_target = 'bubble' THEN
    UPDATE public.user_diamonds
    SET equipped_decor = p_item_id, updated_at = now()
    WHERE user_id = v_user_id;

    UPDATE public.profiles
    SET equipped_decor = p_item_id, updated_at = now()
    WHERE user_id = v_user_id;
  ELSE
    UPDATE public.user_diamonds
    SET equipped_card_decor = p_item_id, updated_at = now()
    WHERE user_id = v_user_id;

    UPDATE public.profiles
    SET equipped_card_decor = p_item_id, updated_at = now()
    WHERE user_id = v_user_id;
  END IF;

  RETURN jsonb_build_object('item_id', p_item_id, 'target', v_target);
END
$function$;

CREATE OR REPLACE FUNCTION public.guard_profile_decorations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF NEW.equipped_decor IS DISTINCT FROM OLD.equipped_decor THEN
    IF v_user_id IS DISTINCT FROM NEW.user_id
       OR public.decoration_target(NEW.equipped_decor) IS DISTINCT FROM 'bubble'
       OR NOT EXISTS (
         SELECT 1 FROM public.user_decoration_purchases
         WHERE user_id = NEW.user_id AND item_id = NEW.equipped_decor
       ) THEN
      RAISE EXCEPTION 'invalid_bubble_decoration';
    END IF;
  END IF;

  IF NEW.equipped_card_decor IS DISTINCT FROM OLD.equipped_card_decor THEN
    IF v_user_id IS DISTINCT FROM NEW.user_id
       OR public.decoration_target(NEW.equipped_card_decor) IS DISTINCT FROM 'card'
       OR NOT EXISTS (
         SELECT 1 FROM public.user_decoration_purchases
         WHERE user_id = NEW.user_id AND item_id = NEW.equipped_card_decor
       ) THEN
      RAISE EXCEPTION 'invalid_card_decoration';
    END IF;
  END IF;

  RETURN NEW;
END
$function$;

CREATE TRIGGER profiles_guard_decorations
  BEFORE UPDATE OF equipped_decor, equipped_card_decor ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_decorations();

REVOKE INSERT, UPDATE, DELETE ON public.user_diamonds FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.user_decoration_purchases FROM anon, authenticated;
GRANT SELECT ON public.user_diamonds, public.user_decoration_purchases TO authenticated;

REVOKE ALL ON FUNCTION public.purchase_decoration(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.equip_decoration(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purchase_decoration(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.equip_decoration(text) TO authenticated;
