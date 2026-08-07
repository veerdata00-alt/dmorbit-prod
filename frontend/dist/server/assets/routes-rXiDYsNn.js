import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { ArrowRight, BarChart3, Camera, Check, ChevronDown, FileText, Instagram, Link as Link$1, MessageCircle, Play, Reply, ShieldCheck, Sparkles, Star, Users, Zap } from "lucide-react";
//#region src/routes/index.tsx?tsr-split=component
function Landing() {
	return /* @__PURE__ */ jsxs("div", {
		className: "min-h-screen bg-background text-foreground",
		children: [
			/* @__PURE__ */ jsx(Nav, {}),
			/* @__PURE__ */ jsx(Hero, {}),
			/* @__PURE__ */ jsx(Logos, {}),
			/* @__PURE__ */ jsx(HowItWorks, {}),
			/* @__PURE__ */ jsx(Features, {}),
			/* @__PURE__ */ jsx(Stats, {}),
			/* @__PURE__ */ jsx(Testimonials, {}),
			/* @__PURE__ */ jsx(Pricing, {}),
			/* @__PURE__ */ jsx(FAQ, {}),
			/* @__PURE__ */ jsx(CTA, {}),
			/* @__PURE__ */ jsx(Footer, {})
		]
	});
}
function Nav() {
	const [open, setOpen] = useState(false);
	return /* @__PURE__ */ jsxs("header", {
		className: "sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8",
			children: [
				/* @__PURE__ */ jsxs(Link, {
					to: "/",
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ jsx("div", {
						className: "grid h-9 w-9 place-items-center rounded-xl ig-gradient text-white shadow-pop",
						children: /* @__PURE__ */ jsx(Sparkles, { className: "h-4 w-4" })
					}), /* @__PURE__ */ jsx("span", {
						className: "text-lg font-extrabold tracking-tight",
						children: "DMOrbit"
					})]
				}),
				/* @__PURE__ */ jsxs("nav", {
					className: "hidden items-center gap-8 md:flex",
					children: [
						/* @__PURE__ */ jsx("a", {
							href: "#features",
							className: "text-sm font-medium text-muted-foreground hover:text-foreground",
							children: "Features"
						}),
						/* @__PURE__ */ jsx("a", {
							href: "#how",
							className: "text-sm font-medium text-muted-foreground hover:text-foreground",
							children: "How it works"
						}),
						/* @__PURE__ */ jsx("a", {
							href: "#pricing",
							className: "text-sm font-medium text-muted-foreground hover:text-foreground",
							children: "Pricing"
						}),
						/* @__PURE__ */ jsx("a", {
							href: "#faq",
							className: "text-sm font-medium text-muted-foreground hover:text-foreground",
							children: "FAQ"
						})
					]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ jsx(Link, {
							to: "/login",
							className: "hidden rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground sm:inline-block",
							children: "Log in"
						}),
						/* @__PURE__ */ jsx(Link, {
							to: "/signup",
							className: "rounded-full ig-gradient px-4 py-2 text-sm font-semibold text-white shadow-pop",
							children: "Start Free"
						}),
						/* @__PURE__ */ jsx("button", {
							onClick: () => setOpen(!open),
							className: "grid h-9 w-9 place-items-center rounded-full border md:hidden",
							"aria-label": "Menu",
							children: /* @__PURE__ */ jsx(ChevronDown, { className: `h-4 w-4 transition ${open ? "rotate-180" : ""}` })
						})
					]
				})
			]
		}), open && /* @__PURE__ */ jsx("div", {
			className: "border-t bg-background md:hidden",
			children: /* @__PURE__ */ jsxs("div", {
				className: "flex flex-col gap-1 px-5 py-3",
				children: [
					/* @__PURE__ */ jsx("a", {
						href: "#features",
						onClick: () => setOpen(false),
						className: "rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted",
						children: "Features"
					}),
					/* @__PURE__ */ jsx("a", {
						href: "#how",
						onClick: () => setOpen(false),
						className: "rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted",
						children: "How it works"
					}),
					/* @__PURE__ */ jsx("a", {
						href: "#pricing",
						onClick: () => setOpen(false),
						className: "rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted",
						children: "Pricing"
					}),
					/* @__PURE__ */ jsx("a", {
						href: "#faq",
						onClick: () => setOpen(false),
						className: "rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted",
						children: "FAQ"
					}),
					/* @__PURE__ */ jsx(Link, {
						to: "/login",
						className: "rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted",
						children: "Log in"
					})
				]
			})
		})]
	});
}
function Hero() {
	return /* @__PURE__ */ jsxs("section", {
		className: "relative overflow-hidden",
		children: [/* @__PURE__ */ jsx("div", {
			className: "pointer-events-none absolute inset-0 -z-10",
			children: /* @__PURE__ */ jsx("div", { className: "absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-br from-purple-400/30 via-pink-400/30 to-orange-300/30 blur-3xl" })
		}), /* @__PURE__ */ jsxs("div", {
			className: "mx-auto max-w-7xl px-5 pb-16 pt-12 sm:px-8 sm:pb-24 sm:pt-20",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "mx-auto max-w-3xl text-center",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "mx-auto inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-semibold shadow-card",
						children: [/* @__PURE__ */ jsx("span", {
							className: "grid h-4 w-4 place-items-center rounded-full ig-gradient text-white",
							children: /* @__PURE__ */ jsx(Zap, { className: "h-2.5 w-2.5" })
						}), "New · Auto-DM for Reels & Stories"]
					}),
					/* @__PURE__ */ jsxs("h1", {
						className: "mt-5 text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl",
						children: ["Turn Instagram comments into ", /* @__PURE__ */ jsx("span", {
							className: "ig-gradient-text",
							children: "customers"
						})]
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg",
						children: "Automatically reply to comments, send DMs, deliver PDFs, capture leads and track conversions — all from one beautifully simple dashboard."
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row",
						children: [/* @__PURE__ */ jsxs(Link, {
							to: "/signup",
							className: "inline-flex w-full items-center justify-center gap-2 rounded-full ig-gradient px-7 py-3.5 text-sm font-bold text-white shadow-pop transition active:scale-[0.98] sm:w-auto",
							children: ["Start Free ", /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })]
						}), /* @__PURE__ */ jsxs("a", {
							href: "#how",
							className: "inline-flex w-full items-center justify-center gap-2 rounded-full border bg-card px-7 py-3.5 text-sm font-bold shadow-card sm:w-auto",
							children: [/* @__PURE__ */ jsx(Play, { className: "h-4 w-4" }), " Watch Demo"]
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mt-5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground",
						children: [/* @__PURE__ */ jsx(ShieldCheck, { className: "h-3.5 w-3.5" }), " Free forever plan · No credit card required"]
					})
				]
			}), /* @__PURE__ */ jsx(HeroMockup, {})]
		})]
	});
}
function HeroMockup() {
	return /* @__PURE__ */ jsxs("div", {
		className: "relative mx-auto mt-12 max-w-5xl sm:mt-16",
		children: [/* @__PURE__ */ jsx("div", { className: "absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-orange-400/20 blur-2xl" }), /* @__PURE__ */ jsxs("div", {
			className: "overflow-hidden rounded-[1.5rem] border bg-card shadow-pop sm:rounded-[2rem]",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-2 border-b bg-muted/40 px-4 py-3",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex gap-1.5",
					children: [
						/* @__PURE__ */ jsx("span", { className: "h-2.5 w-2.5 rounded-full bg-red-400" }),
						/* @__PURE__ */ jsx("span", { className: "h-2.5 w-2.5 rounded-full bg-yellow-400" }),
						/* @__PURE__ */ jsx("span", { className: "h-2.5 w-2.5 rounded-full bg-green-400" })
					]
				}), /* @__PURE__ */ jsx("div", {
					className: "mx-auto hidden rounded-md bg-background px-3 py-1 text-xs text-muted-foreground sm:block",
					children: "app.dmorbit.com/home"
				})]
			}), /* @__PURE__ */ jsxs("div", {
				className: "grid gap-4 p-4 sm:grid-cols-[1fr_1.4fr] sm:gap-5 sm:p-6",
				children: [/* @__PURE__ */ jsx("div", {
					className: "mx-auto w-full max-w-[260px] rounded-[2rem] border-[8px] border-foreground/90 bg-background p-3 shadow-xl",
					children: /* @__PURE__ */ jsxs("div", {
						className: "rounded-2xl bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-3",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ jsx("div", { className: "h-8 w-8 rounded-full ig-gradient" }), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
									className: "text-[11px] font-bold",
									children: "@you.create"
								}), /* @__PURE__ */ jsx("div", {
									className: "text-[9px] text-muted-foreground",
									children: "1 min ago"
								})] })]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "mt-2 rounded-xl bg-white p-2 text-[11px] shadow-sm",
								children: [
									/* @__PURE__ */ jsx("b", { children: "@sarah.fit" }),
									": Send me the guide! ",
									/* @__PURE__ */ jsx("span", {
										className: "ml-1 inline-block rounded bg-pink-100 px-1 text-[9px] font-bold text-pink-700",
										children: "PDF"
									})
								]
							}),
							/* @__PURE__ */ jsx("div", {
								className: "mt-2 flex justify-end",
								children: /* @__PURE__ */ jsx("div", {
									className: "rounded-2xl rounded-br-md ig-gradient px-3 py-1.5 text-[10px] font-semibold text-white shadow",
									children: "📩 Sent! Check your DMs."
								})
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "mt-2 flex items-center gap-1.5 rounded-xl bg-emerald-50 p-2",
								children: [/* @__PURE__ */ jsx(Check, { className: "h-3 w-3 text-emerald-600" }), /* @__PURE__ */ jsx("span", {
									className: "text-[10px] font-semibold text-emerald-700",
									children: "DM delivered · Lead captured"
								})]
							})
						]
					})
				}), /* @__PURE__ */ jsxs("div", {
					className: "space-y-3",
					children: [
						/* @__PURE__ */ jsx("div", {
							className: "grid grid-cols-3 gap-2 sm:gap-3",
							children: [
								{
									l: "Comments",
									v: "12,847"
								},
								{
									l: "DMs Sent",
									v: "9,412"
								},
								{
									l: "Leads",
									v: "2,108"
								}
							].map((s) => /* @__PURE__ */ jsxs("div", {
								className: "rounded-xl border bg-background p-2.5 sm:p-3.5",
								children: [/* @__PURE__ */ jsx("div", {
									className: "text-[10px] font-semibold text-muted-foreground",
									children: s.l
								}), /* @__PURE__ */ jsx("div", {
									className: "mt-0.5 text-base font-extrabold sm:text-xl",
									children: s.v
								})]
							}, s.l))
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "rounded-2xl border bg-background p-4",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "mb-3 flex items-center justify-between",
								children: [/* @__PURE__ */ jsx("div", {
									className: "text-xs font-bold",
									children: "Funnel · Last 7 days"
								}), /* @__PURE__ */ jsx("div", {
									className: "rounded-full ig-gradient-soft px-2 py-0.5 text-[10px] font-bold",
									children: "+24%"
								})]
							}), /* @__PURE__ */ jsx("div", {
								className: "space-y-2",
								children: [
									{
										l: "Comments",
										w: 100,
										v: "12.8k"
									},
									{
										l: "DMs sent",
										w: 78,
										v: "9.4k"
									},
									{
										l: "Replies",
										w: 46,
										v: "5.6k"
									},
									{
										l: "Leads",
										w: 18,
										v: "2.1k"
									}
								].map((b) => /* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-2",
									children: [
										/* @__PURE__ */ jsx("div", {
											className: "w-16 shrink-0 text-[10px] font-semibold text-muted-foreground",
											children: b.l
										}),
										/* @__PURE__ */ jsx("div", {
											className: "h-5 flex-1 overflow-hidden rounded-full bg-muted",
											children: /* @__PURE__ */ jsx("div", {
												className: "h-full ig-gradient",
												style: { width: `${b.w}%` }
											})
										}),
										/* @__PURE__ */ jsx("div", {
											className: "w-10 shrink-0 text-right text-[10px] font-bold",
											children: b.v
										})
									]
								}, b.l))
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "grid grid-cols-2 gap-2 sm:gap-3",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "rounded-xl border bg-background p-3",
								children: [
									/* @__PURE__ */ jsx("div", {
										className: "text-[10px] font-semibold text-muted-foreground",
										children: "Top campaign"
									}),
									/* @__PURE__ */ jsx("div", {
										className: "mt-0.5 truncate text-xs font-bold",
										children: "Free Growth PDF"
									}),
									/* @__PURE__ */ jsx("div", {
										className: "mt-1 text-[10px] text-emerald-600",
										children: "+412 leads"
									})
								]
							}), /* @__PURE__ */ jsxs("div", {
								className: "rounded-xl border bg-background p-3",
								children: [
									/* @__PURE__ */ jsx("div", {
										className: "text-[10px] font-semibold text-muted-foreground",
										children: "Conversion"
									}),
									/* @__PURE__ */ jsx("div", {
										className: "mt-0.5 text-xs font-bold",
										children: "22.4%"
									}),
									/* @__PURE__ */ jsx("div", {
										className: "mt-1 text-[10px] text-emerald-600",
										children: "▲ 3.1%"
									})
								]
							})]
						})
					]
				})]
			})]
		})]
	});
}
function Logos() {
	return /* @__PURE__ */ jsx("section", {
		className: "border-y bg-muted/30",
		children: /* @__PURE__ */ jsxs("div", {
			className: "mx-auto max-w-7xl px-5 py-8 sm:px-8",
			children: [/* @__PURE__ */ jsx("p", {
				className: "text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground",
				children: "Trusted by 12,000+ creators & businesses"
			}), /* @__PURE__ */ jsx("div", {
				className: "mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 opacity-70",
				children: [
					"CREATORCO",
					"FITHUB",
					"LUMEN",
					"BRIGHTLY",
					"ORBIT.AI",
					"FOUNDR"
				].map((b) => /* @__PURE__ */ jsx("span", {
					className: "text-sm font-extrabold tracking-widest text-muted-foreground",
					children: b
				}, b))
			})]
		})
	});
}
function HowItWorks() {
	return /* @__PURE__ */ jsxs("section", {
		id: "how",
		className: "mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "mx-auto max-w-2xl text-center",
			children: [/* @__PURE__ */ jsx("h2", {
				className: "text-3xl font-extrabold tracking-tight sm:text-5xl",
				children: "From comment to customer in 4 steps"
			}), /* @__PURE__ */ jsx("p", {
				className: "mt-3 text-muted-foreground",
				children: "Set up your first automation in under 2 minutes."
			})]
		}), /* @__PURE__ */ jsx("div", {
			className: "mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
			children: [
				{
					n: "01",
					title: "Connect Instagram",
					desc: "Securely link your business or creator account in seconds.",
					icon: Instagram
				},
				{
					n: "02",
					title: "Create a campaign",
					desc: "Pick a goal, pick a post, write a message. Done.",
					icon: Sparkles
				},
				{
					n: "03",
					title: "Get comments",
					desc: "People comment your keyword on Reels, posts, or Stories.",
					icon: MessageCircle
				},
				{
					n: "04",
					title: "Send DMs automatically",
					desc: "DMOrbit replies publicly and slides into DMs instantly.",
					icon: Reply
				}
			].map((s) => /* @__PURE__ */ jsxs("div", {
				className: "group relative rounded-3xl border bg-card p-6 shadow-card transition hover:-translate-y-1 hover:shadow-pop",
				children: [
					/* @__PURE__ */ jsx("div", {
						className: "text-xs font-extrabold text-muted-foreground",
						children: s.n
					}),
					/* @__PURE__ */ jsx("div", {
						className: "mt-3 grid h-12 w-12 place-items-center rounded-2xl ig-gradient-soft",
						children: /* @__PURE__ */ jsx(s.icon, { className: "h-5 w-5" })
					}),
					/* @__PURE__ */ jsx("h3", {
						className: "mt-4 text-lg font-bold",
						children: s.title
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-1.5 text-sm text-muted-foreground",
						children: s.desc
					})
				]
			}, s.n))
		})]
	});
}
function Features() {
	return /* @__PURE__ */ jsx("section", {
		id: "features",
		className: "bg-muted/30 py-20 sm:py-28",
		children: /* @__PURE__ */ jsxs("div", {
			className: "mx-auto max-w-7xl px-5 sm:px-8",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "mx-auto max-w-2xl text-center",
				children: [/* @__PURE__ */ jsx("h2", {
					className: "text-3xl font-extrabold tracking-tight sm:text-5xl",
					children: "Everything you need to grow on Instagram"
				}), /* @__PURE__ */ jsx("p", {
					className: "mt-3 text-muted-foreground",
					children: "One simple toolkit. Built for creators, not enterprises."
				})]
			}), /* @__PURE__ */ jsx("div", {
				className: "mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
				children: [
					{
						icon: MessageCircle,
						title: "Comment → DM",
						desc: "Trigger a DM when someone comments your keyword."
					},
					{
						icon: Camera,
						title: "Story Replies",
						desc: "Auto-respond to story replies with the right resource."
					},
					{
						icon: Reply,
						title: "Comment Reply",
						desc: "Public auto-reply under every matching comment."
					},
					{
						icon: Users,
						title: "Lead Capture",
						desc: "Collect emails and names directly from DMs."
					},
					{
						icon: FileText,
						title: "PDF Delivery",
						desc: "Send guides, ebooks, and freebies in one click."
					},
					{
						icon: Link$1,
						title: "Link Delivery",
						desc: "Share any URL, product, or booking page."
					},
					{
						icon: BarChart3,
						title: "Smart Analytics",
						desc: "See your comment → lead → revenue funnel."
					},
					{
						icon: Sparkles,
						title: "Smart Bio",
						desc: "A premium link-in-bio that converts visitors."
					}
				].map((f) => /* @__PURE__ */ jsxs("div", {
					className: "rounded-3xl border bg-card p-6 shadow-card",
					children: [
						/* @__PURE__ */ jsx("div", {
							className: "grid h-11 w-11 place-items-center rounded-2xl ig-gradient text-white",
							children: /* @__PURE__ */ jsx(f.icon, { className: "h-5 w-5" })
						}),
						/* @__PURE__ */ jsx("h3", {
							className: "mt-4 font-bold",
							children: f.title
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-1.5 text-sm text-muted-foreground",
							children: f.desc
						})
					]
				}, f.title))
			})]
		})
	});
}
function Stats() {
	return /* @__PURE__ */ jsx("section", {
		className: "mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24",
		children: /* @__PURE__ */ jsx("div", {
			className: "grid gap-4 rounded-[2rem] ig-gradient p-8 text-white shadow-pop sm:grid-cols-4 sm:p-12",
			children: [
				{
					v: "12k+",
					l: "Creators & brands"
				},
				{
					v: "48M+",
					l: "DMs sent"
				},
				{
					v: "22%",
					l: "Avg. conversion"
				},
				{
					v: "4.9★",
					l: "Customer rating"
				}
			].map((s) => /* @__PURE__ */ jsxs("div", {
				className: "text-center",
				children: [/* @__PURE__ */ jsx("div", {
					className: "text-3xl font-extrabold sm:text-5xl",
					children: s.v
				}), /* @__PURE__ */ jsx("div", {
					className: "mt-1 text-xs font-semibold uppercase tracking-wider opacity-90",
					children: s.l
				})]
			}, s.l))
		})
	});
}
function Testimonials() {
	return /* @__PURE__ */ jsx("section", {
		className: "bg-muted/30 py-20 sm:py-28",
		children: /* @__PURE__ */ jsxs("div", {
			className: "mx-auto max-w-7xl px-5 sm:px-8",
			children: [/* @__PURE__ */ jsx("div", {
				className: "mx-auto max-w-2xl text-center",
				children: /* @__PURE__ */ jsx("h2", {
					className: "text-3xl font-extrabold tracking-tight sm:text-5xl",
					children: "Loved by creators worldwide"
				})
			}), /* @__PURE__ */ jsx("div", {
				className: "mt-12 grid gap-4 sm:grid-cols-3",
				children: [
					{
						name: "Sarah Lin",
						handle: "@sarah.fit",
						text: "DMOrbit replaced 3 tools for me. My PDF lead magnet now runs on autopilot.",
						role: "Fitness coach · 240k followers"
					},
					{
						name: "Marcus Reed",
						handle: "@marcuscreates",
						text: "Set up in 5 minutes. Hit 1,200 leads in the first week.",
						role: "Course creator"
					},
					{
						name: "Priya Shah",
						handle: "@priya.studio",
						text: "Finally, automation that feels native to Instagram. My audience loves it.",
						role: "Design educator"
					}
				].map((x) => /* @__PURE__ */ jsxs("div", {
					className: "rounded-3xl border bg-card p-6 shadow-card",
					children: [
						/* @__PURE__ */ jsx("div", {
							className: "flex gap-0.5",
							children: Array.from({ length: 5 }).map((_, i) => /* @__PURE__ */ jsx(Star, { className: "h-4 w-4 fill-amber-400 text-amber-400" }, i))
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "mt-4 text-sm leading-relaxed",
							children: [
								"\"",
								x.text,
								"\""
							]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-5 flex items-center gap-3",
							children: [/* @__PURE__ */ jsx("div", { className: "h-10 w-10 rounded-full ig-gradient" }), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("div", {
								className: "text-sm font-bold",
								children: [
									x.name,
									" ",
									/* @__PURE__ */ jsxs("span", {
										className: "text-muted-foreground",
										children: ["· ", x.handle]
									})
								]
							}), /* @__PURE__ */ jsx("div", {
								className: "text-xs text-muted-foreground",
								children: x.role
							})] })]
						})
					]
				}, x.name))
			})]
		})
	});
}
function Pricing() {
	return /* @__PURE__ */ jsxs("section", {
		id: "pricing",
		className: "mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "mx-auto max-w-2xl text-center",
			children: [/* @__PURE__ */ jsx("h2", {
				className: "text-3xl font-extrabold tracking-tight sm:text-5xl",
				children: "Simple pricing that scales"
			}), /* @__PURE__ */ jsx("p", {
				className: "mt-3 text-muted-foreground",
				children: "Start free. Upgrade when you outgrow it."
			})]
		}), /* @__PURE__ */ jsx("div", {
			className: "mt-12 grid gap-4 sm:grid-cols-3",
			children: [
				{
					name: "Starter",
					price: "$0",
					per: "forever",
					desc: "For creators just getting started.",
					features: [
						"1 active campaign",
						"500 DMs/month",
						"Basic analytics",
						"Comment → DM"
					],
					cta: "Start Free",
					featured: false
				},
				{
					name: "Creator",
					price: "$29",
					per: "/month",
					desc: "For serious growth.",
					features: [
						"Unlimited campaigns",
						"10,000 DMs/month",
						"Full analytics & CRM",
						"Story replies & keywords",
						"Smart Bio"
					],
					cta: "Start 14-day trial",
					featured: true
				},
				{
					name: "Business",
					price: "$99",
					per: "/month",
					desc: "For agencies and teams.",
					features: [
						"Everything in Creator",
						"Unlimited DMs",
						"5 IG accounts",
						"Team seats",
						"Priority support"
					],
					cta: "Talk to sales",
					featured: false
				}
			].map((p) => /* @__PURE__ */ jsxs("div", {
				className: `relative rounded-3xl border bg-card p-6 shadow-card sm:p-8 ${p.featured ? "ring-2 ring-foreground" : ""}`,
				children: [
					p.featured && /* @__PURE__ */ jsx("div", {
						className: "absolute -top-3 left-1/2 -translate-x-1/2 rounded-full ig-gradient px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-pop",
						children: "Most popular"
					}),
					/* @__PURE__ */ jsx("h3", {
						className: "text-lg font-bold",
						children: p.name
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-1 text-xs text-muted-foreground",
						children: p.desc
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mt-5 flex items-baseline gap-1",
						children: [/* @__PURE__ */ jsx("span", {
							className: "text-4xl font-extrabold",
							children: p.price
						}), /* @__PURE__ */ jsx("span", {
							className: "text-sm text-muted-foreground",
							children: p.per
						})]
					}),
					/* @__PURE__ */ jsx(Link, {
						to: "/signup",
						className: `mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-full px-5 py-3 text-sm font-bold transition ${p.featured ? "ig-gradient text-white shadow-pop" : "border bg-background"}`,
						children: p.cta
					}),
					/* @__PURE__ */ jsx("ul", {
						className: "mt-6 space-y-2.5",
						children: p.features.map((f) => /* @__PURE__ */ jsxs("li", {
							className: "flex items-start gap-2 text-sm",
							children: [/* @__PURE__ */ jsx(Check, { className: "mt-0.5 h-4 w-4 shrink-0 text-emerald-600" }), f]
						}, f))
					})
				]
			}, p.name))
		})]
	});
}
function FAQ() {
	const items = [
		{
			q: "Is DMOrbit safe to use with my Instagram account?",
			a: "Yes. We use Meta's official Messenger API for Instagram. No password sharing, no risk to your account."
		},
		{
			q: "Do I need a business account?",
			a: "Yes, an Instagram Business or Creator account is required to use DM automation per Meta's API."
		},
		{
			q: "Can I cancel anytime?",
			a: "Absolutely. Cancel from settings — no calls, no emails, no friction."
		},
		{
			q: "Does it work for Reels and Stories?",
			a: "Yes — comments on posts and Reels, plus story replies and DM keywords."
		},
		{
			q: "How fast does the DM go out?",
			a: "Usually within 1–3 seconds of the comment being posted."
		}
	];
	const [open, setOpen] = useState(0);
	return /* @__PURE__ */ jsx("section", {
		id: "faq",
		className: "bg-muted/30 py-20 sm:py-28",
		children: /* @__PURE__ */ jsxs("div", {
			className: "mx-auto max-w-3xl px-5 sm:px-8",
			children: [/* @__PURE__ */ jsx("div", {
				className: "text-center",
				children: /* @__PURE__ */ jsx("h2", {
					className: "text-3xl font-extrabold tracking-tight sm:text-5xl",
					children: "Questions, answered"
				})
			}), /* @__PURE__ */ jsx("div", {
				className: "mt-10 space-y-3",
				children: items.map((it, i) => /* @__PURE__ */ jsxs("div", {
					className: "rounded-2xl border bg-card shadow-card",
					children: [/* @__PURE__ */ jsxs("button", {
						onClick: () => setOpen(open === i ? null : i),
						className: "flex w-full items-center justify-between gap-4 p-5 text-left",
						children: [/* @__PURE__ */ jsx("span", {
							className: "font-semibold",
							children: it.q
						}), /* @__PURE__ */ jsx(ChevronDown, { className: `h-4 w-4 shrink-0 transition ${open === i ? "rotate-180" : ""}` })]
					}), open === i && /* @__PURE__ */ jsx("div", {
						className: "px-5 pb-5 text-sm text-muted-foreground",
						children: it.a
					})]
				}, i))
			})]
		})
	});
}
function CTA() {
	return /* @__PURE__ */ jsx("section", {
		className: "mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28",
		children: /* @__PURE__ */ jsxs("div", {
			className: "relative overflow-hidden rounded-[2rem] ig-gradient p-10 text-center text-white shadow-pop sm:p-16",
			children: [
				/* @__PURE__ */ jsx("h2", {
					className: "text-3xl font-extrabold tracking-tight sm:text-5xl",
					children: "Ready to turn comments into customers?"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mx-auto mt-3 max-w-xl text-white/90",
					children: "Join 12,000+ creators automating Instagram with DMOrbit."
				}),
				/* @__PURE__ */ jsxs(Link, {
					to: "/signup",
					className: "mt-7 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-foreground shadow-pop",
					children: ["Start Free ", /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })]
				})
			]
		})
	});
}
function Footer() {
	return /* @__PURE__ */ jsxs("footer", {
		className: "border-t bg-background",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:grid-cols-4 sm:px-8",
			children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ jsx("div", {
					className: "grid h-8 w-8 place-items-center rounded-xl ig-gradient text-white",
					children: /* @__PURE__ */ jsx(Sparkles, { className: "h-3.5 w-3.5" })
				}), /* @__PURE__ */ jsx("span", {
					className: "font-extrabold",
					children: "DMOrbit"
				})]
			}), /* @__PURE__ */ jsx("p", {
				className: "mt-3 text-sm text-muted-foreground",
				children: "Turn Instagram engagement into conversations, leads and customers."
			})] }), [
				{
					h: "Product",
					l: [
						"Features",
						"Pricing",
						"Changelog",
						"Roadmap"
					]
				},
				{
					h: "Company",
					l: [
						"About",
						"Blog",
						"Careers",
						"Contact"
					]
				},
				{
					h: "Legal",
					l: [
						"Privacy",
						"Terms",
						"Security",
						"DPA"
					]
				}
			].map((c) => /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
				className: "text-xs font-extrabold uppercase tracking-wider",
				children: c.h
			}), /* @__PURE__ */ jsx("ul", {
				className: "mt-3 space-y-2",
				children: c.l.map((x) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", {
					className: "text-sm text-muted-foreground hover:text-foreground",
					href: "#",
					children: x
				}) }, x))
			})] }, c.h))]
		}), /* @__PURE__ */ jsx("div", {
			className: "border-t",
			children: /* @__PURE__ */ jsxs("div", {
				className: "mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-5 text-xs text-muted-foreground sm:flex-row sm:px-8",
				children: [/* @__PURE__ */ jsxs("div", { children: [
					"© ",
					(/* @__PURE__ */ new Date()).getFullYear(),
					" DMOrbit, Inc."
				] }), /* @__PURE__ */ jsx("div", { children: "Made with ❤️ for creators" })]
			})
		})]
	});
}
//#endregion
export { Landing as component };
