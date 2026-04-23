import { Outlet, createRootRoute, HeadContent, Scripts, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero px-4">
      <div className="max-w-md text-center">
        <div className="text-8xl">🐰</div>
        <h1 className="mt-4 text-5xl font-bold">Lost in the meadow</h1>
        <p className="mt-2 text-muted-foreground">That page hopped away. Let's go back.</p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-mint transition hover:scale-105"
        >
          Hop home
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
      { title: "HopLingo — Learn Spanish with Hopper the Bunny" },
      { name: "description", content: "Smart Spanish vocabulary practice powered by half-life regression. Streaks, dashboard, and detailed progress reports." },
      { name: "author", content: "HopLingo" },
      { property: "og:title", content: "HopLingo — Learn Spanish with Hopper the Bunny" },
      { property: "og:description", content: "Smart Spanish vocabulary practice powered by half-life regression." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <Outlet />
    </div>
  );
}
