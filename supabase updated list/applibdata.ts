// app/lib/data.ts
import { supabase } from './supabase';
import type { Property, Hotel, Room, Review, Agent } from '@/types';

// =======================================================================
// 1. AGENT MERGING & DATA NORMALIZATION (Business Logic Source of Truth)
// =======================================================================

function normalizeHotel(h: any): Hotel {
  const planTier = h.planTier || h.plan_tier || 'free';
  const isArchived = String(h.isArchived) === 'true' || String(h.is_archived) === 'true';
  const status = h.status || 'available';
  const featured = h.featured ?? h.is_featured ?? false;
  const hasDiscount = h.hasDiscount ?? h.has_discount ?? false;
  const discountPrice = h.discountPrice ?? h.discount_price ?? 0;
  const pricePerNight = h.pricePerNight ?? h.price_per_night ?? 0;
  const createdAt = h.createdAt || h.created_at || new Date().toISOString();

  return {
    ...h,
    id: h.id,
    slug: h.slug,
    name: h.name,
    pricePerNight,
    displayPrice: (hasDiscount && discountPrice > 0) ? discountPrice : pricePerNight,
    images: Array.isArray(h.images) ? h.images : (h.image_url ? [h.image_url] : []),
    location: h.location,
    rating: Number(h.rating || 0),
    planTier,
    isPro: ['pro', 'premium', 'agent_pro', 'admin'].includes(planTier.toLowerCase()),
    amenities: Array.isArray(h.amenities) ? h.amenities : [],
    type: h.type || h.hotel_type,
    status,
    isArchived,
    featured,
    createdAt,
  };
}

async function mergeAgentsWithProperties(properties: any[]) {
  const agentIds = [...new Set(properties.map(p => p.agentId || p.agent_id).filter(Boolean))];
  
  if (agentIds.length === 0) return properties;

  const [agentsRes, usersRes] = await Promise.all([
    supabase.from('agents').select('*').in('id', agentIds),
    supabase.from('users').select('*').in('id', agentIds)
  ]);

  const agentMap = new Map();
  
  (usersRes.data || []).forEach(u => agentMap.set(u.id, u));
  (agentsRes.data || []).forEach(a => agentMap.set(a.id, a));

  return properties.map(p => {
    const agentId = p.agentId || p.agent_id;
    const agentData = agentMap.get(agentId) || {};
    
    const plan = (agentData.planTier || agentData.plan_tier || p.planTier || p.plan_tier || 'free').toLowerCase();
    const isVerified = (plan === 'pro' || plan === 'premium') || (agentData.isVerified === true || agentData.is_verified === true) || (p.agentVerified === true || p.agent_verified === true);

    return {
      ...p,
      bedrooms: Number(p.bedrooms || p.features?.bedrooms || 0),
      bathrooms: Number(p.bathrooms || p.features?.bathrooms || 0),
      area: Number(p.area || p.size || p.features?.area || p.features?.size || 0),
      agentName: agentData.businessName || agentData.business_name || agentData.name || agentData.displayName || p.agentName || 'GuriUp Agent',
      agentVerified: isVerified,
      planTier: plan,
      agentPhone: isVerified ? (agentData.whatsappNumber || agentData.whatsapp_number || agentData.phone || p.agentPhone) : null,
      agentImage: agentData.logoUrl || agentData.logo_url || agentData.photoUrl || agentData.photo_url || p.agentImage || null
    };
  });
}

// =======================================================================
// 2. PROPERTY QUERIES
// =======================================================================

export async function getFeaturedProperties(): Promise<Property[]> {
  const { data, error } = await supabase
    .from('property')
    .select('*')
    .limit(50);

  if (error || !data) return [];

  const activeData = data.filter(p => {
    const isArchived = p.isArchived ?? p.is_archived ?? false;
    const status = p.status || 'available';
    const featured = p.featured ?? p.is_featured ?? false;
    if (isArchived) return false;
    if (status === 'draft' || status === 'sold') return false;
    return featured;
  });

  const mergedData = await mergeAgentsWithProperties(activeData);

  return mergedData
    .filter(p => p.planTier === 'pro' || p.planTier === 'premium')
    .slice(0, 3);
}

export async function getLatestProperties(): Promise<Property[]> {
  const { data, error } = await supabase
    .from('property')
    .select('*')
    .limit(20);

  if (error || !data) return [];

  const filteredData = data
    .filter(p => {
      const isArchived = p.isArchived ?? p.is_archived ?? false;
      const status = p.status || 'available';
      return !isArchived && (status === 'available' || status === 'rented_out');
    })
    .slice(0, 6);

  return await mergeAgentsWithProperties(filteredData);
}

export async function getAllProperties(): Promise<Property[]> {
  const { data, error } = await supabase
    .from('property')
    .select('*')
    .limit(50);

  if (error || !data) return [];

  const filteredData = data.filter(p => {
    const isArchived = p.isArchived ?? p.is_archived ?? false;
    const status = p.status || 'available';
    return !isArchived && (status === 'available' || status === 'rented_out' || !status);
  });

  return await mergeAgentsWithProperties(filteredData);
}

