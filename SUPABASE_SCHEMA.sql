-- ============================================
-- Supabase Schema for Ryadom Application
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE (Пользователи)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  age INT,
  bio TEXT,
  image VARCHAR(500),
  phone VARCHAR(20),
  city VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- ============================================
-- COMPANIONS TABLE (Спутники/Консультанты)
-- ============================================
CREATE TABLE IF NOT EXISTS companions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  age INT NOT NULL,
  specialization VARCHAR(255),
  experience VARCHAR(50),
  image VARCHAR(500),
  rating DECIMAL(3,1) DEFAULT 5.0,
  reviews INT DEFAULT 0,
  bio TEXT,
  price_per_hour DECIMAL(10,2),
  is_available BOOLEAN DEFAULT true,
  response_time_minutes INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- ============================================
-- COMPANION TOPICS (Темы консультаций)
-- ============================================
CREATE TABLE IF NOT EXISTS companion_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  companion_id UUID NOT NULL REFERENCES companions(id) ON DELETE CASCADE,
  topic VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- ============================================
-- REVIEWS (Отзывы и оценки)
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  companion_id UUID NOT NULL REFERENCES companions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  companion_id UUID NOT NULL REFERENCES companions(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'closed', 'archived'
  total_messages INT DEFAULT 0,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- ============================================
-- MESSAGES TABLE (Сообщения)
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- ============================================
-- CHAT READ STATUS (Статус прочтения)
-- ============================================
CREATE TABLE IF NOT EXISTS chat_read_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  unread_count INT DEFAULT 0,
  UNIQUE(chat_id, user_id)
);

-- ============================================
-- USER PREFERENCES (Настройки пользователя)
-- ============================================
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  companion_id UUID NOT NULL REFERENCES companions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  UNIQUE(user_id, companion_id)
);

-- ============================================
-- REPORTS (Отчеты о нарушениях)
-- ============================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  companion_id UUID NOT NULL REFERENCES companions(id) ON DELETE CASCADE,
  reason VARCHAR(255) NOT NULL,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- ============================================
-- INDEXES (Индексы для производительности)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_companions_specialization ON companions(specialization);
CREATE INDEX IF NOT EXISTS idx_companions_is_available ON companions(is_available);
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_companion_id ON chats(companion_id);
CREATE INDEX IF NOT EXISTS idx_chats_status ON chats(status);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_companion_topics_companion_id ON companion_topics(companion_id);
CREATE INDEX IF NOT EXISTS idx_reviews_companion_id ON reviews(companion_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companions ENABLE ROW LEVEL SECURITY;
ALTER TABLE companion_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Users: Users can only read their own profile
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow inserting new user profiles during signup
CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Companions: Anyone can read available companions
CREATE POLICY "Anyone can view available companions" ON companions
  FOR SELECT USING (true);

-- Chats: Users can only view their own chats
CREATE POLICY "Users can view their own chats" ON chats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create chats" ON chats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Messages: Users can view messages in their chats
CREATE POLICY "Users can view messages in their chats" ON messages
  FOR SELECT USING (
    chat_id IN (
      SELECT id FROM chats WHERE user_id = auth.uid()
      UNION
      SELECT id FROM chats WHERE companion_id IN (SELECT id FROM companions)
    )
  );

CREATE POLICY "Users can send messages in their chats" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    chat_id IN (SELECT id FROM chats WHERE user_id = auth.uid())
  );

-- Reviews: Users can view all published reviews
CREATE POLICY "Anyone can view published reviews" ON reviews
  FOR SELECT USING (published = true);

CREATE POLICY "Users can create their own reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Favorites: Users can manage their own favorites
CREATE POLICY "Users can view their own favorites" ON favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites" ON favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Reports: Users can create reports for their chats
CREATE POLICY "Users can create reports for their chats" ON reports
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    chat_id IN (SELECT id FROM chats WHERE user_id = auth.uid())
  );

-- ============================================
-- SAMPLE DATA (Опционально)
-- ============================================

-- Insert sample companions
INSERT INTO companions (name, age, specialization, experience, image, rating, reviews, bio, price_per_hour, is_available, response_time_minutes)
VALUES 
  ('Мария К.', 28, 'Психолог', 'Опытный специалист', 'https://images.pexels.com/photos/27603433/pexels-photo-27603433.jpeg', 4.9, 127, 'Специализируюсь на работе с молодежью и вопросами личных отношений', 50.00, true, 15),
  ('Алексей М.', 32, 'Counselor', 'Опытный специалист', 'https://images.pexels.com/photos/31422830/pexels-photo-31422830.png', 4.8, 95, 'Помогу разобраться в карьерных целях и найти свой путь', 45.00, true, 20),
  ('Елена В.', 35, 'Терапевт', 'Опытный специалист', 'https://images.pexels.com/photos/20860595/pexels-photo-20860595.jpeg', 5.0, 156, 'Специалист по работе с жизненными кризисами и горем', 60.00, true, 10)
ON CONFLICT DO NOTHING;

-- Insert companion topics
INSERT INTO companion_topics (companion_id, topic)
SELECT id, topic FROM (
  SELECT companion_topics.id, 'Отношения' as topic FROM companions WHERE name = 'Мария К.' LIMIT 1
) AS t
UNION ALL
SELECT (SELECT id FROM companions WHERE name = 'Мария К.' LIMIT 1), 'Тревожность'
UNION ALL
SELECT (SELECT id FROM companions WHERE name = 'Мария К.' LIMIT 1), 'Стресс'
UNION ALL
SELECT (SELECT id FROM companions WHERE name = 'Алексей М.' LIMIT 1), 'Карьера'
UNION ALL
SELECT (SELECT id FROM companions WHERE name = 'Алексей М.' LIMIT 1), 'Развитие'
UNION ALL
SELECT (SELECT id FROM companions WHERE name = 'Алексей М.' LIMIT 1), 'Мотивация'
UNION ALL
SELECT (SELECT id FROM companions WHERE name = 'Елена В.' LIMIT 1), 'Горе'
UNION ALL
SELECT (SELECT id FROM companions WHERE name = 'Елена В.' LIMIT 1), 'Потеря'
UNION ALL
SELECT (SELECT id FROM companions WHERE name = 'Елена В.' LIMIT 1), 'Восстановление'
ON CONFLICT DO NOTHING;
