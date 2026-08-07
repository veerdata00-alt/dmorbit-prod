import { t as apiClient } from "./client-CDls2Pz7.js";
import { r as Field, t as AuthShell } from "./login-BzE9G1qU.js";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, Mail } from "lucide-react";
//#region src/routes/forgot-password.tsx?tsr-split=component
function Forgot() {
	const [sent, setSent] = useState(false);
	const [loading, setLoading] = useState(false);
	const [email, setEmail] = useState("");
	const submit = async (e) => {
		e.preventDefault();
		setLoading(true);
		try {
			await apiClient.post("/api/forgot-password", { email });
			setSent(true);
		} catch (err) {
			toast.error(err.response?.data?.error || "Failed to send reset link");
		} finally {
			setLoading(false);
		}
	};
	return /* @__PURE__ */ jsxs(AuthShell, {
		title: "Reset your password",
		sub: "We'll email you a secure reset link.",
		children: [sent ? /* @__PURE__ */ jsxs("div", {
			className: "rounded-2xl border bg-gradient-to-br from-emerald-500/10 to-teal-400/10 p-5 text-center",
			children: [
				/* @__PURE__ */ jsx(CheckCircle2, { className: "mx-auto h-8 w-8 text-emerald-600" }),
				/* @__PURE__ */ jsx("div", {
					className: "mt-2 font-bold",
					children: "Check your inbox"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: "If an account exists, we just sent a reset link."
				})
			]
		}) : /* @__PURE__ */ jsxs("form", {
			onSubmit: submit,
			className: "space-y-3",
			children: [/* @__PURE__ */ jsx(Field, {
				icon: Mail,
				type: "email",
				placeholder: "you@email.com",
				value: email,
				onChange: (e) => setEmail(e.target.value),
				required: true
			}), /* @__PURE__ */ jsx("button", {
				disabled: loading,
				className: "inline-flex w-full items-center justify-center gap-2 rounded-xl ig-gradient px-4 py-3 text-sm font-bold text-white shadow-pop disabled:opacity-60",
				children: loading ? "Sending…" : /* @__PURE__ */ jsxs(Fragment, { children: ["Send reset link ", /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })] })
			})]
		}), /* @__PURE__ */ jsxs("p", {
			className: "mt-6 text-center text-sm text-muted-foreground",
			children: ["Remembered it? ", /* @__PURE__ */ jsx(Link, {
				to: "/login",
				className: "font-bold text-foreground",
				children: "Back to log in"
			})]
		})]
	});
}
//#endregion
export { Forgot as component };
