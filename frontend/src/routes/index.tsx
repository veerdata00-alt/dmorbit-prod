import { createFileRoute, Link } from "@tanstack/react-router";
import {
  MessageCircle, Reply, Camera, Search, FileText, Link as LinkIcon, Users,
  BarChart3, Sparkles, Instagram, Check, ArrowRight, Play, Star, Zap, ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DMOrbit — Turn Instagram comments into customers" },
      { name: "description", content: "Automatically reply to comments, send DMs, deliver PDFs, capture leads and track conversions on Instagram." },
      { property: "og:title", content: "DMOrbit — Turn Instagram comments into customers" },
      { property: "og:description", content: "Instagram DM automation for creators, coaches, and small businesses." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <Logos />
      <HowItWorks />
      <Features />
      <Stats />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}

function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl ig-gradient text-white shadow-pop">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-lg font-extrabold tracking-tight">DMOrbit</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground">Features</a>
          <a href="#how" className="text-sm font-medium text-muted-foreground hover:text-foreground">How it works</a>
          <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground">Pricing</a>
          <a href="#faq" className="text-sm font-medium text-muted-foreground hover:text-foreground">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login" className="hidden rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground sm:inline-block">Log in</Link>
          <Link to="/signup" className="rounded-full ig-gradient px-4 py-2 text-sm font-semibold text-white shadow-pop">Start Free</Link>
          <button onClick={() => setOpen(!open)} className="grid h-9 w-9 place-items-center rounded-full border md:hidden" aria-label="Menu">
            <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t bg-background md:hidden">
          <div className="flex flex-col gap-1 px-5 py-3">
            <a href="#features" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted">Features</a>
            <a href="#how" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted">How it works</a>
            <a href="#pricing" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted">Pricing</a>
            <a href="#faq" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted">FAQ</a>
            <Link to="/login" className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted">Log in</Link>
          </div>
        </div>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-br from-purple-400/30 via-pink-400/30 to-orange-300/30 blur-3xl" />
      </div>
      <div className="mx-auto max-w-7xl px-5 pb-16 pt-12 sm:px-8 sm:pb-24 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-semibold shadow-card">
            <span className="grid h-4 w-4 place-items-center rounded-full ig-gradient text-white"><Zap className="h-2.5 w-2.5" /></span>
            New · Auto-DM for Reels & Stories
          </div>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
            Turn Instagram comments into <span className="ig-gradient-text">customers</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Automatically reply to comments, send DMs, deliver PDFs, capture leads and track conversions — all from one beautifully simple dashboard.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/signup" className="inline-flex w-full items-center justify-center gap-2 rounded-full ig-gradient px-7 py-3.5 text-sm font-bold text-white shadow-pop transition active:scale-[0.98] sm:w-auto">
              Start Free <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#how" className="inline-flex w-full items-center justify-center gap-2 rounded-full border bg-card px-7 py-3.5 text-sm font-bold shadow-card sm:w-auto">
              <Play className="h-4 w-4" /> Watch Demo
            </a>
          </div>
          <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" /> Free forever plan · No credit card required
          </div>
        </div>

        <HeroMockup />
      </div>
    </section>
  );
}

