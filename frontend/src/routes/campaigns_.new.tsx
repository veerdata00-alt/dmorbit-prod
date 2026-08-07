import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MessageCircle, Reply, Camera, Search, FileText, Link as LinkIcon, ShoppingBag, Users,
  Video, GraduationCap, Megaphone, Check, ArrowRight, ArrowLeft, X, Upload, Sparkles,
  CheckCircle2, Image as ImageIcon, Info
} from "lucide-react";
import { store } from "@/lib/store";
import { toast } from "sonner";
import type { CampaignType, CampaignGoal } from "@/lib/store";
import { apiClient } from "../lib/api/client";

export const Route = createFileRoute("/campaigns_/new")({
  validateSearch: (search: Record<string, unknown>): { editId?: string } => {
    return {
      editId: search.editId as string | undefined,
    }
  },
  head: () => ({ meta: [{ title: "New Campaign — DMOrbit" }] }),
  component: NewCampaign,
});

const TYPES: { id: CampaignType; title: string; desc: string; icon: any }[] = [
  { id: "comment_dm", title: "Comment → DM", desc: "Reply publicly + send DM when someone comments.", icon: MessageCircle },
  { id: "comment_reply", title: "Comment Reply", desc: "Auto-reply publicly under every comment.", icon: Reply },
  { id: "story_reply", title: "Story Reply", desc: "Trigger DMs when users reply to your story.", icon: Camera },
  { id: "dm_keyword", title: "DM Keyword", desc: "Send a DM when someone messages a keyword.", icon: Search },
];

const GOALS_COMMENT_DM: { id: CampaignGoal; title: string; desc: string; icon: any }[] = [
  { id: "pdf", title: "PDF Delivery", desc: "Send a free guide or eBook.", icon: FileText },
  { id: "link", title: "Link Delivery", desc: "Share any URL via DM.", icon: LinkIcon },
  { id: "product", title: "Product Promotion", desc: "Send a product link.", icon: ShoppingBag },
  { id: "lead", title: "Lead Generation", desc: "Capture email + name.", icon: Users },
  { id: "webinar", title: "Webinar Registration", desc: "Send a registration link.", icon: Video },
  { id: "course", title: "Course Delivery", desc: "Deliver course access.", icon: GraduationCap },
];

const STEPS = ["Type", "Goal", "Posts", "Trigger", "Resource", "Gate", "Messages", "Review"];

