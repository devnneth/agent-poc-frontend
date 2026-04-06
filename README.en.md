# AI Agent POC Project (Frontend)

[한국어](./README.md) | English

This project is the frontend for the AI Agent POC project. 

Built on React and Vite, it provides an interface to chat with an AI agent and manage schedules, to-dos, and memos.

Backend Project: https://github.com/devnneth/agent-poc-backend

## 1. Development Environment Setup Guide

### 1.1. Node.js Setup

#### 1.1.1 Installing Node.js and Dependencies

> Runtime: Node.js 20+

```shell
# 1. Install dependencies
$ npm install
```

### 1.2. Environment Setup

#### 1.2.1 Project Environment Configuration

```shell
$ cp .env.example .env # Copy
```

> After copying, modify the `.env` file

```shell
# Supabase Settings
VITE_SUPABASE_URL=""              # Supabase Project URL
VITE_SUPABASE_ANON_KEY=""         # Supabase Anon Key

# Backend Integration
VITE_BACKEND_URL="http://localhost:8000"
VITE_ENABLE_BACKEND_HEALTH_CHECK=true

# Agent/API Settings
VITE_API_BASE_URL="http://localhost:8000/api/v1"

# UI/UX Settings
VITE_TOAST_DURATION=3000
VITE_HIDE_GOOGLE_LOGIN=false      # Whether to hide the Google login button
```

## 2. Main Directory Structure (/)

```shell
.
├── public                  
├── src                     # Source Code 🔥
├── tests                   # Test Files
├── index.html              # App Entry Point HTML
├── .env.example            # Environment Variable Example File
├── eslint.config.js        # ESLint Configuration
├── postcss.config.js       # PostCSS Configuration
├── tailwind.config.js      # CSS Framework Configuration
├── vite.config.js          # Vite Configuration File
└── package.json            # Project Config and Dependencies
```

### 3. App Structure (src/)

```shell
.
├── api                     # External Service Adapters
│   ├── agent               # Agent API (Chat, Session Management)
│   ├── google              # Google Calendar API
│   └── supabase            # Supabase Auth/DB Client
│
├── app                     # Common Application Layout and Setup
├── assets                  # Static Assets (Images, Fonts, etc.)
│
├── components              # Common UI Components (Shadcn UI, etc.)
│   └── ui                  # Atomic UI Components
│
├── features                # Domain-specific Feature Layer 🔥
│   ├── auth                # Authentication (Login, Signup)
│   ├── calendar            # Schedule Management (Calendar View)
│   ├── chat                # AI Agent Chat
│   ├── knowledge           # Knowledge Management (Knowledge Base for RAG)
│   ├── memos               # Memo Management
│   ├── settings            # User Settings
│   ├── todos               # Todo Management
│   └── workspace           # Workspace Layout
│
├── hooks                   # Custom Hooks (Business Logic, State Management)
├── lib                     # Common Utilities and Library Setup (i18n, utils)
├── locales                 # Internationalization (i18next json)
├── repositories            # Data Persistence Layer (LocalStorage, Supabase)
├── resources               # Static Resources & Templates
│
├── services                # Business Logic Layer
└── main.jsx                # Frontend Entry Point
```

## 4. API Integration

The frontend communicates with the backend Agent API. Following the backend API specification change, the frontend now sends structured payloads as-is, while formatting and embedding model selection are handled by the backend.

### 4.1 Agent Chat (Streaming)

- **Endpoint**: `POST /api/v1/agent/chat`
- **Request Body**:
```json
{
  "user_id": "string",
  "session_id": "string",
  "message": "string",
  "calendar_id": "string | null",
  "language": "string",
  "minutes_offset": 540,
  "google_calendar_token": "string" 
}
```

## 5. Execution Scripts

### 5.1 Local Execution

```shell
$ npm run dev               # Run development server (Vite)
$ npm run build             # Production build
$ npm run lint              # Run code linting
$ npm run test              # Run tests (Vitest)
$ npm run validate          # Sequential validation of lint, test, and build
```
