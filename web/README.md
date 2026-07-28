# SADO — web app

Two modes on one site:

- **Sign → Text/Speech** — your webcam reads a hand shape, the classifier names the
  letter, the browser speaks it.
- **Text/Speech → Sign** — type or say a word and a recorded hand movement plays
  back as an animated skeleton on canvas.

Hand detection runs client-side in WebAssembly. Camera frames are never uploaded;
only the 63 normalized landmark numbers derived from a frame are sent to the API.

```
web/
  backend/     FastAPI service exposing /health and /predict
  frontend/    React + Vite + Tailwind app
  scripts/     sync_sequences.py — publishes recordings to the frontend
```

## Prerequisites

- Python 3.11 with the repo's `venv` activated
- Node.js 18+
- A trained `model_letters.pkl` in the repo root (`python train_letters_classifier.py`)

## Running locally

Two terminals, both from the repo root.

### 1. Backend

```bash
venv/Scripts/python -m pip install -r web/backend/requirements.txt
cd web/backend
../../venv/Scripts/python -m uvicorn main:app --reload --port 8000
```

Confirm it came up with a model attached:

```bash
curl http://127.0.0.1:8000/health
# {"status":"ok", ..., "labels":["A","B","Ch", ...]}
```

A `status` of `model_not_loaded` means the `.pkl` was not found — the `error`
field says where it looked.

### 2. Frontend

```bash
cd web/frontend
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173.

> The camera requires a secure context. `localhost` counts as secure, but if you
> serve the site from another machine's IP it must be over HTTPS or the browser
> will refuse camera access.

## Environment variables

### Frontend (`web/frontend/.env`)

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_URL` | yes | Base URL of the backend, no trailing slash. Baked in at build time, so rebuild after changing it. |

### Backend (process environment)

| Variable | Default | Description |
| --- | --- | --- |
| `SADO_MODEL_PATH` | `<repo>/model_letters.pkl` | Path to the pickled classifier. |
| `SADO_CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated allowed origins. Must include the deployed frontend origin. |

## Populating the Text → Sign vocabulary

This mode reads from `web/frontend/public/sequences/`, which starts empty. Until
takes are published, every word answers "not in the demo vocabulary yet" — that
is the intended empty state, not a failure.

```bash
python record_sign_sequence.py          # pick a word, SPACE to start and stop a take
python web/scripts/sync_sequences.py    # copy takes in and rebuild index.json
```

`sync_sequences.py` mirrors the source directory, so deleting a take and re-running
it removes the take from the site as well.

## Which model is served

The backend loads **`model_letters.pkl`**, the hands-only letter classifier. This
is not interchangeable with the older `model.pkl`:

| | `model_letters.pkl` | `model.pkl` |
| --- | --- | --- |
| Features | 63 (one hand) | 1,629 (pose + face + two hands) |
| Detector | MediaPipe Hands | MediaPipe Holistic |
| Predicts | letters | words |

The browser client produces 21 hand landmarks, so only the 63-feature model can
consume its output. `model.pkl` additionally depends on pose detection, which
fails whenever the signer's upper body is not well framed — the reason live
recognition returned nothing before the pipeline moved to hands-only.

## Accuracy, honestly

`model_letters.pkl` scores about **82.6%** under a session-aware split — training
and test frames are kept from sharing a source clip, so the number is not
inflated by near-duplicate neighbouring frames.

It will do noticeably worse on your hand. All 5,428 training samples come from a
single signer in a single video, so the model has never seen another person's
hands, a different camera, or different lighting. Recording more signers is the
highest-value next step; no amount of model tuning substitutes for it.

## Accessibility notes

- Focus rings are always visible and never suppressed.
- Every failure state (camera denied, mic denied, backend down, model missing,
  empty vocabulary) renders as visible text, never as audio or colour alone.
- Errors use `role="alert"` so screen readers announce them.
- Live regions and status text avoid conveying meaning through colour alone.
- `prefers-reduced-motion` disables the background and entrance animations.

## Not included yet

No accounts, no admin panel, no database, and no 3D avatar. The sequence library
is static JSON.
