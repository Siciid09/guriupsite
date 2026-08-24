import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase"; 

// 1. CORS Headers to allow requests from mobile devices and external origins
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// 2. IP Hashing for privacy-compliant fingerprinting
async function hashIp(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + (process.env.IP_SALT || "ad-tracking-salt"));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

// 3. Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// 4. Main Event Tracking Endpoint
export async function POST(req: NextRequest) {
  try {
    // Parse JSON body safely
    const bodyText = await req.text();
    if (!bodyText) {
      return NextResponse.json({ error: "Empty request body" }, { status: 400, headers: corsHeaders });
    }

    const payload = JSON.parse(bodyText);
    let { tracking_code, event_type, platform, app_user_id, event_value, metadata } = payload;

    // Validate event type
    const validEvents = ["install", "first_launch", "app_launch", "signup", "purchase", "custom"];
    if (!event_type || !validEvents.includes(event_type)) {
      return NextResponse.json(
        { error: `Invalid event_type. Must be one of: ${validEvents.join(", ")}` },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!supabaseAdmin) {
      console.error("❌ ERROR: supabaseAdmin is NULL! Missing SUPABASE_SERVICE_ROLE_KEY.");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500, headers: corsHeaders });
    }

    // Extract device IP and standard platform
    const rawIp = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    const ipHash = await hashIp(rawIp);
    platform = platform?.toLowerCase() || "unknown";

    let adId: string | null = null;
    let visitId: string | null = null;
    let finalTrackingCode = tracking_code?.toUpperCase().trim() || null;

    // ==========================================
    // ATTRIBUTION RESOLUTION LOGIC
    // ==========================================

    // SCENARIO A: Deterministic Match (We have the exact tracking code from Deep Link or Android Referrer)
    if (finalTrackingCode) {
      const { data: ad, error: adError } = await supabaseAdmin
        .from("ads")
        .select("id")
        .eq("tracking_code", finalTrackingCode)
        .single();

      if (ad && !adError) {
        adId = ad.id;
      }
    } 
    // SCENARIO B: Probabilistic Match (Fingerprinting fallback for iOS or missing referrer)
    else {
      // Look back 24 hours for a click from this exact IP Hash + Platform combination
      const lookbackTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data: recentVisit } = await supabaseAdmin
        .from("visits")
        .select("id, ad_id, tracking_code")
        .eq("ip_hash", ipHash)
        .eq("operating_system", platform === "ios" ? "ios" : "android")
        .gte("created_at", lookbackTime)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (recentVisit) {
        adId = recentVisit.ad_id;
        visitId = recentVisit.id;
        finalTrackingCode = recentVisit.tracking_code;
        console.log(`🔍 Fingerprint Match Found! Mapped IP to code: ${finalTrackingCode}`);
      }
    }

    // SCENARIO C: Organic Install (No match found)
    if (!adId || !finalTrackingCode) {
      console.log(`🌱 Organic Event [${event_type}] ignored for ad metrics.`);
      
      // We return a 200 OK so the mobile app registers the request as "successful" 
      // and doesn't endlessly retry sending organic traffic data.
      return NextResponse.json({ 
        message: "Organic traffic. Ignored for ad tracking.",
        organic: true
      }, { status: 200, headers: corsHeaders });
    }

    // ==========================================
    // RECORD THE ATTRIBUTED EVENT
    // ==========================================
    const { data: event, error: insertError } = await supabaseAdmin
      .from("app_events")
      .insert({
        ad_id: adId,
        tracking_code: finalTrackingCode,
        visit_id: visitId,
        platform: platform,
        event_type: event_type,
        app_user_id: app_user_id || null,
        event_value: typeof event_value === "number" ? event_value : 0.0,
        metadata: metadata || {},
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("❌ DATABASE ERROR inserting app event:", insertError.message);
      throw insertError;
    }

    console.log(`✅ Attributed Event [${event_type}] recorded successfully for code [${finalTrackingCode}].`);

    return NextResponse.json({ 
      success: true, 
      event_id: event.id,
      attributed_to: finalTrackingCode
    }, { status: 201, headers: corsHeaders });

  } catch (err: any) {
    console.error("❌ CRITICAL API ERROR processing event:", err);
    return NextResponse.json(
      { error: "Internal server error processing event" }, 
      { status: 500, headers: corsHeaders }
    );
  }
}