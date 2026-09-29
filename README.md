# PRISM — Public Rights Information & Support Module

> *Understand your rights. Find the right scheme. Know your next step.*

This is a proof-of-concept prototype for **Smart India Hackathon 2026, problem statement SIH26088: Multilingual Cooperative Governance & Legal Assistance Chatbot**. Team larperss.

PRISM is a privacy-first, multilingual, voice-first assistant for cooperative governance, government schemes, document explanation and grievance guidance.

> ⚠️ **Prototype only.** All AI, privacy, retrieval and government-source behaviour is **mocked** with local JSON data and rule-based logic. PRISM does not give legal advice and has no real government integration or real-time data. Its PII detection and privacy handling are not production-grade.

---

## Quick start

Requirements: **Node.js 18+**. Python 3.9+ is needed only for the optional backend.

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. The frontend runs fully in the browser, so no backend is needed for the demo.

### Optional: the Flask mock backend

The backend serves the same mock pipeline over HTTP. It reads the same JSON files as the frontend.

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows  (macOS/Linux: source .venv/bin/activate)
pip install -r requirements.txt
python app.py                   # http://localhost:5000
```

To make the frontend use the backend, create `frontend/.env.local` containing
`VITE_API_URL=http://localhost:5000`, then restart `npm run dev`. If the backend
is unreachable, the frontend falls back to the in-browser mock, so the demo keeps working.

Endpoints: `GET /api/health`, `POST /api/query {"text": "..."}`, `GET /api/schemes`, `GET /api/documents`, `GET /api/grievances`.

### Production build

```bash
cd frontend
npm run build
npm run preview
```

---

## Demo flow (about 45 seconds)

1. **Home**: click **Start Demo**. A guided-demo checklist appears.
2. **Ask PRISM**: select **తెలుగు**.
3. Click **Voice**. The screen shows *Listening…* for 1.5 s, then *Voice input transcribed*. It inserts
   *"నా పేరు రవి కుమార్, నా ఫోన్ నంబర్ 9876543210. నా పంటకు బీమా ఎలా తీసుకోవాలి?"*
4. **Privacy Gateway** (the key moment):
   - The language is detected as Telugu.
   - 2 sensitive items are found.
   - *Original* and *Protected* text are shown side by side, with `[NAME]` and `[PHONE]` replaced. Only the protected text goes to the AI layer.
5. **Retrieval**: the 5 trusted sources are scanned. PMFBY and myScheme match, and the relevant section and context are retrieved.
6. **Answer**: a Telugu PMFBY response appears with the source, document, confidence and 4 next steps. Use **Read aloud** to demo simulated text-to-speech.
7. Click **Clear Session**, then confirm. Conversation history, the uploaded document and the protected input are each ticked off as cleared.

**Extra scenarios to show the jury:**

| Scenario | How |
|---|---|
| Abstention / safety | Ask PRISM → **Safety demo (Rule 17)**. PRISM refuses to guess and recommends uploading the bye-laws. |
| English PII redaction (name + phone + Aadhaar) | Ask PRISM → **Privacy demo** |
| Document explainer | Documents → *Cooperative Notice.pdf* → **Explain this document** (2 personal details are protected) |
| Telugu-language document | Documents → *PMFBY Information Sheet.pdf* (detected as Telugu) |
| Scheme finder | Schemes → 🌾 Crop Insurance |
| Grievance guidance | Grievance → Cooperative → **Open official grievance portal** |
| Architecture | Architecture tab |

---

## Folder structure

