// Direct port of `normalize_hand()` in landmark_utils.py.
// Any change here must be mirrored there, or live inference features stop
// matching the features the classifier was trained on.

export const HAND_WRIST = 0;
export const HAND_MIDDLE_MCP = 9;
export const HAND_LANDMARK_COUNT = 21;

/**
 * Translate every point to be wrist-relative, then divide by the
 * wrist-to-middle-MCP distance so hand size in frame stops mattering.
 *
 * @param {number[]} flat - 63 values, ordered x0,y0,z0,x1,y1,z1,...
 * @returns {number[]} 63 normalized values in the same order
 */
export function normalizeHand(flat) {
  if (!Array.isArray(flat) || flat.length !== HAND_LANDMARK_COUNT * 3) {
    throw new Error(
      `normalizeHand expects ${HAND_LANDMARK_COUNT * 3} values, received ${flat?.length}`
    );
  }

  const points = [];
  for (let i = 0; i < flat.length; i += 3) {
    points.push([flat[i], flat[i + 1], flat[i + 2]]);
  }

  const [ox, oy, oz] = points[HAND_WRIST];
  const [rx, ry, rz] = points[HAND_MIDDLE_MCP];

  let scale = Math.hypot(rx - ox, ry - oy, rz - oz);
  if (scale < 1e-6) {
    scale = 1e-6;
  }

  const out = [];
  for (const [x, y, z] of points) {
    out.push((x - ox) / scale, (y - oy) / scale, (z - oz) / scale);
  }
  return out;
}

/** Flatten MediaPipe Tasks landmark objects into the x,y,z ordering above. */
export function landmarksToFlat(landmarks) {
  const flat = [];
  for (const lm of landmarks) {
    flat.push(lm.x, lm.y, lm.z);
  }
  return flat;
}
