import os
import csv
import cv2
import mediapipe as mp

from landmark_utils import normalize_hand

VIDEO_PATH = "usl_alphabet.mp4"
DATA_DIR = "data"
CSV_PATH = os.path.join(DATA_DIR, "letters.csv")

HAND_NUM = 21

HEADER = ["label", "segment_id"] + [f"{axis}{i}" for i in range(HAND_NUM) for axis in ("x", "y", "z")]

# Define time ranges (MM:SS) for each USL letter gesture in the video
# Timings identified from on-screen letter captions in usl_alphabet.mp4
SEGMENTS = {
    "A": ("02:26", "02:29"),
    "B": ("02:32", "02:39"),
    "D": ("02:42", "02:50"),
    "E": ("02:54", "03:00"),
    "Ye": ("03:02", "03:06"),
    "F": ("03:10", "03:14"),
    "G": ("03:18", "03:22"),
    "H": ("03:26", "03:32"),
    "I": ("03:36", "03:42"),
    "J": ("03:46", "03:54"),
    "K": ("03:58", "04:06"),
    "L": ("04:10", "04:14"),
    "M": ("04:18", "04:26"),
    "N": ("04:30", "04:38"),
    "O": ("04:42", "04:48"),
    "P": ("04:52", "05:00"),
    "Q": ("05:04", "05:10"),
    "R": ("05:14", "05:18"),
    "S": ("05:22", "05:28"),
    "T": ("05:32", "05:42"),
    "U": ("05:46", "05:50"),
    "V": ("05:54", "05:56"),
    "X": ("06:00", "06:08"),
    "Y": ("06:12", "06:18"),
    "YA": ("06:22", "06:32"),
    "YU": ("06:36", "06:46"),
    "YO": ("06:50", "06:56"),
    "Z": ("07:00", "07:08"),
    "O'": ("07:12", "07:16"),
    "G'": ("07:20", "07:30"),
    "Sh": ("07:34", "07:40"),
    "Ch": ("07:44", "07:46"),
    "Ng": ("07:50", "08:06"),
}

def time_to_seconds(time_str):
    parts = time_str.split(":")
    if len(parts) == 2:
        return int(parts[0]) * 60 + float(parts[1])
    elif len(parts) == 3:
        return int(parts[0]) * 3600 + int(parts[1]) * 60 + float(parts[2])
    return 0.0

def landmarks_to_list(landmarks):
    if not landmarks:
        return None
    values = []
    for lm in landmarks.landmark:
        values.extend([lm.x, lm.y, lm.z])
    return values

def extract_landmarks_from_video():
    if not os.path.exists(VIDEO_PATH):
        print(f"Error: {VIDEO_PATH} not found. Please download the video first.")
        return

    os.makedirs(DATA_DIR, exist_ok=True)
    file_exists = os.path.isfile(CSV_PATH)

    csv_file = open(CSV_PATH, "a", newline="")
    csv_writer = csv.writer(csv_file)
    if not file_exists:
        csv_writer.writerow(HEADER)

    mp_hands = mp.solutions.hands
    hands = mp_hands.Hands(max_num_hands=1, min_detection_confidence=0.7)

    cap = cv2.VideoCapture(VIDEO_PATH)
    fps = cap.get(cv2.CAP_PROP_FPS)
    print(f"Opened {VIDEO_PATH} (FPS: {fps})")

    total_samples = 0

    for label, (start_str, end_str) in SEGMENTS.items():
        segment_id = f"{label}_{start_str.replace(':', '')}"
        start_sec = time_to_seconds(start_str)
        end_sec = time_to_seconds(end_str)

        start_frame = int(start_sec * fps)
        end_frame = int(end_sec * fps)

        cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
        current_frame = start_frame

        sign_samples = 0
        print(f"Extracting label '{label}' from {start_str} to {end_str} (Frames {start_frame} to {end_frame})...")

        while current_frame <= end_frame:
            ret, frame = cap.read()
            if not ret:
                break

            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = hands.process(rgb_frame)

            if results.multi_hand_landmarks:
                hand_list = landmarks_to_list(results.multi_hand_landmarks[0])
                row = [label, segment_id] + normalize_hand(hand_list)
                csv_writer.writerow(row)
                sign_samples += 1

            current_frame += 1

        print(f"  -> Saved {sign_samples} samples for '{label}'")
        total_samples += sign_samples

    cap.release()
    csv_file.close()
    print(f"\nExtraction complete! Saved {total_samples} total samples to {CSV_PATH}")

if __name__ == "__main__":
    extract_landmarks_from_video()
