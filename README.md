# Prompt2Plan

Convert natural-language prompts into interactive **3D floor plans**.

Portfolio-ready SaaS MVP with structured AI validation, immersive 3D, and a premium landing page.

## What's working

| Area | Status |
|------|--------|
| Landing (`/`) | Premium marketing page |
| Workspace (`/workspace`) | Interactive 3D product |
| AI pipeline | Ollama → Gemini → heuristic + Zod/Pydantic validation |
| Layout engine | Grid packing, adjacency, no overlap |
| Export / history | JSON download + localStorage |
| Theme | Dark / light toggle |

## Stack

- **Frontend:** Next.js App Router · TypeScript · R3F · Tailwind · Zustand · Framer Motion · Zod  
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

- Landing: http://localhost:3000  
- Workspace: http://localhost:3000/workspace  
- API docs: http://localhost:8000/docs  

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the improved folder layout.

Key flows:

1. **Prompt** → Next `/api/generate-layout` proxy → FastAPI  
2. **LLM** returns constrained JSON → `validators.py` / Zod  
3. **Layout engine** places rooms → 3D viewer  

## Sample prompts

- `2 bedroom house with kitchen and hall`
- `2BHK house with kitchen and balcony`
- `Studio apartment with kitchenette and bathroom`

## Later roadmap

- Drag & resize rooms · Cloud save · Image export · Multi-floor

## License

MIT
