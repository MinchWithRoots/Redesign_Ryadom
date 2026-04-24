-- Add missing companions that are referenced in companion_topics
INSERT INTO public.companions (id, name, age, gender, experience, bio, image, created_at, updated_at)
VALUES 
  (1, 'Анна', 32, 'female', 'experienced', 'Слушаю внимательно и поддерживаю в сложные моменты', 'https://via.placeholder.com/400x400?text=Anna', NOW(), NOW()),
  (2, 'Мария', 28, 'female', 'beginner', 'Готова помочь и разобраться вместе', 'https://via.placeholder.com/400x400?text=Maria', NOW(), NOW()),
  (3, 'Александр', 35, 'male', 'expert', 'Более 5 лет опыта в поддержке людей', 'https://via.placeholder.com/400x400?text=Alexander', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Now add the foreign key constraints
ALTER TABLE public.companion_topics
ADD CONSTRAINT companion_topics_companion_id_fkey 
FOREIGN KEY (companion_id) REFERENCES public.companions(id) ON DELETE CASCADE;

ALTER TABLE public.favorites
ADD CONSTRAINT favorites_companion_id_fkey 
FOREIGN KEY (companion_id) REFERENCES public.companions(id) ON DELETE CASCADE;

ALTER TABLE public.chats
ADD CONSTRAINT chats_companion_id_fkey 
FOREIGN KEY (companion_id) REFERENCES public.companions(id) ON DELETE CASCADE;

ALTER TABLE public.reviews
ADD CONSTRAINT reviews_companion_id_fkey 
FOREIGN KEY (companion_id) REFERENCES public.companions(id) ON DELETE CASCADE;

ALTER TABLE public.reports
ADD CONSTRAINT reports_companion_id_fkey 
FOREIGN KEY (companion_id) REFERENCES public.companions(id) ON DELETE CASCADE;