```
prism/
├── README.md
├── backend/                     # optional Flask mock API
│   ├── app.py
│   └── requirements.txt
├── hardware/
│   └── wokwi/                   # ESP32 kiosk I/O controller simulation (see its README)
│       ├── sketch.ino
│       ├── diagram.json
│       └── libraries.txt
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── .env.example
    ├── public/favicon.svg
    └── src/
        ├── main.jsx
        ├── App.jsx              # routing + in-memory session state
        ├── index.css            # Tailwind v4 theme + small animations
        ├── i18n.js              # predefined HI / EN / TE UI strings
        ├── services/
        │   └── prism.js         # mock pipeline: language → PII → router → retrieval
        ├── data/                # mock knowledge base (shared with backend)
        │   ├── responses.json   # intents, keywords, answers, next steps (3 languages)
        │   ├── laws.json        # knowledge-base index (incl. unavailable bye-laws)
        │   ├── schemes.json
        │   ├── documents.json
        │   ├── grievances.json
        │   └── sources.json
        ├── components/
        │   ├── Header.jsx, Footer.jsx, ui.jsx
        │   ├── LanguageGate.jsx     # language picker shown at the start of each session
        │   ├── PipelineCard.jsx     # Privacy Gateway + retrieval animation
        │   ├── AnswerCard.jsx
        │   ├── AbstentionCard.jsx
        │   ├── ReadAloud.jsx        # simulated TTS
        │   └── ClearSessionModal.jsx
        └── screens/
            ├── Home.jsx, Ask.jsx, Documents.jsx
            ├── Schemes.jsx, Grievance.jsx, Architecture.jsx
```

## How the mock pipeline works

`frontend/src/services/prism.js` (mirrored in `backend/app.py`):

1. **Language detection** checks the Unicode script range: Telugu `U+0C00–0C7F`, Devanagari `U+0900–097F`, otherwise English.
2. **PII redaction** uses regex rules for Aadhaar-like 12-digit numbers, Indian mobile numbers, emails, and names after "My name is / నా పేరు / मेरा नाम".
3. **Context router** does keyword scoring over the **redacted** text, so raw PII never reaches the "AI" step. Queries asking for a specific rule, section or clause number trigger **abstention** because the society's registered bye-laws are not in the knowledge base.
4. **Retrieval** marks which of the 5 illustrative sources match and which knowledge-base document was used.

## Mocked components

| Component | In this POC |
|---|---|
| Speech-to-text | Button simulates 1.5 s of listening, then inserts a predefined question per language |
| Text-to-speech | Animated "Speaking…" state; no audio |
| Language detection | Unicode script check |
| PII detection / redaction | Small set of regex rules |
| Intent / context routing | Keyword scoring |
| Knowledge base / RAG | Static JSON files |
| LLM response generation | Pre-written responses in HI / EN / TE |
| Source verification / abstention | Rule: a specific provision was requested and the registered bye-laws are unavailable, so PRISM abstains |
| OCR / document processing | Predefined sample documents with pre-written explanations |
| File upload | Accepted but not processed; the user is asked to pick a sample |
| Grievance portal | Button shows an "external integration" notice |
| Session management | In-memory React state reset |
| Translation | Predefined strings only |

## What would be replaced in production

| POC mock | Production replacement |
|---|---|
| Simulated voice | On-device STT such as Whisper or IndicWhisper, or AI4Bharat IndicConformer |
| Simulated TTS | Indic TTS such as AI4Bharat IndicTTS |
| Script-based language ID | Language-ID model that handles code-mixed speech and text |
| Regex PII | Hybrid PII engine (rules + NER, e.g. Presidio with Indic recognisers) plus a redaction-verification pass |
| Keyword router | Intent classifier or embedding-based router |
| JSON knowledge base | Vector DB + RAG over India Code, Ministry of Cooperation, myScheme, PMFBY, State Acts and uploaded bye-laws |
| Pre-written answers | Local or small LLM with grounded generation and citation checking |
| Rule-based abstention | Retrieval-confidence thresholds + answer–source faithfulness checks |
| Sample documents | OCR (e.g. Tesseract / Indic OCR) + layout analysis |
| In-memory session | Encrypted temporary storage, inactivity timeout, secure wipe |
| Portal notice | Deep links / official APIs where permitted (CPGRAMS, state portals) |
| Browser UI | Kiosk app on Raspberry Pi / mini-PC with touchscreen, mic, speaker and scanner |

---

*Prototype demonstration using mock AI responses and sample data. Government-source integrations shown are illustrative.*
