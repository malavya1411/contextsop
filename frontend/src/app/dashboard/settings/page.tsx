"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Laptop, User, Building, Save, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { createClient } from "@/utils/supabase/client";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { user, profile, organization, refresh } = useAuth();
  
  const [orgName, setOrgName] = useState("");
  const [savingOrg, setSavingOrg] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync state with organization data from context
  useEffect(() => {
    if (organization?.name) {
      setOrgName(organization.name);
    }
  }, [organization]);

  const handleSaveOrgName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.organization_id || !orgName.trim()) return;

    setSavingOrg(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("organizations")
        .update({ name: orgName.trim() })
        .eq("id", profile.organization_id);

      if (error) throw error;

      // Dynamic reload to trigger sidebar name update
      await refresh();
      setSuccessMessage("Organization details updated successfully.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      console.error("Failed to update organization:", err);
      const message = err instanceof Error ? err.message : "Failed to update organization. Please check permissions.";
      setErrorMessage(message);
    } finally {
      setSavingOrg(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 pb-16">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Manage your personal profile, organization settings, and workspace preferences.
        </p>
      </div>

      {/* Alert Notifications */}
      {successMessage && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {errorMessage}
        </div>
      )}

      {/* Appearance Section */}
      <section className="bg-sidebar-bg border border-sidebar-border rounded-xl p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-sidebar-border/60">
          <Laptop className="w-5 h-5 text-accent-primary" />
          <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
        </div>

        <p className="text-sm text-text-muted">
          Customize the theme aesthetics of ContextSOP on your system.
        </p>

        <div className="grid grid-cols-3 gap-3 max-w-md">
          <button
            onClick={() => setTheme("light")}
            className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border text-sm font-medium transition-all cursor-pointer select-none ${
              mounted && theme === "light"
                ? "border-accent-primary bg-sidebar-border/80 text-accent-primary"
                : "border-sidebar-border bg-sidebar-bg/50 hover:bg-sidebar-border/50 text-text-muted hover:text-foreground"
            }`}
          >
            <Sun className="w-4 h-4 shrink-0" />
            <span>Light</span>
          </button>

          <button
            onClick={() => setTheme("dark")}
            className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border text-sm font-medium transition-all cursor-pointer select-none ${
              mounted && theme === "dark"
                ? "border-accent-primary bg-sidebar-border/80 text-accent-primary"
                : "border-sidebar-border bg-sidebar-bg/50 hover:bg-sidebar-border/50 text-text-muted hover:text-foreground"
            }`}
          >
            <Moon className="w-4 h-4 shrink-0" />
            <span>Dark</span>
          </button>

          <button
            onClick={() => setTheme("system")}
            className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border text-sm font-medium transition-all cursor-pointer select-none ${
              mounted && theme === "system"
                ? "border-accent-primary bg-sidebar-border/80 text-accent-primary"
                : "border-sidebar-border bg-sidebar-bg/50 hover:bg-sidebar-border/50 text-text-muted hover:text-foreground"
            }`}
          >
            <Laptop className="w-4 h-4 shrink-0" />
            <span>System</span>
          </button>
        </div>
      </section>

      {/* User Profile Section */}
      <section className="bg-sidebar-bg border border-sidebar-border rounded-xl p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-sidebar-border/60">
          <User className="w-5 h-5 text-accent-primary" />
          <h2 className="text-lg font-semibold text-foreground">User Profile</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="text"
              disabled
              value={user?.email || "loading..."}
              className="w-full bg-[#07111f]/60 border border-sidebar-border rounded-xl px-4 py-3 text-sm text-text-muted outline-none select-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Workspace Role
            </label>
            <div className="bg-[#07111f]/60 border border-sidebar-border rounded-xl px-4 py-3 text-sm text-text-muted font-mono capitalize">
              {profile?.role || "loading..."}
            </div>
          </div>
        </div>
      </section>

      {/* Organization Section */}
      <section className="bg-sidebar-bg border border-sidebar-border rounded-xl p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-sidebar-border/60">
          <Building className="w-5 h-5 text-accent-primary" />
          <h2 className="text-lg font-semibold text-foreground">Organization Settings</h2>
        </div>

        <form onSubmit={handleSaveOrgName} className="space-y-4 max-w-3xl">
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Organization Name
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Enter organization name"
                className="w-full bg-sidebar-bg border border-sidebar-border rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:border-accent-primary/60"
              />
              <button
                type="submit"
                disabled={savingOrg || !orgName.trim() || orgName.trim() === organization?.name}
                className="flex items-center justify-center gap-2 bg-accent-primary hover:bg-[#cbb8ff] disabled:bg-sidebar-border disabled:text-text-muted disabled:cursor-not-allowed text-slate-950 font-semibold px-6 py-3 rounded-xl text-sm transition-all cursor-pointer select-none shrink-0"
              >
                {savingOrg ? (
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                ) : (
                  <Save className="w-4 h-4 shrink-0" />
                )}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
