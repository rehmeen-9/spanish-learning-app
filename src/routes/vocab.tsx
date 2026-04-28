import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, ArrowRight, RotateCcw } from "lucide-react";
import { WORDS, type Word } from "@/lib/hoplingo-data";
import { recordAnswer, useAppState } from "@/lib/hoplingo-store";
import { speakSpanish, stopSpeaking, isSpeechSupported } from "@/lib/speak";
import {
  isRecognitionSupported,
  startSpanishRecognition,
  bestMatch,
  similarity,
} from "@/lib/listen";
import { phoneticGuide } from "@/lib/phonetics";
import mascot from "@/assets/chispa-parrot.png";

export const Route = createFileRoute("/vocab")({
  head: () => ({
    meta: [
      { title: "Vocab Trainer — Chispa" },
      { name: "description", content: "Bilingual vocabulary practice with phonetic guides and pronunciation feedback." },
      { property: "og:title", content: "Vocab Trainer — Chispa" },
      { property: "og:description", content: "See it in English, learn it in Spanish, then say it out loud — Duolingo-style." },
    ],
  }),
  component: VocabTrainer,
});

type Phase = "english" | "spanish";
type Result = { score: number; transcript: string; verdict: "great" | "good" | "off" };

function pickWords(count: number): Word[] {
  // Beginner-to-intermediate: difficulty 1 & 2, shuffled
  const pool = WORDS.filter((w) => w.difficulty <= 2);
  const out: Word[] = [];
  const used = new Set<string>();
  while (out.length < count && out.length < pool.length) {
    const w = pool[Math.floor(Math.random() * pool.length)];
    if (used.has(w.id)) continue;
    used.add(w.id);
    out.push(w);
  }
  return out;
}

