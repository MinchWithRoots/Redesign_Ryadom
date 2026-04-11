-- ============ USERS TABLE ============
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  age INTEGER,
  bio TEXT DEFAULT '',
  image VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- ============ COMPANIONS TABLE ============
CREATE TABLE IF NOT EXISTS companions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  age INTEGER NOT NULL,
  gender VARCHAR(20),
  specialization VARCHAR(255) NOT NULL,
  experience VARCHAR(100) NOT NULL,
  image VARCHAR(500),
  rating DECIMAL(3, 1) DEFAULT 0,
  reviews INTEGER DEFAULT 0,
  bio TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_companions_specialization ON companions(specialization);
CREATE INDEX idx_companions_is_available ON companions(is_available);
CREATE INDEX idx_companions_created_at ON companions(created_at);

-- ============ COMPANION TOPICS TABLE ============
CREATE TABLE IF NOT EXISTS companion_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  companion_id UUID NOT NULL REFERENCES companions(id) ON DELETE CASCADE,
  topic VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_companion_topics_companion_id ON companion_topics(companion_id);
CREATE INDEX idx_companion_topics_topic ON companion_topics(topic);

-- ============ CHATS TABLE ============
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  companion_id UUID NOT NULL REFERENCES companions(id) ON DELETE CASCADE,
  last_message TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chats_user_id ON chats(user_id);
CREATE INDEX idx_chats_companion_id ON chats(companion_id);
CREATE INDEX idx_chats_status ON chats(status);
CREATE INDEX idx_chats_updated_at ON chats(updated_at);

-- ============ MESSAGES TABLE ============
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- ============ FAVORITES TABLE ============
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  companion_id UUID NOT NULL REFERENCES companions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, companion_id)
);

CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_companion_id ON favorites(companion_id);

-- ============ REVIEWS TABLE ============
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  companion_id UUID NOT NULL REFERENCES companions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reviews_companion_id ON reviews(companion_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_published ON reviews(published);
CREATE INDEX idx_reviews_created_at ON reviews(created_at);

-- ============ REPORTS TABLE (для SOS/жалоб) ============
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  companion_id UUID NOT NULL REFERENCES companions(id) ON DELETE CASCADE,
  reason VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_chat_id ON reports(chat_id);
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_companion_id ON reports(companion_id);

-- ============ ENABLE ROW LEVEL SECURITY ============
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- ============ RLS POLICIES ============

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Companions are publicly readable
CREATE POLICY "Companions are publicly readable" ON companions
  FOR SELECT USING (true);

-- Users can view their own chats
CREATE POLICY "Users can view own chats" ON chats
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own chats
CREATE POLICY "Users can create chats" ON chats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own chats
CREATE POLICY "Users can update own chats" ON chats
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own chats
CREATE POLICY "Users can delete own chats" ON chats
  FOR DELETE USING (auth.uid() = user_id);

-- Users can view messages from their chats
CREATE POLICY "Users can view chat messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chats WHERE id = chat_id AND user_id = auth.uid()
    ) OR
    sender_id = auth.uid()
  );

-- Users can insert messages to their chats
CREATE POLICY "Users can insert messages" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM chats WHERE id = chat_id AND user_id = auth.uid()
    )
  );

-- Users can manage their own favorites
CREATE POLICY "Users can manage own favorites" ON favorites
  FOR ALL USING (auth.uid() = user_id);

-- Users can view and create reviews
CREATE POLICY "Users can view published reviews" ON reviews
  FOR SELECT USING (published = true OR user_id = auth.uid());

CREATE POLICY "Users can create own reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can submit reports
CREATE POLICY "Users can submit reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own reports" ON reports
  FOR SELECT USING (auth.uid() = user_id);

-- ============ SAMPLE DATA (OPTIONAL) ============
-- Uncomment to add sample companions for testing

-- INSERT INTO companions (name, age, gender, specialization, experience, image, bio, is_available, rating)
-- VALUES
--   ('Елена Петрова', 32, 'female', 'Психолог', 'Опытный специалист', 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg', 'Специализируюсь на личностном развитии', true, 4.8),
--   ('Иван Смирнов', 45, 'male', 'Психотерапевт', 'Опытный специалист', 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg', 'Работаю с травмой и стрессом', true, 4.9),
--   ('Анна Волкова', 28, 'female', 'Консультант', 'Начинающий', 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg', 'Помогаю с отношениями и коммуникацией', true, 4.5);

-- INSERT INTO companion_topics (companion_id, topic)
-- SELECT id, 'Отношения' FROM companions WHERE name = 'Елена Петрова'
-- UNION ALL
-- SELECT id, 'Самооценка' FROM companions WHERE name = 'Елена Петрова'
-- UNION ALL
-- SELECT id, 'Тревожность' FROM companions WHERE name = 'Иван Смирнов'
-- UNION ALL
-- SELECT id, 'Стресс' FROM companions WHERE name = 'Иван Смирнов'
-- UNION ALL
-- SELECT id, 'Отношения' FROM companions WHERE name = 'Анна Волкова';
