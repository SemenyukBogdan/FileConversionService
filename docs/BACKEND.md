# Документація бекенду

## 1. Структура коду

```
src/
├── app/
│   └── api/jobs/
│       ├── route.ts              # POST: створення задачі
│       └── [jobId]/
│           ├── route.ts          # GET: статус, DELETE: видалення
│           └── download/route.ts  # GET: завантаження файлу
└── lib/
    ├── prisma.ts                # Клієнт БД
    ├── redis.ts                 # Підключення Redis
    ├── queue.ts                 # BullMQ черга
    ├── storage.ts               # Абстракція сховища файлів
    ├── rate-limit.ts            # Rate limiting
    └── validation.ts            # Валідація файлів

worker/
├── index.ts                     # Точка входу, логіка обробки
└── converters/
    ├── webp.ts                  # PNG/JPG → WebP (Sharp)
    ├── pdf.ts                   # Markdown → PDF (md-to-pdf)
    └── json.ts                  # CSV → JSON (csv-parse)
```

---

## 2. API Routes (Next.js)

### 2.1. POST /api/jobs

**Файл**: `src/app/api/jobs/route.ts`

**Потік виконання**:

1. **Rate limit** — `checkRateLimit(ip)` перевіряє, чи допустимо створити нову задачу для цього IP. Використовується `rate-limiter-flexible` з Redis. При перевищенні — 429.

2. **Парсинг formData** — отримуємо `file`, `targetFormat`, `params`.

3. **Валідація**:
   - Перевірка наявності file та targetFormat
   - Перевірка targetFormat ∈ {webp, pdf, json}
   - `validateFileForFormat(mimeType, targetFormat, size)`:
     - MIME має бути в whitelist для обраного формату
     - Розмір ≤ MAX_FILE_SIZE_MB

4. **Збереження файлу**:
   - `generateStorageKey(ext)` генерує ключ виду `2025-02/{uuid}.ext`
   - `storage.put(sourceStorageKey, buffer)` записує файл на диск

5. **Створення запису в БД** — `prisma.conversionJob.create()` з полями:
   - id, status=queued, sourceFilename, sourceStorageKey, sourceMime, sourceSize
   - targetFormat, params, accessToken, expiresAt

6. **Додавання в чергу** — `addJobToQueue({ jobId, sourceStorageKey, targetFormat, params })`

7. **Відповідь** — 201 з jobId, accessToken, status, expiresAt

---

### 2.2. GET /api/jobs/[jobId]

**Файл**: `src/app/api/jobs/[jobId]/route.ts`

**Логіка**:
- Отримує `token` з query-параметрів
- Шукає job по id
- `verifyToken(job, token)` — порівняння з accessToken
- Повертає: jobId, status, targetFormat, sourceFilename, createdAt, updatedAt, error

**Помилки**: 404 (job не знайдено), 403 (невірний token)

---

### 2.3. DELETE /api/jobs/[jobId]

**Файл**: `src/app/api/jobs/[jobId]/route.ts`

**Логіка**:
- Перевірка token
- Видалення файлів: `storage.delete(sourceStorageKey)`, `storage.delete(resultStorageKey)`
- Оновлення статусу на `expired`
- Відповідь 200

---

### 2.4. GET /api/jobs/[jobId]/download

**Файл**: `src/app/api/jobs/[jobId]/download/route.ts`

**Логіка**:
- Перевірка token
- Якщо status = expired → 410 Gone
- Якщо status ≠ done → 400
- Читання файлу з storage за `resultStorageKey`
- Stream відповіді з заголовками Content-Type, Content-Disposition, Content-Length

---

## 3. Бібліотеки (lib)

### 3.1. prisma.ts

Синглтон `PrismaClient` для уникнення зайвих з'єднань. У dev-режимі зберігається в `globalThis`.

### 3.2. redis.ts

Клієнт Redis (ioredis) для черги та rate limit. `maxRetriesPerRequest: null` потрібен для BullMQ.

### 3.3. queue.ts

- **conversionQueue** — BullMQ Queue з ім'ям `conversion-jobs`
- **addJobToQueue(payload)** — додає job з типом `convert`
- **DefaultJobOptions**: attempts = RETRY_COUNT + 1, removeOnComplete/Fail

**Payload**:
```ts
{
  jobId: string;
  sourceStorageKey: string;
  targetFormat: "webp" | "pdf" | "json";
  params?: Record<string, unknown>;
}
```

### 3.4. storage.ts

**Інтерфейс StorageDriver**:
- `put(key, buffer)` — зберегти
- `get(key)` — отримати (або null)
- `delete(key)` — видалити

