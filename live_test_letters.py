import pickle
from collections import deque, Counter

import cv2
import mediapipe as mp
import numpy as np
import pandas as pd

from landmark_utils import normalize_hand

MODEL_PATH = "model_letters.pkl"

try:
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)
    print(f"Loaded trained model from {MODEL_PATH}")
except FileNotFoundError:
    print(f"Error: {MODEL_PATH} not found. Please train the model using train_letters_classifier.py first.")
    model = None

HAND_NUM = 21
FEATURE_NAMES = [f"{axis}{i}" for i in range(HAND_NUM) for axis in ("x", "y", "z")]

def landmarks_to_list(landmarks):
    if not landmarks:
        return None
    values = []
    for lm in landmarks.landmark:
        values.extend([lm.x, lm.y, lm.z])
    return values

mp_hands = mp.solutions.hands
mp_draw = mp.solutions.drawing_utils
hands = mp_hands.Hands(max_num_hands=1, min_detection_confidence=0.7)

# Temporal smoothing sliding window buffer (7 frames)
WINDOW_SIZE = 7
prediction_queue = deque(maxlen=WINDOW_SIZE)

cap = cv2.VideoCapture(0)
print("SADO - Live Letter Recognition Started (Press 'q' to exit).")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.flip(frame, 1)
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hands.process(rgb_frame)

    smoothed_label = "No hand detected"
    confidence = 0.0

    hand_landmarks = None
    if results.multi_hand_landmarks:
        hand_landmarks = results.multi_hand_landmarks[0]
        mp_draw.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)

    if hand_landmarks is not None and model is not None:
        hand_list = landmarks_to_list(hand_landmarks)
        features = pd.DataFrame([normalize_hand(hand_list)], columns=FEATURE_NAMES)

        probs = model.predict_proba(features)[0]
        best_idx = np.argmax(probs)
        raw_pred = model.classes_[best_idx]
        raw_conf = probs[best_idx]

        if raw_conf >= 0.50:
            prediction_queue.append(raw_pred)

        if len(prediction_queue) > 0:
            most_common, count = Counter(prediction_queue).most_common(1)[0]
            smoothed_label = most_common
            confidence = count / len(prediction_queue)
    else:
        prediction_queue.clear()

    status_text = f"Letter: {smoothed_label}"
    if smoothed_label != "No hand detected":
        status_text += f" ({confidence*100:.0f}%)"

    cv2.putText(frame, status_text, (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)

    cv2.imshow("SADO - Live Letter Recognition", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
