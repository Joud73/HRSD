import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;
  const cors = corsHeaders(req);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
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
      return new Response(JSON.stringify({ error: "Forbidden: admin role required" }), {
        status: 403,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const siteUrl = Deno.env.get("SITE_URL")?.replace(/\/$/, "");
    if (!siteUrl) {
      return new Response(JSON.stringify({ error: "SITE_URL is not configured" }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { request_id } = body;

    if (!request_id) {
      return new Response(
        JSON.stringify({ error: "request_id is required" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const { data: orgReq, error: fetchError } = await serviceClient
      .from("organization_requests")
      .select("*")
      .eq("id", request_id)
      .single();

    if (fetchError || !orgReq) {
      return new Response(
        JSON.stringify({ error: "Request not found" }),
        { status: 404, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    if (orgReq.request_status !== "pending") {
      return new Response(
        JSON.stringify({ error: "Request is not pending" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // 1. Create organization record with every profile field from the request
    const { data: orgData, error: orgError } = await serviceClient
      .from("organizations")
      .insert({
        name: orgReq.organization_name,
        registration_number: orgReq.registration_number,
        entity_type: orgReq.entity_type,
        registration_date: orgReq.registration_date,
        sub_classification_id: orgReq.sub_classification_id,
        social_dev_center_id: orgReq.social_dev_center_id,
        region: orgReq.region,
        city: orgReq.city,
        district: orgReq.district,
        address: orgReq.address,
        employees_count: orgReq.employees_count,
        email: orgReq.organization_email,
        website: orgReq.website,
      })
      .select("id")
      .single();

    if (orgError) {
      return new Response(JSON.stringify({ error: orgError.message }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const organizationId = orgData.id;

    // 2. Create the auth user and send the invitation; the organization sets its own password
    const { data: authData, error: authError } = await serviceClient.auth.admin.inviteUserByEmail(orgReq.email, {
      data: { role: "organization" },
      redirectTo: `${siteUrl}/set-password`,
    });

    if (authError) {
      await serviceClient.from("organizations").delete().eq("id", organizationId);
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const userId = authData.user.id;

    // 3. Insert profile linked to organization
    const { error: profileError } = await serviceClient.from("profiles").insert({
      id: userId,
      email: orgReq.email,
      organization_name: orgReq.organization_name,
      registration_number: orgReq.registration_number,
      organization_id: organizationId,
      status: "active",
    });

    if (profileError) {
      await serviceClient.from("organizations").delete().eq("id", organizationId);
      await serviceClient.auth.admin.deleteUser(userId);
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // 4. Assign organization role
    const { error: roleError } = await serviceClient.from("user_roles").insert({
      user_id: userId,
      role: "organization",
    });

    if (roleError) {
      await serviceClient.from("organizations").delete().eq("id", organizationId);
      await serviceClient.auth.admin.deleteUser(userId);
      return new Response(JSON.stringify({ error: roleError.message }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // 5. Create the organization's delegate (representative)
    const { error: delegateError } = await serviceClient.from("delegates").insert({
      user_id: userId,
      organization_id: organizationId,
      full_name: orgReq.delegate_name,
      id_number: orgReq.delegate_id_number,
      mobile: orgReq.delegate_mobile,
      email: orgReq.delegate_email,
    });

    if (delegateError) {
      await serviceClient.from("user_roles").delete().eq("user_id", userId);
      await serviceClient.from("profiles").delete().eq("id", userId);
      await serviceClient.auth.admin.deleteUser(userId);
      await serviceClient.from("organizations").delete().eq("id", organizationId);
      return new Response(JSON.stringify({ error: delegateError.message }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // 6. Update request status
    await serviceClient
      .from("organization_requests")
      .update({
        request_status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: callerId,
      })
      .eq("id", request_id);

    return new Response(
      JSON.stringify({ success: true, user_id: userId, email: orgReq.email }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
