-- Add missing foreign key constraints

-- 1. Add FK to companion_topics
ALTER TABLE public.companion_topics
ADD CONSTRAINT companion_topics_companion_id_fkey 
FOREIGN KEY (companion_id) REFERENCES public.companions(id) ON DELETE CASCADE;

-- 2. Add FK to favorites (companion_id)
ALTER TABLE public.favorites
ADD CONSTRAINT favorites_companion_id_fkey 
FOREIGN KEY (companion_id) REFERENCES public.companions(id) ON DELETE CASCADE;

-- 3. Add FK to chats (companion_id)
ALTER TABLE public.chats
ADD CONSTRAINT chats_companion_id_fkey 
FOREIGN KEY (companion_id) REFERENCES public.companions(id) ON DELETE CASCADE;

-- 4. Add FK to reviews (companion_id)
ALTER TABLE public.reviews
ADD CONSTRAINT reviews_companion_id_fkey 
FOREIGN KEY (companion_id) REFERENCES public.companions(id) ON DELETE CASCADE;

-- 5. Add FK to reports (companion_id)
ALTER TABLE public.reports
ADD CONSTRAINT reports_companion_id_fkey 
FOREIGN KEY (companion_id) REFERENCES public.companions(id) ON DELETE CASCADE;
