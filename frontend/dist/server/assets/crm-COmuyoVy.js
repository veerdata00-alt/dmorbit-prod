import { t as apiClient } from "./client-CDls2Pz7.js";
import { t as AppShell } from "./AppShell-Yy6EdzMu.js";
import { useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Mail, Search } from "lucide-react";
//#region src/routes/crm.tsx?tsr-split=component
function CRM() {
	const [q, setQ] = useState("");
	const [campaignId, setCampaignId] = useState("all");
	const { data: leads = [], isLoading: loadingLeads } = useQuery({
		queryKey: ["leads"],
		queryFn: async () => {
			const res = await apiClient.get("/api/crm/leads");
			return res.data.leads || res.data || [];
		}
	});
	const { data: campaigns = [] } = useQuery({
		queryKey: ["campaigns"],
		queryFn: async () => {
			const res = await apiClient.get("/api/v2/automations");
			return res.data.automations || res.data || [];
		}
	});
	const filtered = leads.filter((l) => {
		const match = (l.name || "").toLowerCase().includes(q.toLowerCase()) || (l.email || "").toLowerCase().includes(q.toLowerCase());
		const cMatch = campaignId === "all" || l.automationId === campaignId || l.campaignId === campaignId;
		return match && cMatch;
	});
	return /* @__PURE__ */ jsxs(AppShell, {
		title: "CRM",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "rounded-3xl border bg-card p-4 shadow-card",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-2 rounded-xl border bg-background px-3.5 py-2.5",
				children: [/* @__PURE__ */ jsx(Search, { className: "h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ jsx("input", {
					value: q,
					onChange: (e) => setQ(e.target.value),
					placeholder: "Search leads…",
					className: "flex-1 bg-transparent text-sm outline-none"
				})]
			}), /* @__PURE__ */ jsxs("div", {
				className: "mt-3 flex gap-2 overflow-x-auto",
				children: [/* @__PURE__ */ jsx(FilterChip, {
					active: campaignId === "all",
					onClick: () => setCampaignId("all"),
					children: "All campaigns"
				}), campaigns.map((c) => /* @__PURE__ */ jsx(FilterChip, {
					active: campaignId === (c._id || c.id),
					onClick: () => setCampaignId(c._id || c.id),
					children: c.name
				}, c._id || c.id))]
			})]
		}), filtered.length === 0 ? /* @__PURE__ */ jsxs("div", {
			className: "mt-6 rounded-3xl border border-dashed bg-card/50 p-10 text-center",
			children: [
				/* @__PURE__ */ jsx("div", {
					className: "mx-auto grid h-14 w-14 place-items-center rounded-2xl ig-gradient-soft",
					children: /* @__PURE__ */ jsx(Mail, { className: "h-6 w-6" })
				}),
				/* @__PURE__ */ jsx("h4", {
					className: "mt-3 text-lg font-bold",
					children: "No leads yet"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: "Leads will appear here as your campaigns run."
				})
			]
		}) : /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("ul", {
			className: "mt-4 space-y-3 sm:hidden",
			children: filtered.map((l) => /* @__PURE__ */ jsxs("li", {
				className: "rounded-2xl border bg-card p-4 shadow-card",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ jsx("div", {
						className: "grid h-10 w-10 shrink-0 place-items-center rounded-full ig-gradient text-sm font-bold text-white",
						children: (l.name || "User").split(" ").map((x) => x[0]).join("").slice(0, 2)
					}), /* @__PURE__ */ jsxs("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ jsx("div", {
							className: "truncate font-semibold",
							children: l.name || "Unknown"
						}), /* @__PURE__ */ jsx("div", {
							className: "truncate text-xs text-muted-foreground",
							children: l.email || "No email"
						})]
					})]
				}), /* @__PURE__ */ jsxs("div", {
					className: "mt-3 flex items-center justify-between text-[11px] text-muted-foreground",
					children: [/* @__PURE__ */ jsx("span", {
						className: "truncate",
						children: campaigns.find((c) => c._id === l.automationId || c.id === l.automationId || c.id === l.campaignId)?.name ?? "Campaign"
					}), /* @__PURE__ */ jsxs("span", {
						className: "flex items-center gap-1",
						children: [/* @__PURE__ */ jsx(Calendar, { className: "h-3 w-3" }), new Date(l.createdAt || l.capturedAt).toLocaleDateString()]
					})]
				})]
			}, l._id || l.id))
		}), /* @__PURE__ */ jsx("div", {
			className: "mt-4 hidden overflow-hidden rounded-3xl border bg-card shadow-card sm:block",
			children: /* @__PURE__ */ jsxs("table", {
				className: "w-full text-sm",
				children: [/* @__PURE__ */ jsx("thead", {
					className: "bg-muted/40 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground",
					children: /* @__PURE__ */ jsxs("tr", { children: [
						/* @__PURE__ */ jsx("th", {
							className: "px-5 py-3",
							children: "Lead"
						}),
						/* @__PURE__ */ jsx("th", {
							className: "px-5 py-3",
							children: "Email"
						}),
						/* @__PURE__ */ jsx("th", {
							className: "px-5 py-3",
							children: "Campaign"
						}),
						/* @__PURE__ */ jsx("th", {
							className: "px-5 py-3",
							children: "Date"
						})
					] })
				}), /* @__PURE__ */ jsx("tbody", {
					className: "divide-y",
					children: filtered.map((l) => /* @__PURE__ */ jsxs("tr", {
						className: "hover:bg-muted/30",
						children: [
							/* @__PURE__ */ jsx("td", {
								className: "px-5 py-3.5",
								children: /* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-2.5",
									children: [/* @__PURE__ */ jsx("div", {
										className: "grid h-8 w-8 place-items-center rounded-full ig-gradient text-xs font-bold text-white",
										children: (l.name || "User").split(" ").map((x) => x[0]).join("").slice(0, 2)
									}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
										className: "font-semibold",
										children: l.name || "Unknown"
									}), /* @__PURE__ */ jsx("div", {
										className: "text-xs text-muted-foreground",
										children: l.handle || l.instagramHandle || "—"
									})] })]
								})
							}),
							/* @__PURE__ */ jsx("td", {
								className: "px-5 py-3.5 text-muted-foreground",
								children: l.email || "—"
							}),
							/* @__PURE__ */ jsx("td", {
								className: "px-5 py-3.5",
								children: campaigns.find((c) => c._id === l.automationId || c.id === l.automationId || c.id === l.campaignId)?.name ?? "—"
							}),
							/* @__PURE__ */ jsx("td", {
								className: "px-5 py-3.5 text-muted-foreground",
								children: new Date(l.createdAt || l.capturedAt).toLocaleDateString()
							})
						]
					}, l._id || l.id))
				})]
			})
		})] })]
	});
}
function FilterChip({ active, onClick, children }) {
	return /* @__PURE__ */ jsx("button", {
		onClick,
		className: `shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold ${active ? "bg-foreground text-background" : "bg-background text-muted-foreground hover:text-foreground"}`,
		children
	});
}
//#endregion
export { CRM as component };
