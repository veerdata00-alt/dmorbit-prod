import { n as useStore } from "./store-DJ5BNnQm.js";
import { t as AppShell } from "./AppShell-Yy6EdzMu.js";
import { useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { BarChart3, ExternalLink, Plus, Sparkles, Trash2 } from "lucide-react";
//#region src/routes/smart-bio.tsx?tsr-split=component
function SmartBio() {
	const handle = useStore((s) => s.igHandle) ?? "yourbrand";
	const [links, setLinks] = useState([
		{
			id: "1",
			title: "Free Instagram Growth PDF",
			url: "https://dmorbit.app/pdf",
			clicks: 412
		},
		{
			id: "2",
			title: "Book a 1:1 call",
			url: "https://cal.com/you",
			clicks: 88
		},
		{
			id: "3",
			title: "My YouTube channel",
			url: "https://youtube.com",
			clicks: 244
		}
	]);
	const [title, setTitle] = useState("");
	const [url, setUrl] = useState("");
	const add = () => {
		if (!title || !url) return;
		setLinks([{
			id: Math.random().toString(36).slice(2),
			title,
			url,
			clicks: 0
		}, ...links]);
		setTitle("");
		setUrl("");
	};
	const totalClicks = links.reduce((a, l) => a + l.clicks, 0);
	return /* @__PURE__ */ jsx(AppShell, {
		title: "Smart Bio",
		children: /* @__PURE__ */ jsxs("div", {
			className: "grid gap-5 lg:grid-cols-[1fr_360px]",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "space-y-5",
				children: [/* @__PURE__ */ jsxs("section", {
					className: "rounded-3xl border bg-card p-5 shadow-card",
					children: [
						/* @__PURE__ */ jsx("h3", {
							className: "text-base font-bold",
							children: "Add a link"
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-3 grid gap-2 sm:grid-cols-2",
							children: [/* @__PURE__ */ jsx("input", {
								value: title,
								onChange: (e) => setTitle(e.target.value),
								placeholder: "Title",
								className: "rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-foreground"
							}), /* @__PURE__ */ jsx("input", {
								value: url,
								onChange: (e) => setUrl(e.target.value),
								placeholder: "https://",
								className: "rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-foreground"
							})]
						}),
						/* @__PURE__ */ jsxs("button", {
							onClick: add,
							className: "mt-3 inline-flex items-center gap-1.5 rounded-full ig-gradient px-4 py-2 text-sm font-semibold text-white shadow-pop",
							children: [/* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }), " Add link"]
						})
					]
				}), /* @__PURE__ */ jsxs("section", {
					className: "rounded-3xl border bg-card p-5 shadow-card",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ jsx("h3", {
							className: "text-base font-bold",
							children: "Links"
						}), /* @__PURE__ */ jsxs("div", {
							className: "text-xs text-muted-foreground",
							children: [
								/* @__PURE__ */ jsx(BarChart3, { className: "mr-1 inline h-3 w-3" }),
								totalClicks,
								" clicks"
							]
						})]
					}), /* @__PURE__ */ jsx("ul", {
						className: "mt-4 space-y-2.5",
						children: links.map((l) => /* @__PURE__ */ jsxs("li", {
							className: "flex items-center gap-3 rounded-2xl border bg-background p-3.5",
							children: [
								/* @__PURE__ */ jsx("div", {
									className: "grid h-9 w-9 shrink-0 place-items-center rounded-xl ig-gradient-soft",
									children: /* @__PURE__ */ jsx(ExternalLink, { className: "h-4 w-4" })
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "min-w-0 flex-1",
									children: [/* @__PURE__ */ jsx("div", {
										className: "truncate text-sm font-semibold",
										children: l.title
									}), /* @__PURE__ */ jsx("div", {
										className: "truncate text-xs text-muted-foreground",
										children: l.url
									})]
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "text-right text-xs",
									children: [/* @__PURE__ */ jsx("div", {
										className: "font-bold",
										children: l.clicks
									}), /* @__PURE__ */ jsx("div", {
										className: "text-muted-foreground",
										children: "clicks"
									})]
								}),
								/* @__PURE__ */ jsx("button", {
									onClick: () => setLinks(links.filter((x) => x.id !== l.id)),
									className: "rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-destructive",
									children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" })
								})
							]
						}, l.id))
					})]
				})]
			}), /* @__PURE__ */ jsx("aside", {
				className: "lg:sticky lg:top-24 lg:self-start",
				children: /* @__PURE__ */ jsx("div", {
					className: "mx-auto w-full max-w-[300px] rounded-[2.5rem] border bg-card p-3 shadow-pop",
					children: /* @__PURE__ */ jsxs("div", {
						className: "overflow-hidden rounded-[2rem] ig-gradient-soft p-5 text-center",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "mx-auto grid h-16 w-16 place-items-center rounded-full ig-gradient text-white",
								children: /* @__PURE__ */ jsx(Sparkles, { className: "h-7 w-7" })
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "mt-3 font-extrabold",
								children: ["@", handle]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "text-xs text-muted-foreground",
								children: ["Smart Bio · dmorbit.app/", handle]
							}),
							/* @__PURE__ */ jsx("div", {
								className: "mt-4 space-y-2",
								children: links.map((l) => /* @__PURE__ */ jsx("div", {
									className: "truncate rounded-2xl bg-white px-4 py-3 text-sm font-semibold shadow-card",
									children: l.title
								}, l.id))
							})
						]
					})
				})
			})]
		})
	});
}
//#endregion
export { SmartBio as component };
