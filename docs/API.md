# Довідник API

## POST /api/jobs

Створення нової задачі конвертації.

**Запит:** `multipart/form-data`
- `file` (обов'язково): Бінарний файл для конвертації
- `targetFormat` (обов'язково): `webp` | `pdf` | `json`
- `params` (опційно): JSON-рядок з опціями конвертації

**Дозволені типи файлів за форматом:**
- webp: image/png, image/jpeg
- pdf: text/markdown, text/plain
- json: text/csv, application/csv, text/plain

**Відповідь 201:**
```json
{
  "jobId": "uuid",
  "accessToken": "token",
  "status": "queued",
  "expiresAt": "2025-02-13T12:00:00.000Z"
}
```

**Помилки:**
- 400: Відсутні поля, невалідний формат, невалідний тип файлу
- 413: Файл занадто великий (макс. 25MB)
- 429: Перевищено ліміт запитів

---

## GET /api/jobs/{jobId}

Отримання статусу задачі. Потрібен параметр `token` у запиті.

**Запит:** `GET /api/jobs/{jobId}?token=...`

**Відповідь 200:**
```json
{
  "jobId": "uuid",
  "status": "queued|processing|done|failed|expired",
  "targetFormat": "webp",
  "sourceFilename": "image.png",
  "createdAt": "2025-02-12T12:00:00.000Z",
  "updatedAt": "2025-02-12T12:00:05.000Z",
  "error": null
}
```

При помилці конвертації `error` містить `{ "code": "...", "message": "..." }`.

**Помилки:**
- 403: Невірний token
- 404: Задачу не знайдено

---

## GET /api/jobs/{jobId}/download

Завантаження конвертованого файлу. Потрібен параметр `token` у запиті.

**Запит:** `GET /api/jobs/{jobId}/download?token=...`

**Відповідь 200:** Потік файлу з заголовком `Content-Disposition: attachment`

**Помилки:**
- 400: Файл не готовий (статус не done)
- 403: Невірний token
- 404: Задачу не знайдено
- 410: Термін дії файлу закінчився (TTL)

---

## DELETE /api/jobs/{jobId}

Дострокове видалення задачі та файлів. Потрібен параметр `token` у запиті.

**Запит:** `DELETE /api/jobs/{jobId}?token=...`

**Відповідь 200:**
```json
{
  "message": "Job deleted"
}
```

**Помилки:**
- 403: Невірний token
- 404: Задачу не знайдено
