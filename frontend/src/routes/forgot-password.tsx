import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { AuthShell, Field } from "./login";
import { apiClient } from "../lib/api/client";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — DMOrbit" }] }),
  component: Forgot,
});

function Forgot() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.post('/api/forgot-password', { email });
      setSent(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Reset your password" sub="We'll email you a secure reset link.">
      {sent ? (
        <div className="rounded-2xl border bg-gradient-to-br from-emerald-500/10 to-teal-400/10 p-5 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
          <div className="mt-2 font-bold">Check your inbox</div>
          <p className="mt-1 text-sm text-muted-foreground">If an account exists, we just sent a reset link.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <Field icon={Mail} type="email" placeholder="you@email.com" value={email} onChange={(e: any) => setEmail(e.target.value)} required />
          <button disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl ig-gradient px-4 py-3 text-sm font-bold text-white shadow-pop disabled:opacity-60">
            {loading ? "Sending…" : <>Send reset link <ArrowRight className="h-4 w-4" /></>}
          </button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remembered it? <Link to="/login" className="font-bold text-foreground">Back to log in</Link>
      </p>
    </AuthShell>
  );
}
