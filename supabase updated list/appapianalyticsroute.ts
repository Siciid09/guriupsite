import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { format, subDays, parseISO } from 'date-fns';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get('agentId');
  const hotelId = searchParams.get('hotelId');

  try {
    // -------------------------------------------------------------
    // 1. AGENT DASHBOARD ANALYTICS
    // -------------------------------------------------------------
    if (agentId) {
      // 1A. Fetch Properties safely using select('*')
      const { data: properties, error: propsError } = await supabase
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
        const { data: tourRequests } = await supabase
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
        const { data: events } = await supabase
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
      const { data: bookings, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('hotelId', hotelId);

      if (bookingError) throw new Error(`Hotel bookings error: ${bookingError.message}`);

      const bookingList = bookings || [];
      const monthlyRevenue = bookingList
        .filter((b) => ['confirmed', 'paid', 'checked-in', 'checked-out'].includes(b.status))
        .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

      const pendingBookings = bookingList.filter((b) => b.status === 'pending').length;

      return NextResponse.json({
        success: true,
        data: {
          monthlyRevenue,
          pendingBookings,
          totalBookings: bookingList.length,
        },
      });
    }

    return NextResponse.json({ success: false, error: 'agentId or hotelId is required' }, { status: 400 });
  } catch (error: any) {
    console.error('Analytics GET Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventType, propertyId, hotelId, agentId } = body;

    if (!eventType) return NextResponse.json({ success: false, error: 'eventType required' }, { status: 400 });

    const { error: insertError } = await supabase.from('analytics_events').insert([{
      eventType,
      propertyId: propertyId || null,
      hotelId: hotelId || null,
      agentId: agentId || null,
      createdAt: new Date().toISOString(),
    }]);

    if (insertError) throw new Error(insertError.message);

    if (eventType === 'view_property' && propertyId) {
      const { data: property } = await supabase.from('property').select('views').eq('id', propertyId).single();
      if (property) {
        await supabase.from('property').update({ views: (Number(property.views) || 0) + 1 }).eq('id', propertyId);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}