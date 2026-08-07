import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { User, Mail, Lock, ArrowRight, Eye, EyeOff, Check } from "lucide-react";
import { AuthShell, Field, Divider, GoogleIcon } from "./login";
import { apiClient } from "../lib/api/client";
import { store } from "../lib/store";
import { toast } from "sonner";

import { signInWithGoogle } from "../lib/firebase";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — DMOrbit" }] }),
  component: Signup,
});

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
      
      if (data.user) {
        navigate({ to: data.user?.role === 'admin' ? "/admin" : "/home" });
      }
      toast.error(err.message || "Google Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiClient.post('/api/signup', { name, email, password });
      store.setUser(res.data.user);
      
      if (res.data.user) {
        navigate({ to: res.data.user?.role === 'admin' ? "/admin" : "/home" });
      }
      toast.error(err.response?.data?.error || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Create your account" sub="Start free. No credit card required.">
      <button type="button" onClick={handleGoogleSignup} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl border bg-card px-4 py-3 text-sm font-semibold shadow-card transition hover:bg-muted disabled:opacity-60">
        <GoogleIcon /> Sign up with Google
      </button>
      <Divider />
      <form onSubmit={submit} className="space-y-3">
        <Field icon={User} type="text" placeholder="Full name" value={name} onChange={(e: any) => setName(e.target.value)} required />
        <Field icon={Mail} type="email" placeholder="you@email.com" value={email} onChange={(e: any) => setEmail(e.target.value)} required />
        <Field
          icon={Lock}
          type={show ? "text" : "password"}
          placeholder="Create password"
          value={password}
          onChange={(e: any) => setPassword(e.target.value)}
          required
          trailing={
            <button type="button" onClick={() => setShow(!show)} className="text-muted-foreground">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />
        <ul className="space-y-1 px-1 text-xs text-muted-foreground">
          <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-600" /> 8+ characters</li>
          <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-600" /> 1 number & 1 letter</li>
        </ul>
        <button disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl ig-gradient px-4 py-3 text-sm font-bold text-white shadow-pop disabled:opacity-60">
          {loading ? "Creating account…" : <>Create account <ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account? <Link to="/login" className="font-bold text-foreground">Log in</Link>
      </p>
    </AuthShell>
  );
}
