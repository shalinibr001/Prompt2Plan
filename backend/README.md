"""
Prompt2Plan — Backend
=====================

FastAPI service that turns natural-language prompts into structured,
grid-placed floor-plan JSON for the Prompt2Plan 3D viewer.

## Stack

- FastAPI + Uvicorn
- Ollama (primary LLM, free & local)
- Google Gemini (optional fallback)
- Grid layout engine (no room overlap)

## Quick start

```bash
# 1. Create a virtualenv and install deps
cd backend
python -m venv .venv

# Windows
.venv\\Scripts\\activate
# macOS / Linux
# source .venv/bin/activate

pip install -r requirements.txt

# 2. Copy env file and edit if needed
copy .env.example .env   # Windows
# cp .env.example .env   # macOS / Linux

# 3. Start Ollama and pull a model (recommended)
#    https://ollama.com
ollama pull llama3.2

# 4. Run the API
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Open docs: http://localhost:8000/docs

## Endpoints

| Method | Path               | Description                          |
|--------|--------------------|--------------------------------------|
| GET    | /health            | Liveness check                       |
| GET    | /sample-prompts    | Curated demo prompts                 |
| POST   | /generate-layout   | Prompt → placed rooms JSON           |

### POST /generate-layout

```json
{ "prompt": "2BHK house with kitchen and balcony" }
```

Response (shape):

```json
{
  "prompt": "2BHK house with kitchen and balcony",
  "rooms": [
    {
      "id": "a1b2c3d4",
      "type": "hall",
      "width": 5.0,
      "length": 4.0,
      "label": "Hall",
      "x": 0.0,
      "z": 0.0,
      "height": 2.8
    }
  ],
  "bounds": {
    "min_x": -2.5, "max_x": 5.5,
    "min_z": -2.0, "max_z": 4.0,
    "width": 8.0, "depth": 6.0
  },
  "source": "ollama",
  "sample": false
}
```

`source` is one of: `ollama` | `gemini` | `fallback`.

## Configuration

| Variable         | Default                     | Notes                          |
|------------------|-----------------------------|--------------------------------|
| OLLAMA_BASE_URL  | http://localhost:11434      | Local Ollama server            |
| OLLAMA_MODEL     | llama3.2                    | Any chat model that supports JSON |
| GEMINI_API_KEY   | (empty)                     | Optional fallback              |
| CORS_ORIGINS     | http://localhost:3000,...   | Comma-separated                |

## LLM cascade

1. **Ollama** — preferred, free, runs locally  
2. **Gemini** — used only when Ollama fails *and* `GEMINI_API_KEY` is set  
3. **Heuristic fallback** — keyword / BHK parser so demos always work offline  

## Project layout

```
backend/
  app/
    main.py              # FastAPI app + CORS
    config.py            # Settings from env
    models/layout.py     # Pydantic schemas
    routes/layout.py     # /generate-layout
    services/
      llm.py             # Ollama + Gemini + heuristic
      layout_engine.py   # Grid placement, no overlap
  requirements.txt
  .env.example
```
"""
