-- Create chat_encryption_keys table
CREATE TABLE IF NOT EXISTS chat_encryption_keys (
  id BIGSERIAL PRIMARY KEY,
  chat_id BIGINT NOT NULL,
  user_id UUID NOT NULL,
  encrypted_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_chat_id FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT unique_chat_user UNIQUE (chat_id, user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_chat_encryption_keys_chat_user 
  ON chat_encryption_keys(chat_id, user_id);
