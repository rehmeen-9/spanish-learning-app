import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { LEVELS, WORDS } from "@/lib/hoplingo-data";
import { useAppState, getCategoryMastery } from "@/lib/hoplingo-store";

export const Route = createFileRoute("/levels")({
  head: () => ({
    meta: [
      { title: "Levels — HopLingo" },
      { name: "description", content: "Hop through 6 levels from Sprout to Maestro. Each level focuses on themed Spanish vocabulary." },
      { property: "og:title", content: "HopLingo Levels" },
      { property: "og:description", content: "Sprout, Hopper, Explorer, Wanderer, Linguist, Maestro." },
    ],
  }),
  component: LevelsPage,
});

function LevelsPage() {
  const s = useAppState();
  const mastery = getCategoryMastery(s);
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-10">
        <h1 className="text-4xl font-bold md:text-5xl">Levels</h1>
        <p className="mt-2 text-muted-foreground">Six themed levels. Hop your way from Sprout to Maestro.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {LEVELS.map((lvl, i) => {
          const wordsInLvl = WORDS.filter((w) => lvl.categories.includes(w.category));
          const avg = lvl.categories.reduce((a, c) => a + (mastery[c]?.avg ?? 0), 0) / lvl.categories.length;
          return (
            <motion.div
              key={lvl.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="group relative overflow-hidden rounded-3xl border border-border bg-gradient-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-mint"
            >
              <div className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-xl font-bold text-primary">
                {lvl.id}
              </div>
              <h3 className="text-2xl font-bold">{lvl.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {wordsInLvl.length} words · {lvl.categories.join(", ")}
              </p>
              <div className="mt-5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Mastery</span>
                  <span className="font-semibold">{Math.round(avg)}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-mint transition-all duration-700"
                    style={{ width: `${avg}%` }}
                  />
                </div>
              </div>
              <Link
                to="/practice"
                search={{ level: lvl.id }}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 font-semibold text-primary-foreground shadow-mint transition hover:scale-[1.02]"
              >
                Practice this level →
              </Link>
            </motion.div>
          );
        })}
      </div>
    </main>
  );
}
