const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
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

async function keyedPrnDigest(prn: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`met-student-prn:${prn}`),
  );
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const baseUrl = Deno.env.get("SUPABASE_URL")?.replace(/\/$/, "");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SECRET_KEY") || "";
  const publicKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
  if (!baseUrl || !serviceRoleKey || !publicKey) {
    return jsonResponse({ error: "Sign-in service is not configured." }, 503);
  }

  let input: { prn?: unknown; password?: unknown };
  try {
    input = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid request." }, 400);
  }

  const prn = typeof input.prn === "string" ? input.prn.trim() : "";
  const password = typeof input.password === "string" ? input.password : "";
  if (!/^[0-9]{8,20}$/.test(prn) || !password || password.length > 1024) {
    return jsonResponse({ error: "Invalid PRN or password." }, 401);
  }

  try {
    const prnKey = await keyedPrnDigest(prn, serviceRoleKey);
    const rateLimitResponse = await fetch(`${baseUrl}/rest/v1/rpc/consume_student_prn_login_attempt`, {
      method: "POST",
      headers: serviceHeaders(serviceRoleKey),
      body: JSON.stringify({ p_prn_key: prnKey }),
    });
    if (!rateLimitResponse.ok) return jsonResponse({ error: "Sign-in service is temporarily unavailable." }, 503);
    if (await rateLimitResponse.json() !== true) {
      return jsonResponse({ error: "Too many attempts. Try again in 15 minutes." }, 429);
    }

    const profileUrl = new URL(`${baseUrl}/rest/v1/profiles`);
    profileUrl.searchParams.set("select", "id,email,role,account_status");
    profileUrl.searchParams.set("prn", `eq.${prn}`);
    profileUrl.searchParams.set("role", "eq.student");
    profileUrl.searchParams.set("account_status", "eq.active");
    const profileResponse = await fetch(profileUrl, { headers: serviceHeaders(serviceRoleKey) });
    if (!profileResponse.ok) return jsonResponse({ error: "Sign-in service is temporarily unavailable." }, 503);
    const profiles = await profileResponse.json();
    if (!Array.isArray(profiles) || profiles.length !== 1 || !profiles[0].email) {
      return jsonResponse({ error: "Invalid PRN or password." }, 401);
    }

    const profile = profiles[0];
    const userResponse = await fetch(`${baseUrl}/auth/v1/admin/users/${encodeURIComponent(profile.id)}`, {
      headers: serviceHeaders(serviceRoleKey),
    });
    if (!userResponse.ok) return jsonResponse({ error: "Sign-in service is temporarily unavailable." }, 503);
    const user = await userResponse.json();
    if (
      !user.email_confirmed_at ||
      String(user.email || "").toLowerCase() !== String(profile.email).toLowerCase()
    ) {
      return jsonResponse({ error: "Invalid PRN or password." }, 401);
    }

    const authHeaders: Record<string, string> = {
      apikey: publicKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (!publicKey.startsWith("sb_publishable_")) authHeaders.Authorization = `Bearer ${publicKey}`;
    const authResponse = await fetch(`${baseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ email: profile.email, password }),
    });
    if (!authResponse.ok) return jsonResponse({ error: "Invalid PRN or password." }, 401);

    return jsonResponse(await authResponse.json());
  } catch {
    return jsonResponse({ error: "Sign-in service is temporarily unavailable." }, 503);
  }
});
