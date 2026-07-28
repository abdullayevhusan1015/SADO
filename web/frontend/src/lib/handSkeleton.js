// MediaPipe's 21-point hand topology, used for canvas playback.
export const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],           // thumb
  [0, 5], [5, 6], [6, 7], [7, 8],           // index
  [5, 9], [9, 10], [10, 11], [11, 12],      // middle
  [9, 13], [13, 14], [14, 15], [15, 16],    // ring
  [13, 17], [17, 18], [18, 19], [19, 20],   // pinky
  [0, 17],                                  // palm edge
];

/** A hand recorded as all-zeros means "not present in this frame". */
export function isHandPresent(points) {
  if (!points || points.length === 0) return false;
  return points.some(([x, y]) => x !== 0 || y !== 0);
}

/**
 * Draw one hand's 21 points and their connections onto a 2D context.
 * Coordinates are MediaPipe's frame-relative 0..1 values.
 */
export function drawHand(ctx, points, { width, height, color, jointColor }) {
  if (!isHandPresent(points)) return;

  const px = (p) => [p[0] * width, p[1] * height];

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(2, width * 0.008);
  ctx.strokeStyle = color;

  for (const [a, b] of HAND_CONNECTIONS) {
    if (!points[a] || !points[b]) continue;
    const [ax, ay] = px(points[a]);
    const [bx, by] = px(points[b]);
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }

  const radius = Math.max(2.5, width * 0.009);
  ctx.fillStyle = jointColor;
  for (const point of points) {
    const [x, y] = px(point);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}
