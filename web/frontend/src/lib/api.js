const RAW_BASE = import.meta.env.VITE_API_URL;

export const API_BASE = (RAW_BASE || "").replace(/\/+$/, "");

export const API_CONFIGURED = Boolean(API_BASE);

if (!API_CONFIGURED && import.meta.env.DEV) {
  console.warn(
    "VITE_API_URL is not set. Copy .env.example to .env and point it at the FastAPI backend."
  );
}

class ApiError extends Error {
  constructor(message, { status = null, cause = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.cause = cause;
  }
}

async function request(path, options = {}) {
  if (!API_CONFIGURED) {
    throw new ApiError(
      "Backend URL is not configured. Set VITE_API_URL in the frontend .env file."
    );
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch (cause) {
    throw new ApiError(
      `Cannot reach the backend at ${API_BASE}. Is uvicorn running?`,
      { cause }
    );
  }

  if (!response.ok) {
    let detail = `Backend returned ${response.status}`;
    try {
      const body = await response.json();
      if (body?.detail) detail = body.detail;
    } catch {
      // Response body was not JSON — keep the status-code message.
    }
    throw new ApiError(detail, { status: response.status });
  }

  return response.json();
}

/** Liveness + model-load status. Used to surface backend problems up front. */
export function fetchHealth() {
  return request("/health");
}

/**
 * @param {number[]} landmarks - 63 already-normalized values (see normalize.js)
 * @returns {Promise<{label: string, confidence: number}>}
 */
export function predict(landmarks) {
  return request("/predict", {
    method: "POST",
    body: JSON.stringify({ landmarks }),
  });
}

export { ApiError };
