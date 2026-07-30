-- Cooperative heists replace the legacy shared-coin wager without deleting
-- historical public.heists rows.

CREATE TABLE public.heist_progression (
  group_id uuid PRIMARY KEY REFERENCES public.groups(id) ON DELETE CASCADE,
  level integer NOT NULL DEFAULT 1 CHECK (level >= 1),
  total_xp integer NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
  wins integer NOT NULL DEFAULT 0 CHECK (wins >= 0),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  streak integer NOT NULL DEFAULT 0 CHECK (streak >= 0),
  best_streak integer NOT NULL DEFAULT 0 CHECK (best_streak >= 0),
  cooldown_until timestamptz,
  last_played_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.heist_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  starter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'starter_turn' CHECK (
    status IN ('starter_turn', 'partner_waiting', 'partner_turn', 'completed', 'expired', 'cancelled')
  ),
  level integer NOT NULL CHECK (level >= 1),
  starter_interaction text NOT NULL CHECK (starter_interaction IN ('tap', 'swipe', 'hold')),
  partner_interaction text NOT NULL CHECK (partner_interaction IN ('tap', 'swipe', 'hold')),
  starter_goal integer NOT NULL CHECK (starter_goal > 0),
  partner_goal integer NOT NULL CHECK (partner_goal > 0),
  starter_progress integer NOT NULL DEFAULT 0 CHECK (starter_progress >= 0),
  partner_progress integer NOT NULL DEFAULT 0 CHECK (partner_progress >= 0),
  reward_coins integer NOT NULL CHECK (reward_coins >= 0),
  reward_xp integer NOT NULL CHECK (reward_xp >= 0),
  partner_joined_at timestamptz,
  expires_at timestamptz NOT NULL,
  completed_at timestamptz,
  settled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (starter_id <> partner_id),
  CHECK (starter_progress <= starter_goal),
  CHECK (partner_progress <= partner_goal)
);

CREATE INDEX heist_sessions_group_created_idx
  ON public.heist_sessions (group_id, created_at DESC);

CREATE INDEX heist_sessions_partner_status_idx
  ON public.heist_sessions (partner_id, status);

CREATE UNIQUE INDEX heist_sessions_one_active_group_idx
  ON public.heist_sessions (group_id)
  WHERE status IN ('starter_turn', 'partner_waiting', 'partner_turn');

ALTER TABLE public.heist_progression ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heist_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY heist_progression_group_read
  ON public.heist_progression FOR SELECT TO authenticated
  USING (public.is_group_member(group_id));

