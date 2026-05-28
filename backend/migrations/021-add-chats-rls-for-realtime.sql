-- Enable RLS on chats table if not already enabled
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (safe cleanup)
DROP POLICY IF EXISTS "Users can view their chats" ON public.chats;
DROP POLICY IF EXISTS "Users can create chats" ON public.chats;
DROP POLICY IF EXISTS "Users can update their chats" ON public.chats;

-- Policy: Users can view chats they're part of
CREATE POLICY "Users can view their chats"
ON public.chats
FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.companions comp
    WHERE comp.id = chats.companion_id
    AND comp.user_id = auth.uid()
  )
);

-- Policy: Users can insert chats with themselves as the user
CREATE POLICY "Users can create chats"
ON public.chats
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Policy: Users can update chats they're part of
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
