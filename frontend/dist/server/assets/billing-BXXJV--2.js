import { t as AppShell } from "./AppShell-Yy6EdzMu.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { Check, Download, Sparkles } from "lucide-react";
//#region src/routes/billing.tsx?tsr-split=component
var invoices = [
	{
		id: "INV-2041",
		date: "Jun 1, 2026",
		amount: "$29.00",
		status: "Paid"
	},
	{
		id: "INV-2018",
		date: "May 1, 2026",
		amount: "$29.00",
		status: "Paid"
	},
	{
		id: "INV-1994",
		date: "Apr 1, 2026",
		amount: "$29.00",
		status: "Paid"
	}
];
function Billing() {
	const used = 4280;
	const total = 1e4;
	const pct = used / total * 100;
	return /* @__PURE__ */ jsxs(AppShell, {
		title: "Billing",
		children: [
			/* @__PURE__ */ jsxs("section", {
				className: "relative overflow-hidden rounded-3xl border bg-card p-6 shadow-card",
				children: [
					/* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full ig-gradient opacity-20 blur-3xl" }),
					/* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap items-start justify-between gap-4",
						children: [/* @__PURE__ */ jsxs("div", { children: [
							/* @__PURE__ */ jsx("div", {
								className: "text-xs font-bold uppercase tracking-wider text-muted-foreground",
								children: "Current plan"
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "mt-1 flex items-center gap-2 text-2xl font-extrabold",
								children: ["Creator ", /* @__PURE__ */ jsx("span", {
									className: "rounded-full ig-gradient px-2.5 py-0.5 text-[10px] font-bold uppercase text-white",
									children: "Pro"
								})]
							}),
							/* @__PURE__ */ jsx("div", {
								className: "mt-1 text-sm text-muted-foreground",
								children: "$29/month · billed monthly"
							})
						] }), /* @__PURE__ */ jsxs("button", {
							className: "inline-flex items-center gap-1.5 rounded-full ig-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-pop",
							children: [/* @__PURE__ */ jsx(Sparkles, { className: "h-4 w-4" }), " Upgrade plan"]
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mt-6",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center justify-between text-xs font-semibold",
							children: [/* @__PURE__ */ jsx("span", { children: "DM credits used" }), /* @__PURE__ */ jsxs("span", {
								className: "text-muted-foreground",
								children: [
									used.toLocaleString(),
									" / ",
									total.toLocaleString()
								]
							})]
						}), /* @__PURE__ */ jsx("div", {
							className: "mt-2 h-2.5 overflow-hidden rounded-full bg-muted",
							children: /* @__PURE__ */ jsx("div", {
								className: "h-full ig-gradient",
								style: { width: `${pct}%` }
							})
						})]
					})
				]
			}),
			/* @__PURE__ */ jsx("section", {
				className: "mt-5 grid gap-3 sm:grid-cols-3",
				children: [
					{
						name: "Starter",
						price: "$0",
						desc: "1,000 DMs/mo",
						cta: "Downgrade"
					},
					{
						name: "Creator",
						price: "$29",
						desc: "10,000 DMs/mo",
						cta: "Current",
						featured: true
					},
					{
						name: "Business",
						price: "$79",
						desc: "Unlimited DMs",
						cta: "Upgrade"
					}
				].map((p) => /* @__PURE__ */ jsxs("div", {
					className: `rounded-3xl border p-5 shadow-card ${p.featured ? "bg-card ring-2 ring-foreground" : "bg-card"}`,
					children: [
						/* @__PURE__ */ jsx("div", {
							className: "text-xs font-bold uppercase tracking-wider text-muted-foreground",
							children: p.name
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-1 text-2xl font-extrabold",
							children: [p.price, /* @__PURE__ */ jsx("span", {
								className: "text-sm font-medium text-muted-foreground",
								children: "/mo"
							})]
						}),
						/* @__PURE__ */ jsx("div", {
							className: "mt-1 text-sm text-muted-foreground",
							children: p.desc
						}),
						/* @__PURE__ */ jsx("ul", {
							className: "mt-4 space-y-1.5 text-sm",
							children: [
								"Unlimited campaigns",
								"Smart Bio",
								"Lead CRM"
							].map((f) => /* @__PURE__ */ jsxs("li", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ jsx(Check, { className: "h-3.5 w-3.5 text-emerald-600" }), f]
							}, f))
						}),
						/* @__PURE__ */ jsx("button", {
							disabled: p.featured,
							className: `mt-4 w-full rounded-full px-4 py-2.5 text-sm font-semibold ${p.featured ? "border bg-muted text-muted-foreground" : "ig-gradient text-white shadow-pop"}`,
							children: p.cta
						})
					]
				}, p.name))
			}),
			/* @__PURE__ */ jsxs("section", {
				className: "mt-5 rounded-3xl border bg-card shadow-card",
				children: [/* @__PURE__ */ jsx("div", {
					className: "border-b px-5 py-4",
					children: /* @__PURE__ */ jsx("h3", {
						className: "text-base font-bold",
						children: "Invoices"
					})
				}), /* @__PURE__ */ jsx("ul", {
					className: "divide-y",
					children: invoices.map((i) => /* @__PURE__ */ jsxs("li", {
						className: "flex items-center gap-3 px-5 py-3.5 text-sm",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "flex-1",
								children: [/* @__PURE__ */ jsx("div", {
									className: "font-semibold",
									children: i.id
								}), /* @__PURE__ */ jsx("div", {
									className: "text-xs text-muted-foreground",
									children: i.date
								})]
							}),
							/* @__PURE__ */ jsx("span", {
								className: "rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-600",
								children: i.status
							}),
							/* @__PURE__ */ jsx("div", {
								className: "w-20 text-right font-semibold",
								children: i.amount
							}),
							/* @__PURE__ */ jsx("button", {
								className: "rounded-full border p-2 hover:bg-muted",
								children: /* @__PURE__ */ jsx(Download, { className: "h-3.5 w-3.5" })
							})
						]
					}, i.id))
				})]
			})
		]
	});
}
//#endregion
export { Billing as component };
