-- Add user_id field to companions table to track which user created this companion profile
ALTER TABLE public.companions
ADD COLUMN user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE;

-- Create index for quick lookup
CREATE INDEX idx_companions_user_id ON public.companions(user_id);
