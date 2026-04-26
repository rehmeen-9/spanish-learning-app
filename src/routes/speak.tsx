import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WORDS, CATEGORIES, type Word, type Category } from "@/lib/hoplingo-data";
import { useAppState, recordAnswer } from "@/lib/hoplingo-store";
import { speakSpanish, stopSpeaking, isSpeechSupported } from "@/lib/speak";
import {
  isRecognitionSupported,
  startRecognition,
  judgeMatch,
  normalizeForMatch,
  type ActiveRecognition,
} from "@/lib/listen";

export const Route = createFileRoute("/speak")({
  head: () => ({
    meta: [
      { title: "Listen & Speak — Chispa" },
      { name: "description", content: "Practice Spanish out loud with three modes: speak the translation, listen and translate, or repeat after Chispa." },
      { property: "og:title", content: "Listen & Speak with Chispa" },
      { property: "og:description", content: "Tune your Spanish pronunciation with forgiving, accent-friendly speech recognition." },
    ],
  }),
  component: SpeakPage,
});

type Mode = "speak-es" | "listen-en" | "repeat";

const MODES: { id: Mode; emoji: string; title: string; tagline: string }[] = [
  { id: "speak-es", emoji: "🗣️", title: "Speak the Spanish", tagline: "We show English. You say it in Spanish." },
  { id: "listen-en", emoji: "👂", title: "Listen & translate", tagline: "Hear Spanish. Say or type the English meaning." },
  { id: "repeat", emoji: "🔁", title: "Repeat after Chispa", tagline: "Mimic the Spanish word — accents are welcome." },
];

const ROUND_SIZE = 8;

function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function pickWords(category: Category | "all"): Word[] {
  const pool = category === "all" ? WORDS : WORDS.filter((w) => w.category === category);
  return shuffle(pool).slice(0, ROUND_SIZE);
}

