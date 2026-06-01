-- Add blocked_by field to chats table to track who blocked the chat
ALTER TABLE public.chats
ADD COLUMN blocked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update RLS policy to allow unblocking only by the person who blocked
DROP POLICY IF EXISTS "Users can update their chats" ON public.chats;

-- New policy: More granular update permissions
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
  -- Allow update if:
  -- 1. User is the chat owner
  -- 2. User is the companion of this chat
  -- 3. BUT if changing status to 'active' (unblocking), only the person who blocked can do it
  (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.companions comp
      WHERE comp.id = chats.companion_id
      AND comp.user_id = auth.uid()
    )
  )
  AND (
    -- Allow all updates by default
    (NEW.status = chats.status OR NEW.status IS NULL)
    -- But if status changes to 'active' from 'blocked', only blocker can do it
    OR (chats.status = 'blocked' AND NEW.status = 'active' AND chats.blocked_by = auth.uid())
    -- Blocking is always allowed by chat owner or companion
    OR (NEW.status = 'blocked')
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
