import glob
import json
import os
import re
import time

import cv2
import mediapipe as mp

# Demo vocabulary for text/speech -> sign playback (subset of the 25-word list)
SIGNS = {
    ord('0'): "salom",
    ord('1'): "rahmat",
    ord('2'): "kechirasiz",
    ord('3'): "ha",
    ord('4'): "yoq",
    ord('5'): "yordam",
}

SEQ_DIR = os.path.join("data", "sequences")
HAND_NUM = 21

os.makedirs(SEQ_DIR, exist_ok=True)

mp_holistic = mp.solutions.holistic
mp_draw = mp.solutions.drawing_utils
holistic = mp_holistic.Holistic(
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)


def hand_to_points(landmarks):
    if not landmarks:
        return None
    return [[lm.x, lm.y, lm.z] for lm in landmarks.landmark]


def zero_hand():
    return [[0.0, 0.0, 0.0] for _ in range(HAND_NUM)]


def count_takes(word):
    return len(glob.glob(os.path.join(SEQ_DIR, f"{word}_*.json")))


def next_index(word):
    existing = glob.glob(os.path.join(SEQ_DIR, f"{word}_*.json"))
    max_index = 0
    for path in existing:
        match = re.search(rf"{re.escape(word)}_(\d+)\.json$", path)
        if match:
            max_index = max(max_index, int(match.group(1)))
    return max_index + 1


cap = cv2.VideoCapture(0)
print(f"Camera opened: {cap.isOpened()}")
frame_count = 0
current_label = None
recording = False
frames = []
record_start_time = None
last_saved_path = None
last_saved_word = None

counts = {word: count_takes(word) for word in SIGNS.values()}

print("Sign Sequence Recorder started.")
print("Press 0-5 to select a word, SPACE to start/stop recording a take, 'x' to discard, 'q' to quit.")

while True:
    ret, frame = cap.read()
    if not ret:
        print("Camera read failed (ret=False), exiting loop.")
        break

    frame = cv2.flip(frame, 1)
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = holistic.process(rgb_frame)

    frame_count += 1
    if frame_count % 60 == 0:
        print(f"Loop alive, frame {frame_count}")

    key = cv2.waitKey(1) & 0xFF
    if key != 255:
        print(f"Key received: {key} ({chr(key) if 32 <= key < 127 else '?'})")

    if key in SIGNS:
        current_label = SIGNS[key]

    elif key == 32:  # SPACE toggles recording
        if current_label is None:
            pass
        elif not recording:
            recording = True
            frames = []
            record_start_time = time.time()
        else:
            recording = False
            elapsed = max(time.time() - record_start_time, 1e-6)
            fps = round(len(frames) / elapsed) if frames else 30

            if frames:
                index = next_index(current_label)
                filename = f"{current_label}_{index:03d}.json"
                path = os.path.join(SEQ_DIR, filename)
                with open(path, "w") as f:
                    json.dump({"word": current_label, "fps": fps, "frames": frames}, f)

                counts[current_label] = count_takes(current_label)
                last_saved_path = path
                last_saved_word = current_label
                print(f"Saved take: {filename} ({len(frames)} frames, ~{fps} fps)")
            else:
                print("No frames captured, take not saved.")

    elif key == ord('x'):
        if recording:
            recording = False
            print(f"Discarded in-progress take for '{current_label}' ({len(frames)} frames, not saved)")
            frames = []
        elif last_saved_path and os.path.isfile(last_saved_path):
            os.remove(last_saved_path)
            counts[last_saved_word] = count_takes(last_saved_word)
            print(f"Discarded last saved take: {os.path.basename(last_saved_path)}")
            last_saved_path = None
        else:
            print("No take available to discard.")

    elif key == ord('q'):
        if recording:
            print(f"Discarded in-progress take for '{current_label}' on quit ({len(frames)} frames, not saved)")
        break

    if results.left_hand_landmarks:
        mp_draw.draw_landmarks(
            frame, results.left_hand_landmarks, mp_holistic.HAND_CONNECTIONS,
            mp_draw.DrawingSpec(color=(121, 22, 76), thickness=2, circle_radius=4),
            mp_draw.DrawingSpec(color=(121, 44, 250), thickness=2, circle_radius=2)
        )

    if results.right_hand_landmarks:
        mp_draw.draw_landmarks(
            frame, results.right_hand_landmarks, mp_holistic.HAND_CONNECTIONS,
            mp_draw.DrawingSpec(color=(245, 117, 66), thickness=2, circle_radius=4),
            mp_draw.DrawingSpec(color=(245, 66, 230), thickness=2, circle_radius=2)
        )

    if recording:
        left_points = hand_to_points(results.left_hand_landmarks)
        right_points = hand_to_points(results.right_hand_landmarks)
        frames.append({
            "left_present": left_points is not None,
            "right_present": right_points is not None,
            "left": left_points if left_points else zero_hand(),
            "right": right_points if right_points else zero_hand(),
        })

    label_text = current_label if current_label else "None (press 0-5)"
    cv2.putText(frame, f"Word: {label_text}", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

    if current_label:
        cv2.putText(frame, f"Takes saved: {counts[current_label]}", (10, 60),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

    if recording:
        cv2.putText(frame, "RECORDING", (10, 100),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)
        cv2.putText(frame, f"Frames: {len(frames)}", (10, 130),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)

    cv2.imshow("Sign Sequence Recorder", frame)

cap.release()
cv2.destroyAllWindows()
