import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// =========================================================
// INIT ADMIN CLIENT (Bypasses RLS)
// =========================================================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Initialize with the Service Key to allow background data manipulation
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // =========================================================
    // 1. SECURITY: VERIFY VERCEL CRON SECRET
    // =========================================================
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized. Invalid Cron Secret.' }, { status: 401 });
    }

    const today = new Date().toISOString();
    const results = {
      downgradedUsers: 0,
      downgradedHotels: 0,
      downgradedAgents: 0,
      deletedOrphanedImages: 0,
      deletedArchivedProperties: 0,
    };

    // =========================================================
    // 2. TASK: PLAN DOWNGRADES (Sweep all 3 roles)
    // =========================================================
    
    // Downgrade Users
    const { data: usersData, error: usersErr } = await supabaseAdmin
      .from('users')
      .update({ planTier: 'free' })
      .lt('planExpiryDate', today)
      .neq('planTier', 'free')
      .select('_id');
    if (!usersErr && usersData) results.downgradedUsers = usersData.length;

    // Downgrade Hotels
    const { data: hotelsData, error: hotelsErr } = await supabaseAdmin
      .from('hotels')
      .update({ planTier: 'free' })
      .lt('planExpiryDate', today)
      .neq('planTier', 'free')
      .select('_id');
    if (!hotelsErr && hotelsData) results.downgradedHotels = hotelsData.length;

    // Downgrade Agents
    const { data: agentsData, error: agentsErr } = await supabaseAdmin
      .from('agents')
      .update({ planTier: 'free' })
      .lt('planExpiryDate', today)
      .neq('planTier', 'free')
      .select('_id');
    if (!agentsErr && agentsData) results.downgradedAgents = agentsData.length;


    // =========================================================
    // 3. TASK: CACHE & STORAGE CLEANUP
    // Example: Permanently delete properties archived > 30 days ago
    // =========================================================
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Find properties that have been archived for over a month
    const { data: oldProperties, error: fetchErr } = await supabaseAdmin
      .from('property')
      .select('_id, images')
      .eq('isArchived', true)
      .lt('updatedAt', thirtyDaysAgo.toISOString());

    if (!fetchErr && oldProperties && oldProperties.length > 0) {
      for (const property of oldProperties) {
        
        // A. Delete the actual image files from Supabase Storage to save costs
        if (property.images && Array.isArray(property.images) && property.images.length > 0) {
          // Extract just the filenames from the public URLs with a strict TypeScript type guard
          const filePaths = property.images.map((url: string) => {
             const parts = url.split('/property_images/');
             return parts.length > 1 ? parts[1] : null;
          }).filter((path): path is string => path !== null);

          if (filePaths.length > 0) {
            const { error: storageErr } = await supabaseAdmin.storage
              .from('property_images')
              .remove(filePaths);
            
            if (!storageErr) results.deletedOrphanedImages += filePaths.length;
          }
        }

        // B. Delete the database row permanently
        const { error: deleteErr } = await supabaseAdmin
          .from('property')
          .delete()
          .eq('_id', property._id);
        
        if (!deleteErr) results.deletedArchivedProperties += 1;
      }
    }

    // =========================================================
    // 4. RETURN SUCCESS LOG
    // =========================================================
    console.log('Daily Maintenance Completed:', results);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Daily sweep completed successfully.',
      metrics: results 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Cron Maintenance Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}