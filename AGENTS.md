# Planning Poker - AGENTS.md

AI coding agent reference for the Planning Poker application. This document provides essential information for understanding and working with the codebase.

## Project Overview

Planning Poker is a real-time web application for agile sprint planning. It allows teams to estimate story points using the Planning Poker methodology with hidden votes, timers, and collaborative voting sessions.

**Primary Language:** Russian (documentation, comments)  
**Code Language:** English (TypeScript/JavaScript)

## ⚠️ CRITICAL RULES FOR AI AGENTS

### 1. Git Workflow (MUST FOLLOW)
- **NEVER** commit directly to `main`/`master` branch
- **ALWAYS** create a feature branch: `git checkout -b feature/description`
- **ALWAYS** commit to feature branch, push, and create Pull Request
- **NEVER** merge your own PR - wait for approval

### 2. Before Starting Work
- Check which branch you're on: `git branch`
- If on `main`, create and switch to feature branch first
- Read relevant code sections before making changes

## Architecture

### High-Level Structure
```
planningpoker/
├── frontend/          # React 18 + TypeScript SPA (Vite)
├── backend/           # Node.js + Express API + WebSocket server
├── docker-compose.yml # PostgreSQL database setup (optional)
├── .env.example       # Environment configuration template
└── workdoc/           # Debug reports and documentation (not in git)
```

### Runtime Architecture
- **Frontend:** Vite dev server on port 5173, proxied API calls to backend
- **Backend:** Express HTTP server on port 3001 with Socket.io WebSocket
- **Database:** SQLite by default (Prisma), PostgreSQL optional via docker-compose
- **Communication:** REST API for CRUD, Socket.io for real-time updates

## Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework with hooks |
| TypeScript | Type safety |
| Vite | Build tool and dev server |
| Tailwind CSS | Utility-first styling |
| Zustand | State management |
| Socket.io-client | Real-time communication |
| Lucide React | Icon library |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js + Express | HTTP server |
| Socket.io | WebSocket real-time events |
| Prisma ORM | Database access |
| SQLite (default) | Data persistence |
| PostgreSQL (optional) | Alternative database |
| Zod | Input validation |
| tsx | TypeScript execution in dev |

## Build and Development Commands

### Prerequisites
```bash
# Install dependencies
npm install

# Start database (optional - for PostgreSQL)
docker-compose up -d

# Setup environment
cp .env.example .env
```

### Backend (`cd backend`)
```bash
npm install                # Install dependencies
npm run dev              # Start dev server with hot reload (tsx watch)
npm run build            # Compile TypeScript to dist/
npm run start            # Run compiled production build
npm run prisma:migrate   # Run database migrations
npm run prisma:generate  # Generate Prisma client
npm run prisma:studio    # Open Prisma Studio GUI
npm run lint             # ESLint check
```

### Frontend (`cd frontend`)
```bash
npm install      # Install dependencies
npm run dev      # Start Vite dev server (port 5173)
npm run build    # Production build to dist/
npm run preview  # Preview production build
npm run lint     # ESLint check
```

## Code Organization

### Frontend Structure (`frontend/src/`)
```
src/
├── App.tsx                 # Main app component, session routing logic
├── main.tsx               # React entry point
├── index.css              # Tailwind imports + custom utilities
├── types/index.ts         # TypeScript interfaces (Session, Task, Vote, etc.)
├── lib/
│   ├── config.ts          # Environment-based configuration
│   ├── socket.ts          # Socket.io client singleton
│   └── utils.ts           # Utility functions (cn helper)
├── store/
│   └── sessionStore.ts    # Zustand store for global state
├── hooks/
│   └── useSocket.ts       # WebSocket event handlers and emitters
└── components/            # React components
    ├── Button.tsx
    ├── Card.tsx
    ├── CreateSessionForm.tsx
    ├── Input.tsx
    ├── ParticipantsList.tsx
    ├── SessionLobby.tsx
    ├── TaskForm.tsx
    ├── TaskList.tsx
    ├── Timer.tsx
    ├── VoteCard.tsx
    └── VotingArea.tsx
```

