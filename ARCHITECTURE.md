# Architecture: Feature-Sliced Design (FSD)

Структура та же, что в daily-mail: [Feature-Sliced Design](https://feature-sliced.design/), слои `app-layer/` и `pages-layer/`
переименованы, чтобы не конфликтовать с App Router.

## Layers (top to bottom)

| Layer | Folder | Здесь | Что в нём |
|-------|--------|-------|-----------|
| **app** (routing) | `src/app/` | `layout.tsx`, `page.tsx`, `api/bookings/**` | Только маршрутизация Next. Route handlers — тонкие адаптеры к `src/server` |
| **app-layer** | `src/app-layer/` | `Providers`, `globals.css`, шрифты | Инициализация приложения, дизайн-токены |
| **pages** | `src/pages-layer/` | `booking` | Композиция страницы. Хранит только состояние «что выбрано/редактируется» |
| **widgets** | `src/widgets/` | `day-schedule`, `booking-panel` | Самостоятельные блоки UI со своими состояниями (загрузка/ошибка/пусто) |
| **features** | `src/features/` | `select-date`, `save-booking`, `delete-booking`, `simulate-race` | Пользовательские действия |
| **entities** | `src/entities/` | `booking` | Бизнес-сущность: доменная модель, API, базовый UI |
| **shared** | `src/shared/` | `api`, `config`, `lib`, `hooks`, `ui` | Инфраструктура без бизнес-смысла |

Вне FSD — **`src/server/`**: mock-бэкенд. Это «чужая система», с которой клиент общается только по HTTP.

## The Rules

Проверяются автоматически: `pnpm lint:arch` (`scripts/check-architecture.mjs`).

1. **Слой импортирует только из слоёв ниже.** `features → entities` ✅, `entities → features` ❌.
2. **Слайсы одного слоя не знают друг о друге.** `save-booking` и `delete-booking` объединяет виджет `booking-panel`, а не прямой импорт.
3. **Только public API.** Снаружи слайса — `@/entities/booking`, а не `@/entities/booking/api/booking-dto`.
   В `shared` — по сегментам: `@/shared/api`, `@/shared/lib`.
4. **`src/server` доступен только route handlers** (`src/app/api/**`).
5. **Server-safe модули без фреймворков**: `shared/lib`, `shared/config`, `entities/*/model`, `src/server`
   не импортируют React / React Query. Их загружают route handlers.

## Где живёт бизнес-логика

Главное в этом проекте — разделение ответственности по слоям:

```
                 ┌──────────────────────────────────────────────┐
  pages-layer    │ BookingPage — дата, что редактируется         │  композиция
                 └───────────────┬──────────────────────────────┘
  widgets        DaySchedule (таймлайн + состояния)   BookingPanel (форма | просмотр | приглашение)
                                 │
  features       select-date   save-booking            delete-booking
                               ├ model/form-schema   ← схема формы = доменные правила
                               └ model/use-booking-submit ← ответ сервера → состояние формы
                                 │
  entities/booking  model/  ← ДОМЕН: правила, расписание, типы. Чистый TS, без React и сети
                    api/    ← эндпоинты, DTO ↔ домен, ошибки → BookingRequestError, хуки Query
                    lib/    ← формулировки нарушений, форматирование
                    ui/     ← BookingBlock
                                 │
  shared            api/ (fetch, ApiError, QueryClient, keys)  lib/ (время, часовой пояс)  ui/ (кит)

  src/server        service (тот же validateBookingDraft) → repository (interface) → in-memory
```

- **Домен** (`entities/booking/model`) отвечает на вопрос «можно ли так?» и возвращает **коды** нарушений
  (`OVERLAP`, `TOO_LONG`…), а не строки. «Сейчас» и список броней передаются аргументами, поэтому функции
  детерминированы и легко тестируются.
- **API-сегмент** сущности — единственное место, которое знает URL'ы и форму DTO. Сырой `ApiError` дальше
  не уходит: он превращается в размеченный союз `BookingRequestError` (`conflict | validation | not-found | locked | network | unknown`).
- **Фича** решает, *что делать* с ответом: 422 раскладывается по полям, 409/404/сеть показываются баннером,
  ввод не сбрасывается. Хуки мутаций обновляют расписание *до* того, как форма реагирует на ошибку.
- **UI** ничего не валидирует сам — он рисует то, что сказал домен.

### Почему у `entities/booking` два входа

`@/entities/booking` — полный public API (с хуками React Query). `@/entities/booking/model` — доменное ядро
без фреймворков, для `src/server`. Это единственное разрешённое исключение из правила 3,
см. [ADR-0002](docs/adr/0002-shared-domain-rules.md).

## Design system

Токены из `docs/DESIGN.md` (Flying Papers) лежат в `src/app-layer/styles/globals.css` (`@theme` Tailwind v4).
Отступления ради доступности:

- Мелкий текст на фиолетовой «сцене» (`#8584bd`) не проходит AA, поэтому интерактив и текст стоят на
  блоках Lilac Shadow (`#61609a`) или Bone White. Жёлтый и кремовый текст на Lilac дают ≥4.5:1.
- Шрифты-замены: ObviouslyVariable → **Unbounded** (широкий геометрический, есть кириллица),
  Degular → Inter, Bergen Mono → JetBrains Mono.
- Шрифтов размером 184–341px нет: это рабочий интерфейс, а не постер. Заголовок даты — `clamp(2.5rem, 7vw, 5.5rem)`.

## Path aliases

```ts
"@/*"             → src/*
"@/app-layer/*"   → src/app-layer/*
"@/pages-layer/*" → src/pages-layer/*
"@/widgets/*"     → src/widgets/*
"@/features/*"    → src/features/*
"@/entities/*"    → src/entities/*
"@/shared/*"      → src/shared/*
"@/server/*"      → src/server/*
```
