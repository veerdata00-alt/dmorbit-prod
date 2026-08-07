import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Megaphone, Users, BarChart3, Settings, Sparkles, CreditCard, Lock, Instagram } from "lucide-react";
import type { ReactNode } from "react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

const nav = [
  { to: "/home", label: "Home", icon: Home, requiresConnect: false },
  { to: "/campaigns", label: "Campaigns", icon: Megaphone, requiresConnect: true },
  { to: "/crm", label: "CRM", icon: Users, requiresConnect: true },
  { to: "/analytics", label: "Analytics", icon: BarChart3, requiresConnect: true },
  { to: "/smart-bio", label: "Smart Bio", icon: Sparkles, requiresConnect: false, desktopOnly: true },
  { to: "/billing", label: "Billing", icon: CreditCard, requiresConnect: false, desktopOnly: true },
  { to: "/settings", label: "Settings", icon: Settings, requiresConnect: false },
] as const;

const mobileNav = nav.filter((n) => !("desktopOnly" in n && n.desktopOnly));

export function AppShell({ children, title, action }: { children: ReactNode; title?: string; action?: ReactNode }) {
  const connected = useStore((s) => s.connected);
  const handle = useStore((s) => s.igHandle);
  const user = useStore((s) => s.user);
  const isAuthLoaded = useStore((s) => s.isAuthLoaded);
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthLoaded && !user) {
      navigate({ to: "/login", replace: true });
    }
  }, [isAuthLoaded, user, navigate]);

  if (!isAuthLoaded || !user) {
    return <div className="grid min-h-screen place-items-center bg-background"><div className="h-8 w-8 animate-spin rounded-full border-4 border-foreground border-t-transparent" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-card lg:flex lg:flex-col">
        <div className="flex items-center gap-2 px-6 py-6">
          <div className="grid h-9 w-9 place-items-center rounded-2xl ig-gradient shadow-pop">
            <Sparkles className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
          </div>
          <div className="text-lg font-extrabold tracking-tight">DMOrbit</div>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {nav.map((item) => {
            const active = pathname === item.to || (item.to !== "/home" && pathname.startsWith(item.to));
            const locked = item.requiresConnect && !connected;
            const Cmp: any = locked ? "button" : Link;
            return (
              <Cmp
                key={item.to}
                {...(locked ? { type: "button", onClick: () => {} } : { to: item.to })}
                disabled={locked || undefined}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
                  active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                  locked && "cursor-not-allowed opacity-50",
                )}
              >
                <item.icon className="h-4.5 w-4.5" />
                <span className="flex-1 text-left">{item.label}</span>
                {locked && <Lock className="h-3.5 w-3.5" />}
              </Cmp>
            );
          })}
        </nav>
        <div className="m-3 rounded-2xl border bg-muted/40 p-3 text-xs">
          {connected ? (
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-full ig-gradient text-white">
                <Instagram className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="truncate font-semibold text-foreground">@{handle}</div>
                <div className="text-[11px] text-muted-foreground">Connected</div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                const returnUrl = encodeURIComponent(window.location.origin + '/home');
                window.location.href = `http://localhost:3000/auth/instagram?returnTo=${returnUrl}`;
              }}
              className="flex w-full items-center gap-2 font-semibold hover:opacity-80 transition"
            >
              <Instagram className="h-4 w-4" /> Connect Instagram
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3.5 sm:px-6">
            <div className="lg:hidden">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-xl ig-gradient">
                  <Sparkles className="h-4 w-4 text-white" strokeWidth={2.5} />
                </div>
              </div>
            </div>
            <h1 className="min-w-0 flex-1 truncate text-base font-bold tracking-tight sm:text-lg">{title}</h1>
            {action}
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 pb-28 pt-4 sm:px-6 sm:pt-6 lg:pb-12">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur safe-pb lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {mobileNav.map((item) => {
            const active = pathname === item.to || (item.to !== "/home" && pathname.startsWith(item.to));
            const locked = item.requiresConnect && !connected;
            const Cmp: any = locked ? "button" : Link;
            return (
              <Cmp
                key={item.to}
                {...(locked ? { type: "button" } : { to: item.to })}
                disabled={locked || undefined}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium",
                  active ? "text-foreground" : "text-muted-foreground",
                  locked && "opacity-40",
                )}
              >
                <item.icon className={cn("h-5 w-5", active && "text-foreground")} />
                <span>{item.label}</span>
                {active && <span className="absolute -top-px h-0.5 w-8 rounded-full ig-gradient" />}
              </Cmp>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
