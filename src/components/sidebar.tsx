"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Layers, Link as LinkIcon, PlusCircle, Activity, BarChart3, Settings } from "lucide-react";

const navigation = [
  { name: "Overview", href: "/admin/manage", icon: LayoutDashboard },
  { name: "Create Tracking Link", href: "/admin/manage/ads/new", icon: PlusCircle },
  { name: "Ad Performance", href: "/admin/manage/ads", icon: LinkIcon },
  { name: "Campaigns", href: "/admin/manage/campaigns", icon: Layers },
  { name: "Live Event Stream", href: "/admin/manage/events", icon: Activity },
  { name: "Settings", href: "/admin/manage/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col min-h-screen border-r border-slate-800">
      <div className="p-6">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <BarChart3 className="text-blue-500 w-6 h-6" /> AdTrack Engine
        </h1>
        <p className="text-xs text-slate-400 mt-1">Facebook Attribution System</p>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navigation.map((item) => {
          // Check if the current path matches the link exactly to highlight the active tab
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
        Engine Status: <span className="text-emerald-400 font-semibold">Active</span>
      </div>
    </aside>
  );
}