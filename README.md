# SADO

**A sign language translator for the Uzbek deaf community.**

SADO ("voice" in Uzbek) reads Uzbek Sign Language from a webcam and turns it into text and speech, and can play recorded signs back for typed or spoken words. The goal is real, everyday usefulness for deaf and hard-of-hearing people — not a demo.

## Live

- **Site:** https://sado-beta.vercel.app
- **API:** https://sado-dle9.onrender.com/health

The backend is on Render's free tier, so it sleeps after ~15 minutes idle — the first request after a quiet period can take up to a minute while it wakes up.

## Where it stands

The letter classifier is trained on **5,428 hand samples from a single signer** (one teaching video), and scores **82.6%** under a session-aware evaluation that keeps near-duplicate frames from leaking between train and test. It will be noticeably less accurate on hands it hasn't seen, since it has no examples of anyone else's signing yet. Closing that gap — recording more signers under more conditions — matters more than any further model tuning, and is the current priority.

## Project layout

```
video_to_dataset.py            Extracts training landmarks from a source video
train_letters_classifier.py    Trains the letter classifier
live_test_letters.py           Local webcam test of the trained model
record_webcam_letters.py       Records your own webcam samples for training
record_sign_sequence.py        Records motion sequences for Text -> Sign playback
landmark_utils.py              Shared landmark normalization (Python)
data_collection.py             Older Holistic-based word/phrase recorder
web/                           The deployed site (React frontend + FastAPI backend)
```

See [web/README.md](web/README.md) for running the site locally and deployment configuration.

## How recognition works

1. MediaPipe Hands finds one hand and reduces it to 21 landmark points (x, y, z).
2. Points are made translation- and scale-invariant: measured from the wrist, divided by wrist-to-middle-knuckle distance. This is implemented once in `landmark_utils.py` (Python) and ported identically to `web/frontend/src/lib/normalize.js` (JS), verified to match to floating-point precision.
3. A `RandomForestClassifier` predicts the letter from those 63 normalized values.
4. A rolling window of the last 7 predictions has to agree before a letter is committed, to avoid flickering between neighbouring signs.

## Status

Actively in development. Not affiliated with any competition — the objective is deaf-community impact, full stop.
