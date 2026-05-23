-- First, check if RLS is enabled on reviews table
-- If not, enable it
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can create their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can view published reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Companions can view reviews for their profile" ON public.reviews;

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

-- Policy: Companions can view unpublished reviews (if they exist)
CREATE POLICY "Companions can view reviews for their profile"
ON public.reviews
FOR SELECT USING (
  published = true OR auth.uid() IN (
    SELECT user_id FROM companions WHERE id = reviews.companion_id
  )
);
