CREATE OR REPLACE FUNCTION public.notify_coop_heist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $function$
DECLARE
  v_recipient uuid;
  v_type text;
  v_title text;
  v_message text;
BEGIN
  PERFORM realtime.publish(
    'heists:' || NEW.group_id::text,
    'heist_change',
    row_to_json(NEW)::jsonb || jsonb_build_object('op', TG_OP)
  );

  IF TG_OP = 'INSERT' THEN
    v_recipient := NEW.partner_id;
    v_type := 'heist_started';
    v_title := 'Atraco cooperativo';
    v_message := 'Tu pareja está abriendo una bóveda. Entra rápido para completar tu parte.';
  ELSIF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM NEW.status THEN
    v_recipient := NEW.starter_id;
    v_type := 'heist_completed';
    v_title := 'Bóveda abierta';
    v_message := 'Completaron el atraco juntos. Las monedas y el XP ya fueron añadidos.';
  ELSIF NEW.status = 'expired' AND OLD.status IS DISTINCT FROM NEW.status THEN
    v_recipient := CASE WHEN auth.uid() = NEW.starter_id THEN NEW.partner_id ELSE NEW.starter_id END;
    v_type := 'heist_expired';
    v_title := 'El atraco expiró';
    v_message := 'No lograron abrir la bóveda a tiempo. Podrán intentarlo de nuevo pronto.';
  END IF;

  IF v_recipient IS NOT NULL THEN
    INSERT INTO public.notifications (
      user_id, title, message, type, created_by, group_id, reference_id, reference_type
    ) VALUES (
      v_recipient, v_title, v_message, v_type, auth.uid(), NEW.group_id, NEW.id, 'juegos'
    );
  END IF;

  RETURN NEW;
END
$function$;
