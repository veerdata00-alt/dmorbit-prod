import { t as apiClient } from "./client-CDls2Pz7.js";
import { t as Route } from "./campaigns_._id-B8sRamD5.js";
import { t as AppShell } from "./AppShell-Yy6EdzMu.js";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, t as Dialog } from "./dialog-gKu1QSPo.js";
import { useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Activity, AlertTriangle, ArrowLeft, BarChart, CheckCircle, Clock, Download, Edit2, Megaphone, MessageCircle, Pause, Play, Send, Settings, Target, Trash2 } from "lucide-react";
//#region src/routes/campaigns_.$id.tsx?tsr-split=component
var InlineEditModal = ({ title, isOpen, onOpenChange, children, onSave, isSaving }) => {
	return /* @__PURE__ */ jsx(Dialog, {
		open: isOpen,
		onOpenChange,
		children: /* @__PURE__ */ jsxs(DialogContent, {
			className: "sm:max-w-[425px]",
			children: [
				/* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: title }) }),
				/* @__PURE__ */ jsx("div", {
					className: "py-4",
					children
				}),
				/* @__PURE__ */ jsxs(DialogFooter, { children: [/* @__PURE__ */ jsx("button", {
					onClick: () => onOpenChange(false),
					className: "rounded-full px-4 py-2 text-sm font-semibold hover:bg-muted transition",
					children: "Cancel"
				}), /* @__PURE__ */ jsx("button", {
					onClick: onSave,
					disabled: isSaving,
					className: "rounded-full ig-gradient px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50",
					children: isSaving ? "Saving..." : "Save Changes"
				})] })
			]
		})
	});
};
function CampaignDetail() {
	const { id } = Route.useParams();
	const router = useRouter();
	const queryClient = useQueryClient();
	const [editModals, setEditModals] = useState({
		targeting: false,
		keywords: false,
		publicReply: false,
		dmMessage: false
	});
	const [editForm, setEditForm] = useState({});
	const { data, isLoading } = useQuery({
		queryKey: ["campaign", id],
		queryFn: async () => {
			return (await apiClient.get(`/api/v2/automations/${id}`)).data;
		}
	});
	const updateMutation = useMutation({
		mutationFn: async (payload) => {
			await apiClient.put(`/api/v2/automations/${id}`, payload);
		},
		onSuccess: () => {
			toast.success("Campaign updated successfully");
			queryClient.invalidateQueries({ queryKey: ["campaign", id] });
			setEditModals({
				targeting: false,
				keywords: false,
				publicReply: false,
				dmMessage: false
			});
		},
		onError: (err) => {
			toast.error(err.response?.data?.error || "Failed to update campaign");
		}
	});
	const toggleMutation = useMutation({
		mutationFn: async (status) => {
			await apiClient.post("/api/automations/toggle", {
				automationId: id,
				status
			});
		},
		onSuccess: () => {
			toast.success("Status updated");
			queryClient.invalidateQueries({ queryKey: ["campaign", id] });
		}
	});
	const deleteMutation = useMutation({
		mutationFn: async () => {
			await apiClient.delete(`/api/automations/${id}`);
		},
		onSuccess: () => {
			toast.success("Campaign deleted");
			router.navigate({ to: "/campaigns" });
		}
	});
	if (isLoading) return /* @__PURE__ */ jsx(AppShell, {
		title: "Loading...",
		children: /* @__PURE__ */ jsx("div", {
			className: "flex h-64 items-center justify-center",
			children: /* @__PURE__ */ jsx("div", { className: "h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" })
		})
	});
	if (!data?.automation) return /* @__PURE__ */ jsx(AppShell, {
		title: "Not Found",
		children: /* @__PURE__ */ jsx("div", {
			className: "text-center mt-10",
			children: "Campaign not found"
		})
	});
	const campaign = data.automation;
	const status = campaign.isActive ? "active" : "paused";
	const openEdit = (section) => {
		setEditForm({
			keywords: campaign.trigger?.keywords?.join(", ") || "",
			publicReply: campaign.publicReplyText || "",
			dmMessage: campaign.actions?.[0]?.text || campaign.privateMessageText || "",
			targetType: campaign.target?.type || "global"
		});
		setEditModals((prev) => ({
			...prev,
			[section]: true
		}));
	};
	const handlePrint = () => {
		window.print();
	};
	return /* @__PURE__ */ jsxs(AppShell, {
		title: /* @__PURE__ */ jsxs("div", {
			className: "flex items-center gap-2 print:hidden",
			children: [/* @__PURE__ */ jsx(Link, {
				to: "/campaigns",
				className: "rounded-full hover:bg-muted p-1",
				children: /* @__PURE__ */ jsx(ArrowLeft, { className: "h-5 w-5" })
			}), /* @__PURE__ */ jsx("span", {
				className: "truncate max-w-[200px] sm:max-w-md",
				children: campaign.name
			})]
		}),
		action: /* @__PURE__ */ jsxs("div", {
			className: "flex items-center gap-2 print:hidden",
			children: [/* @__PURE__ */ jsxs("button", {
				onClick: handlePrint,
				className: "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold hover:bg-muted transition",
				children: [
					/* @__PURE__ */ jsx(Download, { className: "h-4 w-4" }),
					" ",
					/* @__PURE__ */ jsx("span", {
						className: "hidden sm:inline",
						children: "Export PDF"
					})
				]
			}), /* @__PURE__ */ jsx("button", {
				onClick: () => toggleMutation.mutate(campaign.isActive ? "paused" : "active"),
				className: "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold hover:bg-muted transition",
				disabled: toggleMutation.isPending,
				children: campaign.isActive ? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(Pause, { className: "h-4 w-4" }), " Pause"] }) : /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(Play, { className: "h-4 w-4" }), " Resume"] })
			})]
		}),
		children: [
			/* @__PURE__ */ jsx("style", { children: `
        @media print {
          nav, aside, header { display: none !important; }
          main { padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
          .print-hidden { display: none !important; }
          .print-full { width: 100% !important; border: 1px solid #e2e8f0; break-inside: avoid; }
        }
      ` }),
			/* @__PURE__ */ jsxs("div", {
				className: "space-y-6 pb-20",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "rounded-3xl border bg-card p-6 shadow-sm print-full relative overflow-hidden",
						children: [/* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full ig-gradient opacity-10 blur-2xl" }), /* @__PURE__ */ jsxs("div", {
							className: "flex justify-between items-start",
							children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("div", {
								className: "flex items-center gap-3",
								children: [/* @__PURE__ */ jsx("h1", {
									className: "text-2xl font-bold",
									children: campaign.name
								}), /* @__PURE__ */ jsx("span", {
									className: `px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${status === "active" ? "bg-green-500/10 text-green-600" : status === "paused" ? "bg-amber-500/10 text-amber-600" : "bg-gray-500/10 text-gray-600"}`,
									children: status
								})]
							}), /* @__PURE__ */ jsxs("div", {
								className: "mt-2 text-sm text-muted-foreground flex items-center gap-4",
								children: [
									/* @__PURE__ */ jsxs("span", {
										className: "flex items-center gap-1",
										children: [
											/* @__PURE__ */ jsx(Settings, { className: "h-3.5 w-3.5" }),
											" Type: ",
											campaign.campaignType || "DM"
										]
									}),
									/* @__PURE__ */ jsxs("span", {
										className: "flex items-center gap-1",
										children: [
											/* @__PURE__ */ jsx(Target, { className: "h-3.5 w-3.5" }),
											" Goal: ",
											campaign.templateType || "Unknown"
										]
									}),
									/* @__PURE__ */ jsxs("span", {
										className: "flex items-center gap-1",
										children: [
											/* @__PURE__ */ jsx(Clock, { className: "h-3.5 w-3.5" }),
											" Created: ",
											new Date(campaign.createdAt).toLocaleDateString()
										]
									})
								]
							})] }), /* @__PURE__ */ jsx("div", {
								className: "print-hidden",
								children: /* @__PURE__ */ jsx("button", {
									onClick: () => deleteMutation.mutate(),
									className: "p-2 rounded-full text-muted-foreground hover:bg-red-50 hover:text-red-600 transition",
									title: "Delete Campaign",
									children: /* @__PURE__ */ jsx(Trash2, { className: "h-5 w-5" })
								})
							})]
						})]
					}),
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("h3", {
						className: "text-lg font-bold mb-3 flex items-center gap-2",
						children: [/* @__PURE__ */ jsx(BarChart, { className: "h-5 w-5" }), " Funnel Performance"]
					}), /* @__PURE__ */ jsxs("div", {
						className: "grid grid-cols-1 sm:grid-cols-4 gap-4",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "rounded-2xl border bg-card p-4 shadow-sm print-full text-center relative",
								children: [
									/* @__PURE__ */ jsx("div", {
										className: "text-3xl font-black",
										children: campaign.triggerCount || 0
									}),
									/* @__PURE__ */ jsx("div", {
										className: "text-xs uppercase tracking-wider text-muted-foreground mt-1",
										children: "Triggers Processed"
									}),
									campaign.triggerCount > 0 && /* @__PURE__ */ jsx("div", {
										className: "absolute -right-3 top-1/2 -translate-y-1/2 z-10 hidden sm:block bg-muted text-[10px] px-1.5 py-0.5 rounded font-bold border",
										children: "100%"
									})
								]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "rounded-2xl border bg-card p-4 shadow-sm print-full text-center relative",
								children: [
									/* @__PURE__ */ jsx("div", {
										className: "text-3xl font-black text-blue-600",
										children: campaign.completedFlows || 0
									}),
									/* @__PURE__ */ jsx("div", {
										className: "text-xs uppercase tracking-wider text-blue-600/70 mt-1",
										children: "Completed Flows"
									}),
									campaign.triggerCount > 0 && /* @__PURE__ */ jsxs("div", {
										className: "absolute -right-3 top-1/2 -translate-y-1/2 z-10 hidden sm:block bg-muted text-[10px] px-1.5 py-0.5 rounded font-bold border",
										children: [Math.round((campaign.completedFlows || 0) / campaign.triggerCount * 100), "%"]
									})
								]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "rounded-2xl border bg-card p-4 shadow-sm print-full text-center relative",
								children: [
									/* @__PURE__ */ jsx("div", {
										className: "text-3xl font-black text-purple-600",
										children: campaign.capturePageViews || 0
									}),
									/* @__PURE__ */ jsx("div", {
										className: "text-xs uppercase tracking-wider text-purple-600/70 mt-1",
										children: "Capture Page Views"
									}),
									campaign.completedFlows > 0 && /* @__PURE__ */ jsxs("div", {
										className: "absolute -right-3 top-1/2 -translate-y-1/2 z-10 hidden sm:block bg-muted text-[10px] px-1.5 py-0.5 rounded font-bold border",
										children: [Math.round((campaign.capturePageViews || 0) / campaign.completedFlows * 100), "%"]
									})
								]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "rounded-2xl border bg-card p-4 shadow-sm print-full text-center relative",
								children: [
									/* @__PURE__ */ jsx("div", {
										className: "text-3xl font-black text-green-600",
										children: campaign.leadsCount || 0
									}),
									/* @__PURE__ */ jsx("div", {
										className: "text-xs uppercase tracking-wider text-green-600/70 mt-1",
										children: "Leads Captured"
									}),
									campaign.triggerCount > 0 && /* @__PURE__ */ jsxs("div", {
										className: "absolute top-2 right-2 z-10 bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded font-bold",
										children: [Math.round((campaign.leadsCount || 0) / campaign.triggerCount * 100), "% Overall"]
									})
								]
							})
						]
					})] }),
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("h3", {
						className: "text-lg font-bold mb-3 flex items-center gap-2",
						children: [/* @__PURE__ */ jsx(Send, { className: "h-5 w-5" }), " Delivery Health"]
					}), /* @__PURE__ */ jsxs("div", {
						className: "grid grid-cols-2 sm:grid-cols-4 gap-4",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "rounded-2xl border bg-card p-4 shadow-sm print-full",
								children: [/* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-2 text-sm font-semibold text-muted-foreground",
									children: [/* @__PURE__ */ jsx(CheckCircle, { className: "h-4 w-4 text-green-500" }), " DMs Delivered"]
								}), /* @__PURE__ */ jsx("div", {
									className: "text-2xl font-bold mt-2",
									children: campaign.dmCount || 0
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "rounded-2xl border bg-card p-4 shadow-sm print-full",
								children: [/* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-2 text-sm font-semibold text-muted-foreground",
									children: [/* @__PURE__ */ jsx(AlertTriangle, { className: "h-4 w-4 text-red-500" }), " Failed DMs"]
								}), /* @__PURE__ */ jsx("div", {
									className: "text-2xl font-bold mt-2 text-red-600",
									children: campaign.failedDmCount || 0
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "rounded-2xl border bg-card p-4 shadow-sm print-full",
								children: [/* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-2 text-sm font-semibold text-muted-foreground",
									children: [/* @__PURE__ */ jsx(Clock, { className: "h-4 w-4 text-amber-500" }), " Pending Jobs"]
								}), /* @__PURE__ */ jsx("div", {
									className: "text-2xl font-bold mt-2 text-amber-600",
									children: campaign.pendingDmCount || 0
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "rounded-2xl border bg-card p-4 shadow-sm print-full",
								children: [/* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-2 text-sm font-semibold text-muted-foreground",
									children: [/* @__PURE__ */ jsx(Activity, { className: "h-4 w-4 text-blue-500" }), " Delivery Rate"]
								}), /* @__PURE__ */ jsxs("div", {
									className: "text-2xl font-bold mt-2 text-blue-600",
									children: [(campaign.dmCount || 0) > 0 || (campaign.failedDmCount || 0) > 0 ? Math.round(campaign.dmCount / (campaign.dmCount + campaign.failedDmCount) * 100) : 0, "%"]
								})]
							})
						]
					})] }),
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("h3", {
						className: "text-lg font-bold mb-3 flex items-center gap-2",
						children: [/* @__PURE__ */ jsx(Clock, { className: "h-5 w-5" }), " Activity Timeline"]
					}), /* @__PURE__ */ jsxs("div", {
						className: "grid grid-cols-1 sm:grid-cols-4 gap-4",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "rounded-2xl border bg-card p-4 shadow-sm print-full text-center",
								children: [/* @__PURE__ */ jsx("div", {
									className: "text-xs font-bold uppercase text-muted-foreground mb-1",
									children: "Last Trigger"
								}), /* @__PURE__ */ jsx("div", {
									className: "text-sm",
									children: campaign.lastTriggerTime ? new Date(campaign.lastTriggerTime).toLocaleString() : "-"
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "rounded-2xl border bg-card p-4 shadow-sm print-full text-center",
								children: [/* @__PURE__ */ jsx("div", {
									className: "text-xs font-bold uppercase text-muted-foreground mb-1",
									children: "Last DM Sent"
								}), /* @__PURE__ */ jsx("div", {
									className: "text-sm",
									children: campaign.lastDmSentTime ? new Date(campaign.lastDmSentTime).toLocaleString() : "-"
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "rounded-2xl border bg-card p-4 shadow-sm print-full text-center",
								children: [/* @__PURE__ */ jsx("div", {
									className: "text-xs font-bold uppercase text-muted-foreground mb-1",
									children: "Last Lead"
								}), /* @__PURE__ */ jsx("div", {
									className: "text-sm",
									children: campaign.lastLeadCapturedTime ? new Date(campaign.lastLeadCapturedTime).toLocaleString() : "-"
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "rounded-2xl border bg-card p-4 shadow-sm print-full text-center",
								children: [/* @__PURE__ */ jsx("div", {
									className: "text-xs font-bold uppercase text-muted-foreground mb-1",
									children: "Last Failure"
								}), /* @__PURE__ */ jsx("div", {
									className: "text-sm text-red-600",
									children: campaign.lastFailedDmTime ? new Date(campaign.lastFailedDmTime).toLocaleString() : "-"
								})]
							})
						]
					})] }),
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("h3", {
						className: "text-lg font-bold mb-3 flex items-center gap-2",
						children: [/* @__PURE__ */ jsx(Settings, { className: "h-5 w-5" }), " Configuration"]
					}), /* @__PURE__ */ jsxs("div", {
						className: "grid md:grid-cols-2 gap-4",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "rounded-2xl border bg-card p-5 shadow-sm print-full group relative",
								children: [
									/* @__PURE__ */ jsx("button", {
										onClick: () => openEdit("targeting"),
										className: "absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted text-muted-foreground print-hidden opacity-0 group-hover:opacity-100 transition",
										children: /* @__PURE__ */ jsx(Edit2, { className: "h-4 w-4" })
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "flex items-center gap-2 mb-3 text-sm font-bold uppercase text-muted-foreground",
										children: [/* @__PURE__ */ jsx(Megaphone, { className: "h-4 w-4" }), " Targeting"]
									}),
									/* @__PURE__ */ jsx("div", {
										className: "font-semibold",
										children: campaign.target?.type === "global" || campaign.target?.type === "any" ? "Any Post" : campaign.target?.type === "multiple" ? "Multiple Posts" : "Specific Post"
									}),
									/* @__PURE__ */ jsx("div", {
										className: "text-sm text-muted-foreground mt-1",
										children: campaign.target?.mediaIds?.length > 0 ? `${campaign.target.mediaIds.length} media items selected` : "Applies to all posts."
									})
								]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "rounded-2xl border bg-card p-5 shadow-sm print-full group relative",
								children: [
									/* @__PURE__ */ jsx("button", {
										onClick: () => openEdit("keywords"),
										className: "absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted text-muted-foreground print-hidden opacity-0 group-hover:opacity-100 transition",
										children: /* @__PURE__ */ jsx(Edit2, { className: "h-4 w-4" })
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "flex items-center gap-2 mb-3 text-sm font-bold uppercase text-muted-foreground",
										children: [/* @__PURE__ */ jsx(Target, { className: "h-4 w-4" }), " Keywords"]
									}),
									campaign.trigger?.keywords?.length > 0 ? /* @__PURE__ */ jsx("div", {
										className: "flex flex-wrap gap-1.5 mt-2",
										children: campaign.trigger.keywords.map((k) => /* @__PURE__ */ jsx("span", {
											className: "px-2 py-0.5 rounded-full border bg-muted/50 text-xs font-semibold",
											children: k
										}, k))
									}) : /* @__PURE__ */ jsx("div", {
										className: "text-sm text-muted-foreground italic",
										children: "Any Comment"
									})
								]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "rounded-2xl border bg-card p-5 shadow-sm print-full group relative",
								children: [
									/* @__PURE__ */ jsx("button", {
										onClick: () => openEdit("publicReply"),
										className: "absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted text-muted-foreground print-hidden opacity-0 group-hover:opacity-100 transition",
										children: /* @__PURE__ */ jsx(Edit2, { className: "h-4 w-4" })
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "flex items-center gap-2 mb-3 text-sm font-bold uppercase text-muted-foreground",
										children: [/* @__PURE__ */ jsx(MessageCircle, { className: "h-4 w-4" }), " Public Reply"]
									}),
									/* @__PURE__ */ jsx("div", {
										className: "text-sm whitespace-pre-wrap",
										children: campaign.publicReplyText || /* @__PURE__ */ jsx("span", {
											className: "italic text-muted-foreground",
											children: "Not configured"
										})
									})
								]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "rounded-2xl border bg-card p-5 shadow-sm print-full group relative",
								children: [
									/* @__PURE__ */ jsx("button", {
										onClick: () => openEdit("dmMessage"),
										className: "absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted text-muted-foreground print-hidden opacity-0 group-hover:opacity-100 transition",
										children: /* @__PURE__ */ jsx(Edit2, { className: "h-4 w-4" })
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "flex items-center gap-2 mb-3 text-sm font-bold uppercase text-muted-foreground",
										children: [/* @__PURE__ */ jsx(MessageCircle, {
											className: "h-4 w-4",
											fill: "currentColor",
											fillOpacity: .2
										}), " DM Message"]
									}),
									/* @__PURE__ */ jsx("div", {
										className: "text-sm whitespace-pre-wrap",
										children: campaign.actions?.[0]?.text || campaign.privateMessageText || /* @__PURE__ */ jsx("span", {
											className: "italic text-muted-foreground",
											children: "Not configured"
										})
									})
								]
							})
						]
					})] })
				]
			}),
			/* @__PURE__ */ jsx(InlineEditModal, {
				title: "Edit Targeting",
				isOpen: editModals.targeting,
				onOpenChange: (v) => setEditModals((prev) => ({
					...prev,
					targeting: v
				})),
				onSave: () => updateMutation.mutate({ target: { type: editForm.targetType } }),
				isSaving: updateMutation.isPending,
				children: /* @__PURE__ */ jsxs("div", {
					className: "space-y-4",
					children: [/* @__PURE__ */ jsxs("select", {
						className: "w-full rounded-xl border bg-background px-4 py-2.5 text-sm",
						value: editForm.targetType,
						onChange: (e) => setEditForm({
							...editForm,
							targetType: e.target.value
						}),
						children: [
							/* @__PURE__ */ jsx("option", {
								value: "global",
								children: "Any Post"
							}),
							/* @__PURE__ */ jsx("option", {
								value: "specific",
								children: "Specific Post"
							}),
							/* @__PURE__ */ jsx("option", {
								value: "multiple",
								children: "Multiple Posts"
							})
						]
					}), /* @__PURE__ */ jsx("p", {
						className: "text-xs text-muted-foreground",
						children: "Note: To change specific media items, please use the main edit wizard."
					})]
				})
			}),
			/* @__PURE__ */ jsx(InlineEditModal, {
				title: "Edit Keywords",
				isOpen: editModals.keywords,
				onOpenChange: (v) => setEditModals((prev) => ({
					...prev,
					keywords: v
				})),
				onSave: () => {
					const keys = editForm.keywords.split(",").map((k) => k.trim().toLowerCase()).filter(Boolean);
					updateMutation.mutate({
						keywords: keys,
						mode: keys.length ? "keyword" : "any_comment"
					});
				},
				isSaving: updateMutation.isPending,
				children: /* @__PURE__ */ jsxs("div", {
					className: "space-y-2",
					children: [/* @__PURE__ */ jsx("label", {
						className: "text-xs font-bold uppercase text-muted-foreground",
						children: "Keywords (comma separated)"
					}), /* @__PURE__ */ jsx("input", {
						type: "text",
						className: "w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50",
						value: editForm.keywords,
						onChange: (e) => setEditForm({
							...editForm,
							keywords: e.target.value
						}),
						placeholder: "e.g. DM, INFO, LINK"
					})]
				})
			}),
			/* @__PURE__ */ jsx(InlineEditModal, {
				title: "Edit Public Reply",
				isOpen: editModals.publicReply,
				onOpenChange: (v) => setEditModals((prev) => ({
					...prev,
					publicReply: v
				})),
				onSave: () => updateMutation.mutate({ publicReplyText: editForm.publicReply }),
				isSaving: updateMutation.isPending,
				children: /* @__PURE__ */ jsx("div", {
					className: "space-y-2",
					children: /* @__PURE__ */ jsx("textarea", {
						className: "w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px]",
						value: editForm.publicReply,
						onChange: (e) => setEditForm({
							...editForm,
							publicReply: e.target.value
						}),
						placeholder: "Reply to the user's comment..."
					})
				})
			}),
			/* @__PURE__ */ jsx(InlineEditModal, {
				title: "Edit DM Message",
				isOpen: editModals.dmMessage,
				onOpenChange: (v) => setEditModals((prev) => ({
					...prev,
					dmMessage: v
				})),
				onSave: () => updateMutation.mutate({ dmMessage: editForm.dmMessage }),
				isSaving: updateMutation.isPending,
				children: /* @__PURE__ */ jsx("div", {
					className: "space-y-2",
					children: /* @__PURE__ */ jsx("textarea", {
						className: "w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 min-h-[150px]",
						value: editForm.dmMessage,
						onChange: (e) => setEditForm({
							...editForm,
							dmMessage: e.target.value
						}),
						placeholder: "The message to send in DMs..."
					})
				})
			})
		]
	});
}
//#endregion
export { CampaignDetail as component };
