-- Heist minigame table (partner coin-wager raid)
-- Applied to InsForge project qmf54uhk (JNAPP) via `npx @insforge/cli db query`.

CREATE TABLE IF NOT EXISTS public.heists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  attacker_id uuid NOT NULL,
  defender_id uuid NOT NULL,
  stake int NOT NULL CHECK (stake > 0),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'defending', 'stolen', 'defended', 'cancelled')),
  tap_goal int NOT NULL DEFAULT 40,
  tap_count int NOT NULL DEFAULT 0,
  started_at timestamptz,
  expires_at timestamptz,
  settled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS heists_group_status_idx ON public.heists (group_id, status);
CREATE INDEX IF NOT EXISTS heists_defender_status_idx ON public.heists (defender_id, status);

-- RLS: same style as group_coins — any member of the group can read/write
ALTER TABLE public.heists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS heists_member ON public.heists;
CREATE POLICY heists_member ON public.heists
  FOR ALL
  USING (
    group_id IN (
      SELECT group_members.group_id
      FROM public.group_members
      WHERE group_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    group_id IN (
      SELECT group_members.group_id
      FROM public.group_members
      WHERE group_members.user_id = auth.uid()
    )
  );

-- Realtime: mirror notify_group_coins() pattern (channel 'heists', event 'heist_change')
CREATE OR REPLACE FUNCTION public.notify_heists()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  PERFORM realtime.publish(
    'heists',
    'heist_change',
    row_to_json(NEW)::jsonb || jsonb_build_object('op', TG_OP)
  );
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS heists_notify ON public.heists;
CREATE TRIGGER heists_notify
  AFTER INSERT OR UPDATE ON public.heists
  FOR EACH ROW EXECUTE FUNCTION public.notify_heists();
