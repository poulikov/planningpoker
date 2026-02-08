# Planning Poker

Приложение для планирования спринтов с методом Planning Poker.

## Возможности

- ✅ Создание сессий планирования
- ✅ Приглашение участников по уникальной ссылке
- ✅ Добавление задач с описаниями
- ✅ Голосование с скрытыми оценками
- ✅ Автоматическое раскрытие голосов при завершении
- ✅ Таймер с настраиваемым значением (по умолчанию 120 сек)
- ✅ Настраиваемая шкала оценок (Fibonacci по умолчанию)
- ✅ Статистика голосований
- ✅ Реальное время (WebSocket)

## Быстрый старт

1. Запустите PostgreSQL:
   ```bash
   docker-compose up -d
   ```

2. Настройте БД (Backend):
   ```bash
   cd backend
   npm run prisma:migrate
   ```

3. Запустите Backend:
   ```bash
   cd backend
   npm run dev
   ```

4. Запустите Frontend:
   ```bash
   cd frontend
   npm run dev
   ```

5. Откройте http://localhost:5173

## Технологии

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Socket.io-client
- Zustand
- Canvas-confetti

### Backend
- Node.js + Express
- Socket.io
- Prisma ORM
- PostgreSQL
- Zod

## Лицензия

MIT
