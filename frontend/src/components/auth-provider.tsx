"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { type User } from "@supabase/supabase-js";
import { useRouter, usePathname } from "next/navigation";

type Profile = {
  id: string;
  organization_id: string;
  email: string;
  role: "owner" | "admin" | "member";
  created_at: string;
};

type Organization = {
  id: string;
  name: string;
  created_at: string;
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  organization: Organization | null;
  loading: boolean;
  signOut: () => Promise<void>;
  triggerReauth: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReauthModal, setShowReauthModal] = useState(false);
  const [reauthPassword, setReauthPassword] = useState("");
  const [reauthError, setReauthError] = useState("");
  const [reauthSubmitting, setReauthSubmitting] = useState(false);

  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();

  const fetchUserData = async (currentUser: User) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (profileError || !profileData) {
        throw new Error("Failed to fetch user profile");
      }

      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", profileData.organization_id)
        .single();

      if (orgError || !orgData) {
        throw new Error("Failed to fetch organization details");
      }

      setUser(currentUser);
      setProfile(profileData as Profile);
      setOrganization(orgData as Organization);
    } catch (err) {
      console.error("Error loading user context:", err);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await fetchUserData(session.user);
    }
  };

  useEffect(() => {
    let active = true;

    async function fetchUserDataInit(currentUser: User) {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();

        if (profileError || !profileData) {
          throw new Error("Failed to fetch user profile");
        }

        const { data: orgData, error: orgError } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", profileData.organization_id)
          .single();

        if (orgError || !orgData) {
          throw new Error("Failed to fetch organization details");
        }

        if (active) {
          setUser(currentUser);
          setProfile(profileData as Profile);
          setOrganization(orgData as Organization);
        }
      } catch (err) {
        console.error("Error loading user context:", err);
        if (active) {
          setUser(null);
          setProfile(null);
          setOrganization(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserDataInit(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        fetchUserDataInit(session.user);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
        setOrganization(null);
        setLoading(false);
        router.push("/login");
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        setUser(session.user);
      } else if (event === "USER_UPDATED" && session?.user) {
        setUser(session.user);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  // Sync session check for active dashboard views
  useEffect(() => {
    if (pathname.startsWith("/dashboard") && !loading && !user) {
      router.push("/login");
    }
  }, [pathname, loading, user, router]);

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
  };

  const triggerReauth = () => {
    setShowReauthModal(true);
  };

  const handleReauthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;
    setReauthSubmitting(true);
    setReauthError("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: reauthPassword,
      });

      if (error) {
        throw error;
      }

      setShowReauthModal(false);
      setReauthPassword("");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to authenticate. Please check your password.";
      setReauthError(message);
    } finally {
      setReauthSubmitting(false);
    }
  };

  if (loading) {
    // Premium loading skeleton dashboard simulation to prevent flashes
    return (
      <div className="flex min-h-screen flex-col bg-[#07111f] text-[#eff6ff] p-6 animate-pulse">
        <header className="flex items-center justify-between border-b border-[#1d324b] pb-4 mb-8">
          <div className="h-6 w-32 bg-[#101f32] rounded" />
          <div className="h-8 w-8 bg-[#101f32] rounded-full" />
        </header>
        <div className="flex-1 grid grid-cols-[240px_1fr] gap-8">
          <aside className="space-y-4">
            <div className="h-4 w-3/4 bg-[#101f32] rounded" />
            <div className="h-4 w-1/2 bg-[#101f32] rounded" />
            <div className="h-4 w-5/6 bg-[#101f32] rounded" />
          </aside>
          <main className="space-y-6">
            <div className="h-8 w-1/3 bg-[#101f32] rounded" />
            <div className="grid grid-cols-3 gap-6">
              <div className="h-28 bg-[#101f32] rounded-xl" />
              <div className="h-28 bg-[#101f32] rounded-xl" />
              <div className="h-28 bg-[#101f32] rounded-xl" />
            </div>
            <div className="h-64 bg-[#101f32] rounded-xl" />
          </main>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{ user, profile, organization, loading, signOut, triggerReauth, refresh }}
    >
      {children}

      {/* Premium Re-Authentication Modal */}
      {showReauthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-[#2d4766] bg-[#0b1728] p-8 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#f4bf6326] text-[#f4bf63]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-[#eff6ff]">
                Session Expired
              </h2>
              <p className="mt-2 text-sm text-[#91a3b9] leading-relaxed">
                Your credentials need to be re-verified to secure your live
                incident runbook session. Please enter your password to resume.
              </p>
            </div>

            <form onSubmit={handleReauthSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[.15em] text-[#91a3b9] mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ""}
                  className="w-full rounded-lg border border-[#1d324b] bg-[#07111f]/60 px-4 py-3 text-sm text-[#91a3b9] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-[.15em] text-[#91a3b9] mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={reauthPassword}
                  onChange={(e) => setReauthPassword(e.target.value)}
                  className="w-full rounded-lg border border-[#1d324b] bg-[#07111f] px-4 py-3 text-sm text-[#eff6ff] outline-none transition focus:border-[#b69cff] focus:ring-1 focus:ring-[#b69cff]"
                />
              </div>

              {reauthError && (
                <div className="rounded-lg border border-[#f8717133] bg-[#f8717111] p-3 text-xs text-[#f87171] leading-relaxed">
                  {reauthError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="flex-1 rounded-lg border border-[#1d324b] bg-transparent py-3 text-sm font-semibold text-[#eff6ff] hover:bg-[#101f32] transition"
                >
                  Log Out
                </button>
                <button
                  type="submit"
                  disabled={reauthSubmitting}
                  className="flex-1 rounded-lg bg-[#b69cff] py-3 text-sm font-semibold text-[#07111f] hover:bg-[#cbb8ff] transition disabled:opacity-50"
                >
                  {reauthSubmitting ? "Verifying..." : "Unlock Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
