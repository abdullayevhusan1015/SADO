import os
import pickle
from contextlib import asynccontextmanager
from pathlib import Path

import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

REPO_ROOT = Path(__file__).resolve().parents[2]

# model_letters.pkl is the hands-only classifier. It is the one that matches the
# 63 values a browser MediaPipe Hands client can produce; the older Holistic
# model expects 1,629 pose/face/hand features and cannot be served from here.
MODEL_PATH = Path(os.getenv("SADO_MODEL_PATH", REPO_ROOT / "model_letters.pkl"))

ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "SADO_CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]

# Vercel mints a new hostname for every preview deployment, so an exact-match
# allowlist blocks every build except the production alias. This endpoint takes
# no credentials and returns only a letter prediction, so matching the project's
# own preview hosts is a reasonable trade for being able to test them.
ALLOWED_ORIGIN_REGEX = os.getenv(
    "SADO_CORS_ORIGIN_REGEX", r"https://sado-[A-Za-z0-9-]+\.vercel\.app"
)

HAND_NUM = 21
FEATURE_COUNT = HAND_NUM * 3
FEATURE_NAMES = [f"{axis}{i}" for i in range(HAND_NUM) for axis in ("x", "y", "z")]

state = {"model": None, "error": None}


@asynccontextmanager
async def lifespan(_app: FastAPI):
    try:
        with open(MODEL_PATH, "rb") as f:
            state["model"] = pickle.load(f)
        print(f"Loaded model from {MODEL_PATH}")
    except FileNotFoundError:
        state["error"] = (
            f"{MODEL_PATH} not found. Train it with train_letters_classifier.py, "
            "or point SADO_MODEL_PATH at an existing model."
        )
        print(f"WARNING: {state['error']}")
    except Exception as exc:  # noqa: BLE001 - surfaced to the client via /health
        state["error"] = f"Could not load {MODEL_PATH}: {exc}"
        print(f"WARNING: {state['error']}")
    yield


app = FastAPI(title="SADO API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=ALLOWED_ORIGIN_REGEX,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class PredictRequest(BaseModel):
    landmarks: list[float] = Field(
        ...,
        min_length=FEATURE_COUNT,
        max_length=FEATURE_COUNT,
        description=(
            "63 wrist-normalized hand landmark values ordered x0,y0,z0,x1,... "
            "Normalization must match landmark_utils.normalize_hand."
        ),
    )


class PredictResponse(BaseModel):
    label: str
    confidence: float


@app.get("/health")
def health():
    model = state["model"]
    return {
        "status": "ok" if model is not None else "model_not_loaded",
        "error": state["error"],
        "model_path": str(MODEL_PATH),
        "labels": [str(label) for label in model.classes_] if model is not None else [],
    }


@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest):
    model = state["model"]
    if model is None:
        raise HTTPException(status_code=503, detail=state["error"] or "Model not loaded.")

    # Column names are supplied so scikit-learn matches the training frame and
    # does not warn about missing feature names.
    features = pd.DataFrame([request.landmarks], columns=FEATURE_NAMES)

    probabilities = model.predict_proba(features)[0]
    best = int(probabilities.argmax())

    return PredictResponse(
        label=str(model.classes_[best]),
        confidence=float(probabilities[best]),
    )
