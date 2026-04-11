# Инструкция по завершению настройки Supabase

## ⚠️ ВАЖНО: Исправлена ошибка типов данных!

Предыдущая схема использовала UUID, но существующая БД использует INTEGER. Это создавало конфликт при создании внешних ключей.

**Решение:** Обновлена схема для использования BIGINT, совместимого с существующей структурой.

---

## ✅ Что уже сделано:
1. ✅ Установлены зависимости (`@supabase/supabase-js`, `@supabase/ssr`)
2. ✅ Добавлены переменные окружения в `.env`
3. ✅ Создана исправленная SQL схема (`SUPABASE_SCHEMA.sql`) с BIGINT ID
4. ✅ Обновлена логика регистрации в `src/composables/useAuth.ts`
5. ✅ Исправлена обработка ошибок для правильного отображения сообщений

---

## ⚠️ Что нужно сделать:

### Вариант 1: Удалить и пересоздать таблицы (РЕКОМЕНДУЕТСЯ)

Если в Supabase уже есть старые таблицы с INTEGER, нужно их очистить:

**Шаг 1: Удалить старые таблицы**
1. Перейди на https://app.supabase.com
2. В левом меню выбери **SQL Editor**
3. Нажми **New query**
4. Выполни этот SQL код:

```sql
-- Drop all existing tables to avoid conflicts
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.chat_read_status CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.chats CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.favorites CASCADE;
DROP TABLE IF EXISTS public.companion_topics CASCADE;
DROP TABLE IF EXISTS public.companions CASCADE;
DROP TABLE IF EXISTS public.user_preferences CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop sequences
DROP SEQUENCE IF EXISTS public.users_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.companions_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.chats_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.messages_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.reviews_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.favorites_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.companion_topics_id_seq CASCADE;
```

5. Нажми **Run**

**Шаг 2: Создать новые таблицы**
1. В SQL Editor нажми **New query**
2. Открой файл `SUPABASE_SCHEMA.sql` из этого проекта
3. **Копируй весь код** (все 263 строки)
4. Вставь в SQL Editor
5. Нажми **Run**

**Ожидай, пока выполнится без ошибок.**

---

### Вариант 2: Создать новый проект Supabase

Если не хочешь удалять данные:

1. Создай новый проект на https://supabase.com
2. Скопируй новый Project URL и Anon Key
3. Обнови переменные в `.env`:
   ```
   VITE_SUPABASE_URL=<новый URL>
   VITE_SUPABASE_PUBLISHABLE_KEY=<новый ключ>
   ```
4. Выполни SQL схему из `SUPABASE_SCHEMA.sql` в новом проекте

---

### Шаг 3: Включить Email Auth (если еще не включен)

1. В Supabase выбери **Authentication** → **Providers**
2. Убедись, что **Email** включен (зелёный выключатель)
3. (Опционально) Отключи "Confirm email" для тестирования:
   - **Authentication** → **Email**
   - Отключи "Require email confirmation" (для разработки)

---

## 🧪 Протестировать регистрацию

1. Открой приложение: http://localhost:5173
2. Перейди на вкладку **"Регистрация"**
3. Заполни форму:
   - **Полное имя:** Иван Иванов
   - **Email:** test@example.com
   - **Пароль:** password123
   - **Подтверждение:** password123
   - ✅ Согласиться с условиями
4. Нажми **"Создать аккаунт"**

### Результат:
- ✅ Пользователь создается в `auth.users` (Supabase Auth)
- ✅ Профиль сохраняется в таблицу `public.users`
- ✅ Приложение переходит на страницу профиля

### Если ошибка:
1. Открой консоль браузера: **F12 → Console**
2. Ищи красное сообщение об ошибке
3. Проверь:
   - Выполнилась ли SQL схема без ошибок?
   - Включен ли Email Auth?
   - Правильно ли скопирована URL и ключ в `.env`?

---

## 📝 Что происходит при регистрации (новая логика):

1. **Frontend** отправляет email и пароль в Supabase Auth
2. **Supabase Auth** создает пользователя в `auth.users` (с UUID)
3. **Frontend** вставляет профиль в `public.users` (с BIGINT ID)
4. **Frontend** ищет созданный профиль по email
5. **Приложение** сохраняет профиль и переходит на страницу профиля

---

## 🔐 Безопасность

- ✅ Пароли хранятся только в Supabase Auth (зашифрованы)
- ✅ RLS политики защищают данные пользователей
- ✅ Email уникален в системе (UNIQUE constraint)
- ✅ Пользователи могут только редактировать свои профили

---

## 📚 Структура данных

| Таблица | ID тип | Описание |
|---------|--------|----------|
| `users` | BIGSERIAL | Профили пользователей |
| `companions` | BIGSERIAL | Консультанты/спутники |
| `chats` | BIGSERIAL | Переписки между пользователями и консультантами |
| `messages` | BIGSERIAL | Сообщения в чатах |
| `reviews` | BIGSERIAL | Отзывы о консультантах |
| `favorites` | BIGSERIAL | Избранные консультанты |

---

## 🚀 Дальнейшие шаги

После успешной регистрации:
1. Пользователь может редактировать свой профиль
2. Пользователь может просматривать список консультантов
3. Пользователь может создавать чаты с консультантами
4. Все данные хранятся в Supabase и синхронизируются между устройствами

---

**Готово!** Если есть вопросы - открой консоль браузера (F12) и посмотри детальное сообщение об ошибке.
