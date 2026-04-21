-- Seed data for companions table with specializations
-- This script adds test companions and their specializations

-- Insert test companions
INSERT INTO companions (name, age, gender, experience, bio, image, price_per_hour, is_available, reviews_count, rating)
VALUES
  (
    'Мария К.',
    28,
    'female',
    'experienced',
    'Практикующий психолог с опытом работы с тревожностью и депрессией. Люблю помогать людям находить смысл и радость в жизни.',
    '/images/users/id1-image.jpg',
    50,
    true,
    24,
    4.8
  ),
  (
    'Алексей М.',
    35,
    'male',
    'expert',
    'Квалифицированный терапист с опытом более 8 лет. Специализируюсь на глубинной работе с бессознательными процессами.',
    '/images/users/id2-image.jpg',
    60,
    true,
    45,
    4.9
  ),
  (
    'Елена В.',
    31,
    'female',
    'experienced',
    'Специалист по кризисному консультированию и эмоциональной поддержке. Создаю безопасное пространство для диалога.',
    '/images/users/id3-image.jpg',
    45,
    true,
    18,
    4.7
  ),
  (
    'Сергей П.',
    40,
    'male',
    'expert',
    'Помогаю улучшить отношения в семье и близких кругах. Работаю с семейными конфликтами и коммуникацией.',
    '/images/users/id4-image.jpg',
    55,
    true,
    32,
    4.8
  ),
  (
    'Анна Т.',
    26,
    'female',
    'beginner',
    'Молодой специалист, работаю с подростками и молодыми взрослыми. Понимаю молодежные проблемы изнутри.',
    '/images/users/id5-image.jpg',
    35,
    true,
    12,
    4.6
  ),
  (
    'Виктор Б.',
    45,
    'male',
    'expert',
    'Специалист в области травматической психотерапии. Использую современные методики EMDR и других подходов.',
    '/images/users/id6-image.jpg',
    70,
    true,
    38,
    4.9
  ),
  (
    'Ирина С.',
    33,
    'female',
    'experienced',
    'Помогаю людям развивать сильные стороны и находить счастье. Верю в потенциал каждого человека.',
    '/images/users/id7-image.jpg',
    48,
    true,
    28,
    4.8
  ),
  (
    'Дмитрий Л.',
    38,
    'male',
    'experienced',
    'Профессиональный коуч. Помогаю достичь целей и раскрыть потенциал в карьере и жизни.',
    '/images/users/id8-image.jpg',
    52,
    true,
    35,
    4.7
  )
ON CONFLICT (name) DO UPDATE 
SET age = EXCLUDED.age,
    gender = EXCLUDED.gender,
    experience = EXCLUDED.experience,
    bio = EXCLUDED.bio,
    image = EXCLUDED.image,
    price_per_hour = EXCLUDED.price_per_hour,
    is_available = EXCLUDED.is_available;

-- Clear existing specializations to avoid duplicates
DELETE FROM companion_specializations WHERE companion_id IN (
  SELECT id FROM companions WHERE name IN (
    'Мария К.', 'Алексей М.', 'Елена В.', 'Сергей П.', 'Анна Т.', 'Виктор Б.', 'Ирина С.', 'Дмитрий Л.'
  )
);

-- Insert specializations for each companion

-- Мария К. - Депрессия, Тревога, Отношения
INSERT INTO companion_specializations (companion_id, specialization) VALUES
  ((SELECT id FROM companions WHERE name = 'Мария К.'), 'Депрессия'),
  ((SELECT id FROM companions WHERE name = 'Мария К.'), 'Тревога'),
  ((SELECT id FROM companions WHERE name = 'Мария К.'), 'Отношения');

-- Алексей М. - Травма, Отношения, Личностный рост
INSERT INTO companion_specializations (companion_id, specialization) VALUES
  ((SELECT id FROM companions WHERE name = 'Алексей М.'), 'Травма'),
  ((SELECT id FROM companions WHERE name = 'Алексей М.'), 'Отношения'),
  ((SELECT id FROM companions WHERE name = 'Алексей М.'), 'Личностный рост');

-- Елена В. - Стресс, Тревога, Жизненные кризисы
INSERT INTO companion_specializations (companion_id, specialization) VALUES
  ((SELECT id FROM companions WHERE name = 'Елена В.'), 'Стресс'),
  ((SELECT id FROM companions WHERE name = 'Елена В.'), 'Тревога'),
  ((SELECT id FROM companions WHERE name = 'Елена В.'), 'Жизненные кризисы');

-- Сергей П. - Отношения, Семья, Коммуникация
INSERT INTO companion_specializations (companion_id, specialization) VALUES
  ((SELECT id FROM companions WHERE name = 'Сергей П.'), 'Отношения'),
  ((SELECT id FROM companions WHERE name = 'Сергей П.'), 'Семья'),
  ((SELECT id FROM companions WHERE name = 'Сергей П.'), 'Коммуникация');

-- Анна Т. - Самооценка, Карьера, Отношения
INSERT INTO companion_specializations (companion_id, specialization) VALUES
  ((SELECT id FROM companions WHERE name = 'Анна Т.'), 'Самооценка'),
  ((SELECT id FROM companions WHERE name = 'Анна Т.'), 'Карьера'),
  ((SELECT id FROM companions WHERE name = 'Анна Т.'), 'Отношения');

