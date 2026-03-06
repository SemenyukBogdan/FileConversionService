# File Conversion Service — Повна документація проекту

## Зміст

1. [Опис проекту](#1-опис-проекту)
2. [Технологічний стек](#2-технологічний-стек)
3. [Структура проекту](#3-структура-проекту)
4. [Запуск і налаштування](#4-запуск-і-налаштування)
5. [Життєвий цикл задачі](#5-життєвий-цикл-задачі)
6. [Посилання на детальну документацію](#6-посилання-на-детальну-документацію)

---

## 1. Опис проекту

**File Conversion Service** — веб-сервіс для асинхронної конвертації файлів. Користувач завантажує файл, обирає цільовий формат, отримує миттєву відповідь з посиланням на задачу, а обробка відбувається у фоні.

### Підтримувані конвертації

| Вхідний формат | Цільовий формат | Бібліотека |
|----------------|-----------------|------------|
| PNG, JPG        | WebP            | Sharp      |
| Markdown (.md) | PDF             | md-to-pdf (Puppeteer) |
| CSV            | JSON            | csv-parse  |

### Ключові можливості

- **Асинхронність** — UI не блокується, задача створюється миттєво
- **Черга** — Redis + BullMQ для надійної обробки
- **TTL** — автоматичне видалення файлів після закінчення часу життя
- **Rate limiting** — обмеження кількості задач на IP
- **Токен доступу** — доступ до статусу та завантаження тільки з валідним токеном

---

## 2. Технологічний стек

| Компонент | Технологія |
|-----------|------------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS |
| Backend API | Next.js API Routes |
| База даних | MySQL 8, Prisma ORM |
| Черга | Redis, BullMQ |
| Worker | Node.js, BullMQ Worker |
| Конвертація | Sharp, md-to-pdf, csv-parse |
| Rate limiting | rate-limiter-flexible |
| Storage | Локальна файлова система |

---

## 3. Структура проекту

```
next js/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Головна: форма завантаження
│   │   ├── jobs/[jobId]/page.tsx    # Сторінка статусу задачі
│   │   ├── layout.tsx
│   │   └── api/jobs/
│   │       ├── route.ts             # POST: створення задачі
│   │       └── [jobId]/
│   │           ├── route.ts         # GET: статус, DELETE: видалення
│   │           └── download/route.ts
│   └── lib/
│       ├── prisma.ts
│       ├── redis.ts
│       ├── queue.ts
│       ├── storage.ts
│       ├── rate-limit.ts
│       └── validation.ts
├── worker/
│   ├── index.ts                     # Worker + cleanup
│   └── converters/
│       ├── webp.ts
│       ├── pdf.ts
│       └── json.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── docs/
│   ├── ARCHITECTURE.md              # Архітектура системи
│   ├── BACKEND.md                   # Детальна документація бекенду
│   ├── API.md                       # Опис API endpoints
│   └── PROJECT.md                   # Цей файл
├── docker-compose.yml
├── Dockerfile
└── package.json
```

---

## 4. Запуск і налаштування

### Docker Compose (рекомендовано)

```bash
docker compose up -d
```

Запускає: MySQL, Redis, Next.js (web), Worker.

Додаткових кроків не потрібно — міграції виконуються автоматично при старті web.

### Локальна розробка

1. MySQL 8 та Redis мають бути запущені
2. `cp .env.example .env` та налаштувати `DATABASE_URL`
3. `npx prisma migrate deploy`
4. `npm run dev` (термінал 1) та `npm run worker` (термінал 2)

### Змінні середовища

| Змінна | За замовчуванням | Опис |
|--------|------------------|------|
| DATABASE_URL | — | Рядок підключення MySQL |
| REDIS_URL | redis://localhost:6379 | Підключення Redis |
| STORAGE_DRIVER | local | local / s3 |
| STORAGE_PATH | ./storage | Шлях до сховища |
| MAX_FILE_SIZE_MB | 25 | Макс. розмір файлу (MB) |
| TTL_HOURS | 24 | Час життя файлів (години) |
| RATE_LIMIT_PER_HOUR | 10 | Макс. задач на IP за годину |
| WORKER_CONCURRENCY | 2 | Паралельних задач у worker |
| JOB_TIMEOUT_SECONDS | 120 | Таймаут обробки однієї задачі |
| RETRY_COUNT | 2 | Повторні спроби при помилці |

---

## 5. Життєвий цикл задачі

```
1. Користувач завантажує файл на /
   │
2. POST /api/jobs
   ├── Rate limit (Redis)
   ├── Валідація (MIME, розмір)
   ├── Збереження файлу (storage)
   ├── Запис у MySQL (status: queued)
   └── Додавання в чергу Redis
   │
3. Користувач редіректиться на /jobs/{id}?token=...
   │
4. Worker бере задачу з черги
   ├── status → processing
   ├── Конвертація (Sharp / md-to-pdf / csv-parse)
   ├── Збереження результату
   └── status → done (або failed)
   │
5. Polling (GET /api/jobs/{id}) кожні 2.5 сек
   │
6. При status=done — кнопка Download
   GET /api/jobs/{id}/download → stream файлу
   │
7. Після TTL або DELETE
   ├── Worker cleanup видаляє файли
   └── status → expired
```

---

## 6. Посилання на детальну документацію

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — архітектура, компоненти, потік даних
- **[BACKEND.md](./BACKEND.md)** — опис бекенду, API routes, lib, worker, модель даних
- **[API.md](./API.md)** — специфікація API endpoints