CREATE POLICY heist_sessions_group_read
  ON public.heist_sessions FOR SELECT TO authenticated
  USING (public.is_group_member(group_id));

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.heist_progression, public.heist_sessions TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.heist_progression, public.heist_sessions FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.heist_level_for_xp(p_total_xp integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $function$
  SELECT greatest(1, floor(greatest(p_total_xp, 0) / 100.0)::integer + 1)
$function$;

CREATE OR REPLACE FUNCTION public.heist_interaction_for(p_level integer, p_slot integer)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $function$
  SELECT (ARRAY['tap', 'swipe', 'hold'])[
    1 + mod(greatest(p_level, 1) - 1 + greatest(p_slot, 0), 3)
  ]
$function$;

CREATE OR REPLACE FUNCTION public.heist_goal_for(p_interaction text, p_level integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $function$
  SELECT CASE p_interaction
    WHEN 'tap' THEN least(40, 12 + greatest(p_level, 1) * 2)
    WHEN 'swipe' THEN least(12, 4 + greatest(p_level, 1) / 2)
    WHEN 'hold' THEN least(3000, 1200 + greatest(p_level, 1) * 100)
    ELSE 1
  END
$function$;

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
    VALUES (v_session.group_id, 1, now() + interval '30 seconds', now())
    ON CONFLICT (group_id) DO UPDATE
    SET attempts = public.heist_progression.attempts + 1,
        streak = 0,
        cooldown_until = now() + interval '30 seconds',
        last_played_at = now(),
        updated_at = now();
  END IF;

  RETURN NEXT v_session;
END
$function$;

CREATE OR REPLACE FUNCTION public.start_coop_heist(p_group_id uuid)
RETURNS SETOF public.heist_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_partner_id uuid;
  v_progress public.heist_progression%ROWTYPE;
  v_active_id uuid;
  v_starter_kind text;
  v_partner_kind text;
  v_session public.heist_sessions%ROWTYPE;
BEGIN
  IF v_user_id IS NULL OR NOT public.is_group_member(p_group_id) THEN
    RAISE EXCEPTION 'heist_forbidden';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_group_id::text, 0));

  SELECT user_id INTO v_partner_id
  FROM public.group_members
  WHERE group_id = p_group_id AND user_id <> v_user_id
  ORDER BY joined_at
  LIMIT 1;

  IF v_partner_id IS NULL THEN
    RAISE EXCEPTION 'heist_partner_required';
  END IF;

  SELECT id INTO v_active_id
  FROM public.heist_sessions
  WHERE group_id = p_group_id
    AND status IN ('starter_turn', 'partner_waiting', 'partner_turn')
  LIMIT 1;

  IF v_active_id IS NOT NULL THEN
    PERFORM public.expire_coop_heist(v_active_id);
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.heist_sessions
    WHERE group_id = p_group_id
      AND status IN ('starter_turn', 'partner_waiting', 'partner_turn')
  ) THEN
    RAISE EXCEPTION 'heist_in_progress';
  END IF;

  INSERT INTO public.heist_progression (group_id)
  VALUES (p_group_id)
  ON CONFLICT (group_id) DO NOTHING;

  SELECT * INTO v_progress
  FROM public.heist_progression
  WHERE group_id = p_group_id
  FOR UPDATE;

  IF v_progress.cooldown_until IS NOT NULL AND v_progress.cooldown_until > now() THEN
    RAISE EXCEPTION 'heist_cooldown';
  END IF;

  v_starter_kind := public.heist_interaction_for(v_progress.level, 0);
  v_partner_kind := public.heist_interaction_for(v_progress.level, 1);

  INSERT INTO public.heist_sessions (
    group_id,
    starter_id,
    partner_id,
    level,
    starter_interaction,
    partner_interaction,
    starter_goal,
    partner_goal,
    reward_coins,
    reward_xp,
    expires_at
  ) VALUES (
    p_group_id,
    v_user_id,
    v_partner_id,
    v_progress.level,
    v_starter_kind,
    v_partner_kind,
    public.heist_goal_for(v_starter_kind, v_progress.level),
    public.heist_goal_for(v_partner_kind, v_progress.level),
    least(50, 10 + (v_progress.level - 1) * 2),
    least(50, 25 + (v_progress.level - 1) * 5),
    now() + interval '60 seconds'
  )
  RETURNING * INTO v_session;

  RETURN NEXT v_session;
END
$function$;

CREATE OR REPLACE FUNCTION public.join_coop_heist(p_session_id uuid)
RETURNS SETOF public.heist_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_session public.heist_sessions%ROWTYPE;
BEGIN
  SELECT * INTO v_session
  FROM public.heist_sessions
  WHERE id = p_session_id
  FOR UPDATE;

  IF NOT FOUND OR v_session.partner_id <> v_user_id THEN
    RAISE EXCEPTION 'heist_not_partner';
  END IF;

  IF v_session.expires_at <= now() THEN
    RETURN QUERY SELECT * FROM public.expire_coop_heist(p_session_id);
    RETURN;
  END IF;

  IF v_session.status NOT IN ('starter_turn', 'partner_waiting', 'partner_turn') THEN
    RETURN NEXT v_session;
    RETURN;
  END IF;

  UPDATE public.heist_sessions
  SET partner_joined_at = coalesce(partner_joined_at, now()),
      status = CASE WHEN status = 'partner_waiting' THEN 'partner_turn' ELSE status END,
      updated_at = now()
  WHERE id = p_session_id
  RETURNING * INTO v_session;

  RETURN NEXT v_session;
END
$function$;

