const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PRN_PATTERN = /^[0-9]{8,20}$/;
const REVIEW_LEASE_MS = 15 * 60 * 1000;

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

function apiUrl(baseUrl: string, path: string, params?: Record<string, string>): string {
  const url = new URL(`${baseUrl}${path}`);
  for (const [key, value] of Object.entries(params || {})) url.searchParams.set(key, value);
  return url.toString();
}

async function responseJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function adminUser(baseUrl: string, serviceRoleKey: string, userId: string): Promise<any | null> {
  const response = await fetch(`${baseUrl}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
    headers: serviceHeaders(serviceRoleKey),
  });
  if (!response.ok) return null;
  return await responseJson(response);
}

async function profileForUser(baseUrl: string, serviceRoleKey: string, userId: string): Promise<any | null> {
  const response = await fetch(apiUrl(baseUrl, "/rest/v1/profiles", {
    select: "id,email,role,portal_id,prn,account_status",
    id: `eq.${userId}`,
    limit: "1",
  }), { headers: serviceHeaders(serviceRoleKey) });
  if (!response.ok) throw new Error("profile_lookup_failed");
  const rows = await responseJson(response);
  return Array.isArray(rows) && rows.length === 1 ? rows[0] : null;
}

async function requestForUser(baseUrl: string, serviceRoleKey: string, userId: string): Promise<any | null> {
  const response = await fetch(apiUrl(baseUrl, "/rest/v1/registration_requests", {
    select: "user_id,email,claimed_name,claimed_prn,status,submitted_at,reviewed_at,reviewed_by",
    user_id: `eq.${userId}`,
    status: "in.(pending,reviewing)",
    limit: "1",
  }), { headers: serviceHeaders(serviceRoleKey) });
  if (!response.ok) throw new Error("request_lookup_failed");
  const rows = await responseJson(response);
  return Array.isArray(rows) && rows.length === 1 ? rows[0] : null;
}

async function patchRequest(
  baseUrl: string,
  serviceRoleKey: string,
  userId: string,
  filters: Record<string, string>,
  values: Record<string, unknown>,
): Promise<any[]> {
  const response = await fetch(apiUrl(baseUrl, "/rest/v1/registration_requests", {
    user_id: `eq.${userId}`,
    ...filters,
  }), {
    method: "PATCH",
    headers: { ...serviceHeaders(serviceRoleKey), Prefer: "return=representation" },
    body: JSON.stringify(values),
  });
  if (!response.ok) throw new Error("request_update_failed");
  const rows = await responseJson(response);
  return Array.isArray(rows) ? rows : [];
}

async function claimRequest(
  baseUrl: string,
  serviceRoleKey: string,
  userId: string,
  reviewerId: string,
): Promise<boolean> {
  const now = new Date();
  const claimed = await patchRequest(baseUrl, serviceRoleKey, userId, { status: "eq.pending" }, {
    status: "reviewing",
    reviewed_by: reviewerId,
    reviewed_at: now.toISOString(),
  });
  if (claimed.length) return true;

  const current = await requestForUser(baseUrl, serviceRoleKey, userId);
  if (!current || current.status !== "reviewing") return false;
  if (current.reviewed_by === reviewerId) return true;

  const reviewedAt = Date.parse(current.reviewed_at || "");
  if (!Number.isFinite(reviewedAt) || Date.now() - reviewedAt < REVIEW_LEASE_MS) return false;

  const cutoff = new Date(Date.now() - REVIEW_LEASE_MS).toISOString();
  const reclaimed = await patchRequest(baseUrl, serviceRoleKey, userId, {
    status: "eq.reviewing",
    reviewed_at: `lt.${cutoff}`,
  }, {
    reviewed_by: reviewerId,
    reviewed_at: now.toISOString(),
  });
  return reclaimed.length > 0;
}

async function releaseRequest(baseUrl: string, serviceRoleKey: string, userId: string, reviewerId: string): Promise<void> {
  await patchRequest(baseUrl, serviceRoleKey, userId, {
    status: "eq.reviewing",
    reviewed_by: `eq.${reviewerId}`,
  }, {
    status: "pending",
    reviewed_by: null,
    reviewed_at: null,
  });
}

async function finishRequest(
  baseUrl: string,
  serviceRoleKey: string,
  userId: string,
  reviewerId: string,
  status: "approved" | "rejected",
): Promise<boolean> {
  const rows = await patchRequest(baseUrl, serviceRoleKey, userId, {
    status: "eq.reviewing",
    reviewed_by: `eq.${reviewerId}`,
  }, {
    status,
    reviewed_at: new Date().toISOString(),
  });
  return rows.length > 0;
}

async function replaceAppMetadata(
  baseUrl: string,
  serviceRoleKey: string,
  userId: string,
  user: any,
  values: Record<string, unknown>,
): Promise<boolean> {
  const previous = user && user.app_metadata && typeof user.app_metadata === "object"
    ? user.app_metadata
    : {};
  const cleanMetadata: Record<string, unknown> = {};
  if (typeof previous.provider === "string") cleanMetadata.provider = previous.provider;
  if (Array.isArray(previous.providers)) cleanMetadata.providers = previous.providers;

  const response = await fetch(`${baseUrl}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
    method: "PUT",
    headers: serviceHeaders(serviceRoleKey),
    body: JSON.stringify({ app_metadata: { ...cleanMetadata, ...values } }),
  });
  return response.ok;
}

