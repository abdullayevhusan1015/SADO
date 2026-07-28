import pickle
from collections import deque, Counter

import cv2
import mediapipe as mp
import numpy as np
import pandas as pd

from landmark_utils import normalize_hand, normalize_pose, normalize_face

MODEL_PATH = "model.pkl"

try:
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)
    print(f"Loaded trained model from {MODEL_PATH}")
except FileNotFoundError:
    print(f"Error: {MODEL_PATH} not found. Please train the model using train_classifier.py first.")
    model = None

POSE_NUM = 33
FACE_NUM = 468
HAND_NUM = 21

ZERO_POSE = [0.0] * (POSE_NUM * 3)
ZERO_FACE = [0.0] * (FACE_NUM * 3)
ZERO_HAND = [0.0] * (HAND_NUM * 3)

FEATURE_NAMES = (
    [f"pose_{axis}{i}" for i in range(POSE_NUM) for axis in ("x", "y", "z")]
    + [f"face_{axis}{i}" for i in range(FACE_NUM) for axis in ("x", "y", "z")]
    + [f"left_{axis}{i}" for i in range(HAND_NUM) for axis in ("x", "y", "z")]
    + [f"right_{axis}{i}" for i in range(HAND_NUM) for axis in ("x", "y", "z")]
)

def landmarks_to_list(landmarks):
    if not landmarks:
        return None
    values = []
    for lm in landmarks.landmark:
        values.extend([lm.x, lm.y, lm.z])
    return values

mp_holistic = mp.solutions.holistic
mp_draw = mp.solutions.drawing_utils
holistic = mp_holistic.Holistic(
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# Temporal smoothing sliding window buffer (7 frames)
WINDOW_SIZE = 7
prediction_queue = deque(maxlen=WINDOW_SIZE)

cap = cv2.VideoCapture(0)
print("SADO - Live Holistic Sign Recognition Started (Press 'q' to exit).")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.flip(frame, 1)
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = holistic.process(rgb_frame)

    smoothed_label = "No posture detected"
    confidence = 0.0

    # Draw Face Mesh
    if results.face_landmarks:
        mp_draw.draw_landmarks(
            frame, results.face_landmarks, mp_holistic.FACEMESH_CONTOURS,
            landmark_drawing_spec=None,
            connection_drawing_spec=mp_draw.DrawingSpec(color=(80, 110, 10), thickness=1, circle_radius=1)
        )

    # Draw Pose
    if results.pose_landmarks:
        mp_draw.draw_landmarks(
            frame, results.pose_landmarks, mp_holistic.POSE_CONNECTIONS,
            mp_draw.DrawingSpec(color=(80, 220, 10), thickness=2, circle_radius=4),
            mp_draw.DrawingSpec(color=(80, 44, 121), thickness=2, circle_radius=2)
        )

    # Draw Left Hand
    if results.left_hand_landmarks:
        mp_draw.draw_landmarks(
            frame, results.left_hand_landmarks, mp_holistic.HAND_CONNECTIONS,
            mp_draw.DrawingSpec(color=(121, 22, 76), thickness=2, circle_radius=4),
            mp_draw.DrawingSpec(color=(121, 44, 250), thickness=2, circle_radius=2)
        )

    # Draw Right Hand
    if results.right_hand_landmarks:
        mp_draw.draw_landmarks(
            frame, results.right_hand_landmarks, mp_holistic.HAND_CONNECTIONS,
            mp_draw.DrawingSpec(color=(245, 117, 66), thickness=2, circle_radius=4),
            mp_draw.DrawingSpec(color=(245, 66, 230), thickness=2, circle_radius=2)
        )

    pose_list = landmarks_to_list(results.pose_landmarks)
    face_list = landmarks_to_list(results.face_landmarks)
    left_list = landmarks_to_list(results.left_hand_landmarks)
    right_list = landmarks_to_list(results.right_hand_landmarks)

    has_landmarks = (pose_list is not None) or (left_list is not None) or (right_list is not None)

    if has_landmarks and model is not None:
        row = []
        row.extend(normalize_pose(pose_list) if pose_list else ZERO_POSE)
        row.extend(normalize_face(face_list) if face_list else ZERO_FACE)
        row.extend(normalize_hand(left_list) if left_list else ZERO_HAND)
        row.extend(normalize_hand(right_list) if right_list else ZERO_HAND)

        features = pd.DataFrame([row], columns=FEATURE_NAMES)
        
        # Get prediction probabilities
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

    # Render prediction text
    status_text = f"Sign: {smoothed_label}"
    if smoothed_label != "No posture detected":
        status_text += f" ({confidence*100:.0f}%)"

    cv2.putText(frame, status_text, (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)

    cv2.imshow("SADO - Live Sign Recognition (Holistic)", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()


