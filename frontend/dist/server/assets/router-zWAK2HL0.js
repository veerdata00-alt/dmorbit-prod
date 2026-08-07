import { n as useStore, t as store } from "./store-DJ5BNnQm.js";
import { t as apiClient } from "./client-CDls2Pz7.js";
import { t as initFirebase } from "./firebase-yVBTGaC_.js";
import { a as Route$12 } from "./login-BzE9G1qU.js";
import { t as Route$13 } from "./campaigns_.new-CVL8x2A-.js";
import { t as Route$14 } from "./campaigns_._id-B8sRamD5.js";
import { useEffect } from "react";
import { HeadContent, Link, Outlet, Scripts, createFileRoute, createRootRouteWithContext, createRouter, lazyRouteComponent, useRouter } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { Toaster } from "sonner";
//#region src/styles.css?url
var styles_default = "/assets/styles-B6vnVd64.css";
//#endregion
//#region src/lib/lovable-error-reporting.ts
function reportLovableError(error, context) {
	console.error("Lovable error reported:", error, context);
}
//#endregion
//#region src/components/ui/sonner.tsx
var Toaster$1 = ({ ...props }) => {
	const { theme = "system" } = useTheme();
	return /* @__PURE__ */ jsx(Toaster, {
		theme,
		className: "toaster group",
		toastOptions: { classNames: {
			toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
			description: "group-[.toast]:text-muted-foreground",
			actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
			cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
		} },
		...props
	});
};
//#endregion
//#region src/routes/__root.tsx
function NotFoundComponent() {
	return /* @__PURE__ */ jsx("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ jsxs("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ jsx("h1", {
					className: "text-7xl font-bold ig-gradient-text",
					children: "404"
				}),
				/* @__PURE__ */ jsx("h2", {
					className: "mt-4 text-xl font-semibold",
					children: "Page not found"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "This orbit doesn't exist yet."
				}),
				/* @__PURE__ */ jsx("div", {
					className: "mt-6",
					children: /* @__PURE__ */ jsx(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-full ig-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-pop",
						children: "Back home"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	useEffect(() => {
		reportLovableError(error, { boundary: "tanstack_root_error_component" });
	}, [error]);
	return /* @__PURE__ */ jsx("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ jsxs("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ jsx("h1", {
					className: "text-xl font-semibold tracking-tight",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong. Try again or head home."
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ jsx("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "rounded-full ig-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-pop",
						children: "Try again"
					}), /* @__PURE__ */ jsx("a", {
						href: "/",
						className: "rounded-full border px-5 py-2.5 text-sm font-semibold",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$11 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1, viewport-fit=cover"
			},
			{ title: "DMOrbit — Turn Instagram engagement into conversations" },
			{
				name: "description",
				content: "DMOrbit is the easiest way for creators to automate Instagram comments, DMs and lead capture."
			},
			{
				name: "author",
				content: "DMOrbit"
			},
			{
				property: "og:title",
				content: "DMOrbit — Turn Instagram engagement into conversations"
			},
			{
				property: "og:description",
				content: "DMOrbit is the easiest way for creators to automate Instagram comments, DMs and lead capture."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			},
			{
				name: "twitter:title",
				content: "DMOrbit — Turn Instagram engagement into conversations"
			},
			{
				name: "twitter:description",
				content: "DMOrbit is the easiest way for creators to automate Instagram comments, DMs and lead capture."
			},
			{
				property: "og:image",
				content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/4e0984e9-fdab-41b1-b0e6-c9a13a77bd6a/id-preview-fea68a89--54b49a63-995d-45b4-90d3-f2ae5358f27f.lovable.app-1781598260831.png"
			},
			{
				name: "twitter:image",
				content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/4e0984e9-fdab-41b1-b0e6-c9a13a77bd6a/id-preview-fea68a89--54b49a63-995d-45b4-90d3-f2ae5358f27f.lovable.app-1781598260831.png"
			}
		],
		links: [
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ jsxs("html", {
		lang: "en",
		children: [/* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }), /* @__PURE__ */ jsxs("body", { children: [children, /* @__PURE__ */ jsx(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$11.useRouteContext();
	useStore((s) => s.isAuthLoaded);
	useEffect(() => {
		initFirebase();
		apiClient.get("/api/me").then((res) => {
			store.setUser(res.data.user);
			const currentState = store.get();
			if (currentState.connected && !currentState.igHandle) return apiClient.get("/api/dashboard/stats").then((statsRes) => {
				const ig = statsRes?.data?.instagram;
				if (ig?.username) store.setIgHandle(ig.username);
			}).catch(() => {});
		}).catch(() => {
			store.setUser(null);
		});
	}, []);
	return /* @__PURE__ */ jsxs(QueryClientProvider, {
		client: queryClient,
		children: [/* @__PURE__ */ jsx(Outlet, {}), /* @__PURE__ */ jsx(Toaster$1, { position: "top-center" })]
	});
}
//#endregion
//#region src/routes/welcome.tsx
var $$splitComponentImporter$10 = () => import("./welcome-BWj5xGFq.js");
var Route$10 = createFileRoute("/welcome")({
	head: () => ({ meta: [{ title: "Welcome to DMOrbit" }, {
		name: "description",
		content: "Connect Instagram and turn engagement into conversations in under 2 minutes."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$10, "component")
});
//#endregion
//#region src/routes/smart-bio.tsx
var $$splitComponentImporter$9 = () => import("./smart-bio-CSE20Sm6.js");
var Route$9 = createFileRoute("/smart-bio")({
	head: () => ({ meta: [{ title: "Smart Bio — DMOrbit" }] }),
	component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
//#endregion
//#region src/routes/signup.tsx
var $$splitComponentImporter$8 = () => import("./signup-DoKU3Cea.js");
var Route$8 = createFileRoute("/signup")({
	head: () => ({ meta: [{ title: "Sign up — DMOrbit" }] }),
	component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
//#endregion
//#region src/routes/settings.tsx
var $$splitComponentImporter$7 = () => import("./settings-VISF6hRD.js");
var Route$7 = createFileRoute("/settings")({
	head: () => ({ meta: [{ title: "Settings — DMOrbit" }] }),
	component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
//#endregion
//#region src/routes/home.tsx
var $$splitComponentImporter$6 = () => import("./home-DzJ7jusr.js");
var Route$6 = createFileRoute("/home")({
	head: () => ({ meta: [{ title: "Home — DMOrbit" }, {
		name: "description",
		content: "Your DMOrbit home dashboard."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
//#endregion
//#region src/routes/forgot-password.tsx
var $$splitComponentImporter$5 = () => import("./forgot-password-B_ZCrOXV.js");
var Route$5 = createFileRoute("/forgot-password")({
	head: () => ({ meta: [{ title: "Reset password — DMOrbit" }] }),
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
//#endregion
//#region src/routes/crm.tsx
var $$splitComponentImporter$4 = () => import("./crm-COmuyoVy.js");
var Route$4 = createFileRoute("/crm")({
	head: () => ({ meta: [{ title: "CRM — DMOrbit" }] }),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
//#endregion
//#region src/routes/campaigns.tsx
var $$splitComponentImporter$3 = () => import("./campaigns-DXLjIn-k.js");
var Route$3 = createFileRoute("/campaigns")({
	head: () => ({ meta: [{ title: "Campaigns — DMOrbit" }, {
		name: "description",
		content: "Manage your Instagram DM campaigns."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
//#endregion
//#region src/routes/billing.tsx
var $$splitComponentImporter$2 = () => import("./billing-BXXJV--2.js");
var Route$2 = createFileRoute("/billing")({
	head: () => ({ meta: [{ title: "Billing — DMOrbit" }] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
//#endregion
//#region src/routes/analytics.tsx
var $$splitComponentImporter$1 = () => import("./analytics-DfwODVoI.js");
var Route$1 = createFileRoute("/analytics")({
	head: () => ({ meta: [{ title: "Analytics — DMOrbit" }] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
//#endregion
//#region src/routes/index.tsx
var $$splitComponentImporter = () => import("./routes-rXiDYsNn.js");
var Route = createFileRoute("/")({
	head: () => ({ meta: [
		{ title: "DMOrbit — Turn Instagram comments into customers" },
		{
			name: "description",
			content: "Automatically reply to comments, send DMs, deliver PDFs, capture leads and track conversions on Instagram."
		},
		{
			property: "og:title",
			content: "DMOrbit — Turn Instagram comments into customers"
		},
		{
			property: "og:description",
			content: "Instagram DM automation for creators, coaches, and small businesses."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
//#region src/routeTree.gen.ts
var WelcomeRoute = Route$10.update({
	id: "/welcome",
	path: "/welcome",
	getParentRoute: () => Route$11
});
var SmartBioRoute = Route$9.update({
	id: "/smart-bio",
	path: "/smart-bio",
	getParentRoute: () => Route$11
});
var SignupRoute = Route$8.update({
	id: "/signup",
	path: "/signup",
	getParentRoute: () => Route$11
});
var SettingsRoute = Route$7.update({
	id: "/settings",
	path: "/settings",
	getParentRoute: () => Route$11
});
var LoginRoute = Route$12.update({
	id: "/login",
	path: "/login",
	getParentRoute: () => Route$11
});
var HomeRoute = Route$6.update({
	id: "/home",
	path: "/home",
	getParentRoute: () => Route$11
});
var ForgotPasswordRoute = Route$5.update({
	id: "/forgot-password",
	path: "/forgot-password",
	getParentRoute: () => Route$11
});
var CrmRoute = Route$4.update({
	id: "/crm",
	path: "/crm",
	getParentRoute: () => Route$11
});
var CampaignsRoute = Route$3.update({
	id: "/campaigns",
	path: "/campaigns",
	getParentRoute: () => Route$11
});
var BillingRoute = Route$2.update({
	id: "/billing",
	path: "/billing",
	getParentRoute: () => Route$11
});
var AnalyticsRoute = Route$1.update({
	id: "/analytics",
	path: "/analytics",
	getParentRoute: () => Route$11
});
var IndexRoute = Route.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$11
});
var CampaignsNewRoute = Route$13.update({
	id: "/campaigns_/new",
	path: "/campaigns/new",
	getParentRoute: () => Route$11
});
var rootRouteChildren = {
	IndexRoute,
	AnalyticsRoute,
	BillingRoute,
	CampaignsRoute,
	CrmRoute,
	ForgotPasswordRoute,
	HomeRoute,
	LoginRoute,
	SettingsRoute,
	SignupRoute,
	SmartBioRoute,
	WelcomeRoute,
	CampaignsIdRoute: Route$14.update({
		id: "/campaigns_/$id",
		path: "/campaigns/$id",
		getParentRoute: () => Route$11
	}),
	CampaignsNewRoute
};
var routeTree = Route$11._addFileChildren(rootRouteChildren)._addFileTypes();
//#endregion
//#region src/router.tsx
var getRouter = () => {
	return createRouter({
		routeTree,
		context: { queryClient: new QueryClient() },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
