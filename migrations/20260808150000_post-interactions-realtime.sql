-- Realtime for post comments & reactions (partner sees updates without full-app refresh)

CREATE OR REPLACE FUNCTION public.notify_post_comments()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM realtime.publish(
      'post_comments',
      'DELETE',
      jsonb_build_object(
        'id', OLD.id,
        'op', TG_OP,
        'group_id', OLD.group_id,
        'target_type', OLD.target_type,
        'target_id', OLD.target_id
      )
    );
    RETURN OLD;
  END IF;
  PERFORM realtime.publish(
    'post_comments',
    TG_OP,
    row_to_json(NEW)::jsonb || jsonb_build_object('op', TG_OP)
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_post_reactions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM realtime.publish(
      'post_reactions',
      'DELETE',
      jsonb_build_object(
        'id', OLD.id,
        'op', TG_OP,
        'group_id', OLD.group_id,
        'target_type', OLD.target_type,
        'target_id', OLD.target_id,
        'user_id', OLD.user_id,
        'emoji', OLD.emoji
      )
    );
    RETURN OLD;
  END IF;
  PERFORM realtime.publish(
    'post_reactions',
    TG_OP,
    row_to_json(NEW)::jsonb || jsonb_build_object('op', TG_OP)
  );
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS post_comments_realtime ON public.post_comments;
CREATE TRIGGER post_comments_realtime
  AFTER INSERT OR UPDATE OR DELETE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_post_comments();

DROP TRIGGER IF EXISTS post_reactions_realtime ON public.post_reactions;
CREATE TRIGGER post_reactions_realtime
  AFTER INSERT OR UPDATE OR DELETE ON public.post_reactions
  FOR EACH ROW EXECUTE FUNCTION public.notify_post_reactions();
