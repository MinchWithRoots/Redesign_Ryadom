# Supabase Storage Setup Guide

## Проблема
Ошибка: `StorageApiError: new row violates row-level security policy`

Эта ошибка происходит при загрузке изображений в бакет `avatars` из-за RLS политик.

## Решение

### Вариант 1: Через Supabase Dashboard (Быстро)

1. **Перейдите в Supabase Dashboard** → ваш проект
2. **Storage** → **Buckets** в боковом меню
3. Если бакета `avatars` нет, создайте его:
   - Нажмите "New bucket"
   - Имя: `avatars`
   - **Важно**: Отметьте "Public bucket" (галочка)
   - Нажмите "Create bucket"

4. Если бакет уже существует:
   - Откройте бакет `avatars`
   - Нажмите на иконку настроек (три точки)
   - **Сделайте его Public** если он Private

5. **Политики RLS** (если нужно настроить дополнительно):
   - Перейдите в **Authentication** → **Policies**
   - Найдите таблицу `storage.objects`
   - Удалите все старые политики для бакета `avatars`
   - Добавьте новую политику:
     - **Операция**: INSERT
     - **Role**: authenticated
     - **Выражение**: `bucket_id = 'avatars'`

### Вариант 2: Через SQL (Более надежно)

1. **Перейдите в SQL Editor** в Supabase Dashboard
2. **Скопируйте и выполните** содержимое файла `backend/migrations/012-setup-storage-bucket.sql`

### Вариант 3: Отключить RLS временно (Для разработки)

Если у вас есть доступ к SQL и вы в режиме разработки:

```sql
-- Отключить RLS на storage.objects для разработки
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

## Проверка

После настройки:
1. Откройте приложение
2. Перейдите на страницу Setup Profile
3. Загрузите изображение профиля
4. Должна появиться URL изображения в консоли без ошибок

## Важно для Production

Для production НЕ отключайте RLS полностью. Используйте вариант 1 или 2 с правильными политиками безопасности.
