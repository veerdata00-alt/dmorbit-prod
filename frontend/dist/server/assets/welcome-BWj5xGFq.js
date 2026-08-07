import { n as useStore } from "./store-DJ5BNnQm.js";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { Instagram, MessageCircle, Sparkles, TrendingUp, Zap } from "lucide-react";
//#region src/routes/welcome.tsx?tsr-split=component
function Welcome() {
	const navigate = useNavigate();
	const connected = useStore((s) => s.connected);
	const [loading, setLoading] = useState(false);
	const connect = () => {
		if (connected) {
			navigate({
				to: "/home",
				replace: true
			});
			return;
		}
		setLoading(true);
		const returnUrl = encodeURIComponent(window.location.origin + "/home");
		window.location.href = `http://localhost:3000/auth/instagram?returnTo=${returnUrl}`;
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "relative min-h-screen overflow-hidden",
		children: [
			/* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute inset-0 ig-gradient-soft" }),
			/* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute -top-32 right-[-10%] h-96 w-96 rounded-full ig-gradient opacity-30 blur-3xl" }),
			/* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute bottom-[-10%] left-[-10%] h-96 w-96 rounded-full ig-gradient opacity-20 blur-3xl" }),
			/* @__PURE__ */ jsxs("div", {
				className: "relative mx-auto flex min-h-screen max-w-md flex-col px-6 pb-10 pt-12 sm:max-w-lg",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ jsx("div", {
							className: "grid h-10 w-10 place-items-center rounded-2xl ig-gradient shadow-pop",
							children: /* @__PURE__ */ jsx(Sparkles, {
								className: "h-5 w-5 text-white",
								strokeWidth: 2.5
							})
						}), /* @__PURE__ */ jsx("span", {
							className: "text-lg font-extrabold tracking-tight",
							children: "DMOrbit"
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mt-12 sm:mt-16",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "inline-flex items-center gap-2 rounded-full border bg-card/80 px-3 py-1 text-xs font-semibold text-muted-foreground backdrop-blur",
								children: [/* @__PURE__ */ jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-green-500" }), " For creators, coaches & brands"]
							}),
							/* @__PURE__ */ jsxs("h1", {
								className: "mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl",
								children: [
									"Turn Instagram engagement into",
									" ",
									/* @__PURE__ */ jsx("span", {
										className: "ig-gradient-text",
										children: "conversations."
									})
								]
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-4 text-base text-muted-foreground",
								children: "Auto-reply to comments, send DMs, capture leads and deliver products — all from one beautiful place."
							})
						]
					}),
					/* @__PURE__ */ jsx("ul", {
						className: "mt-8 space-y-3",
						children: [
							{
								icon: MessageCircle,
								t: "Reply to every comment, automatically"
							},
							{
								icon: Zap,
								t: "Deliver PDFs, links & products in DMs"
							},
							{
								icon: TrendingUp,
								t: "Track leads & conversions in real-time"
							}
						].map((f, i) => /* @__PURE__ */ jsxs("li", {
							className: "flex items-center gap-3 rounded-2xl border bg-card/70 p-3.5 shadow-card backdrop-blur",
							children: [/* @__PURE__ */ jsx("div", {
								className: "grid h-9 w-9 shrink-0 place-items-center rounded-xl ig-gradient-soft",
								children: /* @__PURE__ */ jsx(f.icon, { className: "h-4.5 w-4.5" })
							}), /* @__PURE__ */ jsx("span", {
								className: "text-sm font-medium",
								children: f.t
							})]
						}, i))
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mt-auto pt-10",
						children: [/* @__PURE__ */ jsxs("button", {
							onClick: connect,
							disabled: loading,
							className: "group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl ig-gradient px-6 py-4 text-base font-semibold text-white shadow-pop transition active:scale-[0.98] disabled:opacity-80",
							children: [/* @__PURE__ */ jsx(Instagram, { className: "h-5 w-5" }), loading ? "Connecting…" : connected ? "Continue" : "Connect Instagram"]
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-3 text-center text-xs text-muted-foreground",
							children: "We never post without your permission. You can disconnect any time."
						})]
					})
				]
			})
		]
	});
}
//#endregion
export { Welcome as component };
