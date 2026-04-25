-- Create companion_chat_requests table
-- This table stores requests from users who want to start a chat with a companion
-- The companion can then approve or reject the request

CREATE TABLE IF NOT EXISTS public.companion_chat_requests (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  companion_id BIGINT NOT NULL REFERENCES public.companions(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  rejection_reason TEXT,
  chat_id BIGINT REFERENCES public.chats(id) ON DELETE SET NULL, -- Set when approved
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE
);

-- Create unique constraint to prevent duplicate pending requests
CREATE UNIQUE INDEX idx_companion_chat_requests_unique_pending 
ON public.companion_chat_requests(user_id, companion_id) 
WHERE status = 'pending';

-- Create indexes for queries
CREATE INDEX idx_companion_chat_requests_companion_id ON public.companion_chat_requests(companion_id);
CREATE INDEX idx_companion_chat_requests_user_id ON public.companion_chat_requests(user_id);
CREATE INDEX idx_companion_chat_requests_status ON public.companion_chat_requests(status);