async function listRequests(baseUrl: string, serviceRoleKey: string, reviewerId: string): Promise<Response> {
  const response = await fetch(apiUrl(baseUrl, "/rest/v1/registration_requests", {
    select: "user_id,email,claimed_name,claimed_prn,status,submitted_at,reviewed_at,reviewed_by",
    status: "in.(pending,reviewing)",
    order: "submitted_at.desc",
    limit: "100",
  }), { headers: serviceHeaders(serviceRoleKey) });
  if (!response.ok) return jsonResponse({ error: "Could not load registration requests." }, 503);

  const rows = await responseJson(response);
  if (!Array.isArray(rows)) return jsonResponse({ error: "Could not load registration requests." }, 503);

  const requests = [];
  for (let offset = 0; offset < rows.length; offset += 10) {
    const group = rows.slice(offset, offset + 10);
    const results = await Promise.all(group.map(async (row) => {
      const user = await adminUser(baseUrl, serviceRoleKey, row.user_id);
      const emailMatches = !!user?.email && String(user.email).toLowerCase() === String(row.email).toLowerCase();
      const reviewAt = Date.parse(row.reviewed_at || "");
      const reviewIsStale = Number.isFinite(reviewAt) && Date.now() - reviewAt >= REVIEW_LEASE_MS;
      return {
        user_id: row.user_id,
        email: row.email,
        claimed_name: row.claimed_name,
        claimed_prn: row.claimed_prn,
        status: row.status,
        submitted_at: row.submitted_at,
        reviewed_at: row.reviewed_at,
        email_confirmed: !!user?.email_confirmed_at,
        email_matches: emailMatches,
        review_owned_by_current_admin: row.status === "reviewing" && row.reviewed_by === reviewerId,
        review_available: row.status !== "reviewing" || row.reviewed_by === reviewerId || reviewIsStale,
      };
    }));
    requests.push(...results);
  }

  return jsonResponse({ requests, limit: 100 });
}

