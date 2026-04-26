// Browser Web Speech API recognition wrapper for Chispa.
// Lenient pronunciation matcher tolerant of accents, casing, and punctuation.

// Minimal ambient types — SpeechRecognition isn't in the default lib.dom.
interface SRAlternative {
  transcript: string;
  confidence: number;
}
interface SRResult {
  readonly length: number;
  readonly isFinal: boolean;
  [index: number]: SRAlternative;
}
interface SRResultList {
  readonly length: number;
  [index: number]: SRResult;
}
interface SREvent extends Event {
  readonly resultIndex: number;
  readonly results: SRResultList;
}
interface SRErrorEvent extends Event {
  readonly error: string;
}
interface SRInstance extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SREvent) => void) | null;
  onerror: ((e: SRErrorEvent) => void) | null;
  onend: (() => void) | null;
}

function getRecognitionCtor(): (new () => SRInstance) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SRInstance;
    webkitSpeechRecognition?: new () => SRInstance;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isRecognitionSupported(): boolean {
  return getRecognitionCtor() !== null;
}

export interface RecognizeOptions {
  lang: string; // e.g. "es-ES" or "en-US"
  onPartial?: (text: string) => void;
}

export interface ActiveRecognition {
  stop: () => void;
  abort: () => void;
  promise: Promise<string>;
}

/** Start a one-shot recognition session. Resolves with the final transcript. */
export function startRecognition(opts: RecognizeOptions): ActiveRecognition {
  const Ctor = getRecognitionCtor();
  if (!Ctor) {
    return {
      stop: () => {},
      abort: () => {},
      promise: Promise.reject(new Error("Speech recognition not supported in this browser.")),
    };
  }

  const rec = new Ctor();
  rec.lang = opts.lang;
  rec.interimResults = true;
  rec.continuous = false;
  rec.maxAlternatives = 5;

  let finalText = "";
  let resolved = false;

  const promise = new Promise<string>((resolve, reject) => {
    rec.onresult = (e: SREvent) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const txt = res[0]?.transcript ?? "";
        if (res.isFinal) finalText += txt + " ";
        else interim += txt;
      }
      if (interim && opts.onPartial) opts.onPartial(interim.trim());
    };
    rec.onerror = (e: SRErrorEvent) => {
      if (resolved) return;
      resolved = true;
      reject(new Error(e.error || "speech-error"));
    };
    rec.onend = () => {
      if (resolved) return;
      resolved = true;
      resolve(finalText.trim());
    };
  });

  try {
    rec.start();
  } catch (err) {
    return {
      stop: () => {},
      abort: () => {},
      promise: Promise.reject(err instanceof Error ? err : new Error(String(err))),
    };
  }

  return {
    stop: () => {
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
    },
    abort: () => {
      try {
        rec.abort();
      } catch {
        /* ignore */
      }
    },
    promise,
  };
}

// ---------- Pronunciation matching ----------

/** Strip accents, casing, and all non-letter/digit characters. */
export function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Levenshtein distance between two strings. */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const prev: number[] = new Array(b.length + 1);
  const curr: number[] = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

/** Similarity score 0..1 — 1 means identical, 0 means totally different. */
export function similarity(a: string, b: string): number {
  const na = normalizeForMatch(a);
  const nb = normalizeForMatch(b);
  if (!na && !nb) return 1;
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  const dist = levenshtein(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  return 1 - dist / maxLen;
}

export type MatchVerdict = "perfect" | "great" | "close" | "off";

/** Lenient verdict tuned for varying accents. ≥0.6 counts as a pass. */
export function judgeMatch(spoken: string, expected: string): {
  verdict: MatchVerdict;
  score: number;
  passed: boolean;
} {
  const score = similarity(spoken, expected);
  let verdict: MatchVerdict;
  if (score >= 0.95) verdict = "perfect";
  else if (score >= 0.8) verdict = "great";
  else if (score >= 0.6) verdict = "close";
  else verdict = "off";
  return { verdict, score, passed: score >= 0.6 };
}
