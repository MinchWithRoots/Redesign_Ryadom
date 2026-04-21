-- ============================================
-- UPDATE COMPANIONS WITH IMAGES AND REVIEWS COUNT
-- ============================================

-- Update companions with new image paths and reviews_count
UPDATE public.companions 
SET 
  image = '/images/companion-1.jpg',
  reviews_count = 12
WHERE name = 'Мария К.';

UPDATE public.companions 
SET 
  image = '/images/companion-2.jpg',
  reviews_count = 9
WHERE name = 'Алексей М.';

UPDATE public.companions 
SET 
  image = '/images/companion-3.jpg',
  reviews_count = 15
WHERE name = 'Елена В.';

-- If you have more companions, add more UPDATE statements
-- UPDATE public.companions 
-- SET 
--   image = '/images/companion-4.jpg',
--   reviews_count = 8
-- WHERE name = 'Name Here';

-- UPDATE public.companions 
-- SET 
--   image = '/images/companion-5.jpg',
--   reviews_count = 11
-- WHERE name = 'Name Here';

-- Verify the updates
SELECT id, name, image, reviews_count FROM public.companions ORDER BY created_at DESC;
