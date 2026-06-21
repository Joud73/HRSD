import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "evaluator" | "organization" | "individual";

export const roleDefaultRoute: Record<AppRole, string> = {
  admin: "/admin",
  evaluator: "/evaluator",
  organization: "/dashboard",
  individual: "/individuals-journey",
};

export function getDefaultRouteForRole(role: AppRole | null): string {
  if (!role) return "/login";
  return roleDefaultRoute[role] ?? "/login";
}

export async function fetchUserRole(userId: string): Promise<AppRole | null> {
  try {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) return null;

    const role = data.role as string;
    // Ignore legacy "user" role
    if (role === "admin" || role === "evaluator" || role === "organization" || role === "individual") {
      return role;
    }
    return null;
  } catch {
    return null;
  }
}
