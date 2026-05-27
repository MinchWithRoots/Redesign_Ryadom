-- Enable RLS on chat_encryption_keys table
ALTER TABLE public.chat_encryption_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own encryption keys
CREATE POLICY "Users can view their own chat encryption keys" ON public.chat_encryption_keys
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own encryption keys
CREATE POLICY "Users can insert their own encryption keys" ON public.chat_encryption_keys
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own encryption keys
CREATE POLICY "Users can update their own encryption keys" ON public.chat_encryption_keys
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own encryption keys
CREATE POLICY "Users can delete their own encryption keys" ON public.chat_encryption_keys
  FOR DELETE
  USING (auth.uid() = user_id);
