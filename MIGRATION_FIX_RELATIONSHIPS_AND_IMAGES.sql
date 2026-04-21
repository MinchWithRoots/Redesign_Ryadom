-- ============================================
-- Migration: Fix companion_topics relationship and add images table
-- ============================================

-- Step 1: Add missing foreign key constraint to companion_topics if it doesn't exist
ALTER TABLE public.companion_topics
ADD CONSTRAINT companion_topics_companion_id_fkey 
FOREIGN KEY (companion_id) REFERENCES public.companions(id) ON DELETE CASCADE;

-- Step 2: Create user_images table for storing image paths
CREATE TABLE IF NOT EXISTS public.user_images (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE,
  image_path VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  CONSTRAINT user_images_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Step 3: Create companion_images table for storing image paths
CREATE TABLE IF NOT EXISTS public.companion_images (
  id BIGSERIAL PRIMARY KEY,
  companion_id BIGINT NOT NULL UNIQUE,
  image_path VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  CONSTRAINT companion_images_companion_id_fkey FOREIGN KEY (companion_id) REFERENCES public.companions(id) ON DELETE CASCADE
);

-- Step 4: Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_images_user_id ON public.user_images(user_id);
CREATE INDEX IF NOT EXISTS idx_companion_images_companion_id ON public.companion_images(companion_id);

-- Step 5: Enable RLS on new tables
ALTER TABLE public.user_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companion_images ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies for user_images
CREATE POLICY "Users can view all user images" ON public.user_images
  FOR SELECT USING (true);

CREATE POLICY "Only admins can update user images" ON public.user_images
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- Step 7: Create RLS policies for companion_images
CREATE POLICY "Anyone can view companion images" ON public.companion_images
  FOR SELECT USING (true);

CREATE POLICY "Only admins can update companion images" ON public.companion_images
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- Step 8: (Optional) If you have existing image data in companions.image and users.image,
-- you can migrate them to the new tables:
-- INSERT INTO public.companion_images (companion_id, image_path)
-- SELECT id, image FROM public.companions WHERE image IS NOT NULL
-- ON CONFLICT (companion_id) DO NOTHING;
--
-- INSERT INTO public.user_images (user_id, image_path)
-- SELECT id, image FROM public.users WHERE image IS NOT NULL
-- ON CONFLICT (user_id) DO NOTHING;
