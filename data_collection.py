import os
import csv
import time
import cv2
import mediapipe as mp

from landmark_utils import normalize_hand, normalize_pose, normalize_face

# 25-word Uzbek Sign Language key mapping
SIGNS = {
    ord('1'): "salom",
    ord('2'): "xayr",
    ord('3'): "rahmat",
    ord('4'): "kechirasiz",
    ord('5'): "ha",
    ord('6'): "yoq",
    ord('7'): "yordam",
    ord('8'): "yaxshi",
    ord('9'): "yomon",
    ord('0'): "oila",
    ord('q'): "ish",
    ord('w'): "ism",
    ord('e'): "tushunaman",
    ord('r'): "tushunmayman",
    ord('t'): "iltimos",
    ord('y'): "vaqt",
    ord('u'): "bugun",
    ord('i'): "ertaga",
    ord('o'): "suv",
    ord('p'): "ovqat",
    ord('a'): "pul",
    ord('s'): "kitob",
    ord('d'): "maktab",
    ord('f'): "do'st",
    ord('g'): "sog'lik",
}

DATA_DIR = "data"
CSV_PATH = os.path.join(DATA_DIR, "signs.csv")

# Landmark dimensions for MediaPipe Holistic
POSE_NUM = 33
FACE_NUM = 468
HAND_NUM = 21

ZERO_POSE = [0.0] * (POSE_NUM * 3)
ZERO_FACE = [0.0] * (FACE_NUM * 3)
ZERO_HAND = [0.0] * (HAND_NUM * 3)

# Header generation
HEADER = ["label", "segment_id", "pose_present", "face_present", "left_present", "right_present"]
HEADER += [f"pose_{axis}{i}" for i in range(POSE_NUM) for axis in ("x", "y", "z")]
HEADER += [f"face_{axis}{i}" for i in range(FACE_NUM) for axis in ("x", "y", "z")]
HEADER += [f"left_{axis}{i}" for i in range(HAND_NUM) for axis in ("x", "y", "z")]
HEADER += [f"right_{axis}{i}" for i in range(HAND_NUM) for axis in ("x", "y", "z")]

mp_holistic = mp.solutions.holistic
mp_draw = mp.solutions.drawing_utils
holistic = mp_holistic.Holistic(
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

os.makedirs(DATA_DIR, exist_ok=True)
file_exists = os.path.isfile(CSV_PATH)

# Schema validation guard
if file_exists:
    with open(CSV_PATH, "r", newline="") as f:
        reader = csv.reader(f)
        existing_header = next(reader, None)
        if existing_header != HEADER:
            raise ValueError(
                f"CSV header mismatch in {CSV_PATH}. Expected {len(HEADER)} columns, "
                f"found {len(existing_header) if existing_header else 0}. "
                "Delete old data file to switch to MediaPipe Holistic."
            )

counts = {label: 0 for label in SIGNS.values()}
if file_exists:
    with open(CSV_PATH, "r", newline="") as f:
        reader = csv.reader(f)
        next(reader, None)
        for row in reader:
            if row and row[0] in counts:
                counts[row[0]] += 1

csv_file = open(CSV_PATH, "a", newline="")
csv_writer = csv.writer(csv_file)
if not file_exists:
    csv_writer.writerow(HEADER)

def landmarks_to_list(landmarks):
    if not landmarks:
        return None
    values = []
    for lm in landmarks.landmark:
        values.extend([lm.x, lm.y, lm.z])
    return values

cap = cv2.VideoCapture(0)
current_label = None
session_id = int(time.time())

print("SADO - Holistic Data Collection Started (Face + Pose + Hands).")
print("Press keys (1-0, q-g) to select sign, hold SPACE to record, 'q' to exit.")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.flip(frame, 1)
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = holistic.process(rgb_frame)

    key = cv2.waitKey(1) & 0xFF

    if key in SIGNS:
        current_label = SIGNS[key]
    elif key == ord('q'):
        break

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
    is_recording = (key == 32) and (current_label is not None) and has_landmarks

    if is_recording:
        row = [
            current_label,
            f"{current_label}_webcam_{session_id}",
            1 if pose_list else 0,
            1 if face_list else 0,
            1 if left_list else 0,
            1 if right_list else 0,
        ]
        row.extend(normalize_pose(pose_list) if pose_list else ZERO_POSE)
        row.extend(normalize_face(face_list) if face_list else ZERO_FACE)
        row.extend(normalize_hand(left_list) if left_list else ZERO_HAND)
        row.extend(normalize_hand(right_list) if right_list else ZERO_HAND)
        
        csv_writer.writerow(row)
        counts[current_label] += 1

    label_text = current_label if current_label else "None (press key 1-0, q-g)"
    cv2.putText(frame, f"Sign: {label_text}", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

    if current_label:
        cv2.putText(frame, f"Samples: {counts[current_label]}", (10, 60),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

    if is_recording:
        cv2.putText(frame, "RECORDING (HOLISTIC)", (10, 100),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)

    cv2.imshow("SADO - Data Collection (Holistic: Face + Pose + Hands)", frame)

cap.release()
cv2.destroyAllWindows()
csv_file.close()

print("\nSummary of collected samples:")
for label, count in counts.items():
    print(f"  {label}: {count}")


