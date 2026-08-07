import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Instagram, Sparkles, MessageCircle, TrendingUp, Zap } from "lucide-react";
import { store, useStore } from "@/lib/store";
import { useState } from "react";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Welcome to DMOrbit" },
      { name: "description", content: "Connect Instagram and turn engagement into conversations in under 2 minutes." },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  const navigate = useNavigate();
  const connected = useStore((s) => s.connected);
  const [loading, setLoading] = useState(false);

  const connect = () => {
    if (connected) {
      navigate({ to: "/home", replace: true });
      return;
    }
    setLoading(true);
    // Connect to actual backend OAuth flow with returnUrl to the React app
    const returnUrl = encodeURIComponent(window.location.origin + '/home');
    window.location.href = `http://localhost:3000/auth/instagram?returnTo=${returnUrl}`;
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 ig-gradient-soft" />
      <div className="pointer-events-none absolute -top-32 right-[-10%] h-96 w-96 rounded-full ig-gradient opacity-30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-10%] left-[-10%] h-96 w-96 rounded-full ig-gradient opacity-20 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col px-6 pb-10 pt-12 sm:max-w-lg">
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-2xl ig-gradient shadow-pop">
            <Sparkles className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-extrabold tracking-tight">DMOrbit</span>
        </div>

        <div className="mt-12 sm:mt-16">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card/80 px-3 py-1 text-xs font-semibold text-muted-foreground backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> For creators, coaches & brands
          </div>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
            Turn Instagram engagement into{" "}
            <span className="ig-gradient-text">conversations.</span>
          </h1>
          <p className="mt-4 text-base text-muted-foreground">
            Auto-reply to comments, send DMs, capture leads and deliver products — all from one beautiful place.
          </p>
        </div>

        <ul className="mt-8 space-y-3">
          {[
            { icon: MessageCircle, t: "Reply to every comment, automatically" },
            { icon: Zap, t: "Deliver PDFs, links & products in DMs" },
            { icon: TrendingUp, t: "Track leads & conversions in real-time" },
          ].map((f, i) => (
            <li key={i} className="flex items-center gap-3 rounded-2xl border bg-card/70 p-3.5 shadow-card backdrop-blur">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl ig-gradient-soft">
                <f.icon className="h-4.5 w-4.5" />
              </div>
              <span className="text-sm font-medium">{f.t}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-10">
          <button
            onClick={connect}
            disabled={loading}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl ig-gradient px-6 py-4 text-base font-semibold text-white shadow-pop transition active:scale-[0.98] disabled:opacity-80"
          >
            <Instagram className="h-5 w-5" />
            {loading ? "Connecting…" : connected ? "Continue" : "Connect Instagram"}
          </button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            We never post without your permission. You can disconnect any time.
          </p>
        </div>
      </div>
    </div>
  );
}
