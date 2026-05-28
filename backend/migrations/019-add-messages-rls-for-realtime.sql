-- Enable RLS on messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view messages from chats they're part of
-- A user is part of a chat if:
-- 1. They are the chat initiator (user_id in chats table)
-- 2. They are a companion in the chat (via companions table)
CREATE POLICY "Users can view their chat messages"
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chats c
    WHERE c.id = messages.chat_id
    AND (
      c.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.companions comp
        WHERE comp.id = c.companion_id
        AND comp.user_id = auth.uid()
      )
    )
  )
);

-- Policy: Users can insert messages into chats they're part of
CREATE POLICY "Users can insert messages in their chats"
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.chats c
    WHERE c.id = chat_id
    AND (
      c.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.companions comp
        WHERE comp.id = c.companion_id
        AND comp.user_id = auth.uid()
      )
    )
  )
);

-- Policy: Users can update messages they sent
CREATE POLICY "Users can update their own messages"
ON public.messages
FOR UPDATE
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);

-- Policy: Admins can view and delete messages for moderation
CREATE POLICY "Admins can view all messages"
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "Admins can delete messages"
ON public.messages
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);
