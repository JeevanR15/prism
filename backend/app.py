"""PRISM mock backend (optional).

Serves the same mock pipeline as frontend/src/services/prism.js so the React app
can run against a real HTTP API. Everything here is a deterministic mock:
script-based language detection, regex PII redaction, keyword routing and a
static JSON knowledge base shared with the frontend.

Run:  python app.py   ->  http://localhost:5000
"""

import json
import re
from pathlib import Path

from flask import Flask, jsonify, request
from flask_cors import CORS

DATA_DIR = Path(__file__).resolve().parent.parent / "frontend" / "src" / "data"


def load(name):
    return json.loads((DATA_DIR / name).read_text(encoding="utf-8"))


RESPONSES = load("responses.json")
LAWS = load("laws.json")
SCHEMES = load("schemes.json")
DOCUMENTS = load("documents.json")
GRIEVANCES = load("grievances.json")
SOURCES = load("sources.json")

app = Flask(__name__)
CORS(app)


# ---------- 1. Language detection ----------
def detect_language(text):
    if re.search(r"[ఀ-౿]", text):
        return "te"
    if re.search(r"[ऀ-ॿ]", text):
        return "hi"
    return "en"


# ---------- 2. Privacy gateway (mock PII detection) ----------
# (type, pattern, capture group holding the PII)
PII_RULES = [
    ("AADHAAR", re.compile(r"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b"), 0),
    ("PHONE", re.compile(r"(?:\+91[\s-]?)?\b[6-9]\d{9}\b"), 0),
    ("EMAIL", re.compile(r"[\w.+-]+@[\w-]+\.[\w.]+"), 0),
    ("NAME", re.compile(r"\b(?:[Mm]y name is|[Nn]ame\s*:|I am|I'm)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})"), 1),
    ("NAME", re.compile(r"నా పేరు\s+([^\s,.!?]+(?:\s+[^\s,.!?]+)?)"), 1),
    ("NAME", re.compile(r"मेरा नाम\s+([^\s,।!?]+(?:\s+(?!है)[^\s,।!?]+)?)"), 1),
]


def redact_pii(text):
    hits = []
    for pii_type, pattern, group in PII_RULES:
        for m in pattern.finditer(text):
            hits.append({"type": pii_type, "value": m.group(group), "start": m.start(group), "end": m.end(group)})
    hits.sort(key=lambda h: h["start"])

    segments, entities, cursor = [], [], 0
    for h in hits:
        if h["start"] < cursor:
            continue
        if h["start"] > cursor:
            segments.append({"text": text[cursor:h["start"]]})
        segments.append({"text": h["value"], "type": h["type"]})
        entities.append({"type": h["type"], "value": h["value"]})
        cursor = h["end"]
    if cursor < len(text):
        segments.append({"text": text[cursor:]})

    redacted = "".join(f"[{s['type']}]" if "type" in s else s["text"] for s in segments)
    return {"segments": segments, "redacted": redacted, "entities": entities}


# ---------- 3. Context router ----------
def route_query(text):
    q = text.lower()
    abstain = RESPONSES["abstention"]
    if any(re.search(p, q, re.IGNORECASE) for p in abstain["patterns"]):
        return "abstain", abstain
    best, best_score = None, 0
    for intent in RESPONSES["intents"]:
        score = sum(1 for k in intent["keywords"] if k in q)
        if score > best_score:
            best, best_score = intent, score
    return ("answer", best) if best else ("fallback", RESPONSES["fallback"])


# ---------- 4. Knowledge retrieval ----------
def kb_title(doc_id):
    return next((d["title"] for d in LAWS["documents"] if d["id"] == doc_id), None)


def retrieve(kind, intent):
    matched = set(intent.get("sources", []))
    sources = [{"id": s["id"], "matched": s["id"] in matched} for s in SOURCES]
    if kind == "answer":
        checks = [
            {"key": "ret.found", "ok": True, "sources": intent["sources"]},
            {"key": "ret.section", "ok": True, "detail": kb_title(intent.get("kb"))},
            {"key": "ret.context", "ok": True},
        ]
    elif kind == "abstain":
        checks = [
            {"key": "ret.found", "ok": True, "sources": intent["sources"]},
            {"key": "ret.byelawsMissing", "ok": False, "detail": kb_title(intent.get("missing_kb"))},
            {"key": "ret.verifyFailed", "ok": False},
        ]
    else:
        checks = [{"key": "ret.noneFound", "ok": False}]
    return {"sources": sources, "checks": checks}


# ---------- API ----------
@app.get("/api/health")
def health():
    return jsonify(status="ok", mode="mock")


@app.post("/api/query")
def query():
    text = (request.get_json(silent=True) or {}).get("text", "").strip()
    if not text:
        return jsonify(error="text is required"), 400
    privacy = redact_pii(text)
    # Routing only ever sees the redacted text.
    kind, intent = route_query(privacy["redacted"])
    return jsonify(
        detectedLang=detect_language(text),
        privacy=privacy,
        kind=kind,
        intent=intent,
        retrieval=retrieve(kind, intent),
    )


@app.get("/api/schemes")
def schemes():
    return jsonify(SCHEMES)


@app.get("/api/documents")
def documents():
    return jsonify(DOCUMENTS)


@app.get("/api/grievances")
def grievances():
    return jsonify(GRIEVANCES)


if __name__ == "__main__":
    app.run(port=5000, debug=True)
