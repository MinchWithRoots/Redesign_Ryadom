# 📊 Анализ использования таблиц БД: что использовать, что можно удалить

## 🟢 АКТИВНО ИСПОЛЬЗУЕМЫЕ ТАБЛИЦЫ (НУЖНЫ)

### 1. **users** ✅ КРИТИЧНА
- **Использование**: Везде
- **Где**: 
  - `useAppState.ts` - загрузка профиля, обновление
  - `ChatView.vue` - получение имён отправителей
  - `AdminDashboardView.vue` - управление пользователями
  - `supabaseService.ts` - работа с профилями
- **Поля, которые используются**: id, email, name, age, bio, image, topics, role, gender, sessions
- **Можно ли удалить**: ❌ НЕТ - базовая таблица для всех пользователей

---

### 2. **companions** ✅ КРИТИЧНА
- **Использование**: Везде
- **Где**:
  - `SearchView.vue` - поиск и фильтрация
  - `UserProfileView.vue` - профиль компаньона
  - `AdminDashboardView.vue` - управление
  - `supabaseService.ts` - основные операции
- **Поля, которые используются**: id, name, age, gender, experience, image, bio, topics (JSONB), user_id, sessions, reviews_count, is_available
- **Можно ли удалить**: ❌ НЕТ - ядро приложения

---

### 3. **chats** ✅ КРИТИЧНА
- **Использование**: Весь функционал чатов
- **Где**:
  - `ChatView.vue` - создание, обновление, удаление
  - `useAppState.ts` - загрузка чатов
  - `supabaseService.ts` - основные операции
- **Поля, которые используются**: id, user_id, companion_id, status, created_at, updated_at, blocked_by
- **Можно ли удалить**: ❌ НЕТ - центральная таблица для сообщений

---

### 4. **messages** ✅ КРИТИЧНА
- **Использование**: Вся система чатов
- **Где**:
  - `ChatView.vue` - отправка, загрузка, обновление статуса
  - `useAppState.ts` - получение сообщений
  - `chatService.ts` - работа с сообщениями
- **Поля, которые используются**: id, chat_id, sender_id, text, encrypted_text, is_encrypted, is_read, read_at, created_at
- **Можно ли удалить**: ❌ НЕТ - основная таблица для сообщений

---

### 5. **chat_encryption_keys** ✅ КРИТИЧНА
- **Использование**: Шифрование сообщений
- **Где**:
  - `encryptionService.ts` - сохранение и получение ключей
  - `useAppState.ts` - загрузка ключей шифрования
- **Поля, которые используются**: id, chat_id, user_id, encrypted_key, created_at
- **Можно ли удалить**: ❌ НЕТ - нужна для end-to-end шифрования

---

### 6. **reviews** ✅ КРИТИЧНА
- **Использование**: Система отзывов
- **Где**:
  - `ReviewModal.vue` - написание отзывов
  - `AdminDashboardView.vue` - управление отзывами
  - `ProfileView.vue` - просмотр отзывов о себе
  - `supabaseService.ts` - все операции с отзывами
- **Поля, которые используются**: id, companion_id, user_id, rating, comment, published, is_anonymous, chat_id, created_at
- **Можно ли удалить**: ❌ НЕТ - функционал отзывов

---

### 7. **companion_chat_requests** ✅ КРИТИЧНА
- **Использование**: Система запросов на соединение
- **Где**:
  - `CompanionChatRequests.vue` - входящие запросы
  - `UserChatRequests.vue` - отправленные запросы
  - `useAppState.ts` - управление запросами
  - `supabaseService.ts` - операции с запросами
- **Поля, которые используются**: id, user_id, companion_id, status, chat_id, created_at, updated_at, approved_at, rejected_at, rejection_reason
- **Можно ли удалить**: ❌ НЕТ - без этого нет механизма соединения

---

### 8. **companion_applications** ✅ КРИТИЧНА
- **Использование**: Заявки на становление компаньоном
- **Где**:
  - `CompanionApplicationView.vue` - подача заявки
  - `AdminDashboardView.vue` - проверка и одобрение/отклонение
  - `supabaseService.ts` - операции с заявками
- **Поля, которые используются**: id, user_id, name, age, gender, experience, bio, image, topics (JSONB), status, created_at, approved_at, rejected_at, rejection_reason
- **Можно ли удалить**: ❌ НЕТ - система модерации компаньонов

---

### 9. **companion_topics** ✅ ИСПОЛЬЗУЕТСЯ
- **Использование**: Справочник тем поддержки
- **Где**:
  - `CompanionApplicationView.vue` - выбор тем при заявке
  - `SearchView.vue` - фильтрация по темам
  - `ProfileSetupView.vue` - выбор тем при создании профиля
  - `useAppState.ts` - загрузка списка тем
  - Backend миграции - инициализация тем
- **Поля, которые используются**: id, name, description
- **Можно ли удалить**: ❌ НЕТ - нужна для справочника тем

---

### 10. **reports** ✅ ИСПОЛЬЗУЕТСЯ
- **Использование**: Система жалоб на нарушения
- **Где**:
  - `ChatView.vue` - подача жалобы
  - `AdminDashboardView.vue` - просмотр и модерация жалоб (вкладка "Жалобы")
  - `supabaseService.ts` - операции с жалобами
