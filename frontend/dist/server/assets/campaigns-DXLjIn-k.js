import { t as apiClient } from "./client-CDls2Pz7.js";
import { n as cn, t as AppShell } from "./AppShell-Yy6EdzMu.js";
import * as React from "react";
import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, ChevronRight, Circle, Megaphone, MoreHorizontal, Pause, Pencil, Play, Plus, Search, Trash2 } from "lucide-react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
//#region src/components/ui/dropdown-menu.tsx
var DropdownMenu = DropdownMenuPrimitive.Root;
var DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
var DropdownMenuSubTrigger = React.forwardRef(({ className, inset, children, ...props }, ref) => /* @__PURE__ */ jsxs(DropdownMenuPrimitive.SubTrigger, {
	ref,
	className: cn("flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", inset && "pl-8", className),
	...props,
	children: [children, /* @__PURE__ */ jsx(ChevronRight, { className: "ml-auto" })]
}));
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;
var DropdownMenuSubContent = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(DropdownMenuPrimitive.SubContent, {
	ref,
	className: cn("z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-dropdown-menu-content-transform-origin]", className),
	...props
}));
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;
var DropdownMenuContent = React.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsx(DropdownMenuPrimitive.Portal, { children: /* @__PURE__ */ jsx(DropdownMenuPrimitive.Content, {
	ref,
	sideOffset,
	className: cn("z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md", "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-dropdown-menu-content-transform-origin]", className),
	...props
}) }));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;
var DropdownMenuItem = React.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ jsx(DropdownMenuPrimitive.Item, {
	ref,
	className: cn("relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0", inset && "pl-8", className),
	...props
}));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;
var DropdownMenuCheckboxItem = React.forwardRef(({ className, children, checked, ...props }, ref) => /* @__PURE__ */ jsxs(DropdownMenuPrimitive.CheckboxItem, {
	ref,
	className: cn("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
	checked,
	...props,
	children: [/* @__PURE__ */ jsx("span", {
		className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
		children: /* @__PURE__ */ jsx(DropdownMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }) })
	}), children]
}));
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;
var DropdownMenuRadioItem = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(DropdownMenuPrimitive.RadioItem, {
	ref,
	className: cn("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
	...props,
	children: [/* @__PURE__ */ jsx("span", {
		className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
		children: /* @__PURE__ */ jsx(DropdownMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(Circle, { className: "h-2 w-2 fill-current" }) })
	}), children]
}));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;
var DropdownMenuLabel = React.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ jsx(DropdownMenuPrimitive.Label, {
	ref,
	className: cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className),
	...props
}));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;
var DropdownMenuSeparator = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(DropdownMenuPrimitive.Separator, {
	ref,
	className: cn("-mx-1 my-1 h-px bg-muted", className),
	...props
}));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;
var DropdownMenuShortcut = ({ className, ...props }) => {
	return /* @__PURE__ */ jsx("span", {
		className: cn("ml-auto text-xs tracking-widest opacity-60", className),
		...props
	});
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";
//#endregion
//#region src/components/ui/button.tsx
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
			destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
			outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
			secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
			ghost: "hover:bg-accent hover:text-accent-foreground",
			link: "text-primary underline-offset-4 hover:underline"
		},
		size: {
			default: "h-9 px-4 py-2",
			sm: "h-8 rounded-md px-3 text-xs",
			lg: "h-10 rounded-md px-8",
			icon: "h-9 w-9"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	return /* @__PURE__ */ jsx(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		ref,
		...props
	});
});
Button.displayName = "Button";
//#endregion
//#region src/components/ui/alert-dialog.tsx
var AlertDialog = AlertDialogPrimitive.Root;
var AlertDialogPortal = AlertDialogPrimitive.Portal;
var AlertDialogOverlay = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(AlertDialogPrimitive.Overlay, {
	className: cn("fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props,
	ref
}));
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;
var AlertDialogContent = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxs(AlertDialogPortal, { children: [/* @__PURE__ */ jsx(AlertDialogOverlay, {}), /* @__PURE__ */ jsx(AlertDialogPrimitive.Content, {
	ref,
	className: cn("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg", className),
	...props
})] }));
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;
var AlertDialogHeader = ({ className, ...props }) => /* @__PURE__ */ jsx("div", {
	className: cn("flex flex-col space-y-2 text-center sm:text-left", className),
	...props
});
AlertDialogHeader.displayName = "AlertDialogHeader";
var AlertDialogFooter = ({ className, ...props }) => /* @__PURE__ */ jsx("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
AlertDialogFooter.displayName = "AlertDialogFooter";
var AlertDialogTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(AlertDialogPrimitive.Title, {
	ref,
	className: cn("text-lg font-semibold", className),
	...props
}));
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;
var AlertDialogDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(AlertDialogPrimitive.Description, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;
var AlertDialogAction = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(AlertDialogPrimitive.Action, {
	ref,
	className: cn(buttonVariants(), className),
	...props
}));
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;
var AlertDialogCancel = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(AlertDialogPrimitive.Cancel, {
	ref,
	className: cn(buttonVariants({ variant: "outline" }), "mt-2 sm:mt-0", className),
	...props
}));
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;
//#endregion
//#region src/routes/campaigns.tsx?tsr-split=component
var typeLabels = {
	comment_dm: "COMMENT → DM",
	comment_reply: "COMMENT REPLY",
	story_reply: "STORY REPLY",
	dm_keyword: "DM KEYWORD"
};
function Campaigns() {
	const [filter, setFilter] = useState("all");
	const [search, setSearch] = useState("");
	const [sort, setSort] = useState("newest");
	const [campaignToDelete, setCampaignToDelete] = useState(null);
	const navigate = useNavigate();
	const { data: campaigns = [], isLoading } = useQuery({
		queryKey: ["campaigns"],
		queryFn: async () => {
			const res = await apiClient.get("/api/v2/automations");
			return res.data.automations || res.data || [];
		}
	});
	const queryClient = useQueryClient();
	const toggleMutation = useMutation({
		mutationFn: async ({ id, status }) => {
			await apiClient.post("/api/automations/toggle", {
				automationId: id,
				status
			});
		},
		onSuccess: () => {
			toast.success("Campaign status updated");
			queryClient.invalidateQueries({ queryKey: ["campaigns"] });
			queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
		},
		onError: (error) => {
			toast.error(error.response?.data?.error || "Failed to update status");
		}
	});
	const deleteMutation = useMutation({
		mutationFn: async (id) => {
			await apiClient.delete(`/api/automations/${id}`);
		},
		onSuccess: () => {
			toast.success("Campaign deleted");
			queryClient.invalidateQueries({ queryKey: ["campaigns"] });
			queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
		},
		onError: (error) => {
			toast.error(error.response?.data?.error || "Failed to delete campaign");
		}
	});
	let list = campaigns.filter((c) => {
		if (filter !== "all" && (c.isActive ? "active" : "paused") !== filter) return false;
		if (search.trim() && !c.name?.toLowerCase().includes(search.trim().toLowerCase())) return false;
		return true;
	});
	list = list.sort((a, b) => {
		if (sort === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
		if (sort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
		if (sort === "triggers") return (b.triggerCount || 0) - (a.triggerCount || 0);
		return 0;
	});
	return /* @__PURE__ */ jsxs(AppShell, {
		title: "Campaigns",
		action: /* @__PURE__ */ jsxs(Link, {
			to: "/campaigns/new",
			className: "inline-flex items-center gap-1.5 rounded-full ig-gradient px-3.5 py-2 text-sm font-semibold text-white shadow-pop sm:px-4",
			children: [/* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }), /* @__PURE__ */ jsx("span", {
				className: "hidden sm:inline",
				children: "New"
			})]
		}),
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2",
				children: [/* @__PURE__ */ jsx("div", {
					className: "flex gap-2 overflow-x-auto pb-1",
					children: [
						"all",
						"active",
						"paused"
					].map((f) => /* @__PURE__ */ jsx("button", {
						onClick: () => setFilter(f),
						className: `shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold capitalize transition ${filter === f ? "bg-foreground text-background" : "bg-card text-muted-foreground hover:text-foreground"}`,
						children: f
					}, f))
				}), /* @__PURE__ */ jsxs("div", {
					className: "flex flex-col sm:flex-row gap-2",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "relative",
						children: [/* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ jsx("input", {
							type: "text",
							placeholder: "Search campaigns...",
							value: search,
							onChange: (e) => setSearch(e.target.value),
							className: "h-9 w-full sm:w-64 rounded-full border bg-card pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/50"
						})]
					}), /* @__PURE__ */ jsxs("select", {
						value: sort,
						onChange: (e) => setSort(e.target.value),
						className: "h-9 rounded-full border bg-card px-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/50",
						children: [
							/* @__PURE__ */ jsx("option", {
								value: "newest",
								children: "Newest First"
							}),
							/* @__PURE__ */ jsx("option", {
								value: "oldest",
								children: "Oldest First"
							}),
							/* @__PURE__ */ jsx("option", {
								value: "triggers",
								children: "Most Triggers"
							})
						]
					})]
				})]
			}),
			list.length === 0 ? /* @__PURE__ */ jsxs("div", {
				className: "mt-6 rounded-3xl border border-dashed bg-card/50 p-10 text-center",
				children: [
					/* @__PURE__ */ jsx("div", {
						className: "mx-auto grid h-14 w-14 place-items-center rounded-2xl ig-gradient-soft",
						children: /* @__PURE__ */ jsx(Megaphone, { className: "h-6 w-6" })
					}),
					/* @__PURE__ */ jsx("h4", {
						className: "mt-3 text-lg font-bold",
						children: "No campaigns yet"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: "Launch your first automation in 2 minutes."
					}),
					/* @__PURE__ */ jsxs(Link, {
						to: "/campaigns/new",
						className: "mt-4 inline-flex items-center gap-1.5 rounded-full ig-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-pop",
						children: [/* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }), " Create Campaign"]
					})
				]
			}) : /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsxs("div", {
				className: "mt-2 mb-2 text-sm font-semibold text-muted-foreground",
				children: [
					list.length,
					" ",
					list.length === 1 ? "Campaign" : "Campaigns"
				]
			}), /* @__PURE__ */ jsx("ul", {
				className: "grid gap-3 sm:grid-cols-2",
				children: list.map((c) => {
					const status = c.isActive ? "active" : "paused";
					return /* @__PURE__ */ jsxs("li", {
						onClick: () => navigate({
							to: "/campaigns/$id",
							params: { id: c._id || c.id }
						}),
						className: "group relative overflow-hidden rounded-3xl border bg-card p-5 shadow-card transition-all hover:shadow-pop hover:-translate-y-0.5 hover:border-primary/30 cursor-pointer",
						children: [
							/* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full ig-gradient opacity-10 blur-2xl transition group-hover:opacity-20" }),
							/* @__PURE__ */ jsxs("div", {
								className: "flex items-start justify-between gap-2",
								children: [/* @__PURE__ */ jsxs("div", {
									className: "min-w-0",
									children: [/* @__PURE__ */ jsx("div", {
										className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground",
										children: typeLabels[c.campaignType?.toLowerCase()] || "CAMPAIGN"
									}), /* @__PURE__ */ jsx("div", {
										className: "mt-1 truncate text-base font-bold",
										children: c.name
									})]
								}), /* @__PURE__ */ jsx("div", {
									onClick: (e) => e.stopPropagation(),
									children: /* @__PURE__ */ jsxs(DropdownMenu, { children: [/* @__PURE__ */ jsx(DropdownMenuTrigger, {
										className: "rounded-full p-1.5 text-muted-foreground hover:bg-muted",
										disabled: toggleMutation.isPending || deleteMutation.isPending,
										children: /* @__PURE__ */ jsx(MoreHorizontal, { className: "h-4 w-4" })
									}), /* @__PURE__ */ jsxs(DropdownMenuContent, {
										align: "end",
										children: [/* @__PURE__ */ jsxs(DropdownMenuItem, {
											onSelect: () => navigate({
												to: "/campaigns/new",
												search: { editId: c._id || c.id }
											}),
											children: [/* @__PURE__ */ jsx(Pencil, { className: "mr-2 h-4 w-4" }), "Edit"]
										}), /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(DropdownMenuItem, {
											onSelect: () => toggleMutation.mutate({
												id: c._id || c.id,
												status: c.isActive ? "paused" : "active"
											}),
											children: c.isActive ? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(Pause, { className: "mr-2 h-4 w-4" }), "Pause"] }) : /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(Play, { className: "mr-2 h-4 w-4" }), "Resume"] })
										}), /* @__PURE__ */ jsxs(DropdownMenuItem, {
											className: "text-red-600 focus:text-red-600",
											onSelect: (e) => {
												e.preventDefault();
												setCampaignToDelete(c);
											},
											children: [/* @__PURE__ */ jsx(Trash2, { className: "mr-2 h-4 w-4" }), "Delete"]
										})] })]
									})] })
								})]
							}),
							/* @__PURE__ */ jsx("div", {
								className: "mt-3 flex items-center gap-2",
								children: /* @__PURE__ */ jsxs("span", {
									className: `inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${status === "active" ? "bg-green-500/10 text-green-600" : "bg-amber-500/10 text-amber-600"}`,
									children: [/* @__PURE__ */ jsx("span", { className: `h-1.5 w-1.5 rounded-full ${status === "active" ? "bg-green-500" : "bg-amber-500"}` }), status]
								})
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "mt-4 grid grid-cols-2 gap-3 border-t pt-4",
								children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
									className: "text-xl font-extrabold tracking-tight",
									children: c.triggerCount ?? 0
								}), /* @__PURE__ */ jsx("div", {
									className: "text-[11px] text-muted-foreground",
									children: "Triggers"
								})] }), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
									className: "text-xl font-extrabold tracking-tight text-muted-foreground",
									children: "—"
								}), /* @__PURE__ */ jsx("div", {
									className: "text-[11px] text-muted-foreground",
									children: "Conversion"
								})] })]
							})
						]
					}, c._id || c.id);
				})
			})] }),
			/* @__PURE__ */ jsx(AlertDialog, {
				open: !!campaignToDelete,
				onOpenChange: (open) => !open && setCampaignToDelete(null),
				children: /* @__PURE__ */ jsxs(AlertDialogContent, { children: [/* @__PURE__ */ jsxs(AlertDialogHeader, { children: [/* @__PURE__ */ jsx(AlertDialogTitle, { children: "Delete Campaign" }), /* @__PURE__ */ jsxs(AlertDialogDescription, { children: [
					"Are you sure you want to delete ",
					/* @__PURE__ */ jsx("strong", { children: campaignToDelete?.name }),
					"? This action cannot be undone."
				] })] }), /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [/* @__PURE__ */ jsx(AlertDialogCancel, { children: "Cancel" }), /* @__PURE__ */ jsx(AlertDialogAction, {
					onClick: () => {
						if (campaignToDelete) {
							deleteMutation.mutate(campaignToDelete._id || campaignToDelete.id);
							setCampaignToDelete(null);
						}
					},
					className: "bg-red-600 text-white hover:bg-red-700",
					children: "Delete"
				})] })] })
			})
		]
	});
}
//#endregion
export { Campaigns as component };
