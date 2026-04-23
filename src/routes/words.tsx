import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CATEGORIES, WORDS, type Category, type Word } from "@/lib/hoplingo-data";
import { useStats, recordAnswer } from "@/lib/hoplingo-store";
import { masteryScore } from "@/lib/hoplingo-data";

export const Route = createFileRoute("/words")({
  head: () => ({
    meta: [
      { title: "Word Bank — HopLingo" },
      { name: "description", content: "Browse every Spanish word with answers and built-in MCQ quizzes." },
      { property: "og:title", content: "HopLingo Word Bank" },
      { property: "og:description", content: "Study every word with translations, examples, and MCQ practice." },
    ],
  }),
  component: WordBank,
});

// Deterministic 4-option MCQ generator (stable per word)
function buildMCQ(word: Word, pool: Word[]): { options: Word[]; correctIdx: number } {
  // pick 3 distractors from same category if possible, else any
  const sameCat = pool.filter((w) => w.id !== word.id && w.category === word.category);
  const others = pool.filter((w) => w.id !== word.id && w.category !== word.category);
  const candidates = [...sameCat, ...others];
  // simple seeded shuffle using id char sum so each word has a stable MCQ on render
  const seed = word.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const distractors = candidates
    .map((w, i) => ({ w, k: ((i + 1) * 9301 + seed * 49297) % 233280 }))
    .sort((a, b) => a.k - b.k)
    .slice(0, 3)
    .map((x) => x.w);
  const all = [...distractors, word];
  const ordered = all
    .map((w, i) => ({ w, k: ((i + 7) * 1103 + seed * 12345) % 23456 }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.w);
  return { options: ordered, correctIdx: ordered.findIndex((o) => o.id === word.id) };
}

function WordBank() {
  const stats = useStats();
  const [filter, setFilter] = useState<Category | "all">("all");
  const [direction, setDirection] = useState<"es-en" | "en-es">("es-en");
  const [showAnswers, setShowAnswers] = useState(true);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Record<string, number>>({});

  const filtered = useMemo(() => {
    return WORDS.filter((w) => filter === "all" || w.category === filter).filter((w) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return w.es.toLowerCase().includes(q) || w.en.toLowerCase().includes(q);
    });
  }, [filter, query]);

  const counts = useMemo(() => {
    const map = new Map<Category | "all", number>();
    map.set("all", WORDS.length);
    for (const c of CATEGORIES) map.set(c.key, WORDS.filter((w) => w.category === c.key).length);
    return map;
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Word Bank</p>
          <h1 className="mt-1 text-4xl font-bold md:text-5xl">Every word, every answer 📖</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Tap any option to test yourself. Answers and 4-choice MCQs are built in for every word.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-card p-1 shadow-soft">
          <button
            onClick={() => setDirection("es-en")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              direction === "es-en" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            ES → EN
          </button>
          <button
            onClick={() => setDirection("en-es")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              direction === "en-es" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            EN → ES
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search words…"
          className="w-full rounded-2xl border-2 border-border bg-card px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/20 sm:max-w-xs"
        />
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={showAnswers}
            onChange={(e) => setShowAnswers(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          Show answers
        </label>
      </div>

      {/* Category pills */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            filter === "all" ? "bg-primary text-primary-foreground shadow-mint" : "bg-card text-foreground/70 hover:bg-secondary"
          }`}
        >
          All · {counts.get("all")}
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setFilter(c.key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              filter === c.key ? "bg-primary text-primary-foreground shadow-mint" : "bg-card text-foreground/70 hover:bg-secondary"
            }`}
          >
            <span className="mr-1">{c.emoji}</span>
            {c.label} · {counts.get(c.key)}
          </button>
        ))}
      </div>

      <p className="mb-4 text-sm text-muted-foreground">{filtered.length} words shown</p>

      {/* Word grid with MCQ */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((w) => {
            const { options, correctIdx } = buildMCQ(w, WORDS);
            const prompt = direction === "es-en" ? w.es : w.en;
            const answer = direction === "es-en" ? w.en : w.es;
            const stat = stats[w.id];
            const mastery = masteryScore(stat);
            const userPick = picked[w.id];
            const answered = userPick !== undefined;

            function handlePick(i: number) {
              if (answered) return;
              setPicked((p) => ({ ...p, [w.id]: i }));
              const correct = i === correctIdx;
              recordAnswer(w.id, correct, "mc", 1500);
            }

            return (
              <motion.article
                key={w.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="rounded-3xl border border-border bg-gradient-card p-5 shadow-soft"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {CATEGORIES.find((c) => c.key === w.category)?.emoji} {w.category}
                    </p>
                    <h3 className="mt-1 text-3xl font-bold tracking-tight">{prompt}</h3>
                    {showAnswers && (
                      <p className="mt-1 text-sm text-primary">
                        = <span className="font-semibold">{answer}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase text-secondary-foreground">
                      L{w.difficulty}
                    </span>
                    {stat && (
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        Mastery {mastery}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Pick the right answer
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {options.map((opt, i) => {
                      const text = direction === "es-en" ? opt.en : opt.es;
                      const isCorrect = i === correctIdx;
                      const isPicked = userPick === i;
                      let cls = "border-border bg-card hover:-translate-y-0.5 hover:border-primary";
                      if (answered) {
                        if (isCorrect) cls = "border-primary bg-primary/15 text-primary";
                        else if (isPicked) cls = "border-accent bg-accent/15 text-accent";
                        else cls = "border-border bg-muted text-muted-foreground";
                      }
                      return (
                        <button
                          key={opt.id}
                          disabled={answered}
                          onClick={() => handlePick(i)}
                          className={`rounded-xl border-2 px-3 py-2 text-left text-sm font-semibold transition-all ${cls}`}
                        >
                          <span className="mr-1 text-xs opacity-60">{String.fromCharCode(65 + i)}.</span>
                          {text}
                          {answered && isCorrect && <span className="ml-1">✓</span>}
                          {answered && isPicked && !isCorrect && <span className="ml-1">✗</span>}
                        </button>
                      );
                    })}
                  </div>
                  {answered && (
                    <button
                      onClick={() => setPicked((p) => {
                        const n = { ...p };
                        delete n[w.id];
                        return n;
                      })}
                      className="mt-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
                    >
                      ↻ Try again
                    </button>
                  )}
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </div>
    </main>
  );
}
