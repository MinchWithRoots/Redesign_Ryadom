# Деплой на GitHub Pages (100% БЕСПЛАТНО)

## ✅ Что тебе нужно

- GitHub аккаунт
- Репозиторий (уже есть)
- 5 минут времени

---

## 📋 Пошаговая инструкция

### Шаг 1: Создай GitHub Actions workflow

1. В корне проекта создай папку (если нет): `.github/workflows/`
2. Создай файл: `.github/workflows/deploy.yml`
3. Скопируй содержимое ниже в этот файл:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main
      - ai_main*
  pull_request:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### Шаг 2: Включи GitHub Pages в репозитории

1. Перейди на **Settings** репозитория
2. Слева найди **Pages**
3. В **"Build and deployment"** выбери:
   - Source: **GitHub Actions** (или **Deploy from a branch** → **gh-pages** если первого нет)
4. Сохрани

### Шаг 3: Сделай коммит и пуш

```bash
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Pages deployment workflow"
git push
```

### Шаг 4: Дождись завершения

1. Перейди в **Actions** в репозитории
2. Жди пока workflow завершится (обычно 2-3 минуты)
3. Когда будет ✅, твой сайт будет доступен по адресу:
   ```
   https://USERNAME.github.io/REPO_NAME/
   ```
   Пример: `https://minchwithroots.github.io/Redesign_Ryadom/`

---

## 🚀 Автоматический деплой

Теперь каждый раз когда ты сделаешь `git push` в main ветку:
1. GitHub автоматически запустит сборку
2. Соберет Vue приложение в статику
3. Развернет на GitHub Pages
4. Сайт обновится за 2-3 минуты

---

## ⚙️ Если нужны переменные окружения

GitHub Pages не может хранить приватные переменные. Если тебе нужны env переменные (вроде Supabase URL):

1. Перейди в **Settings** → **Secrets and variables** → **Actions**
2. Добавь переменные (только публичные!)
3. Обнови workflow:

```yaml
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}
```

---

## ❌ Если что-то не работает

**Ошибка: "404 Not Found"**
- Проверь адрес: `username.github.io/repo-name/` (с слэшом в конце важен!)
- Убедись что workflow выполнился (зелёная галочка в Actions)

**Ошибка: "Build failed"**
- Посмотри логи в Actions вкладке
- Убедись что `npm run build` работает локально

**Сайт не обновляется**
- Очисти кэш браузера (Ctrl+Shift+Delete)
- Можешь заново открыть в приватном окне

---

## 📝 Локальная сборка (для тестирования)

Хочешь проверить что всё работает перед пушем?

```bash
# Собрать
npm run build

# Тестировать локально
npm run preview
```

Будет доступно на `http://localhost:4173`

---

## ✨ Готово!

Сайт полностью бесплатно на GitHub Pages, автоматический деплой, без VPN в России 🎉
