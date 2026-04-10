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
3. Установить зависимости:

```bash
npm install
```

4. Применить схему в Supabase одним из двух способов:

```bash
npx supabase link --project-ref <project-ref> -p <db_password>
npx supabase db push --include-all
```

или выполнить SQL из [`sql/schema.sql`](./sql/schema.sql) вручную в Supabase SQL Editor.

## Scripts

```bash
npm run dev
npm run import:retailcrm
npm run sync:orders
npm run telegram:test
```

Дополнительно:

```bash
npx supabase db push --include-all
```

## Flow

1. `import:retailcrm` загружает mock-заказы из [`data/mock_orders.json`](./data/mock_orders.json) в `RetailCRM`
2. `sync:orders` забирает заказы из `RetailCRM`, сохраняет их в `Supabase` и отправляет Telegram-уведомления для заказов свыше `50_000 ₸`
3. `/dashboard` показывает агрегированную аналитику из `Supabase`

Важно: при первом backfill в пустую таблицу `orders` sync не рассылает пачку исторических Telegram-уведомлений. Крупные заказы просто помечаются как уже обработанные. Новые заказы после этого уведомляются штатно.

## Current status

- проект и структура настроены
- `Supabase` migration добавлена в [`supabase/migrations`](./supabase/migrations)
- Telegram test-send работает
- 50 заказов импортированы в `RetailCRM`
- 50 заказов синхронизированы в `Supabase`
- dashboard page читает реальные данные из `Supabase`

## AI-assisted notes

Основные решения и сложности:

- для `RetailCRM` пришлось адаптировать payload под demo-instance и сделать импорт идемпотентным по `externalId`
- schema в `Supabase` заведена как SQL-файл и как CLI migration
- для `utm_source` добавлен fallback из локального `mock_orders.json`, так как demo CRM не всегда возвращает custom fields в ожидаемом виде
- уведомления в Telegram защищены от дублей и не спамят при первичном backfill

Что осталось добить:

- smoke-test публичного Vercel deployment
- финальный README-блок с промптами, где AI застревал и как это было решено
