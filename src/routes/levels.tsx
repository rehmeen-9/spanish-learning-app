import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Lock, CheckCircle2 } from "lucide-react";
import { LEVELS, WORDS, CATEGORIES } from "@/lib/hoplingo-data";
import {
  useAppState,
  getLevelProgress,
  isLevelUnlocked,
  isCategoryUnlocked,
  LEVEL_UNLOCK_THRESHOLD,
} from "@/lib/hoplingo-store";

export const Route = createFileRoute("/levels")({
  head: () => ({
    meta: [
      { title: "Niveles — Chispa" },
      { name: "description", content: "Avanza por 6 niveles con grupos de categorías. Domina cada grupo para desbloquear el siguiente." },
      { property: "og:title", content: "Niveles de Chispa" },
      { property: "og:description", content: "Brote, Chispa, Explorador, Viajero, Lingüista, Maestro." },
    ],
  }),
  component: LevelsPage,
});

function LevelsPage() {
  const s = useAppState();
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-10">
        <h1 className="text-4xl font-bold md:text-5xl">Levels</h1>
        <p className="mt-2 text-muted-foreground">
          Each level has category groups. Reach {LEVEL_UNLOCK_THRESHOLD}% mastery on a group to unlock the next one.
        </p>
      </div>

      <div className="space-y-6">
        {LEVELS.map((lvl, i) => {
          const unlocked = isLevelUnlocked(s, lvl.id);
          const prog = getLevelProgress(s, lvl.id);
          const wordsInLvl = WORDS.filter((w) => lvl.categories.includes(w.category));

          return (
            <motion.section
              key={lvl.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-3xl border border-border bg-gradient-card p-6 shadow-soft md:p-8 ${
                unlocked ? "" : "opacity-70"
              }`}
            >
              {/* Level header */}
              <div className="flex flex-wrap items-center gap-4">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold ${
                    unlocked
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {unlocked ? lvl.id : <Lock className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-[200px]">
                  <h2 className="text-2xl font-bold md:text-3xl">
                    Level {lvl.id} · {lvl.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {wordsInLvl.length} words · {lvl.categories.length} group
                    {lvl.categories.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    Mastery
                  </div>
                  <div className="text-2xl font-bold">{prog.avg}%</div>
                </div>
              </div>

              {/* Mastery bar */}
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-mint transition-all duration-700"
                  style={{ width: `${prog.avg}%` }}
                />
              </div>

              {!unlocked && (
                <p className="mt-4 rounded-2xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
                  🔒 Reach {LEVEL_UNLOCK_THRESHOLD}% mastery on Level {lvl.id - 1} to unlock.
                </p>
              )}

              {/* Category groups */}
              {unlocked && (
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {prog.perCategory.map((c, ci) => {
                    const meta = CATEGORIES.find((x) => x.key === c.category);
                    const catUnlocked = isCategoryUnlocked(s, lvl.id, c.category);
                    const completed = c.avg >= LEVEL_UNLOCK_THRESHOLD;
                    return (
                      <div
                        key={c.category}
                        className={`group relative rounded-2xl border-2 p-4 transition-all ${
                          completed
                            ? "border-primary/50 bg-primary/5"
                            : catUnlocked
                              ? "border-border bg-card hover:-translate-y-0.5 hover:border-primary hover:shadow-mint"
                              : "border-dashed border-border bg-muted/30"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-2xl">{meta?.emoji}</div>
                            <h3 className="mt-1 font-bold capitalize">
                              {meta?.label ?? c.category}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {c.mastered}/{c.total} mastered
                            </p>
                          </div>
                          {completed ? (
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          ) : !catUnlocked ? (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <span className="text-xs font-bold text-muted-foreground">
                              {ci + 1}
                            </span>
                          )}
                        </div>

                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              completed ? "bg-primary" : "bg-gradient-mint"
                            }`}
                            style={{ width: `${c.avg}%` }}
                          />
                        </div>

                        {catUnlocked ? (
                          <Link
                            to="/practice"
                            search={{ level: lvl.id, category: c.category }}
                            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-primary py-2 text-sm font-semibold text-primary-foreground shadow-mint transition hover:scale-[1.02]"
                          >
                            {completed ? "Review" : "Practice"} →
                          </Link>
                        ) : (
                          <div className="mt-3 rounded-full bg-muted py-2 text-center text-xs text-muted-foreground">
                            Finish previous group to unlock
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Practice all */}
              {unlocked && lvl.categories.length > 1 && (
                <div className="mt-5 flex justify-end">
                  <Link
                    to="/practice"
                    search={{ level: lvl.id }}
                    className="rounded-full bg-card px-5 py-2 text-sm font-semibold shadow-soft transition hover:-translate-y-0.5"
                  >
                    Mixed practice (all groups) →
                  </Link>
                </div>
              )}
            </motion.section>
          );
        })}
      </div>
    </main>
  );
}
