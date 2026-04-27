import { Outlet, createRootRoute, HeadContent, Scripts, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { LoginGate } from "@/components/LoginGate";
import { useCurrentUser } from "@/lib/hoplingo-user";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero px-4">
      <div className="max-w-md text-center">
        <div className="text-8xl">🦜</div>
        <h1 className="mt-4 text-5xl font-bold">Perdido en la selva</h1>
        <p className="mt-2 text-muted-foreground">Esa página voló lejos. Volvamos al inicio.</p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-mint transition hover:scale-105"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Chispa — Learn Spanish with a tropical parrot" },
      { name: "description", content: "Smart Spanish vocabulary practice with spaced repetition. Streaks, dashboard, and detailed progress reports." },
      { name: "author", content: "Chispa" },
      { property: "og:title", content: "Chispa — Learn Spanish with a tropical parrot" },
      { property: "og:description", content: "Smart Spanish vocabulary practice with spaced repetition. Streaks, dashboard, and detailed progress reports." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Chispa — Learn Spanish with a tropical parrot" },
      { name: "twitter:description", content: "Smart Spanish vocabulary practice with spaced repetition. Streaks, dashboard, and detailed progress reports." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/2cdf6665-a791-4f79-952b-8656763f4271/id-preview-cb3dd23d--15276720-b502-4987-a2b2-3ed805b4c56a.lovable.app-1777189555132.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/2cdf6665-a791-4f79-952b-8656763f4271/id-preview-cb3dd23d--15276720-b502-4987-a2b2-3ed805b4c56a.lovable.app-1777189555132.png" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const user = useCurrentUser();
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <LoginGate />
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <Outlet />
    </div>
  );
}
