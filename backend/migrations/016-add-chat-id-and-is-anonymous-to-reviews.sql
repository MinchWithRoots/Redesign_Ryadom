-- Add chat_id field to link review to specific chat session
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS chat_id UUID REFERENCES public.chats(id) ON DELETE SET NULL;

-- Add is_anonymous field to allow anonymous reviews
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;

-- Create index on chat_id for faster queries
CREATE INDEX IF NOT EXISTS idx_reviews_chat_id ON public.reviews(chat_id);

-- Create index on user_id and companion_id for fetching user's reviews
CREATE INDEX IF NOT EXISTS idx_reviews_user_companion ON public.reviews(user_id, companion_id);
