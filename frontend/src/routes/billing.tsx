import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Check, Download, Sparkles } from "lucide-react";

export const Route = createFileRoute("/billing")({
  head: () => ({ meta: [{ title: "Billing — DMOrbit" }] }),
  component: Billing,
});

const invoices = [
  { id: "INV-2041", date: "Jun 1, 2026", amount: "$29.00", status: "Paid" },
  { id: "INV-2018", date: "May 1, 2026", amount: "$29.00", status: "Paid" },
  { id: "INV-1994", date: "Apr 1, 2026", amount: "$29.00", status: "Paid" },
];

function Billing() {
  const used = 4280; const total = 10000;
  const pct = (used / total) * 100;

  return (
    <AppShell title="Billing">
      <section className="relative overflow-hidden rounded-3xl border bg-card p-6 shadow-card">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full ig-gradient opacity-20 blur-3xl" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current plan</div>
            <div className="mt-1 flex items-center gap-2 text-2xl font-extrabold">
              Creator <span className="rounded-full ig-gradient px-2.5 py-0.5 text-[10px] font-bold uppercase text-white">Pro</span>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">$29/month · billed monthly</div>
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-full ig-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-pop">
            <Sparkles className="h-4 w-4" /> Upgrade plan
          </button>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span>DM credits used</span>
            <span className="text-muted-foreground">{used.toLocaleString()} / {total.toLocaleString()}</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full ig-gradient" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { name: "Starter", price: "$0", desc: "1,000 DMs/mo", cta: "Downgrade" },
          { name: "Creator", price: "$29", desc: "10,000 DMs/mo", cta: "Current", featured: true },
          { name: "Business", price: "$79", desc: "Unlimited DMs", cta: "Upgrade" },
        ].map((p) => (
          <div key={p.name} className={`rounded-3xl border p-5 shadow-card ${p.featured ? "bg-card ring-2 ring-foreground" : "bg-card"}`}>
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{p.name}</div>
            <div className="mt-1 text-2xl font-extrabold">{p.price}<span className="text-sm font-medium text-muted-foreground">/mo</span></div>
            <div className="mt-1 text-sm text-muted-foreground">{p.desc}</div>
            <ul className="mt-4 space-y-1.5 text-sm">
              {["Unlimited campaigns", "Smart Bio", "Lead CRM"].map((f) => (
                <li key={f} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-600" />{f}</li>
              ))}
            </ul>
            <button disabled={p.featured} className={`mt-4 w-full rounded-full px-4 py-2.5 text-sm font-semibold ${p.featured ? "border bg-muted text-muted-foreground" : "ig-gradient text-white shadow-pop"}`}>
              {p.cta}
            </button>
          </div>
        ))}
      </section>

      <section className="mt-5 rounded-3xl border bg-card shadow-card">
        <div className="border-b px-5 py-4"><h3 className="text-base font-bold">Invoices</h3></div>
        <ul className="divide-y">
          {invoices.map((i) => (
            <li key={i.id} className="flex items-center gap-3 px-5 py-3.5 text-sm">
              <div className="flex-1">
                <div className="font-semibold">{i.id}</div>
                <div className="text-xs text-muted-foreground">{i.date}</div>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-600">{i.status}</span>
              <div className="w-20 text-right font-semibold">{i.amount}</div>
              <button className="rounded-full border p-2 hover:bg-muted"><Download className="h-3.5 w-3.5" /></button>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
