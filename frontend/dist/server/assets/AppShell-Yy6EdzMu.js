import { n as useStore } from "./store-DJ5BNnQm.js";
import { useEffect } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { BarChart3, CreditCard, Home, Instagram, Lock, Megaphone, Settings, Sparkles, Users } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
//#region src/lib/utils.ts
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
//#endregion
//#region src/components/layout/AppShell.tsx
var nav = [
	{
		to: "/home",
		label: "Home",
		icon: Home,
		requiresConnect: false
	},
	{
		to: "/campaigns",
		label: "Campaigns",
		icon: Megaphone,
		requiresConnect: true
	},
	{
		to: "/crm",
		label: "CRM",
		icon: Users,
		requiresConnect: true
	},
	{
		to: "/analytics",
		label: "Analytics",
		icon: BarChart3,
		requiresConnect: true
	},
	{
		to: "/smart-bio",
		label: "Smart Bio",
		icon: Sparkles,
		requiresConnect: false,
		desktopOnly: true
	},
	{
		to: "/billing",
		label: "Billing",
		icon: CreditCard,
		requiresConnect: false,
		desktopOnly: true
	},
	{
		to: "/settings",
		label: "Settings",
		icon: Settings,
		requiresConnect: false
	}
];
var mobileNav = nav.filter((n) => !("desktopOnly" in n && n.desktopOnly));
function AppShell({ children, title, action }) {
	const connected = useStore((s) => s.connected);
	const handle = useStore((s) => s.igHandle);
	const user = useStore((s) => s.user);
	const isAuthLoaded = useStore((s) => s.isAuthLoaded);
	const pathname = useRouterState({ select: (r) => r.location.pathname });
	const navigate = useNavigate();
	useEffect(() => {
		if (isAuthLoaded && !user) navigate({
			to: "/login",
			replace: true
		});
	}, [
		isAuthLoaded,
		user,
		navigate
	]);
	if (!isAuthLoaded || !user) return /* @__PURE__ */ jsx("div", {
		className: "grid min-h-screen place-items-center bg-background",
		children: /* @__PURE__ */ jsx("div", { className: "h-8 w-8 animate-spin rounded-full border-4 border-foreground border-t-transparent" })
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "min-h-screen bg-background",
		children: [
			/* @__PURE__ */ jsxs("aside", {
				className: "fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-card lg:flex lg:flex-col",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2 px-6 py-6",
						children: [/* @__PURE__ */ jsx("div", {
							className: "grid h-9 w-9 place-items-center rounded-2xl ig-gradient shadow-pop",
							children: /* @__PURE__ */ jsx(Sparkles, {
								className: "h-4.5 w-4.5 text-white",
								strokeWidth: 2.5
							})
						}), /* @__PURE__ */ jsx("div", {
							className: "text-lg font-extrabold tracking-tight",
							children: "DMOrbit"
						})]
					}),
					/* @__PURE__ */ jsx("nav", {
						className: "flex-1 space-y-1 px-3",
						children: nav.map((item) => {
							const active = pathname === item.to || item.to !== "/home" && pathname.startsWith(item.to);
							const locked = item.requiresConnect && !connected;
							return /* @__PURE__ */ jsxs(locked ? "button" : Link, {
								...locked ? {
									type: "button",
									onClick: () => {}
								} : { to: item.to },
								disabled: locked || void 0,
								className: cn("group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition", active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground", locked && "cursor-not-allowed opacity-50"),
								children: [
									/* @__PURE__ */ jsx(item.icon, { className: "h-4.5 w-4.5" }),
									/* @__PURE__ */ jsx("span", {
										className: "flex-1 text-left",
										children: item.label
									}),
									locked && /* @__PURE__ */ jsx(Lock, { className: "h-3.5 w-3.5" })
								]
							}, item.to);
						})
					}),
					/* @__PURE__ */ jsx("div", {
						className: "m-3 rounded-2xl border bg-muted/40 p-3 text-xs",
						children: connected ? /* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ jsx("div", {
								className: "grid h-8 w-8 place-items-center rounded-full ig-gradient text-white",
								children: /* @__PURE__ */ jsx(Instagram, { className: "h-4 w-4" })
							}), /* @__PURE__ */ jsxs("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ jsxs("div", {
									className: "truncate font-semibold text-foreground",
									children: ["@", handle]
								}), /* @__PURE__ */ jsx("div", {
									className: "text-[11px] text-muted-foreground",
									children: "Connected"
								})]
							})]
						}) : /* @__PURE__ */ jsxs("button", {
							onClick: () => {
								const returnUrl = encodeURIComponent(window.location.origin + "/home");
								window.location.href = `http://localhost:3000/auth/instagram?returnTo=${returnUrl}`;
							},
							className: "flex w-full items-center gap-2 font-semibold hover:opacity-80 transition",
							children: [/* @__PURE__ */ jsx(Instagram, { className: "h-4 w-4" }), " Connect Instagram"]
						})
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "lg:pl-64",
				children: [/* @__PURE__ */ jsx("header", {
					className: "sticky top-0 z-20 border-b bg-background/80 backdrop-blur",
					children: /* @__PURE__ */ jsxs("div", {
						className: "mx-auto flex max-w-5xl items-center gap-3 px-4 py-3.5 sm:px-6",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "lg:hidden",
								children: /* @__PURE__ */ jsx("div", {
									className: "flex items-center gap-2",
									children: /* @__PURE__ */ jsx("div", {
										className: "grid h-8 w-8 place-items-center rounded-xl ig-gradient",
										children: /* @__PURE__ */ jsx(Sparkles, {
											className: "h-4 w-4 text-white",
											strokeWidth: 2.5
										})
									})
								})
							}),
							/* @__PURE__ */ jsx("h1", {
								className: "min-w-0 flex-1 truncate text-base font-bold tracking-tight sm:text-lg",
								children: title
							}),
							action
						]
					})
				}), /* @__PURE__ */ jsx("main", {
					className: "mx-auto max-w-5xl px-4 pb-28 pt-4 sm:px-6 sm:pt-6 lg:pb-12",
					children
				})]
			}),
			/* @__PURE__ */ jsx("nav", {
				className: "fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur safe-pb lg:hidden",
				children: /* @__PURE__ */ jsx("div", {
					className: "mx-auto grid max-w-md grid-cols-5",
					children: mobileNav.map((item) => {
						const active = pathname === item.to || item.to !== "/home" && pathname.startsWith(item.to);
						const locked = item.requiresConnect && !connected;
						return /* @__PURE__ */ jsxs(locked ? "button" : Link, {
							...locked ? { type: "button" } : { to: item.to },
							disabled: locked || void 0,
							className: cn("relative flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium", active ? "text-foreground" : "text-muted-foreground", locked && "opacity-40"),
							children: [
								/* @__PURE__ */ jsx(item.icon, { className: cn("h-5 w-5", active && "text-foreground") }),
								/* @__PURE__ */ jsx("span", { children: item.label }),
								active && /* @__PURE__ */ jsx("span", { className: "absolute -top-px h-0.5 w-8 rounded-full ig-gradient" })
							]
						}, item.to);
					})
				})
			})
		]
	});
}
//#endregion
export { cn as n, AppShell as t };
