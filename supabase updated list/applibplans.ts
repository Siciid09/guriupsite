import { supabase } from '@/app/lib/supabase';

// ============================================================================
// 1. TYPES & ENUMS
// ============================================================================
export type PlanTier = 'free' | 'pro' | 'premium' | 'agent_pro' | 'admin';

export interface PlanLimits {
  maxImagesPerListing: number;
  maxActiveListings: number;
  canUploadVideo: boolean;
  canAccessAnalytics: boolean;
  hasVerifiedBadge: boolean;
  canUsePremiumAmenities: boolean;
  maxActiveChats: number;
  hasPrioritySupport: boolean;
}

// ============================================================================
// 2. PARSER
// Safely maps the raw string from the database to a strict Type
// ============================================================================
export function parseTier(tierString: string | null | undefined): PlanTier {
  if (!tierString) return 'free';

  const normalized = tierString.toLowerCase().trim();

  switch (normalized) {
    case 'pro':
      return 'pro';
    case 'premium':
    case 'hotel_premium': // Catch Payment Page Plan
      return 'premium';
    case 'agent_pro':
    case 'agentpro':
    case 'agent_premium': // Catch Payment Page Plan
      return 'agent_pro';
    case 'admin':
    case 'sadmin':
      return 'admin';
    case 'free':
    default:
      return 'free';
  }
}

// ============================================================================
// 3. FEATURE LIMITS CONFIGURATION
// The Single Source of Truth for all Free/Pro/Premium logic
// ============================================================================
export function getPlanLimits(tier: PlanTier): PlanLimits {
  switch (tier) {
    case 'free':
      // STRICT FREE TIER LIMITS (Starter)
      return {
        maxImagesPerListing: 3,
        maxActiveListings: 2,
        canUploadVideo: false,
        canAccessAnalytics: false,
        hasVerifiedBadge: false,
        canUsePremiumAmenities: false,
        maxActiveChats: 5,
        hasPrioritySupport: false,
      };

    case 'pro':
      // STANDARD PRO LIMITS (Mid-Tier)
      return {
        maxImagesPerListing: 15,
        maxActiveListings: 15,
        canUploadVideo: false,
        canAccessAnalytics: true,
        hasVerifiedBadge: true,
        canUsePremiumAmenities: true,
        maxActiveChats: 100,
        hasPrioritySupport: false,
      };

    case 'premium':
    case 'agent_pro':
      // PREMIUM/AGENT-PRO LIMITS (High-Tier)
      return {
        maxImagesPerListing: 30,
        maxActiveListings: 100,
        canUploadVideo: true,
        canAccessAnalytics: true,
        hasVerifiedBadge: true,
        canUsePremiumAmenities: true,
        maxActiveChats: 1000,
        hasPrioritySupport: true,
      };

    case 'admin':
      // UNLIMITED ADMIN LIMITS (God Mode)
      return {
        maxImagesPerListing: 9999,
        maxActiveListings: 9999,
        canUploadVideo: true,
        canAccessAnalytics: true,
        hasVerifiedBadge: true,
        canUsePremiumAmenities: true,
        maxActiveChats: 9999,
        hasPrioritySupport: true,
      };
  }
}

export function isPro(tier: PlanTier): boolean {
  return tier !== 'free';
}

// ============================================================================
// 4. SERVER-SIDE SUBSCRIPTION PROVIDER (EVALUATION LOGIC)
// Mirrors SubscriptionProvider logic to check roles and expiry dates
// ============================================================================

// Helper to extract and validate the expiry date of a database record
function extractActiveTier(data: any): PlanTier {
  if (!data) return 'free';

  let tierString = data.planTier || 'free';

  if (tierString.toLowerCase() !== 'free' && data.planExpiryDate) {
    const expiry = new Date(data.planExpiryDate);
    const now = new Date();
    
    // If the plan is expired, revert to free
    if (now > expiry) {
      tierString = 'free';
    }
  }
  
  return parseTier(tierString);
}

/**
 * Fetches the user's data across all 3 roles (users, hotels, agents) simultaneously,
 * evaluates their expiry dates, and returns their highest active plan and strict limits.
 * Use this in your POST/PATCH API routes.
 */
export async function getUserActivePlan(uid: string) {
  // 1. Fetch concurrently to keep API response times incredibly fast
  const [userRes, hotelRes, agentRes] = await Promise.all([
    supabase.from('users').select('planTier, planExpiryDate').eq('_id', uid).maybeSingle(),
    supabase.from('hotels').select('planTier, planExpiryDate').eq('_id', uid).maybeSingle(),
    supabase.from('agents').select('planTier, planExpiryDate').eq('_id', uid).maybeSingle(),
  ]);

  // 2. Extract and validate expiry for each role
  const userTier = extractActiveTier(userRes.data);
  const hotelTier = extractActiveTier(hotelRes.data);
  const agentTier = extractActiveTier(agentRes.data);

  // 3. Evaluate Highest Tier (Mirrors Flutter logic)
  let currentTier: PlanTier = 'free';

  if (isPro(hotelTier)) {
    currentTier = hotelTier;
  } else if (isPro(agentTier)) {
    currentTier = agentTier;
  } else if (isPro(userTier)) {
    currentTier = userTier;
  }

  // 4. Return the consolidated truth for your backend validation
  return {
    tier: currentTier,
    limits: getPlanLimits(currentTier),
    isPro: isPro(currentTier),
  };
}