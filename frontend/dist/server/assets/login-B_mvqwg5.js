import { t as store } from "./store-DJ5BNnQm.js";
import { t as apiClient } from "./client-CDls2Pz7.js";
import { n as signInWithGoogle } from "./firebase-yVBTGaC_.js";
import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { toast } from "sonner";
import { ArrowRight, Eye, EyeOff, Lock, Mail, Sparkles } from "lucide-react";
//#region src/routes/login.tsx?tsr-split=component
function Login() {
	const navigate = useNavigate();
	const [show, setShow] = useState(false);
	const [loading, setLoading] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [rememberMe, setRememberMe] = useState(false);
	const handleGoogleLogin = async () => {
		setLoading(true);
		try {
			const data = await signInWithGoogle();
			store.setUser(data.user);
			navigate({ to: data.user?.role === "admin" ? "/admin" : "/home" });
		} catch (err) {
			toast.error(err.message || "Google Login failed");
		} finally {
			setLoading(false);
		}
	};
	const submit = async (e) => {
		e.preventDefault();
		setLoading(true);
		try {
			const res = await apiClient.post("/api/login", {
				email,
				password,
				rememberMe
			});
			store.setUser(res.data.user);
			navigate({ to: res.data.user?.role === "admin" ? "/admin" : "/home" });
		} catch (err) {
			toast.error(err.response?.data?.error || "Failed to log in");
		} finally {
			setLoading(false);
		}
	};
	return /* @__PURE__ */ jsxs(AuthShell, {
		title: "Welcome back",
		sub: "Log in to your DMOrbit account",
		children: [
			/* @__PURE__ */ jsxs("button", {
				type: "button",
				onClick: handleGoogleLogin,
				disabled: loading,
				className: "flex w-full items-center justify-center gap-2 rounded-xl border bg-card px-4 py-3 text-sm font-semibold shadow-card transition hover:bg-muted disabled:opacity-60",
				children: [/* @__PURE__ */ jsx(GoogleIcon, {}), " Continue with Google"]
			}),
			/* @__PURE__ */ jsx(Divider, {}),
			/* @__PURE__ */ jsxs("form", {
				onSubmit: submit,
				className: "space-y-3",
				children: [
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
						placeholder: "Password",
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
					/* @__PURE__ */ jsxs("div", {
						className: "flex items-center justify-between text-xs",
						children: [/* @__PURE__ */ jsxs("label", {
							className: "flex items-center gap-2 text-muted-foreground",
							children: [/* @__PURE__ */ jsx("input", {
								type: "checkbox",
								className: "rounded",
								checked: rememberMe,
								onChange: (e) => setRememberMe(e.target.checked)
							}), " Remember me"]
						}), /* @__PURE__ */ jsx(Link, {
							to: "/forgot-password",
							className: "font-semibold text-foreground",
							children: "Forgot?"
						})]
					}),
					/* @__PURE__ */ jsx("button", {
						disabled: loading,
						className: "inline-flex w-full items-center justify-center gap-2 rounded-xl ig-gradient px-4 py-3 text-sm font-bold text-white shadow-pop disabled:opacity-60",
						children: loading ? "Logging in…" : /* @__PURE__ */ jsxs(Fragment, { children: ["Log in ", /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })] })
					})
				]
			}),
			/* @__PURE__ */ jsxs("p", {
				className: "mt-6 text-center text-sm text-muted-foreground",
				children: ["New here? ", /* @__PURE__ */ jsx(Link, {
					to: "/signup",
					className: "font-bold text-foreground",
					children: "Create account"
				})]
			})
		]
	});
}
function AuthShell({ title, sub, children }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "relative grid min-h-screen place-items-center overflow-hidden bg-background px-4 py-10",
		children: [/* @__PURE__ */ jsx("div", {
			className: "pointer-events-none absolute inset-0 -z-10",
			children: /* @__PURE__ */ jsx("div", { className: "absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-br from-purple-400/20 via-pink-400/20 to-orange-300/20 blur-3xl" })
		}), /* @__PURE__ */ jsxs("div", {
			className: "w-full max-w-sm",
			children: [
				/* @__PURE__ */ jsxs(Link, {
					to: "/",
					className: "mb-6 flex items-center justify-center gap-2",
					children: [/* @__PURE__ */ jsx("div", {
						className: "grid h-10 w-10 place-items-center rounded-xl ig-gradient text-white shadow-pop",
						children: /* @__PURE__ */ jsx(Sparkles, { className: "h-4 w-4" })
					}), /* @__PURE__ */ jsx("span", {
						className: "text-xl font-extrabold tracking-tight",
						children: "DMOrbit"
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "rounded-3xl border bg-card p-6 shadow-card sm:p-8",
					children: [
						/* @__PURE__ */ jsx("h1", {
							className: "text-2xl font-extrabold tracking-tight",
							children: title
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-1 text-sm text-muted-foreground",
							children: sub
						}),
						/* @__PURE__ */ jsx("div", {
							className: "mt-6",
							children
						})
					]
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-5 text-center text-xs text-muted-foreground",
					children: "By continuing, you agree to our Terms and Privacy Policy."
				})
			]
		})]
	});
}
function Field({ icon: Icon, trailing, ...props }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "flex items-center gap-2 rounded-xl border bg-background px-3.5 py-3 focus-within:border-foreground",
		children: [
			/* @__PURE__ */ jsx(Icon, { className: "h-4 w-4 shrink-0 text-muted-foreground" }),
			/* @__PURE__ */ jsx("input", {
				...props,
				className: "flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
			}),
			trailing
		]
	});
}
function Divider() {
	return /* @__PURE__ */ jsxs("div", {
		className: "my-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
		children: [
			/* @__PURE__ */ jsx("div", { className: "h-px flex-1 bg-border" }),
			" or ",
			/* @__PURE__ */ jsx("div", { className: "h-px flex-1 bg-border" })
		]
	});
}
function GoogleIcon() {
	return /* @__PURE__ */ jsxs("svg", {
		className: "h-4 w-4",
		viewBox: "0 0 24 24",
		children: [
			/* @__PURE__ */ jsx("path", {
				fill: "#4285F4",
				d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z"
			}),
			/* @__PURE__ */ jsx("path", {
				fill: "#34A853",
				d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
			}),
			/* @__PURE__ */ jsx("path", {
				fill: "#FBBC05",
				d: "M5.84 14.12A6.6 6.6 0 0 1 5.5 12c0-.74.13-1.45.34-2.12V7.04H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.96l3.66-2.84z"
			}),
			/* @__PURE__ */ jsx("path", {
				fill: "#EA4335",
				d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
			})
		]
	});
}
//#endregion
export { AuthShell, Divider, Field, GoogleIcon, Login as component };
