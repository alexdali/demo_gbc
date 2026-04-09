# GBC Analytics Dashboard

MVP-решение тестового задания: загрузка заказов в `RetailCRM`, синхронизация в `Supabase`, дашборд на `Next.js` и Telegram-уведомления по крупным заказам.

## Stack

- `Next.js` + `TypeScript`
- `Supabase`
- `RetailCRM API`
- `Telegram Bot API`
- `Vercel`

## Local setup

1. Скопировать `.env.example` в `.env`
2. Заполнить значения для `RetailCRM`, `Supabase`, `Telegram`
3. Выполнить SQL из [`sql/schema.sql`](./sql/schema.sql) в `Supabase`
4. Установить зависимости:

```bash
npm install
```

## Scripts

```bash
npm run dev
npm run import:retailcrm
npm run sync:orders
npm run telegram:test
```

## Flow

1. `import:retailcrm` загружает mock-заказы из [`data/mock_orders.json`](./data/mock_orders.json) в `RetailCRM`
2. `sync:orders` забирает заказы из `RetailCRM`, сохраняет их в `Supabase` и отправляет Telegram-уведомления для заказов свыше `50_000 ₸`
3. `/dashboard` показывает агрегированную аналитику из `Supabase`

## Current status

- базовый проект и структура настроены
- SQL-схема добавлена
- импорт, sync и Telegram scripts добавлены
- dashboard page подключена к `Supabase`

## AI-assisted notes

Подробное описание процесса, промптов, сложностей и финального деплоя будет дописано после завершения интеграции и проверки end-to-end сценария.
