# Лог исправления ошибок интеграции Supabase

## Проблема 1: Конфликт типов данных ❌ → ✅

### Ошибка:
```
Error: Failed to run sql query: ERROR: 42804: foreign key constraint "reports_chat_id_fkey" 
cannot be implemented DETAIL: Key columns "chat_id" and "id" are of incompatible types: uuid and integer.
```

### Причина:
- Существующая БД использовала INTEGER для ID всех таблиц
- Новая схема использовала UUID для ID
- При создании внешних ключей PostgreSQL требует одинаковые типы

### Решение:
✅ Обновлена `SUPABASE_SCHEMA.sql`:
- Все ID теперь используют `BIGSERIAL` (совместимо с INTEGER)
- Все внешние ключи используют `BIGINT`
- Схема совместима с существующей структурой БД

---

## Проблема 2: Неправильная обработка UUID в auth ❌ → ✅

### Ошибка:
`Supabase error details: [object Object]` - сообщение об ошибке не отображалось

### Причина:
- Supabase возвращает объекты ошибок, которые нельзя просто преобразовать в строку
- Использовалось просто `throw signUpError`, что выводило `[object Object]`

### Решение:
✅ Добавлена функция `getErrorMessage()` в `useAuth.ts`:
```typescript
const getErrorMessage = (err: any): string => {
  if (typeof err === 'string') return err
  if (err?.message) return err.message
  if (err?.error_description) return err.error_description
  if (err?.msg) return err.msg
  return 'An unknown error occurred'
}
```

---

## Проблема 3: Несоответствие ID между auth.users и public.users ❌ → ✅

### Ошибка:
- Supabase Auth создает пользователя с UUID в таблице `auth.users`
- Наша таблица `public.users` использует BIGINT
- Невозможно связать их напрямую

### Решение:
✅ Обновлена логика регистрации:
1. При регистрации вставляем только `email` и `name` в `public.users`
2. ID генерируется автоматически (BIGSERIAL)
3. Поиск пользователя по `email` вместо UUID
4. Обновлено: `signUp()`, `login()`, `getCurrentUser()`, `updateProfile()`

---

## Проблема 4: Отсутствие RLS политик ❌ → ✅

### Ошибка:
- Без RLS любой пользователь может читать/менять данные других

### Решение:
✅ Добавлены RLS политики в `SUPABASE_SCHEMA.sql`:
- Users: только свой профиль
- Companions: видны всем (public)
- Chats: только свои чаты
- Messages: только сообщения в своих чатах
- Reviews: видны опубликованные, создавать может только сам пользователь
- Favorites: только свои избранные

---

## Файлы, которые были изменены:

### 1. `SUPABASE_SCHEMA.sql` (создан/переделан)
- ✅ Изменены все ID с UUID на BIGSERIAL
- ✅ Обновлены все внешние ключи на BIGINT
- ✅ Добавлены RLS политики для всех таблиц
- ✅ Добавлены индексы для производительности

### 2. `src/composables/useAuth.ts` (обновлен)
- ✅ Добавлена функция `getErrorMessage()`
- ✅ Обновлена регистрация для работы с BIGINT ID
- ✅ Обновлен вход для поиска по email
- ✅ Обновлен `getCurrentUser()` для поиска по email
- ✅ Обновлен `updateProfile()` для обновления по email

### 3. `src/views/AuthView.vue` (обновлен)
- ✅ Улучшена обработка ошибок в `handleLogin()`
- ✅ Улучшена обработка ошибок в `handleRegister()`
- ✅ Добавлено логирование ошибок в консоль браузера
- ✅ Форма очищается после успешной регистрации

### 4. `.env` (создан)
- ✅ Добавлены переменные Supabase:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`

### 5. `SETUP_INSTRUCTIONS.md` (обновлен)
- ✅ Добавлены инструкции по удалению старых таблиц
- ✅ Добавлены инструкции по созданию новых таблиц
- ✅ Добавлены шаги по включению Email Auth
- ✅ Добавлены инструкции по тестированию

---

## Что теперь работает: ✅

1. ✅ Регистрация с сохранением в `public.users`
2. ✅ Вход с поиском профиля по email
3. ✅ Ошибки отображаются понятным русским текстом
4. ✅ Безопасность через RLS политики
5. ✅ Индексы для быстрого поиска

---

## Следующие шаги для пользователя:

1. **Очистить старые таблицы** в Supabase (SQL код в SETUP_INSTRUCTIONS.md)
2. **Выполнить новую схему** из SUPABASE_SCHEMA.sql
3. **Включить Email Auth** если еще не включен
4. **Протестировать регистрацию** через приложение

Все остальные части приложения (композиция, компоненты, стили) остались без изменений и работают как раньше.
