import { useQuery } from "@tanstack/react-query";
import { adminCopy } from "@/lib/copy";
import { supabase } from "@/integrations/supabase/client";

/* ── All users with roles ── */
export interface AdminUserRow {
  id: string;
  email: string;
  organization_name: string | null;
  role: string;
  roleAr: string;
  status: string;
  statusAr: string;
  created_at: string;
}

/** Role labels come from the shared admin strings (one list for every page). */
const roleArMap = adminCopy.roles_map;

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error: profErr } = await supabase
        .from("profiles")
        .select("id, email, organization_name, status, created_at, organizations(name)");
      if (profErr) throw profErr;
      if (!profiles || profiles.length === 0) return [];

      const userIds = profiles.map((p) => p.id);

      const { data: roles, error: rolesErr } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);
      if (rolesErr) throw rolesErr;

      const roleMap: Record<string, string> = {};
      for (const r of roles || []) {
        roleMap[r.user_id] = r.role;
      }

      const statusArMap: Record<string, string> = {
        active: "نشط",
        pending_verification: "بانتظار التحقق",
        profile_incomplete: "ملف غير مكتمل",
      };

      return profiles.map((p): AdminUserRow => ({
        id: p.id,
        email: p.email,
        organization_name: p.organizations?.name ?? p.organization_name,
        role: roleMap[p.id] || "—",
        roleAr: roleArMap[roleMap[p.id]] || adminCopy.role_unknown,
        status: p.status,
        statusAr: statusArMap[p.status] || p.status,
        created_at: p.created_at,
      }));
    },
  });
}
