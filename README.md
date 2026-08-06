# Prompt2Plan

Convert natural-language prompts into interactive **3D floor plans**.

```
"2BHK house with kitchen and balcony"  →  placed rooms JSON  →  lit 3D viewer
```

## Stack

| Layer    | Tech                                                    |
|----------|---------------------------------------------------------|
| Frontend | Next.js · R3F · Tailwind · Zustand · Framer Motion      |
| Backend  | FastAPI · Ollama (primary) · Gemini (fallback)          |

## Quick start

### 1. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
copy .env.example .env

# Optional — free local LLM
ollama pull llama3.2

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:3000

## Features

- **Prompt → layout** via Ollama (Gemini / heuristic fallback)
- **Improved layout engine** — edge-aligned packing, shared-wall scoring, adjacency hints, centered AABB
- **Premium dark SaaS UI** — glassmorphism, neon indigo/cyan, Framer Motion
- **Realistic 3D** — directional shadows, contact shadows, environment lighting, orbit controls

## Sample prompts

- `2BHK house with kitchen and balcony`
- `Studio apartment with kitchenette and bathroom`
- `3BHK family home with living room, dining, and two bathrooms`
- `Open plan loft with living, kitchen, office, and balcony`

## Project structure

```
prompt2plan/
├── backend/
│   └── app/
│       ├── main.py
│       ├── models/
│       ├── routes/
│       └── services/          # llm.py + layout_engine.py
└── frontend/
    └── src/
        ├── app/               # Next.js App Router
        ├── components/
        │   ├── 3d/            # Room, Floor, SceneCanvas
        │   └── ui/            # Navbar, PromptInput, Sidebar
        ├── lib/
        └── store/
```

## Roadmap (later)

- Drag & resize rooms · Save layouts · Export image · Multi-floor

## License

MIT
