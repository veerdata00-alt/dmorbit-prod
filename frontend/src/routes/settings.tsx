import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Instagram, Bell, Shield, CreditCard, User, LogOut, ChevronRight } from "lucide-react";
import { store, useStore } from "@/lib/store";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — DMOrbit" }] }),
  component: Settings,
});

function Settings() {
  const navigate = useNavigate();
  const { connected, handle, user } = useStore((s) => ({ connected: s.connected, handle: s.igHandle, user: s.user }));
  const [notifs, setNotifs] = useState({ email: true, push: true, weekly: false });
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
      const res = await apiClient.patch('/api/me', { fullName, phoneNumber });
      store.setUser(res.data.user);
      toast.success("Profile updated successfully");
      setIsProfileOpen(false);
    } catch(e) {
      toast.error("Unable to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell title="Settings">
      <section className="rounded-3xl border bg-card p-5 shadow-card">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl ig-gradient text-lg font-extrabold text-white">
            {(handle?.[0] ?? user?.name?.[0] ?? user?.email?.[0] ?? "?").toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-base font-bold">{handle ? `@${handle}` : (user?.name || user?.email || 'Your Account')}</div>
            <div className="text-xs text-muted-foreground">{user?.email || ''}</div>
          </div>
        </div>
      </section>

      <Group title="Account">
        <Row icon={User} title="Profile" desc="Name, email and avatar" onClick={() => setIsProfileOpen(true)} />
        <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Profile Details</DialogTitle>
              <DialogDescription>
                Your current account information.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-2xl ig-gradient text-2xl font-extrabold text-white">
                  {(handle?.[0] ?? user?.fullName?.[0] ?? user?.name?.[0] ?? user?.email?.[0] ?? "?").toUpperCase()}
                </div>
                <div>
                  <div className="text-lg font-bold">{user?.fullName || user?.name || (user?.email ? user.email.split('@')[0] : null) || 'Your Account'}</div>
                  <div className="text-sm text-muted-foreground">{user?.email}</div>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Full Name</label>
                  <input 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Phone Number</label>
                  <input 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 234 567 8900"
                    className="w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1.5">Optional. Used for future account notifications and WhatsApp integrations.</p>
                </div>
              </div>

              <div className="mt-2 space-y-3 rounded-2xl border bg-muted/50 p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Instagram Username</span>
                  <span className="text-sm font-bold">{handle ? `@${handle}` : "Not connected"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Member Since</span>
                  <span className="text-sm font-bold">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Unknown'}
                  </span>
                </div>
              </div>

              <button 
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="mt-2 w-full rounded-xl ig-gradient py-2.5 text-sm font-bold text-white shadow-pop disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
        <Row
          icon={Instagram}
          title="Instagram Connection"
          desc={connected ? `@${handle} · Connected` : "Not connected"}
          right={
            <button
              onClick={() => {
                if (connected) {
                  store.disconnect();
                  toast("Instagram disconnected");
                  navigate({ to: "/home", replace: true });
                } else {
                  const returnUrl = encodeURIComponent(window.location.origin + '/home');
                  window.location.href = `http://localhost:3000/auth/instagram?returnTo=${returnUrl}`;
                }
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${connected ? "border" : "ig-gradient text-white"}`}
            >
              {connected ? "Disconnect" : "Connect"}
            </button>
          }
        />
      </Group>

      <Group title="Notifications">
        <Toggle label="Email notifications" desc="Lead alerts and weekly summary." checked={notifs.email} onChange={(v) => setNotifs({ ...notifs, email: v })} />
        <Toggle label="Push notifications" desc="Real-time DM activity." checked={notifs.push} onChange={(v) => setNotifs({ ...notifs, push: v })} />
        <Toggle label="Weekly digest" desc="Sunday performance recap." checked={notifs.weekly} onChange={(v) => setNotifs({ ...notifs, weekly: v })} />
      </Group>

      <Group title="More">
        <Row icon={Shield} title="Security" desc="Password and two-factor auth" />
        <Row icon={CreditCard} title="Billing" desc="Plan, credits & invoices" onClick={() => navigate({ to: "/billing" })} />
        <Row icon={Bell} title="Help & Support" desc="Docs, contact and community" />
      </Group>

      <button
        onClick={async () => { 
          try {
            await apiClient.post('/api/logout');
          } catch(e) {}
          store.reset(); 
          toast("Signed out"); 
          navigate({ to: "/login", replace: true }); 
        }}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3.5 text-sm font-semibold text-destructive"
      >
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </AppShell>
  );
}

function Group({ title, children }: any) {
  return (
    <section className="mt-5">
      <div className="px-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{title}</div>
      <div className="overflow-hidden rounded-3xl border bg-card shadow-card divide-y">{children}</div>
    </section>
  );
}

function Row({ icon: Icon, title, desc, right, onClick }: any) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-muted/30">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl ig-gradient-soft"><Icon className="h-4.5 w-4.5" /></div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{title}</div>
        <div className="truncate text-xs text-muted-foreground">{desc}</div>
      </div>
      {right ?? <ChevronRight className="h-4 w-4 text-muted-foreground" />}
    </button>
  );
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-muted/30">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <div className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "ig-gradient" : "bg-muted"}`}>
        <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${checked ? "left-[1.375rem]" : "left-0.5"}`} />
      </div>
    </button>
  );
}
