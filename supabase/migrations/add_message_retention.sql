-- Add retention period to chats table (using hours instead of days)
ALTER TABLE chats
ADD COLUMN IF NOT EXISTS message_retention_hours integer DEFAULT 720;

-- Keep old column for backward compatibility (can be removed later)
ALTER TABLE chats
ADD COLUMN IF NOT EXISTS message_retention_days integer;

-- Add created_at index for efficient deletion queries
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Create function to auto-delete expired messages
CREATE OR REPLACE FUNCTION delete_expired_messages()
RETURNS void AS $$
BEGIN
  DELETE FROM messages
  WHERE chat_id IN (
    SELECT id FROM chats
    WHERE message_retention_hours IS NOT NULL
    AND message_retention_hours > 0
  )
  AND created_at < NOW() - (
    SELECT INTERVAL '1 hour' * message_retention_hours
    FROM chats
    WHERE chats.id = messages.chat_id
  );
END;
$$ LANGUAGE plpgsql;

-- Create a job to run deletion every hour
-- Note: This requires pg_cron extension enabled in Supabase
-- Run this manually via SQL editor or set up a scheduled function call
-- SELECT cron.schedule('delete-expired-messages', '0 * * * *', 'SELECT delete_expired_messages()');
