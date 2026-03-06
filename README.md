# File Conversion Service

Веб-сервіс асинхронної конвертації файлів на базі Next.js 16. Підтримує конвертацію PNG/JPG → WebP, Markdown → PDF та CSV → JSON за допомогою черги Redis (BullMQ) та очищення за TTL.

**Документація**: [docs/PROJECT.md](docs/PROJECT.md) — повний опис проекту; [docs/BACKEND.md](docs/BACKEND.md) — детальна документація бекенду.

## Можливості

- **Асинхронна обробка**: Задачі ставляться в чергу та обробляються у фоні. Інтерфейс не блокується.
- **Типи конвертації**: PNG/JPG → WebP, Markdown → PDF, CSV → JSON
- **Відстеження статусу**: `queued` → `processing` → `done` / `failed` / `expired`
- **Очищення за TTL**: Файли автоматично видаляються після закінчення терміну життя (за замовчуванням 24 години)
- **Обмеження запитів**: Налаштовувані ліміти на IP (за замовчуванням 10 задач/год)
- **Безпека**: Whitelist MIME-типів, випадкові ключі зберігання, доступ за токеном

## Технологічний стек

- Next.js 16 (App Router) + TypeScript
- Prisma ORM + MySQL 8
- Redis (черга BullMQ + rate limiting)
- Sharp (конвертація зображень), md-to-pdf (Markdown → PDF), csv-parse (CSV → JSON)

## Швидкий старт (Docker Compose)

```bash
docker compose up -d
```

Потім відкрийте http://localhost:3000

Сервіси:
- **web**: Додаток Next.js на порту 3000
- **worker**: Обробник фонових задач
- **db**: MySQL 8 на порту 3306
- **redis**: Redis на порту 6379

## Локальна розробка

### Передумови

- Node.js 20+
- MySQL 8
- Redis

### Налаштування

1. Скопіюйте `.env.example` у `.env` та налаштуйте:

```env
DATABASE_URL="mysql://user:password@localhost:3306/conversion"
REDIS_URL="redis://localhost:6379"
STORAGE_DRIVER=local
STORAGE_PATH=./storage
MAX_FILE_SIZE_MB=25
TTL_HOURS=24
RATE_LIMIT_PER_HOUR=10
```

2. Створіть базу даних та виконайте міграції:

```bash
mysql -u root -p -e "CREATE DATABASE conversion;"
npx prisma migrate deploy
```

3. Встановіть залежності та запустіть:

```bash
npm install
npm run dev        # Термінал 1: Next.js
npm run worker     # Термінал 2: Worker
```

## API

### POST /api/jobs

Створення задачі конвертації. `multipart/form-data`:
- `file`: бінарний файл
- `targetFormat`: `webp` | `pdf` | `json`
- `params`: JSON-рядок (опційно)

**Відповідь 201**:
```json
{
  "jobId": "uuid",
  "accessToken": "token",
  "status": "queued",
  "expiresAt": "ISO_DATE"
}
```

### GET /api/jobs/{jobId}?token=...

Отримання статусу задачі.

**Відповідь 200**:
```json
{
  "jobId": "uuid",
  "status": "processing",
  "targetFormat": "webp",
  "createdAt": "ISO_DATE",
  "updatedAt": "ISO_DATE",
  "error": null
}
```

### GET /api/jobs/{jobId}/download?token=...

Завантаження файлу результату. Повертає потік файлу при `status=done`. Повертає 410 при закінченні терміну.

### DELETE /api/jobs/{jobId}?token=...

Дострокове видалення задачі та файлів.

## Змінні середовища

| Змінна | За замовчуванням | Опис |
|--------|------------------|------|
| DATABASE_URL | — | Рядок підключення MySQL |
| REDIS_URL | redis://localhost:6379 | Підключення Redis |
| STORAGE_DRIVER | local | `local` або `s3` |
| STORAGE_PATH | ./storage | Шлях до локального сховища |
| MAX_FILE_SIZE_MB | 25 | Макс. розмір завантаження |
| TTL_HOURS | 24 | TTL файлів у годинах |
| RATE_LIMIT_PER_HOUR | 10 | Задач на IP за годину |
| WORKER_CONCURRENCY | 2 | Паралельних задач на worker |
| JOB_TIMEOUT_SECONDS | 120 | Таймаут обробки задачі |
| RETRY_COUNT | 2 | Повторні спроби при помилці |

## Приймальні критерії

1. Задача створюється з `jobId` + `token`
2. Статус коректно оновлюється (queued → processing → done/failed)
3. Завантаження тільки при `done`
4. Валідації (тип, розмір) працюють
5. Rate limit повертає 429 при перевищенні
6. TTL очищає файли та робить завантаження доступним поверненням 410
7. Невдалі задачі логуються з помилкою

## Тест-кейси

| Кейс | Очікувано |
|------|-----------|
| PNG → WebP | Валідний файл, `image/webp` |
| MD → PDF | PDF відкривається коректно |
| CSV → JSON | Валідний JSON |
| Невалідний тип | 400 |
| Завеликий файл | 413 |
| Невірний token | 403 |
| Після TTL | Завантаження 410 |
| Помилка конвертації | статус `failed` |
