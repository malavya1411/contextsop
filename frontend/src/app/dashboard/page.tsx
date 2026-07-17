"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { listSops, type Sop } from "@/lib/services/db";
import { Search, FileText, Plus, Play, Calendar, ArrowRight, Loader2 } from "lucide-react";

export default function DashboardHome() {
  const { profile } = useAuth();
  const router = useRouter();
  
  const [sops, setSops] = useState<Sop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadSops() {
      if (!profile?.organization_id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const data = await listSops(profile.organization_id);
        setSops(data);
      } catch (err: unknown) {
        console.error("Failed to load SOPs:", err);
        setError("Unable to retrieve Standard Operating Procedures. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    
    loadSops();
  }, [profile?.organization_id]);

  const filteredSops = sops.filter(
    (sop) =>
      sop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sop.description && sop.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header section with CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-sidebar-border/40">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Standard Operating Procedures
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Browse, manage, and execute your organization's interactive incident runbooks.
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard/generator")}
          className="flex items-center justify-center gap-2 bg-accent-primary hover:bg-[#cbb8ff] text-slate-950 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-accent-primary/10 select-none cursor-pointer self-start sm:self-auto hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>New SOP</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center bg-sidebar-bg border border-sidebar-border rounded-xl px-4 py-3 max-w-md focus-within:border-accent-primary/60 transition-colors">
        <Search className="w-4 h-4 text-text-muted shrink-0 mr-2.5" />
        <input
          type="text"
          placeholder="Search SOPs by title or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder-text-muted"
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
          <p className="text-sm text-text-muted">Loading your workspace...</p>
        </div>
      ) : filteredSops.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center text-center p-12 py-20 border border-dashed border-sidebar-border rounded-2xl bg-sidebar-bg/20">
          <div className="w-16 h-16 rounded-full bg-sidebar-border/30 flex items-center justify-center text-text-muted mb-6">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">
            {searchQuery ? "No matching procedures found" : "No SOPs created yet"}
          </h3>
          <p className="text-sm text-text-muted max-w-sm mb-8 leading-relaxed">
            {searchQuery
              ? "Try adjusting your search terms or view all procedures."
              : "Incident logs and chat history can be parsed automatically using our AI compiler to create interactive runbooks."}
          </p>
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery("")}
              className="text-sm font-semibold text-accent-primary hover:underline cursor-pointer"
            >
              Clear Search Query
            </button>
          ) : (
            <button
              onClick={() => router.push("/dashboard/generator")}
              className="flex items-center gap-1.5 bg-sidebar-border hover:bg-sidebar-border/80 text-foreground px-5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer"
            >
              <span>Build First SOP</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        /* Grid of SOPs */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSops.map((sop) => {
            const stepsCount = sop.dsl_payload?.steps?.length || 0;
            const updatedDate = new Date(sop.updated_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div
                key={sop.id}
                className="group flex flex-col bg-sidebar-bg border border-sidebar-border rounded-2xl p-5 md:p-6 transition-all hover:border-sidebar-border/80 hover:shadow-lg hover:shadow-black/10 hover:-translate-y-0.5 relative overflow-hidden"
              >
                {/* Subtle top decoration */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-primary to-[#8e6bfa] opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-lg font-bold text-foreground tracking-tight group-hover:text-accent-primary transition-colors line-clamp-1">
                      {sop.title}
                    </h3>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-accent-primary bg-accent-primary/10 border border-accent-primary/20 rounded-full px-2 py-0.5 shrink-0">
                      {stepsCount} {stepsCount === 1 ? "step" : "steps"}
                    </span>
                  </div>
                  
                  <p className="text-sm text-text-muted line-clamp-3 leading-relaxed">
                    {sop.description || "No description provided. Run this procedure to configure parameter overrides and execute interactive steps."}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-sidebar-border/50 pt-4 mt-5 gap-4">
                  <div className="flex items-center text-text-muted text-xs">
                    <Calendar className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                    <span>Updated {updatedDate}</span>
                  </div>

                  <button
                    onClick={() => router.push(`/dashboard/run/${sop.id}`)}
                    className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-accent-primary hover:text-[#cbb8ff] transition-colors cursor-pointer select-none"
                  >
                    <span>Run SOP</span>
                    <Play className="w-3.5 h-3.5 fill-current shrink-0 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
