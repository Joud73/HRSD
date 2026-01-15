import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type ProfileStatus = "pending_verification" | "profile_incomplete" | "active";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profileStatus: ProfileStatus | null;
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

  // Safe profile status fetch with timeout
  const fetchProfileStatus = async (userId: string): Promise<ProfileStatus | null> => {
    try {
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), 3000); // 3 second timeout
      });

      const fetchPromise = supabase
        .from("profiles")
        .select("status")
        .eq("id", userId)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error) {
            console.error("Profile status fetch failed");
            return null;
          }
          return data?.status as ProfileStatus | null;
        });

      return await Promise.race([fetchPromise, timeoutPromise]);
    } catch {
      console.error("Profile status fetch error");
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

    // Safe initialization function
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Fetch profile status but don't block on it
          const status = await fetchProfileStatus(session.user.id);
          if (mounted) {
            setProfileStatus(status);
          }
        }
      } catch (error) {
        console.error("Auth initialization error");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth state listener (does NOT control initial loading state)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;
        
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // Fetch profile status in background, don't block
          fetchProfileStatus(newSession.user.id).then((status) => {
            if (mounted) {
              setProfileStatus(status);
            }
          });
        } else {
          setProfileStatus(null);
        }
      }
    );

    // Initialize auth
    initAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Log error for debugging without exposing to client
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
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      // Log error for debugging without exposing to client
      console.error("Sign up failed");
      return { error: "حدث خطأ أثناء إنشاء الحساب" };
    }

    // Create profile with pending_verification status
    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        email: email,
        organization_name: organizationName || null,
        registration_number: registrationNumber || null,
        status: "pending_verification",
      });

      if (profileError) {
        // Error logged without sensitive details for security
        console.error("Profile creation failed");
        return { error: "حدث خطأ أثناء إنشاء الحساب" };
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfileStatus(null);
  };

  const updateProfileStatus = async (status: ProfileStatus) => {
    if (!user) {
      return { error: "لا يوجد مستخدم مسجل" };
    }

    const { error } = await supabase
      .from("profiles")
      .update({ status })
      .eq("id", user.id);

    if (error) {
      // Error logged without sensitive details for security
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
    signIn,
    signUp,
    signOut,
    updateProfileStatus,
    refreshProfileStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
