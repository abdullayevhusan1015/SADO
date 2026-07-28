import math

# MediaPipe landmark indices used as normalization anchors
HAND_WRIST = 0
HAND_MIDDLE_MCP = 9
POSE_LEFT_SHOULDER = 11
POSE_RIGHT_SHOULDER = 12
FACE_LEFT_EYE_OUTER = 33
FACE_RIGHT_EYE_OUTER = 263


def _to_points(flat):
    return [flat[i:i + 3] for i in range(0, len(flat), 3)]


def _to_flat(points):
    return [v for point in points for v in point]


def _normalize_points(points, origin, scale_ref):
    ox, oy, oz = origin
    scale = math.dist(origin, scale_ref)
    if scale < 1e-6:
        scale = 1e-6
    return [[(x - ox) / scale, (y - oy) / scale, (z - oz) / scale] for x, y, z in points]


def normalize_hand(flat):
    """Translate to wrist-relative, scale by wrist-to-middle-MCP distance."""
    if flat is None:
        return None
    points = _to_points(flat)
    normalized = _normalize_points(points, points[HAND_WRIST], points[HAND_MIDDLE_MCP])
    return _to_flat(normalized)


def normalize_pose(flat):
    """Translate to shoulder-midpoint-relative, scale by half shoulder width."""
    if flat is None:
        return None
    points = _to_points(flat)
    left_sh, right_sh = points[POSE_LEFT_SHOULDER], points[POSE_RIGHT_SHOULDER]
    origin = [(a + b) / 2 for a, b in zip(left_sh, right_sh)]
    normalized = _normalize_points(points, origin, right_sh)
    return _to_flat(normalized)


def normalize_face(flat):
    """Translate to eye-midpoint-relative, scale by interocular distance."""
    if flat is None:
        return None
    points = _to_points(flat)
    left_eye, right_eye = points[FACE_LEFT_EYE_OUTER], points[FACE_RIGHT_EYE_OUTER]
    origin = [(a + b) / 2 for a, b in zip(left_eye, right_eye)]
    normalized = _normalize_points(points, origin, right_eye)
    return _to_flat(normalized)
