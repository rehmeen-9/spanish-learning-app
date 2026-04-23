import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  accent?: "mint" | "berry" | "honey" | "sky";
  delay?: number;
}

const accentMap = {
  mint: "from-primary/20 to-primary/5 text-primary",
  berry: "from-accent/20 to-accent/5 text-accent",
  honey: "from-warning/30 to-warning/5 text-warning-foreground",
  sky: "from-chart-5/30 to-chart-5/5 text-foreground",
};

export function StatCard({ label, value, sub, icon, accent = "mint", delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-soft"
    >
      <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${accentMap[accent]} blur-2xl opacity-60`} />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
          {icon && <span className="text-lg">{icon}</span>}
        </div>
        <div className="mt-2 text-3xl font-bold tracking-tight">{value}</div>
        {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
      </div>
    </motion.div>
  );
}
