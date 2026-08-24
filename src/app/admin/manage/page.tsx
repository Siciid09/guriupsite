"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { Users, ExternalLink, Download, Play, UserPlus, ShoppingBag, ArrowRight } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function OverviewPage() {
  const [metrics, setMetrics] = useState({
    visits: 0,
    redirects: 0,
    installs: 0,
    firstLaunches: 0,
    signups: 0,
    purchases: 0,
  });

  const fetchMetrics = async () => {
    const [{ count: visits }, { count: redirects }, { count: installs }, { count: firstLaunches }, { count: signups }, { count: purchases }] =
      await Promise.all([
        supabase.from("visits").select("*", { count: "exact", head: true }),
        supabase.from("redirects").select("*", { count: "exact", head: true }),
        supabase.from("app_events").select("*", { count: "exact", head: true }).eq("event_type", "install"),
        supabase.from("app_events").select("*", { count: "exact", head: true }).eq("event_type", "first_launch"),
        supabase.from("app_events").select("*", { count: "exact", head: true }).eq("event_type", "signup"),
        supabase.from("app_events").select("*", { count: "exact", head: true }).eq("event_type", "purchase"),
      ]);

    setMetrics({
      visits: visits || 0,
      redirects: redirects || 0,
      installs: installs || 0,
      firstLaunches: firstLaunches || 0,
      signups: signups || 0,
      purchases: purchases || 0,
    });
  };

  useEffect(() => {
    fetchMetrics();

    // Supabase Realtime Listener
    const channel = supabase
      .channel("metrics_realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "visits" }, () => fetchMetrics())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "app_events" }, () => fetchMetrics())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const vToR = metrics.visits ? ((metrics.redirects / metrics.visits) * 100).toFixed(1) : "0.0";
  const vToL = metrics.visits ? ((metrics.firstLaunches / metrics.visits) * 100).toFixed(1) : "0.0";
  const lToS = metrics.firstLaunches ? ((metrics.signups / metrics.firstLaunches) * 100).toFixed(1) : "0.0";
  const sToP = metrics.signups ? ((metrics.purchases / metrics.signups) * 100).toFixed(1) : "0.0";

  const chartData = [
    { stage: "Visits", count: metrics.visits },
    { stage: "Redirects", count: metrics.redirects },
    { stage: "First Launches", count: metrics.firstLaunches },
    { stage: "Signups", count: metrics.signups },
    { stage: "Purchases", count: metrics.purchases },
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Attribution Funnel Overview</h2>
        <p className="text-sm text-slate-500">Live performance of all active tracking links across Facebook campaigns.</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard title="Visits" value={metrics.visits} icon={Users} color="text-blue-600" />
        <MetricCard title="Redirects" value={metrics.redirects} icon={ExternalLink} color="text-indigo-600" />
        <MetricCard title="Installs" value={metrics.installs} icon={Download} color="text-amber-600" />
        <MetricCard title="First Launches" value={metrics.firstLaunches} icon={Play} color="text-emerald-600" />
        <MetricCard title="Signups" value={metrics.signups} icon={UserPlus} color="text-purple-600" />
        <MetricCard title="Purchases" value={metrics.purchases} icon={ShoppingBag} color="text-rose-600" />
      </div>

      {/* Funnel Conversion Ratios */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-base font-semibold text-slate-800 mb-4">Stage-by-Stage Conversion Ratios</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-xs font-medium text-slate-500">Visit → Redirect</p>
            <p className="text-xl font-bold text-slate-800 mt-1">{vToR}%</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-xs font-medium text-slate-500">Visit → Launch</p>
            <p className="text-xl font-bold text-slate-800 mt-1">{vToL}%</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-xs font-medium text-slate-500">Launch → Signup</p>
            <p className="text-xl font-bold text-slate-800 mt-1">{lToS}%</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-xs font-medium text-slate-500">Signup → Purchase</p>
            <p className="text-xl font-bold text-slate-800 mt-1">{sToP}%</p>
          </div>
        </div>
      </div>

      {/* Funnel Visualizer */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-base font-semibold text-slate-800 mb-4">Attribution Pipeline</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="stage" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value.toLocaleString()}</p>
      </div>
      <Icon className={`w-8 h-8 ${color} opacity-80`} />
    </div>
  );
}
