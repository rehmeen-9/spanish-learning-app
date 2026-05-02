import { Link, useLocation } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import mascot from "@/assets/chispa-parrot.png";
import { useAppState } from "@/lib/hoplingo-store";
import { useCurrentUser, signOut } from "@/lib/hoplingo-user";

const links = [
  { to: "/", label: "Home" },
  { to: "/levels", label: "Levels" },
  { to: "/vocab", label: "Vocab Trainer" },
  
  { to: "/words", label: "Word Bank" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/progress", label: "Progress" },
] as const;

export function SiteHeader() {
  const location = useLocation();
  const s = useAppState();
  const user = useCurrentUser();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const initial = (user ?? "?").charAt(0).toUpperCase();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative">
            <img src={mascot} alt="" width={40} height={40} className="h-10 w-10 transition-transform group-hover:animate-wiggle" />
            <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-primary animate-pulse-glow" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Chis<span className="text-gradient-berry">pa</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = location.pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  active
                    ? "bg-primary text-primary-foreground shadow-mint"
                    : "text-foreground/70 hover:bg-secondary hover:text-foreground"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-1.5 rounded-full bg-warning/15 px-3 py-1.5 text-sm font-semibold text-warning-foreground sm:flex">
            🔥 <span>{s.streak}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1.5 text-sm font-semibold text-accent">
            ✨ <span>{s.xp}</span>
          </div>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full bg-secondary px-2 py-1 pr-3 text-sm font-semibold text-foreground transition hover:bg-secondary/80"
              aria-haspopup="menu"
              aria-expanded={open}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                {initial}
              </span>
              <span className="hidden max-w-[8rem] truncate sm:inline">{user}</span>
            </button>
            {open && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-xl"
              >
                <div className="border-b border-border px-4 py-3">
                  <div className="text-xs text-muted-foreground">Signed in as</div>
                  <div className="truncate text-sm font-semibold">{user}</div>
                </div>
                <button
                  type="button"
                  className="block w-full px-4 py-2.5 text-left text-sm transition hover:bg-secondary"
                  onClick={() => {
                    setOpen(false);
                    signOut();
                  }}
                >
                  Switch user / Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <nav className="flex items-center gap-1 overflow-x-auto px-4 pb-3 md:hidden">
        {links.map((l) => {
          const active = location.pathname === l.to;
          return (
            <Link
              key={l.to}
              to={l.to}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                active ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground/70"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
