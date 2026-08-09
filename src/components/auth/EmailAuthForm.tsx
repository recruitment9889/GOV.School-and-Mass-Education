"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function EmailAuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (isRegister && password !== confirmPassword) {
      setError("Passwords do not match. Please check and try again.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/email-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, isRegister }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Authentication failed.");
        setLoading(false);
        return;
      }

      // Save user session locally
      if (typeof window !== "undefined") {
        localStorage.setItem("applicant_email", email);
        if (name) localStorage.setItem("applicant_name", name);
        if (data.isSubmitted) {
          localStorage.setItem("application_submitted", "true");
          if (data.applicationNo) localStorage.setItem("submitted_app_no", data.applicationNo);
        } else {
          localStorage.removeItem("application_submitted");
          localStorage.removeItem("submitted_app_no");
        }
      }

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError("An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 rounded-2xl bg-card border shadow-xl">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-3">
          <Mail className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold">{isRegister ? "Gmail Registration" : "Applicant Login"}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {isRegister ? "Register with Gmail and a password" : "Sign in with your registered Gmail & password"}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-100 dark:bg-red-950/50 border border-red-200 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegister && (
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              className="block w-full rounded-md border-border p-2.5 border outline-none focus:ring-1 focus:ring-ring sm:text-sm bg-background"
              required
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Gmail / Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@gmail.com"
            className="block w-full rounded-md border-border p-2.5 border outline-none focus:ring-1 focus:ring-ring sm:text-sm bg-background"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="block w-full rounded-md border-border p-2.5 border outline-none focus:ring-1 focus:ring-ring sm:text-sm bg-background pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isRegister && (
          <div>
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="block w-full rounded-md border-border p-2.5 border outline-none focus:ring-1 focus:ring-ring sm:text-sm bg-background"
              required
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 transition-all shadow-md mt-2"
        >
          {loading ? "Processing..." : isRegister ? "Register Account" : "Secure Login"}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="mt-6 pt-4 border-t text-center text-xs text-muted-foreground">
        {isRegister ? (
          <p>
            Already registered?{" "}
            <button onClick={() => { setIsRegister(false); setError(""); }} className="text-primary font-semibold hover:underline">
              Log in with Gmail & Password
            </button>
          </p>
        ) : (
          <p>
            New Applicant?{" "}
            <button onClick={() => { setIsRegister(true); setError(""); }} className="text-primary font-semibold hover:underline">
              Register with Gmail
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