CREATE OR REPLACE FUNCTION public.advance_coop_heist(p_session_id uuid, p_amount integer DEFAULT 1)
RETURNS SETOF public.heist_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_session public.heist_sessions%ROWTYPE;
  v_next integer;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'heist_invalid_progress';
  END IF;

  SELECT * INTO v_session
  FROM public.heist_sessions
  WHERE id = p_session_id
  FOR UPDATE;

  IF NOT FOUND OR v_user_id NOT IN (v_session.starter_id, v_session.partner_id) THEN
    RAISE EXCEPTION 'heist_not_found';
  END IF;

  IF v_session.expires_at <= now() THEN
    RETURN QUERY SELECT * FROM public.expire_coop_heist(p_session_id);
    RETURN;
  END IF;

  IF v_user_id = v_session.starter_id AND v_session.status = 'starter_turn' THEN
    v_next := least(v_session.starter_goal, v_session.starter_progress + p_amount);
    UPDATE public.heist_sessions
    SET starter_progress = v_next,
        status = CASE
          WHEN v_next >= starter_goal AND partner_joined_at IS NOT NULL THEN 'partner_turn'
          WHEN v_next >= starter_goal THEN 'partner_waiting'
          ELSE status
        END,
        updated_at = now()
    WHERE id = p_session_id
    RETURNING * INTO v_session;
  ELSIF v_user_id = v_session.partner_id
        AND v_session.status = 'partner_turn'
        AND v_session.partner_joined_at IS NOT NULL THEN
    v_next := least(v_session.partner_goal, v_session.partner_progress + p_amount);
    UPDATE public.heist_sessions
    SET partner_progress = v_next,
        status = CASE WHEN v_next >= partner_goal THEN 'completed' ELSE status END,
        settled = v_next >= partner_goal,
        completed_at = CASE WHEN v_next >= partner_goal THEN now() ELSE completed_at END,
        updated_at = now()
    WHERE id = p_session_id
    RETURNING * INTO v_session;

    IF v_session.status = 'completed' THEN
      INSERT INTO public.heist_progression (
        group_id, level, total_xp, wins, attempts, streak, best_streak,
        cooldown_until, last_played_at, updated_at
      ) VALUES (
        v_session.group_id,
        public.heist_level_for_xp(v_session.reward_xp),
        v_session.reward_xp,
        1,
        1,
        1,
        1,
        now() + interval '5 minutes',
        now(),
        now()
      )
      ON CONFLICT (group_id) DO UPDATE
      SET total_xp = public.heist_progression.total_xp + v_session.reward_xp,
          level = public.heist_level_for_xp(public.heist_progression.total_xp + v_session.reward_xp),
          wins = public.heist_progression.wins + 1,
          attempts = public.heist_progression.attempts + 1,
          streak = public.heist_progression.streak + 1,
          best_streak = greatest(public.heist_progression.best_streak, public.heist_progression.streak + 1),
          cooldown_until = now() + interval '5 minutes',
          last_played_at = now(),
          updated_at = now();

      INSERT INTO public.group_coins (group_id, amount, updated_at)
      VALUES (v_session.group_id, v_session.reward_coins, now())
      ON CONFLICT (group_id) DO UPDATE
      SET amount = public.group_coins.amount + EXCLUDED.amount,
          updated_at = now();
    END IF;
  ELSE
    RAISE EXCEPTION 'heist_wrong_turn';
  END IF;

  RETURN NEXT v_session;
END
$function$;

REVOKE ALL ON FUNCTION public.expire_coop_heist(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.start_coop_heist(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.join_coop_heist(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.advance_coop_heist(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_coop_heist(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_coop_heist(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_coop_heist(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.advance_coop_heist(uuid, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.notify_coop_heist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $function$
BEGIN
  PERFORM realtime.publish(
    'heists:' || NEW.group_id::text,
    'heist_change',
    row_to_json(NEW)::jsonb || jsonb_build_object('op', TG_OP)
  );
  RETURN NEW;
END
$function$;

CREATE TRIGGER heist_sessions_notify
  AFTER INSERT OR UPDATE ON public.heist_sessions
  FOR EACH ROW EXECUTE FUNCTION public.notify_coop_heist();

INSERT INTO realtime.channels (pattern, description, enabled)
VALUES ('heists:%', 'Private cooperative heist updates by group', true)
ON CONFLICT (pattern) DO UPDATE
SET description = EXCLUDED.description,
    enabled = EXCLUDED.enabled;

DROP POLICY IF EXISTS heist_group_subscribe ON realtime.channels;
CREATE POLICY heist_group_subscribe
  ON realtime.channels FOR SELECT TO authenticated
  USING (
    pattern = 'heists:%'
    AND public.is_group_member(NULLIF(split_part(realtime.channel_name(), ':', 2), '')::uuid)
  );
