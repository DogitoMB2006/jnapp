ALTER TABLE public.heist_sessions
  ADD COLUMN partner_stage_started_at timestamptz;

CREATE OR REPLACE FUNCTION public.guard_coop_heist_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_delta integer;
BEGIN
  IF v_user_id IS NOT NULL AND NOT public.is_group_member(OLD.group_id) THEN
    RAISE EXCEPTION 'heist_forbidden';
  END IF;

  IF NEW.group_id IS DISTINCT FROM OLD.group_id
     OR NEW.starter_id IS DISTINCT FROM OLD.starter_id
     OR NEW.partner_id IS DISTINCT FROM OLD.partner_id
     OR NEW.level IS DISTINCT FROM OLD.level
     OR NEW.starter_interaction IS DISTINCT FROM OLD.starter_interaction
     OR NEW.partner_interaction IS DISTINCT FROM OLD.partner_interaction
     OR NEW.starter_goal IS DISTINCT FROM OLD.starter_goal
     OR NEW.partner_goal IS DISTINCT FROM OLD.partner_goal
     OR NEW.reward_coins IS DISTINCT FROM OLD.reward_coins
     OR NEW.reward_xp IS DISTINCT FROM OLD.reward_xp
     OR NEW.expires_at IS DISTINCT FROM OLD.expires_at THEN
    RAISE EXCEPTION 'heist_immutable_fields';
  END IF;

  IF OLD.status IS DISTINCT FROM 'partner_turn' AND NEW.status = 'partner_turn' THEN
    NEW.partner_stage_started_at := clock_timestamp();
  ELSIF NEW.partner_stage_started_at IS DISTINCT FROM OLD.partner_stage_started_at THEN
    RAISE EXCEPTION 'heist_immutable_fields';
  END IF;

  IF NEW.starter_progress IS DISTINCT FROM OLD.starter_progress THEN
    IF v_user_id IS DISTINCT FROM OLD.starter_id THEN
      RAISE EXCEPTION 'heist_wrong_player';
    END IF;
    v_delta := NEW.starter_progress - OLD.starter_progress;
    IF v_delta <= 0
       OR (OLD.starter_interaction IN ('tap', 'swipe') AND v_delta <> 1)
       OR (OLD.starter_interaction = 'hold' AND NEW.starter_progress <> OLD.starter_goal)
       OR (OLD.starter_interaction = 'hold'
           AND clock_timestamp() < OLD.created_at + OLD.starter_goal * interval '1 millisecond') THEN
      RAISE EXCEPTION 'heist_invalid_progress';
    END IF;
  END IF;

  IF NEW.partner_progress IS DISTINCT FROM OLD.partner_progress THEN
    IF v_user_id IS DISTINCT FROM OLD.partner_id THEN
      RAISE EXCEPTION 'heist_wrong_player';
    END IF;
    v_delta := NEW.partner_progress - OLD.partner_progress;
    IF v_delta <= 0
       OR (OLD.partner_interaction IN ('tap', 'swipe') AND v_delta <> 1)
       OR (OLD.partner_interaction = 'hold' AND NEW.partner_progress <> OLD.partner_goal)
       OR (OLD.partner_interaction = 'hold'
           AND (OLD.partner_stage_started_at IS NULL
                OR clock_timestamp() < OLD.partner_stage_started_at + OLD.partner_goal * interval '1 millisecond')) THEN
      RAISE EXCEPTION 'heist_invalid_progress';
    END IF;
  END IF;

  NEW.revision := OLD.revision + 1;
  NEW.updated_at := clock_timestamp();
  RETURN NEW;
END
$function$;

CREATE OR REPLACE FUNCTION public.join_group(p_invite_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $function$
DECLARE
  v_group_id uuid;
  v_user_id uuid := auth.uid();
  v_member_count integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  -- Serialize all concurrent joins by user and then by target group.
  PERFORM pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));

  SELECT id INTO v_group_id
  FROM public.groups
  WHERE invite_code = upper(trim(p_invite_code));

  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'Código no encontrado';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_group_id::text, 1));

  SELECT count(*) INTO v_member_count
  FROM public.group_members
  WHERE group_id = v_group_id;

  IF v_member_count >= 2 THEN
    RAISE EXCEPTION 'El grupo ya está lleno';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = v_group_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Ya eres miembro de este grupo';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.group_members
    WHERE user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Ya perteneces a un grupo. Sal primero para unirte a otro';
  END IF;

  INSERT INTO public.group_members (group_id, user_id)
  VALUES (v_group_id, v_user_id);

  RETURN v_group_id;
END
$function$;
