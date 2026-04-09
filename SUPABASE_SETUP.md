# 🔌 Интеграция Supabase (PostgreSQL онлайн)

## Что такое Supabase?

**Supabase** — это облачная PostgreSQL БД с веб-интерфейсом. Ты можешь видеть и редактировать БД прямо в браузере, без установки на компьютер!

## 🚀 Шаг 1: Создание Supabase проекта (5 минут)

### 1.1 Регистрация
1. Перейди на https://supabase.com
2. Нажми **"Start your project"** → **"Sign Up"**
3. Выбери способ входа (Google, GitHub или Email)

### 1.2 Создание проекта
1. Нажми **"New project"**
2. Выбери **организацию** (создай, если нет)
3. Заполни форму:
   - **Project Name**: `ryadom` (или любое имя)
   - **Database Password**: Придумай пароль (запомни!)
   - **Region**: Europe (EU-West-1, ближайший к тебе)
4. Нажми **"Create new project"**

Ожидай 2-3 минуты, пока БД создастся...

## 🔑 Шаг 2: Получение ключей доступа

После создания проекта:

1. Перейди в **Settings** (⚙️) → **API**
2. Найди раздел **Project URL** и **API key**
3. Скопируй:
   - **Project URL** (например: `https://fisamcoxqplzqzfimwfx.supabase.co`)
   - **Публичный ключ** (anon/public key)

## 📝 Шаг 3: Добавление ключей в проект

Открой файл `.env.local` в корне проекта и замени значения:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_ANON_KEY_HERE

# Локальный backend (если используешь)
VITE_API_URL=http://localhost:5000/api
```

**Пример:**
```env
VITE_SUPABASE_URL=https://fisamcoxqplzqzfimwfx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

VITE_API_URL=http://localhost:5000/api
```

## 💾 Шаг 4: Создание таблиц БД

### Способ 1: Через SQL Editor в Supabase (Рекомендуется)

1. В Supabase перейди на **SQL Editor** (кнопка слева)
2. Нажми **New Query**
3. Скопируй весь код из файла `backend/database.sql`
4. Вставь в SQL Editor
5. Нажми **Run** (или Ctrl+Enter)

Готово! Все таблицы созданы.

### Способ 2: Через pgAdmin (если используешь локальный PostgreSQL)

```bash
cd backend
npm run init-db
```

## 🔍 Просмотр БД онлайн

### В Supabase:
1. Перейди на вкладку **Table Editor** в левом меню
2. Видишь список всех таблиц:
   - `users` — пользователи
   - `companions` — спутники
   - `chats` — переписки
   - `messages` — сообщения
   - И другие...

3. Кликай на таблицу, чтобы увидеть данные
4. Можешь добавлять, редактировать, удалять записи прямо там

### SQL запросы:
1. Перейди на **SQL Editor**
2. Пиши SQL запросы и выполняй их

**Пример:**
```sql
SELECT * FROM users;
SELECT * FROM companions WHERE specialization = 'Психолог';
```

## 💻 Использование в Vue компонентах

### 1. Импорт composable:

```vue
<script setup>
import { useCompanions } from '@/composables/useSupabase'

const { companions, loading, fetchCompanions } = useCompanions()

onMounted(() => {
  fetchCompanions()
})
</script>

<template>
  <div v-if="loading">Loading...</div>
  <div v-else>
    <div v-for="companion in companions" :key="companion.id">
      <h3>{{ companion.name }}</h3>
      <p>{{ companion.specialization }}</p>
    </div>
  </div>
</template>
```

### 2. Доступные composables:

#### `useCompanions()`
```javascript
const { companions, loading, error, fetchCompanions, searchCompanions } = useCompanions()

// Получить всех спутников
await fetchCompanions()

// Поиск по названию
await searchCompanions('психолог')
```

#### `useChat()`
```javascript
const { chats, messages, loading, fetchUserChats, fetchChatMessages, sendMessage, createNewChat } = useChat()

// Получить чаты пользователя
await fetchUserChats(userId)

// Получить сообщения чата
await fetchChatMessages(chatId)

// Отправить сообщение
await sendMessage(chatId, senderId, 'Привет!')

// Создать новый чат
await createNewChat(userId, companionId)
```

#### `useFavorites()`
```javascript
const { favorites, loading, fetchFavorites, addFavorite, removeFavorite } = useFavorites()

// Получить избранное
await fetchFavorites(userId)

// Добавить в избранное
await addFavorite(userId, companionId)

// Удалить из избранного
await removeFavorite(userId, companionId)
```

## 📋 Дополнительные сервис-функции

В файле `src/services/supabaseService.ts` есть функции для всех операций:

```javascript
import * as supabaseService from '@/services/supabaseService'

// Пользователи
await supabaseService.getUserProfile(userId)
await supabaseService.updateUserProfile(userId, { name: 'Новое имя' })

// Спутники
await supabaseService.getCompanionById(companionId)

// Отзывы
await supabaseService.addReview(companionId, userId, 5, 'Заголовок', 'Комментарий')
await supabaseService.getCompanionReviews(companionId)
```

## ✅ Параллельное использование (Backend + Supabase)

**Локальный Backend:**
- Используется для аутентификации (вход/регистрация)
- Запускается: `npm run dev` в папке `backend/`

**Supabase:**
- Используется для чтения данных (companions, chats, messages)
- Видна онлайн в браузере: https://app.supabase.com

**Какой использовать?**
- **API для auth**: используй локальный backend (`/api/auth/login`)
- **API для данных**: используй Supabase через сервисы

## 🐛 Troubleshooting

### "Supabase credentials not found"
- Добавь переменные в `.env.local`
- Перезагрузи страницу (F5)

### "Error: Failed to connect to Supabase"
- Проверь, правильно ли скопировал URL и ключ
- Убедись, что проект активен в Supabase

### Таблицы не появляются
- Перезагрузи Table Editor (F5)
- Проверь, что код из database.sql выполнился без ошибок

## 📚 Полезные ссылки

- Supabase Docs: https://supabase.com/docs
- JavaScript Client: https://supabase.com/docs/reference/javascript
- PostgreSQL Docs: https://www.postgresql.org/docs/

---

**Готово!** Теперь у тебя есть:
- ✅ Облачная БД (Supabase)
- ✅ Просмотр через браузер (без установки)
- ✅ Интеграция с фронтендом
- ✅ Локальный backend для аутентификации
