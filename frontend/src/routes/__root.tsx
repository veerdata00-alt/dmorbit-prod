import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { store, useStore } from "../lib/store";
import { apiClient } from "../lib/api/client";
import { initFirebase } from "../lib/firebase";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold ig-gradient-text">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This orbit doesn't exist yet.
        </p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-full ig-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-pop">
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong. Try again or head home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-full ig-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-pop"
          >Try again</button>
          <a href="/" className="rounded-full border px-5 py-2.5 text-sm font-semibold">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "DMOrbit — Turn Instagram engagement into conversations" },
      { name: "description", content: "DMOrbit is the easiest way for creators to automate Instagram comments, DMs and lead capture." },
      { name: "author", content: "DMOrbit" },
      { property: "og:title", content: "DMOrbit — Turn Instagram engagement into conversations" },
      { property: "og:description", content: "DMOrbit is the easiest way for creators to automate Instagram comments, DMs and lead capture." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "DMOrbit — Turn Instagram engagement into conversations" },
      { name: "twitter:description", content: "DMOrbit is the easiest way for creators to automate Instagram comments, DMs and lead capture." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/4e0984e9-fdab-41b1-b0e6-c9a13a77bd6a/id-preview-fea68a89--54b49a63-995d-45b4-90d3-f2ae5358f27f.lovable.app-1781598260831.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/4e0984e9-fdab-41b1-b0e6-c9a13a77bd6a/id-preview-fea68a89--54b49a63-995d-45b4-90d3-f2ae5358f27f.lovable.app-1781598260831.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
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
  const { queryClient } = Route.useRouteContext();
  const isAuthLoaded = useStore(s => s.isAuthLoaded);

  useEffect(() => {
    initFirebase();

    // Hydrate auth state from the server. This is the ONLY place that drives
    // isAuthLoaded. AppShell blocks rendering until this completes.
    apiClient.get('/api/me')
      .then(res => {
        // setUser is the single source of truth: it sets user, isAuthLoaded=true,
        // and connected=user.instagramConnected in one atomic write.
        store.setUser(res.data.user);

        // Only fetch stats to fill in igHandle if the user is already connected
        // but the handle is missing from the /api/me response.
        const currentState = store.get();
        if (currentState.connected && !currentState.igHandle) {
          return apiClient.get('/api/dashboard/stats').then(statsRes => {
            const ig = statsRes?.data?.instagram;
            if (ig?.username) {
              // Use setIgHandle — NOT connectInstagram — so we only fill in the
              // handle without overwriting the connected flag setUser already set.
              store.setIgHandle(ig.username);
            }
          }).catch(() => {/* non-fatal — igHandle just stays null */});
        }
      })
      .catch(() => {
        // /api/me failed (401 or network) — user is not authenticated.
        store.setUser(null);
      });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}
