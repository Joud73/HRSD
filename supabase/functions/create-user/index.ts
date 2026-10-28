import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

// Creates a user by email invitation: the invitee opens the link and sets a password on
// ${SITE_URL}/set-password. No password is ever chosen or shown by the administrator.

Deno.serve(async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;
  const cors = corsHeaders(req);
  const json = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

  try {
    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return json({ error: "Unauthorized" }, 401);
    }

    const callerId = claimsData.claims.sub as string;

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: isAdmin } = await serviceClient.rpc("has_role", {
      _user_id: callerId,
      _role: "admin",
    });

    if (!isAdmin) {
      return json({ error: "Forbidden: admin role required" }, 403);
    }

    const siteUrl = Deno.env.get("SITE_URL")?.replace(/\/$/, "");
    if (!siteUrl) {
      return json({ error: "SITE_URL is not configured" }, 500);
    }

    // Parse body
    const body = await req.json();
    const { email, role, organization_name, registration_number } = body;

    if (!email || !role) {
      return json({ error: "email and role are required" }, 400);
    }

    const validRoles = ["admin", "evaluator", "organization"];
    if (!validRoles.includes(role)) {
      return json({ error: `Invalid role. Must be one of: ${validRoles.join(", ")}` }, 400);
    }

    // organizations.registration_number is required (migration 20261020090000)
    if (role === "organization" && (!organization_name || !registration_number)) {
      return json({ error: "organization_name and registration_number are required for organization role" }, 400);
    }

    // 1. For organization role, create the organization record first
    let organizationId: string | null = null;
    if (role === "organization") {
      const { data: orgData, error: orgError } = await serviceClient
        .from("organizations")
        .insert({ name: organization_name, registration_number })
        .select("id")
        .single();

      if (orgError) {
        return json({ error: orgError.message }, 400);
      }
      organizationId = orgData.id;
    }

    const removeOrganization = async () => {
      if (organizationId) await serviceClient.from("organizations").delete().eq("id", organizationId);
    };

    // 2. Create the auth user and send the invitation
    const { data: authData, error: authError } = await serviceClient.auth.admin.inviteUserByEmail(email, {
      data: { role },
      redirectTo: `${siteUrl}/set-password`,
    });

    if (authError) {
      await removeOrganization();
      return json({ error: authError.message }, 400);
    }

    const userId = authData.user.id;

    // 3. Insert profile linked to organization
    const { error: profileError } = await serviceClient.from("profiles").insert({
      id: userId,
      email,
      status: "active",
      organization_id: organizationId,
      organization_name: role === "organization" ? organization_name : null,
      registration_number: role === "organization" ? registration_number : null,
    });

    if (profileError) {
      await serviceClient.auth.admin.deleteUser(userId);
      await removeOrganization();
      return json({ error: profileError.message }, 500);
    }

    // 4. Insert role
    const { error: roleError } = await serviceClient.from("user_roles").insert({
      user_id: userId,
      role,
    });

    if (roleError) {
      // Deleting the auth user cascades to the profile
      await serviceClient.auth.admin.deleteUser(userId);
      await removeOrganization();
      return json({ error: roleError.message }, 500);
    }

    return json({ id: userId, email, role, organization_name: organization_name || null }, 200);
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
