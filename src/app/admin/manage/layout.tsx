import { Sidebar } from "../../../components/sidebar"; // Adjust path if your Sidebar is somewhere else

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar stays fixed on the left */}
      <Sidebar />
      
      {/* Main content scrolls on the right */}
      <main className="flex-1 overflow-y-auto w-full">
        {children}
      </main>
    </div>
  );
}