// Lightweight Spanish text-to-speech using the browser Web Speech API.
// Strictly user-gesture triggered — never auto-plays.

let cachedVoice: SpeechSynthesisVoice | null = null;
let voicesInitialized = false;
let lastSpeakAt = 0;
let lastSpokenText = "";

function loadVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices();
}

function pickSpanishVoice(): SpeechSynthesisVoice | null {
  const voices = loadVoices();
  if (voices.length === 0) return null;
  const exact = voices.find((v) => v.lang.toLowerCase() === "es-es");
  if (exact) return exact;
  const region = voices.find((v) => v.lang.toLowerCase().startsWith("es-"));
  if (region) return region;
  const any = voices.find((v) => v.lang.toLowerCase().startsWith("es"));
  return any ?? null;
}

function initVoicesOnce() {
  if (voicesInitialized) return;
  voicesInitialized = true;
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  cachedVoice = pickSpanishVoice();
  // Some browsers populate voices asynchronously
  if (!cachedVoice) {
    const handler = () => {
      cachedVoice = pickSpanishVoice();
      window.speechSynthesis.removeEventListener("voiceschanged", handler);
    };
    window.speechSynthesis.addEventListener("voiceschanged", handler);
  }
}

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

export function stopSpeaking() {
  if (!isSpeechSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // ignore
  }
}

export function speakSpanish(text: string, opts?: { rate?: number; pitch?: number }) {
  if (!isSpeechSupported()) return;
  if (!text || !text.trim()) return;

  const synth = window.speechSynthesis;
  initVoicesOnce();

  // Debounce: ignore identical calls fired within 300ms (prevents double-fire
  // from React StrictMode, rapid clicks, or event bubbling).
  const now = Date.now();
  if (text === lastSpokenText && now - lastSpeakAt < 300) return;
  lastSpokenText = text;
  lastSpeakAt = now;

  // Stop anything currently speaking or queued so nothing replays later
  try {
    synth.cancel();
  } catch {
    // ignore
  }

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = cachedVoice?.lang ?? "es-ES";
  if (cachedVoice) utter.voice = cachedVoice;
  utter.rate = opts?.rate ?? 0.9;
  utter.pitch = opts?.pitch ?? 1;
  utter.volume = 1;
  synth.speak(utter);
}
