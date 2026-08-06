# Prompt2Plan Frontend

Next.js App Router UI with React Three Fiber 3D viewer.

## Stack

- Next.js 15 + TypeScript
- Tailwind CSS (dark glassmorphism)
- Zustand
- Framer Motion
- React Three Fiber + Drei (shadows, orbit controls, environment)

## Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local   # or use existing .env.local
npm run dev
```

Open http://localhost:3000

Ensure the backend is running on port 8000:

```bash
cd ../backend
.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

## Env

```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```
