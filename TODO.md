# TODO / Technical Debt

## Code Review: feature-end-session (PR #7)

Ниже приведены minor замечания из code review, которые можно доработать в будущем.

### Backend

#### 1. Zod validation для PATCH /api/sessions/:id/complete
**Файл:** `backend/src/routes/sessions.ts`

Добавить zod валидацию для consistency с другими endpoints:

```typescript
const completeSessionSchema = z.object({
  participantId: z.string(),
});
```

**Приоритет:** Low

---

### Frontend

#### 2. Tailwind animate classes в ConfirmModal
**Файл:** `frontend/src/components/ConfirmModal.tsx`

Классы `animate-in fade-in zoom-in duration-200` требуют плагин `tailwindcss-animate`. Проверить, подключен ли он, иначе анимации не работают.

**Приоритет:** Low

#### 3. Batch update tasks вместо individual updates
**Файл:** `frontend/src/hooks/useSocket.ts`

В `session_completed` handler происходит обновление каждой задачи по отдельности:

```typescript
tasks.forEach((task) => {
  updateTask(task.id, { ... }); // Вызывает много re-renders
});
```

Лучше использовать `setTasks` для массового обновления:

```typescript
if (tasks) {
  setTasks(tasks); // Один вызов, один re-render
}
```

**Приоритет:** Medium

#### 4. completedAt из события сервера
**Файл:** `frontend/src/store/sessionStore.ts`

В `endSession` action `completedAt` устанавливается на клиенте:

```typescript
endSession: () => set((state) => ({
  session: state.session ? { 
    ...state.session, 
    status: 'completed',
    completedAt: new Date().toISOString(), // Клиентское время
  } : null,
  // ...
})),
```

Лучше использовать значение из события `session_completed` с сервера для точности.

**Приоритет:** Low

#### 5. Average calculation для non-numeric scales
**Файл:** `frontend/src/components/SessionSummary.tsx`

Среднее значение story points считается только для numeric значений:

```typescript
const numericPoints = completedTasks
  .map((t) => parseFloat(t.storyPoints || '0'))
  .filter((n) => !isNaN(n));
```

Если используются non-numeric scale (T-shirt sizes: XS, S, M...), среднее будет `-`. Возможно, стоит скрывать эту статистику для таких шкал или показывать другую метрику.

**Приоритет:** Low

#### 6. Использование useNavigate вместо window.location
**Файл:** `frontend/src/components/SessionSummary.tsx`

```typescript
const handleStartNewSession = () => {
  window.location.href = '/'; // Полная перезагрузка
};
```

Если в проекте используется react-router, лучше использовать `useNavigate` для SPA-навигации без перезагрузки.

**Приоритет:** Low

---

## Общие улучшения (не связанные с PR)

### 7. Индекс на Session.status
**Файл:** `backend/prisma/schema.prisma`

Если планируется фильтрация по активным сессиям, стоит добавить индекс:

```prisma
model Session {
  // ...
  status String @default("active")
  
  @@index([status])
}
```

**Приоритет:** Low
