-- ============================================================
-- FIX REVIEWS TABLE: Add missing columns with correct types
-- ============================================================

-- Step 1: Add chat_id column with correct type (bigint, not UUID)
-- This must match the chats.id type which is bigint
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS chat_id bigint REFERENCES public.chats(id) ON DELETE SET NULL;

-- Step 2: Add is_anonymous column
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_chat_id ON public.reviews(chat_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_companion ON public.reviews(user_id, companion_id);

-- Step 4: Enable RLS on reviews table
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can create their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can view published reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;

-- Step 6: Create RLS policies

-- Policy: Authenticated users can create their own reviews
CREATE POLICY "Users can create their own reviews"
ON public.reviews
FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

-- Policy: Anyone can view published reviews
CREATE POLICY "Anyone can view published reviews"
ON public.reviews
FOR SELECT USING (
  published = true
);

-- Policy: Users can update their own reviews
CREATE POLICY "Users can update their own reviews"
ON public.reviews
FOR UPDATE USING (
  auth.uid() = user_id
);

-- Policy: Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews"
ON public.reviews
FOR DELETE USING (
  auth.uid() = user_id
);
