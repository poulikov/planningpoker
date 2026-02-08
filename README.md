# Planning Poker

Приложение для планирования спринтов с методом Planning Poker. Реальное время, скрытые оценки, автоматическое раскрытие результатов.

## Возможности

- ✅ Создание сессий планирования
- ✅ Приглашение участников по уникальной ссылке
- ✅ Добавление задач с описаниями
- ✅ Голосование со скрытыми оценками
- ✅ Автоматическое раскрытие голосов при завершении
- ✅ Таймер с настраиваемым значением (по умолчанию 120 сек)
- ✅ Настраиваемая шкала оценок (Fibonacci по умолчанию)
- ✅ Статистика голосований в реальном времени
- ✅ Реальное время через WebSocket
- ✅ Автоматическая дедупликация участников

## Быстрый старт

### Предварительные требования

- Node.js 18+
- Docker (опционально, для PostgreSQL)

### Запуск

1. **Клонируйте репозиторий и установите зависимости:**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

2. **Настройте окружение:**
   ```bash
   cp .env.example .env
   # Отредактируйте .env при необходимости
   ```

3. **Запустите базу данных (опционально):**
   ```bash
   # Для PostgreSQL (по умолчанию используется SQLite)
   docker-compose up -d
   ```

4. **Примените миграции базы данных:**
   ```bash
   cd backend
   npm run prisma:migrate
   npm run prisma:generate
   ```

5. **Запустите серверы:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

6. **Откройте** http://localhost:5173

## Как использовать

1. **Создание сессии:**
   - Откройте приложение
   - Введите название сессии
   - Нажмите "Create Session"
   - URL автоматически обновится с ID сессии

2. **Приглашение участников:**
   - Скопируйте ссылку из шапки страницы
   - Поделитесь ссылкой с командой
   - Каждый участник должен открыть ссылку и ввести своё имя

3. **Добавление задач:**
   - Введите название задачи
   - Опционально добавьте описание
   - Нажмите "Add Task"

4. **Голосование:**
   - Выберите задачу из списка
   - Нажмите "Start Voting"
   - Выберите оценку из предложенных карточек
   - Дождитесь, пока все проголосуют или закончится таймер
   - Результаты отобразятся автоматически

5. **Завершение задачи:**
   - После раскрытия голосов выберите финальную оценку
   - Задача будет помечена как завершённая

## Переменные окружения

### Backend (.env)
```env
DATABASE_URL="file:./dev.db"                    # SQLite (по умолчанию)
# DATABASE_URL="postgresql://..."               # PostgreSQL (опционально)
PORT=3001
NODE_ENV=development
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3001
```

## Структура проекта

```
planningpoker/
├── backend/              # Node.js + Express + Socket.io
│   ├── prisma/          # Схема базы данных
│   └── src/
│       ├── routes/      # REST API
│       ├── websocket/   # WebSocket обработчики
│       └── utils/       # Утилиты
├── frontend/            # React + TypeScript + Vite
│   └── src/
│       ├── components/  # React компоненты
│       ├── hooks/       # Кастомные хуки
│       ├── store/       # Zustand store
│       └── lib/         # Утилиты и конфигурация
├── docker-compose.yml   # PostgreSQL контейнер
└── .env.example         # Шаблон переменных окружения
```

## Скрипты

### Backend
```bash
npm run dev              # Режим разработки с hot reload
npm run build            # Сборка TypeScript
npm run start            # Запуск production сборки
npm run prisma:migrate   # Применить миграции
npm run prisma:studio    # GUI для базы данных
npm run lint             # Проверка ESLint
```

### Frontend
```bash
npm run dev              # Vite dev сервер (port 5173)
npm run build            # Production сборка
npm run preview          # Предпросмотр сборки
npm run lint             # Проверка ESLint
```

## Исправленные проблемы

- ✅ Исправлено дублирование WebSocket обработчиков
- ✅ Исправлена структура состояния голосования
- ✅ Исправлено дублирование участников в списке
- ✅ Улучшен UI с консистентным дизайном (glassmorphism)

## Технологии

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Socket.io-client
- Zustand (state management)
- Lucide React (icons)

### Backend
- Node.js + Express
- Socket.io (WebSocket)
- Prisma ORM
- SQLite / PostgreSQL
- Zod (validation)

## Лицензия

MIT
