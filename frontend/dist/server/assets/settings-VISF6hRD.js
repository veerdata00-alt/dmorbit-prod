import { n as useStore, t as store } from "./store-DJ5BNnQm.js";
import { t as apiClient } from "./client-CDls2Pz7.js";
import { t as AppShell } from "./AppShell-Yy6EdzMu.js";
import { a as DialogHeader, n as DialogContent, o as DialogTitle, r as DialogDescription, t as Dialog } from "./dialog-gKu1QSPo.js";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { toast } from "sonner";
import { Bell, ChevronRight, CreditCard, Instagram, LogOut, Shield, User } from "lucide-react";
//#region src/routes/settings.tsx?tsr-split=component
function Settings() {
	const navigate = useNavigate();
	const { connected, handle, user } = useStore((s) => ({
		connected: s.connected,
		handle: s.igHandle,
		user: s.user
	}));
	const [notifs, setNotifs] = useState({
		email: true,
		push: true,
		weekly: false
	});
	const [isProfileOpen, setIsProfileOpen] = useState(false);
	const [fullName, setFullName] = useState("");
	const [phoneNumber, setPhoneNumber] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	useEffect(() => {
		if (isProfileOpen && user) {
			setFullName(user.fullName || user.name || "");
			setPhoneNumber(user.phoneNumber || "");
		}
	}, [isProfileOpen, user]);
	const handleSaveProfile = async () => {
		setIsSaving(true);
		try {
			const res = await apiClient.patch("/api/me", {
				fullName,
				phoneNumber
			});
			store.setUser(res.data.user);
			toast.success("Profile updated successfully");
			setIsProfileOpen(false);
		} catch (e) {
			toast.error("Unable to save profile");
		} finally {
			setIsSaving(false);
		}
	};
	return /* @__PURE__ */ jsxs(AppShell, {
		title: "Settings",
		children: [
			/* @__PURE__ */ jsx("section", {
				className: "rounded-3xl border bg-card p-5 shadow-card",
				children: /* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-4",
					children: [/* @__PURE__ */ jsx("div", {
						className: "grid h-14 w-14 place-items-center rounded-2xl ig-gradient text-lg font-extrabold text-white",
						children: (handle?.[0] ?? user?.name?.[0] ?? user?.email?.[0] ?? "?").toUpperCase()
					}), /* @__PURE__ */ jsxs("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ jsx("div", {
							className: "text-base font-bold",
							children: handle ? `@${handle}` : user?.name || user?.email || "Your Account"
						}), /* @__PURE__ */ jsx("div", {
							className: "text-xs text-muted-foreground",
							children: user?.email || ""
						})]
					})]
				})
			}),
			/* @__PURE__ */ jsxs(Group, {
				title: "Account",
				children: [
					/* @__PURE__ */ jsx(Row, {
						icon: User,
						title: "Profile",
						desc: "Name, email and avatar",
						onClick: () => setIsProfileOpen(true)
					}),
					/* @__PURE__ */ jsx(Dialog, {
						open: isProfileOpen,
						onOpenChange: setIsProfileOpen,
						children: /* @__PURE__ */ jsxs(DialogContent, {
							className: "sm:max-w-md",
							children: [/* @__PURE__ */ jsxs(DialogHeader, { children: [/* @__PURE__ */ jsx(DialogTitle, { children: "Profile Details" }), /* @__PURE__ */ jsx(DialogDescription, { children: "Your current account information." })] }), /* @__PURE__ */ jsxs("div", {
								className: "flex flex-col gap-4 py-4",
								children: [
									/* @__PURE__ */ jsxs("div", {
										className: "flex items-center gap-4",
										children: [/* @__PURE__ */ jsx("div", {
											className: "grid h-16 w-16 place-items-center rounded-2xl ig-gradient text-2xl font-extrabold text-white",
											children: (handle?.[0] ?? user?.fullName?.[0] ?? user?.name?.[0] ?? user?.email?.[0] ?? "?").toUpperCase()
										}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
											className: "text-lg font-bold",
											children: user?.fullName || user?.name || (user?.email ? user.email.split("@")[0] : null) || "Your Account"
										}), /* @__PURE__ */ jsx("div", {
											className: "text-sm text-muted-foreground",
											children: user?.email
										})] })]
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "mt-4 space-y-3",
										children: [/* @__PURE__ */ jsxs("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ jsx("label", {
												className: "text-xs font-semibold text-muted-foreground",
												children: "Full Name"
											}), /* @__PURE__ */ jsx("input", {
												value: fullName,
												onChange: (e) => setFullName(e.target.value),
												placeholder: "Enter your full name",
												className: "w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
											})]
										}), /* @__PURE__ */ jsxs("div", {
											className: "space-y-1.5",
											children: [
												/* @__PURE__ */ jsx("label", {
													className: "text-xs font-semibold text-muted-foreground",
													children: "Phone Number"
												}),
												/* @__PURE__ */ jsx("input", {
													value: phoneNumber,
													onChange: (e) => setPhoneNumber(e.target.value),
													placeholder: "+1 234 567 8900",
													className: "w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
												}),
												/* @__PURE__ */ jsx("p", {
													className: "text-[10px] text-muted-foreground mt-1.5",
													children: "Optional. Used for future account notifications and WhatsApp integrations."
												})
											]
										})]
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "mt-2 space-y-3 rounded-2xl border bg-muted/50 p-4",
										children: [/* @__PURE__ */ jsxs("div", {
											className: "flex justify-between items-center",
											children: [/* @__PURE__ */ jsx("span", {
												className: "text-sm font-medium text-muted-foreground",
												children: "Instagram Username"
											}), /* @__PURE__ */ jsx("span", {
												className: "text-sm font-bold",
												children: handle ? `@${handle}` : "Not connected"
											})]
										}), /* @__PURE__ */ jsxs("div", {
											className: "flex justify-between items-center",
											children: [/* @__PURE__ */ jsx("span", {
												className: "text-sm font-medium text-muted-foreground",
												children: "Member Since"
											}), /* @__PURE__ */ jsx("span", {
												className: "text-sm font-bold",
												children: user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", {
													month: "long",
													year: "numeric"
												}) : "Unknown"
											})]
										})]
									}),
									/* @__PURE__ */ jsx("button", {
										onClick: handleSaveProfile,
										disabled: isSaving,
										className: "mt-2 w-full rounded-xl ig-gradient py-2.5 text-sm font-bold text-white shadow-pop disabled:opacity-50",
										children: isSaving ? "Saving..." : "Save Changes"
									})
								]
							})]
						})
					}),
					/* @__PURE__ */ jsx(Row, {
						icon: Instagram,
						title: "Instagram Connection",
						desc: connected ? `@${handle} · Connected` : "Not connected",
						right: /* @__PURE__ */ jsx("button", {
							onClick: () => {
								if (connected) {
									store.disconnect();
									toast("Instagram disconnected");
									navigate({
										to: "/home",
										replace: true
									});
								} else {
									const returnUrl = encodeURIComponent(window.location.origin + "/home");
									window.location.href = `http://localhost:3000/auth/instagram?returnTo=${returnUrl}`;
								}
							},
							className: `rounded-full px-3 py-1.5 text-xs font-semibold ${connected ? "border" : "ig-gradient text-white"}`,
							children: connected ? "Disconnect" : "Connect"
						})
					})
				]
			}),
			/* @__PURE__ */ jsxs(Group, {
				title: "Notifications",
				children: [
					/* @__PURE__ */ jsx(Toggle, {
						label: "Email notifications",
						desc: "Lead alerts and weekly summary.",
						checked: notifs.email,
						onChange: (v) => setNotifs({
							...notifs,
							email: v
						})
					}),
					/* @__PURE__ */ jsx(Toggle, {
						label: "Push notifications",
						desc: "Real-time DM activity.",
						checked: notifs.push,
						onChange: (v) => setNotifs({
							...notifs,
							push: v
						})
					}),
					/* @__PURE__ */ jsx(Toggle, {
						label: "Weekly digest",
						desc: "Sunday performance recap.",
						checked: notifs.weekly,
						onChange: (v) => setNotifs({
							...notifs,
							weekly: v
						})
					})
				]
			}),
			/* @__PURE__ */ jsxs(Group, {
				title: "More",
				children: [
					/* @__PURE__ */ jsx(Row, {
						icon: Shield,
						title: "Security",
						desc: "Password and two-factor auth"
					}),
					/* @__PURE__ */ jsx(Row, {
						icon: CreditCard,
						title: "Billing",
						desc: "Plan, credits & invoices",
						onClick: () => navigate({ to: "/billing" })
					}),
					/* @__PURE__ */ jsx(Row, {
						icon: Bell,
						title: "Help & Support",
						desc: "Docs, contact and community"
					})
				]
			}),
			/* @__PURE__ */ jsxs("button", {
				onClick: async () => {
					try {
						await apiClient.post("/api/logout");
					} catch (e) {}
					store.reset();
					toast("Signed out");
					navigate({
						to: "/login",
						replace: true
					});
				},
				className: "mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3.5 text-sm font-semibold text-destructive",
				children: [/* @__PURE__ */ jsx(LogOut, { className: "h-4 w-4" }), " Sign out"]
			})
		]
	});
}
function Group({ title, children }) {
	return /* @__PURE__ */ jsxs("section", {
		className: "mt-5",
		children: [/* @__PURE__ */ jsx("div", {
			className: "px-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground",
			children: title
		}), /* @__PURE__ */ jsx("div", {
			className: "overflow-hidden rounded-3xl border bg-card shadow-card divide-y",
			children
		})]
	});
}
function Row({ icon: Icon, title, desc, right, onClick }) {
	return /* @__PURE__ */ jsxs("button", {
		onClick,
		className: "flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-muted/30",
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "grid h-10 w-10 shrink-0 place-items-center rounded-xl ig-gradient-soft",
				children: /* @__PURE__ */ jsx(Icon, { className: "h-4.5 w-4.5" })
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ jsx("div", {
					className: "text-sm font-semibold",
					children: title
				}), /* @__PURE__ */ jsx("div", {
					className: "truncate text-xs text-muted-foreground",
					children: desc
				})]
			}),
			right ?? /* @__PURE__ */ jsx(ChevronRight, { className: "h-4 w-4 text-muted-foreground" })
		]
	});
}
function Toggle({ label, desc, checked, onChange }) {
	return /* @__PURE__ */ jsxs("button", {
		onClick: () => onChange(!checked),
		className: "flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-muted/30",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "min-w-0 flex-1",
			children: [/* @__PURE__ */ jsx("div", {
				className: "text-sm font-semibold",
				children: label
			}), /* @__PURE__ */ jsx("div", {
				className: "text-xs text-muted-foreground",
				children: desc
			})]
		}), /* @__PURE__ */ jsx("div", {
			className: `relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "ig-gradient" : "bg-muted"}`,
			children: /* @__PURE__ */ jsx("div", { className: `absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${checked ? "left-[1.375rem]" : "left-0.5"}` })
		})]
	});
}
//#endregion
export { Settings as component };
