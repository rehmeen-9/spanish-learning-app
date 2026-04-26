import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LEVELS, WORDS, type Word } from "@/lib/hoplingo-data";
import { recordAnswer, useDueWords, useAppState } from "@/lib/hoplingo-store";
import { SpeakButton } from "@/components/SpeakButton";
import { stopSpeaking } from "@/lib/speak";

export const Route = createFileRoute("/practice")({
  validateSearch: (s: Record<string, unknown>): { level: number; category?: string } => ({
    level: typeof s.level === "number" ? s.level : Number(s.level) || 1,
    ...(typeof s.category === "string" ? { category: s.category } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Practice — Chispa" },
      { name: "description", content: "Smart Spanish quizzes that adapt to what you need to review." },
      { property: "og:title", content: "Practice with Chispa" },
      { property: "og:description", content: "Multiple choice, type-the-translation, ES↔EN — all adaptive." },
    ],
  }),
  component: Practice,
});

type Mode = "mc" | "type" | "es-en" | "en-es";

interface Q {
  word: Word;
  mode: Mode;
  options?: Word[];
  prompt: string;
  answer: string;
  promptLang: "es" | "en";
}

function buildQuestion(word: Word, pool: Word[], mode: Mode): Q {
  const promptLang: "es" | "en" = Math.random() > 0.5 ? "es" : "en";
  if (mode === "mc") {
    const distractors = pool.filter((w) => w.id !== word.id).sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [...distractors, word].sort(() => Math.random() - 0.5);
    return {
      word,
      mode,
      options,
      promptLang,
      prompt: promptLang === "es" ? word.es : word.en,
      answer: promptLang === "es" ? word.en : word.es,
    };
  }
  return {
    word,
    mode,
    promptLang,
    prompt: promptLang === "es" ? word.es : word.en,
    answer: promptLang === "es" ? word.en : word.es,
  };
}

