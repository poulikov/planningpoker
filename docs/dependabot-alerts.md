# Выгрузка Dependabot alerts для Codex

Workflow `Export Dependabot alerts` читает открытые предупреждения через GitHub API
и сохраняет `dependabot-alerts.json` как артефакт запуска. Codex может запустить
workflow и скачать результат через существующую GitHub-интеграцию. Сам PAT остаётся
в GitHub Actions и не передаётся облачному окружению Codex.

## Однократная настройка

В репозитории откройте **Settings → Secrets and variables → Actions → New repository secret**.
Создайте секрет **DEPENDABOT_ALERTS_TOKEN** со значением fine-grained PAT:

- Repository access: только `poulikov/planningpoker`.
- Repository permissions: **Dependabot alerts → Read-only** (Metadata добавляется GitHub).
- При истечении срока обновите значение существующего секрета.

Workflow должен быть в основной ветке. Он запускается только вручную, не выполняет
код из PR и не требует checkout. Обычный `GITHUB_TOKEN` не заменяет этот PAT.
Артефакт содержит сведения об уязвимостях: его могут читать пользователи с доступом
к Actions репозитория; срок хранения — три дня. Токен в артефакт не записывается.

## Запуск и скачивание

Запуск из Codex или локального GitHub CLI:

```bash
gh workflow run export-dependabot-alerts.yml --repo poulikov/planningpoker --ref main
gh run list --repo poulikov/planningpoker --workflow export-dependabot-alerts.yml --limit 5
```

Выберите ID именно запущенной выгрузки и дождитесь успешного завершения:

```bash
gh run watch RUN_ID --repo poulikov/planningpoker --exit-status
gh run download RUN_ID --repo poulikov/planningpoker \
  --name dependabot-alerts --dir /tmp/planningpoker-dependabot-RUN_ID
```

Каждый запуск возвращает один JSON-массив со всех страниц API, включая `[]`, если
открытых предупреждений нет. При ошибке API workflow завершается с ошибкой и
не публикует частичную выгрузку. Проверяйте статус и дату запуска перед анализом;
сохранённый артефакт не является текущим состоянием GitHub после дальнейших изменений.

Прямое чтение alerts из Codex по-прежнему может зависеть от авторизации платформенного
прокси. Этот workflow использует PAT внутри GitHub Actions и устраняет необходимость
вручную выгружать и прикреплять JSON при каждой проверке.
