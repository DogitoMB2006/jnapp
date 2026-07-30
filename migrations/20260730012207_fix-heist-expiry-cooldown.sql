CREATE OR REPLACE FUNCTION public.expire_coop_heist(p_session_id uuid)
RETURNS SETOF public.heist_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $function$
DECLARE
  v_session public.heist_sessions%ROWTYPE;
BEGIN
  SELECT * INTO v_session
  FROM public.heist_sessions
  WHERE id = p_session_id
  FOR UPDATE;

  IF NOT FOUND OR NOT public.is_group_member(v_session.group_id) THEN
    RAISE EXCEPTION 'heist_not_found';
  END IF;

  IF v_session.status IN ('starter_turn', 'partner_waiting', 'partner_turn')
     AND v_session.expires_at <= now() THEN
    UPDATE public.heist_sessions
    SET status = 'expired', settled = true, completed_at = now(), updated_at = now()
    WHERE id = p_session_id
    RETURNING * INTO v_session;

    INSERT INTO public.heist_progression (group_id, attempts, cooldown_until, last_played_at)
    VALUES (
      v_session.group_id,
      1,
      v_session.expires_at + interval '30 seconds',
      v_session.expires_at
    )
    ON CONFLICT (group_id) DO UPDATE
    SET attempts = public.heist_progression.attempts + 1,
        streak = 0,
        cooldown_until = v_session.expires_at + interval '30 seconds',
        last_played_at = v_session.expires_at,
        updated_at = now();
  END IF;

  RETURN NEXT v_session;
END
$function$;