- **Поля, которые используются**: id, chat_id, user_id, companion_id, reason, message, status, created_at, updated_at
- **Можно ли удалить**: ❌ НЕТ - система модерации

---

## 🟡 ИСПОЛЬЗУЕТСЯ, НО МОЖЕТ БЫТЬ ОПТИМИЗИРОВАНА

### **chat_read_status** ⚠️ ИСПОЛЬЗУЕТСЯ, НО ТОЛЬКО В LEGACY BACKEND

- **Использование**: Только в Express.js бэке (не используется в фронтенде)
- **Где**:
  - `backend/routes/chats.js` - трекинг прочитанных сообщений
- **Фронтенд**: ❌ НЕ ИСПОЛЬЗУЕТ (информация есть в `messages.is_read`)
- **Рекомендация**: 
  - ✅ Можно оставить (не мешает)
  - ⚠️ Или удалить, если полностью отключить legacy backend
  - Фронтенд берёт информацию из `messages.is_read` и `messages.read_at`

---

### **favorites** ⚠️ ИСПОЛЬЗУЕТСЯ, НО ФУНКЦИЯ МОЖЕТ БЫТЬ ОТКЛЮЧЕНА

- **Использование**: Система избранных компаньонов
- **Где**:
  - `useSupabase.ts` → `useFavorites()` - функция работает
  - `supabaseService.ts` - методы `addToFavorites()`, `removeFromFavorites()`, `getUserFavorites()`
- **В UI**: ❌ **НЕ ПОДКЛЮЧЕНА** - нет кнопок или функционала в интерфейсе
- **Рекомендация**:
  - ✅ Может остаться (написан код, но не используется в UI)
  - ⚠️ Или удалить таблицу + комментить код функций (если точно не нужна)
  - 🟢 Легко добавить в UI позже (код готов)

---

## 🔴 УДАЛЕНО / НЕ ИСПОЛЬЗУЕТСЯ

### **specializations** ❌ УДАЛЕНО (по AGENTS.md)
- **Статус**: УДАЛЕНО из схемы (таблица удалена)
- **Альтернатива**: Поле `bio` в `companion_applications` и `companions`
- **Правило**: НЕ СОЗДАВАТЬ СНОВА

---

## 📋 ИТОГОВАЯ ТАБЛИЦА: СТАТУС ВСЕХ ТАБЛИЦ

| Таблица | Статус | Используется | Где | Удалить? |
|---------|--------|--------------|-----|----------|
| **users** | ✅ | Везде | Профили | ❌ НЕТ |
| **companions** | ✅ | Везде | Поиск, профили | ❌ НЕТ |
| **chats** | ✅ | Везде | Чаты | ❌ НЕТ |
| **messages** | ✅ | Везде | Сообщения | ❌ НЕТ |
| **chat_encryption_keys** | ✅ | Везде | Шифрование | ❌ НЕТ |
| **reviews** | ✅ | Везде | Отзывы | ❌ НЕТ |
| **companion_chat_requests** | ✅ | Везде | Запросы | ❌ НЕТ |
| **companion_applications** | ✅ | Везде | Модерация | ❌ НЕТ |
| **companion_topics** | ✅ | Везде | Справочник | ❌ НЕТ |
| **reports** | ✅ | Админ панель | Жалобы | ❌ НЕТ |
| **chat_read_status** | ⚠️ | Только backend | Legacy SQL | ⚠️ ОПЦИОНАЛЬНО |
| **favorites** | ⚠️ | Код есть, но не в UI | Функция отключена | ⚠️ ОПЦИОНАЛЬНО |
| **specializations** | ❌ | УДАЛЕНО | — | ✅ УДАЛЕНО |

---

## 🎯 РЕКОМЕНДАЦИИ

### **Что ТОЧНО НУЖНО ОСТАВИТЬ:**
1. users
2. companions
3. chats
4. messages
5. chat_encryption_keys
6. reviews
7. companion_chat_requests
8. companion_applications
9. companion_topics
10. reports

**Все эти 10 таблиц критичны для функционала.**

---

### **Что можно рассмотреть:**

**1. `chat_read_status`** — опционально
- ✅ Оставить если используете Express backend
- ❌ Удалить если перейдёте полностью на Supabase (информация дублируется в `messages`)

**2. `favorites`** — опционально
- ✅ Оставить если планируете добавить функцию избранных в UI
- ❌ Удалить если точно не нужна (но код уже написан, просто не подключён)

---

## 📝 Действия для оптимизации

### Если хотите очистить БД:
```sql
-- Удалить неиспользуемые таблицы (если не нужны)

-- 1. Удалить chat_read_status (только если полностью на Supabase)
-- DROP TABLE public.chat_read_status CASCADE;

-- 2. Удалить favorites (только если функция не планируется)
-- DROP TABLE public.favorites CASCADE;
```

### Если хотите оставить чистый код:
1. Закомментить функции в `supabaseService.ts`:
   - `addToFavorites()`
   - `removeFromFavorites()`
   - `getUserFavorites()`

2. Закомментить `useFavorites()` в `useSupabase.ts`

---

## 🔐 Безопасность RLS-политик

Все 10 критичных таблиц имеют RLS-политики в `backend/migrations/` для защиты данных.
Таблицы `chat_read_status` и `favorites` также имеют защиту (если используются).

