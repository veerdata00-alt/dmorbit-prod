import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useStore } from "@/lib/store";
import { Search, Mail, Calendar } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/api/client";

export const Route = createFileRoute("/crm")({
  head: () => ({ meta: [{ title: "CRM — DMOrbit" }] }),
  component: CRM,
});

function CRM() {
  const [q, setQ] = useState("");
  const [campaignId, setCampaignId] = useState<string>("all");

  const { data: leads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const res = await apiClient.get('/api/crm/leads');
      return res.data.leads || res.data || [];
    }
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v2/automations');
      return res.data.automations || res.data || [];
    }
  });

  const filtered = leads.filter((l: any) => {
    const match = (l.name || '').toLowerCase().includes(q.toLowerCase()) || (l.email || '').toLowerCase().includes(q.toLowerCase());
    const cMatch = campaignId === "all" || l.automationId === campaignId || l.campaignId === campaignId;
    return match && cMatch;
  });

  return (
    <AppShell title="CRM">
      <div className="rounded-3xl border bg-card p-4 shadow-card">
        <div className="flex items-center gap-2 rounded-xl border bg-background px-3.5 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search leads…" className="flex-1 bg-transparent text-sm outline-none" />
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto">
          <FilterChip active={campaignId === "all"} onClick={() => setCampaignId("all")}>All campaigns</FilterChip>
          {campaigns.map((c: any) => (
            <FilterChip key={c._id || c.id} active={campaignId === (c._id || c.id)} onClick={() => setCampaignId(c._id || c.id)}>{c.name}</FilterChip>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed bg-card/50 p-10 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl ig-gradient-soft">
            <Mail className="h-6 w-6" />
          </div>
          <h4 className="mt-3 text-lg font-bold">No leads yet</h4>
          <p className="mt-1 text-sm text-muted-foreground">Leads will appear here as your campaigns run.</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <ul className="mt-4 space-y-3 sm:hidden">
            {filtered.map((l: any) => (
              <li key={l._id || l.id} className="rounded-2xl border bg-card p-4 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full ig-gradient text-sm font-bold text-white">
                    {(l.name || "User").split(" ").map((x: string) => x[0]).join("").slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{l.name || "Unknown"}</div>
                    <div className="truncate text-xs text-muted-foreground">{l.email || "No email"}</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="truncate">{campaigns.find((c: any) => c._id === l.automationId || c.id === l.automationId || c.id === l.campaignId)?.name ?? "Campaign"}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(l.createdAt || l.capturedAt).toLocaleDateString()}</span>
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop table */}
          <div className="mt-4 hidden overflow-hidden rounded-3xl border bg-card shadow-card sm:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Lead</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Campaign</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((l: any) => (
                  <tr key={l._id || l.id} className="hover:bg-muted/30">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-8 w-8 place-items-center rounded-full ig-gradient text-xs font-bold text-white">
                          {(l.name || "User").split(" ").map((x: string) => x[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold">{l.name || "Unknown"}</div>
                          <div className="text-xs text-muted-foreground">{l.handle || l.instagramHandle || "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">{l.email || "—"}</td>
                    <td className="px-5 py-3.5">{campaigns.find((c: any) => c._id === l.automationId || c.id === l.automationId || c.id === l.campaignId)?.name ?? "—"}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{new Date(l.createdAt || l.capturedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AppShell>
  );
}

function FilterChip({ active, onClick, children }: any) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold ${
        active ? "bg-foreground text-background" : "bg-background text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