function NewCampaign() {
  const navigate = useNavigate();
  const { editId } = Route.useSearch();
  
  const [step, setStep] = useState(0);
  const [type, setType] = useState<CampaignType | null>(null);
  const [goal, setGoal] = useState<CampaignGoal | null>(null);
  const [scope, setScope] = useState<"any" | "specific" | "multiple">("any");
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [trigger, setTrigger] = useState<"any" | "keywords">("any");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [resourceValue, setResourceValue] = useState("");
  const [resourceFile, setResourceFile] = useState<string | null>(null);
  const [followGate, setFollowGate] = useState(true);
  const [useDefault, setUseDefault] = useState(true);
  const [publicReply, setPublicReply] = useState("📩 Check your DMs.");
  const [dmMessage, setDmMessage] = useState("Here's your resource 👇");
  const [name, setName] = useState("");
  const [publishing, setPublishing] = useState(false);

  const { data: existingCampaign, isSuccess: isExistingLoaded } = useQuery({
    queryKey: ['campaign', editId],
    queryFn: async () => {
      if (!editId) return null;
      const res = await apiClient.get('/api/v2/automations');
      const all = res.data.automations || res.data || [];
      return all.find((c: any) => c._id === editId || c.id === editId);
    },
    enabled: !!editId
  });

  const { data: media = [], isLoading: isLoadingMedia } = useQuery({
    queryKey: ['ig_media'],
    queryFn: async () => {
      const res = await apiClient.get('/api/instagram/media');
      return res.data || [];
    },
    enabled: (scope === "specific" || scope === "multiple") && type !== "story_reply"
  });

  const { data: stories = [], isLoading: isLoadingStories } = useQuery({
    queryKey: ['ig_stories'],
    queryFn: async () => {
      const res = await apiClient.get('/api/instagram/stories');
      return res.data || [];
    },
    enabled: (scope === "specific" || scope === "multiple") && type === "story_reply"
  });

  useEffect(() => {
    if (isExistingLoaded && existingCampaign) {
      setType((existingCampaign.campaignType || "comment_dm").toLowerCase() as CampaignType);
      setGoal((existingCampaign.templateType || "pdf") as CampaignGoal);
      
      const t = existingCampaign.target || {};
      setScope(t.type || "any");
      if (t.mediaIds?.length) setSelectedMediaIds(t.mediaIds);
      else if (t.mediaId) setSelectedMediaIds([t.mediaId]);
      else if (existingCampaign.targetMediaIds?.length) setSelectedMediaIds(existingCampaign.targetMediaIds);
      
      if (existingCampaign.trigger?.keywords?.length) {
        setTrigger("keywords");
        setKeywords(existingCampaign.trigger.keywords);
      } else {
        setTrigger("any");
      }
      
      if (existingCampaign.resource?.kind === "pdf") {
        setResourceFile(existingCampaign.resource.fileName || "guide.pdf");
      } else {
        setResourceValue(existingCampaign.resource?.value || "");
      }
      
      setFollowGate(existingCampaign.followGate ?? true);
      setPublicReply(existingCampaign.publicReplyText || existingCampaign.publicReply || "📩 Check your DMs.");
      setDmMessage(existingCampaign.privateMessageText || existingCampaign.actions?.[0]?.text || "Here's your resource 👇");
      setName(existingCampaign.name || "");
      if (existingCampaign.publicReplyText || existingCampaign.privateMessageText) setUseDefault(false);
    }
  }, [existingCampaign, isExistingLoaded]);

  const goalsAvailable = useMemo(() => {
    if (type === "comment_reply") return [{ id: "public_reply" as CampaignGoal, title: "Public Reply", desc: "Reply publicly under every matching comment.", icon: Reply }];
    return GOALS_COMMENT_DM;
  }, [type]);

  const skipResourceStep = goal === "public_reply";
  const visibleSteps = STEPS.filter((s) => {
    if (type === "dm_keyword" && s === "Posts") return false;
    if (skipResourceStep && (s === "Resource" || s === "Gate")) return false;
    return true;
  });
  const progress = ((step + 1) / visibleSteps.length) * 100;
  const currentStep = visibleSteps[step];

  const breadcrumbs = useMemo(() => {
    const parts = [];
    if (type) parts.push(TYPES.find(t => t.id === type)?.title);
    if (goal && currentStep !== "Type") parts.push(goalsAvailable.find(g => g.id === goal)?.title);
    if (scope && currentStep !== "Type" && currentStep !== "Goal") {
        parts.push(scope === "any" ? (type === "story_reply" ? "Any Story" : "Any Post") : scope === "specific" ? "Specific" : "Multiple");
    }
    return parts.filter(Boolean).join(" > ");
  }, [type, goal, scope, currentStep, goalsAvailable]);

  const canNext = () => {
    switch (currentStep) {
      case "Type": return !!type;
      case "Goal": return !!goal;
      case "Posts": 
        if (scope === "any") return true;
        if (type === "story_reply" && stories.length === 0 && !isLoadingStories) return false;
        if (scope === "specific") return selectedMediaIds.length === 1;
        if (scope === "multiple") return selectedMediaIds.length > 0;
        return false;
      case "Trigger": return trigger === "any" || keywords.length > 0;
      case "Resource":
        if (goal === "pdf") return !!resourceFile;
        return !!resourceValue;
      case "Gate": return true;
      case "Messages": 
        const isPublicReplyValid = type === "dm_keyword" ? true : publicReply.trim().length > 0;
        return isPublicReplyValid && (goal === "public_reply" || dmMessage.trim().length > 0);
      case "Review": return name.trim().length > 0;
      default: return true;
    }
  };

  const next = () => {
    if (!canNext()) return;
    if (step === visibleSteps.length - 1) return publish();
    setStep((s) => Math.min(s + 1, visibleSteps.length - 1));
  };
  const back = () => (step === 0 ? navigate({ to: "/campaigns" }) : setStep((s) => s - 1));

  const publish = () => {
    if (!type || !goal) return;
    setPublishing(true);
    setTimeout(async () => {
      try {
        const resource = goal === "pdf"
            ? { kind: "pdf", value: "https://files.dmorbit.app/" + Math.random().toString(36).slice(2, 8) + ".pdf", fileName: resourceFile ?? "guide.pdf" }
            : { kind: goal, value: resourceValue };
            
        const isDmOrReply = type === "comment_dm" || type === "comment_reply";
        const finalTrigger = type === "dm_keyword" ? "keywords" : trigger;
        const payload = {
          name: name || `${TYPES.find((t) => t.id === type)?.title} #${Math.floor(Math.random() * 99)}`,
          campaignType: type.toUpperCase(),
          templateType: goal,
          triggerType: type === "story_reply" ? "STORY_REPLY" : (finalTrigger === "keywords" ? "KEYWORDS" : "ANY_COMMENT"),
          mode: finalTrigger === "keywords" ? "keyword" : "any_comment",
          keywords: finalTrigger === "keywords" ? keywords : [],
          target: {
             type: scope === "any" ? "global" : scope,
             mediaIds: scope === "any" ? [] : selectedMediaIds,
          },
          targetMediaIds: scope === "any" ? [] : selectedMediaIds,
          resource,
          followGate,
          dmMessage: goal !== "public_reply" ? dmMessage : undefined,
          publicReply: isDmOrReply ? publicReply : undefined,
        };

        let redirectId = editId;
        if (editId) {
            await apiClient.put(`/api/v2/automations/${editId}`, payload);
            toast.success("Campaign updated 🎉");
        } else {
            const res = await apiClient.post('/api/v2/automations', payload);
            toast.success("Campaign published 🎉");
            redirectId = res.data.automation?._id || res.data._id || res.data.id;
        }
        if (redirectId) {
            navigate({ to: `/campaigns/${redirectId}` });
        } else {
            navigate({ to: "/campaigns" });
        }
      } catch (err: any) {
        toast.error(err.response?.data?.error || "Failed to publish campaign");
        setPublishing(false);
      }
    }, 800);
  };

  const addKeyword = (k: string) => {
    const v = k.trim().toUpperCase();
    if (!v || keywords.includes(v)) return;
    setKeywords([...keywords, v]);
    setKeywordInput("");
  };

  const toggleMedia = (id: string) => {
      if (scope === "specific") {
          setSelectedMediaIds([id]);
      } else {
          setSelectedMediaIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
      }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link to="/campaigns" className="grid h-9 w-9 place-items-center rounded-full border hover:bg-muted">
            <X className="h-4 w-4" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>{editId ? "Edit Campaign" : `Step ${step + 1} of ${visibleSteps.length}`}</span>
              <span className="max-w-[200px] truncate sm:max-w-xs">{breadcrumbs || currentStep}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full ig-gradient transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-40 pt-6 sm:px-6 sm:pt-10">
        {currentStep === "Type" && (
          <Stepper title="What kind of campaign?" sub="Pick the trigger that fits your goal.">
            <div className="grid gap-3 sm:grid-cols-2">
              {TYPES.map((t) => (
                <SelectCard key={t.id} icon={t.icon} title={t.title} desc={t.desc} active={type === t.id} onClick={() => { setType(t.id); setGoal(null); if (t.id === "dm_keyword") setTrigger("keywords"); }} />
              ))}
            </div>
          </Stepper>
        )}

        {currentStep === "Goal" && (
          <Stepper title="What's the goal?" sub="DMOrbit will optimize the flow for this outcome.">
            <div className="grid gap-3 sm:grid-cols-2">
              {goalsAvailable.map((g) => (
                <SelectCard key={g.id} icon={g.icon} title={g.title} desc={g.desc} active={goal === g.id} onClick={() => setGoal(g.id)} />
              ))}
            </div>
          </Stepper>
        )}

        {currentStep === "Posts" && (
          <Stepper title="Where should it run?" sub="Choose which posts trigger this campaign.">
            <div className="grid gap-3 sm:grid-cols-3">
              <SelectCard icon={Camera} title={type === "story_reply" ? "Specific Story" : "Specific Post"} desc="Pick a single item." active={scope === "specific"} onClick={() => setScope("specific")} />
              <SelectCard icon={Sparkles} title={type === "story_reply" ? "Multiple Stories" : "Multiple Posts"} desc="Select several items." active={scope === "multiple"} onClick={() => setScope("multiple")} />
              <SelectCard icon={Megaphone} title={type === "story_reply" ? "Any Story" : "Any Post"} desc={type === "story_reply" ? "Runs across all active stories." : "Runs across all posts and reels."} active={scope === "any"} onClick={() => { setScope("any"); setSelectedMediaIds([]); }} />
            </div>
            
            {scope === "any" ? (
              <div className="mt-6 rounded-3xl border border-dashed bg-card/50 p-10 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10">
                  <Megaphone className="h-7 w-7 text-primary" />
                </div>
                <h4 className="mt-4 text-lg font-bold">All Posts Selected</h4>
                <p className="mt-2 text-sm text-muted-foreground">
                  This automation will run on all current and future {type === "story_reply" ? "stories" : "posts and reels"}.
                </p>
              </div>
            ) : (
              <div className="mt-6">
                 {type === "story_reply" ? (
                    isLoadingStories ? (
                        <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground animate-pulse">Loading active stories...</div>
                    ) : stories.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-destructive/50 bg-destructive/10 p-6 text-center text-sm text-destructive">
                            <Info className="mx-auto mb-2 h-6 w-6" />
                            No active stories found on your Instagram account. Post a story first to use this feature.
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {stories.map((s: any) => (
                                <MediaItem 
                                    key={s.id} 
                                    item={s} 
                                    selected={selectedMediaIds.includes(s.id)} 
                                    onSelect={() => toggleMedia(s.id)} 
                                />
                            ))}
                        </div>
                    )
                 ) : (
                    isLoadingMedia ? (
                        <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground animate-pulse">Loading recent posts...</div>
                    ) : media.length === 0 ? (
                        <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                            No posts found on your Instagram account.
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {media.map((m: any) => (
                                <MediaItem 
                                    key={m.id} 
                                    item={m} 
                                    selected={selectedMediaIds.includes(m.id)} 
                                    onSelect={() => toggleMedia(m.id)} 
                                />
                            ))}
                        </div>
                    )
                 )}
              </div>
            )}
          </Stepper>
        )}

        {currentStep === "Trigger" && (
          <Stepper title="What triggers it?" sub="Pick any comment or specific keywords.">
            <div className={`grid gap-3 ${type === "dm_keyword" ? "sm:grid-cols-1" : "sm:grid-cols-2"}`}>
              {type !== "dm_keyword" && (
                <SelectCard icon={MessageCircle} title="Any Comment" desc="Trigger on every comment." active={trigger === "any"} onClick={() => setTrigger("any")} />
              )}
              <SelectCard icon={Search} title="Specific Keywords" desc="Only trigger on matching words." active={trigger === "keywords"} onClick={() => setTrigger("keywords")} />
            </div>
            {trigger === "keywords" && (
              <div className="mt-5 rounded-3xl border bg-card p-5 shadow-card">
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Keywords</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {keywords.map((k) => (
                    <span key={k} className="inline-flex items-center gap-1.5 rounded-full ig-gradient-soft px-3 py-1 text-xs font-bold">
                      {k}
                      <button onClick={() => setKeywords(keywords.filter((x) => x !== k))}><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addKeyword(keywordInput); } }}
                    placeholder="Type a keyword and press Enter"
                    className="flex-1 rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-foreground"
                  />
                  <button onClick={() => addKeyword(keywordInput)} className="rounded-xl bg-foreground px-4 text-sm font-semibold text-background">Add</button>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {["PDF", "GUIDE", "FREE", "START"].map((s) => (
                    <button key={s} onClick={() => addKeyword(s)} className="rounded-full border bg-background px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Stepper>
        )}

        {currentStep === "Resource" && (
          <Stepper title="What should we send?" sub="DMOrbit will deliver this in DM.">
            <div className="rounded-3xl border bg-card p-5 shadow-card">
              {goal === "pdf" ? (
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed bg-muted/30 px-6 py-10 text-center hover:bg-muted/50">
                  <Upload className="h-6 w-6" />
                  <div className="text-sm font-semibold">{resourceFile ?? "Tap to upload PDF"}</div>
                  <div className="text-xs text-muted-foreground">We host and share automatically.</div>
                  <input type="file" accept="application/pdf" className="hidden" onChange={(e) => setResourceFile(e.target.files?.[0]?.name ?? null)} />
                </label>
              ) : (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    {goal === "product" ? "Product URL" : goal === "webinar" ? "Webinar Registration URL" : goal === "course" ? "Course Access URL" : "Link"}
                  </label>
                  <input
                    value={resourceValue}
                    onChange={(e) => setResourceValue(e.target.value)}
                    placeholder="https://"
                    className="mt-2 w-full rounded-xl border bg-background px-3.5 py-3 text-sm outline-none focus:border-foreground"
                  />
                </div>
              )}
            </div>
          </Stepper>
        )}

        {currentStep === "Gate" && (
          <Stepper title="Require follow before access?" sub="Grow your audience while you deliver.">
            <button
              onClick={() => setFollowGate(!followGate)}
              className="flex w-full items-center gap-4 rounded-3xl border bg-card p-5 text-left shadow-card"
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl ig-gradient-soft">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold">Require Follow Before Access</div>
                <div className="text-xs text-muted-foreground">Users must follow you to receive the DM.</div>
              </div>
              <div className={`relative h-7 w-12 shrink-0 rounded-full transition ${followGate ? "ig-gradient" : "bg-muted"}`}>
                <div className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${followGate ? "left-[1.375rem]" : "left-0.5"}`} />
              </div>
            </button>
          </Stepper>
        )}

        {currentStep === "Messages" && (
          <Stepper title="Messages" sub="Use our defaults or write your own.">
            <div className="mb-4 grid grid-cols-2 gap-2 rounded-full bg-muted p-1">
              <button onClick={() => setUseDefault(true)} className={`rounded-full py-2 text-xs font-semibold ${useDefault ? "bg-background shadow" : "text-muted-foreground"}`}>Use Default</button>
              <button onClick={() => setUseDefault(false)} className={`rounded-full py-2 text-xs font-semibold ${!useDefault ? "bg-background shadow" : "text-muted-foreground"}`}>Customize</button>
            </div>
            <div className="space-y-4">
              {type !== "dm_keyword" && (
                <MessageField label="Public Reply" value={publicReply} onChange={setPublicReply} disabled={useDefault} />
              )}
              {goal !== "public_reply" && (
                <MessageField label="DM Message" value={dmMessage} onChange={setDmMessage} disabled={useDefault} />
              )}
            </div>
          </Stepper>
        )}

        {currentStep === "Review" && (
          <Stepper title="Review & Publish" sub="Looks good? Let's launch.">
            <div className="rounded-3xl border bg-card p-5 shadow-card">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Campaign name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Free Instagram Growth PDF"
                className="mt-2 w-full rounded-xl border bg-background px-3.5 py-3 text-sm outline-none focus:border-foreground"
              />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <SummaryRow label="Type" value={TYPES.find((t) => t.id === type)?.title ?? "—"} />
              <SummaryRow label="Goal" value={goalsAvailable.find((g) => g.id === goal)?.title ?? "—"} />
              <SummaryRow label="Scope" value={scope} />
              <SummaryRow label="Targets" value={scope === "any" ? "All" : `${selectedMediaIds.length} Selected`} />
              <SummaryRow label="Trigger" value={trigger === "any" ? "Any comment" : keywords.join(", ")} />
              {!skipResourceStep && <SummaryRow label="Resource" value={goal === "pdf" ? (resourceFile ?? "PDF") : resourceValue || "—"} />}
              {!skipResourceStep && <SummaryRow label="Follow Gate" value={followGate ? "On" : "Off"} />}
              {(type === "comment_dm" || type === "comment_reply") && <SummaryRow label="Public Reply" value={publicReply} />}
              {goal !== "public_reply" && <SummaryRow label="DM Message" value={dmMessage} />}
            </div>
            <div className="mt-5 flex items-center gap-2 rounded-2xl border bg-gradient-to-br from-emerald-500/10 to-teal-400/10 p-4 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Ready to publish — your automation will run immediately.
            </div>
          </Stepper>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 backdrop-blur safe-pb">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <button onClick={back} className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-semibold">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <button
            onClick={next}
            disabled={!canNext() || publishing}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full ig-gradient px-6 py-2.5 text-sm font-semibold text-white shadow-pop transition active:scale-[0.98] disabled:opacity-50"
          >
            {step === visibleSteps.length - 1 ? (publishing ? "Publishing…" : editId ? "Save Changes" : "Publish Campaign") : "Continue"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Stepper({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function SelectCard({ icon: Icon, title, desc, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col gap-2 overflow-hidden rounded-3xl border bg-card p-5 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-pop ${
        active ? "ring-2 ring-foreground" : ""
      }`}
    >
      {active && (
        <div className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full ig-gradient text-white">
          <Check className="h-3.5 w-3.5" />
        </div>
      )}
      <div className="grid h-10 w-10 place-items-center rounded-2xl ig-gradient-soft">
        <Icon className="h-5 w-5" />
      </div>
      <div className="font-bold">{title}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </button>
  );
}

function MediaItem({ item, selected, onSelect }: any) {
    return (
        <button 
            onClick={onSelect}
            className={`group relative aspect-[4/5] overflow-hidden rounded-2xl border bg-muted shadow-sm transition hover:shadow-md ${selected ? 'ring-2 ring-foreground ring-offset-2' : ''}`}
        >
            {item.thumbnail_url || item.media_url ? (
                <img src={item.thumbnail_url || item.media_url} alt="Media" className="h-full w-full object-cover" />
            ) : (
                <div className="grid h-full w-full place-items-center bg-card">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
            
            {selected && (
                <div className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full ig-gradient text-white shadow">
                    <Check className="h-3.5 w-3.5" />
                </div>
            )}
            
            <div className="absolute bottom-2 left-2 right-2 text-left">
                <span className="rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white backdrop-blur">
                    {item.media_type}
                </span>
                {item.caption && (
                    <p className="mt-1 line-clamp-2 text-[10px] leading-tight text-white/90">
                        {item.caption}
                    </p>
                )}
            </div>
        </button>
    )
}

function MessageField({ label, value, onChange, disabled }: any) {
  return (
    <div className="rounded-3xl border bg-card p-5 shadow-card">
      <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={3}
        className="mt-2 w-full resize-none rounded-xl border bg-background px-3.5 py-3 text-sm outline-none focus:border-foreground disabled:opacity-60"
      />
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-card p-3.5 shadow-card">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold capitalize">{value}</div>
    </div>
  );
}
