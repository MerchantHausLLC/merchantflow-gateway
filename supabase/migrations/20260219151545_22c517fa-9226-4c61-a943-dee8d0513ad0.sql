
CREATE OR REPLACE FUNCTION public.notify_action_item_assignment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _email text;
  _profile RECORD;
  _creator_name text;
BEGIN
  -- Get creator name
  SELECT COALESCE(full_name, email) INTO _creator_name
  FROM profiles WHERE id = NEW.created_by LIMIT 1;

  -- Loop through assigned emails
  FOREACH _email IN ARRAY NEW.assigned_to
  LOOP
    -- Skip if this email was already assigned (on UPDATE)
    IF TG_OP = 'UPDATE' AND _email = ANY(OLD.assigned_to) THEN
      CONTINUE;
    END IF;

    -- Find profile for this email
    SELECT id, email INTO _profile FROM profiles WHERE email = _email LIMIT 1;

    IF _profile.id IS NOT NULL THEN
      -- Create notification
      INSERT INTO notifications (user_id, user_email, title, message, type, link)
      VALUES (
        _profile.id,
        _profile.email,
        'Action Item Assigned',
        COALESCE(_creator_name, 'Someone') || ' tagged you: ' || LEFT(NEW.title, 100),
        'task',
        '/'
      );

      -- Send DM
      PERFORM send_system_dm(
        _email,
        '📌 **Action Item**: ' || COALESCE(_creator_name, 'Someone') || ' tagged you in "' || NEW.title || '"'
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER notify_action_item_tagged
  AFTER INSERT OR UPDATE OF assigned_to ON public.action_items
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_action_item_assignment();
