-- Seed data for companions table
-- This script adds test companions with specialization field

-- Insert test companions
INSERT INTO companions (name, age, gender, experience, specialization, bio, image, price_per_hour, is_available)
VALUES
  (
    'Мария К.',
    28,
    'female',
    'experienced',
    'Психотерапия (когнитивно-поведенческая)',
    'Практикующий психолог с опытом работы с тревожностью и депрессией. Люблю помогать людям находить смысл и радость в жизни.',
    '/images/users/id1-image.jpg',
    50,
    true
  ),
  (
    'Алексей М.',
    35,
    'male',
    'expert',
    'Психодинамическая психотерапия',
    'Квалифицированный терапист с опытом более 8 лет. Специализируюсь на глубинной работе с бессознательными процессами.',
    '/images/users/id2-image.jpg',
    60,
    true
  ),
  (
    'Елена В.',
    31,
    'female',
    'experienced',
    'Консультирование и поддержка',
    'Специалист по кризисному консультированию и эмоциональной поддержке. Создаю безопасное пространство для диалога.',
    '/images/users/id3-image.jpg',
    45,
    true
  ),
  (
    'Сергей П.',
    40,
    'male',
    'expert',
    'Системная семейная терапия',
    'Помогаю улучшить отношения в семье и близких кругах. Работаю с семейными конфликтами и коммуникацией.',
    '/images/users/id4-image.jpg',
    55,
    true
  ),
  (
    'Анна Т.',
    26,
    'female',
    'beginner',
    'Консультирование молодежи',
    'Молодой специалист, работаю с подростками и молодыми взрослыми. Понимаю молодежные проблемы изнутри.',
    '/images/users/id5-image.jpg',
    35,
    true
  ),
  (
    'Виктор Б.',
    45,
    'male',
    'expert',
    'Работа с травмой и ПТСР',
    'Специалист в области травматической психотерапии. Использую современные методики EMDR и других подходов.',
    '/images/users/id6-image.jpg',
    70,
    true
  ),
  (
    'Ирина С.',
    33,
    'female',
    'experienced',
    'Позитивная психология',
    'Помогаю людям развивать сильные стороны и находить счастье. Верю в потенциал каждого человека.',
    '/images/users/id7-image.jpg',
    48,
    true
  ),
  (
    'Дмитрий Л.',
    38,
    'male',
    'experienced',
    'Коучинг и развитие',
    'Профессиональный коуч. Помогаю достичь целей и раскрыть потенциал в карьере и жизни.',
    '/images/users/id8-image.jpg',
    52,
    true
  )
ON CONFLICT (name) DO UPDATE 
SET specialization = EXCLUDED.specialization,
    bio = EXCLUDED.bio,
    price_per_hour = EXCLUDED.price_per_hour,
    is_available = EXCLUDED.is_available;

-- Add topics for each companion (first clear existing topics to avoid duplicates)
DELETE FROM companion_topics WHERE companion_id IN (SELECT id FROM companions WHERE name IN (
  'Мария К.', 'Алексей М.', 'Елена В.', 'Сергей П.', 'Анна Т.', 'Виктор Б.', 'Ирина С.', 'Дмитрий Л.'
));

-- Insert topics for Мария К.
INSERT INTO companion_topics (companion_id, topic)
SELECT id, topic FROM (
  SELECT (SELECT id FROM companions WHERE name = 'Мария К.') as cid, 'Тревожность' as topic
  UNION ALL
  SELECT (SELECT id FROM companions WHERE name = 'Мария К.'), 'Депрессия'
  UNION ALL
  SELECT (SELECT id FROM companions WHERE name = 'Мария К.'), 'Отношения'
) t WHERE cid IS NOT NULL;

-- Insert topics for Алексей М.
INSERT INTO companion_topics (companion_id, topic)
SELECT id, topic FROM (
  SELECT (SELECT id FROM companions WHERE name = 'Алексей М.') as cid, 'Личностный рост' as topic
  UNION ALL
  SELECT (SELECT id FROM companions WHERE name = 'Алексей М.'), 'Травма'
  UNION ALL
  SELECT (SELECT id FROM companions WHERE name = 'Алексей М.'), 'Отношения'
) t WHERE cid IS NOT NULL;

-- Insert topics for Елена В.
INSERT INTO companion_topics (companion_id, topic)
SELECT id, topic FROM (
  SELECT (SELECT id FROM companions WHERE name = 'Елена В.') as cid, 'Стресс' as topic
  UNION ALL
  SELECT (SELECT id FROM companions WHERE name = 'Елена В.'), 'Жизненные перемены'
  UNION ALL
  SELECT (SELECT id FROM companions WHERE name = 'Елена В.'), 'Самооценка'
) t WHERE cid IS NOT NULL;

-- Insert topics for Сергей П.
INSERT INTO companion_topics (companion_id, topic)
SELECT id, topic FROM (
  SELECT (SELECT id FROM companions WHERE name = 'Сергей П.') as cid, 'Семья' as topic
  UNION ALL
  SELECT (SELECT id FROM companions WHERE name = 'Сергей П.'), 'Коммуникация'
  UNION ALL
  SELECT (SELECT id FROM companions WHERE name = 'Сергей П.'), 'Отношения'
) t WHERE cid IS NOT NULL;

-- Insert topics for Анна Т.
INSERT INTO companion_topics (companion_id, topic)
SELECT id, topic FROM (
  SELECT (SELECT id FROM companions WHERE name = 'Анна Т.') as cid, 'Самооценка' as topic
  UNION ALL
  SELECT (SELECT id FROM companions WHERE name = 'Анна Т.'), 'Карьера'
  UNION ALL
  SELECT (SELECT id FROM companions WHERE name = 'Анна Т.'), 'Отношения'
) t WHERE cid IS NOT NULL;

-- Insert topics for Виктор Б.
INSERT INTO companion_topics (companion_id, topic)
SELECT id, topic FROM (
  SELECT (SELECT id FROM companions WHERE name = 'Виктор Б.') as cid, 'Травма' as topic
  UNION ALL
  SELECT (SELECT id FROM companions WHERE name = 'Виктор Б.'), 'Тревожность'
  UNION ALL
  SELECT (SELECT id FROM companions WHERE name = 'Виктор Б.'), 'Личностный рост'
) t WHERE cid IS NOT NULL;

-- Insert topics for Ирина С.
INSERT INTO companion_topics (companion_id, topic)
SELECT id, topic FROM (
  SELECT (SELECT id FROM companions WHERE name = 'Ирина С.') as cid, 'Личностный рост' as topic
  UNION ALL
  SELECT (SELECT id FROM companions WHERE name = 'Ирина С.'), 'Счастье'
  UNION ALL
  SELECT (SELECT id FROM companions WHERE name = 'Ирина С.'), 'Карьера'
) t WHERE cid IS NOT NULL;

-- Insert topics for Дмитрий Л.
INSERT INTO companion_topics (companion_id, topic)
SELECT id, topic FROM (
  SELECT (SELECT id FROM companions WHERE name = 'Дмитрий Л.') as cid, 'Карьера' as topic
  UNION ALL
  SELECT (SELECT id FROM companions WHERE name = 'Дмитрий Л.'), 'Личностный рост'
  UNION ALL
  SELECT (SELECT id FROM companions WHERE name = 'Дмитрий Л.'), 'Мотивация'
) t WHERE cid IS NOT NULL;

-- Confirm completion
SELECT COUNT(*) as total_companions FROM companions;
SELECT COUNT(*) as total_topics FROM companion_topics;
