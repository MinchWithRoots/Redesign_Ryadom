-- Create chat_encryption_keys table for E2E encryption
CREATE TABLE IF NOT EXISTS public.chat_encryption_keys (
  id bigserial NOT NULL,
  chat_id bigint NOT NULL,
  user_id uuid NOT NULL,
  encrypted_key text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  
  CONSTRAINT chat_encryption_keys_pkey PRIMARY KEY (id),
  CONSTRAINT chat_encryption_keys_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON DELETE CASCADE,
  CONSTRAINT chat_encryption_keys_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT chat_encryption_keys_unique UNIQUE (chat_id, user_id)
) TABLESPACE pg_default;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_encryption_keys_chat_id ON public.chat_encryption_keys USING btree (chat_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_chat_encryption_keys_user_id ON public.chat_encryption_keys USING btree (user_id) TABLESPACE pg_default;

-- Add encrypted_text column to messages table (keep text as fallback)
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS encrypted_text text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_encrypted boolean DEFAULT false;

-- Create index on is_encrypted for efficient querying
CREATE INDEX IF NOT EXISTS idx_messages_is_encrypted ON public.messages USING btree (is_encrypted) TABLESPACE pg_default;