### Backend Structure (`backend/src/`)
```
src/
├── index.ts               # Server entry point, Express + Socket.io setup
├── routes/
│   ├── sessions.ts        # REST: POST /, GET /:id
│   ├── tasks.ts           # REST: POST /, GET /:sessionId, PATCH /:id
│   └── votes.ts           # REST: GET /task/:taskId
├── services/              # (empty - business logic in websocket handlers)
├── utils/
│   └── logger.ts          # Simple console logger with timestamps
└── websocket/
    └── handlers.ts        # All Socket.io event handlers
```

### Database Schema (`backend/prisma/schema.prisma`)
```
Session
├── id (UUID, PK)
├── name
├── votingTimeout (default: 120s)
├── storyPointsScale (JSON string array)
├── currentTaskId
└── relations: tasks[], participants[]

Task
├── id (UUID, PK)
├── sessionId (FK)
├── title
├── description
├── status (pending|voting|completed)
├── storyPoints
└── relation: votes[]

Participant
├── id (UUID, PK)
├── name
├── sessionId (FK)
├── joinedAt
├── lastSeenAt
└── unique: [sessionId, name]

Vote
├── id (UUID, PK)
├── taskId (FK)
├── participantId (FK)
├── value
├── votedAt
└── unique: [taskId, participantId]
```

## Key Patterns and Conventions

### State Management (Zustand)
- Single store in `sessionStore.ts` holds all app state
- Actions are defined inline in the store
- Components use `useSessionStore(selector)` for subscriptions
- `useSessionStore.getState()` used outside React for current values
- **Note:** `setVotingState` supports both direct values and callback functions: `(votingState | (prev) => newState)`
- **Deduplication:** Store has guards in `addParticipant` and `setParticipants` to prevent duplicate entries

### Socket.io Pattern
- Singleton socket instance in `lib/socket.ts` (lazy initialization)
- `useSocket.ts` hook manages all event listeners in one place
- **CRITICAL:** Socket listeners use empty dependency array `[]` to prevent duplicate registrations
- Use `useSessionStore.getState()` inside handlers to get current values without dependencies
- **WARNING:** Never duplicate event handlers in the same useEffect (causes double event processing)

### WebSocket Events
**Client → Server:**
- `join_session` - Add participant to session
- `create_task` - Create new task
- `start_voting` - Begin voting on task (triggers timer)
- `submit_vote` - Cast a vote
- `reveal_votes` - Force vote reveal
- `reset_voting` - Clear votes and restart
- `complete_task` - Finalize with story points

**Server → Client:**
- `participant_joined` / `participant_left` / `participants_updated`
- `task_added`
- `voting_started` / `timer_updated` / `votes_revealed` / `voting_reset`
- `vote_received`
- `task_completed`

### Styling Conventions
- Tailwind CSS for all styling
- **Glassmorphism design pattern:**
  - Background: `bg-white/95 backdrop-blur-sm`
  - Rounded: `rounded-xl`
  - Shadow: `shadow-lg`
  - Border: `border border-white/20`
- Custom utility classes in `index.css`: `.card`, `.input`, `.btn-*`
- `cn()` helper from `lib/utils.ts` for conditional class merging (clsx + tailwind-merge)
- Color palette: primary (blue/indigo), semantic colors for states (green=success, amber=warning, red=danger)
- Status badges with icons from Lucide React

### URL Structure
Session URLs use query parameters:
```
/?session=<UUID>&name=<PARTICIPANT_NAME>
```

## Testing and Debugging

### Documentation Files
- `workdoc/` - Directory containing debug reports (excluded from git)
  - Debug logs and investigation reports
  - Bug fix documentation
  - Testing scenarios

### Debug Logging
Extensive console.log statements for debugging:
- `[App] Render:` - Component state on each render
- `[useSocket] *` - All WebSocket events
- `[VotingArea] *` - Voting component lifecycle
- `[Store] *` - State mutations
- `[WS] *` - Backend WebSocket logs

