-- Enable RLS on chat_read_status table
ALTER TABLE public.chat_read_status ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view read status for their chats
CREATE POLICY "Users can view read status for their chats"
ON public.chat_read_status
FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.chats c
    WHERE c.id = chat_read_status.chat_id
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

-- Policy: Users can insert/update their own read status
CREATE POLICY "Users can manage their read status"
ON public.chat_read_status
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their read status"
ON public.chat_read_status
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
