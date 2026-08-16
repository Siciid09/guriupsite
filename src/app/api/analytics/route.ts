import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase'; // 🛡️ TUNNEL FIX
import { adminAuth } from '@/app/lib/firebase-admin';
import { format, subDays, parseISO } from 'date-fns';

export const dynamic = 'force-dynamic';

// =========================================================
// SECURITY HELPER: VERIFY FIREBASE AUTH TOKEN
// =========================================================
async function getVerifiedUid(request: Request): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken.uid;
  } catch (e) {
    return null;
  }
}

export async function GET(request: Request) {
  if (!supabaseAdmin) {
     return NextResponse.json({ error: 'Server error: Admin client missing.' }, { status: 500 });
  }

  // 1. 🛡️ INTRUSION PREVENTION: Verify Token
  const uid = await getVerifiedUid(request);
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized. You must be logged in to view analytics.' }, { status: 401 });
  }

  // Fetch the requester's role to allow system admins to view any dashboard
  const { data: userRoleData } = await supabaseAdmin.from('users').select('role').or(`id.eq.${uid},_id.eq.${uid}`).maybeSingle();
  const isAdmin = userRoleData?.role === 'admin' || userRoleData?.role === 'sadmin';

  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get('agentId');
  const hotelId = searchParams.get('hotelId');

  try {
    // -------------------------------------------------------------
    // 1. AGENT DASHBOARD ANALYTICS
    // -------------------------------------------------------------
    if (agentId) {
      // 🛡️ GATEKEEPER: Ensure the requester is the agent or an admin
      if (!isAdmin && agentId !== uid) {
         return NextResponse.json({ error: 'Forbidden. You do not own this agency dashboard.' }, { status: 403 });
      }

      // 1A. Fetch Properties safely using select('*')
      const { data: properties, error: propsError } = await supabaseAdmin 
        .from('property')
        .select('*') 
        .eq('agentId', agentId);

      if (propsError) {
        throw new Error(`Failed to load properties: ${propsError.message}`);
      }

      const propsList = properties || [];
      const propertyCount = propsList.length;

      const typesMap: Record<string, number> = {};
      const citiesMap: Record<string, number> = {};

      propsList.forEach((p) => {
        const type = p.propertyType || p.type || 'Residential';
        typesMap[type] = (typesMap[type] || 0) + 1;

        const city = (typeof p.location === 'object' && p.location?.city) || p.city || 'Hargeisa';
        citiesMap[city] = (citiesMap[city] || 0) + 1;
      });

      // 1B. Fetch Tour Requests (Safe Catch)
      let tourRequestsCount = 0;
      try {
        const { data: tourRequests } = await supabaseAdmin 
          .from('tour_requests')
          .select('*')
          .eq('agentId', agentId);
        tourRequestsCount = tourRequests ? tourRequests.length : 0;
      } catch (err) {
        console.warn('Tour requests fetch warning, skipping...');
      }

      // Pipeline Value Calculation
      const activePipelineValue = propsList
        .filter((p) => p.status === 'active' || p.status === 'available')
        .reduce((sum, p) => sum + (Number(p.price) || 0), 0);

      // 1C. Fetch Analytics Events (Safe Catch)
      let eventsList: any[] = [];
      try {
        const { data: events } = await supabaseAdmin 
          .from('analytics_events')
          .select('*')
          .eq('agentId', agentId);
        if (events) eventsList = events;
      } catch (err) {
        console.warn('Analytics events table missing or failed, skipping...');
      }

      let totalViews = 0;
      let totalLeads = 0;
      const propertyViewCounts: Record<string, number> = {};
      const timelineData: Record<string, number> = {};

      // Init last 7 days
      Array.from({ length: 7 }).forEach((_, i) => {
        const dateKey = format(subDays(new Date(), 6 - i), 'MMM dd');
        timelineData[dateKey] = 0;
      });

      eventsList.forEach((event) => {
        const eventType = event.eventType;
        const eventDateStr = event.createdAt ? format(parseISO(event.createdAt), 'MMM dd') : null;

        if (eventType === 'view_property') {
          totalViews++;
          if (event.propertyId) {
            propertyViewCounts[event.propertyId] = (propertyViewCounts[event.propertyId] || 0) + 1;
          }
          if (eventDateStr && timelineData[eventDateStr] !== undefined) {
            timelineData[eventDateStr] += 1;
          }
        } else if (eventType && eventType.startsWith('click_')) {
          totalLeads++;
        }
      });

      // Fallback if events table is empty
      if (totalViews === 0) {
        totalViews = propsList.reduce((sum, p) => sum + (Number(p.views) || 0), 0);
      }

      const sortedTopProperties = propsList
        .map((p) => ({
          ...p,
          views: propertyViewCounts[p.id] || Number(p.views) || 0,
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);

      const viewsTimeline = Object.keys(timelineData).map((date) => ({
        date,
        views: timelineData[date],
      }));

      const typeDistribution = Object.keys(typesMap).map((k) => ({ name: k, value: typesMap[k] }));
      const cityData = Object.keys(citiesMap).map((k) => ({ name: k, value: citiesMap[k] }));
      const conversionRate = totalViews > 0 ? (totalLeads / totalViews) * 100 : 0;

      return NextResponse.json({
        success: true,
        data: {
          totalViews,
          totalLeads,
          tourRequests: tourRequestsCount,
          conversionRate,
          propertyCount,
          pipelineValue: activePipelineValue,
          viewsTimeline,
          typeDistribution,
          cityData,
          topProperties: sortedTopProperties,
        },
      });
    }

    // -------------------------------------------------------------
    // 2. HOTEL DASHBOARD ANALYTICS
    // -------------------------------------------------------------
    if (hotelId) {
      // 🛡️ GATEKEEPER: Ensure the requester actually owns this hotel
      if (!isAdmin) {
        const { data: hotelCheck } = await supabaseAdmin.from('hotels').select('hotelAdminId, ownerId').or(`id.eq.${hotelId},_id.eq.${hotelId}`).maybeSingle();
        if (!hotelCheck || (hotelCheck.hotelAdminId !== uid && hotelCheck.ownerId !== uid)) {
           return NextResponse.json({ error: 'Forbidden. You do not own this hotel dashboard.' }, { status: 403 });
        }
      }

      // 🛡️ ENHANCED: Fetching Rooms and Reviews to calculate true dashboard capacities
      const [bookingsRes, eventsRes, roomsRes, reviewsRes] = await Promise.all([
        supabaseAdmin.from('bookings').select('*').or(`hotelId.eq.${hotelId},hotel_id.eq.${hotelId}`),
        supabaseAdmin.from('analytics_events').select('*').eq('hotelId', hotelId),
        supabaseAdmin.from('rooms').select('*').eq('hotelId', hotelId),
        supabaseAdmin.from('reviews').select('*').eq('hotelId', hotelId)
      ]);

      if (bookingsRes.error) throw new Error(`Hotel bookings error: ${bookingsRes.error.message}`);

      const bookingList = bookingsRes.data || [];
      const monthlyRevenue = bookingList
        .filter((b: any) => ['confirmed', 'paid', 'checked-in', 'checked-out'].includes(b.status))
        .reduce((sum: number, b: any) => sum + (Number(b.totalAmount || b.totalPrice) || 0), 0);

      const pendingBookings = bookingList.filter((b: any) => b.status === 'pending').length;

      // 📊 DYNAMIC REVIEWS PROCESSING
      const reviewsList = reviewsRes.data || [];
      const totalReviews = reviewsList.length;
      const avgRating = totalReviews > 0 
        ? reviewsList.reduce((sum: number, r: any) => sum + (Number(r.rating) || 5), 0) / totalReviews 
        : 0;
        
      // 📊 DYNAMIC ROOM INVENTORY
      const roomsList = roomsRes.data || [];
      const totalRoomsCount = roomsList.length;

      return NextResponse.json({
        success: true,
        data: {
          monthlyRevenue,
          pendingBookings,
          totalBookings: bookingList.length,
          events: eventsRes.data || [], 
          rooms: {
            totalInventory: totalRoomsCount,
            activeList: roomsList
          },
          reviews: {
            average: Number(avgRating.toFixed(1)),
            total: totalReviews,
            newReviews: reviewsList.filter((r: any) => {
              const rDate = r.createdAt ? new Date(r.createdAt) : new Date();
              const lastWeek = new Date();
              lastWeek.setDate(lastWeek.getDate() - 7);
              return rDate >= lastWeek;
            }).length,
            latest: reviewsList
              .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 5)
          }
        },
      });
    }

    return NextResponse.json({ success: false, error: 'agentId or hotelId is required' }, { status: 400 });
  } catch (error: any) {
    console.error('Analytics GET Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// -------------------------------------------------------------
// POST: TRACK ANALYTICS EVENT (Stays Public for Unauthenticated Guests)
// -------------------------------------------------------------
export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) {
       return NextResponse.json({ error: 'Server error: Admin client missing.' }, { status: 500 });
    }

    const body = await request.json();
    const eventType = body.eventType || body.type;
    const { propertyId, hotelId, agentId } = body;

    if (!eventType) return NextResponse.json({ success: true });

    try {
      await supabaseAdmin.from('analytics_events').insert([{
        eventType,
        propertyId: propertyId || null,
        hotelId: hotelId || null,
        agentId: agentId || null,
        createdAt: new Date().toISOString(),
      }]);
    } catch (err) {
      console.warn('Analytics logging warning:', err);
    }

    if ((eventType === 'view_property' || eventType === 'view') && propertyId) {
      const { data: property } = await supabaseAdmin.from('property').select('views').or(`id.eq.${propertyId},_id.eq.${propertyId}`).maybeSingle(); 
      if (property) {
        await supabaseAdmin.from('property').update({ views: (Number(property.views) || 0) + 1 }).or(`id.eq.${propertyId},_id.eq.${propertyId}`); 
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Analytics POST Error:', error);
    return NextResponse.json({ success: true });
  }
}