function SpeakPage() {
  const s = useAppState();
  const [mode, setMode] = useState<Mode>("speak-es");
  const [category, setCategory] = useState<Category | "all">("all");
  const [round, setRound] = useState<Word[]>(() => pickWords("all"));
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const supportsTTS = isSpeechSupported();
  const supportsSR = isRecognitionSupported();

  const word = round[idx];
  const isLast = idx >= round.length;

  function startRound(nextMode: Mode = mode, nextCat: Category | "all" = category) {
    setMode(nextMode);
    setCategory(nextCat);
    setRound(pickWords(nextCat));
    setIdx(0);
    setScore({ correct: 0, total: 0 });
  }

  function handleResult(passed: boolean) {
    if (word) {
      recordAnswer(
        word.id,
        passed,
        mode === "speak-es" ? "en-es" : mode === "listen-en" ? "es-en" : "type",
        2000,
      );
    }
    setScore((sc) => ({ correct: sc.correct + (passed ? 1 : 0), total: sc.total + 1 }));
    setIdx((i) => i + 1);
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">New · Voice training</p>
        <h1 className="mt-1 text-4xl font-bold md:text-5xl">Listen & Speak 🦜</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Train your ear and your tongue. Chispa scores pronunciation leniently —
          slight accent differences are perfectly fine.
        </p>
      </div>

      {!supportsSR && (
        <div className="mb-6 rounded-2xl border border-warning/40 bg-warning/15 p-4 text-sm">
          ⚠️ Your browser doesn't support speech recognition. For best results use Chrome,
          Edge, or Safari on desktop / Android. You can still listen and type.
        </div>
      )}

      {/* Mode picker */}
      <div className="grid gap-3 sm:grid-cols-3">
        {MODES.map((m) => {
          const active = m.id === mode;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => startRound(m.id, category)}
              className={`group rounded-3xl border p-5 text-left transition shadow-soft ${
                active
                  ? "border-primary bg-primary/10 shadow-mint"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <div className="text-3xl">{m.emoji}</div>
              <div className="mt-2 font-bold">{m.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">{m.tagline}</div>
            </button>
          );
        })}
      </div>

      {/* Category filter */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category:</span>
        <button
          onClick={() => startRound(mode, "all")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
            category === "all" ? "bg-accent text-accent-foreground" : "bg-secondary text-foreground/70 hover:bg-secondary/80"
          }`}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => startRound(mode, c.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              category === c.key ? "bg-accent text-accent-foreground" : "bg-secondary text-foreground/70 hover:bg-secondary/80"
            }`}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Round · {Math.min(idx + 1, round.length)} / {round.length}
          </span>
          <span>
            ✅ {score.correct} / {score.total}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full bg-gradient-mint transition-all"
            style={{ width: `${(idx / round.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-8">
        {isLast ? (
          <RoundFinished
            score={score}
            onAgain={() => startRound(mode, category)}
            streak={s.streak}
          />
        ) : (
          <PromptCard
            key={`${mode}-${idx}-${word?.id}`}
            mode={mode}
            word={word}
            supportsSR={supportsSR}
            supportsTTS={supportsTTS}
            onDone={handleResult}
          />
        )}
      </div>
    </main>
  );
}

function RoundFinished({ score, streak, onAgain }: { score: { correct: number; total: number }; streak: number; onAgain: () => void }) {
  const pct = score.total ? Math.round((score.correct / score.total) * 100) : 0;
  const emoji = pct >= 80 ? "🏆" : pct >= 50 ? "🦜" : "🌱";
  return (
    <div className="flex flex-col items-center rounded-3xl bg-gradient-card p-10 text-center shadow-soft">
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-6xl">
        {emoji}
      </motion.div>
      <h2 className="mt-4 text-3xl font-bold">¡Bien dicho!</h2>
      <p className="mt-1 text-muted-foreground">
        You got {score.correct} / {score.total} ({pct}%)
      </p>
      <div className="mt-6 grid grid-cols-3 gap-3">
        <Stat label="Spoken" value={String(score.total)} />
        <Stat label="Accuracy" value={`${pct}%`} />
        <Stat label="Streak" value={`🔥 ${streak}`} />
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={onAgain}
          className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-mint hover:scale-105 transition"
        >
          Another round →
        </button>
        <Link
          to="/dashboard"
          className="rounded-full bg-card px-6 py-3 font-semibold text-foreground shadow-soft hover:scale-105 transition"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-soft">
      <div className="text-xl font-bold text-primary">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

interface PromptCardProps {
  mode: Mode;
  word: Word;
  supportsSR: boolean;
  supportsTTS: boolean;
  onDone: (passed: boolean) => void;
}

function PromptCard({ mode, word, supportsSR, supportsTTS, onDone }: PromptCardProps) {
  const [listening, setListening] = useState(false);
  const [partial, setPartial] = useState("");
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState<{ passed: boolean; verdict: string; score: number } | null>(null);
  const [typed, setTyped] = useState("");
  const [revealed, setRevealed] = useState(false);
  const recRef = useRef<ActiveRecognition | null>(null);
  const autoSpokeRef = useRef(false);

  const expected = mode === "listen-en" ? word.en : word.es;
  const recogLang = mode === "listen-en" ? "en-US" : "es-ES";

  // Auto-play Spanish for listen mode
  useEffect(() => {
    if (mode === "listen-en" && supportsTTS && !autoSpokeRef.current) {
      autoSpokeRef.current = true;
      // small delay so the card mounts first
      const t = setTimeout(() => speakSpanish(word.es), 250);
      return () => clearTimeout(t);
    }
    return () => {};
  }, [mode, word.es, supportsTTS]);

  useEffect(() => {
    return () => {
      stopSpeaking();
      recRef.current?.abort();
    };
  }, []);

  async function startListening() {
    if (!supportsSR || listening) return;
    setTranscript("");
    setPartial("");
    setFeedback(null);
    setListening(true);
    const session = startRecognition({
      lang: recogLang,
      onPartial: (t) => setPartial(t),
    });
    recRef.current = session;
    try {
      const final = await session.promise;
      const said = final || partial;
      setTranscript(said);
      const judged = judgeMatch(said, expected);
      setFeedback({ passed: judged.passed, verdict: judged.verdict, score: judged.score });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedback({
        passed: false,
        verdict: msg === "no-speech" ? "We didn't hear anything — try again" : `Mic error: ${msg}`,
        score: 0,
      });
    } finally {
      setListening(false);
      recRef.current = null;
    }
  }

  function stopListening() {
    recRef.current?.stop();
  }

  function submitTyped() {
    const judged = judgeMatch(typed, expected);
    setTranscript(typed);
    setFeedback({ passed: judged.passed, verdict: judged.verdict, score: judged.score });
  }

  function next() {
    onDone(feedback?.passed ?? false);
  }

  const showSpeakBtn = supportsTTS;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-border bg-gradient-card p-6 shadow-soft sm:p-8"
    >
      {/* Prompt */}
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {mode === "speak-es" && "Say this in Spanish"}
        {mode === "listen-en" && "What did Chispa say? (English)"}
        {mode === "repeat" && "Repeat after Chispa"}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {mode === "speak-es" && (
          <h2 className="text-3xl font-bold sm:text-4xl">{word.en}</h2>
        )}
        {mode === "repeat" && (
          <h2 className="text-3xl font-bold sm:text-4xl">{word.es}</h2>
        )}
        {mode === "listen-en" && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => speakSpanish(word.es)}
              className="rounded-full bg-primary px-5 py-3 text-base font-semibold text-primary-foreground shadow-mint hover:scale-105 transition"
            >
              🔊 Play again
            </button>
            <span className="text-sm text-muted-foreground">(audio only)</span>
          </div>
        )}
        {(mode === "speak-es" || mode === "repeat") && showSpeakBtn && (
          <button
            type="button"
            onClick={() => speakSpanish(word.es)}
            className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary/80 transition"
            aria-label="Hear it in Spanish"
          >
            🔊 Hear it
          </button>
        )}
      </div>

      {/* Mic / input area */}
      <div className="mt-8">
        {supportsSR ? (
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={listening ? stopListening : startListening}
              disabled={!!feedback}
              className={`relative flex h-24 w-24 items-center justify-center rounded-full text-3xl shadow-pop transition active:scale-95 disabled:opacity-50 ${
                listening
                  ? "bg-accent text-accent-foreground animate-pulse-glow"
                  : "bg-primary text-primary-foreground hover:scale-105"
              }`}
              aria-label={listening ? "Stop recording" : "Start recording"}
            >
              {listening ? "⏹️" : "🎙️"}
            </button>
            <p className="text-sm text-muted-foreground">
              {listening
                ? "Listening… speak now"
                : feedback
                  ? "Tap Next to continue"
                  : "Tap the mic and say it out loud"}
            </p>
            {(partial || transcript) && (
              <div className="mt-1 max-w-md rounded-2xl bg-secondary/60 px-4 py-2 text-center text-sm">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">You said</span>
                <div className="mt-1 font-medium">{transcript || partial}…</div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <label className="text-sm font-medium" htmlFor="typed">
              Type your answer
            </label>
            <input
              id="typed"
              autoFocus
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitTyped()}
              placeholder={mode === "listen-en" ? "in English…" : "en español…"}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none ring-primary/30 focus:ring-4"
            />
            <button
              type="button"
              onClick={submitTyped}
              disabled={!typed.trim() || !!feedback}
              className="rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground shadow-mint disabled:opacity-50"
            >
              Check
            </button>
          </div>
        )}
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mt-6 rounded-2xl p-5 ${feedback.passed ? "bg-primary/15" : "bg-accent/15"}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className={`text-lg font-bold ${feedback.passed ? "text-primary" : "text-accent"}`}>
                  {feedback.passed
                    ? feedback.verdict === "perfect"
                      ? "Perfect! 🎯"
                      : feedback.verdict === "great"
                        ? "Great pronunciation! ✨"
                        : "Close enough — nice! 👍"
                    : "Not quite 💔"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Expected:{" "}
                  <span className="font-semibold text-foreground">{expected}</span>
                  {" · "}
                  Match: {Math.round(feedback.score * 100)}%
                </p>
                {!feedback.passed && (
                  <button
                    type="button"
                    onClick={() => setRevealed((r) => !r)}
                    className="mt-2 text-xs font-semibold text-primary underline-offset-2 hover:underline"
                  >
                    {revealed ? "Hide" : "Show both"}
                  </button>
                )}
                {revealed && (
                  <div className="mt-2 text-sm">
                    <div>🇪🇸 <span className="font-semibold">{word.es}</span></div>
                    <div>🇬🇧 <span className="font-semibold">{word.en}</span></div>
                    <div className="text-xs text-muted-foreground">heard: {normalizeForMatch(transcript) || "—"}</div>
                  </div>
                )}
              </div>
              <button
                onClick={next}
                className="rounded-full bg-foreground px-5 py-2.5 font-semibold text-background hover:scale-105 transition"
              >
                Next →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
