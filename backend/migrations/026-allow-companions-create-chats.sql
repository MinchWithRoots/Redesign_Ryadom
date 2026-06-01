-- Allow companions to create chats when approving chat requests
-- This enables the approveChatRequest function to insert chats where the companion is the approver

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- Add policy: Companions can create chats when approving requests
CREATE POLICY "Companions can create chats"
ON public.chats
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.companions
    WHERE id = companion_id
    AND user_id = auth.uid()
  )
);
