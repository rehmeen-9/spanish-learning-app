import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CATEGORIES, WORDS } from "@/lib/hoplingo-data";
import {
  ACHIEVEMENTS,
  getCategoryMastery,
  getDailyXP,
  getOverallStats,
  useAppState,
} from "@/lib/hoplingo-store";
import { ProgressRing } from "@/components/ProgressRing";
import { StatCard } from "@/components/StatCard";
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — HopLingo" },
      { name: "description", content: "Your daily streak, mastery breakdown, achievements and learning velocity at a glance." },
      { property: "og:title", content: "HopLingo Dashboard" },
      { property: "og:description", content: "Streaks, mastery, and milestones." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const s = useAppState();
  const stats = getOverallStats(s);
  const mastery = getCategoryMastery(s);
  const daily = getDailyXP(s, 7);
  const todayPct = Math.min(100, (s.todayXP / s.dailyGoal) * 100);
  const overallPct = Math.round((stats.mastered / stats.totalWords) * 100);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Bienvenido de vuelta</p>
          <h1 className="mt-1 text-4xl font-bold md:text-5xl">Tu día con Chispa 🦜</h1>
        </div>
        <Link
          to="/practice"
          search={{ level: 1 }}
          className="rounded-full bg-accent px-6 py-3 font-semibold text-accent-foreground shadow-pop hover:scale-105 transition"
        >
          Continue practice →
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Daily goal hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-border bg-gradient-card p-6 shadow-soft lg:col-span-1"
        >
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Daily goal</h3>
          <div className="mt-4 flex items-center justify-center">
            <ProgressRing
              value={todayPct}
              size={200}
              stroke={16}
              label={`${s.todayXP}`}
              sub={`/ ${s.dailyGoal} XP today`}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-2xl bg-warning/15 p-3">
              <div className="text-xl font-bold">🔥 {s.streak}</div>
              <div className="text-xs text-muted-foreground">day streak</div>
            </div>
            <div className="rounded-2xl bg-primary/15 p-3">
              <div className="text-xl font-bold text-primary">✨ {s.xp}</div>
              <div className="text-xs text-muted-foreground">total XP</div>
            </div>
          </div>
        </motion.div>

        {/* Stats grid + chart */}
        <div className="grid gap-5 lg:col-span-2 sm:grid-cols-2">
          <StatCard label="Words mastered" value={stats.mastered} sub={`of ${stats.totalWords} (${overallPct}%)`} icon="💎" accent="mint" delay={0.05} />
          <StatCard label="Accuracy" value={`${stats.accuracy}%`} sub={`${stats.correct}/${stats.totalAnswers} correct`} icon="🎯" accent="berry" delay={0.1} />
          <StatCard label="Words touched" value={stats.wordsTouched} sub="unique words seen" icon="📚" accent="honey" delay={0.15} />
          <StatCard label="Sessions" value={s.sessions.length} sub="answers logged" icon="⚡" accent="sky" delay={0.2} />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-3xl border border-border bg-card p-5 shadow-soft sm:col-span-2"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Last 7 days</h3>
              <Link to="/progress" className="text-xs font-semibold text-primary hover:underline">View full report →</Link>
            </div>
            <div className="mt-4 h-44">
              <ResponsiveContainer>
                <BarChart data={daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }}
                    cursor={{ fill: "var(--muted)" }}
                  />
                  <Bar dataKey="xp" fill="var(--primary)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Mastery breakdown */}
      <section className="mt-10">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold">Mastery by category</h2>
            <p className="text-sm text-muted-foreground">Qué tan bien Chispa cree que conoces cada tema.</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((cat, i) => {
            const m = mastery[cat.key] ?? { total: 0, learned: 0, avg: 0 };
            const total = WORDS.filter((w) => w.category === cat.key).length;
            return (
              <motion.div
                key={cat.key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-2xl border border-border bg-card p-5 shadow-soft"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{cat.emoji}</span>
                  <span className="text-xs font-semibold text-muted-foreground">{m.learned}/{total}</span>
                </div>
                <h4 className="mt-3 font-bold">{cat.label}</h4>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-mint transition-all duration-700"
                      style={{ width: `${m.avg}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold tabular-nums">{m.avg}%</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Achievements */}
      <section className="mt-10">
        <h2 className="text-2xl font-bold">Achievements</h2>
        <p className="text-sm text-muted-foreground">{s.achievements.length} of {ACHIEVEMENTS.length} unlocked</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ACHIEVEMENTS.map((a, i) => {
            const unlocked = s.achievements.includes(a.id);
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`relative overflow-hidden rounded-2xl border p-4 transition ${
                  unlocked
                    ? "border-primary/30 bg-gradient-card shadow-mint"
                    : "border-dashed border-border bg-muted/30 opacity-60"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${unlocked ? "bg-primary/15" : "bg-muted grayscale"}`}>
                    {a.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold">{a.label}</h4>
                      {unlocked && <span className="text-xs text-primary">✓</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">{a.desc}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
