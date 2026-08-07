import { t as apiClient } from "./client-CDls2Pz7.js";
import { t as Route } from "./campaigns_.new-CVL8x2A-.js";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Camera, Check, CheckCircle2, FileText, GraduationCap, Image, Info, Link as Link$1, Megaphone, MessageCircle, Reply, Search, ShoppingBag, Sparkles, Upload, Users, Video, X } from "lucide-react";
//#region src/routes/campaigns_.new.tsx?tsr-split=component
var TYPES = [
	{
		id: "comment_dm",
		title: "Comment → DM",
		desc: "Reply publicly + send DM when someone comments.",
		icon: MessageCircle
	},
	{
		id: "comment_reply",
		title: "Comment Reply",
		desc: "Auto-reply publicly under every comment.",
		icon: Reply
	},
	{
		id: "story_reply",
		title: "Story Reply",
		desc: "Trigger DMs when users reply to your story.",
		icon: Camera
	},
	{
		id: "dm_keyword",
		title: "DM Keyword",
		desc: "Send a DM when someone messages a keyword.",
		icon: Search
	}
];
var GOALS_COMMENT_DM = [
	{
		id: "pdf",
		title: "PDF Delivery",
		desc: "Send a free guide or eBook.",
		icon: FileText
	},
	{
		id: "link",
		title: "Link Delivery",
		desc: "Share any URL via DM.",
		icon: Link$1
	},
	{
		id: "product",
		title: "Product Promotion",
		desc: "Send a product link.",
		icon: ShoppingBag
	},
	{
		id: "lead",
		title: "Lead Generation",
		desc: "Capture email + name.",
		icon: Users
	},
	{
		id: "webinar",
		title: "Webinar Registration",
		desc: "Send a registration link.",
		icon: Video
	},
	{
		id: "course",
		title: "Course Delivery",
		desc: "Deliver course access.",
		icon: GraduationCap
	}
];
var STEPS = [
	"Type",
	"Goal",
	"Posts",
	"Trigger",
	"Resource",
	"Gate",
	"Messages",
	"Review"
];
function NewCampaign() {
	const navigate = useNavigate();
	const { editId } = Route.useSearch();
	const [step, setStep] = useState(0);
	const [type, setType] = useState(null);
	const [goal, setGoal] = useState(null);
	const [scope, setScope] = useState("any");
	const [selectedMediaIds, setSelectedMediaIds] = useState([]);
	const [trigger, setTrigger] = useState("any");
	const [keywords, setKeywords] = useState([]);
	const [keywordInput, setKeywordInput] = useState("");
	const [resourceValue, setResourceValue] = useState("");
	const [resourceFile, setResourceFile] = useState(null);
	const [followGate, setFollowGate] = useState(true);
	const [useDefault, setUseDefault] = useState(true);
	const [publicReply, setPublicReply] = useState("📩 Check your DMs.");
	const [dmMessage, setDmMessage] = useState("Here's your resource 👇");
	const [name, setName] = useState("");
	const [publishing, setPublishing] = useState(false);
	const { data: existingCampaign, isSuccess: isExistingLoaded } = useQuery({
		queryKey: ["campaign", editId],
		queryFn: async () => {
			if (!editId) return null;
			const res = await apiClient.get("/api/v2/automations");
			return (res.data.automations || res.data || []).find((c) => c._id === editId || c.id === editId);
		},
		enabled: !!editId
	});
	const { data: media = [], isLoading: isLoadingMedia } = useQuery({
		queryKey: ["ig_media"],
		queryFn: async () => {
			return (await apiClient.get("/api/instagram/media")).data || [];
		},
		enabled: (scope === "specific" || scope === "multiple") && type !== "story_reply"
	});
	const { data: stories = [], isLoading: isLoadingStories } = useQuery({
		queryKey: ["ig_stories"],
		queryFn: async () => {
			return (await apiClient.get("/api/instagram/stories")).data || [];
		},
		enabled: (scope === "specific" || scope === "multiple") && type === "story_reply"
	});
	useEffect(() => {
		if (isExistingLoaded && existingCampaign) {
			setType((existingCampaign.campaignType || "comment_dm").toLowerCase());
			setGoal(existingCampaign.templateType || "pdf");
			const t = existingCampaign.target || {};
			setScope(t.type || "any");
			if (t.mediaIds?.length) setSelectedMediaIds(t.mediaIds);
			else if (t.mediaId) setSelectedMediaIds([t.mediaId]);
			else if (existingCampaign.targetMediaIds?.length) setSelectedMediaIds(existingCampaign.targetMediaIds);
			if (existingCampaign.trigger?.keywords?.length) {
				setTrigger("keywords");
				setKeywords(existingCampaign.trigger.keywords);
			} else setTrigger("any");
			if (existingCampaign.resource?.kind === "pdf") setResourceFile(existingCampaign.resource.fileName || "guide.pdf");
			else setResourceValue(existingCampaign.resource?.value || "");
			setFollowGate(existingCampaign.followGate ?? true);
			setPublicReply(existingCampaign.publicReplyText || existingCampaign.publicReply || "📩 Check your DMs.");
			setDmMessage(existingCampaign.privateMessageText || existingCampaign.actions?.[0]?.text || "Here's your resource 👇");
			setName(existingCampaign.name || "");
			if (existingCampaign.publicReplyText || existingCampaign.privateMessageText) setUseDefault(false);
		}
	}, [existingCampaign, isExistingLoaded]);
	const goalsAvailable = useMemo(() => {
		if (type === "comment_reply") return [{
			id: "public_reply",
			title: "Public Reply",
			desc: "Reply publicly under every matching comment.",
			icon: Reply
		}];
		return GOALS_COMMENT_DM;
	}, [type]);
	const skipResourceStep = goal === "public_reply";
	const visibleSteps = STEPS.filter((s) => {
		if (type === "dm_keyword" && s === "Posts") return false;
		if (skipResourceStep && (s === "Resource" || s === "Gate")) return false;
		return true;
	});
	const progress = (step + 1) / visibleSteps.length * 100;
	const currentStep = visibleSteps[step];
	const breadcrumbs = useMemo(() => {
		const parts = [];
		if (type) parts.push(TYPES.find((t) => t.id === type)?.title);
		if (goal && currentStep !== "Type") parts.push(goalsAvailable.find((g) => g.id === goal)?.title);
		if (scope && currentStep !== "Type" && currentStep !== "Goal") parts.push(scope === "any" ? type === "story_reply" ? "Any Story" : "Any Post" : scope === "specific" ? "Specific" : "Multiple");
		return parts.filter(Boolean).join(" > ");
	}, [
		type,
		goal,
		scope,
		currentStep,
		goalsAvailable
	]);
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
			case "Messages": return (type === "dm_keyword" ? true : publicReply.trim().length > 0) && (goal === "public_reply" || dmMessage.trim().length > 0);
			case "Review": return name.trim().length > 0;
			default: return true;
		}
	};
	const next = () => {
		if (!canNext()) return;
		if (step === visibleSteps.length - 1) return publish();
		setStep((s) => Math.min(s + 1, visibleSteps.length - 1));
	};
	const back = () => step === 0 ? navigate({ to: "/campaigns" }) : setStep((s) => s - 1);
	const publish = () => {
		if (!type || !goal) return;
		setPublishing(true);
		setTimeout(async () => {
			try {
				const resource = goal === "pdf" ? {
					kind: "pdf",
					value: "https://files.dmorbit.app/" + Math.random().toString(36).slice(2, 8) + ".pdf",
					fileName: resourceFile ?? "guide.pdf"
				} : {
					kind: goal,
					value: resourceValue
				};
				const isDmOrReply = type === "comment_dm" || type === "comment_reply";
				const finalTrigger = type === "dm_keyword" ? "keywords" : trigger;
				const payload = {
					name: name || `${TYPES.find((t) => t.id === type)?.title} #${Math.floor(Math.random() * 99)}`,
					campaignType: type.toUpperCase(),
					templateType: goal,
					triggerType: type === "story_reply" ? "STORY_REPLY" : finalTrigger === "keywords" ? "KEYWORDS" : "ANY_COMMENT",
					mode: finalTrigger === "keywords" ? "keyword" : "any_comment",
					keywords: finalTrigger === "keywords" ? keywords : [],
					target: {
						type: scope === "any" ? "global" : scope,
						mediaIds: scope === "any" ? [] : selectedMediaIds
					},
					targetMediaIds: scope === "any" ? [] : selectedMediaIds,
					resource,
					followGate,
					dmMessage: goal !== "public_reply" ? dmMessage : void 0,
					publicReply: isDmOrReply ? publicReply : void 0
				};
				let redirectId = editId;
				if (editId) {
					await apiClient.put(`/api/v2/automations/${editId}`, payload);
					toast.success("Campaign updated 🎉");
				} else {
					const res = await apiClient.post("/api/v2/automations", payload);
					toast.success("Campaign published 🎉");
					redirectId = res.data.automation?._id || res.data._id || res.data.id;
				}
				if (redirectId) navigate({ to: `/campaigns/${redirectId}` });
				else navigate({ to: "/campaigns" });
			} catch (err) {
				toast.error(err.response?.data?.error || "Failed to publish campaign");
				setPublishing(false);
			}
		}, 800);
	};
	const addKeyword = (k) => {
		const v = k.trim().toUpperCase();
		if (!v || keywords.includes(v)) return;
		setKeywords([...keywords, v]);
		setKeywordInput("");
	};
	const toggleMedia = (id) => {
		if (scope === "specific") setSelectedMediaIds([id]);
		else setSelectedMediaIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "min-h-screen bg-background",
		children: [
			/* @__PURE__ */ jsx("header", {
				className: "sticky top-0 z-20 border-b bg-background/85 backdrop-blur",
				children: /* @__PURE__ */ jsxs("div", {
					className: "mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6",
					children: [/* @__PURE__ */ jsx(Link, {
						to: "/campaigns",
						className: "grid h-9 w-9 place-items-center rounded-full border hover:bg-muted",
						children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
					}), /* @__PURE__ */ jsxs("div", {
						className: "flex-1",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center justify-between text-xs font-semibold text-muted-foreground",
							children: [/* @__PURE__ */ jsx("span", { children: editId ? "Edit Campaign" : `Step ${step + 1} of ${visibleSteps.length}` }), /* @__PURE__ */ jsx("span", {
								className: "max-w-[200px] truncate sm:max-w-xs",
								children: breadcrumbs || currentStep
							})]
						}), /* @__PURE__ */ jsx("div", {
							className: "mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted",
							children: /* @__PURE__ */ jsx("div", {
								className: "h-full ig-gradient transition-all duration-300",
								style: { width: `${progress}%` }
							})
						})]
					})]
				})
			}),
			/* @__PURE__ */ jsxs("main", {
				className: "mx-auto max-w-3xl px-4 pb-40 pt-6 sm:px-6 sm:pt-10",
				children: [
					currentStep === "Type" && /* @__PURE__ */ jsx(Stepper, {
						title: "What kind of campaign?",
						sub: "Pick the trigger that fits your goal.",
						children: /* @__PURE__ */ jsx("div", {
							className: "grid gap-3 sm:grid-cols-2",
							children: TYPES.map((t) => /* @__PURE__ */ jsx(SelectCard, {
								icon: t.icon,
								title: t.title,
								desc: t.desc,
								active: type === t.id,
								onClick: () => {
									setType(t.id);
									setGoal(null);
									if (t.id === "dm_keyword") setTrigger("keywords");
								}
							}, t.id))
						})
					}),
					currentStep === "Goal" && /* @__PURE__ */ jsx(Stepper, {
						title: "What's the goal?",
						sub: "DMOrbit will optimize the flow for this outcome.",
						children: /* @__PURE__ */ jsx("div", {
							className: "grid gap-3 sm:grid-cols-2",
							children: goalsAvailable.map((g) => /* @__PURE__ */ jsx(SelectCard, {
								icon: g.icon,
								title: g.title,
								desc: g.desc,
								active: goal === g.id,
								onClick: () => setGoal(g.id)
							}, g.id))
						})
					}),
					currentStep === "Posts" && /* @__PURE__ */ jsxs(Stepper, {
						title: "Where should it run?",
						sub: "Choose which posts trigger this campaign.",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "grid gap-3 sm:grid-cols-3",
							children: [
								/* @__PURE__ */ jsx(SelectCard, {
									icon: Camera,
									title: type === "story_reply" ? "Specific Story" : "Specific Post",
									desc: "Pick a single item.",
									active: scope === "specific",
									onClick: () => setScope("specific")
								}),
								/* @__PURE__ */ jsx(SelectCard, {
									icon: Sparkles,
									title: type === "story_reply" ? "Multiple Stories" : "Multiple Posts",
									desc: "Select several items.",
									active: scope === "multiple",
									onClick: () => setScope("multiple")
								}),
								/* @__PURE__ */ jsx(SelectCard, {
									icon: Megaphone,
									title: type === "story_reply" ? "Any Story" : "Any Post",
									desc: type === "story_reply" ? "Runs across all active stories." : "Runs across all posts and reels.",
									active: scope === "any",
									onClick: () => {
										setScope("any");
										setSelectedMediaIds([]);
									}
								})
							]
						}), scope === "any" ? /* @__PURE__ */ jsxs("div", {
							className: "mt-6 rounded-3xl border border-dashed bg-card/50 p-10 text-center",
							children: [
								/* @__PURE__ */ jsx("div", {
									className: "mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10",
									children: /* @__PURE__ */ jsx(Megaphone, { className: "h-7 w-7 text-primary" })
								}),
								/* @__PURE__ */ jsx("h4", {
									className: "mt-4 text-lg font-bold",
									children: "All Posts Selected"
								}),
								/* @__PURE__ */ jsxs("p", {
									className: "mt-2 text-sm text-muted-foreground",
									children: [
										"This automation will run on all current and future ",
										type === "story_reply" ? "stories" : "posts and reels",
										"."
									]
								})
							]
						}) : /* @__PURE__ */ jsx("div", {
							className: "mt-6",
							children: type === "story_reply" ? isLoadingStories ? /* @__PURE__ */ jsx("div", {
								className: "rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground animate-pulse",
								children: "Loading active stories..."
							}) : stories.length === 0 ? /* @__PURE__ */ jsxs("div", {
								className: "rounded-2xl border border-dashed border-destructive/50 bg-destructive/10 p-6 text-center text-sm text-destructive",
								children: [/* @__PURE__ */ jsx(Info, { className: "mx-auto mb-2 h-6 w-6" }), "No active stories found on your Instagram account. Post a story first to use this feature."]
							}) : /* @__PURE__ */ jsx("div", {
								className: "grid grid-cols-2 gap-3 sm:grid-cols-4",
								children: stories.map((s) => /* @__PURE__ */ jsx(MediaItem, {
									item: s,
									selected: selectedMediaIds.includes(s.id),
									onSelect: () => toggleMedia(s.id)
								}, s.id))
							}) : isLoadingMedia ? /* @__PURE__ */ jsx("div", {
								className: "rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground animate-pulse",
								children: "Loading recent posts..."
							}) : media.length === 0 ? /* @__PURE__ */ jsx("div", {
								className: "rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground",
								children: "No posts found on your Instagram account."
							}) : /* @__PURE__ */ jsx("div", {
								className: "grid grid-cols-2 gap-3 sm:grid-cols-4",
								children: media.map((m) => /* @__PURE__ */ jsx(MediaItem, {
									item: m,
									selected: selectedMediaIds.includes(m.id),
									onSelect: () => toggleMedia(m.id)
								}, m.id))
							})
						})]
					}),
					currentStep === "Trigger" && /* @__PURE__ */ jsxs(Stepper, {
						title: "What triggers it?",
						sub: "Pick any comment or specific keywords.",
						children: [/* @__PURE__ */ jsxs("div", {
							className: `grid gap-3 ${type === "dm_keyword" ? "sm:grid-cols-1" : "sm:grid-cols-2"}`,
							children: [type !== "dm_keyword" && /* @__PURE__ */ jsx(SelectCard, {
								icon: MessageCircle,
								title: "Any Comment",
								desc: "Trigger on every comment.",
								active: trigger === "any",
								onClick: () => setTrigger("any")
							}), /* @__PURE__ */ jsx(SelectCard, {
								icon: Search,
								title: "Specific Keywords",
								desc: "Only trigger on matching words.",
								active: trigger === "keywords",
								onClick: () => setTrigger("keywords")
							})]
						}), trigger === "keywords" && /* @__PURE__ */ jsxs("div", {
							className: "mt-5 rounded-3xl border bg-card p-5 shadow-card",
							children: [
								/* @__PURE__ */ jsx("label", {
									className: "text-xs font-bold uppercase tracking-wide text-muted-foreground",
									children: "Keywords"
								}),
								/* @__PURE__ */ jsx("div", {
									className: "mt-2 flex flex-wrap gap-2",
									children: keywords.map((k) => /* @__PURE__ */ jsxs("span", {
										className: "inline-flex items-center gap-1.5 rounded-full ig-gradient-soft px-3 py-1 text-xs font-bold",
										children: [k, /* @__PURE__ */ jsx("button", {
											onClick: () => setKeywords(keywords.filter((x) => x !== k)),
											children: /* @__PURE__ */ jsx(X, { className: "h-3 w-3" })
										})]
									}, k))
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "mt-3 flex gap-2",
									children: [/* @__PURE__ */ jsx("input", {
										value: keywordInput,
										onChange: (e) => setKeywordInput(e.target.value),
										onKeyDown: (e) => {
											if (e.key === "Enter") {
												e.preventDefault();
												addKeyword(keywordInput);
											}
										},
										placeholder: "Type a keyword and press Enter",
										className: "flex-1 rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-foreground"
									}), /* @__PURE__ */ jsx("button", {
										onClick: () => addKeyword(keywordInput),
										className: "rounded-xl bg-foreground px-4 text-sm font-semibold text-background",
										children: "Add"
									})]
								}),
								/* @__PURE__ */ jsx("div", {
									className: "mt-3 flex flex-wrap gap-1.5",
									children: [
										"PDF",
										"GUIDE",
										"FREE",
										"START"
									].map((s) => /* @__PURE__ */ jsxs("button", {
										onClick: () => addKeyword(s),
										className: "rounded-full border bg-background px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground",
										children: ["+ ", s]
									}, s))
								})
							]
						})]
					}),
					currentStep === "Resource" && /* @__PURE__ */ jsx(Stepper, {
						title: "What should we send?",
						sub: "DMOrbit will deliver this in DM.",
						children: /* @__PURE__ */ jsx("div", {
							className: "rounded-3xl border bg-card p-5 shadow-card",
							children: goal === "pdf" ? /* @__PURE__ */ jsxs("label", {
								className: "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed bg-muted/30 px-6 py-10 text-center hover:bg-muted/50",
								children: [
									/* @__PURE__ */ jsx(Upload, { className: "h-6 w-6" }),
									/* @__PURE__ */ jsx("div", {
										className: "text-sm font-semibold",
										children: resourceFile ?? "Tap to upload PDF"
									}),
									/* @__PURE__ */ jsx("div", {
										className: "text-xs text-muted-foreground",
										children: "We host and share automatically."
									}),
									/* @__PURE__ */ jsx("input", {
										type: "file",
										accept: "application/pdf",
										className: "hidden",
										onChange: (e) => setResourceFile(e.target.files?.[0]?.name ?? null)
									})
								]
							}) : /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
								className: "text-xs font-bold uppercase tracking-wide text-muted-foreground",
								children: goal === "product" ? "Product URL" : goal === "webinar" ? "Webinar Registration URL" : goal === "course" ? "Course Access URL" : "Link"
							}), /* @__PURE__ */ jsx("input", {
								value: resourceValue,
								onChange: (e) => setResourceValue(e.target.value),
								placeholder: "https://",
								className: "mt-2 w-full rounded-xl border bg-background px-3.5 py-3 text-sm outline-none focus:border-foreground"
							})] })
						})
					}),
					currentStep === "Gate" && /* @__PURE__ */ jsx(Stepper, {
						title: "Require follow before access?",
						sub: "Grow your audience while you deliver.",
						children: /* @__PURE__ */ jsxs("button", {
							onClick: () => setFollowGate(!followGate),
							className: "flex w-full items-center gap-4 rounded-3xl border bg-card p-5 text-left shadow-card",
							children: [
								/* @__PURE__ */ jsx("div", {
									className: "grid h-12 w-12 place-items-center rounded-2xl ig-gradient-soft",
									children: /* @__PURE__ */ jsx(Users, { className: "h-5 w-5" })
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "min-w-0 flex-1",
									children: [/* @__PURE__ */ jsx("div", {
										className: "font-bold",
										children: "Require Follow Before Access"
									}), /* @__PURE__ */ jsx("div", {
										className: "text-xs text-muted-foreground",
										children: "Users must follow you to receive the DM."
									})]
								}),
								/* @__PURE__ */ jsx("div", {
									className: `relative h-7 w-12 shrink-0 rounded-full transition ${followGate ? "ig-gradient" : "bg-muted"}`,
									children: /* @__PURE__ */ jsx("div", { className: `absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${followGate ? "left-[1.375rem]" : "left-0.5"}` })
								})
							]
						})
					}),
					currentStep === "Messages" && /* @__PURE__ */ jsxs(Stepper, {
						title: "Messages",
						sub: "Use our defaults or write your own.",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "mb-4 grid grid-cols-2 gap-2 rounded-full bg-muted p-1",
							children: [/* @__PURE__ */ jsx("button", {
								onClick: () => setUseDefault(true),
								className: `rounded-full py-2 text-xs font-semibold ${useDefault ? "bg-background shadow" : "text-muted-foreground"}`,
								children: "Use Default"
							}), /* @__PURE__ */ jsx("button", {
								onClick: () => setUseDefault(false),
								className: `rounded-full py-2 text-xs font-semibold ${!useDefault ? "bg-background shadow" : "text-muted-foreground"}`,
								children: "Customize"
							})]
						}), /* @__PURE__ */ jsxs("div", {
							className: "space-y-4",
							children: [type !== "dm_keyword" && /* @__PURE__ */ jsx(MessageField, {
								label: "Public Reply",
								value: publicReply,
								onChange: setPublicReply,
								disabled: useDefault
							}), goal !== "public_reply" && /* @__PURE__ */ jsx(MessageField, {
								label: "DM Message",
								value: dmMessage,
								onChange: setDmMessage,
								disabled: useDefault
							})]
						})]
					}),
					currentStep === "Review" && /* @__PURE__ */ jsxs(Stepper, {
						title: "Review & Publish",
						sub: "Looks good? Let's launch.",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "rounded-3xl border bg-card p-5 shadow-card",
								children: [/* @__PURE__ */ jsx("label", {
									className: "text-xs font-bold uppercase tracking-wide text-muted-foreground",
									children: "Campaign name"
								}), /* @__PURE__ */ jsx("input", {
									value: name,
									onChange: (e) => setName(e.target.value),
									placeholder: "e.g. Free Instagram Growth PDF",
									className: "mt-2 w-full rounded-xl border bg-background px-3.5 py-3 text-sm outline-none focus:border-foreground"
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "mt-3 grid gap-3 sm:grid-cols-2",
								children: [
									/* @__PURE__ */ jsx(SummaryRow, {
										label: "Type",
										value: TYPES.find((t) => t.id === type)?.title ?? "—"
									}),
									/* @__PURE__ */ jsx(SummaryRow, {
										label: "Goal",
										value: goalsAvailable.find((g) => g.id === goal)?.title ?? "—"
									}),
									/* @__PURE__ */ jsx(SummaryRow, {
										label: "Scope",
										value: scope
									}),
									/* @__PURE__ */ jsx(SummaryRow, {
										label: "Targets",
										value: scope === "any" ? "All" : `${selectedMediaIds.length} Selected`
									}),
									/* @__PURE__ */ jsx(SummaryRow, {
										label: "Trigger",
										value: trigger === "any" ? "Any comment" : keywords.join(", ")
									}),
									!skipResourceStep && /* @__PURE__ */ jsx(SummaryRow, {
										label: "Resource",
										value: goal === "pdf" ? resourceFile ?? "PDF" : resourceValue || "—"
									}),
									!skipResourceStep && /* @__PURE__ */ jsx(SummaryRow, {
										label: "Follow Gate",
										value: followGate ? "On" : "Off"
									}),
									(type === "comment_dm" || type === "comment_reply") && /* @__PURE__ */ jsx(SummaryRow, {
										label: "Public Reply",
										value: publicReply
									}),
									goal !== "public_reply" && /* @__PURE__ */ jsx(SummaryRow, {
										label: "DM Message",
										value: dmMessage
									})
								]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "mt-5 flex items-center gap-2 rounded-2xl border bg-gradient-to-br from-emerald-500/10 to-teal-400/10 p-4 text-sm",
								children: [/* @__PURE__ */ jsx(CheckCircle2, { className: "h-4 w-4 text-emerald-600" }), " Ready to publish — your automation will run immediately."]
							})
						]
					})
				]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 backdrop-blur safe-pb",
				children: /* @__PURE__ */ jsxs("div", {
					className: "mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6",
					children: [/* @__PURE__ */ jsxs("button", {
						onClick: back,
						className: "inline-flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-semibold",
						children: [/* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }), " Back"]
					}), /* @__PURE__ */ jsxs("button", {
						onClick: next,
						disabled: !canNext() || publishing,
						className: "ml-auto inline-flex items-center gap-1.5 rounded-full ig-gradient px-6 py-2.5 text-sm font-semibold text-white shadow-pop transition active:scale-[0.98] disabled:opacity-50",
						children: [step === visibleSteps.length - 1 ? publishing ? "Publishing…" : editId ? "Save Changes" : "Publish Campaign" : "Continue", /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })]
					})]
				})
			})
		]
	});
}
function Stepper({ title, sub, children }) {
	return /* @__PURE__ */ jsxs("div", { children: [
		/* @__PURE__ */ jsx("h2", {
			className: "text-2xl font-extrabold tracking-tight sm:text-3xl",
			children: title
		}),
		/* @__PURE__ */ jsx("p", {
			className: "mt-1 text-sm text-muted-foreground",
			children: sub
		}),
		/* @__PURE__ */ jsx("div", {
			className: "mt-6",
			children
		})
	] });
}
function SelectCard({ icon: Icon, title, desc, active, onClick }) {
	return /* @__PURE__ */ jsxs("button", {
		onClick,
		className: `group relative flex flex-col gap-2 overflow-hidden rounded-3xl border bg-card p-5 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-pop ${active ? "ring-2 ring-foreground" : ""}`,
		children: [
			active && /* @__PURE__ */ jsx("div", {
				className: "absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full ig-gradient text-white",
				children: /* @__PURE__ */ jsx(Check, { className: "h-3.5 w-3.5" })
			}),
			/* @__PURE__ */ jsx("div", {
				className: "grid h-10 w-10 place-items-center rounded-2xl ig-gradient-soft",
				children: /* @__PURE__ */ jsx(Icon, { className: "h-5 w-5" })
			}),
			/* @__PURE__ */ jsx("div", {
				className: "font-bold",
				children: title
			}),
			/* @__PURE__ */ jsx("div", {
				className: "text-xs text-muted-foreground",
				children: desc
			})
		]
	});
}
function MediaItem({ item, selected, onSelect }) {
	return /* @__PURE__ */ jsxs("button", {
		onClick: onSelect,
		className: `group relative aspect-[4/5] overflow-hidden rounded-2xl border bg-muted shadow-sm transition hover:shadow-md ${selected ? "ring-2 ring-foreground ring-offset-2" : ""}`,
		children: [
			item.thumbnail_url || item.media_url ? /* @__PURE__ */ jsx("img", {
				src: item.thumbnail_url || item.media_url,
				alt: "Media",
				className: "h-full w-full object-cover"
			}) : /* @__PURE__ */ jsx("div", {
				className: "grid h-full w-full place-items-center bg-card",
				children: /* @__PURE__ */ jsx(Image, { className: "h-8 w-8 text-muted-foreground/30" })
			}),
			/* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" }),
			selected && /* @__PURE__ */ jsx("div", {
				className: "absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full ig-gradient text-white shadow",
				children: /* @__PURE__ */ jsx(Check, { className: "h-3.5 w-3.5" })
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "absolute bottom-2 left-2 right-2 text-left",
				children: [/* @__PURE__ */ jsx("span", {
					className: "rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white backdrop-blur",
					children: item.media_type
				}), item.caption && /* @__PURE__ */ jsx("p", {
					className: "mt-1 line-clamp-2 text-[10px] leading-tight text-white/90",
					children: item.caption
				})]
			})
		]
	});
}
function MessageField({ label, value, onChange, disabled }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "rounded-3xl border bg-card p-5 shadow-card",
		children: [/* @__PURE__ */ jsx("label", {
			className: "text-xs font-bold uppercase tracking-wide text-muted-foreground",
			children: label
		}), /* @__PURE__ */ jsx("textarea", {
			value,
			onChange: (e) => onChange(e.target.value),
			disabled,
			rows: 3,
			className: "mt-2 w-full resize-none rounded-xl border bg-background px-3.5 py-3 text-sm outline-none focus:border-foreground disabled:opacity-60"
		})]
	});
}
function SummaryRow({ label, value }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "rounded-2xl border bg-card p-3.5 shadow-card",
		children: [/* @__PURE__ */ jsx("div", {
			className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground",
			children: label
		}), /* @__PURE__ */ jsx("div", {
			className: "mt-1 truncate text-sm font-semibold capitalize",
			children: value
		})]
	});
}
//#endregion
export { NewCampaign as component };
