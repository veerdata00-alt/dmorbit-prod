import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useStore } from "@/lib/store";
import { ArrowRight, Megaphone, MessageCircle, TrendingUp, Plus, Sparkles, Instagram, Lock, BarChart3, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/api/client";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Home — DMOrbit" },
      { name: "description", content: "Your DMOrbit home dashboard." },
    ],
  }),
  component: HomePage,
});

function connectInstagram() {
  const returnUrl = encodeURIComponent(window.location.origin + '/home');
  window.location.href = `http://localhost:3000/auth/instagram?returnTo=${returnUrl}`;
}

function LockedDashboard({ user }: { user: any }) {
  return (
    <div className="space-y-6">
      {/* Hero CTA */}
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-400/10 p-6 shadow-card sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full ig-gradient opacity-20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-32 w-32 rounded-full ig-gradient opacity-10 blur-2xl" />
        <div className="relative flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <span className="grid h-6 w-6 place-items-center rounded-full ig-gradient text-white">
            <Sparkles className="h-3 w-3" />
          </span>
          Welcome{user?.name ? `, ${user.name}` : ""}
        </div>
        <h2 className="relative mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
          Connect Instagram to unlock{" "}
          <span className="ig-gradient-text">DMOrbit.</span>
        </h2>
        <p className="relative mt-2 text-sm text-muted-foreground max-w-md">
          Auto-reply to comments, send DMs, capture leads and track conversions — all in one place.
        </p>
        <button
          onClick={connectInstagram}
          className="relative mt-5 inline-flex items-center gap-2 rounded-2xl ig-gradient px-6 py-3 text-sm font-bold text-white shadow-pop transition active:scale-[0.98]"
        >
          <Instagram className="h-4 w-4" /> Connect Instagram
        </button>
        <p className="relative mt-2 text-[11px] text-muted-foreground">
          We never post without permission. Disconnect any time.
        </p>
      </section>

      {/* Locked stats preview */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {[
          { label: "Active Campaigns", icon: Megaphone, tint: "from-fuchsia-500/15 to-pink-500/15" },
          { label: "DMs This Month", icon: MessageCircle, tint: "from-blue-500/15 to-cyan-500/15" },
          { label: "Total Leads", icon: TrendingUp, tint: "from-green-500/15 to-emerald-500/15" },
        ].map((s) => (
          <div key={s.label} className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${s.tint} p-4 shadow-card`}>
            <div className="flex items-center justify-between">
              <s.icon className="h-4 w-4 text-muted-foreground" />
              <Lock className="h-3.5 w-3.5 text-muted-foreground/60" />
            </div>
            <div className="mt-3 text-2xl font-extrabold tracking-tight text-muted-foreground/40 blur-sm select-none">
              —
            </div>
            <div className="mt-0.5 text-xs font-medium text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </section>

      {/* Locked features grid */}
      <section>
        <h3 className="mb-3 text-sm font-bold text-muted-foreground uppercase tracking-wider">What you'll unlock</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Megaphone, title: "Campaigns", desc: "Auto-reply to comments and trigger DM flows." },
            { icon: MessageCircle, title: "Inbox & DMs", desc: "Manage all conversations in one place." },
            { icon: TrendingUp, title: "Analytics", desc: "Track conversions, leads, and campaign ROI." },
            { icon: Users, title: "CRM", desc: "Build a lead list from every interaction." },
            { icon: BarChart3, title: "Automations", desc: "Rule-based flows for your whole funnel." },
            { icon: Sparkles, title: "Smart Bio", desc: "A link-in-bio that converts followers." },
          ].map((f) => (
            <div key={f.title} className="relative overflow-hidden rounded-2xl border bg-card p-4 shadow-card opacity-60">
              <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px]" />
              <div className="relative flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl ig-gradient-soft">
                  <f.icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold flex items-center gap-1.5">
                    {f.title} <Lock className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{f.desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <div className="flex justify-center pb-4">
        <button
          onClick={connectInstagram}
          className="inline-flex items-center gap-2 rounded-2xl ig-gradient px-8 py-3.5 text-sm font-bold text-white shadow-pop transition active:scale-[0.98]"
        >
          <Instagram className="h-4 w-4" /> Connect Instagram to Get Started
        </button>
      </div>
    </div>
  );
}

function ConnectedDashboard({ user, statsData, isLoading }: { user: any; statsData: any; isLoading: boolean }) {
  const activeCampaigns = statsData?.automations?.active ?? null;
  const totalDmsSent = statsData?.totalDmsSent ?? null;
  const totalLeads = statsData?.totalLeads ?? null;

  const stats = [
    { label: "Active Campaigns", value: activeCampaigns !== null ? activeCampaigns : "-", icon: Megaphone, tint: "from-fuchsia-500/15 to-pink-500/15" },
    { label: "DMs This Month", value: totalDmsSent !== null ? totalDmsSent : "-", icon: MessageCircle, tint: "from-blue-500/15 to-cyan-500/15" },
    { label: "Total Leads", value: totalLeads !== null ? totalLeads : "-", icon: TrendingUp, tint: "from-green-500/15 to-emerald-500/15" },
  ];

  return (
    <>
      <section className="relative overflow-hidden rounded-3xl border bg-card p-5 shadow-card sm:p-7">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full ig-gradient opacity-20 blur-3xl" />
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <span className="grid h-6 w-6 place-items-center rounded-full ig-gradient text-white">
            <Sparkles className="h-3 w-3" />
          </span>
          Welcome back{user?.name ? `, ${user.name}` : ""}
        </div>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
          Let's turn comments into <span className="ig-gradient-text">customers.</span>
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">Launch a new campaign in under 2 minutes.</p>
        <Link
          to="/campaigns/new"
          className="mt-5 inline-flex items-center gap-1.5 rounded-full ig-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-pop"
        >
          Create Campaign <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-2xl border bg-gradient-to-br ${s.tint} p-4 shadow-card`}>
            <div className="flex items-center justify-between">
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
              {isLoading ? <span className="animate-pulse text-muted-foreground text-lg">…</span> : s.value}
            </div>
            <div className="mt-0.5 text-xs font-medium text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </section>

      <section className="mt-6">
        <div className="flex items-end justify-between">
          <h3 className="text-base font-bold">Your campaigns</h3>
          <Link to="/campaigns" className="text-xs font-semibold text-muted-foreground">View all →</Link>
        </div>
        <div className="mt-3 rounded-3xl border border-dashed bg-card/50 p-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl ig-gradient-soft">
            <Megaphone className="h-6 w-6" />
          </div>
          {activeCampaigns !== null && activeCampaigns > 0 ? (
            <>
              <h4 className="mt-3 text-lg font-bold">You have {activeCampaigns} active campaign{activeCampaigns !== 1 ? "s" : ""}</h4>
              <p className="mt-1 text-sm text-muted-foreground">Go to Campaigns to manage them.</p>
              <Link to="/campaigns" className="mt-4 inline-flex items-center gap-1.5 rounded-full ig-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-pop">
                <Plus className="h-4 w-4" /> View Campaigns
              </Link>
            </>
          ) : (
            <>
              <h4 className="mt-3 text-lg font-bold">Create Your First Campaign</h4>
              <p className="mt-1 text-sm text-muted-foreground">Start auto-replying to comments and DMs.</p>
              <Link to="/campaigns/new" className="mt-4 inline-flex items-center gap-1.5 rounded-full ig-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-pop">
                <Plus className="h-4 w-4" /> Create Campaign
              </Link>
            </>
          )}
        </div>
      </section>
    </>
  );
}

function HomePage() {
  const { connected, user } = useStore((s) => ({
    connected: s.connected,
    user: s.user,
  }));

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const res = await apiClient.get('/api/dashboard/stats');
      return res.data;
    },
    enabled: !!user && !!connected,
  });

  return (
    <AppShell
      title="Home"
      action={
        connected ? (
          <Link
            to="/campaigns/new"
            className="hidden items-center gap-1.5 rounded-full ig-gradient px-4 py-2 text-sm font-semibold text-white shadow-pop sm:inline-flex"
          >
            <Plus className="h-4 w-4" /> Create Campaign
          </Link>
        ) : undefined
      }
    >
      {connected
        ? <ConnectedDashboard user={user} statsData={statsData} isLoading={isLoading} />
        : <LockedDashboard user={user} />
      }
    </AppShell>
  );
}
