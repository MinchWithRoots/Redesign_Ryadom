-- Add retention period and encryption flag to chats table
ALTER TABLE chats 
ADD COLUMN IF NOT EXISTS message_retention_days integer DEFAULT 30;

-- Add created_at index for efficient deletion queries
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Create function to auto-delete expired messages
CREATE OR REPLACE FUNCTION delete_expired_messages()
RETURNS void AS $$
BEGIN
  DELETE FROM messages
  WHERE chat_id IN (
    SELECT id FROM chats 
    WHERE message_retention_days IS NOT NULL
    AND message_retention_days > 0
  )
  AND created_at < NOW() - (
    SELECT INTERVAL '1 day' * message_retention_days 
    FROM chats 
    WHERE chats.id = messages.chat_id
  );
END;
$$ LANGUAGE plpgsql;

-- Create a job to run deletion every day at 2 AM UTC
-- Note: This requires pg_cron extension enabled in Supabase
-- Run this manually via SQL editor or set up a scheduled function call
-- SELECT cron.schedule('delete-expired-messages', '0 2 * * *', 'SELECT delete_expired_messages()');