-- Виктор Б. - Травма, ПТСР, Стресс
INSERT INTO companion_specializations (companion_id, specialization) VALUES
  ((SELECT id FROM companions WHERE name = 'Виктор Б.'), 'Травма'),
  ((SELECT id FROM companions WHERE name = 'Виктор Б.'), 'ПТСР'),
  ((SELECT id FROM companions WHERE name = 'Виктор Б.'), 'Стресс');

-- Ирина С. - Личностный рост, Счастье, Мотивация
INSERT INTO companion_specializations (companion_id, specialization) VALUES
  ((SELECT id FROM companions WHERE name = 'Ирина С.'), 'Личностный рост'),
  ((SELECT id FROM companions WHERE name = 'Ирина С.'), 'Счастье'),
  ((SELECT id FROM companions WHERE name = 'Ирина С.'), 'Мотивация');

-- Дмитрий Л. - Карьера, Личностный рост, Мотивация
INSERT INTO companion_specializations (companion_id, specialization) VALUES
  ((SELECT id FROM companions WHERE name = 'Дмитрий Л.'), 'Карьера'),
  ((SELECT id FROM companions WHERE name = 'Дмитрий Л.'), 'Личностный рост'),
  ((SELECT id FROM companions WHERE name = 'Дмитрий Л.'), 'Мотивация');

-- Add topics for each companion (clear existing to avoid duplicates)
DELETE FROM companion_topics WHERE companion_id IN (
  SELECT id FROM companions WHERE name IN (
    'Мария К.', 'Алексей М.', 'Елена В.', 'Сергей П.', 'Анна Т.', 'Виктор Б.', 'Ирина С.', 'Дмитрий Л.'
  )
);

-- Insert topics for Мария К.
INSERT INTO companion_topics (companion_id, topic) VALUES
  ((SELECT id FROM companions WHERE name = 'Мария К.'), 'Тревожность'),
  ((SELECT id FROM companions WHERE name = 'Мария К.'), 'Депрессия'),
  ((SELECT id FROM companions WHERE name = 'Мария К.'), 'Отношения');

-- Insert topics for Алексей М.
INSERT INTO companion_topics (companion_id, topic) VALUES
  ((SELECT id FROM companions WHERE name = 'Алексей М.'), 'Личностный рост'),
  ((SELECT id FROM companions WHERE name = 'Алексей М.'), 'Травма'),
  ((SELECT id FROM companions WHERE name = 'Алексей М.'), 'Отношения');

-- Insert topics for Елена В.
INSERT INTO companion_topics (companion_id, topic) VALUES
  ((SELECT id FROM companions WHERE name = 'Елена В.'), 'Стресс'),
  ((SELECT id FROM companions WHERE name = 'Елена В.'), 'Жизненные перемены'),
  ((SELECT id FROM companions WHERE name = 'Елена В.'), 'Самооценка');

-- Insert topics for Сергей П.
INSERT INTO companion_topics (companion_id, topic) VALUES
  ((SELECT id FROM companions WHERE name = 'Сергей П.'), 'Семья'),
  ((SELECT id FROM companions WHERE name = 'Сергей П.'), 'Коммуникация'),
  ((SELECT id FROM companions WHERE name = 'Сергей П.'), 'Отношения');

-- Insert topics for Анна Т.
INSERT INTO companion_topics (companion_id, topic) VALUES
  ((SELECT id FROM companions WHERE name = 'Анна Т.'), 'Самооценка'),
  ((SELECT id FROM companions WHERE name = 'Анна Т.'), 'Карьера'),
  ((SELECT id FROM companions WHERE name = 'Анна Т.'), 'Отношения');

-- Insert topics for Виктор Б.
INSERT INTO companion_topics (companion_id, topic) VALUES
  ((SELECT id FROM companions WHERE name = 'Виктор Б.'), 'Травма'),
  ((SELECT id FROM companions WHERE name = 'Виктор Б.'), 'Тревожность'),
  ((SELECT id FROM companions WHERE name = 'Виктор Б.'), 'Личностный рост');

-- Insert topics for Ирина С.
INSERT INTO companion_topics (companion_id, topic) VALUES
  ((SELECT id FROM companions WHERE name = 'Ирина С.'), 'Личностный рост'),
  ((SELECT id FROM companions WHERE name = 'Ирина С.'), 'Счастье'),
  ((SELECT id FROM companions WHERE name = 'Ирина С.'), 'Карьера');

-- Insert topics for Дмитрий Л.
INSERT INTO companion_topics (companion_id, topic) VALUES
  ((SELECT id FROM companions WHERE name = 'Дмитрий Л.'), 'Карьера'),
  ((SELECT id FROM companions WHERE name = 'Дмитрий Л.'), 'Личностный рост'),
  ((SELECT id FROM companions WHERE name = 'Дмитрий Л.'), 'Мотивация');

-- Summary of inserted data
SELECT 'Migration completed!' as status;
SELECT COUNT(*) as total_companions FROM companions;
SELECT COUNT(*) as total_specializations FROM companion_specializations;
SELECT COUNT(*) as total_topics FROM companion_topics;
