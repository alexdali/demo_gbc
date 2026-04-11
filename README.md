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
   и токен защиты API:

```bash
API_PROTECTION_TOKEN=strong-internal-api-token
SEND_INITIAL_BACKFILL_NOTIFICATIONS=false
```

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
npm run cleanup:supabase -- --prefix=<test-prefix>
npm run telegram:test
```

Дополнительно:

```bash
npx supabase db push --include-all
npm run import:retailcrm -- --file=data/local/<batch-file>.json
```

## Flow

1. `import:retailcrm` загружает mock-заказы из [`data/mock_orders.json`](./data/mock_orders.json) в `RetailCRM`
   или отдельный локальный cleanup-batch из `data/local/*.json`
2. `sync:orders` забирает заказы из `RetailCRM`, сохраняет их в `Supabase` и отправляет Telegram-уведомления для заказов свыше `50_000 ₸`
3. `/dashboard` показывает агрегированную аналитику из `Supabase`
4. На `/dashboard` есть кнопка ручной синхронизации. Она запускает server-side sync без логина в браузере.

`/api/sync` и `/api/telegram/test` при этом остаются закрытыми для прямых вызовов:
нужно передавать заголовок `x-api-token`, совпадающий с `API_PROTECTION_TOKEN`.

По умолчанию при первом backfill в пустую таблицу `orders` sync не рассылает пачку исторических Telegram-уведомлений. Крупные заказы просто помечаются как уже обработанные. Новые заказы после этого уведомляются штатно.

Если нужно, чтобы первая загрузка тоже отправила уведомления по historical high-value заказам один раз, включи:

```bash
SEND_INITIAL_BACKFILL_NOTIFICATIONS=true
```

Тогда:

- первый sync в пустую `orders` отправит уведомления по всем крупным заказам
- повторные sync не будут дублировать их, потому что `notified_high_value` уже станет `true`

## UTM Source Field

Внутренний стандарт mock/test JSON:

- источник заказа хранится в поле `utmSource`
- это внутренний формат проекта, а не сырой payload `RetailCRM`

В `RetailCRM` это значение записывается в одно фиксированное пользовательское поле заказа
типа `Справочник` с кодом `utm_source`.

Bootstrap в CRM:

```bash
npm run bootstrap:utm-dictionary
```

Скрипт:

- парсит все уникальные `utmSource` значения из `data/mock_orders.json`
- создаёт справочник `utm_source_dict`
- обновляет элементы справочника отдельным `edit` запросом
- создаёт поле заказа типа `Справочник` с кодом `utm_source`

После этого импорт пишет в `order.customFields.utm_source` код элемента справочника,
а sync читает это же поле обратно и сохраняет в `Supabase` как `utm_source_code`.

## Current status

- проект и структура настроены
- `Supabase` migration'ы добавлены в [`supabase/migrations`](./supabase/migrations)
- `RetailCRM` bootstrap для dictionary-backed поля `utm_source` реализован отдельным скриптом
- Telegram test-send и high-value notifications работают
- dashboard page читает реальные данные из `Supabase`
- `main` и `stage` можно разводить на отдельные `RetailCRM` и `Supabase` окружения

## Cleanup batch

Тестовые batch-файлы хранятся локально в `data/local/` и не коммитятся в git:

- это защищает `main` от случайного попадания тестовых JSON-наборов
- при этом код импорта и enrichment умеет читать `data/local/mock_orders*.json`
- для тестовых batch-файлов всегда используй отдельный `externalIdPrefix`

Импорт:

```bash
npm run import:retailcrm -- --file=data/local/<batch-file>.json
```

Очистка из `Supabase`:

```bash
npm run cleanup:supabase -- --prefix=<test-prefix>
```

Для `RetailCRM` такой batch тоже легко найти по `externalId`, потому что тестовые заказы получают вид:

```text
<prefix>-<index>-<phone>
```

Подтверждённого delete-endpoint для заказов в текущей интеграции не заведено, поэтому cleanup в `RetailCRM` нужно делать вручную по этому префиксу.

## Branch workflow

Рабочая схема для окружений:

- `main` = production
- `stage` = preview / staging
- локальные test-batch JSON живут только в `data/local/` и не коммитятся

Почему merge остаётся чистым:

- в git tracked только базовый набор [`data/mock_orders.json`](./data/mock_orders.json)
- `data/local/*.json` добавлены в `.gitignore`
- любые временные batch-файлы для проверки Telegram, cleanup или нагрузочного импорта остаются локальными
- при merge `stage -> main` в репозиторий попадают только код, README и универсальные скрипты, но не сами тестовые заказы

Рекомендуемый порядок работы:

1. Делать продуктовые изменения в `stage`
2. Для тестов создавать batch-файлы только в `data/local/`
3. Импортировать их через `npm run import:retailcrm -- --file=data/local/<batch-file>.json`
4. После проверки чистить `Supabase` по prefix через `npm run cleanup:supabase -- --prefix=<test-prefix>`
5. Мержить `stage` в `main` только после того, как `git status` чистый

Практический результат:

- `main` не загрязняется тестовыми JSON-наборами
- `Preview` и `Production` можно разводить по разным `RetailCRM` и `Supabase`
- тестовые сценарии с большими batch-импортами и Telegram-проверками не мешают production-ветке

## AI-assisted notes

Основные решения и сложности:

- для `RetailCRM` пришлось адаптировать payload под demo-instance и сделать импорт идемпотентным по `externalId`
- schema в `Supabase` заведена как SQL-файл и как CLI migration
- для `utmSource` зафиксирован единый внутренний формат JSON, а в CRM это поле пишется как dictionary-backed `customFields.utm_source`
- уведомления в Telegram защищены от дублей и не спамят при первичном backfill
- тестовые batch-файлы вынесены в `data/local/`, чтобы merge `stage -> main` не затаскивал временные JSON-наборы в production-ветку

Итоговое состояние:

- проект можно разворачивать в изолированных `Preview` и `Production` окружениях
- `RetailCRM` и `Supabase` больше не зависят от локального enrichment для источников заказов
- синхронизация, dashboard и Telegram работают end-to-end на реальных данных

## Проблемы и решения: промпт-история

- изучи `plan_spec_gbc_analytics_dashboard.md`. Сделай отдельную ветку `stage`. напиши короткий план имплементации проекта в отдельном файле.работай сабагентами; для лёгких/средних задач выбирай модели помладше, для архитектурных и тяжёлых задач самую старшую. работай сабагентами, если получится, то параллельными запусками.

*****

> Проблема и решение: в самом начале нужно было быстро зафиксировать рабочий контур проекта, секреты, git-дисциплину и ветку `stage`, иначе дальше интеграции пошли бы в грязный репозиторий и без воспроизводимой среды. Эти промпты сформировали базовую инфраструктуру работы.

*****

- установи `supabase cli`. на критичные участки кода надо сделать тесты. добавь валидации в эндпоинты, критичные функции, запросы и скрипты. и читабельные сообщения об ошибках.

*****

> Проблема и решение: проект сначала был уязвим по качеству операционного контура. Этот набор промптов зафиксировал обязательные тесты, строгие валидации, человекочитаемые ошибки и использование `supabase cli`, то есть превратил MVP из одноразового набора скриптов в управляемую интеграцию.

*****

- отдельные изолированные окружения для `prod` и `preview`; можно ли для `preview` сделать ещё один `Supabase` проект в том же аккаунте?

> Проблема и решение: стало ясно, что без изоляции `preview`/`production` и без отделения test-batches от tracked-файлов репозиторий и окружения быстро загрязняются. Эти промпты привели к решению с отдельными окружениями, локальной папкой `data/local/` и чистым merge-flow `stage -> main`.

- `повторном sync CRM часто не возвращает utm_source` словно это рандомно; может, неправильно работаешь с API?
- почему `utm`-источник на графике для этих `18` заказов `не указан`?
- похоже, через API в CRM надо сначала создать кастомный справочник для `UTM`-источников через `/api/v5/custom-fields/dictionaries/create`; изучи вопрос в доках.
- путь только через кастомный справочник и кастомное поле в заказе; изучи и внедряй.
- проверь сразу, какие ещё поля наших заказов из JSON не вписываются в оригинальную схему заказа CRM, и создай для них кастомные справочники.
- по API можно создать справочник; создай его отдельным запросом, спарь все уникальные значения и залей их отдельным запросом в новый справочник.

*****

> Проблема и решение: старая трактовка `utm_source` была архитектурно неверной. Источник заказа нельзя было надёжно round-trip'ить через CRM без словаря и кастомного поля. Именно эти промпты перевели проект на новую модель: внутренний `utmSource`, dictionary-backed поле `RetailCRM customFields.utm_source` и колонку `Supabase utm_source_code`.

*****

- почему не было уведомлений в телеге, хотя заказы появились на фронте?

*****

> Проблема и решение: политика initial backfill для Telegram была слишком жёсткой и расходилась с ожиданием production-запуска. Эти промпты привели к управляемому переключателю `SEND_INITIAL_BACKFILL_NOTIFICATIONS`, а затем к отдельной проверке продового сценария с очисткой `Supabase` и повторным импортом в CRM.

*****

- Дашборд надо сделать одноэкранным: чтобы информация помещалась в высоту экрана без скроллинга, в лаконичном бизнес-минимализме. включи сабагента-дизайнера, чтобы нормально спроектировать дизайн. Лаконичный бизнес-стиль.

*****

> Проблема и решение: первоначальный dashboard не соответствовал продуктовой задаче даже после того, как backend заработал. Эти промпты уточнили целевой desktop-layout и привели к финальной иерархии: компактные KPI, главный full-width график и вторичный ряд из двух графиков без визуального шума.

*****
