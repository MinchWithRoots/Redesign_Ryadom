-- Create a function that returns the actual session count for a companion
-- This function counts chats without RLS restrictions
CREATE OR REPLACE FUNCTION get_companion_session_count(companion_id INT)
RETURNS INT AS $$
DECLARE
  session_count INT;
BEGIN
  -- Count actual chats for this companion
  SELECT COUNT(*) INTO session_count
  FROM public.chats
  WHERE chats.companion_id = get_companion_session_count.companion_id;
  
  RETURN COALESCE(session_count, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execution to all users (including anon)
GRANT EXECUTE ON FUNCTION get_companion_session_count(INT) TO anon, authenticated;