async function reviewRequest(
  baseUrl: string,
  serviceRoleKey: string,
  reviewerId: string,
  input: any,
): Promise<Response> {
  const userId = typeof input.userId === "string" ? input.userId : "";
  const decision = input.decision;
  if (!UUID_PATTERN.test(userId) || !["approve", "reject"].includes(decision)) {
    return jsonResponse({ error: "Choose a valid request and decision." }, 400);
  }

  const request = await requestForUser(baseUrl, serviceRoleKey, userId);
  if (!request) return jsonResponse({ error: "This request is no longer available for review." }, 404);

  const user = await adminUser(baseUrl, serviceRoleKey, userId);
  if (!user || String(user.email || "").toLowerCase() !== String(request.email).toLowerCase()) {
    return jsonResponse({ error: "The Auth account could not be matched to this request." }, 409);
  }

  let verifiedName = "";
  let verifiedPrn = "";
  if (decision === "approve") {
    verifiedName = typeof input.verifiedName === "string" ? input.verifiedName.trim() : "";
    verifiedPrn = typeof input.verifiedPrn === "string" ? input.verifiedPrn.trim() : "";
    if (input.confirmMetVerification !== true || !verifiedName || verifiedName.length > 120 || !PRN_PATTERN.test(verifiedPrn)) {
      return jsonResponse({ error: "Enter the verified name and PRN, then confirm the MET record check." }, 400);
    }
    if (!user.email_confirmed_at) {
      return jsonResponse({ error: "The student must confirm their email before approval." }, 409);
    }
  }

  if (!await claimRequest(baseUrl, serviceRoleKey, userId, reviewerId)) {
    return jsonResponse({ error: "Another reviewer is handling this request. Refresh the queue and try again later." }, 409);
  }

  try {
    const currentProfile = await profileForUser(baseUrl, serviceRoleKey, userId);
    if (decision === "reject") {
      if (currentProfile?.account_status === "active") {
        await releaseRequest(baseUrl, serviceRoleKey, userId, reviewerId);
        return jsonResponse({ error: "This account is already active. Contact the campus administrator before changing it." }, 409);
      }

      const updated = await replaceAppMetadata(baseUrl, serviceRoleKey, userId, user, {
        role: "student",
        account_status: "suspended",
      });
      if (!updated) {
        await releaseRequest(baseUrl, serviceRoleKey, userId, reviewerId);
        return jsonResponse({ error: "Could not suspend this pending account. Try again." }, 503);
      }

      const suspendedProfile = await profileForUser(baseUrl, serviceRoleKey, userId);
      if (suspendedProfile?.account_status !== "suspended") {
        return jsonResponse({ error: "The account was updated, but its profile did not confirm the change. Retry this review." }, 503);
      }
      if (!await finishRequest(baseUrl, serviceRoleKey, userId, reviewerId, "rejected")) {
        return jsonResponse({ error: "The account is blocked, but the queue status did not update. Retry this review." }, 503);
      }
      return jsonResponse({ status: "rejected" });
    }

    if (currentProfile?.account_status === "active" &&
        (currentProfile.role !== "student" || currentProfile.prn !== verifiedPrn)) {
      await releaseRequest(baseUrl, serviceRoleKey, userId, reviewerId);
      return jsonResponse({ error: "This user already has a different active campus identity. Contact the campus administrator." }, 409);
    }

    const duplicateUrl = apiUrl(baseUrl, "/rest/v1/profiles", {
      select: "id",
      role: "eq.student",
      prn: `eq.${verifiedPrn}`,
      limit: "2",
    });
    const duplicateResponse = await fetch(duplicateUrl, { headers: serviceHeaders(serviceRoleKey) });
    if (!duplicateResponse.ok) throw new Error("duplicate_check_failed");
    const duplicateRows = await responseJson(duplicateResponse);
    if (!Array.isArray(duplicateRows)) throw new Error("duplicate_check_failed");
    if (duplicateRows.some((row) => row.id !== userId)) {
      await releaseRequest(baseUrl, serviceRoleKey, userId, reviewerId);
      return jsonResponse({ error: "That PRN is already assigned to another account. Resolve the duplicate before approving." }, 409);
    }

    const updated = await replaceAppMetadata(baseUrl, serviceRoleKey, userId, user, {
      role: "student",
      account_status: "active",
      name: verifiedName,
      prn: verifiedPrn,
    });
    if (!updated) {
      await releaseRequest(baseUrl, serviceRoleKey, userId, reviewerId);
      return jsonResponse({ error: "Could not provision this student. Try again." }, 503);
    }

    const activeProfile = await profileForUser(baseUrl, serviceRoleKey, userId);
    if (!activeProfile || activeProfile.role !== "student" || activeProfile.account_status !== "active" || activeProfile.prn !== verifiedPrn) {
      return jsonResponse({ error: "The Auth account was updated, but the campus profile did not confirm activation. Retry this review." }, 503);
    }

    if (!await finishRequest(baseUrl, serviceRoleKey, userId, reviewerId, "approved")) {
      return jsonResponse({ error: "The student is active, but the queue status did not update. Retry this review." }, 503);
    }
    return jsonResponse({ status: "approved" });
  } catch {
    await releaseRequest(baseUrl, serviceRoleKey, userId, reviewerId).catch(() => undefined);
    return jsonResponse({ error: "Review could not be completed. Refresh the queue and try again." }, 503);
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

  const baseUrl = Deno.env.get("SUPABASE_URL")?.replace(/\/$/, "");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const publicKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  if (!baseUrl || !serviceRoleKey || !publicKey) {
    return jsonResponse({ error: "The registration admin service is not configured." }, 503);
  }

  const authorization = request.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) return jsonResponse({ error: "Sign in with an MET administrator account." }, 401);

  try {
    const authResponse = await fetch(`${baseUrl}/auth/v1/user`, {
      headers: { apikey: publicKey, Authorization: authorization, Accept: "application/json" },
    });
    if (!authResponse.ok) return jsonResponse({ error: "Your session expired. Sign in again." }, 401);
    const actor = await responseJson(authResponse);
    if (!actor?.id || !actor.email_confirmed_at) return jsonResponse({ error: "A confirmed MET administrator account is required." }, 403);

    const actorProfile = await profileForUser(baseUrl, serviceRoleKey, actor.id);
    if (!actorProfile || actorProfile.role !== "principal" || actorProfile.portal_id !== "principal" || actorProfile.account_status !== "active") {
      return jsonResponse({ error: "This page is restricted to the active MET principal account." }, 403);
    }

    let input: any;
    try {
      input = await request.json();
    } catch {
      return jsonResponse({ error: "Invalid request." }, 400);
    }

    if (input?.action === "list") return await listRequests(baseUrl, serviceRoleKey, actor.id);
    if (input?.action === "review") return await reviewRequest(baseUrl, serviceRoleKey, actor.id, input);
    return jsonResponse({ error: "Choose a supported action." }, 400);
  } catch {
    return jsonResponse({ error: "The registration admin service is temporarily unavailable." }, 503);
  }
});
