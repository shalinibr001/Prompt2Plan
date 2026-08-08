# Prompt2Plan

Convert natural-language prompts into interactive **3D floor plans**.

Built strictly against the MVP roadmap (Phases 1 → 5).

## MVP phases

| Phase | Goal | Status |
|-------|------|--------|
| 1 | Hardcoded 3D rooms (bedroom, kitchen, hall) + OrbitControls | ✅ |
| 2 | Manual “number of rooms” input (no AI) | ✅ |
| 3 | FastAPI + Ollama `POST /generate-layout` | ✅ |
| 4 | Grid layout engine (no overlap, adjacency) | ✅ |
| 5 | Premium dark SaaS UI, shadows, Framer Motion | ✅ |

## Stack

- **Frontend:** Next.js (App Router) · TypeScript · R3F · Tailwind · Zustand · Framer Motion  
- **Backend:** FastAPI · Ollama (primary) · Gemini (optional fallback)

## Quick start

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
ollama pull llama3.2   # optional but recommended
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

- App: http://localhost:3000  
- API docs: http://localhost:8000/docs  

On load you see **Phase 1** hardcoded rooms. Use “Build rooms” for Phase 2, or type a prompt for Phase 3+.

## Sample prompts

- `2 bedroom house with kitchen and hall`
- `2BHK house with kitchen and balcony`
- `Studio apartment with kitchenette and bathroom`

## Structure

```
prompt2plan/
├── backend/app/
│   ├── main.py
│   ├── routes/layout.py      # Phase 3
│   └── services/
│       ├── llm.py            # Ollama → Gemini → heuristic
│       └── layout_engine.py  # Phase 4
└── frontend/src/
    ├── lib/types.ts          # Phase 1 hardcoded + Phase 2 generator
    ├── components/3d/        # Room, Floor, SceneCanvas
    ├── components/ui/        # Prompt, Sidebar, Navbar
    └── store/planStore.ts
```

## License

MIT
