import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { store, useStore } from "@/lib/store";
import { Plus, Megaphone, MoreHorizontal, Play, Pause, Copy, Trash2, Pencil, Search } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/api/client";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
export const Route = createFileRoute("/campaigns")({
  head: () => ({
    meta: [
      { title: "Campaigns — DMOrbit" },
      { name: "description", content: "Manage your Instagram DM campaigns." },
    ],
  }),
  component: Campaigns,
});

const typeLabels: Record<string, string> = {
  comment_dm: "COMMENT → DM",
  comment_reply: "COMMENT REPLY",
  story_reply: "STORY REPLY",
  dm_keyword: "DM KEYWORD",
};

function Campaigns() {
  const [filter, setFilter] = useState<"all" | "active" | "paused">("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest" | "triggers">("newest");
  const [campaignToDelete, setCampaignToDelete] = useState<any>(null);
  const navigate = useNavigate();
  
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v2/automations');
      return res.data.automations || res.data || [];
    }
  });

  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      await apiClient.post('/api/automations/toggle', { automationId: id, status });
    },
    onSuccess: () => {
      toast.success("Campaign status updated");
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update status");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/automations/${id}`);
    },
    onSuccess: () => {
      toast.success("Campaign deleted");
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to delete campaign");
    }
  });

  let list = campaigns.filter((c: any) => {
    if (filter !== "all" && (c.isActive ? "active" : "paused") !== filter) return false;
    if (search.trim() && !c.name?.toLowerCase().includes(search.trim().toLowerCase())) return false;
    return true;
  });

  list = list.sort((a: any, b: any) => {
    if (sort === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sort === "triggers") return (b.triggerCount || 0) - (a.triggerCount || 0);
    return 0;
  });

  return (
    <AppShell
      title="Campaigns"
      action={
        <Link
          to="/campaigns/new"
          className="inline-flex items-center gap-1.5 rounded-full ig-gradient px-3.5 py-2 text-sm font-semibold text-white shadow-pop sm:px-4"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New</span>
        </Link>
      }
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(["all", "active", "paused"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold capitalize transition ${
                filter === f ? "bg-foreground text-background" : "bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full sm:w-64 rounded-full border bg-card pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="h-9 rounded-full border bg-card px-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="triggers">Most Triggers</option>
          </select>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed bg-card/50 p-10 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl ig-gradient-soft">
            <Megaphone className="h-6 w-6" />
          </div>
          <h4 className="mt-3 text-lg font-bold">No campaigns yet</h4>
          <p className="mt-1 text-sm text-muted-foreground">Launch your first automation in 2 minutes.</p>
          <Link
            to="/campaigns/new"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full ig-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-pop"
          >
            <Plus className="h-4 w-4" /> Create Campaign
          </Link>
        </div>
      ) : (
          <>
            <div className="mt-2 mb-2 text-sm font-semibold text-muted-foreground">
              {list.length} {list.length === 1 ? 'Campaign' : 'Campaigns'}
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {list.map((c: any) => {
              const status = c.isActive ? "active" : "paused";
              return (
              <li
                key={c._id || c.id}
                onClick={() => navigate({ to: '/campaigns/$id', params: { id: c._id || c.id } })}
                className="group relative overflow-hidden rounded-3xl border bg-card p-5 shadow-card transition-all hover:shadow-pop hover:-translate-y-0.5 hover:border-primary/30 cursor-pointer"
              >
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full ig-gradient opacity-10 blur-2xl transition group-hover:opacity-20" />
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {typeLabels[c.campaignType?.toLowerCase()] || "CAMPAIGN"}
                    </div>
                    <div className="mt-1 truncate text-base font-bold">{c.name}</div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="rounded-full p-1.5 text-muted-foreground hover:bg-muted" disabled={toggleMutation.isPending || deleteMutation.isPending}>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => navigate({ to: '/campaigns/new', search: { editId: c._id || c.id } })}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                          <>
                            <DropdownMenuItem onSelect={() => toggleMutation.mutate({ id: c._id || c.id, status: c.isActive ? 'paused' : 'active' })}>
                              {c.isActive ? <><Pause className="mr-2 h-4 w-4" />Pause</> : <><Play className="mr-2 h-4 w-4" />Resume</>}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onSelect={(e) => {
                              e.preventDefault();
                              setCampaignToDelete(c);
                            }}>
                              <Trash2 className="mr-2 h-4 w-4" />Delete
                            </DropdownMenuItem>
                          </>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
  
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                      status === "active"
                        ? "bg-green-500/10 text-green-600"
                        : "bg-amber-500/10 text-amber-600"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${status === "active" ? "bg-green-500" : "bg-amber-500"}`} />
                    {status}
                  </span>
                </div>
  
                <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-4">
                  <div>
                    {/* Backend: triggerCount = total times this automation fired */}
                    <div className="text-xl font-extrabold tracking-tight">{c.triggerCount ?? 0}</div>
                    <div className="text-[11px] text-muted-foreground">Triggers</div>
                  </div>
                  <div>
                    {/* Backend does not provide conversion rate per automation */}
                    <div className="text-xl font-extrabold tracking-tight text-muted-foreground">—</div>
                    <div className="text-[11px] text-muted-foreground">Conversion</div>
                  </div>
                </div>
              </li>
            )})}
          </ul>
        </>
      )}

      <AlertDialog open={!!campaignToDelete} onOpenChange={(open) => !open && setCampaignToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{campaignToDelete?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (campaignToDelete) {
                  deleteMutation.mutate(campaignToDelete._id || campaignToDelete.id);
                  setCampaignToDelete(null);
                }
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </AppShell>
  );
}
