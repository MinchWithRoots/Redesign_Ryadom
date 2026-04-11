# 🔍 Диагностика ошибок Supabase

Если вы видите ошибку **"Error fetching reviews: [object Object]"**, следуйте этому руководству.

## 📋 Чек-лист

### 1️⃣ Проверить переменные окружения

Откройте **browser DevTools** (F12) и выполните в консоли:

```javascript
console.log('URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('Key:', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)
```

**Результат должен быть:**
```
URL: https://xxxxxx.supabase.co
Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (очень длинная строка)
```

Если видишь `undefined` - переходи к **Шаг 2**.

### 2️⃣ Проверить файл `.env.local`

1. Открой файл `.env.local` в корне проекта
2. Убедись, что он содержит:
```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_ANON_KEY_HERE
```

**⚠️ Важно:** 
- Не должно быть пробелов вокруг `=`
- URL должен быть полным (начинаться с `https://`)
- Ключ должен быть длинной строкой (обычно 200+ символов)

### 3️⃣ Получить правильные учетные данные из Supabase

1. Откройте https://app.supabase.com
2. Выберите ваш проект
3. Слева нажмите **Settings** (⚙️)
4. Выберите вкладку **API**
5. Скопируйте:
   - **Project URL** → вставьте в `VITE_SUPABASE_URL`
   - **anon public** ключ → вставьте в `VITE_SUPABASE_PUBLISHABLE_KEY`

**Пример:**
```env
VITE_SUPABASE_URL=https://fisamcoxqplzqzfimwfx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4️⃣ Перезагрузить браузер

После обновления `.env.local`:

1. **Перезагрузи dev сервер** (Ctrl+C в терминале, потом `pnpm run dev`)
2. **Перезагрузи браузер** (F5)
3. **Очисти кэш браузера** (Ctrl+Shift+Delete)

### 5️⃣ Проверить логи в консоли

Откройте **DevTools** (F12) → **Console** и посмотрите логи:

**Если видишь:**
```
🔌 Supabase Configuration:
url: ✅ Configured
key: ✅ Configured
```
→ Конфигурация правильная, проблема в другом.

**Если видишь:**
```
🔌 Supabase Configuration:
url: ❌ Missing
key: ❌ Missing
```
→ Вернись к **Шаг 2** и проверь `.env.local`.

---

## 🛠️ Решение конкретных ошибок

### ❌ "Error fetching reviews: [object Object]"

**Возможные причины:**

#### A) Supabase не сконфигурирован
**Решение:** Следуй **Шаг 1-4** выше

#### B) Таблица `reviews` не создана
**Решение:**
1. Откойте Supabase панель → **SQL Editor**
2. Создайте новый запрос
3. Скопируйте содержимое `SUPABASE_SCHEMA.sql`
4. Нажмите **Run**

#### C) RLS политика блокирует доступ
**Решение:**
В Supabase → **Table Editor** → выберите таблицу `reviews` → **RLS Policies**

Убедись, что есть политика для SELECT:
```
CREATE POLICY "Users can view published reviews" ON reviews
  FOR SELECT USING (published = true OR user_id = auth.uid());
```

Если политики не созданы, скопируй их из `SUPABASE_SCHEMA.sql`.

---

## ✅ Проверка Supabase подключения

### Способ 1: Через консоль браузера

Откройте **DevTools** (F12) → **Console** и выполните:

```javascript
import { supabase } from '/src/utils/supabase.ts'

// Проверить подключение
const { data, error } = await supabase.from('reviews').select('count').limit(1)
console.log('Результат:', { data, error })
```

**Ожидаемый результат:**
```
Результат: { data: [...], error: null }
```

**Если ошибка:**
```
Результат: { data: null, error: {message: "...", code: "..."} }
```
Проверь RLS политики.

### Способ 2: Через Supabase панель

1. Открой Supabase → **Table Editor**
2. Нажми на таблицу `reviews`
3. Если таблица пуста или не существует - создай через SQL Editor

---

## 🚀 Полный цикл исправления (на всякий случай)

Если ничего не работает, выполни все по порядку:

```bash
# 1. Убедитесь, что .env.local содержит правильные значения
cat .env.local

# 2. Очистите кэш npm (если необходимо)
rm -rf node_modules/.vite

# 3. Перезагрузите dev сервер
pkill -f "vite"  # или Ctrl+C
pnpm run dev

# 4. Перезагрузите браузер
# F5 в браузере

# 5. Очистите кэш браузера
# Ctrl+Shift+Delete в браузере
```

---

## 📝 Полезные команды для отладки

### Посмотреть конфигурацию Supabase в консоли

```javascript
// В browser DevTools Console
import { supabase } from '/src/utils/supabase.ts'
console.log(supabase.supabaseUrl)
console.log(supabase.supabaseKey.substring(0, 20) + '...') // Скрыть ключ
```

### Проверить список таблиц

```javascript
import { supabase } from '/src/utils/supabase.ts'
const { data, error } = await supabase
  .from('information_schema.tables')
  .select('table_name')
  .eq('table_schema', 'public')

console.log('Таблицы:', data)
```

### Проверить RLS статус

Откройте Supabase → **Table Editor** → выберите таблицу → посмотрите **RLS Policies**

---

## 💡 Советы

1. **Не коммитьте `.env.local`** - это файл с приватными данными!
2. **Используйте только anon public ключ** - это безопасно благодаря RLS
3. **RLS должна быть включена** на всех таблицах с чувствительными данными
4. **Проверьте браузерную консоль** (F12) перед тем, как сообщать об ошибке

---

Если проблема остается, проверьте:
1. ✅ `.env.local` с правильными значениями
2. ✅ Таблицы созданы в Supabase
3. ✅ RLS политики установлены
4. ✅ Dev сервер перезагружен
5. ✅ Браузер перезагружен (F5)
