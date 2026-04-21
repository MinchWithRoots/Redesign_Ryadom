-- Drop old table if exists
DROP TABLE IF EXISTS public.companions CASCADE;

-- Create new companions table
CREATE TABLE public.companions (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  age INTEGER NOT NULL,
  gender VARCHAR(50),
  experience VARCHAR(100),
  reviews_count INTEGER DEFAULT 0,
  image VARCHAR(500),
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert companion data
INSERT INTO public.companions 
(name, age, gender, experience, reviews_count, image, bio, created_at, updated_at)
VALUES
(
  'Мария К.',
  28,
  'female',
  'beginner',
  12,
  '/images/companion-1.jpg',
  'Специализируюсь на работе с молодежью и вопросами личных отношений. Проходу личную терапию.',
  NOW(),
  NOW()
),
(
  'Алексей М.',
  32,
  'male',
  'experienced',
  9,
  '/images/companion-2.jpg',
  'Помогу разобраться в карьерных целях и найти свой путь. На пути терапии уже 3 года.',
  NOW(),
  NOW()
),
(
  'Елена В.',
  35,
  'female',
  'experienced',
  15,
  '/images/companion-3.jpg',
  'Специалист по работе с жизненными кризисами и горем. Опытная поддержка в сложных ситуациях.',
  NOW(),
  NOW()
);

-- Create index for faster queries
CREATE INDEX idx_companions_gender ON public.companions(gender);
CREATE INDEX idx_companions_age ON public.companions(age);
CREATE INDEX idx_companions_experience ON public.companions(experience);

-- Set up RLS policies (if needed)
ALTER TABLE public.companions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companions are viewable by all users" ON public.companions
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert companions" ON public.companions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Only admins can update companions" ON public.companions
  FOR UPDATE USING (true);