**LocalStorageDriver**:
- Зберігає файли в `STORAGE_PATH` (env або `./storage`)
- Ключі санітизуються: заборонено `..` та абсолютні шляхи

**generateStorageKey(ext)** — повертає `{yyyy}-{mm}/{uuid}{ext}`

### 3.5. rate-limit.ts

- **RateLimiterRedis** з `rate-limiter-flexible`
- Префікс ключів: `rl:jobs`
- Ліміт: RATE_LIMIT_PER_HOUR точок за 3600 секунд
- `checkRateLimit(identifier)` — consume; при помилці (ліміт перевищено) повертає `{ allowed: false }`

### 3.6. validation.ts

**MIME_WHITELIST**:
- webp: image/png, image/jpeg
- pdf: text/markdown, text/plain
- json: text/csv, application/csv, text/plain

**validateFileForFormat(mime, format, size)** — перевірка MIME та розміру. Повертає `{ valid, error?, tooLarge? }`.

**sanitizeFilename(filename)** — заміна небажаних символів на `_`, обрізання до 255 символів.

---

## 4. Worker

**Файл**: `worker/index.ts`

### 4.1. Ініціалізація

- Завантаження env через `dotenv/config`
- Окремі інстанси Redis та Prisma (не shared з Next.js)
- `WORKER_CONCURRENCY` — скільки jobs обробляється паралельно (за замовчуванням 2)

### 4.2. Обробка job (processJob)

1. Оновлення статусу на `processing`
2. Читання файлу з storage за `sourceStorageKey`
3. Якщо файл не знайдено → status = failed, errorCode = FILE_NOT_FOUND
4. Виклик converter залежно від targetFormat:
   - **webp** → `convertToWebp(buffer)`
   - **pdf** → `convertToPdf(buffer)`
   - **json** → `convertToJson(buffer)`
5. Ключ результату: `sourceStorageKey` з заміною розширення на цільове
6. Запис результату в storage
7. Оновлення job: status = done, resultStorageKey, resultMime, resultSize
8. При помилці → status = failed, errorCode, errorMessage (до 500 символів)

### 4.3. Converters

**webp.ts** — Sharp: `sharp(buffer).webp({ quality: 80 }).toBuffer()`

**pdf.ts** — md-to-pdf: тимчасовий .md файл, виклик `mdToPdf({ path })`, повернення PDF buffer

**json.ts** — csv-parse: `parse(input, { columns: true })` → масив об'єктів → `JSON.stringify`

### 4.4. TTL Cleanup (runCleanup)

- Інтервал: кожні 5 хвилин
- Запит: jobs з `expiresAt < now` та status ∈ {done, failed}
- Для кожного: видалення source та result файлів, оновлення status на `expired`

### 4.5. BullMQ Worker

- Читає jobs з черги `conversion-jobs`
- `lockDuration` = JOB_TIMEOUT_SECONDS * 1000
- При completed/failed — логування

---

## 5. Модель даних (Prisma)

**ConversionJob**:

| Поле | Тип | Опис |
|------|-----|------|
| id | UUID | Ідентифікатор |
| createdAt | DateTime | Час створення |
| updatedAt | DateTime | Час оновлення |
| status | enum | queued, processing, done, failed, expired |
| sourceFilename | string | Оригінальна назва файлу |
| sourceStorageKey | string | Ключ у storage для вхідного файлу |
| sourceMime | string | MIME вхідного файлу |
| sourceSize | int | Розмір вхідного файлу |
| targetFormat | enum | webp, pdf, json |
| params | Json? | Опції конвертації |
| resultStorageKey | string? | Ключ результату |
| resultMime | string? | MIME результату |
| resultSize | int? | Розмір результату |
| errorCode | string? | Код помилки |
| errorMessage | string? | Текст помилки (до 500 символів) |
| accessToken | string | Токен доступу |
| expiresAt | DateTime | Час закінчення TTL |

**Індекси**: expiresAt, status, createdAt

---

## 6. Машина станів

```
queued ──▶ processing ──▶ done
                    └──▶ failed

done ──▶ expired (після TTL або DELETE)
failed ─▶ expired (після TTL або DELETE)
```

---

## 7. Безпека

- **Whitelist MIME** — дозволені лише певні типи для кожного формату
- **Рандомні ключі** — UUID у storage, без використання оригінальної назви
- **Path traversal** — заборонені `..` та абсолютні шляхи
- **Token** — доступ до job/download тільки з валідним accessToken
- **Rate limit** — обмеження кількості jobs на IP
