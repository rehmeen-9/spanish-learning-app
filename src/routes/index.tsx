import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import mascot from "@/assets/chispa-parrot.png";
import { useAppState, getOverallStats } from "@/lib/hoplingo-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Chispa — Aprende español con un loro tropical" },
      { name: "description", content: "Aprendizaje inteligente del español con repetición espaciada. Lleva tu racha, domina categorías y ve tu progreso brillar." },
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
              Español · {stats.totalWords} palabras
            </span>
            <h1 className="mt-5 text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
              Aprende español con{" "}
              <span className="text-gradient-berry">Chispa el Loro</span>{" "}
              <span className="inline-block animate-wiggle">🦜</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              Chispa programa cada palabra justo cuando tu memoria la necesita —
              usando un modelo de half-life regression. Cuanto más practicas,
              mejor aprende Chispa <em>tu</em> ritmo.
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
                <p className="text-sm font-medium">¡Hola! Listo para aprender? 🌟</p>
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

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
        <div className="mb-12 max-w-2xl">
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
            Diseñado para <span className="text-gradient-mint">cómo realmente funciona la memoria</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Sin atascarte. Sin adivinar. Solo la palabra correcta, en el momento correcto.
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
              ¿Listo para encender la chispa hoy?
            </h3>
            <p className="mt-3 text-primary-foreground/90">
              5 minutos al día con Chispa rinden más que 60 minutos de cramming. Promesa.
            </p>
            <Link
              to="/practice"
              search={{ level: 1 }}
              className="mt-6 inline-flex rounded-full bg-card px-7 py-3.5 font-semibold text-foreground shadow-pop transition hover:scale-105"
            >
              Empezar un nivel →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
