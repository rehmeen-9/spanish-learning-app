import { useEffect, useState, type FormEvent } from "react";
import mascot from "@/assets/chispa-parrot.png";
import { signInUser, userExists, normalizeUsername } from "@/lib/hoplingo-user";
import { pickSpanishVoice, warmSpanishVoices } from "@/lib/speak";

function speakGreeting(name: string, returning: boolean) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const display = name.charAt(0).toUpperCase() + name.slice(1);
  const text = returning
    ? `¡Hola ${display}! ¡Bienvenido de nuevo! ¿Listo para un poco de español picante?`
    : `¡Hola ${display}! ¿Cómo estás? ¿Listo para un poco de español picante?`;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "es-ES";
    u.rate = 0.9;
    u.pitch = 1.18;
    u.volume = 1;
    const pick = pickSpanishVoice("es-ES");
    if (pick) u.voice = pick;
    window.speechSynthesis.speak(u);
  } catch {
    // ignore
  }
}

export function LoginGate() {
  const [name, setName] = useState("");
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    warmSpanishVoices();
  }, []);

  const trimmed = normalizeUsername(name);
  const exists = trimmed ? userExists(trimmed) : false;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!trimmed) {
      setHint("Please enter a username to continue.");
      return;
    }
    const result = signInUser(trimmed);
    // Speak greeting on user gesture (form submit) so browsers allow audio
    speakGreeting(result.username, !result.isNew);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-3xl border border-border/60 bg-card/90 p-8 shadow-xl backdrop-blur-xl"
      >
        <div className="flex flex-col items-center text-center">
          <img src={mascot} alt="" width={72} height={72} className="h-18 w-18 animate-wiggle" />
          <h1 className="mt-3 text-3xl font-bold tracking-tight">
            Welcome to Chis<span className="text-gradient-berry">pa</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter a username to get started. Your progress is saved per user on this device.
          </p>
        </div>

        <label className="mt-6 block text-sm font-medium" htmlFor="username">
          Username
        </label>
        <input
          id="username"
          autoFocus
          autoComplete="username"
          spellCheck={false}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setHint(null);
          }}
          onFocus={warmSpanishVoices}
          placeholder="e.g. parrot_friend"
          className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none ring-primary/30 transition focus:ring-4"
        />

        <div className="mt-2 min-h-[1.25rem] text-xs">
          {hint ? (
            <span className="text-destructive">{hint}</span>
          ) : trimmed ? (
            exists ? (
              <span className="text-primary">👋 Welcome back! Continuing your progress.</span>
            ) : (
              <span className="text-muted-foreground">✨ New user — starting a fresh adventure from zero.</span>
            )
          ) : null}
        </div>

        <button
          type="submit"
          className="mt-4 w-full rounded-full bg-primary py-3 text-base font-semibold text-primary-foreground shadow-mint transition hover:scale-[1.02] active:scale-100"
        >
          {exists ? "Continue" : "Start learning"}
        </button>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Names are case-insensitive and stored only in this browser.
        </p>
      </form>
    </div>
  );
}
