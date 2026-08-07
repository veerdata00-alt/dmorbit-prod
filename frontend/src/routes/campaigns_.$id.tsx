import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { 
  ArrowLeft, Download, Edit2, Play, Pause, Trash2, Activity,
  Megaphone, MessageCircle, Settings, Target, BarChart, Clock, AlertTriangle, CheckCircle, Mail, Send
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

export const Route = createFileRoute("/campaigns_/$id")({
  component: CampaignDetail,
});

const InlineEditModal = ({ title, isOpen, onOpenChange, children, onSave, isSaving }: any) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {children}
        </div>
        <DialogFooter>
          <button 
            onClick={() => onOpenChange(false)}
            className="rounded-full px-4 py-2 text-sm font-semibold hover:bg-muted transition"
          >
            Cancel
          </button>
          <button 
            onClick={onSave}
            disabled={isSaving}
            className="rounded-full ig-gradient px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

function CampaignDetail() {
  const { id } = Route.useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [editModals, setEditModals] = useState({
    targeting: false,
    keywords: false,
    publicReply: false,
    dmMessage: false,
  });

  const [editForm, setEditForm] = useState<any>({});

  const { data, isLoading } = useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      const res = await apiClient.get(`/api/v2/automations/${id}`);
      return res.data;
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      await apiClient.put(`/api/v2/automations/${id}`, payload);
    },
    onSuccess: () => {
      toast.success("Campaign updated successfully");
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      setEditModals({ targeting: false, keywords: false, publicReply: false, dmMessage: false });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to update campaign");
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async (status: string) => {
      await apiClient.post('/api/automations/toggle', { automationId: id, status });
    },
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/api/automations/${id}`);
    },
    onSuccess: () => {
      toast.success("Campaign deleted");
      router.navigate({ to: '/campaigns' });
    }
  });

  if (isLoading) {
    return (
      <AppShell title="Loading...">
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </AppShell>
    );
  }

  if (!data?.automation) {
    return (
      <AppShell title="Not Found">
        <div className="text-center mt-10">Campaign not found</div>
      </AppShell>
    );
  }

  const campaign = data.automation;
  const status = campaign.isActive ? "active" : "paused";

  const openEdit = (section: keyof typeof editModals) => {
    setEditForm({
      keywords: campaign.trigger?.keywords?.join(", ") || "",
      publicReply: campaign.publicReplyText || "",
      dmMessage: campaign.actions?.[0]?.text || campaign.privateMessageText || "",
      targetType: campaign.target?.type || "global",
    });
    setEditModals(prev => ({ ...prev, [section]: true }));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppShell
      title={
        <div className="flex items-center gap-2 print:hidden">
          <Link to="/campaigns" className="rounded-full hover:bg-muted p-1">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="truncate max-w-[200px] sm:max-w-md">{campaign.name}</span>
        </div>
      }
      action={
        <div className="flex items-center gap-2 print:hidden">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold hover:bg-muted transition"
          >
            <Download className="h-4 w-4" /> <span className="hidden sm:inline">Export PDF</span>
          </button>
            <button 
              onClick={() => toggleMutation.mutate(campaign.isActive ? 'paused' : 'active')}
              className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold hover:bg-muted transition"
              disabled={toggleMutation.isPending}
            >
              {campaign.isActive ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> Resume</>}
            </button>
        </div>
      }
    >
      <style>{`
        @media print {
          nav, aside, header { display: none !important; }
          main { padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
          .print-hidden { display: none !important; }
          .print-full { width: 100% !important; border: 1px solid #e2e8f0; break-inside: avoid; }
        }
      `}</style>
      
      <div className="space-y-6 pb-20">
        
        {/* OVERVIEW BANNER */}
        <div className="rounded-3xl border bg-card p-6 shadow-sm print-full relative overflow-hidden">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full ig-gradient opacity-10 blur-2xl" />
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{campaign.name}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${status === 'active' ? 'bg-green-500/10 text-green-600' : status === 'paused' ? 'bg-amber-500/10 text-amber-600' : 'bg-gray-500/10 text-gray-600'}`}>
                  {status}
                </span>
              </div>
              <div className="mt-2 text-sm text-muted-foreground flex items-center gap-4">
                <span className="flex items-center gap-1"><Settings className="h-3.5 w-3.5" /> Type: {campaign.campaignType || 'DM'}</span>
                <span className="flex items-center gap-1"><Target className="h-3.5 w-3.5" /> Goal: {campaign.templateType || 'Unknown'}</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Created: {new Date(campaign.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="print-hidden">
                <button 
                  onClick={() => deleteMutation.mutate()}
                  className="p-2 rounded-full text-muted-foreground hover:bg-red-50 hover:text-red-600 transition"
                  title="Delete Campaign"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
            </div>
          </div>
        </div>

        {/* FUNNEL PERFORMANCE */}
        <div>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2"><BarChart className="h-5 w-5" /> Funnel Performance</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl border bg-card p-4 shadow-sm print-full text-center relative">
              <div className="text-3xl font-black">{campaign.triggerCount || 0}</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">Triggers Processed</div>
              {campaign.triggerCount > 0 && <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 hidden sm:block bg-muted text-[10px] px-1.5 py-0.5 rounded font-bold border">100%</div>}
            </div>
            <div className="rounded-2xl border bg-card p-4 shadow-sm print-full text-center relative">
              <div className="text-3xl font-black text-blue-600">{campaign.completedFlows || 0}</div>
              <div className="text-xs uppercase tracking-wider text-blue-600/70 mt-1">Completed Flows</div>
              {campaign.triggerCount > 0 && <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 hidden sm:block bg-muted text-[10px] px-1.5 py-0.5 rounded font-bold border">{Math.round(((campaign.completedFlows || 0) / campaign.triggerCount) * 100)}%</div>}
            </div>
            <div className="rounded-2xl border bg-card p-4 shadow-sm print-full text-center relative">
              <div className="text-3xl font-black text-purple-600">{campaign.capturePageViews || 0}</div>
              <div className="text-xs uppercase tracking-wider text-purple-600/70 mt-1">Capture Page Views</div>
              {campaign.completedFlows > 0 && <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 hidden sm:block bg-muted text-[10px] px-1.5 py-0.5 rounded font-bold border">{Math.round(((campaign.capturePageViews || 0) / campaign.completedFlows) * 100)}%</div>}
            </div>
            <div className="rounded-2xl border bg-card p-4 shadow-sm print-full text-center relative">
              <div className="text-3xl font-black text-green-600">{campaign.leadsCount || 0}</div>
              <div className="text-xs uppercase tracking-wider text-green-600/70 mt-1">Leads Captured</div>
              {campaign.triggerCount > 0 && <div className="absolute top-2 right-2 z-10 bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded font-bold">{Math.round(((campaign.leadsCount || 0) / campaign.triggerCount) * 100)}% Overall</div>}
            </div>
          </div>
        </div>

        {/* DELIVERY HEALTH */}
        <div>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2"><Send className="h-5 w-5" /> Delivery Health</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl border bg-card p-4 shadow-sm print-full">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"><CheckCircle className="h-4 w-4 text-green-500" /> DMs Delivered</div>
              <div className="text-2xl font-bold mt-2">{campaign.dmCount || 0}</div>
            </div>
            <div className="rounded-2xl border bg-card p-4 shadow-sm print-full">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"><AlertTriangle className="h-4 w-4 text-red-500" /> Failed DMs</div>
              <div className="text-2xl font-bold mt-2 text-red-600">{campaign.failedDmCount || 0}</div>
            </div>
            <div className="rounded-2xl border bg-card p-4 shadow-sm print-full">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"><Clock className="h-4 w-4 text-amber-500" /> Pending Jobs</div>
              <div className="text-2xl font-bold mt-2 text-amber-600">{campaign.pendingDmCount || 0}</div>
            </div>
            <div className="rounded-2xl border bg-card p-4 shadow-sm print-full">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"><Activity className="h-4 w-4 text-blue-500" /> Delivery Rate</div>
              <div className="text-2xl font-bold mt-2 text-blue-600">
                {(campaign.dmCount || 0) > 0 || (campaign.failedDmCount || 0) > 0 
                  ? Math.round((campaign.dmCount / (campaign.dmCount + campaign.failedDmCount)) * 100)
                  : 0}%
              </div>
            </div>
          </div>
        </div>

        {/* ACTIVITY TIMELINE */}
        <div>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2"><Clock className="h-5 w-5" /> Activity Timeline</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
             <div className="rounded-2xl border bg-card p-4 shadow-sm print-full text-center">
              <div className="text-xs font-bold uppercase text-muted-foreground mb-1">Last Trigger</div>
              <div className="text-sm">{campaign.lastTriggerTime ? new Date(campaign.lastTriggerTime).toLocaleString() : '-'}</div>
            </div>
             <div className="rounded-2xl border bg-card p-4 shadow-sm print-full text-center">
              <div className="text-xs font-bold uppercase text-muted-foreground mb-1">Last DM Sent</div>
              <div className="text-sm">{campaign.lastDmSentTime ? new Date(campaign.lastDmSentTime).toLocaleString() : '-'}</div>
            </div>
             <div className="rounded-2xl border bg-card p-4 shadow-sm print-full text-center">
              <div className="text-xs font-bold uppercase text-muted-foreground mb-1">Last Lead</div>
              <div className="text-sm">{campaign.lastLeadCapturedTime ? new Date(campaign.lastLeadCapturedTime).toLocaleString() : '-'}</div>
            </div>
             <div className="rounded-2xl border bg-card p-4 shadow-sm print-full text-center">
              <div className="text-xs font-bold uppercase text-muted-foreground mb-1">Last Failure</div>
              <div className="text-sm text-red-600">{campaign.lastFailedDmTime ? new Date(campaign.lastFailedDmTime).toLocaleString() : '-'}</div>
            </div>
          </div>
        </div>

        {/* CONFIGURATION CARDS */}
        <div>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2"><Settings className="h-5 w-5" /> Configuration</h3>
          <div className="grid md:grid-cols-2 gap-4">
            
            {/* Targeting */}
            <div className="rounded-2xl border bg-card p-5 shadow-sm print-full group relative">
              <button onClick={() => openEdit('targeting')} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted text-muted-foreground print-hidden opacity-0 group-hover:opacity-100 transition"><Edit2 className="h-4 w-4" /></button>
              <div className="flex items-center gap-2 mb-3 text-sm font-bold uppercase text-muted-foreground"><Megaphone className="h-4 w-4" /> Targeting</div>
              <div className="font-semibold">{campaign.target?.type === 'global' || campaign.target?.type === 'any' ? 'Any Post' : campaign.target?.type === 'multiple' ? 'Multiple Posts' : 'Specific Post'}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {campaign.target?.mediaIds?.length > 0 ? `${campaign.target.mediaIds.length} media items selected` : 'Applies to all posts.'}
              </div>
            </div>

            {/* Keywords */}
            <div className="rounded-2xl border bg-card p-5 shadow-sm print-full group relative">
              <button onClick={() => openEdit('keywords')} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted text-muted-foreground print-hidden opacity-0 group-hover:opacity-100 transition"><Edit2 className="h-4 w-4" /></button>
              <div className="flex items-center gap-2 mb-3 text-sm font-bold uppercase text-muted-foreground"><Target className="h-4 w-4" /> Keywords</div>
              {campaign.trigger?.keywords?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {campaign.trigger.keywords.map((k: string) => <span key={k} className="px-2 py-0.5 rounded-full border bg-muted/50 text-xs font-semibold">{k}</span>)}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic">Any Comment</div>
              )}
            </div>

            {/* Public Reply */}
            <div className="rounded-2xl border bg-card p-5 shadow-sm print-full group relative">
              <button onClick={() => openEdit('publicReply')} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted text-muted-foreground print-hidden opacity-0 group-hover:opacity-100 transition"><Edit2 className="h-4 w-4" /></button>
              <div className="flex items-center gap-2 mb-3 text-sm font-bold uppercase text-muted-foreground"><MessageCircle className="h-4 w-4" /> Public Reply</div>
              <div className="text-sm whitespace-pre-wrap">{campaign.publicReplyText || <span className="italic text-muted-foreground">Not configured</span>}</div>
            </div>

            {/* DM Message */}
            <div className="rounded-2xl border bg-card p-5 shadow-sm print-full group relative">
              <button onClick={() => openEdit('dmMessage')} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted text-muted-foreground print-hidden opacity-0 group-hover:opacity-100 transition"><Edit2 className="h-4 w-4" /></button>
              <div className="flex items-center gap-2 mb-3 text-sm font-bold uppercase text-muted-foreground"><MessageCircle className="h-4 w-4" fill="currentColor" fillOpacity={0.2} /> DM Message</div>
              <div className="text-sm whitespace-pre-wrap">{campaign.actions?.[0]?.text || campaign.privateMessageText || <span className="italic text-muted-foreground">Not configured</span>}</div>
            </div>

          </div>
        </div>
      </div>

      {/* MODALS */}
      <InlineEditModal 
        title="Edit Targeting" 
        isOpen={editModals.targeting} 
        onOpenChange={(v: boolean) => setEditModals(prev => ({...prev, targeting: v}))}
        onSave={() => updateMutation.mutate({ target: { type: editForm.targetType } })}
        isSaving={updateMutation.isPending}
      >
        <div className="space-y-4">
           <select 
              className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm"
              value={editForm.targetType}
              onChange={(e) => setEditForm({...editForm, targetType: e.target.value})}
           >
              <option value="global">Any Post</option>
              <option value="specific">Specific Post</option>
              <option value="multiple">Multiple Posts</option>
           </select>
           <p className="text-xs text-muted-foreground">Note: To change specific media items, please use the main edit wizard.</p>
        </div>
      </InlineEditModal>

      <InlineEditModal 
        title="Edit Keywords" 
        isOpen={editModals.keywords} 
        onOpenChange={(v: boolean) => setEditModals(prev => ({...prev, keywords: v}))}
        onSave={() => {
            const keys = editForm.keywords.split(',').map((k: string) => k.trim().toLowerCase()).filter(Boolean);
            updateMutation.mutate({ keywords: keys, mode: keys.length ? 'keyword' : 'any_comment' });
        }}
        isSaving={updateMutation.isPending}
      >
        <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground">Keywords (comma separated)</label>
            <input 
                type="text" 
                className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                value={editForm.keywords}
                onChange={(e) => setEditForm({...editForm, keywords: e.target.value})}
                placeholder="e.g. DM, INFO, LINK"
            />
        </div>
      </InlineEditModal>

      <InlineEditModal 
        title="Edit Public Reply" 
        isOpen={editModals.publicReply} 
        onOpenChange={(v: boolean) => setEditModals(prev => ({...prev, publicReply: v}))}
        onSave={() => updateMutation.mutate({ publicReplyText: editForm.publicReply })}
        isSaving={updateMutation.isPending}
      >
        <div className="space-y-2">
            <textarea 
                className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px]"
                value={editForm.publicReply}
                onChange={(e) => setEditForm({...editForm, publicReply: e.target.value})}
                placeholder="Reply to the user's comment..."
            />
        </div>
      </InlineEditModal>

      <InlineEditModal 
        title="Edit DM Message" 
        isOpen={editModals.dmMessage} 
        onOpenChange={(v: boolean) => setEditModals(prev => ({...prev, dmMessage: v}))}
        onSave={() => updateMutation.mutate({ dmMessage: editForm.dmMessage })}
        isSaving={updateMutation.isPending}
      >
        <div className="space-y-2">
            <textarea 
                className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 min-h-[150px]"
                value={editForm.dmMessage}
                onChange={(e) => setEditForm({...editForm, dmMessage: e.target.value})}
                placeholder="The message to send in DMs..."
            />
        </div>
      </InlineEditModal>

    </AppShell>
  );
}
