-- Create database
CREATE DATABASE ryadom;

-- Connect to the database
\c ryadom

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  age INT,
  bio TEXT,
  image VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Companions table
CREATE TABLE companions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  age INT NOT NULL,
  specialization VARCHAR(255),
  experience VARCHAR(50),
  image VARCHAR(500),
  rating DECIMAL(3,1) DEFAULT 5.0,
  reviews INT DEFAULT 0,
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Companion topics (many-to-many)
CREATE TABLE companion_topics (
  id SERIAL PRIMARY KEY,
  companion_id INT NOT NULL REFERENCES companions(id) ON DELETE CASCADE,
  topic VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chats table
CREATE TABLE chats (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  companion_id INT NOT NULL REFERENCES companions(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  chat_id INT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat read status
CREATE TABLE chat_read_status (
  id SERIAL PRIMARY KEY,
  chat_id INT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  unread_count INT DEFAULT 0,
  UNIQUE(chat_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_companions_specialization ON companions(specialization);
CREATE INDEX idx_chats_user_id ON chats(user_id);
CREATE INDEX idx_chats_companion_id ON chats(companion_id);
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_companion_topics_companion_id ON companion_topics(companion_id);

-- Insert sample companions
INSERT INTO companions (name, age, specialization, experience, image, rating, reviews, bio)
VALUES 
  ('Мария К.', 28, 'Психолог', 'Опытный специалист', 'https://images.pexels.com/photos/27603433/pexels-photo-27603433.jpeg', 4.9, 127, 'Специализируюсь на работе с молодежью и вопросами личных отношений'),
  ('Алексей М.', 32, 'Counselor', 'Опытный специалист', 'https://images.pexels.com/photos/31422830/pexels-photo-31422830.png', 4.8, 95, 'Помогу разобраться в карьерных целях и найти свой путь'),
  ('Елена В.', 35, 'Терапевт', 'Опытный специалист', 'https://images.pexels.com/photos/20860595/pexels-photo-20860595.jpeg', 5.0, 156, 'Специалист по работе с жизненными кризисами и горем'),
  ('Игорь С.', 26, 'Слушатель', 'Начинающий', 'https://images.pexels.com/photos/966067/pexels-photo-966067.jpeg', 4.7, 43, 'Готов выслушать и поддержать в любой жизненной ситуации');

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
  (4, 'Общение');

-- Insert sample user (password: password123 - hashed)
INSERT INTO users (name, email, password, age, bio, image)
VALUES ('Александр К.', 'alexander@example.com', '$2a$10$YourHashedPasswordHere', 29, 'Ищу поддержку и помощь в развитии', 'https://images.pexels.com/photos/31422830/pexels-photo-31422830.png');
