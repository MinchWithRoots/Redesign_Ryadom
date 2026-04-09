# PostgreSQL Database Setup и Configuration

Полное руководство по настройке PostgreSQL базы данных для проекта Рядом.

## 📋 Содержание

- [Требования](#требования)
- [Установка PostgreSQL](#установка-postgresql)
- [Инициализация базы данных](#инициализация-базы-данных)
- [Структура базы данных](#структура-базы-данных)
- [Запуск проекта](#запуск-проекта)
- [Проверка подключения](#проверка-подключения)
- [Переменные окружения](#переменные-окружения)
- [Решение проблем](#решение-проблем)

---

## Требования

- Node.js 16+ и npm/yarn
- PostgreSQL 12 или выше
- Доступ к терминалу/командной строке

---

## Установка PostgreSQL

### Windows

1. Скачайте установщик с [postgresql.org](https://www.postgresql.org/download/windows/)
2. Запустите установщик и следуйте инструкциям
3. Запомните пароль для пользователя `postgres`
4. При установке выберите порт по умолчанию: **5432**
5. Завершите установку

### macOS (с Homebrew)

```bash
brew install postgresql@15
brew services start postgresql@15
```

### Linux (Ubuntu/Debian)

```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Docker (Рекомендуется для разработки)

```bash
docker run -d \
  --name postgres-ryadom \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -p 5432:5432 \
  postgres:15-alpine
```

---

## Инициализация базы данных

### Автоматическая инициализация (Рекомендуется)

1. **Убедитесь, что PostgreSQL запущен**

2. **Перейдите в папку backend:**
   ```bash
   cd backend
   ```

3. **Установите зависимости (если еще не установлены):**
   ```bash
   npm install
   ```

4. **Запустите скрипт инициализации:**
   ```bash
   npm run init-db
   ```

   Вывод должен быть подобен:
   ```
   Connected to PostgreSQL server
   Creating database: ryadom...
   Database created successfully
   Connected to database: ryadom
   ✓ Executed statement
   ✓ Executed statement
   ...
   ✅ Database initialization completed successfully!
   ```

### Ручная инициализация

Если автоматическая инициализация не сработала:

1. **Подключитесь к PostgreSQL (в терминале):**
   ```bash
   psql -U postgres
   ```

2. **Введите пароль** (обычно `postgres`)

3. **Выполните SQL команды вручную:**
   ```sql
   -- Создание базы данных
   CREATE DATABASE ryadom;
   
   -- Подключение к базе данных
   \c ryadom
   
   -- Скопируйте и вставьте содержимое файла backend/database.sql
   ```

4. **Выйдите из psql:**
   ```sql
   \q
   ```

---

## Структура базы данных

### Таблицы

#### `users` - Пользователи системы
```
id (SERIAL PRIMARY KEY)
name (VARCHAR 255)
email (VARCHAR 255 UNIQUE)
password (VARCHAR 255)
age (INT)
bio (TEXT)
image (VARCHAR 500)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

#### `companions` - Собеседники (терапевты, психологи)
```
id (SERIAL PRIMARY KEY)
name (VARCHAR 255)
age (INT)
specialization (VARCHAR 255)
experience (VARCHAR 50) - "Опытный специалист" или "Начинающий"
image (VARCHAR 500)
rating (DECIMAL 3,1)
reviews (INT)
bio (TEXT)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

#### `companion_topics` - Темы компетенций собеседников
```
id (SERIAL PRIMARY KEY)
companion_id (INT, FOREIGN KEY)
topic (VARCHAR 100) - "Отношения", "Карьера", "Тревожность" и т.д.
created_at (TIMESTAMP)
```

#### `chats` - Чаты между пользователем и собеседником
```
id (SERIAL PRIMARY KEY)
user_id (INT, FOREIGN KEY)
companion_id (INT, FOREIGN KEY)
status (VARCHAR 20) - "active" или "offline"
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

#### `messages` - Сообщения в чатах
```
id (SERIAL PRIMARY KEY)
chat_id (INT, FOREIGN KEY)
sender_id (INT, FOREIGN KEY)
text (TEXT)
created_at (TIMESTAMP)
```

#### `chat_read_status` - Статус прочитанности сообщений
```
id (SERIAL PRIMARY KEY)
chat_id (INT, FOREIGN KEY)
user_id (INT, FOREIGN KEY)
last_read_at (TIMESTAMP)
unread_count (INT)
```

### Индексы

Автоматически создаются для оптимизации:
- `idx_users_email` - быстрый поиск по email
- `idx_chats_user_id` - быстрый поиск чатов пользователя
- `idx_messages_chat_id` - быстрый поиск сообщений в чате
- И другие...

---

## Запуск проекта

### Запуск Backend

1. **Перейдите в папку backend:**
   ```bash
   cd backend
   ```

2. **Установите зависимости:**
   ```bash
   npm install
   ```

3. **Убедитесь, что создан файл `.env` с правильными переменными:**
   ```
   PORT=5000
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=ryadom
   DB_USER=postgres
   DB_PASSWORD=postgres
   JWT_SECRET=your_jwt_secret_key_change_this_in_production
   NODE_ENV=development
   ```

4. **Запустите сервер:**
   ```bash
   npm run dev
   ```

   Вывод:
   ```
   Server is running on port 5000
   ```

### Запуск Frontend

В отдельном терминале, в корневой папке проекта:

```bash
npm run dev
```

Откройте браузер и перейдите на `http://localhost:5173`

---

## Проверка подключения

### Через API

1. **Проверьте здоровье API:**
   ```bash
   curl http://localhost:5000/api/health
   ```

   Ответ:
   ```json
   {"status":"OK"}
   ```

2. **Получите список собеседников:**
   ```bash
   curl http://localhost:5000/api/companions
   ```

   Должен вернуться JSON с массивом собеседников.

### Через psql

```bash
# Подключитесь к базе данных
psql -U postgres -d ryadom

# Проверьте таблицы
\dt

# Выведите список собеседников
SELECT * FROM companions;

# Выйдите
\q
```

---

## Переменные окружения

### Backend (`backend/.env`)

| Переменная | Значение | Описание |
|-----------|---------|---------|
| `PORT` | `5000` | Порт для запуска backend сервера |
| `DB_HOST` | `localhost` | Хост PostgreSQL сервера |
| `DB_PORT` | `5432` | Порт PostgreSQL |
| `DB_NAME` | `ryadom` | Имя базы данных |
| `DB_USER` | `postgres` | Пользователь PostgreSQL |
| `DB_PASSWORD` | `postgres` | Пароль PostgreSQL пользователя |
| `JWT_SECRET` | `your_jwt_secret_key_change_this_in_production` | Секрет для JWT токенов (измените в production!) |
| `NODE_ENV` | `development` | Окружение (`development` или `production`) |

### Безопасность

⚠️ **ВАЖНО:** Измените значения по умолчанию:

1. **JWT_SECRET** - используйте сгенерированный сложный ключ
2. **DB_PASSWORD** - установите сильный пароль для PostgreSQL
3. В production не коммитьте `.env` файл, используйте переменные окружения сервера

---

## Решение проблем

### Проблема: "connect ECONNREFUSED 127.0.0.1:5432"

**Решение:**
- Убедитесь, что PostgreSQL запущен
- Проверьте, что порт 5432 свободен и правильно настроен
- Перезагрузите PostgreSQL:
  ```bash
  # macOS
  brew services restart postgresql@15
  
  # Linux
  sudo systemctl restart postgresql
  ```

### Проблема: "FATAL: role "postgres" does not exist"

**Решение:**
- Проверьте имя пользователя в `.env`
- Создайте пользователя:
  ```bash
  createuser -P postgres
  ```

### Проблема: "Database already exists"

**Решение:**
- Это нормально при повторном запуске `npm run init-db`
- Скрипт пропустит уже существующую базу и создаст таблицы
- Если нужно перезагрузить, удалите базу:
  ```bash
  psql -U postgres -c "DROP DATABASE IF EXISTS ryadom;"
  npm run init-db
  ```

### Проблема: Таблицы не создались

**Решение:**
1. Проверьте, что подключение работает:
   ```bash
   psql -U postgres -d ryadom
   ```

2. Вручную выполните SQL из `backend/database.sql`:
   ```bash
   psql -U postgres -d ryadom -f backend/database.sql
   ```

---

## API Endpoints

После успешной инициализации доступны:

### Authentication
- `POST /api/auth/register` - Регистрация пользователя
- `POST /api/auth/login` - Вход
- `GET /api/auth/me` - Текущий пользователь

### Companions
- `GET /api/companions` - Список собеседников
- `GET /api/companions/:id` - Одного собеседника

### Chats (требует JWT токен)
- `GET /api/chats` - Все чаты пользователя
- `POST /api/chats/create` - Создать чат
- `GET /api/chats/:chatId/messages` - Сообщения чата
- `POST /api/chats/:chatId/messages` - Отправить сообщение
- `DELETE /api/chats/:chatId` - Удалить чат
- `POST /api/chats/:chatId/end-session` - Завершить сессию

### Users (требует JWT токен)
- `GET /api/users/profile` - Профиль пользователя
- `PUT /api/users/profile` - Обновить профиль

---

## Дополнительные ресурсы

- [PostgreSQL Документация](https://www.postgresql.org/docs/)
- [Node.js pg драйвер](https://node-postgres.com/)
- [Express.js Документация](https://expressjs.com/)

---

**Дата создания:** 2024
**Версия:** 1.0
