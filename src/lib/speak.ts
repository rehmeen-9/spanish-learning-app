// Lightweight Spanish text-to-speech using the browser Web Speech API.
// No API key, works offline on most modern browsers.

let cachedVoice: SpeechSynthesisVoice | null = null;
let voicesLoaded = false;

function loadVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices();
}

function pickSpanishVoice(): SpeechSynthesisVoice | null {
  const voices = loadVoices();
  if (voices.length === 0) return null;
  // Prefer es-ES, then any es-*, then anything starting with es
  const exact = voices.find((v) => v.lang.toLowerCase() === "es-es");
  if (exact) return exact;
  const region = voices.find((v) => v.lang.toLowerCase().startsWith("es-"));
  if (region) return region;
  const any = voices.find((v) => v.lang.toLowerCase().startsWith("es"));
  return any ?? null;
}

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

export function speakSpanish(text: string, opts?: { rate?: number; pitch?: number }) {
  if (!isSpeechSupported()) return;
  const synth = window.speechSynthesis;

  // Some browsers populate voices async; subscribe once.
  if (!voicesLoaded) {
    voicesLoaded = true;
    if (loadVoices().length === 0) {
      synth.onvoiceschanged = () => {
        cachedVoice = pickSpanishVoice();
      };
    }
  }
  if (!cachedVoice) cachedVoice = pickSpanishVoice();

  // Cancel any in-flight speech so rapid taps feel responsive
  synth.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = cachedVoice?.lang ?? "es-ES";
  if (cachedVoice) utter.voice = cachedVoice;
  utter.rate = opts?.rate ?? 0.9;
  utter.pitch = opts?.pitch ?? 1;
  synth.speak(utter);
}