### Known Issues and Fixes
1. **Task Duplication:** Fixed by removing `participants.length` dependency from socket useEffect
2. **UI Disappearing:** Fixed by adding `hasJoined` flag to prevent unintended lobby redirects
3. **Duplicate Prevention:** Store has `addTask` guard that skips if task ID already exists
4. **WebSocket Handler Duplication:** CRITICAL - All socket handlers were registered twice causing double event processing
5. **VotingState Structure Bug:** Fixed nested votingState in votes_revealed handler (was creating state.votingState.votingState)
6. **Participant Duplication:** Fixed by adding deduplication in setParticipants and addParticipant store methods
7. **Syntax Error:** Fixed hanging code after votes_revealed handler in useSocket.ts

### Manual Testing Steps
1. Create session at http://localhost:5173
2. URL auto-updates with session ID and name
3. Add tasks (should appear once, not duplicate)
4. Join from second browser/incognito
5. Select task → Start Voting → Vote → Reveal
6. Complete task with final estimation

## Environment Configuration

### Required Variables (`.env`)
```bash
# Backend (SQLite by default)
DATABASE_URL="file:./dev.db"
# For PostgreSQL (optional):
# DATABASE_URL="postgresql://planningpoker:planningpoker@localhost:5432/planningpoker?schema=public"
PORT=3001
NODE_ENV=development

# Frontend
VITE_API_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3001
```

### Default Values
All config has sensible defaults for localhost development if env vars are missing.

## ESLint Configuration

### Frontend
- Uses `@typescript-eslint` parser and plugins
- Strict mode enabled in tsconfig
- Unused locals/parameters are errors

### Backend (`.eslintrc.js`)
```javascript
{
  parser: '@typescript-eslint/parser',
  extends: ['eslint:recommended', '@typescript-eslint/recommended'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
  }
}
```

## Security Considerations

- No authentication system - anyone with session URL can join
- Participant names must be unique per session (enforced at DB level)
- CORS configured for localhost development only
- No rate limiting implemented
- Input validation via Zod schemas

## Development Workflow

### Git Workflow (CRITICAL)

**NEVER commit directly to `main` or `master` branch!**

All changes must follow Feature Branch workflow:

1. **Create a feature branch** from `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature-description-of-changes
   # or
   git checkout -b fix-description-of-bug
   # or
   git checkout -b refactor-description
   ```

2. **Make changes** and commit to your branch:
   ```bash
   git add .
   git commit -m "Descriptive commit message"
   ```

3. **Push branch** to remote:
   ```bash
   git push origin feature/description-of-changes
   ```

4. **Create Pull Request** and wait for approval

5. **Merge ONLY after approval** - never merge your own PR without review

### Branch Naming Conventions
- `feature-login-page` - New functionality
- `fix-timer-bug` - Bug fixes
- `refactor-socket-handlers` - Code refactoring
- `update-readme` - Documentation updates
- `style-voting-area` - UI/styling changes

### Local Development Steps

1. Install dependencies: `npm install` in both frontend and backend
2. Start database (optional): `docker-compose up -d`
3. Setup backend: `cd backend && npm run prisma:migrate`
4. Start backend: `cd backend && npm run dev`
5. Start frontend: `cd frontend && npm run dev`
6. Open http://localhost:5173

## Important Implementation Details

### WebSocket Handler Location
All real-time logic is in `backend/src/websocket/handlers.ts`, not in services. The handlers directly use Prisma client passed from `index.ts`.

### Timer Implementation
Voting timers are server-side NodeJS timeouts stored in a Map keyed by taskId. They emit `timer_updated` events each second.

### Vote Auto-Reveal
Votes automatically reveal when:
- Timer reaches 0, OR
- All participants have voted (`votes.length === participants.length`)

### Session Recovery
On page refresh, `App.tsx` fetches session data via REST API and rejoins via WebSocket automatically using URL parameters.

### Database Choice
- **SQLite:** Default, file-based, no additional setup required
- **PostgreSQL:** Optional, requires `docker-compose up -d` and updating DATABASE_URL
