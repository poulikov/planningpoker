# Planning Poker

Real-time web application for agile sprint planning using the Planning Poker methodology. Hidden votes, timers, and collaborative voting sessions.

## Features

### Core
- ✅ Create planning sessions
- ✅ Invite participants via unique link
- ✅ Real-time updates via WebSocket
- ✅ Automatic participant deduplication

### Tasks & Estimation
- ✅ Add tasks with **Markdown** descriptions
- ✅ Live Markdown preview with syntax highlighting
- ✅ Hidden votes until reveal
- ✅ Automatic vote reveal when timer ends or all participants voted
- ✅ Divergence warning when estimates vary significantly
- ✅ Restart voting for discussion

### Session Management
- ✅ **Role-based access:** Session author and regular participants
- ✅ Only author can create tasks, start and end voting
- ✅ Participants can only vote
- ✅ **End session** with final results summary
- ✅ View statistics: estimated tasks count, average story points

### Settings
- ✅ Configurable timer (default: 120 seconds)
- ✅ Multiple voting scales:
  - Standard Fibonacci (0, 1, 2, 3, 5, 8, 13, 21, ?, ☕)
  - Extended Fibonacci
  - Modified Fibonacci (SAFe)
  - T-Shirt Sizes (XS, S, M, L, XL, XXL)
  - Powers of 2
  - Confidence Level
- ✅ Real-time voting statistics

## Quick Start

### Prerequisites

- Node.js 18+
- Docker (optional, for PostgreSQL)

### Setup

1. **Clone the repository and install dependencies:**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env if needed
   ```

3. **Start database (optional):**
   ```bash
   # For PostgreSQL (SQLite is used by default)
   docker-compose up -d
   ```

4. **Apply database migrations:**
   ```bash
   cd backend
   npm run prisma:migrate
   npm run prisma:generate
   ```

5. **Start servers:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

6. **Open** http://localhost:5173

## How to Use

### 1. Create a Session
- Open the application
- Enter session name
- Select voting scale (optional)
- Click "Create Session"
- URL will automatically update with session ID
- **You become the session author** with management rights

### 2. Invite Participants
- Copy the link from the page header
- Share the link with your team
- Each participant opens the link and enters their name
- Participants automatically join the session

### 3. Add Tasks (Author only)
- Enter task title
- Add description with **Markdown** support:
  - Headers (`# Header`)
  - Lists (`- item`)
  - **Bold**, *italic*, ~~strikethrough~~
  - Code (`` `inline` `` and blocks)
  - Links (`[text](url)`)
  - Tables
- Use "Write" and "Preview" tabs for preview
- Click "Add Task"

### 4. Voting
- Author selects a task and clicks "Start Voting"
- All participants see voting cards
- Each participant selects their estimate
- Votes are hidden until reveal
- Voting automatically ends when:
  - All participants have voted, **or**
  - Timer runs out

### 5. Handle Results (Author only)
- Results are displayed automatically
- If estimates **diverge** - a warning is shown
- Options:
  - Select final estimate and complete the task
  - Restart voting for discussion

### 6. End Session (Author only)
- Click "End Session" button in the page header
- Confirm action in the modal
- **All participants** will see the summary screen:
  - List of all tasks with final estimates
  - Statistics: estimated tasks count
  - Average estimate (for numeric scales)
- Click "Start New Session" to create a new session

### Permissions

| Action | Session Author | Participant |
|--------|---------------|-------------|
| Create tasks | ✅ | ❌ |
| Edit descriptions | ✅ | ❌ |
| Start voting | ✅ | ❌ |
| Restart voting | ✅ | ❌ |
| Select final estimate | ✅ | ❌ |
| End session | ✅ | ❌ |
| Vote | ✅ | ✅ |
| View results | ✅ | ✅ |

## Environment Variables

### Backend (.env)
```env
DATABASE_URL="file:./dev.db"                    # SQLite (default)
# DATABASE_URL="postgresql://..."               # PostgreSQL (optional)
PORT=3001
NODE_ENV=development
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3001
```

## Project Structure

```
planningpoker/
├── backend/              # Node.js + Express + Socket.io
│   ├── prisma/          # Database schema
│   └── src/
│       ├── routes/      # REST API
│       ├── websocket/   # WebSocket handlers
│       └── utils/       # Utilities
├── frontend/            # React + TypeScript + Vite
│   └── src/
│       ├── components/  # React components
│       ├── hooks/       # Custom hooks
│       ├── store/       # Zustand store
│       └── lib/         # Utilities and config
├── docker-compose.yml   # PostgreSQL container
└── .env.example         # Environment template
```

## Scripts

### Backend
```bash
npm run dev              # Development mode with hot reload
npm run build            # TypeScript build
npm run start            # Production server
npm run prisma:migrate   # Apply migrations
npm run prisma:studio    # Database GUI
npm run lint             # ESLint check
```

### Frontend
```bash
npm run dev              # Vite dev server (port 5173)
npm run build            # Production build
npm run preview          # Preview production build
npm run lint             # ESLint check
```

## Recent Changes

### New Features
- 📝 Markdown support in task descriptions with preview
- 🏁 Session completion with final results summary
- 👑 Improved role-based access: only author can manage session
- ⚠️ Divergence warning during voting

### Bug Fixes & Improvements
- ✅ Fixed duplicate WebSocket handlers
- ✅ Fixed voting state structure
- ✅ Fixed participant duplication in lists
- ✅ Improved UI with consistent glassmorphism design
- 🔒 Fixed security vulnerabilities (minimatch, ajv)

## Technologies

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Socket.io-client
- Zustand (state management)
- Lucide React (icons)
- **react-markdown** + remark-gfm + rehype-sanitize (Markdown support)

### Backend
- Node.js + Express
- Socket.io (WebSocket)
- Prisma ORM
- SQLite / PostgreSQL
- Zod (validation)

## License

MIT
