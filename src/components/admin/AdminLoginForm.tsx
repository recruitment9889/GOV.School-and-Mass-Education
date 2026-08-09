"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        router.push("/admin/dashboard");
      } else {
        const data = await response.json();
        setError(data.message || "Invalid credentials");
      }
    } catch (err) {
      setError("An error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      {error && (
        <div className="p-3 rounded-lg bg-red-900/30 border border-red-500/50 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label className="text-sm font-medium text-zinc-300">Email Address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@example.com"
          required
          className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-zinc-100 placeholder:text-zinc-600 transition-all"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-zinc-300">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-zinc-100 placeholder:text-zinc-600 transition-all"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 px-4 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Authenticating..." : "Sign In"}
      </button>
    </form>
  );
}
