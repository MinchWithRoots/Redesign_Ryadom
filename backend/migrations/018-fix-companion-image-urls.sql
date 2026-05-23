-- ============================================================
-- FIX COMPANION IMAGE URLS
-- Reset invalid image URLs that were created by initializeImages
-- ============================================================

-- View current state
-- SELECT id, name, image FROM companions WHERE is_available = true ORDER BY id;

-- Fix companions with invalid local paths
-- These are broken paths from the old initializeImages function
UPDATE companions
SET image = NULL
WHERE image IS NOT NULL 
  AND (
    image LIKE '/images/%'
    OR image LIKE '/src/%'
    OR image LIKE 'http://localhost%'
  );

-- Verify the fix
SELECT id, name, image FROM companions WHERE is_available = true ORDER BY id;
