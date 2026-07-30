ALTER TABLE public.heist_sessions
  ADD COLUMN revision bigint NOT NULL DEFAULT 0 CHECK (revision >= 0);

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

  IF NEW.starter_progress IS DISTINCT FROM OLD.starter_progress THEN
    IF v_user_id IS DISTINCT FROM OLD.starter_id THEN
      RAISE EXCEPTION 'heist_wrong_player';
    END IF;
    v_delta := NEW.starter_progress - OLD.starter_progress;
    IF v_delta <= 0
       OR (OLD.starter_interaction IN ('tap', 'swipe') AND v_delta <> 1)
       OR (OLD.starter_interaction = 'hold' AND NEW.starter_progress <> OLD.starter_goal) THEN
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
       OR (OLD.partner_interaction = 'hold' AND NEW.partner_progress <> OLD.partner_goal) THEN
      RAISE EXCEPTION 'heist_invalid_progress';
    END IF;
  END IF;

  NEW.revision := OLD.revision + 1;
  NEW.updated_at := clock_timestamp();
  RETURN NEW;
END
$function$;

CREATE TRIGGER heist_sessions_guard_update
  BEFORE UPDATE ON public.heist_sessions
  FOR EACH ROW EXECUTE FUNCTION public.guard_coop_heist_update();

-- Group creation/join/leave already use SECURITY DEFINER RPCs. Remove the direct
-- self-enrollment surface so a known group UUID cannot be used as an invite.
REVOKE INSERT, UPDATE, DELETE ON public.group_members FROM anon, authenticated;
GRANT SELECT ON public.group_members TO authenticated;

ALTER FUNCTION public.create_group()
  SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.join_group(text)
  SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.leave_group()
  SET search_path = pg_catalog, public, pg_temp;
