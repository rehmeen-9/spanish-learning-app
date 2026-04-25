import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from "recharts";
import {
  CATEGORIES,
  WORDS,
  recallProbability,
  masteryScore,
  type Category,
} from "@/lib/hoplingo-data";
import {
  getCategoryMastery,
  getDailyXP,
  getOverallStats,
  resetProgress,
  useAppState,
} from "@/lib/hoplingo-store";
import { StatCard } from "@/components/StatCard";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Reporte de progreso — Chispa" },
      { name: "description", content: "Analítica detallada: radar de dominio, curvas de olvido, mapa de precisión, palabras débiles y velocidad de aprendizaje." },
      { property: "og:title", content: "Reporte de progreso Chispa" },
      { property: "og:description", content: "Analítica profunda de tu camino aprendiendo español." },
    ],
  }),
  component: ProgressReport,
});

const RANGES = [
  { key: 7, label: "7d" },
  { key: 14, label: "14d" },
  { key: 30, label: "30d" },
] as const;

function ProgressReport() {
  const s = useAppState();
  const stats = getOverallStats(s);
  const masteryMap = getCategoryMastery(s);
  const [range, setRange] = useState<7 | 14 | 30>(14);
  const daily = getDailyXP(s, range);

  // Radar
  const radar = CATEGORIES.map((c) => ({
    cat: c.label,
    mastery: masteryMap[c.key]?.avg ?? 0,
    accuracy: (() => {
      const ws = WORDS.filter((w) => w.category === c.key);
      const ids = new Set(ws.map((w) => w.id));
      const sess = s.sessions.filter((x) => ids.has(x.wordId));
      return sess.length ? Math.round((sess.filter((x) => x.correct).length / sess.length) * 100) : 0;
    })(),
  }));

  // Forgetting curve simulation for top words
  const tracked = useMemo(() => {
    return WORDS.map((w) => {
      const stat = s.stats[w.id];
      return { w, stat, p: recallProbability(stat), m: masteryScore(stat) };
    }).filter((x) => x.stat);
  }, [s.stats]);

  const weakWords = useMemo(
    () =>
      tracked
        .filter((x) => x.stat!.seen >= 1)
        .sort((a, b) => a.m - b.m)
        .slice(0, 10),
    [tracked]
  );

  const masteredWords = useMemo(
    () => tracked.filter((x) => x.m >= 80).slice(0, 5),
    [tracked]
  );

  // forgetting curve next 72 hours, average over 5 most-practiced words
  const curveSource = useMemo(() => {
    const top = [...tracked].sort((a, b) => (b.stat?.seen ?? 0) - (a.stat?.seen ?? 0)).slice(0, 5);
    const points: { hour: number; recall: number }[] = [];
    for (let h = 0; h <= 72; h += 4) {
      const now = Date.now() + h * 36e5;
      const avg =
        top.length === 0
          ? Math.pow(2, -h / 24) * 100
          : (top.reduce((acc, x) => acc + recallProbability(x.stat, now), 0) / top.length) * 100;
      points.push({ hour: h, recall: Math.round(avg) });
    }
    return points;
  }, [tracked]);

  // Accuracy heatmap: 7 days x 24 hours
  const heat = useMemo(() => {
    const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    s.sessions.slice(-500).forEach((x) => {
      const d = new Date(x.ts);
      const day = (d.getDay() + 6) % 7;
      grid[day][d.getHours()] += 1;
    });
    return grid;
  }, [s.sessions]);
  const maxHeat = Math.max(1, ...heat.flat());
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // mode breakdown
  const modeStats = useMemo(() => {
    const m: Record<string, { total: number; correct: number; ms: number }> = {};
    s.sessions.forEach((x) => {
      m[x.mode] = m[x.mode] ?? { total: 0, correct: 0, ms: 0 };
      m[x.mode].total += 1;
      if (x.correct) m[x.mode].correct += 1;
      m[x.mode].ms += x.ms;
    });
    return [
      { mode: "Multiple choice", key: "mc" },
      { mode: "Type answer", key: "type" },
      { mode: "ES → EN", key: "es-en" },
      { mode: "EN → ES", key: "en-es" },
    ].map((row) => {
      const r = m[row.key] ?? { total: 0, correct: 0, ms: 0 };
      return {
        ...row,
        total: r.total,
        accuracy: r.total ? Math.round((r.correct / r.total) * 100) : 0,
        avgMs: r.total ? Math.round(r.ms / r.total) : 0,
      };
    });
  }, [s.sessions]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">Progress report</p>
          <h1 className="mt-1 text-4xl font-bold md:text-5xl">Deep dive 📊</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            How well you remember, when you study best, where you struggle, and what to review next — all from your sessions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-full bg-muted p-1">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  range === r.key ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              if (confirm("Reset all progress? This can't be undone.")) resetProgress();
            }}
            className="rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-muted-foreground hover:text-destructive"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Mastered" value={`${stats.mastered}/${stats.totalWords}`} sub={`${Math.round((stats.mastered/stats.totalWords)*100)}% complete`} icon="💎" accent="mint" />
        <StatCard label="Accuracy" value={`${stats.accuracy}%`} sub={`${stats.correct}/${stats.totalAnswers}`} icon="🎯" accent="berry" delay={0.05} />
        <StatCard label="Avg recall now" value={`${tracked.length ? Math.round(tracked.reduce((a, x) => a + x.p, 0) / tracked.length * 100) : 0}%`} sub="across studied words" icon="🧠" accent="honey" delay={0.1} />
        <StatCard label="Words to review" value={tracked.filter((x) => x.p < 0.6).length} sub="below 60% recall" icon="⏰" accent="sky" delay={0.15} />
      </div>

      {/* XP trend + radar */}
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-border bg-card p-5 shadow-soft lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold">Learning velocity</h3>
              <p className="text-xs text-muted-foreground">XP earned per day · last {range} days</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={daily}>
                <defs>
                  <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
                <Area type="monotone" dataKey="xp" stroke="var(--primary)" strokeWidth={3} fill="url(#xpGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <h3 className="font-bold">Skill radar</h3>
          <p className="text-xs text-muted-foreground">Mastery vs accuracy by category</p>
          <div className="h-64">
            <ResponsiveContainer>
              <RadarChart data={radar}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="cat" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                <PolarRadiusAxis tick={{ fill: "var(--muted-foreground)", fontSize: 9 }} angle={90} domain={[0, 100]} />
                <Radar name="Mastery" dataKey="mastery" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.35} />
                <Radar name="Accuracy" dataKey="accuracy" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.25} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Forgetting curve + heatmap */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <h3 className="font-bold">Forgetting curve · next 72 hours</h3>
          <p className="text-xs text-muted-foreground">Predicted recall probability for your top-practiced words</p>
          <div className="mt-2 h-64">
            <ResponsiveContainer>
              <LineChart data={curveSource}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="hour" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} unit="h" />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} formatter={(v) => `${v}%`} />
                <Line type="monotone" dataKey="recall" stroke="var(--accent)" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <h3 className="font-bold">When you study</h3>
          <p className="text-xs text-muted-foreground">Activity heatmap by day × hour</p>
          <div className="mt-3 overflow-x-auto">
            <div className="inline-block">
              <div className="flex pl-10">
                {Array.from({ length: 24 }).map((_, h) => (
                  <div key={h} className="w-3 text-center text-[8px] text-muted-foreground">
                    {h % 6 === 0 ? h : ""}
                  </div>
                ))}
              </div>
              {heat.map((row, di) => (
                <div key={di} className="flex items-center">
                  <div className="w-10 text-[10px] text-muted-foreground">{dayLabels[di]}</div>
                  {row.map((v, hi) => {
                    const intensity = v / maxHeat;
                    return (
                      <div
                        key={hi}
                        className="m-px h-3 w-3 rounded-sm"
                        style={{
                          background:
                            intensity === 0
                              ? "var(--muted)"
                              : `color-mix(in oklab, var(--primary) ${20 + intensity * 80}%, transparent)`,
                        }}
                        title={`${dayLabels[di]} ${hi}:00 — ${v} answers`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>Less</span>
            {[0.1, 0.3, 0.6, 1].map((i) => (
              <div
                key={i}
                className="h-3 w-3 rounded-sm"
                style={{ background: `color-mix(in oklab, var(--primary) ${20 + i * 80}%, transparent)` }}
              />
            ))}
            <span>More</span>
          </div>
        </motion.div>
      </div>

      {/* Mode breakdown */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-soft">
        <h3 className="font-bold">Performance by quiz mode</h3>
        <p className="text-xs text-muted-foreground">Where you're strongest and where you're slow</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {modeStats.map((m) => (
            <div key={m.key} className="rounded-2xl bg-secondary/40 p-4">
              <div className="text-xs font-semibold uppercase text-muted-foreground">{m.mode}</div>
              <div className="mt-2 flex items-end justify-between">
                <div className="text-2xl font-bold">{m.accuracy}%</div>
                <div className="text-xs text-muted-foreground">{m.total} tries</div>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-gradient-mint" style={{ width: `${m.accuracy}%` }} />
              </div>
              <div className="mt-2 text-xs text-muted-foreground">avg {m.avgMs ? `${(m.avgMs/1000).toFixed(1)}s` : "—"}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Word tables */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <WordTable
          title="Needs review"
          subtitle="Lowest mastery — practice these next"
          rows={weakWords.map((x) => ({ word: x.w, mastery: x.m, recall: Math.round(x.p * 100), seen: x.stat!.seen, correct: x.stat!.correct }))}
          tone="warn"
        />
        <WordTable
          title="Mastered"
          subtitle="Strong recall · keep them fresh"
          rows={masteredWords.map((x) => ({ word: x.w, mastery: x.m, recall: Math.round(x.p * 100), seen: x.stat!.seen, correct: x.stat!.correct }))}
          tone="good"
        />
      </div>
    </main>
  );
}

interface Row {
  word: { es: string; en: string; category: Category };
  mastery: number;
  recall: number;
  seen: number;
  correct: number;
}

function WordTable({ title, subtitle, rows, tone }: { title: string; subtitle: string; rows: Row[]; tone: "good" | "warn" }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
      <h3 className="font-bold">{title}</h3>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
      {rows.length === 0 ? (
        <p className="mt-6 text-center text-sm text-muted-foreground">Practice some words to see this list.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="pb-2 font-medium">Word</th>
                <th className="pb-2 font-medium">Mastery</th>
                <th className="pb-2 text-right font-medium">Recall</th>
                <th className="pb-2 text-right font-medium">Acc</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.word.es} className="border-t border-border/60">
                  <td className="py-2.5">
                    <div className="font-semibold">{r.word.es}</div>
                    <div className="text-xs text-muted-foreground">{r.word.en} · {r.word.category}</div>
                  </td>
                  <td className="py-2.5 w-32">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full"
                          style={{
                            width: `${r.mastery}%`,
                            background: tone === "good" ? "var(--primary)" : "var(--accent)",
                          }}
                        />
                      </div>
                      <span className="w-8 text-right text-xs tabular-nums">{r.mastery}</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-right tabular-nums">{r.recall}%</td>
                  <td className="py-2.5 text-right tabular-nums">{r.seen ? Math.round((r.correct/r.seen)*100) : 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
