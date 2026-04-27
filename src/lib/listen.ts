// Spanish speech recognition wrapper around the Web Speech API.
// Strictly user-gesture triggered.

type SpeechRecognitionResult = {
  transcript: string;
  confidence: number;
};

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((ev: any) => void) | null;
  onerror: ((ev: any) => void) | null;
  onend: (() => void) | null;
}

function getCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isRecognitionSupported(): boolean {
  return !!getCtor();
}

export function startSpanishRecognition(opts: {
  onResult: (results: SpeechRecognitionResult[]) => void;
  onError?: (err: string) => void;
  onEnd?: () => void;
}): { stop: () => void } | null {
  const Ctor = getCtor();
  if (!Ctor) {
    opts.onError?.("not-supported");
    return null;
  }
  const rec = new Ctor();
  rec.lang = "es-ES";
  rec.interimResults = false;
  rec.continuous = false;
  rec.maxAlternatives = 5;

  rec.onresult = (ev: any) => {
    const out: SpeechRecognitionResult[] = [];
    const result = ev.results?.[0];
    if (result) {
      for (let i = 0; i < result.length; i++) {
        out.push({
          transcript: String(result[i].transcript ?? ""),
          confidence: Number(result[i].confidence ?? 0),
        });
      }
    }
    opts.onResult(out);
  };
  rec.onerror = (ev: any) => {
    opts.onError?.(String(ev?.error ?? "error"));
  };
  rec.onend = () => {
    opts.onEnd?.();
  };

  try {
    rec.start();
  } catch (e) {
    opts.onError?.(String((e as Error)?.message ?? e));
    return null;
  }

  return {
    stop: () => {
      try {
        rec.stop();
      } catch {
        // ignore
      }
    },
  };
}

// Levenshtein for similarity scoring
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => i);
  for (let j = 1; j <= b.length; j++) {
    let prev = dp[0];
    dp[0] = j;
    for (let i = 1; i <= a.length; i++) {
      const tmp = dp[i];
      dp[i] = Math.min(
        dp[i] + 1,
        dp[i - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      prev = tmp;
    }
  }
  return dp[a.length];
}

export function normalizeForCompare(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function similarity(a: string, b: string): number {
  const na = normalizeForCompare(a);
  const nb = normalizeForCompare(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  const dist = levenshtein(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  return 1 - dist / maxLen;
}

// Best-of-many: choose alternative with highest similarity to expected
export function bestMatch(
  alternatives: SpeechRecognitionResult[],
  expected: string,
): { transcript: string; score: number } {
  let best = { transcript: alternatives[0]?.transcript ?? "", score: 0 };
  for (const alt of alternatives) {
    const s = similarity(alt.transcript, expected);
    if (s > best.score) best = { transcript: alt.transcript, score: s };
  }
  return best;
}
