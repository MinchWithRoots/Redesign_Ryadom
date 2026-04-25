# База Данных - Структура и Статус

## Таблица: users
- **id**: UUID (PRIMARY KEY) - совпадает с auth.users(id)
- **email**: varchar (UNIQUE) - из auth
- **name**: varchar (NOT NULL)
- **age**: integer
- **gender**: varchar
- **bio**: text
- **image**: varchar
- **topics**: jsonb (array of topic names)
- **role**: varchar (default 'user')
- **is_active**: boolean (default true)
- **created_at**: timestamptz
- **updated_at**: timestamptz

**Статус:** ✅ Все данные присутствуют (5 пользователей с UUID)

---

## Таблица: user_preferences
- **id**: bigserial (PRIMARY KEY)
- **user_id**: uuid (UNIQUE) - FK → users(id) ON DELETE CASCADE
- **notifications_enabled**: boolean (default true)
- **email_notifications**: boolean (default true)
- **language**: varchar (default 'ru')
- **theme**: varchar (default 'light')
- **created_at**: timestamptz
- **updated_at**: timestamptz

**Статус:** ✅ Пересоздана с правильным типом uuid (была bigint)

---

## Таблица: chats
- **id**: bigint (PRIMARY KEY)
- **user_id**: bigint → **НУЖНО ИЗМЕНИТЬ НА UUID**
- **companion_id**: bigint → FK to companions(id)
- **status**: varchar
- **total_messages**: integer
- **last_message_at**: timestamptz
- **created_at**: timestamptz
- **updated_at**: timestamptz

**FK нужна:** user_id → users(id)
**Статус:** ❌ Нет данных, RLS политики удаляются, ждет изменения типа

---

## Таблица: chat_read_status
- **id**: bigint (PRIMARY KEY)
- **chat_id**: bigint → FK to chats(id)
- **user_id**: bigint → **НУЖНО ИЗМЕНИТЬ НА UUID**
- **last_read_at**: timestamptz
- **unread_count**: integer

**FK нужна:** user_id → users(id)
**Статус:** ❌ Нет данных, ждет изменения типа

---

## Таблица: favorites
- **id**: bigint (PRIMARY KEY)
- **user_id**: bigint → **НУЖНО ИЗМЕНИТЬ НА UUID**
- **companion_id**: bigint → FK to companions(id)
- **created_at**: timestamptz

**FK нужна:** user_id → users(id)
**Статус:** ❌ Нет данных, RLS политики удаляются, ждет изменения типа

---

## Таблица: messages
- **id**: bigint (PRIMARY KEY)
- **chat_id**: bigint → FK to chats(id)
- **sender_id**: bigint → **НУЖНО ИЗМЕНИТЬ НА UUID**
- **text**: text
- **is_read**: boolean
- **read_at**: timestamptz
- **created_at**: timestamptz

**FK нужна:** sender_id → users(id)
**Статус:** ❌ Нет данных, RLS политики удаляются, ждет изменения типа

---

## Таблица: reports
- **id**: bigint (PRIMARY KEY)
- **chat_id**: bigint → FK to chats(id)
- **user_id**: bigint → **НУЖНО ИЗМЕНИТЬ НА UUID**
- **companion_id**: bigint → FK to companions(id)
- **reason**: varchar
- **message**: text
- **status**: varchar
- **created_at**: timestamptz
- **updated_at**: timestamptz

**FK нужна:** user_id → users(id)
**Статус:** ❌ Нет данных, RLS политики удаляются, ждет изменения типа

---

## Таблица: reviews
- **id**: bigint (PRIMARY KEY)
- **companion_id**: bigint → FK to companions(id)
- **user_id**: bigint → **НУЖНО ИЗМЕНИТЬ НА UUID**
- **rating**: integer (1-5)
- **title**: varchar
- **comment**: text
- **published**: boolean
- **created_at**: timestamptz
- **updated_at**: timestamptz

**FK нужна:** user_id → users(id)
**Статус:** ❌ Нет данных, RLS политики удаляются, ждет изменения типа

---

## Таблица: companions
- **id**: bigint (PRIMARY KEY)
- **name**: varchar
- **age**: integer
- **gender**: varchar
- **experience**: varchar
- **bio**: text
- **image**: varchar
- **topics**: jsonb
- **reviews_count**: integer
- **created_at**: timestamptz
- **updated_at**: timestamptz

**Статус:** ✅ Нет изменений нужно

---

## Таблица: companion_topics
- **id**: bigint (PRIMARY KEY)
- **name**: varchar (UNIQUE)
- **description**: text
- **created_at**: timestamptz

**Статус:** ✅ Нет изменений нужно

---

## Что уже сделано ✅
1. ✅ Пересоздана таблица `user_preferences` с типом uuid для user_id
2. ✅ Добавлена FK: user_preferences(user_id) → users(id)
3. ✅ Удалены все RLS политики (готовим к изменению типов)

## Что нужно сделать ⏳
1. ⏳ Изменить типы: user_id, sender_id с bigint на uuid в таблицах:
   - chats.user_id
   - chat_read_status.user_id
   - favorites.user_id
   - messages.sender_id
   - reports.user_id
   - reviews.user_id

2. ⏳ Добавить все недостающие FK связи к users(id)

3. ⏳ Пересоздать RLS политики с правильными типами

4. ⏳ Проверить что при регистрации сохраняются ВСЕ данные:
   - age ✅ (ProfileSetupView)
   - gender ✅ (ProfileSetupView)
   - bio ✅ (ProfileSetupView)
   - topics ✅ (ProfileSetupView)
   - image ✅ (ProfileSetupView)
