import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { MessageCircle, Send, Users, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/api/client";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics — DMOrbit" }] }),
  component: Analytics,
});

function Analytics() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analyticsDashboard'],
    queryFn: async () => {
      const res = await apiClient.get('/api/analytics/dashboard');
      return res.data;
    },
  });

  // --- Backend field mapping: GET /api/analytics/dashboard ---
  // Actual response (flat object):
  //   totalComments, totalDMs, totalViews, leadsGenerated,
  //   conversionRate, topCampaign (string), topKeyword (string),
  //   topPost (string), followGateConversion (string)
  // NOT present: stats.*, topCampaigns (array)
  const dms = analytics?.totalDMs ?? 0;
  const totalLeads = analytics?.leadsGenerated ?? 0;
  const comments = analytics?.totalComments ?? 0;
  const conv = analytics?.conversionRate ?? 0;
  const topCampaignName = analytics?.topCampaign ?? null;   // string, not array
  const topKeyword = analytics?.topKeyword ?? null;

  const funnel = [
    { label: "Comments", value: comments, color: "from-indigo-500 to-purple-500" },
    { label: "DMs Logged", value: dms, color: "from-purple-500 to-fuchsia-500" },
    { label: "Leads", value: totalLeads, color: "from-fuchsia-500 to-pink-500" },
  ];
  const max = Math.max(...funnel.map((f) => f.value), 1);

  const stats = [
    { label: "Leads", value: totalLeads, icon: Users },
    { label: "DMs Logged", value: dms, icon: Send },
    { label: "Conversion", value: `${conv}%`, icon: MessageCircle },
    { label: "Comments", value: comments, icon: BarChart3 },
  ];

  return (
    <AppShell title="Analytics">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border bg-card p-4 shadow-card">
            <s.icon className="h-4 w-4 text-muted-foreground" />
            <div className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
              {isLoading ? <span className="animate-pulse text-muted-foreground text-lg">…</span> : s.value}
            </div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </section>

      <section className="mt-5 rounded-3xl border bg-card p-5 shadow-card sm:p-6">
        <h3 className="text-base font-bold">Conversion funnel</h3>
        <p className="text-xs text-muted-foreground">From comment to customer.</p>
        <div className="mt-5 space-y-3">
          {funnel.map((f) => {
            const w = (f.value / max) * 100;
            return (
              <div key={f.label}>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>{f.label}</span>
                  <span className="text-muted-foreground">{f.value.toLocaleString()}</span>
                </div>
                <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full bg-gradient-to-r ${f.color}`} style={{ width: `${w}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Backend returns topCampaign as a plain string, not an array.
          topCampaigns array does NOT exist in the backend response. */}
      <section className="mt-5 rounded-3xl border bg-card p-5 shadow-card sm:p-6">
        <h3 className="text-base font-bold">Top campaign</h3>
        {topCampaignName && topCampaignName !== "None" ? (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border bg-background p-3.5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl ig-gradient text-sm font-extrabold text-white">1</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{topCampaignName}</div>
              {topKeyword && topKeyword !== "None" && (
                <div className="text-[11px] text-muted-foreground">Top keyword: {topKeyword}</div>
              )}
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Create a campaign to see analytics.</p>
        )}
      </section>
    </AppShell>
  );
}