export async function getPropertyBySlug(slug: string): Promise<Property | null> {
  let { data, error } = await supabase.from('property').select('*').eq('slug', slug).single();

  if (error || !data) {
    const fallback = await supabase.from('property').select('*').eq('id', slug).single();
    data = fallback.data;
  }

  if (!data) return null;
  
  const isArchived = data.isArchived ?? data.is_archived ?? false;
  if (isArchived) return null;

  const [merged] = await mergeAgentsWithProperties([data]);
  return merged;
}

export async function getRelatedProperties(property: Property): Promise<Property[]> {
  if (!property?.location?.city) return [];

  const { data, error } = await supabase
    .from('property')
    .select('*')
    .limit(10);
  
  if (error || !data) return [];

  const filteredData = data
    .filter(p => p.id !== property.id && !(p.isArchived ?? p.is_archived ?? false))
    .slice(0, 4);

  return await mergeAgentsWithProperties(filteredData);
}

export async function getPropertyTypes(): Promise<string[]> {
  const properties = await getAllProperties();
  const types = new Set(properties.map(p => p.type).filter(Boolean));
  return Array.from(types) as string[];
}

// =======================================================================
// 3. HOTEL QUERIES (Normalized for Supabase schema)
// =======================================================================

export async function getFeaturedHotels(): Promise<Hotel[]> {
  const { data, error } = await supabase
    .from('hotels')
    .select('*')
    .limit(50);
  
  if (error || !data) return [];

  return data
    .map(normalizeHotel)
    .filter(h => 
      (h.isPro || h.featured) 
      && !h.isArchived 
      && h.status !== 'banned'
    )
    .slice(0, 10);
}

export async function getLatestHotels(): Promise<Hotel[]> {
  const { data, error } = await supabase
    .from('hotels')
    .select('*')
    .limit(10);
  
  if (error || !data) return [];
  
  return data
    .map(normalizeHotel)
    .filter(h => !h.isArchived)
    .slice(0, 4);
}
console.log("\n=======================================================");
  console.log("🟢 NEXT.JS IS CURRENTLY USING THIS SUPABASE URL:");
  console.log("➡️ ", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("🟢 NEXT.JS IS CURRENTLY USING THIS KEY (First 15 chars):");
  console.log("➡️ ", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 15), "...");
  console.log("=======================================================\n");


export async function getAllHotels() {
  try {
    const { data, error } = await supabase.from('hotels').select('*');
    
    // 👇 THIS PRINTS THE ACTUAL DATA TO YOUR TERMINAL 👇
    console.log("\n====== TERMINAL DATA DUMP ======");
    console.log(`Total Rows Found: ${data ? data.length : 0}`);
    
    if (data && data.length > 0) {
      console.log("🏨 FIRST HOTEL ROW DATA:");
      console.log(JSON.stringify(data[0], null, 2));
    } else if (error) {
      console.log("🚨 SUPABASE ERROR:", error);
    } else {
      console.log("⚠️ NO ERROR, BUT SUPABASE RETURNED AN EMPTY ARRAY []");
    }
    console.log("================================\n");

    return data || [];
  } catch (err: any) {
    console.log("💥 FATAL CRASH:", err?.message || err);
    return [];
  }
}
export async function getHotelBySlug(slug: string): Promise<Hotel | null> {
  let { data, error } = await supabase.from('hotels').select('*').eq('slug', slug).single();

  if (error || !data) {
    const fallback = await supabase.from('hotels').select('*').eq('id', slug).single();
    data = fallback.data;
  }

  return data ? normalizeHotel(data) : null;
}

export async function getHotelRooms(hotelId: string): Promise<Room[]> {
  const { data, error } = await supabase.from('rooms').select('*').or(`hotelId.eq.${hotelId},hotel_id.eq.${hotelId}`);
  return error ? [] : data;
}

export async function getHotelReviews(hotelId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .or(`hotelId.eq.${hotelId},hotel_id.eq.${hotelId}`);
  return error ? [] : data;
}

export async function getRelatedHotels(hotel: Hotel): Promise<Hotel[]> {
  if (!hotel?.location?.city) return [];

  const { data, error } = await supabase
    .from('hotels')
    .select('*')
    .limit(8);
  
  if (error || !data) return [];

  return data
    .map(normalizeHotel)
    .filter(h => h.id !== hotel.id && !h.isArchived)
    .slice(0, 4);
}

// =======================================================================
// 4. HELPER FUNCTIONS
// =================================================0======================

export async function getAgentDetails(agentId: string): Promise<Agent | null> {
  let { data, error } = await supabase.from('agents').select('*').eq('slug', agentId).single();

  if (error || !data) {
    const fallbackAgent = await supabase.from('agents').select('*').eq('id', agentId).single();
    data = fallbackAgent.data;
  }

  if (data) return data as Agent;

  const { data: userData } = await supabase.from('users').select('*').eq('id', agentId).single();
  
  return userData ? (userData as Agent) : null;
}