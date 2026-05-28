-- Drop existing RLS policies on chat_encryption_keys
DROP POLICY IF EXISTS "Users can view their own chat encryption keys" ON public.chat_encryption_keys;
DROP POLICY IF EXISTS "Users can insert their own encryption keys" ON public.chat_encryption_keys;
DROP POLICY IF EXISTS "Users can update their own encryption keys" ON public.chat_encryption_keys;
DROP POLICY IF EXISTS "Users can delete their own encryption keys" ON public.chat_encryption_keys;

-- Policy: Users can view their own encryption keys
CREATE POLICY "Users can view their own chat encryption keys" ON public.chat_encryption_keys
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert encryption keys for themselves or for chats they're part of
-- This allows the approver to insert keys for both the companion and the requesting user
CREATE POLICY "Users can insert encryption keys for chat participants" ON public.chat_encryption_keys
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = chat_encryption_keys.chat_id
      AND (c.user_id = auth.uid() OR c.companion_id = (SELECT id FROM public.companions WHERE user_id = auth.uid()))
    )
  );

-- Policy: Users can update their own encryption keys
CREATE POLICY "Users can update their own encryption keys" ON public.chat_encryption_keys
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own encryption keys
CREATE POLICY "Users can delete their own encryption keys" ON public.chat_encryption_keys
  FOR DELETE
  USING (auth.uid() = user_id);
