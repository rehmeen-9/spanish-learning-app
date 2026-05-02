import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import mascot from "@/assets/chispa-parrot.png";
import { useAppState, getOverallStats } from "@/lib/hoplingo-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Chispa — Learn Spanish with a tropical parrot" },
      { name: "description", content: "Smart Spanish learning with spaced repetition. Build streaks, master categories, and watch your progress spark." },
      { property: "og:title", content: "Chispa — Spanish learning with a spark" },
      { property: "og:description", content: "Half-life regression keeps every Spanish word fresh exactly when you need it." },
    ],
  }),
  component: Index,
});

const features = [
  { emoji: "🧠", title: "Memory half-life", desc: "Every word has its own forgetting curve. We surface it just before you forget." },
  { emoji: "🎯", title: "Smart prompts", desc: "Multiple choice, type-the-translation, ES↔EN — chosen by what you need." },
  { emoji: "📈", title: "Track weak areas", desc: "See exactly which categories and words need more love. No guessing." },
  { emoji: "🔥", title: "Streaks & XP", desc: "Daily goals, fire streaks, and XP keep momentum alive." },
];

function Index() {
  const s = useAppState();
  const stats = getOverallStats(s);
  return (
    <main>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute right-10 top-40 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24 lg:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col justify-center"
          >
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Spanish · {stats.totalWords} words
            </span>
            <h1 className="mt-5 text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
              Learn Spanish with{" "}
              <span className="text-gradient-berry">Chispa the Parrot</span>{" "}
              <span className="inline-block animate-wiggle">🦜</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              Chispa schedules every word right when your memory needs it —
              using a half-life regression model. The more you practice, the
              better Chispa learns <em>your</em> pace.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/practice"
                search={{ level: 1 }}
                className="group inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 font-semibold text-accent-foreground shadow-pop transition-all hover:scale-105 hover:shadow-pop"
              >
                Start practicing
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-card px-7 py-3.5 font-semibold text-foreground shadow-soft transition-all hover:scale-105 hover:bg-secondary"
              >
                See dashboard
              </Link>
            </div>
            <div className="mt-8 flex gap-6 text-sm">
              <div>
                <div className="text-2xl font-bold text-primary">{stats.mastered}</div>
                <div className="text-xs text-muted-foreground">words mastered</div>
              </div>
              <div className="h-10 w-px bg-border" />
              <div>
                <div className="text-2xl font-bold text-accent">{stats.accuracy}%</div>
                <div className="text-xs text-muted-foreground">accuracy</div>
              </div>
              <div className="h-10 w-px bg-border" />
              <div>
                <div className="text-2xl font-bold text-warning-foreground">{s.streak}</div>
                <div className="text-xs text-muted-foreground">day streak</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative flex items-center justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 -z-10 rounded-full bg-gradient-mint blur-3xl opacity-30 animate-pulse" />
              <img
                src={mascot}
                alt="Chispa the parrot mascot"
                width={420}
                height={420}
                className="h-80 w-80 animate-float md:h-[420px] md:w-[420px]"
              />
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="absolute -right-4 top-12 rounded-2xl rounded-tl-sm bg-card px-4 py-3 shadow-pop"
              >
                <p className="text-sm font-medium">¡Hola! Ready to learn? 🌟</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="absolute -left-2 bottom-16 rounded-2xl rounded-bl-sm bg-primary px-4 py-3 shadow-mint"
              >
                <p className="text-sm font-semibold text-primary-foreground">+10 XP 🎉</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* VOCAB TRAINER */}
      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent">
              🔤 Trainer
            </span>
            <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
              Learn it. <span className="text-gradient-berry">Remember it.</span>
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Bilingual vocab flow with a smart memory curve — review what you're about to forget, ignore what you've nailed.
            </p>
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-1">
          <motion.div whileHover={{ y: -6 }} className="rounded-3xl border border-border bg-gradient-card p-7 shadow-soft transition-shadow hover:shadow-mint">
            <div className="text-4xl">🔤</div>
            <h3 className="mt-4 text-2xl font-bold">Vocab Trainer</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Duolingo-style bilingual flow — see the English word, reveal Spanish with a phonetic guide (e.g. "gato" → GAH-toh), then say it.
            </p>
            <Link to="/vocab" className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-semibold text-accent-foreground shadow-pop transition hover:scale-105">
              Open trainer →
            </Link>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
        <div className="mb-12 max-w-2xl">
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
            Designed for <span className="text-gradient-mint">how memory actually works</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            No cramming. No guessing. Just the right word, at the right moment.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              whileHover={{ y: -6 }}
              className="rounded-3xl border border-border bg-gradient-card p-6 shadow-soft transition-shadow hover:shadow-mint"
            >
              <div className="text-4xl">{f.emoji}</div>
              <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-mint p-10 shadow-mint md:p-16">
          <div className="absolute -right-10 -top-10 text-[12rem] opacity-10">🦜</div>
          <div className="relative max-w-xl">
            <h3 className="text-3xl font-bold text-primary-foreground md:text-4xl">
              Ready to light the spark today?
            </h3>
            <p className="mt-3 text-primary-foreground/90">
              5 minutes a day with Chispa beats 60 minutes of cramming. Promise.
            </p>
            <Link
              to="/practice"
              search={{ level: 1 }}
              className="mt-6 inline-flex rounded-full bg-card px-7 py-3.5 font-semibold text-foreground shadow-pop transition hover:scale-105"
            >
              Start a level →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
