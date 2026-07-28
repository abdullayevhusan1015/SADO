import os
import csv
import time
import glob

import cv2
import mediapipe as mp

from landmark_utils import normalize_hand

DATA_DIR = "data"
CSV_PATH = os.path.join(DATA_DIR, "letters.csv")
HAND_NUM = 21

HEADER = ["label", "segment_id"] + [f"{axis}{i}" for i in range(HAND_NUM) for axis in ("x", "y", "z")]

# Same 33-label USL alphabet as video_to_dataset.py, mapped across keyboard rows
SIGNS = {
    ord('1'): "A", ord('2'): "B", ord('3'): "D", ord('4'): "E", ord('5'): "F",
    ord('6'): "G", ord('7'): "H", ord('8'): "I", ord('9'): "J", ord('0'): "K",
    ord('q'): "L", ord('w'): "M", ord('e'): "N", ord('r'): "O", ord('t'): "P",
    ord('y'): "Q", ord('u'): "R", ord('i'): "S", ord('o'): "T", ord('p'): "U",
    ord('a'): "V", ord('s'): "X", ord('d'): "Y", ord('f'): "Z", ord('g'): "YA",
    ord('h'): "YU", ord('j'): "YO", ord('k'): "Ye", ord('l'): "Ng",
    ord('z'): "O'", ord('x'): "G'", ord('c'): "Sh", ord('v'): "Ch",
}

os.makedirs(DATA_DIR, exist_ok=True)
file_exists = os.path.isfile(CSV_PATH)

if not file_exists:
    with open(CSV_PATH, "w", newline="") as f:
        csv.writer(f).writerow(HEADER)
else:
    with open(CSV_PATH, "r", newline="") as f:
        existing_header = next(csv.reader(f), None)
        if existing_header != HEADER:
            raise ValueError(
                f"CSV header mismatch in {CSV_PATH}. This file was written with a "
                "different schema (e.g. the Holistic pipeline) - use a fresh path."
            )

counts = {label: 0 for label in SIGNS.values()}
with open(CSV_PATH, "r", newline="") as f:
    reader = csv.reader(f)
    next(reader, None)
    for row in reader:
        if row and row[0] in counts:
            counts[row[0]] += 1

csv_file = open(CSV_PATH, "r+", newline="")
csv_file.seek(0, os.SEEK_END)
csv_writer = csv.writer(csv_file)

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

cap = cv2.VideoCapture(0)
current_label = None
recording = False
take_frames = []
session_id = int(time.time())
last_take_offset = None
last_take_label = None
last_take_count = 0

print("SADO - Webcam Letter Recorder started.")
print("Key legend:")
print("  1-9,0 : A B D E F G H I J K")
print("  q-p   : L M N O P Q R S T U")
print("  a-l   : V X Y Z YA YU YO Ye Ng")
print("  z x c v : O' G' Sh Ch")
print("SPACE: start/stop recording a take | X: discard | ESC: quit")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.flip(frame, 1)
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hands.process(rgb_frame)

    key = cv2.waitKey(1) & 0xFF

    if key in SIGNS:
        current_label = SIGNS[key]

    elif key == 32:  # SPACE toggles recording
        if current_label is None:
            pass
        elif not recording:
            recording = True
            take_frames = []
        else:
            recording = False
            if take_frames:
                last_take_offset = csv_file.tell()
                last_take_label = current_label
                last_take_count = len(take_frames)
                for row in take_frames:
                    csv_writer.writerow(row)
                csv_file.flush()
                counts[current_label] += last_take_count
                print(f"Saved {last_take_count} samples for '{current_label}' "
                      f"(total: {counts[current_label]})")
            else:
                print("No frames captured, nothing saved.")

    elif key == ord('x'):
        if recording:
            recording = False
            print(f"Discarded in-progress take for '{current_label}' ({len(take_frames)} frames, not saved)")
            take_frames = []
        elif last_take_offset is not None:
            csv_file.seek(last_take_offset)
            csv_file.truncate()
            csv_file.seek(0, os.SEEK_END)
            counts[last_take_label] -= last_take_count
            print(f"Discarded last saved take for '{last_take_label}' "
                  f"({last_take_count} samples removed, total now: {counts[last_take_label]})")
            last_take_offset = None
        else:
            print("No take available to discard.")

    elif key == 27:  # ESC quits
        if recording:
            print(f"Discarded in-progress take for '{current_label}' on quit ({len(take_frames)} frames, not saved)")
        break

    hand_landmarks = None
    if results.multi_hand_landmarks:
        hand_landmarks = results.multi_hand_landmarks[0]
        mp_draw.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)

    if recording and hand_landmarks is not None:
        hand_list = landmarks_to_list(hand_landmarks)
        segment_id = f"{current_label}_webcam_{session_id}"
        take_frames.append([current_label, segment_id] + normalize_hand(hand_list))

    label_text = current_label if current_label else "None (see console for key legend)"
    cv2.putText(frame, f"Letter: {label_text}", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

    if current_label:
        cv2.putText(frame, f"Samples: {counts[current_label]}", (10, 60),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

    if recording:
        cv2.putText(frame, "RECORDING", (10, 100),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)
        cv2.putText(frame, f"Frames: {len(take_frames)}", (10, 130),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)

    cv2.imshow("SADO - Webcam Letter Recorder", frame)

cap.release()
cv2.destroyAllWindows()
csv_file.close()

print("\nSummary of collected samples (this session's additions included):")
for label, count in counts.items():
    print(f"  {label}: {count}")
