import { t as apiClient } from "./client-CDls2Pz7.js";
import { t as AppShell } from "./AppShell-Yy6EdzMu.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, MessageCircle, Send, Users } from "lucide-react";
//#region src/routes/analytics.tsx?tsr-split=component
function Analytics() {
	const { data: analytics, isLoading } = useQuery({
		queryKey: ["analyticsDashboard"],
		queryFn: async () => {
			return (await apiClient.get("/api/analytics/dashboard")).data;
		}
	});
	const dms = analytics?.totalDMs ?? 0;
	const totalLeads = analytics?.leadsGenerated ?? 0;
	const comments = analytics?.totalComments ?? 0;
	const conv = analytics?.conversionRate ?? 0;
	const topCampaignName = analytics?.topCampaign ?? null;
	const topKeyword = analytics?.topKeyword ?? null;
	const funnel = [
		{
			label: "Comments",
			value: comments,
			color: "from-indigo-500 to-purple-500"
		},
		{
			label: "DMs Logged",
			value: dms,
			color: "from-purple-500 to-fuchsia-500"
		},
		{
			label: "Leads",
			value: totalLeads,
			color: "from-fuchsia-500 to-pink-500"
		}
	];
	const max = Math.max(...funnel.map((f) => f.value), 1);
	return /* @__PURE__ */ jsxs(AppShell, {
		title: "Analytics",
		children: [
			/* @__PURE__ */ jsx("section", {
				className: "grid grid-cols-2 gap-3 lg:grid-cols-4",
				children: [
					{
						label: "Leads",
						value: totalLeads,
						icon: Users
					},
					{
						label: "DMs Logged",
						value: dms,
						icon: Send
					},
					{
						label: "Conversion",
						value: `${conv}%`,
						icon: MessageCircle
					},
					{
						label: "Comments",
						value: comments,
						icon: BarChart3
					}
				].map((s) => /* @__PURE__ */ jsxs("div", {
					className: "rounded-2xl border bg-card p-4 shadow-card",
					children: [
						/* @__PURE__ */ jsx(s.icon, { className: "h-4 w-4 text-muted-foreground" }),
						/* @__PURE__ */ jsx("div", {
							className: "mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl",
							children: isLoading ? /* @__PURE__ */ jsx("span", {
								className: "animate-pulse text-muted-foreground text-lg",
								children: "…"
							}) : s.value
						}),
						/* @__PURE__ */ jsx("div", {
							className: "text-xs text-muted-foreground",
							children: s.label
						})
					]
				}, s.label))
			}),
			/* @__PURE__ */ jsxs("section", {
				className: "mt-5 rounded-3xl border bg-card p-5 shadow-card sm:p-6",
				children: [
					/* @__PURE__ */ jsx("h3", {
						className: "text-base font-bold",
						children: "Conversion funnel"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-xs text-muted-foreground",
						children: "From comment to customer."
					}),
					/* @__PURE__ */ jsx("div", {
						className: "mt-5 space-y-3",
						children: funnel.map((f) => {
							const w = f.value / max * 100;
							return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("div", {
								className: "flex items-center justify-between text-xs font-semibold",
								children: [/* @__PURE__ */ jsx("span", { children: f.label }), /* @__PURE__ */ jsx("span", {
									className: "text-muted-foreground",
									children: f.value.toLocaleString()
								})]
							}), /* @__PURE__ */ jsx("div", {
								className: "mt-1.5 h-3 overflow-hidden rounded-full bg-muted",
								children: /* @__PURE__ */ jsx("div", {
									className: `h-full rounded-full bg-gradient-to-r ${f.color}`,
									style: { width: `${w}%` }
								})
							})] }, f.label);
						})
					})
				]
			}),
			/* @__PURE__ */ jsxs("section", {
				className: "mt-5 rounded-3xl border bg-card p-5 shadow-card sm:p-6",
				children: [/* @__PURE__ */ jsx("h3", {
					className: "text-base font-bold",
					children: "Top campaign"
				}), topCampaignName && topCampaignName !== "None" ? /* @__PURE__ */ jsxs("div", {
					className: "mt-4 flex items-center gap-3 rounded-2xl border bg-background p-3.5",
					children: [/* @__PURE__ */ jsx("div", {
						className: "grid h-9 w-9 shrink-0 place-items-center rounded-xl ig-gradient text-sm font-extrabold text-white",
						children: "1"
					}), /* @__PURE__ */ jsxs("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ jsx("div", {
							className: "truncate text-sm font-semibold",
							children: topCampaignName
						}), topKeyword && topKeyword !== "None" && /* @__PURE__ */ jsxs("div", {
							className: "text-[11px] text-muted-foreground",
							children: ["Top keyword: ", topKeyword]
						})]
					})]
				}) : /* @__PURE__ */ jsx("p", {
					className: "mt-3 text-sm text-muted-foreground",
					children: "Create a campaign to see analytics."
				})]
			})
		]
	});
}
//#endregion
export { Analytics as component };
