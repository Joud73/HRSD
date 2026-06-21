import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { type AppRole, fetchUserRole } from "@/lib/roles";

type ProfileStatus = "pending_verification" | "profile_incomplete" | "active";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profileStatus: ProfileStatus | null;
  userRole: AppRole | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, organizationName?: string, registrationNumber?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfileStatus: (status: ProfileStatus) => Promise<{ error: string | null }>;
  refreshProfileStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);

  const fetchProfileStatus = async (userId: string): Promise<ProfileStatus | null> => {
    try {
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), 3000);
      });
      const fetchPromise = supabase
        .from("profiles")
        .select("status")
        .eq("id", userId)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error) return null;
          return data?.status as ProfileStatus | null;
        });
      return await Promise.race([fetchPromise, timeoutPromise]);
    } catch {
      return null;
    }
  };

  const refreshProfileStatus = async () => {
    if (user) {
      const status = await fetchProfileStatus(user.id);
      setProfileStatus(status);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const [status, role] = await Promise.all([
            fetchProfileStatus(session.user.id),
            fetchUserRole(session.user.id),
          ]);
          if (mounted) {
            setProfileStatus(status);
            setUserRole(role);
          }
        }
      } catch (error) {
        console.error("Auth initialization error");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          Promise.all([
            fetchProfileStatus(newSession.user.id),
            fetchUserRole(newSession.user.id),
          ]).then(([status, role]) => {
            if (mounted) {
              setProfileStatus(status);
              setUserRole(role);
            }
          });
        } else {
          setProfileStatus(null);
          setUserRole(null);
        }
      }
    );

    initAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error("Sign in failed");
      return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
    }
    return { error: null };
  };

  const signUp = async (
    email: string,
    password: string,
    organizationName?: string,
    registrationNumber?: string
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });

    if (error) {
      console.error("Sign up failed");
      return { error: "حدث خطأ أثناء إنشاء الحساب" };
    }

    if (data.user) {
      // Insert profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        email: email,
        organization_name: organizationName || null,
        registration_number: registrationNumber || null,
        status: "pending_verification",
      });

      if (profileError) {
        console.error("Profile creation failed");
        return { error: "حدث خطأ أثناء إنشاء الحساب" };
      }

      // Insert role — registration flow is for organizations
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: data.user.id,
        role: "organization" as any,
      });

      if (roleError) {
        console.error("Role assignment failed");
        // Non-fatal: profile was created, admin can fix role later
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfileStatus(null);
    setUserRole(null);
  };

  const updateProfileStatus = async (status: ProfileStatus) => {
    if (!user) return { error: "لا يوجد مستخدم مسجل" };

    const { error } = await supabase
      .from("profiles")
      .update({ status })
      .eq("id", user.id);

    if (error) {
      console.error("Profile status update failed");
      return { error: "حدث خطأ أثناء تحديث حالة الحساب" };
    }

    setProfileStatus(status);
    return { error: null };
  };

  const value = {
    user,
    session,
    loading,
    profileStatus,
    userRole,
    signIn,
    signUp,
    signOut,
    updateProfileStatus,
    refreshProfileStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
