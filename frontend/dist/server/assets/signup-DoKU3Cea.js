import { t as store } from "./store-DJ5BNnQm.js";
import { t as apiClient } from "./client-CDls2Pz7.js";
import { n as signInWithGoogle } from "./firebase-yVBTGaC_.js";
import { i as GoogleIcon, n as Divider, r as Field, t as AuthShell } from "./login-BzE9G1qU.js";
import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { toast } from "sonner";
import { ArrowRight, Check, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
//#region src/routes/signup.tsx?tsr-split=component
function Signup() {
	const navigate = useNavigate();
	const [show, setShow] = useState(false);
	const [loading, setLoading] = useState(false);
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const handleGoogleSignup = async () => {
		setLoading(true);
		try {
			const data = await signInWithGoogle();
			store.setUser(data.user);
			if (data.user) navigate({ to: data.user?.role === "admin" ? "/admin" : "/home" });
			toast.error(err.message || "Google Signup failed");
		} finally {
			setLoading(false);
		}
	};
	const submit = async (e) => {
		e.preventDefault();
		setLoading(true);
		try {
			const res = await apiClient.post("/api/signup", {
				name,
				email,
				password
			});
			store.setUser(res.data.user);
			if (res.data.user) navigate({ to: res.data.user?.role === "admin" ? "/admin" : "/home" });
			toast.error(err.response?.data?.error || "Failed to sign up");
		} finally {
			setLoading(false);
		}
	};
	return /* @__PURE__ */ jsxs(AuthShell, {
		title: "Create your account",
		sub: "Start free. No credit card required.",
		children: [
			/* @__PURE__ */ jsxs("button", {
				type: "button",
				onClick: handleGoogleSignup,
				disabled: loading,
				className: "flex w-full items-center justify-center gap-2 rounded-xl border bg-card px-4 py-3 text-sm font-semibold shadow-card transition hover:bg-muted disabled:opacity-60",
				children: [/* @__PURE__ */ jsx(GoogleIcon, {}), " Sign up with Google"]
			}),
			/* @__PURE__ */ jsx(Divider, {}),
			/* @__PURE__ */ jsxs("form", {
				onSubmit: submit,
				className: "space-y-3",
				children: [
					/* @__PURE__ */ jsx(Field, {
						icon: User,
						type: "text",
						placeholder: "Full name",
						value: name,
						onChange: (e) => setName(e.target.value),
						required: true
					}),
					/* @__PURE__ */ jsx(Field, {
						icon: Mail,
						type: "email",
						placeholder: "you@email.com",
						value: email,
						onChange: (e) => setEmail(e.target.value),
						required: true
					}),
					/* @__PURE__ */ jsx(Field, {
						icon: Lock,
						type: show ? "text" : "password",
						placeholder: "Create password",
						value: password,
						onChange: (e) => setPassword(e.target.value),
						required: true,
						trailing: /* @__PURE__ */ jsx("button", {
							type: "button",
							onClick: () => setShow(!show),
							className: "text-muted-foreground",
							children: show ? /* @__PURE__ */ jsx(EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx(Eye, { className: "h-4 w-4" })
						})
					}),
					/* @__PURE__ */ jsxs("ul", {
						className: "space-y-1 px-1 text-xs text-muted-foreground",
						children: [/* @__PURE__ */ jsxs("li", {
							className: "flex items-center gap-1.5",
							children: [/* @__PURE__ */ jsx(Check, { className: "h-3 w-3 text-emerald-600" }), " 8+ characters"]
						}), /* @__PURE__ */ jsxs("li", {
							className: "flex items-center gap-1.5",
							children: [/* @__PURE__ */ jsx(Check, { className: "h-3 w-3 text-emerald-600" }), " 1 number & 1 letter"]
						})]
					}),
					/* @__PURE__ */ jsx("button", {
						disabled: loading,
						className: "inline-flex w-full items-center justify-center gap-2 rounded-xl ig-gradient px-4 py-3 text-sm font-bold text-white shadow-pop disabled:opacity-60",
						children: loading ? "Creating account…" : /* @__PURE__ */ jsxs(Fragment, { children: ["Create account ", /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })] })
					})
				]
			}),
			/* @__PURE__ */ jsxs("p", {
				className: "mt-6 text-center text-sm text-muted-foreground",
				children: ["Already have an account? ", /* @__PURE__ */ jsx(Link, {
					to: "/login",
					className: "font-bold text-foreground",
					children: "Log in"
				})]
			})
		]
	});
}
//#endregion
export { Signup as component };
