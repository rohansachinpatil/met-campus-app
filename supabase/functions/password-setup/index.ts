const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      Pragma: "no-cache",
      Vary: "Authorization",
    },
  });
}

function serviceHeaders(serviceRoleKey: string): HeadersInit {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

async function responseJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

  const baseUrl = Deno.env.get("SUPABASE_URL")?.replace(/\/$/, "");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SECRET_KEY") || "";
  const publicKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
  if (!baseUrl || !serviceRoleKey || !publicKey) {
    return jsonResponse({ error: "Password setup is not configured." }, 503);
  }

  const authorization = request.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) {
    return jsonResponse({ error: "Sign in before choosing a personal password." }, 401);
  }

  let input: { password?: unknown };
  try {
    input = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid request." }, 400);
  }
  const password = typeof input.password === "string" ? input.password : "";
  if (password.length < 12 || password.length > 128 || !password.trim()) {
    return jsonResponse({ error: "Choose a password between 12 and 128 characters." }, 400);
  }

  try {
    const authResponse = await fetch(`${baseUrl}/auth/v1/user`, {
      headers: { apikey: publicKey, Authorization: authorization, Accept: "application/json" },
    });
    if (!authResponse.ok) return jsonResponse({ error: "Your session expired. Sign in again." }, 401);
    const actor = await responseJson(authResponse);
    if (!actor?.id || !actor.email_confirmed_at) {
      return jsonResponse({ error: "A confirmed campus account is required." }, 403);
    }

    const profileUrl = new URL(`${baseUrl}/rest/v1/profiles`);
    profileUrl.searchParams.set("select", "id,email,account_status,password_setup_completed_at");
    profileUrl.searchParams.set("id", `eq.${actor.id}`);
    profileUrl.searchParams.set("limit", "1");
    const profileResponse = await fetch(profileUrl, { headers: serviceHeaders(serviceRoleKey) });
    if (!profileResponse.ok) return jsonResponse({ error: "Could not verify this campus account." }, 503);
    const profiles = await responseJson(profileResponse);
    const profile = Array.isArray(profiles) ? profiles[0] : null;
    if (!profile || profile.account_status !== "active" ||
        String(profile.email || "").toLowerCase() !== String(actor.email || "").toLowerCase()) {
      return jsonResponse({ error: "This account is not active." }, 403);
    }
    if (profile.password_setup_completed_at) {
      return jsonResponse({ error: "A personal password has already been set for this account." }, 409);
    }

    const userResponse = await fetch(`${baseUrl}/auth/v1/admin/users/${encodeURIComponent(actor.id)}`, {
      headers: serviceHeaders(serviceRoleKey),
    });
    if (!userResponse.ok) return jsonResponse({ error: "Could not verify this account." }, 503);
    const user = await responseJson(userResponse);
    const previous = user?.app_metadata && typeof user.app_metadata === "object" ? user.app_metadata : {};
    if (previous.must_change_password !== true) {
      return jsonResponse({ error: "This account does not require initial password setup." }, 403);
    }

    const completedAt = new Date().toISOString();
    const appMetadata = {
      ...previous,
      must_change_password: false,
      password_setup_completed_at: completedAt,
    };
    const updateResponse = await fetch(`${baseUrl}/auth/v1/admin/users/${encodeURIComponent(actor.id)}`, {
      method: "PUT",
      headers: serviceHeaders(serviceRoleKey),
      body: JSON.stringify({ password, app_metadata: appMetadata }),
    });
    if (!updateResponse.ok) return jsonResponse({ error: "Could not update your password. Try again." }, 503);

    const verifiedProfileResponse = await fetch(profileUrl, { headers: serviceHeaders(serviceRoleKey) });
    const verifiedProfiles = await responseJson(verifiedProfileResponse);
    const verifiedProfile = Array.isArray(verifiedProfiles) ? verifiedProfiles[0] : null;
    if (!verifiedProfile?.password_setup_completed_at) {
      return jsonResponse({ error: "Your password changed, but account setup could not be confirmed. Contact campus IT." }, 503);
    }

    const authHeaders: Record<string, string> = {
      apikey: publicKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (!publicKey.startsWith("sb_publishable_")) authHeaders.Authorization = `Bearer ${publicKey}`;
    const sessionResponse = await fetch(`${baseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ email: profile.email, password }),
    });
    if (!sessionResponse.ok) {
      return jsonResponse({ error: "Password changed. Sign in again with your new password." }, 503);
    }
    return jsonResponse({ session: await responseJson(sessionResponse) });
  } catch {
    return jsonResponse({ error: "Password setup is temporarily unavailable." }, 503);
  }
});
