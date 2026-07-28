// The recorded-sequence library is copied into /public/sequences by
// web/scripts/sync_sequences.py. The browser cannot list a directory, so that
// script also writes an index.json describing what is available.

const INDEX_URL = "/sequences/index.json";

let indexPromise = null;

/**
 * @returns {Promise<{words: string[], takes: Record<string, string[]>}>}
 */
export function loadSequenceIndex() {
  if (!indexPromise) {
    indexPromise = fetch(INDEX_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`index.json returned ${response.status}`);
        }
        return response.json();
      })
      .catch(() => ({ words: [], takes: {} }));
  }
  return indexPromise;
}

/** Normalize user input the same way the index keys are stored. */
export function canonicalise(word) {
  return word.trim().toLowerCase().replace(/[.!?,;:]+$/g, "");
}

export async function loadSequence(word) {
  const index = await loadSequenceIndex();
  const key = canonicalise(word);
  const takes = index.takes?.[key];

  if (!takes || takes.length === 0) {
    return null;
  }

  const response = await fetch(`/sequences/${takes[0]}`);
  if (!response.ok) {
    throw new Error(`Could not load the recording for “${word}”.`);
  }
  return response.json();
}
