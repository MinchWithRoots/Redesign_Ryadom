-- ============================================
-- Migration: Link user/companion images
-- ============================================
-- This script updates the image paths for companions and users
-- to use local image files from /images/users/ directory

-- Update companions with local image paths
-- ID 1: Мария К.
UPDATE public.companions
SET image = '/images/users/id1-image.jpg'
WHERE id = 1;

-- ID 2: Алексей М.
UPDATE public.companions
SET image = '/images/users/id2-image.jpg'
WHERE id = 2;

-- ID 3: Елена В.
UPDATE public.companions
SET image = '/images/users/id3-image.jpg'
WHERE id = 3;

-- Update any existing users with corresponding image paths
-- This assumes user IDs match up with the image IDs
UPDATE public.users
SET image = '/images/users/id1-image.jpg'
WHERE id = 1 AND image IS NULL;

UPDATE public.users
SET image = '/images/users/id2-image.jpg'
WHERE id = 2 AND image IS NULL;

UPDATE public.users
SET image = '/images/users/id3-image.jpg'
WHERE id = 3 AND image IS NULL;

-- Note: If you need to add more companions/users, follow this pattern:
-- UPDATE public.companions SET image = '/images/users/id{N}-image.jpg' WHERE id = {N};
-- UPDATE public.users SET image = '/images/users/id{N}-image.jpg' WHERE id = {N};
