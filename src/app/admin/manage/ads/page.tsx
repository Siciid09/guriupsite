"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { Copy, Check, Search } from "lucide-react";

export default function AdsPerformancePage() {
  const [ads, setAds] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const loadAdsData = async () => {
    // 1. Fetch ads
    const { data: adsList } = await supabase.from("ads").select("*").order("created_at", { ascending: false });
    if (!adsList) return;

    // 2. Aggregate metrics for each ad
    const hydrated = await Promise.all(
      adsList.map(async (ad) => {
        const [{ count: visits }, { count: redirects }, { count: launches }, { count: signups }, { count: purchases }] =
          await Promise.all([
            supabase.from("visits").select("*", { count: "exact", head: true }).eq("ad_id", ad.id),
            supabase.from("redirects").select("*", { count: "exact", head: true }).eq("ad_id", ad.id),
            supabase.from("app_events").select("*", { count: "exact", head: true }).eq("ad_id", ad.id).eq("event_type", "first_launch"),
            supabase.from("app_events").select("*", { count: "exact", head: true }).eq("ad_id", ad.id).eq("event_type", "signup"),
            supabase.from("app_events").select("*", { count: "exact", head: true }).eq("ad_id", ad.id).eq("event_type", "purchase"),
          ]);

        const v = visits || 0;
        const l = launches || 0;
        const cvr = v > 0 ? ((l / v) * 100).toFixed(1) + "%" : "0.0%";

        return {
          ...ad,
          visits: v,
          redirects: redirects || 0,
          launches: l,
          signups: signups || 0,
          purchases: purchases || 0,
          cvr,
        };
      })
    );

    setAds(hydrated);
  };

  useEffect(() => {
    loadAdsData();
  }, []);

  const filteredAds = ads.filter((ad) => ad.name.toLowerCase().includes(searchTerm.toLowerCase()) || ad.tracking_code.includes(searchTerm.toUpperCase()));

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Facebook Ads Performance</h2>
          <p className="text-sm text-slate-500">Track unique clicks, redirects, and converted app installs.</p>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 max-w-sm">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Filter by ad name or code..."
          className="w-full text-sm outline-none bg-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
            <tr>
              <th className="p-4">Ad Name</th>
              <th className="p-4">Code</th>
              <th className="p-4">Visits</th>
              <th className="p-4">Redirects</th>
              <th className="p-4">First Launches</th>
              <th className="p-4">Signups</th>
              <th className="p-4">Purchases</th>
              <th className="p-4">Visit → Launch %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredAds.map((ad) => (
              <tr key={ad.id} className="hover:bg-slate-50 transition">
                <td className="p-4 font-medium text-slate-900">{ad.name}</td>
                <td className="p-4">
                  <span className="font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs">
                    {ad.tracking_code}
                  </span>
                </td>
                <td className="p-4 text-slate-600">{ad.visits.toLocaleString()}</td>
                <td className="p-4 text-slate-600">{ad.redirects.toLocaleString()}</td>
                <td className="p-4 text-slate-600 font-semibold text-emerald-600">{ad.launches.toLocaleString()}</td>
                <td className="p-4 text-slate-600">{ad.signups.toLocaleString()}</td>
                <td className="p-4 text-slate-600">{ad.purchases.toLocaleString()}</td>
                <td className="p-4 font-bold text-slate-800">{ad.cvr}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}