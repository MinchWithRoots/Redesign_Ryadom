-- ============================================
-- Supabase Schema for Ryadom Application
-- Совместимо с существующей схемой (INTEGER IDs)
-- ============================================

-- ============================================
-- USERS TABLE (Пользователи)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  age INT,
  gender VARCHAR(50),
  bio TEXT,
  image VARCHAR(500),
  phone VARCHAR(20),
  city VARCHAR(255),
  topics JSONB DEFAULT '[]'::jsonb,
  role VARCHAR(20) DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- ============================================
-- COMPANIONS TABLE (Спутники/Консультанты)
-- ============================================
CREATE TABLE IF NOT EXISTS public.companions (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  age INT NOT NULL,
  gender VARCHAR(50),
  specialization VARCHAR(255),
  experience VARCHAR(50),
  image VARCHAR(500),
  rating DECIMAL(3,1) DEFAULT 5.0,
  reviews INT DEFAULT 0,
  bio TEXT,
  topics JSONB DEFAULT '[]'::jsonb,
  price_per_hour DECIMAL(10,2),
  is_available BOOLEAN DEFAULT true,
  response_time_minutes INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- ============================================
-- COMPANION TOPICS (Темы консультаций - Reference Table)
-- ============================================
CREATE TABLE IF NOT EXISTS public.companion_topics (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- ============================================
-- REVIEWS (Отзывы и оценки)
-- ============================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id BIGSERIAL PRIMARY KEY,
  companion_id BIGINT NOT NULL REFERENCES public.companions(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  UNIQUE(companion_id, user_id)
);

-- ============================================
-- CHATS TABLE (Переписки)
-- ============================================
CREATE TABLE IF NOT EXISTS public.chats (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  companion_id BIGINT NOT NULL REFERENCES public.companions(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'closed', 'archived'
  total_messages INT DEFAULT 0,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- ============================================
-- MESSAGES TABLE (Сообщения)
-- ============================================
CREATE TABLE IF NOT EXISTS public.messages (
  id BIGSERIAL PRIMARY KEY,
  chat_id BIGINT NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- ============================================
-- CHAT READ STATUS (Статус прочтения)
-- ============================================
CREATE TABLE IF NOT EXISTS public.chat_read_status (
  id BIGSERIAL PRIMARY KEY,
  chat_id BIGINT NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  unread_count INT DEFAULT 0,
  UNIQUE(chat_id, user_id)
);

-- ============================================
-- USER PREFERENCES (Настройки пользователя)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  language VARCHAR(10) DEFAULT 'ru',
  theme VARCHAR(20) DEFAULT 'light', -- 'light' or 'dark'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- ============================================
-- FAVORITES (Избранные спутники)
-- ============================================
CREATE TABLE IF NOT EXISTS public.favorites (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  companion_id BIGINT NOT NULL REFERENCES public.companions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  UNIQUE(user_id, companion_id)
);

-- ============================================
-- REPORTS (Отчеты о нарушениях)
-- ============================================
CREATE TABLE IF NOT EXISTS public.reports (
  id BIGSERIAL PRIMARY KEY,
  chat_id BIGINT NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  companion_id BIGINT NOT NULL REFERENCES public.companions(id) ON DELETE CASCADE,
  reason VARCHAR(255) NOT NULL,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- ============================================
-- INDEXES (Индексы для производительности)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);
CREATE INDEX IF NOT EXISTS idx_companions_specialization ON public.companions(specialization);
CREATE INDEX IF NOT EXISTS idx_companions_is_available ON public.companions(is_available);
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON public.chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_companion_id ON public.chats(companion_id);
CREATE INDEX IF NOT EXISTS idx_chats_status ON public.chats(status);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read);
CREATE INDEX IF NOT EXISTS idx_companion_topics_name ON public.companion_topics(name);
CREATE INDEX IF NOT EXISTS idx_reviews_companion_id ON public.reviews(companion_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companion_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Users: Anyone can view users (needed for displaying profiles)
CREATE POLICY "Users can view all profiles" ON public.users
  FOR SELECT USING (true);

-- Users: Authenticated users can update profiles (by email which is unique)
CREATE POLICY "Users can update profiles" ON public.users
  FOR UPDATE WITH CHECK (true);

-- Companion Topics: Anyone can read topics (reference table)
CREATE POLICY "Anyone can view companion topics" ON public.companion_topics
  FOR SELECT USING (true);

-- Companions: Anyone can read available companions
CREATE POLICY "Anyone can view available companions" ON public.companions
  FOR SELECT USING (true);

-- Chats: Users can only view their own chats
CREATE POLICY "Users can view their own chats" ON public.chats
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create chats" ON public.chats
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Messages: Users can view messages in their chats
CREATE POLICY "Users can view messages in their chats" ON public.messages
  FOR SELECT USING (
    chat_id IN (
      SELECT id FROM public.chats WHERE auth.uid()::text = user_id::text
    )
  );

CREATE POLICY "Users can send messages in their chats" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid()::text = sender_id::text
  );

-- Reviews: Anyone can view published reviews
CREATE POLICY "Anyone can view published reviews" ON public.reviews
  FOR SELECT USING (published = true);

CREATE POLICY "Users can create their own reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Favorites: Users can manage their own favorites
CREATE POLICY "Users can view their own favorites" ON public.favorites
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can add favorites" ON public.favorites
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can remove favorites" ON public.favorites
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Reports: Users can create reports for their chats
CREATE POLICY "Users can create reports for their chats" ON public.reports
  FOR INSERT WITH CHECK (
    auth.uid()::text = user_id::text AND
    chat_id IN (SELECT id FROM public.chats WHERE auth.uid()::text = user_id::text)
  );

-- ============================================
-- SAMPLE DATA (Опционально)
-- ============================================

-- Insert sample companions
INSERT INTO public.companions (name, age, specialization, experience, image, rating, reviews, bio, price_per_hour, is_available, response_time_minutes)
VALUES 
  ('Мария К.', 28, 'Психолог', 'Опытный специалист', 'https://images.pexels.com/photos/27603433/pexels-photo-27603433.jpeg', 4.9, 127, 'Специализируюсь на работе с молодежью и вопросами личных отношений', 50.00, true, 15),
  ('Алексей М.', 32, 'Counselor', 'Опытный специалист', 'https://images.pexels.com/photos/31422830/pexels-photo-31422830.png', 4.8, 95, 'Помогу разобраться в карьерных целях и найти свой путь', 45.00, true, 20),
  ('Елена В.', 35, 'Терапевт', 'Опытный специалист', 'https://images.pexels.com/photos/20860595/pexels-photo-20860595.jpeg', 5.0, 156, 'Специалист по работе с жизненными кризисами и горем', 60.00, true, 10)
ON CONFLICT DO NOTHING;

-- Insert companion topics (reference table with all available topics)
INSERT INTO public.companion_topics (name, description)
VALUES
  ('Отношения', 'Консультация по личным взаимоотношениям'),
  ('Тревожность', 'Помощь при тревожных расстройствах'),
  ('Стресс', 'Управление стрессом и его последствиями'),
  ('Карьера', 'Консультация по развитию карьеры'),
  ('Развитие', 'Личностное развитие и самосовершенствование'),
  ('Мотивация', 'Поиск мотивации и целеполагание'),
  ('Горе', 'Помощь при переживании горя'),
  ('Потеря', 'Работа с потерей и разочарованием'),
  ('Восстановление', 'Восстановление после травм и кризисов')
ON CONFLICT (name) DO NOTHING;
