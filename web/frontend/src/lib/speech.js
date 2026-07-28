export const speechSynthesisSupported =
  typeof window !== "undefined" && "speechSynthesis" in window;

export function speak(text, { lang = "uz-UZ" } = {}) {
  if (!speechSynthesisSupported || !text) return;

  // Cancel anything queued so rapid predictions don't stack up.
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

const SpeechRecognitionImpl =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : undefined;

export const speechRecognitionSupported = Boolean(SpeechRecognitionImpl);

/**
 * One-shot dictation. Resolves with the transcript, rejects with a code the
 * caller can turn into a readable message (`not-allowed`, `no-speech`, ...).
 */
export function listenOnce({ lang = "uz-UZ" } = {}) {
  return new Promise((resolve, reject) => {
    if (!SpeechRecognitionImpl) {
      reject(new Error("unsupported"));
      return;
    }

    const recognition = new SpeechRecognitionImpl();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    let settled = false;

    recognition.onresult = (event) => {
      settled = true;
      resolve(event.results[0][0].transcript);
    };

    recognition.onerror = (event) => {
      settled = true;
      reject(new Error(event.error || "recognition-failed"));
    };

    recognition.onend = () => {
      if (!settled) reject(new Error("no-speech"));
    };

    recognition.start();
  });
}
