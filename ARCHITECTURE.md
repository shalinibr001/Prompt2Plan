# Prompt2Plan — improved structure

```
prompt2plan/
├── backend/app/
│   ├── main.py
│   ├── config.py
│   ├── models/layout.py
│   ├── routes/layout.py
│   └── services/
│       ├── llm.py              # Ollama → Gemini → heuristic
│       ├── validators.py       # Structured room validation
│       └── layout_engine.py    # Grid placement
└── frontend/src/
    ├── app/
    │   ├── page.tsx            # Landing
    │   ├── workspace/page.tsx  # 3D product
    │   └── api/generate-layout # BFF proxy → FastAPI
    ├── components/             # Landing + ui/ + 3d/
    ├── lib/
    │   ├── ai/                 # Zod schema + API client
    │   ├── geometry/           # Deterministic room helpers
    │   ├── utils/              # export, history, theme
    │   └── types.ts
    └── store/planStore.ts
```
