-- Create database
CREATE DATABASE IF NOT EXISTS ryadom;

-- Connect to the database
\c ryadom

-- Users table (основная таблица пользователей)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  age INT,
  bio TEXT,
  image VARCHAR(500),
  role VARCHAR(20) DEFAULT 'user', -- 'user' or 'admin'
  phone VARCHAR(20),
  city VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Companions table (спутники/консультанты)
CREATE TABLE IF NOT EXISTS companions (
  id SERIAL PRIMARY KEY,
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Companion topics (темы консультаций - many-to-many)
CREATE TABLE IF NOT EXISTS companion_topics (
  id SERIAL PRIMARY KEY,
  companion_id INT NOT NULL REFERENCES companions(id) ON DELETE CASCADE,
  topic VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews and Ratings
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  companion_id INT NOT NULL REFERENCES companions(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(companion_id, user_id)
);

-- Chats table (переписки между пользователем и спутником)
CREATE TABLE IF NOT EXISTS chats (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  companion_id INT NOT NULL REFERENCES companions(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'closed', 'archived'
  total_messages INT DEFAULT 0,
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages table (сообщения в чатах)
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  chat_id INT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat read status (статус прочтения сообщений)
CREATE TABLE IF NOT EXISTS chat_read_status (
  id SERIAL PRIMARY KEY,
  chat_id INT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  unread_count INT DEFAULT 0,
  UNIQUE(chat_id, user_id)
);

-- User preferences (настройки пользователя)
CREATE TABLE IF NOT EXISTS user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  language VARCHAR(10) DEFAULT 'ru',
  theme VARCHAR(20) DEFAULT 'light', -- 'light' or 'dark'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Favorites (избранные спутники)
CREATE TABLE IF NOT EXISTS favorites (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  companion_id INT NOT NULL REFERENCES companions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, companion_id)
);

-- Sessions (активные сессии пользователей)
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL,
  user_agent VARCHAR(500),
  ip_address VARCHAR(50),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
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
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Insert sample companions
INSERT INTO companions (name, age, specialization, experience, image, rating, reviews, bio, price_per_hour, is_available, response_time_minutes)
VALUES 
  ('Мария К.', 28, 'Психолог', 'Опытный специалист', 'https://images.pexels.com/photos/27603433/pexels-photo-27603433.jpeg', 4.9, 127, 'Специализируюсь на работе с молодежью и вопросами личных отношений', 50.00, true, 15),
  ('Алексей М.', 32, 'Counselor', 'Опытный специалист', 'https://images.pexels.com/photos/31422830/pexels-photo-31422830.png', 4.8, 95, 'Помогу разобраться в карьерных целях и найти свой путь', 45.00, true, 20),
  ('Елена В.', 35, 'Терапевт', 'Опытный специалист', 'https://images.pexels.com/photos/20860595/pexels-photo-20860595.jpeg', 5.0, 156, 'Специалист по работе с жизненными кризисами и горем', 60.00, true, 10),
  ('Игорь С.', 26, 'Слушатель', 'Начинающий', 'https://images.pexels.com/photos/966067/pexels-photo-966067.jpeg', 4.7, 43, 'Готов выслушать и поддержать в любой жизненной ситуации', 30.00, true, 30)
ON CONFLICT DO NOTHING;

-- Insert companion topics
INSERT INTO companion_topics (companion_id, topic)
VALUES 
  (1, 'Отношения'),
  (1, 'Тревожность'),
  (1, 'Стресс'),
  (2, 'Карьера'),
  (2, 'Развитие'),
  (2, 'Мотивация'),
  (3, 'Горе'),
  (3, 'Потеря'),
  (3, 'Восстановление'),
  (4, 'Личные проблемы'),
  (4, 'Поддержка'),
  (4, 'Общение')
ON CONFLICT DO NOTHING;

-- Insert sample admin user (password: admin123 - you should hash this)
INSERT INTO users (name, email, password, age, bio, image, role, city)
VALUES ('Admin', 'admin@example.com', '$2a$10$YourHashedPasswordHere', 35, 'Администратор системы', 'https://images.pexels.com/photos/31422830/pexels-photo-31422830.png', 'admin', 'Moscow')
ON CONFLICT DO NOTHING;

-- Insert sample regular user
INSERT INTO users (name, email, password, age, bio, image, role, city)
VALUES ('Александр К.', 'alexander@example.com', '$2a$10$YourHashedPasswordHere', 29, 'Ищу поддержку и помощь в развитии', 'https://images.pexels.com/photos/31422830/pexels-photo-31422830.png', 'user', 'Saint Petersburg')
ON CONFLICT DO NOTHING;
