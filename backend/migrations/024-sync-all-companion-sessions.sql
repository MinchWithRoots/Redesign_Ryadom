-- Sync session counts for all companions based on actual chats
-- This updates the sessions column to reflect the actual number of chats
UPDATE public.companions
SET sessions = (
  SELECT COUNT(*) FROM public.chats 
  WHERE chats.companion_id = companions.id
);

-- Log completion
SELECT 'Companion sessions synchronized. Updated ' || 
  (SELECT COUNT(*) FROM public.companions WHERE sessions > 0) || 
  ' companions with session data.' AS result;
