-- 🛡️ Admin Setup Script for Supabase
-- Используй этот скрипт для создания администратора

-- ⚠️ ВАЖНО: Замени значения на свои!
-- 1. Измени 'admin@example.com' на реальный email
-- 2. Измени 'Admin User' на имя администратора

-- Способ 1: Если пользователь уже зарегистрирован в системе
-- Просто дай ему администраторские права:
UPDATE users 
SET role = 'admin' 
WHERE email = 'admin@example.com';

-- Способ 2: Если нужно создать нового пользователя напрямую
-- (примечание: все равно нужно будет зарегистрировать его через auth)
INSERT INTO users (email, name, role, bio, created_at, updated_at)
VALUES (
  'admin@example.com',
  'Admin User',
  'admin',
  'Platform Administrator',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET role = 'admin';

-- Способ 3: Проверить всех текущих администраторов
SELECT id, name, email, role, created_at FROM users WHERE role = 'admin' ORDER BY created_at DESC;

-- Способ 4: Убрать админ права (если больше не нужны)
-- UPDATE users SET role = 'user' WHERE email = 'admin@example.com';

-- Способ 5: Посмотреть всех пользователей и их роли
SELECT id, name, email, role FROM users ORDER BY created_at DESC;

-- 📝 ИНСТРУКЦИЯ:
-- 1. Зайди на https://app.supabase.com
-- 2. Выбери свой проект
-- 3. Перейди на SQL Editor (левое меню)
-- 4. Скопируй нужный запрос выше
-- 5. Вставь его в SQL Editor
-- 6. Нажми Run (Ctrl+Enter)
-- 7. Готово! ✅

-- 🔐 БЕЗОПАСНОСТЬ:
-- - Админ роль дает полный доступ к админ панели
-- - Выдавай права только надежным людям
-- - Регулярно проверяй список администраторов
