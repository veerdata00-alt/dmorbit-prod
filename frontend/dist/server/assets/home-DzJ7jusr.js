import { n as useStore } from "./store-DJ5BNnQm.js";
import { t as apiClient } from "./client-CDls2Pz7.js";
import { t as AppShell } from "./AppShell-Yy6EdzMu.js";
import { Link } from "@tanstack/react-router";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BarChart3, Instagram, Lock, Megaphone, MessageCircle, Plus, Sparkles, TrendingUp, Users } from "lucide-react";
//#region src/routes/home.tsx?tsr-split=component
function connectInstagram() {
	const returnUrl = encodeURIComponent(window.location.origin + "/home");
	window.location.href = `http://localhost:3000/auth/instagram?returnTo=${returnUrl}`;
}
function LockedDashboard({ user }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ jsxs("section", {
				className: "relative overflow-hidden rounded-3xl border bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-400/10 p-6 shadow-card sm:p-8",
				children: [
					/* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full ig-gradient opacity-20 blur-3xl" }),
					/* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute bottom-0 left-0 h-32 w-32 rounded-full ig-gradient opacity-10 blur-2xl" }),
					/* @__PURE__ */ jsxs("div", {
						className: "relative flex items-center gap-2 text-xs font-semibold text-muted-foreground",
						children: [
							/* @__PURE__ */ jsx("span", {
								className: "grid h-6 w-6 place-items-center rounded-full ig-gradient text-white",
								children: /* @__PURE__ */ jsx(Sparkles, { className: "h-3 w-3" })
							}),
							"Welcome",
							user?.name ? `, ${user.name}` : ""
						]
					}),
					/* @__PURE__ */ jsxs("h2", {
						className: "relative mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl",
						children: [
							"Connect Instagram to unlock",
							" ",
							/* @__PURE__ */ jsx("span", {
								className: "ig-gradient-text",
								children: "DMOrbit."
							})
						]
					}),
					/* @__PURE__ */ jsx("p", {
						className: "relative mt-2 text-sm text-muted-foreground max-w-md",
						children: "Auto-reply to comments, send DMs, capture leads and track conversions — all in one place."
					}),
					/* @__PURE__ */ jsxs("button", {
						onClick: connectInstagram,
						className: "relative mt-5 inline-flex items-center gap-2 rounded-2xl ig-gradient px-6 py-3 text-sm font-bold text-white shadow-pop transition active:scale-[0.98]",
						children: [/* @__PURE__ */ jsx(Instagram, { className: "h-4 w-4" }), " Connect Instagram"]
					}),
					/* @__PURE__ */ jsx("p", {
						className: "relative mt-2 text-[11px] text-muted-foreground",
						children: "We never post without permission. Disconnect any time."
					})
				]
			}),
			/* @__PURE__ */ jsx("section", {
				className: "grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3",
				children: [
					{
						label: "Active Campaigns",
						icon: Megaphone,
						tint: "from-fuchsia-500/15 to-pink-500/15"
					},
					{
						label: "DMs This Month",
						icon: MessageCircle,
						tint: "from-blue-500/15 to-cyan-500/15"
					},
					{
						label: "Total Leads",
						icon: TrendingUp,
						tint: "from-green-500/15 to-emerald-500/15"
					}
				].map((s) => /* @__PURE__ */ jsxs("div", {
					className: `relative overflow-hidden rounded-2xl border bg-gradient-to-br ${s.tint} p-4 shadow-card`,
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ jsx(s.icon, { className: "h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ jsx(Lock, { className: "h-3.5 w-3.5 text-muted-foreground/60" })]
						}),
						/* @__PURE__ */ jsx("div", {
							className: "mt-3 text-2xl font-extrabold tracking-tight text-muted-foreground/40 blur-sm select-none",
							children: "—"
						}),
						/* @__PURE__ */ jsx("div", {
							className: "mt-0.5 text-xs font-medium text-muted-foreground",
							children: s.label
						})
					]
				}, s.label))
			}),
			/* @__PURE__ */ jsxs("section", { children: [/* @__PURE__ */ jsx("h3", {
				className: "mb-3 text-sm font-bold text-muted-foreground uppercase tracking-wider",
				children: "What you'll unlock"
			}), /* @__PURE__ */ jsx("div", {
				className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
				children: [
					{
						icon: Megaphone,
						title: "Campaigns",
						desc: "Auto-reply to comments and trigger DM flows."
					},
					{
						icon: MessageCircle,
						title: "Inbox & DMs",
						desc: "Manage all conversations in one place."
					},
					{
						icon: TrendingUp,
						title: "Analytics",
						desc: "Track conversions, leads, and campaign ROI."
					},
					{
						icon: Users,
						title: "CRM",
						desc: "Build a lead list from every interaction."
					},
					{
						icon: BarChart3,
						title: "Automations",
						desc: "Rule-based flows for your whole funnel."
					},
					{
						icon: Sparkles,
						title: "Smart Bio",
						desc: "A link-in-bio that converts followers."
					}
				].map((f) => /* @__PURE__ */ jsxs("div", {
					className: "relative overflow-hidden rounded-2xl border bg-card p-4 shadow-card opacity-60",
					children: [/* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-background/40 backdrop-blur-[1px]" }), /* @__PURE__ */ jsxs("div", {
						className: "relative flex items-start gap-3",
						children: [/* @__PURE__ */ jsx("div", {
							className: "grid h-9 w-9 shrink-0 place-items-center rounded-xl ig-gradient-soft",
							children: /* @__PURE__ */ jsx(f.icon, { className: "h-4 w-4" })
						}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("div", {
							className: "text-sm font-semibold flex items-center gap-1.5",
							children: [
								f.title,
								" ",
								/* @__PURE__ */ jsx(Lock, { className: "h-3 w-3 text-muted-foreground" })
							]
						}), /* @__PURE__ */ jsx("div", {
							className: "text-xs text-muted-foreground mt-0.5",
							children: f.desc
						})] })]
					})]
				}, f.title))
			})] }),
			/* @__PURE__ */ jsx("div", {
				className: "flex justify-center pb-4",
				children: /* @__PURE__ */ jsxs("button", {
					onClick: connectInstagram,
					className: "inline-flex items-center gap-2 rounded-2xl ig-gradient px-8 py-3.5 text-sm font-bold text-white shadow-pop transition active:scale-[0.98]",
					children: [/* @__PURE__ */ jsx(Instagram, { className: "h-4 w-4" }), " Connect Instagram to Get Started"]
				})
			})
		]
	});
}
function ConnectedDashboard({ user, statsData, isLoading }) {
	const activeCampaigns = statsData?.automations?.active ?? null;
	const totalDmsSent = statsData?.totalDmsSent ?? null;
	const totalLeads = statsData?.totalLeads ?? null;
	const stats = [
		{
			label: "Active Campaigns",
			value: activeCampaigns !== null ? activeCampaigns : "-",
			icon: Megaphone,
			tint: "from-fuchsia-500/15 to-pink-500/15"
		},
		{
			label: "DMs This Month",
			value: totalDmsSent !== null ? totalDmsSent : "-",
			icon: MessageCircle,
			tint: "from-blue-500/15 to-cyan-500/15"
		},
		{
			label: "Total Leads",
			value: totalLeads !== null ? totalLeads : "-",
			icon: TrendingUp,
			tint: "from-green-500/15 to-emerald-500/15"
		}
	];
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsxs("section", {
			className: "relative overflow-hidden rounded-3xl border bg-card p-5 shadow-card sm:p-7",
			children: [
				/* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full ig-gradient opacity-20 blur-3xl" }),
				/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2 text-xs font-semibold text-muted-foreground",
					children: [
						/* @__PURE__ */ jsx("span", {
							className: "grid h-6 w-6 place-items-center rounded-full ig-gradient text-white",
							children: /* @__PURE__ */ jsx(Sparkles, { className: "h-3 w-3" })
						}),
						"Welcome back",
						user?.name ? `, ${user.name}` : ""
					]
				}),
				/* @__PURE__ */ jsxs("h2", {
					className: "mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl",
					children: ["Let's turn comments into ", /* @__PURE__ */ jsx("span", {
						className: "ig-gradient-text",
						children: "customers."
					})]
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-1.5 text-sm text-muted-foreground",
					children: "Launch a new campaign in under 2 minutes."
				}),
				/* @__PURE__ */ jsxs(Link, {
					to: "/campaigns/new",
					className: "mt-5 inline-flex items-center gap-1.5 rounded-full ig-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-pop",
					children: ["Create Campaign ", /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })]
				})
			]
		}),
		/* @__PURE__ */ jsx("section", {
			className: "mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3",
			children: stats.map((s) => /* @__PURE__ */ jsxs("div", {
				className: `rounded-2xl border bg-gradient-to-br ${s.tint} p-4 shadow-card`,
				children: [
					/* @__PURE__ */ jsx("div", {
						className: "flex items-center justify-between",
						children: /* @__PURE__ */ jsx(s.icon, { className: "h-4 w-4 text-muted-foreground" })
					}),
					/* @__PURE__ */ jsx("div", {
						className: "mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl",
						children: isLoading ? /* @__PURE__ */ jsx("span", {
							className: "animate-pulse text-muted-foreground text-lg",
							children: "…"
						}) : s.value
					}),
					/* @__PURE__ */ jsx("div", {
						className: "mt-0.5 text-xs font-medium text-muted-foreground",
						children: s.label
					})
				]
			}, s.label))
		}),
		/* @__PURE__ */ jsxs("section", {
			className: "mt-6",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex items-end justify-between",
				children: [/* @__PURE__ */ jsx("h3", {
					className: "text-base font-bold",
					children: "Your campaigns"
				}), /* @__PURE__ */ jsx(Link, {
					to: "/campaigns",
					className: "text-xs font-semibold text-muted-foreground",
					children: "View all →"
				})]
			}), /* @__PURE__ */ jsxs("div", {
				className: "mt-3 rounded-3xl border border-dashed bg-card/50 p-8 text-center",
				children: [/* @__PURE__ */ jsx("div", {
					className: "mx-auto grid h-14 w-14 place-items-center rounded-2xl ig-gradient-soft",
					children: /* @__PURE__ */ jsx(Megaphone, { className: "h-6 w-6" })
				}), activeCampaigns !== null && activeCampaigns > 0 ? /* @__PURE__ */ jsxs(Fragment, { children: [
					/* @__PURE__ */ jsxs("h4", {
						className: "mt-3 text-lg font-bold",
						children: [
							"You have ",
							activeCampaigns,
							" active campaign",
							activeCampaigns !== 1 ? "s" : ""
						]
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: "Go to Campaigns to manage them."
					}),
					/* @__PURE__ */ jsxs(Link, {
						to: "/campaigns",
						className: "mt-4 inline-flex items-center gap-1.5 rounded-full ig-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-pop",
						children: [/* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }), " View Campaigns"]
					})
				] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
					/* @__PURE__ */ jsx("h4", {
						className: "mt-3 text-lg font-bold",
						children: "Create Your First Campaign"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: "Start auto-replying to comments and DMs."
					}),
					/* @__PURE__ */ jsxs(Link, {
						to: "/campaigns/new",
						className: "mt-4 inline-flex items-center gap-1.5 rounded-full ig-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-pop",
						children: [/* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }), " Create Campaign"]
					})
				] })]
			})]
		})
	] });
}
function HomePage() {
	const { connected, user } = useStore((s) => ({
		connected: s.connected,
		user: s.user
	}));
	const { data: statsData, isLoading } = useQuery({
		queryKey: ["dashboardStats"],
		queryFn: async () => {
			return (await apiClient.get("/api/dashboard/stats")).data;
		},
		enabled: !!user && !!connected
	});
	return /* @__PURE__ */ jsx(AppShell, {
		title: "Home",
		action: connected ? /* @__PURE__ */ jsxs(Link, {
			to: "/campaigns/new",
			className: "hidden items-center gap-1.5 rounded-full ig-gradient px-4 py-2 text-sm font-semibold text-white shadow-pop sm:inline-flex",
			children: [/* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }), " Create Campaign"]
		}) : void 0,
		children: connected ? /* @__PURE__ */ jsx(ConnectedDashboard, {
			user,
			statsData,
			isLoading
		}) : /* @__PURE__ */ jsx(LockedDashboard, { user })
	});
}
//#endregion
export { HomePage as component };
