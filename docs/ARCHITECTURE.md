# Архітектура проекту File Conversion Service

## Огляд системи

Сервіс асинхронної конвертації файлів складається з двох основних процесів та інфраструктури:

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Browser   │────▶│  Next.js (web)   │────▶│  MySQL + Redis  │
└─────────────┘     └────────┬─────────┘     └────────▲────────┘
                             │                         │
                             │ add job                 │ poll / read
                             ▼                         │
                      ┌──────────────┐                 │
                      │ Черга Redis  │                 │
                      │  (BullMQ)    │                 │
                      └──────┬───────┘                 │
                             │ consume                 │
                             ▼                         │
                      ┌──────────────┐                 │
                      │   Worker     │─────────────────┘
                      │  (Node.js)   │   update status
                      └──────┬───────┘
                             │
                             ▼
                      ┌──────────────┐
                      │  Сховище     │
                      │ (файлова с.) │
                      └──────────────┘
```

## Компоненти

### 1. Web (Next.js)

- **Роль**: приймає HTTP-запити, валідує дані, створює задачі, віддає результати
- **Порт**: 3000
- **Стек**: Next.js 16 App Router, TypeScript

### 2. Worker (Node.js)

- **Роль**: читає задачі з черги Redis, виконує конвертацію, оновлює статус у БД
- **Процес**: окремий Node.js-процес (`npm run worker`)
- **Стек**: BullMQ, Sharp, md-to-pdf, csv-parse

### 3. MySQL 8

- **Роль**: зберігання інформації про задачі (ConversionJob)
- **Порт**: 3306

### 4. Redis

- **Роль**: черга задач (BullMQ) та rate limiting
- **Порт**: 6379

### 5. Storage (файлова система)

- **Роль**: зберігання вхідних та вихідних файлів
- **Структура**: `storage/{yyyy-mm}/{uuid}.ext`

## Потік даних

### Створення задачі (POST /api/jobs)

1. Клієнт надсилає multipart/form-data (file, targetFormat)
2. Rate limit: перевірка IP у Redis
3. Валідація: MIME-type, розмір, targetFormat
4. Файл зберігається в storage під рандомним ключем
5. В БД створюється запис ConversionJob зі статусом `queued`
6. В Redis через BullMQ додається job з payload
7. Клієнту повертається jobId, accessToken, expiresAt

### Обробка задачі (Worker)

1. Worker отримує job з BullMQ
2. Статус оновлюється на `processing`
3. Файл читається з storage
4. Викликається відповідний converter (webp/pdf/json)
5. Результат зберігається в storage
6. Статус оновлюється на `done` (або `failed` при помилці)

### Отримання статусу (GET /api/jobs/{id})

1. Перевірка token
2. Читання ConversionJob з MySQL
3. Повернення статусу, помилки (якщо є)

### Завантаження результату (GET /api/jobs/{id}/download)

1. Перевірка token
2. Перевірка статусу `done`
3. Читання файлу з storage
4. Stream відповіді з Content-Disposition

### TTL Cleanup (Worker, кожні 5 хв)

1. Пошук jobs з `expiresAt < now` та статусом done/failed
2. Видалення файлів з storage
3. Оновлення статусу на `expired`
