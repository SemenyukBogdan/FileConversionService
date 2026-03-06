# PlantUML діаграми проекту File Conversion Service

У цій папці — вихідний код діаграм у форматі PlantUML (`.puml`). Їх можна відкрити та згенерувати зображення в будь-якому інструменті, що підтримує PlantUML.

## Файли

| Файл | Опис |
|------|------|
| `class-diagram.puml` | Діаграма класів: модель ConversionJob, enum JobStatus, TargetFormat |
| `state-diagram.puml` | Діаграма станів: життєвий цикл задачі (queued → processing → done/failed → expired) |
| `sequence-create-job.puml` | Діаграма послідовності: створення задачі (POST /api/jobs) та обробка Worker |
| `sequence-status-download.puml` | Діаграма послідовності: polling статусу та завантаження файлу |
| `component-diagram.puml` | Діаграма компонентів: Web, Worker, MySQL, Redis, Storage |
| `deployment-diagram.puml` | Діаграма розгортання: Docker-контейнери та volumes |

## Як згенерувати зображення

1. **Онлайн**: [plantuml.com/plantuml](https://www.plantuml.com/plantuml) — вставити вміст `.puml`, отримати PNG/SVG.

2. **VS Code**: розширення "PlantUML" (jebbs.plantuml), потім `Alt+D` для попереднього перегляду.

3. **CLI** (потрібна встановлена Java та plantuml.jar):
   ```bash
   java -jar plantuml.jar docs/uml/*.puml
   ```
   Згенерує `.png` поруч із кожним файлом.

4. **npm**: `npx node-plantuml docs/uml/class-diagram.puml -o class-diagram.png`
