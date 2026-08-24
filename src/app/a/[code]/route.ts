import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase"; 

async function hashIp(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + (process.env.IP_SALT || "ad-tracking-salt"));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

function parseUserAgent(ua: string) {
  let deviceType = "desktop";
  let os = "other";
  if (/mobile/i.test(ua)) deviceType = "mobile";
  if (/tablet|ipad/i.test(ua)) deviceType = "tablet";
  if (/android/i.test(ua)) os = "android";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "ios";
  return { deviceType, os };
}

export async function GET(
  request: NextRequest,
  // 1. UPDATE: Define params as a Promise
  { params }: { params: Promise<{ code: string }> } 
) {
  const fallbackUrl = process.env.NEXT_PUBLIC_FALLBACK_URL || "http://localhost:3000";

  try {
    // 2. UPDATE: Await the params before reading the code
    const resolvedParams = await params;
    const trackingCode = resolvedParams.code?.toUpperCase().trim();

    console.log(`\n======================================`);
    console.log(`🚀 NEW CLICK DETECTED: Code [${trackingCode}]`);

    if (!trackingCode) {
      console.error("❌ ERROR: No tracking code provided in URL.");
      return NextResponse.redirect(new URL(fallbackUrl, request.url));
    }

    if (!supabaseAdmin) {
      console.error("❌ ERROR: supabaseAdmin is NULL! You are missing SUPABASE_SERVICE_ROLE_KEY in .env.local");
      return NextResponse.redirect(new URL(fallbackUrl, request.url));
    }

    // Fetch the active ad destination
    const { data: ad, error: adError } = await supabaseAdmin
      .from("ads")
      .select("id, destination_url, status")
      .eq("tracking_code", trackingCode)
      .single();

    if (adError) {
      console.error("❌ DATABASE ERROR fetching ad:", adError.message);
      return NextResponse.redirect(new URL(fallbackUrl, request.url));
    }

    if (!ad) {
      console.error("❌ ERROR: No ad found matching code:", trackingCode);
      return NextResponse.redirect(new URL(fallbackUrl, request.url));
    }

    if (ad.status !== "active") {
      console.error(`❌ ERROR: Ad is not active. Current status: ${ad.status}`);
      return NextResponse.redirect(new URL(fallbackUrl, request.url));
    }

    console.log(`✅ Ad Found! Redirecting to: ${ad.destination_url}`);

    const originalUrl = new URL(request.url);
    let destinationUrl;
    
    try {
      destinationUrl = new URL(ad.destination_url);
    } catch (urlError) {
      console.error(`❌ ERROR: Invalid destination URL saved in database: ${ad.destination_url}`);
      destinationUrl = new URL(`https://${ad.destination_url}`); 
    }
    
    originalUrl.searchParams.forEach((value, key) => {
      destinationUrl.searchParams.set(key, value);
    });
    destinationUrl.searchParams.set("tc", trackingCode);

    const ua = request.headers.get("user-agent") || "";
    const rawIp = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    
    if (/bot|crawler|spider|facebookexternalhit|whatsapp|preview/i.test(ua)) {
      console.log("🤖 Bot detected, skipping analytics tracking.");
      return NextResponse.redirect(destinationUrl.toString(), 302);
    }

    const { deviceType, os } = parseUserAgent(ua);
    const ipHash = await hashIp(rawIp);
    const country = request.headers.get("x-vercel-ip-country") || "unknown";
    const sessionId = crypto.randomUUID();

    const { data: visit, error: visitError } = await supabaseAdmin
      .from("visits")
      .insert({
        ad_id: ad.id,
        tracking_code: trackingCode,
        session_id: sessionId,
        operating_system: os,
        device_type: deviceType,
        country: country,
        ip_hash: ipHash,
        referrer: request.headers.get("referer") || null,
      })
      .select("id")
      .single();

    if (visitError) {
      console.error("⚠️ WARNING: Failed to record visit metrics:", visitError.message);
    }

    if (!visitError && visit) {
      destinationUrl.searchParams.set("vid", visit.id);
      console.log("✅ Visit recorded! ID:", visit.id);

      supabaseAdmin.from("redirects").insert({
        visit_id: visit.id,
        ad_id: ad.id,
        destination_url: ad.destination_url,
        status_code: 302,
      }).then((res) => {
        if(res.error) console.error("⚠️ WARNING: Failed to record redirect metrics:", res.error.message);
      });
    }

    console.log(`➡️ Executing final redirect to: ${destinationUrl.toString()}`);
    console.log(`======================================\n`);
    
    return NextResponse.redirect(destinationUrl.toString(), 302);

  } catch (err) {
    console.error("❌ CRITICAL SERVER ERROR:", err);
    return NextResponse.redirect(new URL(fallbackUrl, request.url));
  }
}