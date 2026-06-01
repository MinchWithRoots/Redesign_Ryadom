-- Add blocked_by field to chats table to track who blocked the chat
ALTER TABLE public.chats
ADD COLUMN blocked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update RLS policy to allow unblocking only by the person who blocked
DROP POLICY IF EXISTS "Users can update their chats" ON public.chats;

-- New policy: Allow updates by chat owner or companion
CREATE POLICY "Users can update their chats"
ON public.chats
FOR UPDATE
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.companions comp
    WHERE comp.id = chats.companion_id
    AND comp.user_id = auth.uid()
  )
)
WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.companions comp
    WHERE comp.id = chats.companion_id
    AND comp.user_id = auth.uid()
  )
);

-- Update trigger to set blocked_by when status changes to 'blocked'
DROP TRIGGER IF EXISTS set_blocked_by_on_status_change ON public.chats;
DROP FUNCTION IF EXISTS handle_chat_blocked();

CREATE OR REPLACE FUNCTION handle_chat_blocked()
RETURNS TRIGGER AS $$
BEGIN
  -- When status changes to 'blocked', set blocked_by to current user
  IF NEW.status = 'blocked' AND (OLD.status IS NULL OR OLD.status != 'blocked') THEN
    NEW.blocked_by = auth.uid();
  END IF;
  
  -- When status changes away from 'blocked', clear blocked_by
  IF NEW.status != 'blocked' AND OLD.status = 'blocked' THEN
    NEW.blocked_by = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_blocked_by_on_status_change
BEFORE UPDATE ON public.chats
FOR EACH ROW
EXECUTE FUNCTION handle_chat_blocked();
