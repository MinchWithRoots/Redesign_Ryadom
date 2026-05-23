-- ============================================================
-- FIX REVIEWS TABLE: Add missing columns and enable RLS
-- ============================================================

-- Step 1: Add missing columns if they don't exist
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS chat_id UUID REFERENCES public.chats(id) ON DELETE SET NULL;

ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_chat_id ON public.reviews(chat_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_companion ON public.reviews(user_id, companion_id);

-- Step 3: Enable RLS on reviews table
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can create their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can view published reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Companions can view reviews for their profile" ON public.reviews;

-- Step 5: Create RLS policies

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
