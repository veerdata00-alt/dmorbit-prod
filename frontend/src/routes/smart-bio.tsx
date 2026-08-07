import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useState } from "react";
import { Plus, ExternalLink, Trash2, Sparkles, BarChart3 } from "lucide-react";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/smart-bio")({
  head: () => ({ meta: [{ title: "Smart Bio — DMOrbit" }] }),
  component: SmartBio,
});

interface BioLink { id: string; title: string; url: string; clicks: number }

function SmartBio() {
  const handle = useStore((s) => s.igHandle) ?? "yourbrand";
  const [links, setLinks] = useState<BioLink[]>([
    { id: "1", title: "Free Instagram Growth PDF", url: "https://dmorbit.app/pdf", clicks: 412 },
    { id: "2", title: "Book a 1:1 call", url: "https://cal.com/you", clicks: 88 },
    { id: "3", title: "My YouTube channel", url: "https://youtube.com", clicks: 244 },
  ]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  const add = () => {
    if (!title || !url) return;
    setLinks([{ id: Math.random().toString(36).slice(2), title, url, clicks: 0 }, ...links]);
    setTitle(""); setUrl("");
  };

  const totalClicks = links.reduce((a, l) => a + l.clicks, 0);

  return (
    <AppShell title="Smart Bio">
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <section className="rounded-3xl border bg-card p-5 shadow-card">
            <h3 className="text-base font-bold">Add a link</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-foreground" />
              <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" className="rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-foreground" />
            </div>
            <button onClick={add} className="mt-3 inline-flex items-center gap-1.5 rounded-full ig-gradient px-4 py-2 text-sm font-semibold text-white shadow-pop">
              <Plus className="h-4 w-4" /> Add link
            </button>
          </section>

          <section className="rounded-3xl border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">Links</h3>
              <div className="text-xs text-muted-foreground"><BarChart3 className="mr-1 inline h-3 w-3" />{totalClicks} clicks</div>
            </div>
            <ul className="mt-4 space-y-2.5">
              {links.map((l) => (
                <li key={l.id} className="flex items-center gap-3 rounded-2xl border bg-background p-3.5">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl ig-gradient-soft"><ExternalLink className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{l.title}</div>
                    <div className="truncate text-xs text-muted-foreground">{l.url}</div>
                  </div>
                  <div className="text-right text-xs"><div className="font-bold">{l.clicks}</div><div className="text-muted-foreground">clicks</div></div>
                  <button onClick={() => setLinks(links.filter((x) => x.id !== l.id))} className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Phone preview */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="mx-auto w-full max-w-[300px] rounded-[2.5rem] border bg-card p-3 shadow-pop">
            <div className="overflow-hidden rounded-[2rem] ig-gradient-soft p-5 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full ig-gradient text-white">
                <Sparkles className="h-7 w-7" />
              </div>
              <div className="mt-3 font-extrabold">@{handle}</div>
              <div className="text-xs text-muted-foreground">Smart Bio · dmorbit.app/{handle}</div>
              <div className="mt-4 space-y-2">
                {links.map((l) => (
                  <div key={l.id} className="truncate rounded-2xl bg-white px-4 py-3 text-sm font-semibold shadow-card">{l.title}</div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
