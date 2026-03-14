# File Conversion Service

Курсовий проект для конвертації файлів через веб-інтерфейс.
Користувач завантажує файл, вибирає формат, а обробка йде у фоновому режимі.

Deployed app URL: https://file-conversion-service.bsemeniuk.pp.ua/

## Що реалізовано

- реєстрація і вхід користувача;
- публічні та приватні сторінки;
- динамічний маршрут для перегляду конкретної задачі;
- конвертація файлів через чергу;
- перевірка статусу та завантаження результату.

## Технології

- Next.js (App Router) + TypeScript
- Prisma + MySQL
- Redis + BullMQ
- Docker Compose

## Запуск через Docker

```bash
docker compose up --build
```

Після запуску відкрити: `http://localhost:3000`

## Сторінки

- `/` - головна (публічна)
- `/about` - сторінка про проєкт (публічна)
- `/login` - вхід
- `/register` - реєстрація
- `/dashboard` - кабінет користувача (потрібна авторизація)
- `/jobs/[jobId]` - динамічна сторінка задачі

## Скріншоти

### Рисунок 1 - Головна сторінка
![Головна сторінка](docs/screenshotes/home.png)

### Рисунок 2 - Сторінка "Про проєкт"
![Сторінка про проєкт](docs/screenshotes/about.png)

### Рисунок 3 - Сторінка входу
![Сторінка входу](docs/screenshotes/login.png)

### Рисунок 4 - Сторінка реєстрації
![Сторінка реєстрації](docs/screenshotes/registration.png)

### Рисунок 5 - Dashboard (сторінка після входу)
![Dashboard](docs/screenshotes/dashboard.png)

### Рисунок 6 - Завантаження файлу
![Завантаження файлу](docs/screenshotes/uploaded%20file.png)

### Рисунок 7 - Успішна конвертація
![Успішна конвертація](docs/screenshotes/successfully%20converted%20file.png)

## Основні API-запити

У проєкті API використовується для створення задачі конвертації, перевірки її статусу та завантаження готового файлу.

- `POST /api/jobs` - створити нову задачу конвертації
- `GET /api/jobs/{jobId}?token=...` - отримати поточний статус задачі
- `GET /api/jobs/{jobId}/download?token=...` - завантажити результат після успішної обробки
- `DELETE /api/jobs/{jobId}?token=...` - видалити задачу та пов'язані файли

## Додаткова документація

- `docs/PROJECT.md`
- `docs/BACKEND.md`
- `docs/API.md`