function VocabTrainer() {
  const s = useAppState();
  const sttSupported = isRecognitionSupported();
  const ttsSupported = isSpeechSupported();

  const [seed, setSeed] = useState(0);
  const queue = useMemo(() => pickWords(10), [seed]);
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("english");
  const [listening, setListening] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [done, setDone] = useState(false);
  const recRef = useRef<{ stop: () => void } | null>(null);
  const startRef = useRef(Date.now());

  const word = queue[idx];
  const guide = useMemo(() => (word ? phoneticGuide(word.es) : ""), [word?.id]);

  useEffect(() => () => {
    stopSpeaking();
    recRef.current?.stop();
  }, []);

  // Auto-play when entering Spanish phase
  useEffect(() => {
    if (!word) return;
    if (phase === "spanish" && ttsSupported) {
      const t = setTimeout(() => speakSpanish(word.es), 200);
      return () => clearTimeout(t);
    }
  }, [phase, word?.id, ttsSupported]);

  function goSpanish() {
    setPhase("spanish");
    setResult(null);
    setError(null);
    startRef.current = Date.now();
  }

  function startListening() {
    if (!word || listening) return;
    setError(null);
    setResult(null);
    stopSpeaking();
    const handle = startSpanishRecognition({
      onResult: (alts) => {
        const m = bestMatch(alts, word.es);
        const sc = m.score || similarity(alts[0]?.transcript ?? "", word.es);
        const verdict: Result["verdict"] = sc >= 0.8 ? "great" : sc >= 0.55 ? "good" : "off";
        const r: Result = { score: sc, transcript: m.transcript || alts[0]?.transcript || "", verdict };
        setResult(r);
        const correct = verdict !== "off";
        const ms = Date.now() - startRef.current;
        recordAnswer(word.id, correct, "type", ms);
        setScore((p) => ({ correct: p.correct + (correct ? 1 : 0), total: p.total + 1 }));
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

  function nextWord() {
    setResult(null);
    setError(null);
    setPhase("english");
    if (idx + 1 >= queue.length) setDone(true);
    else setIdx(idx + 1);
  }

  function restart() {
    setSeed((v) => v + 1);
    setIdx(0);
    setPhase("english");
    setResult(null);
    setError(null);
    setScore({ correct: 0, total: 0 });
    setDone(false);
  }

  if (done) {
    const pct = Math.round((score.correct / Math.max(score.total, 1)) * 100);
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-12 text-center">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-7xl">
          {pct >= 80 ? "🎉" : pct >= 50 ? "🦜" : "🌱"}
        </motion.div>
        <h2 className="mt-6 text-4xl font-bold">¡Excelente!</h2>
        <p className="mt-2 text-muted-foreground">You pronounced {score.correct} / {score.total} correctly</p>
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
          <button onClick={restart} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-mint hover:scale-105 transition">
            <RotateCcw className="h-4 w-4" /> New round
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

  const progress = ((idx + (phase === "spanish" && result ? 1 : phase === "spanish" ? 0.5 : 0)) / queue.length) * 100;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <div className="mb-6 flex items-center gap-4">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Home</Link>
        <div className="flex-1">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <motion.div className="h-full bg-gradient-mint" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
          </div>
        </div>
        <span className="text-sm font-semibold text-muted-foreground">{idx + 1}/{queue.length}</span>
      </div>

      <div className="mb-4 flex items-center justify-center gap-2 text-xs">
        <span className={`rounded-full px-3 py-1 font-semibold uppercase tracking-wider ${phase === "english" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
          1. English
        </span>
        <ArrowRight className="h-3 w-3 text-muted-foreground" />
        <span className={`rounded-full px-3 py-1 font-semibold uppercase tracking-wider ${phase === "spanish" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
          2. Español 🎤
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${word.id}-${phase}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.25 }}
          className="rounded-3xl border border-border bg-gradient-card p-8 shadow-soft md:p-10"
        >
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-secondary-foreground">
              {phase === "english" ? "🇬🇧 Read aloud" : "🇪🇸 Say it back"}
            </span>
            <span className="text-xs text-muted-foreground">{word.category}</span>
          </div>

          {phase === "english" ? (
            <div className="mt-10 text-center">
              <p className="text-sm uppercase tracking-wider text-muted-foreground">English word</p>
              <p className="mt-3 text-5xl font-bold tracking-tight md:text-6xl">{word.en}</p>
              <p className="mt-3 text-sm text-muted-foreground">Read it out loud, then tap below to see the Spanish version.</p>
              <button
                type="button"
                onClick={goSpanish}
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-mint hover:scale-105 transition"
              >
                Show Spanish <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="mt-8 text-center">
                <p className="text-sm uppercase tracking-wider text-muted-foreground">Spanish</p>
                <p className="mt-3 text-5xl font-bold tracking-tight md:text-6xl">{word.es}</p>
                <p className="mt-2 text-base text-muted-foreground italic">"{word.en}"</p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-accent/10 px-4 py-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-accent">Pronunciation</span>
                  <span className="font-mono text-base font-bold text-foreground">{guide}</span>
                </div>

                {ttsSupported && (
                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={() => speakSpanish(word.es)}
                      className="inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground transition hover:bg-primary hover:text-primary-foreground"
                    >
                      <Volume2 className="h-4 w-4" /> Hear it
                    </button>
                  </div>
                )}
              </div>

              {sttSupported ? (
                <div className="mt-8 flex flex-col items-center">
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
                    {listening ? "Listening… speak now" : result ? "Got it!" : "Tap and say the Spanish word"}
                  </p>
                </div>
              ) : (
                <div className="mt-8 rounded-2xl bg-secondary p-4 text-center text-sm text-muted-foreground">
                  Voice recognition isn't supported in this browser. Use Chrome, Edge, or Safari to practice pronunciation.
                  <div className="mt-3">
                    <button onClick={nextWord} className="rounded-full bg-foreground px-5 py-2 font-semibold text-background hover:scale-105 transition">
                      Next word →
                    </button>
                  </div>
                </div>
              )}

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
                      {result.verdict === "great" ? "✅" : result.verdict === "good" ? "👍" : "❌"}
                    </div>
                    <div className="flex-1">
                      <p className={`text-lg font-bold ${
                        result.verdict === "great" ? "text-primary" : result.verdict === "good" ? "text-warning-foreground" : "text-accent"
                      }`}>
                        {result.verdict === "great" ? "¡Perfecto! Move on 🎉" : result.verdict === "good" ? "Close — try once more!" : "Not quite — listen and try again"}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        I heard: <span className="font-semibold text-foreground">"{result.transcript || "—"}"</span>
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Correct: <span className="font-semibold text-foreground">{word.es}</span>{" "}
                        <span className="font-mono text-xs text-accent">[{guide}]</span>
                      </p>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full ${
                            result.verdict === "great" ? "bg-primary" : result.verdict === "good" ? "bg-warning" : "bg-accent"
                          }`}
                          style={{ width: `${Math.round(result.score * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    {result.verdict !== "great" && (
                      <button
                        onClick={() => { speakSpanish(word.es); setResult(null); }}
                        className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-semibold shadow-soft hover:scale-105 transition"
                      >
                        <Volume2 className="h-4 w-4" /> Hear & retry
                      </button>
                    )}
                    <button
                      onClick={nextWord}
                      className="rounded-full bg-foreground px-5 py-2.5 font-semibold text-background hover:scale-105 transition"
                    >
                      {idx + 1 >= queue.length ? "Finish" : "Next word →"}
                    </button>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
        <img src={mascot} alt="" className="h-8 w-8" />
        <span>✓ {score.correct}</span>
        <span>✗ {score.total - score.correct}</span>
      </div>
    </main>
  );
}
