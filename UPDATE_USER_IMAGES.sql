-- ============================================
-- UPDATE USER IMAGES WITH CDN URLS
-- ============================================

-- These images are stored on builder.io CDN
-- You can use these direct URLs in the database

-- Map of IDs to images:
-- id1-image.jpg: https://cdn.builder.io/api/v1/image/assets%2Fd0abb59129504318acf9db5a052c2c79%2Fc04301fd62ef4542bf714f777fb242d9?format=webp&width=800&height=1200
-- id2-image.jpg: https://cdn.builder.io/api/v1/image/assets%2Fd0abb59129504318acf9db5a052c2c79%2F63450c5f4e124308b41df9de6df68202?format=webp&width=800&height=1200
-- id3-image.jpg: https://cdn.builder.io/api/v1/image/assets%2Fd0abb59129504318acf9db5a052c2c79%2F4df29f81f37f4afd9aa19a22394f324e?format=webp&width=800&height=1200
-- id4-image.jpg: https://cdn.builder.io/api/v1/image/assets%2Fd0abb59129504318acf9db5a052c2c79%2F0fe71f2a853446a9a2af63d93ead43fc?format=webp&width=800&height=1200
-- id5-image.jpg: https://cdn.builder.io/api/v1/image/assets%2Fd0abb59129504318acf9db5a052c2c79%2F0a8ae62fa0db42be8638a57d8d4642ed?format=webp&width=800&height=1200

-- Option 1: Use local paths (if you upload files to public/images/users/)
-- UPDATE public.users SET image = '/images/users/id1-image.jpg' WHERE id = 1;
-- UPDATE public.users SET image = '/images/users/id2-image.jpg' WHERE id = 2;
-- UPDATE public.users SET image = '/images/users/id3-image.jpg' WHERE id = 3;
-- UPDATE public.users SET image = '/images/users/id4-image.jpg' WHERE id = 4;
-- UPDATE public.users SET image = '/images/users/id5-image.jpg' WHERE id = 5;

-- Option 2: Use CDN URLs (recommended - no need to upload files)
UPDATE public.users SET image = 'https://cdn.builder.io/api/v1/image/assets%2Fd0abb59129504318acf9db5a052c2c79%2Fc04301fd62ef4542bf714f777fb242d9?format=webp&width=800&height=1200' WHERE id = 1;
UPDATE public.users SET image = 'https://cdn.builder.io/api/v1/image/assets%2Fd0abb59129504318acf9db5a052c2c79%2F63450c5f4e124308b41df9de6df68202?format=webp&width=800&height=1200' WHERE id = 2;
UPDATE public.users SET image = 'https://cdn.builder.io/api/v1/image/assets%2Fd0abb59129504318acf9db5a052c2c79%2F4df29f81f37f4afd9aa19a22394f324e?format=webp&width=800&height=1200' WHERE id = 3;
UPDATE public.users SET image = 'https://cdn.builder.io/api/v1/image/assets%2Fd0abb59129504318acf9db5a052c2c79%2F0fe71f2a853446a9a2af63d93ead43fc?format=webp&width=800&height=1200' WHERE id = 4;
UPDATE public.users SET image = 'https://cdn.builder.io/api/v1/image/assets%2Fd0abb59129504318acf9db5a052c2c79%2F0a8ae62fa0db42be8638a57d8d4642ed?format=webp&width=800&height=1200' WHERE id = 5;

-- Verify the updates
SELECT id, name, image FROM public.users WHERE id IN (1, 2, 3, 4, 5) ORDER BY id;
