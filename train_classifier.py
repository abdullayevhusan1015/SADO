import pickle

import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

DATA_PATH = "data/signs.csv"
MODEL_PATH = "model.pkl"

try:
    df = pd.read_csv(DATA_PATH)
    print(f"Loaded dataset from {DATA_PATH} ({len(df)} samples, {len(df.columns)} columns)")
except FileNotFoundError:
    print(f"Error: {DATA_PATH} not found. Please record data first using data_collection.py.")
    exit(1)

DROP_COLS = ["label", "segment_id", "pose_present", "face_present", "left_present", "right_present"]
feature_cols = [c for c in df.columns if c not in DROP_COLS]

# Session-aware split: hold out the trailing 20% of frames (in original chronological
# order) within each segment as test data, and never split within a segment across
# train/test. This avoids near-duplicate consecutive frames leaking between train and
# test, which is what a random row-level split would do.
train_idx = []
test_idx = []
single_segment_labels = []

for label, label_df in df.groupby("label", sort=False):
    segment_ids = label_df["segment_id"].unique()
    if len(segment_ids) == 1:
        single_segment_labels.append(label)
    for _, seg_df in label_df.groupby("segment_id", sort=False):
        split_point = int(len(seg_df) * 0.8)
        train_idx.extend(seg_df.index[:split_point])
        test_idx.extend(seg_df.index[split_point:])

if single_segment_labels:
    print(
        f"\nWarning: {len(single_segment_labels)} letter(s) only have a single recorded "
        "segment, so their test split is the trailing 20% of that same clip by time, not "
        "an independent recording. This is a weaker test than genuinely separate footage: "
        + ", ".join(single_segment_labels) + "\n"
    )

X_train = df.loc[train_idx, feature_cols]
y_train = df.loc[train_idx, "label"]
X_test = df.loc[test_idx, feature_cols]
y_test = df.loc[test_idx, "label"]

print(f"Train samples: {len(X_train)}, Test samples: {len(X_test)}")

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"\nTest Accuracy (session-aware split): {accuracy:.4f}")
print("\nClassification Report (per-class):")
print(classification_report(y_test, y_pred))

with open(MODEL_PATH, "wb") as f:
    pickle.dump(model, f)

print(f"\nModel saved successfully to {MODEL_PATH}")