function HeroMockup() {
  return (
    <div className="relative mx-auto mt-12 max-w-5xl sm:mt-16">
      <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-orange-400/20 blur-2xl" />
      <div className="overflow-hidden rounded-[1.5rem] border bg-card shadow-pop sm:rounded-[2rem]">
        {/* Browser bar */}
        <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
          </div>
          <div className="mx-auto hidden rounded-md bg-background px-3 py-1 text-xs text-muted-foreground sm:block">app.dmorbit.com/home</div>
        </div>
        <div className="grid gap-4 p-4 sm:grid-cols-[1fr_1.4fr] sm:gap-5 sm:p-6">
          {/* Phone */}
          <div className="mx-auto w-full max-w-[260px] rounded-[2rem] border-[8px] border-foreground/90 bg-background p-3 shadow-xl">
            <div className="rounded-2xl bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full ig-gradient" />
                <div>
                  <div className="text-[11px] font-bold">@you.create</div>
                  <div className="text-[9px] text-muted-foreground">1 min ago</div>
                </div>
              </div>
              <div className="mt-2 rounded-xl bg-white p-2 text-[11px] shadow-sm">
                <b>@sarah.fit</b>: Send me the guide! <span className="ml-1 inline-block rounded bg-pink-100 px-1 text-[9px] font-bold text-pink-700">PDF</span>
              </div>
              <div className="mt-2 flex justify-end">
                <div className="rounded-2xl rounded-br-md ig-gradient px-3 py-1.5 text-[10px] font-semibold text-white shadow">
                  📩 Sent! Check your DMs.
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1.5 rounded-xl bg-emerald-50 p-2">
                <Check className="h-3 w-3 text-emerald-600" />
                <span className="text-[10px] font-semibold text-emerald-700">DM delivered · Lead captured</span>
              </div>
            </div>
          </div>
          {/* Dashboard */}
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { l: "Comments", v: "12,847" },
                { l: "DMs Sent", v: "9,412" },
                { l: "Leads", v: "2,108" },
              ].map((s) => (
                <div key={s.l} className="rounded-xl border bg-background p-2.5 sm:p-3.5">
                  <div className="text-[10px] font-semibold text-muted-foreground">{s.l}</div>
                  <div className="mt-0.5 text-base font-extrabold sm:text-xl">{s.v}</div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border bg-background p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-xs font-bold">Funnel · Last 7 days</div>
                <div className="rounded-full ig-gradient-soft px-2 py-0.5 text-[10px] font-bold">+24%</div>
              </div>
              <div className="space-y-2">
                {[
                  { l: "Comments", w: 100, v: "12.8k" },
                  { l: "DMs sent", w: 78, v: "9.4k" },
                  { l: "Replies", w: 46, v: "5.6k" },
                  { l: "Leads", w: 18, v: "2.1k" },
                ].map((b) => (
                  <div key={b.l} className="flex items-center gap-2">
                    <div className="w-16 shrink-0 text-[10px] font-semibold text-muted-foreground">{b.l}</div>
                    <div className="h-5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full ig-gradient" style={{ width: `${b.w}%` }} />
                    </div>
                    <div className="w-10 shrink-0 text-right text-[10px] font-bold">{b.v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="rounded-xl border bg-background p-3">
                <div className="text-[10px] font-semibold text-muted-foreground">Top campaign</div>
                <div className="mt-0.5 truncate text-xs font-bold">Free Growth PDF</div>
                <div className="mt-1 text-[10px] text-emerald-600">+412 leads</div>
              </div>
              <div className="rounded-xl border bg-background p-3">
                <div className="text-[10px] font-semibold text-muted-foreground">Conversion</div>
                <div className="mt-0.5 text-xs font-bold">22.4%</div>
                <div className="mt-1 text-[10px] text-emerald-600">▲ 3.1%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Logos() {
  return (
    <section className="border-y bg-muted/30">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Trusted by 12,000+ creators & businesses</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 opacity-70">
          {["CREATORCO", "FITHUB", "LUMEN", "BRIGHTLY", "ORBIT.AI", "FOUNDR"].map((b) => (
            <span key={b} className="text-sm font-extrabold tracking-widest text-muted-foreground">{b}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", title: "Connect Instagram", desc: "Securely link your business or creator account in seconds.", icon: Instagram },
    { n: "02", title: "Create a campaign", desc: "Pick a goal, pick a post, write a message. Done.", icon: Sparkles },
    { n: "03", title: "Get comments", desc: "People comment your keyword on Reels, posts, or Stories.", icon: MessageCircle },
    { n: "04", title: "Send DMs automatically", desc: "DMOrbit replies publicly and slides into DMs instantly.", icon: Reply },
  ];
  return (
    <section id="how" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">From comment to customer in 4 steps</h2>
        <p className="mt-3 text-muted-foreground">Set up your first automation in under 2 minutes.</p>
      </div>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <div key={s.n} className="group relative rounded-3xl border bg-card p-6 shadow-card transition hover:-translate-y-1 hover:shadow-pop">
            <div className="text-xs font-extrabold text-muted-foreground">{s.n}</div>
            <div className="mt-3 grid h-12 w-12 place-items-center rounded-2xl ig-gradient-soft">
              <s.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { icon: MessageCircle, title: "Comment → DM", desc: "Trigger a DM when someone comments your keyword." },
    { icon: Camera, title: "Story Replies", desc: "Auto-respond to story replies with the right resource." },
    { icon: Reply, title: "Comment Reply", desc: "Public auto-reply under every matching comment." },
    { icon: Users, title: "Lead Capture", desc: "Collect emails and names directly from DMs." },
    { icon: FileText, title: "PDF Delivery", desc: "Send guides, ebooks, and freebies in one click." },
    { icon: LinkIcon, title: "Link Delivery", desc: "Share any URL, product, or booking page." },
    { icon: BarChart3, title: "Smart Analytics", desc: "See your comment → lead → revenue funnel." },
    { icon: Sparkles, title: "Smart Bio", desc: "A premium link-in-bio that converts visitors." },
  ];
  return (
    <section id="features" className="bg-muted/30 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">Everything you need to grow on Instagram</h2>
          <p className="mt-3 text-muted-foreground">One simple toolkit. Built for creators, not enterprises.</p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((f) => (
            <div key={f.title} className="rounded-3xl border bg-card p-6 shadow-card">
              <div className="grid h-11 w-11 place-items-center rounded-2xl ig-gradient text-white">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-bold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const stats = [
    { v: "12k+", l: "Creators & brands" },
    { v: "48M+", l: "DMs sent" },
    { v: "22%", l: "Avg. conversion" },
    { v: "4.9★", l: "Customer rating" },
  ];
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
      <div className="grid gap-4 rounded-[2rem] ig-gradient p-8 text-white shadow-pop sm:grid-cols-4 sm:p-12">
        {stats.map((s) => (
          <div key={s.l} className="text-center">
            <div className="text-3xl font-extrabold sm:text-5xl">{s.v}</div>
            <div className="mt-1 text-xs font-semibold uppercase tracking-wider opacity-90">{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  const t = [
    { name: "Sarah Lin", handle: "@sarah.fit", text: "DMOrbit replaced 3 tools for me. My PDF lead magnet now runs on autopilot.", role: "Fitness coach · 240k followers" },
    { name: "Marcus Reed", handle: "@marcuscreates", text: "Set up in 5 minutes. Hit 1,200 leads in the first week.", role: "Course creator" },
    { name: "Priya Shah", handle: "@priya.studio", text: "Finally, automation that feels native to Instagram. My audience loves it.", role: "Design educator" },
  ];
  return (
    <section className="bg-muted/30 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">Loved by creators worldwide</h2>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {t.map((x) => (
            <div key={x.name} className="rounded-3xl border bg-card p-6 shadow-card">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed">"{x.text}"</p>
              <div className="mt-5 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full ig-gradient" />
                <div>
                  <div className="text-sm font-bold">{x.name} <span className="text-muted-foreground">· {x.handle}</span></div>
                  <div className="text-xs text-muted-foreground">{x.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    { name: "Starter", price: "$0", per: "forever", desc: "For creators just getting started.", features: ["1 active campaign", "500 DMs/month", "Basic analytics", "Comment → DM"], cta: "Start Free", featured: false },
    { name: "Creator", price: "$29", per: "/month", desc: "For serious growth.", features: ["Unlimited campaigns", "10,000 DMs/month", "Full analytics & CRM", "Story replies & keywords", "Smart Bio"], cta: "Start 14-day trial", featured: true },
    { name: "Business", price: "$99", per: "/month", desc: "For agencies and teams.", features: ["Everything in Creator", "Unlimited DMs", "5 IG accounts", "Team seats", "Priority support"], cta: "Talk to sales", featured: false },
  ];
  return (
    <section id="pricing" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">Simple pricing that scales</h2>
        <p className="mt-3 text-muted-foreground">Start free. Upgrade when you outgrow it.</p>
      </div>
      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        {plans.map((p) => (
          <div key={p.name} className={`relative rounded-3xl border bg-card p-6 shadow-card sm:p-8 ${p.featured ? "ring-2 ring-foreground" : ""}`}>
            {p.featured && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full ig-gradient px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-pop">
                Most popular
              </div>
            )}
            <h3 className="text-lg font-bold">{p.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{p.desc}</p>
            <div className="mt-5 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold">{p.price}</span>
              <span className="text-sm text-muted-foreground">{p.per}</span>
            </div>
            <Link to="/signup" className={`mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-full px-5 py-3 text-sm font-bold transition ${p.featured ? "ig-gradient text-white shadow-pop" : "border bg-background"}`}>
              {p.cta}
            </Link>
            <ul className="mt-6 space-y-2.5">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    { q: "Is DMOrbit safe to use with my Instagram account?", a: "Yes. We use Meta's official Messenger API for Instagram. No password sharing, no risk to your account." },
    { q: "Do I need a business account?", a: "Yes, an Instagram Business or Creator account is required to use DM automation per Meta's API." },
    { q: "Can I cancel anytime?", a: "Absolutely. Cancel from settings — no calls, no emails, no friction." },
    { q: "Does it work for Reels and Stories?", a: "Yes — comments on posts and Reels, plus story replies and DM keywords." },
    { q: "How fast does the DM go out?", a: "Usually within 1–3 seconds of the comment being posted." },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="bg-muted/30 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">Questions, answered</h2>
        </div>
        <div className="mt-10 space-y-3">
          {items.map((it, i) => (
            <div key={i} className="rounded-2xl border bg-card shadow-card">
              <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-4 p-5 text-left">
                <span className="font-semibold">{it.q}</span>
                <ChevronDown className={`h-4 w-4 shrink-0 transition ${open === i ? "rotate-180" : ""}`} />
              </button>
              {open === i && <div className="px-5 pb-5 text-sm text-muted-foreground">{it.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
      <div className="relative overflow-hidden rounded-[2rem] ig-gradient p-10 text-center text-white shadow-pop sm:p-16">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">Ready to turn comments into customers?</h2>
        <p className="mx-auto mt-3 max-w-xl text-white/90">Join 12,000+ creators automating Instagram with DMOrbit.</p>
        <Link to="/signup" className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-foreground shadow-pop">
          Start Free <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:grid-cols-4 sm:px-8">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-xl ig-gradient text-white"><Sparkles className="h-3.5 w-3.5" /></div>
            <span className="font-extrabold">DMOrbit</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Turn Instagram engagement into conversations, leads and customers.</p>
        </div>
        {[
          { h: "Product", l: ["Features", "Pricing", "Changelog", "Roadmap"] },
          { h: "Company", l: ["About", "Blog", "Careers", "Contact"] },
          { h: "Legal", l: ["Privacy", "Terms", "Security", "DPA"] },
        ].map((c) => (
          <div key={c.h}>
            <div className="text-xs font-extrabold uppercase tracking-wider">{c.h}</div>
            <ul className="mt-3 space-y-2">
              {c.l.map((x) => (
                <li key={x}><a className="text-sm text-muted-foreground hover:text-foreground" href="#">{x}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-5 text-xs text-muted-foreground sm:flex-row sm:px-8">
          <div>© {new Date().getFullYear()} DMOrbit, Inc.</div>
          <div>Made with ❤️ for creators</div>
        </div>
      </div>
    </footer>
  );
}
