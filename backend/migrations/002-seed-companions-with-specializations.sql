-- Seed data for companions table
-- Люди, помогающие друг другу в терапии
-- specialization содержит темы для разговоров

INSERT INTO companions (name, age, gender, experience, bio, image, specialization, reviews_count)
VALUES
  (
    'Мария К.',
    28,
    'female',
    'experienced',
    'Слушаю с открытым сердцем. Прошла свой путь и знаю, как помочь.',
    '/images/users/id1-image.jpg',
    'Депрессия, тревога, отношения',
    12
  ),
  (
    'Алексей М.',
    35,
    'male',
    'expert',
    'Много лет в терапии. Помогаю найти смысл и справиться с трудностями.',
    '/images/users/id2-image.jpg',
    'Травма, отношения, личностный рост',
    18
  ),
  (
    'Елена В.',
    31,
    'female',
    'experienced',
    'Поддержу в любой кризис. Верю в силу человека и его возможности.',
    '/images/users/id3-image.jpg',
    'Стресс, жизненные кризисы, поддержка',
    9
  ),
  (
    'Сергей П.',
    40,
    'male',
    'expert',
    'Работаю над своими отношениями и хочу помочь другим в этом.',
    '/images/users/id4-image.jpg',
    'Отношения, семья, коммуникация',
    15
  ),
  (
    'Анна Т.',
    26,
    'female',
    'beginner',
    'Недавно начала заниматься собой. Понимаю молодёжные проблемы.',
    '/images/users/id5-image.jpg',
    'Самооценка, карьера, отношения',
    6
  ),
  (
    'Виктор Б.',
    45,
    'male',
    'expert',
    'Пережил многое. Помогаю другим восстанавливаться после трудных времён.',
    '/images/users/id6-image.jpg',
    'Травма, стресс, восстановление',
    21
  ),
  (
    'Ирина С.',
    33,
    'female',
    'experienced',
    'Ищу смысл и радость в жизни. Помогу вам найти свои сильные стороны.',
    '/images/users/id7-image.jpg',
    'Личностный рост, мотивация, счастье',
    14
  ),
  (
    'Дмитрий Л.',
    38,
    'male',
    'experienced',
    'В процессе самосовершенствования. Помогу с целями и развитием.',
    '/images/users/id8-image.jpg',
    'Карьера, личностный рост, цели',
    16
  )
ON CONFLICT (name) DO UPDATE
SET age = EXCLUDED.age,
    gender = EXCLUDED.gender,
    experience = EXCLUDED.experience,
    bio = EXCLUDED.bio,
    image = EXCLUDED.image,
    specialization = EXCLUDED.specialization,
    reviews_count = EXCLUDED.reviews_count;

-- Confirmation
SELECT 'Companions data added!' as status;
SELECT COUNT(*) as total_companions FROM companions;
