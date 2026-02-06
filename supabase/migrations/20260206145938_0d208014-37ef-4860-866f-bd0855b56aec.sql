
-- Trigger: create notification for each user when a new channel message is posted
CREATE OR REPLACE FUNCTION public.notify_on_channel_message()
RETURNS TRIGGER AS $$
DECLARE
  _profile RECORD;
  _channel_name TEXT;
BEGIN
  -- Get channel name
  SELECT name INTO _channel_name FROM public.chat_channels WHERE id = NEW.channel_id;

  -- Notify all users except the sender
  FOR _profile IN SELECT id, email FROM public.profiles WHERE id != NEW.user_id
  LOOP
    INSERT INTO public.notifications (user_id, user_email, title, message, type, link)
    VALUES (
      _profile.id,
      _profile.email,
      'New message in #' || COALESCE(_channel_name, 'chat'),
      COALESCE(NEW.user_name, split_part(NEW.user_email, '@', 1)) || ': ' || LEFT(NEW.content, 100),
      'info',
      '/chat'
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_channel_message_notification
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_channel_message();

-- Trigger: create notification for receiver when a new DM is sent
CREATE OR REPLACE FUNCTION public.notify_on_direct_message()
RETURNS TRIGGER AS $$
DECLARE
  _sender_name TEXT;
  _receiver_email TEXT;
BEGIN
  -- Get sender name
  SELECT COALESCE(full_name, split_part(email, '@', 1)) INTO _sender_name
  FROM public.profiles WHERE id = NEW.sender_id;

  -- Get receiver email
  SELECT email INTO _receiver_email FROM public.profiles WHERE id = NEW.receiver_id;

  INSERT INTO public.notifications (user_id, user_email, title, message, type, link)
  VALUES (
    NEW.receiver_id,
    COALESCE(_receiver_email, ''),
    'Message from ' || COALESCE(_sender_name, 'Someone'),
    LEFT(NEW.content, 100),
    'info',
    '/chat'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_direct_message_notification
  AFTER INSERT ON public.direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_direct_message();