function Practice() {
  const { level, category } = Route.useSearch();
  const lvl = LEVELS.find((l) => l.id === level) ?? LEVELS[0];
  const activeCats = category && lvl.categories.includes(category as never)
    ? [category as (typeof lvl.categories)[number]]
    : lvl.categories;
  const due = useDueWords(activeCats, 12);
  const pool = useMemo(() => WORDS.filter((w) => activeCats.includes(w.category)), [activeCats]);
  const s = useAppState();

  const [idx, setIdx] = useState(0);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<null | { correct: boolean; answer: string }>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [done, setDone] = useState(false);
  const startRef = useRef(Date.now());

  useEffect(() => {
    if (questions.length === 0 && due.length > 0) {
      // Teach MCQs first, then fill-in-the-blank (typing) questions
      const mcQs = due.map((w) => buildQuestion(w, pool, "mc"));
      const typeQs = due.map((w) => buildQuestion(w, pool, "type"));
      setQuestions([...mcQs, ...typeQs]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [due.length, pool.length]);

  // Stop any in-flight speech when leaving the page or moving to next question
  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  useEffect(() => {
    stopSpeaking();
  }, [idx]);

  const q = questions[idx];

  function normalize(text: string): string {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // strip accents (á→a, ñ→n)
      .replace(/[¿?¡!.,;:"'`()]/g, "") // strip punctuation
      .replace(/\s+/g, " ")
      .trim()
      .replace(/^(the|a|an|to|el|la|los|las|un|una|unos|unas)\s+/i, "");
  }

  function isAnswerCorrect(user: string, expected: string): boolean {
    const u = normalize(user);
    const e = normalize(expected);
    if (!u) return false;
    // Accept multiple acceptable answers separated by "/" or "," in the data
    const variants = e.split(/\s*[/,]\s*/).filter(Boolean);
    return variants.includes(u) || u === e;
  }

  function submit(answer: string) {
    if (!q || feedback) return;
    const correct = isAnswerCorrect(answer, q.answer);
    const ms = Date.now() - startRef.current;
    recordAnswer(q.word.id, correct, q.mode, ms);
    setFeedback({ correct, answer: q.answer });
    setScore((sc) => ({ correct: sc.correct + (correct ? 1 : 0), total: sc.total + 1 }));
  }

  function next() {
    setFeedback(null);
    setInput("");
    startRef.current = Date.now();
    if (idx + 1 >= questions.length) {
      setDone(true);
    } else {
      setIdx(idx + 1);
    }
  }

  if (done) {
    const pct = Math.round((score.correct / Math.max(score.total, 1)) * 100);
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-12 text-center">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-7xl">
          {pct >= 80 ? "🏆" : pct >= 50 ? "🦜" : "🌱"}
        </motion.div>
        <h2 className="mt-6 text-4xl font-bold">Well done!</h2>
        <p className="mt-2 text-muted-foreground">You got {score.correct} / {score.total} correct</p>
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="rounded-2xl bg-card p-4 shadow-soft">
            <div className="text-2xl font-bold text-primary">+{score.correct * 10 + (score.total - score.correct) * 2}</div>
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
            onClick={() => {
              setIdx(0);
              setQuestions([]);
              setScore({ correct: 0, total: 0 });
              setDone(false);
            }}
            className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-mint hover:scale-105 transition"
          >
            Practice again
          </button>
          <Link to="/dashboard" className="rounded-full bg-card px-6 py-3 font-semibold shadow-soft hover:scale-105 transition">
            See dashboard
          </Link>
        </div>
      </main>
    );
  }

  if (!q) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-muted-foreground">Loading words…</p>
      </main>
    );
  }

  const progress = ((idx + (feedback ? 1 : 0)) / questions.length) * 100;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      {/* Top bar */}
      <div className="mb-6 flex items-center gap-4">
        <Link to="/levels" className="text-sm text-muted-foreground hover:text-foreground">← Levels</Link>
        <div className="flex-1">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full bg-gradient-mint"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
        <span className="text-sm font-semibold text-muted-foreground">
          {idx + 1}/{questions.length}
        </span>
      </div>

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
          className="rounded-3xl border border-border bg-gradient-card p-8 shadow-soft md:p-10"
        >
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-secondary-foreground">
              {q.mode === "mc" ? "Choose" : "Type"} · {q.promptLang === "es" ? "ES → EN" : "EN → ES"}
            </span>
            <span className="text-xs text-muted-foreground">{q.word.category}</span>
          </div>
          <div className="mt-6 text-center">
            <p className="text-sm uppercase tracking-wider text-muted-foreground">Translate</p>
            <div className="mt-3 flex items-center justify-center gap-3">
              <p className="text-5xl font-bold tracking-tight md:text-6xl">{q.prompt}</p>
              {q.promptLang === "es" && <SpeakButton text={q.prompt} size="lg" />}
            </div>
          </div>

          {q.mode === "mc" && q.options ? (
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {q.options.map((opt) => {
                const text = q.promptLang === "es" ? opt.en : opt.es;
                const isCorrect = opt.id === q.word.id;
                const showColor = feedback ? (isCorrect ? "correct" : "neutral") : "idle";
                return (
                  <div key={opt.id} className="flex items-center gap-2">
                    <button
                      disabled={!!feedback}
                      onClick={() => submit(text)}
                      className={`flex-1 rounded-2xl border-2 p-4 text-left font-semibold transition-all ${
                        showColor === "correct"
                          ? "border-primary bg-primary/15 text-primary"
                          : showColor === "neutral"
                            ? "border-border bg-muted text-muted-foreground"
                            : "border-border bg-card hover:-translate-y-0.5 hover:border-primary hover:shadow-mint"
                      }`}
                    >
                      {text}
                    </button>
                    {q.promptLang === "en" && <SpeakButton text={opt.es} size="sm" />}
                  </div>
                );
              })}
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit(input);
              }}
              className="mt-8 space-y-3"
            >
              <input
                autoFocus
                value={input}
                disabled={!!feedback}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your answer…"
                className="w-full rounded-2xl border-2 border-border bg-card px-5 py-4 text-lg font-medium outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/20"
              />
              {!feedback && (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="w-full rounded-full bg-primary py-3 font-semibold text-primary-foreground shadow-mint transition hover:scale-[1.01] disabled:opacity-40"
                >
                  Check answer
                </button>
              )}
            </form>
          )}

          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-6 rounded-2xl p-5 ${feedback.correct ? "bg-primary/15" : "bg-accent/15"}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-lg font-bold ${feedback.correct ? "text-primary" : "text-accent"}`}>
                    {feedback.correct ? "Correct! 🎉" : "Not quite 💔"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Answer: <span className="font-semibold text-foreground">{feedback.answer}</span>
                  </p>
                </div>
                <button
                  onClick={next}
                  className="rounded-full bg-foreground px-5 py-2.5 font-semibold text-background hover:scale-105 transition"
                >
                  {idx + 1 >= questions.length ? "Finish" : "Next →"}
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
