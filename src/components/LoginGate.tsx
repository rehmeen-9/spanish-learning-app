import { useState, type FormEvent } from "react";
import mascot from "@/assets/chispa-parrot.png";
import { signInUser, userExists, normalizeUsername } from "@/lib/hoplingo-user";

export function LoginGate() {
  const [name, setName] = useState("");
  const [hint, setHint] = useState<string | null>(null);

  const trimmed = normalizeUsername(name);
  const exists = trimmed ? userExists(trimmed) : false;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!trimmed) {
      setHint("Please enter a username to continue.");
      return;
    }
    signInUser(trimmed);
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
            Bienvenido a Chis<span className="text-gradient-berry">pa</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Escribe un nombre de usuario para comenzar. Tu progreso se guarda por usuario en este dispositivo.
          </p>
        </div>

        <label className="mt-6 block text-sm font-medium" htmlFor="username">
          Nombre de usuario
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
          placeholder="ej. amigo_loro"
          className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none ring-primary/30 transition focus:ring-4"
        />

        <div className="mt-2 min-h-[1.25rem] text-xs">
          {hint ? (
            <span className="text-destructive">{hint}</span>
          ) : trimmed ? (
            exists ? (
              <span className="text-primary">👋 ¡Bienvenido de vuelta! Continuamos tu progreso.</span>
            ) : (
              <span className="text-muted-foreground">✨ Usuario nuevo — empezamos una aventura desde cero.</span>
            )
          ) : null}
        </div>

        <button
          type="submit"
          className="mt-4 w-full rounded-full bg-primary py-3 text-base font-semibold text-primary-foreground shadow-mint transition hover:scale-[1.02] active:scale-100"
        >
          {exists ? "Continuar" : "Empezar a aprender"}
        </button>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Los nombres no distinguen mayúsculas y se guardan solo en este navegador.
        </p>
      </form>
    </div>
  );
}
