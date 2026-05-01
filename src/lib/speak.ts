// Lightweight Spanish text-to-speech using the browser Web Speech API.
// Strictly user-gesture triggered — never auto-plays.

let cachedVoice: SpeechSynthesisVoice | null = null;
let voicesInitialized = false;
let lastSpeakAt = 0;
let lastSpokenText = "";

const FEMALE_SPANISH_VOICE_HINTS =
  /female|mujer|woman|mónica|monica|lucía|lucia|paulina|sofía|sofia|elena|helena|laura|marisol|penélope|penelope|esperanza|conchita|sabina|paloma|carmen|isabel|maria|maría|julia|lola|alba|teresa|ximena|camila|valentina|paula|angélica|angelica|elvira|ines|inés|google.*español/i;

function loadVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices();
}

export function pickSpanishVoice(preferredLang = "es-ES"): SpeechSynthesisVoice | null {
  const voices = loadVoices();
  if (voices.length === 0) return null;

  const preferred = preferredLang.toLowerCase();
  const score = (voice: SpeechSynthesisVoice) => {
    const lang = voice.lang.toLowerCase();
    if (!lang.startsWith("es")) return -1;
    let value = 10;
    if (lang === preferred) value += 80;
    else if (lang === "es-es") value += 65;
    else if (lang.startsWith("es-")) value += 35;
    if (FEMALE_SPANISH_VOICE_HINTS.test(`${voice.name} ${voice.voiceURI}`)) value += 120;
    if (/premium|enhanced|natural|neural|google|microsoft/i.test(`${voice.name} ${voice.voiceURI}`)) value += 8;
    return value;
  };

  return voices
    .filter((voice) => voice.lang.toLowerCase().startsWith("es"))
    .sort((a, b) => score(b) - score(a))[0] ?? null;
}

export function warmSpanishVoices() {
  if (!isSpeechSupported()) return;
  initVoicesOnce();
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
