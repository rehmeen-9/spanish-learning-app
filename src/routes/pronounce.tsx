import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { LEVELS, WORDS, type Word } from "@/lib/hoplingo-data";
import { useDueWords, recordAnswer, useAppState } from "@/lib/hoplingo-store";
import { speakSpanish, stopSpeaking, isSpeechSupported } from "@/lib/speak";
import {
  isRecognitionSupported,
  startSpanishRecognition,
  bestMatch,
  similarity,
} from "@/lib/listen";
import mascot from "@/assets/chispa-parrot.png";

export const Route = createFileRoute("/pronounce")({
  validateSearch: (s: Record<string, unknown>): { level: number; category?: string } => ({
    level: typeof s.level === "number" ? s.level : Number(s.level) || 1,
    ...(typeof s.category === "string" ? { category: s.category } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Pronunciation Practice — Chispa" },
      { name: "description", content: "Listen, repeat, and get instant feedback on your Spanish pronunciation." },
      { property: "og:title", content: "Pronunciation Practice with Chispa" },
      { property: "og:description", content: "Train your Spanish accent with Listen & Repeat exercises." },
    ],
  }),
  component: Pronounce,
});

type Result = { score: number; transcript: string; verdict: "great" | "good" | "off" };

function Pronounce() {
  const { level, category } = Route.useSearch();
  const lvl = LEVELS.find((l) => l.id === level) ?? LEVELS[0];
  const activeCats = category && lvl.categories.includes(category as never)
    ? [category as (typeof lvl.categories)[number]]
    : lvl.categories;
  const due = useDueWords(activeCats, 10);
  const fallback = useMemo(
    () => WORDS.filter((w) => activeCats.includes(w.category)).slice(0, 10),
    [activeCats],
  );
  const queue = due.length > 0 ? due : fallback;
  const s = useAppState();

  const [idx, setIdx] = useState(0);
  const [listening, setListening] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [done, setDone] = useState(false);
  const recRef = useRef<{ stop: () => void } | null>(null);
  const startRef = useRef(Date.now());

  const word: Word | undefined = queue[idx];
  const sttSupported = isRecognitionSupported();
  const ttsSupported = isSpeechSupported();

  useEffect(() => () => {
    stopSpeaking();
    recRef.current?.stop();
  }, []);

  // Auto-play the word when it appears
  useEffect(() => {
    if (!word) return;
    setResult(null);
    setError(null);
    startRef.current = Date.now();
    const t = setTimeout(() => speakSpanish(word.es), 250);
    return () => clearTimeout(t);
  }, [word?.id]);

  function startListening() {
    if (!word || listening) return;
    setError(null);
    setResult(null);
    stopSpeaking();
    const handle = startSpanishRecognition({
      onResult: (alts) => {
        const m = bestMatch(alts, word.es);
        // Even if onResult was empty, still compute on transcript[0]
        const score = m.score || similarity(alts[0]?.transcript ?? "", word.es);
        const verdict: Result["verdict"] = score >= 0.8 ? "great" : score >= 0.55 ? "good" : "off";
        const r: Result = { score, transcript: m.transcript || alts[0]?.transcript || "", verdict };
        setResult(r);
        const correct = verdict !== "off";
        const ms = Date.now() - startRef.current;
        recordAnswer(word.id, correct, "type", ms);
        setScore((sc) => ({ correct: sc.correct + (correct ? 1 : 0), total: sc.total + 1 }));
      },
      onError: (err) => {
        if (err === "no-speech") setError("I didn't hear anything — try again 🎤");
        else if (err === "not-allowed") setError("Microphone access blocked. Allow it in your browser settings.");
        else if (err === "not-supported") setError("Voice practice isn't supported in this browser.");
        else setError("Mic error: " + err);
        setListening(false);
      },
      onEnd: () => {
        setListening(false);
        recRef.current = null;
      },
    });
    if (handle) {
      recRef.current = handle;
      setListening(true);
    }
  }

  function stopListening() {
    recRef.current?.stop();
    recRef.current = null;
    setListening(false);
  }

  function next() {
    if (idx + 1 >= queue.length) setDone(true);
    else setIdx(idx + 1);
  }

  if (!sttSupported) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <img src={mascot} alt="" className="mx-auto h-24 w-24" />
        <h1 className="mt-4 text-3xl font-bold">Voice practice unavailable</h1>
        <p className="mt-2 text-muted-foreground">
          Your browser doesn't support speech recognition. Try Chrome, Edge, or Safari on desktop or Android.
        </p>
        <Link to="/levels" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-mint">
          Back to Levels
        </Link>
      </main>
    );
  }

  if (done) {
    const pct = Math.round((score.correct / Math.max(score.total, 1)) * 100);
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-12 text-center">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-7xl">
          {pct >= 80 ? "🎤" : pct >= 50 ? "🦜" : "🌱"}
        </motion.div>
        <h2 className="mt-6 text-4xl font-bold">¡Bien hecho!</h2>
        <p className="mt-2 text-muted-foreground">You nailed {score.correct} / {score.total} pronunciations</p>
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="rounded-2xl bg-card p-4 shadow-soft">
            <div className="text-2xl font-bold text-primary">+{score.correct * 8}</div>
            <div className="text-xs text-muted-foreground">XP earned</div>
          </div>
          <div className="rounded-2xl bg-card p-4 shadow-soft">
            <div className="text-2xl font-bold text-accent">{pct}%</div>
            <div className="text-xs text-muted-foreground">Accuracy</div>
          </div>
          <div className="rounded-2xl bg-card p-4 shadow-soft">
            <div className="text-2xl font-bold text-warning-foreground">🔥 {s.streak}</div>
            <div className="text-xs text-muted-foreground">Streak</div>
          </div>
        </div>
        <div className="mt-8 flex gap-3">
          <button
            onClick={() => { setIdx(0); setScore({ correct: 0, total: 0 }); setDone(false); }}
            className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-mint hover:scale-105 transition"
          >
            Practice again
          </button>
          <Link to="/levels" className="rounded-full bg-card px-6 py-3 font-semibold shadow-soft hover:scale-105 transition">
            Back to levels
          </Link>
        </div>
      </main>
    );
  }

  if (!word) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-muted-foreground">Loading words…</p>
      </main>
    );
  }

  const progress = ((idx + (result ? 1 : 0)) / queue.length) * 100;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <div className="mb-6 flex items-center gap-4">
        <Link to="/levels" className="text-sm text-muted-foreground hover:text-foreground">← Levels</Link>
        <div className="flex-1">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <motion.div className="h-full bg-gradient-mint" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
          </div>
        </div>
        <span className="text-sm font-semibold text-muted-foreground">{idx + 1}/{queue.length}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={word.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.25 }}
          className="rounded-3xl border border-border bg-gradient-card p-8 shadow-soft md:p-10"
        >
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-secondary-foreground">
              🎤 Listen & Repeat
            </span>
            <span className="text-xs text-muted-foreground">{word.category}</span>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm uppercase tracking-wider text-muted-foreground">Say this in Spanish</p>
            <p className="mt-3 text-5xl font-bold tracking-tight md:text-6xl">{word.es}</p>
            <p className="mt-2 text-base text-muted-foreground">"{word.en}"</p>

            {ttsSupported && (
              <button
                type="button"
                onClick={() => speakSpanish(word.es)}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground transition hover:bg-primary hover:text-primary-foreground"
              >
                <Volume2 className="h-4 w-4" /> Hear it again
              </button>
            )}
          </div>

          <div className="mt-10 flex flex-col items-center">
            <button
              type="button"
              onClick={listening ? stopListening : startListening}
              disabled={!!result}
              className={`relative flex h-24 w-24 items-center justify-center rounded-full text-primary-foreground shadow-mint transition-all ${
                listening
                  ? "bg-accent animate-pulse scale-110"
                  : result
                    ? "bg-muted text-muted-foreground"
                    : "bg-primary hover:scale-110"
              } disabled:cursor-not-allowed`}
              aria-label={listening ? "Stop recording" : "Start recording"}
            >
              {listening ? <MicOff className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
              {listening && (
                <span className="absolute inset-0 -z-10 rounded-full bg-accent/40 animate-ping" />
              )}
            </button>
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              {listening ? "Listening… speak now" : result ? "Got it!" : "Tap to record"}
            </p>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl bg-accent/15 p-4 text-center text-sm text-accent">{error}</div>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-6 rounded-2xl p-5 ${
                result.verdict === "great" ? "bg-primary/15" : result.verdict === "good" ? "bg-warning/20" : "bg-accent/15"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">
                  {result.verdict === "great" ? "🎉" : result.verdict === "good" ? "👍" : "💔"}
                </div>
                <div className="flex-1">
                  <p className={`text-lg font-bold ${
                    result.verdict === "great" ? "text-primary" : result.verdict === "good" ? "text-warning-foreground" : "text-accent"
                  }`}>
                    {result.verdict === "great" ? "¡Perfecto!" : result.verdict === "good" ? "Close — keep practicing!" : "Let's try again"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    I heard: <span className="font-semibold text-foreground">"{result.transcript || "—"}"</span>
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full ${
                        result.verdict === "great" ? "bg-primary" : result.verdict === "good" ? "bg-warning" : "bg-accent"
                      }`}
                      style={{ width: `${Math.round(result.score * 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Match: {Math.round(result.score * 100)}%</p>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                {result.verdict === "off" && (
                  <button
                    onClick={() => { setResult(null); startListening(); }}
                    className="rounded-full bg-card px-4 py-2 text-sm font-semibold shadow-soft hover:scale-105 transition"
                  >
                    Try again
                  </button>
                )}
                <button
                  onClick={next}
                  className="rounded-full bg-foreground px-5 py-2.5 font-semibold text-background hover:scale-105 transition"
                >
                  {idx + 1 >= queue.length ? "Finish" : "Next →"}
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-4 flex justify-center gap-4 text-sm text-muted-foreground">
        <span>✓ {score.correct}</span>
        <span>✗ {score.total - score.correct}</span>
        <span>· {lvl.name} level</span>
      </div>
    </main>
  );
}
