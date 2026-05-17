import { auth, signOut } from "@/auth";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Target, 
  Users, 
  LogOut, 
  ShieldCheck, 
  Briefcase,
  Shield,
  BarChart3,
  CheckSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function Sidebar() {
  const session = await auth();
  const user = session?.user as { name?: string | null; email?: string | null; role?: string };
  const role = user?.role || "EMPLOYEE";

  const commonNav = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ];

  const employeeNav = [
    ...commonNav,
    { title: "My Goals", href: "/dashboard/goals", icon: Target },
    { title: "Check-Ins", href: "/dashboard/check-ins", icon: CheckSquare },
  ];

  const managerNav = [
    ...commonNav,
    { title: "Approval Queue", href: "/manager/dashboard", icon: ShieldCheck },
    { title: "Team Goals", href: "/manager/team", icon: Briefcase },
    { title: "Manager Check-ins", href: "/manager/check-ins", icon: CheckSquare },
    { title: "Analytics", href: "/reports", icon: BarChart3 },
  ];

  const adminNav = [
    ...commonNav,
    { title: "Analytics", href: "/reports", icon: BarChart3 },
    { title: "User Control", href: "/admin/users", icon: Users },
    { title: "System Logs", href: "/admin/logs", icon: Shield },
  ];

  let filteredItems;
  if (role === "ADMIN") {
    filteredItems = adminNav;
  } else if (role === "MANAGER") {
    filteredItems = managerNav;
  } else {
    filteredItems = employeeNav;
  }

  return (
    <div className="flex flex-col h-full w-72 bg-slate-950 text-slate-300 border-r border-slate-900 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
      
      <div className="p-8 relative z-10">
        <div className="flex items-center gap-3 mb-10 group cursor-pointer">
          <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <span className="text-xl font-black tracking-tighter text-white uppercase italic">AtomQuest</span>
        </div>

        <nav className="space-y-1">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 ml-3">Strategic Navigation</p>
          {filteredItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center px-4 py-3.5 text-sm font-bold rounded-xl transition-all hover:bg-white/5 hover:text-white group relative overflow-hidden"
            >
              <item.icon className="mr-4 h-5 w-5 text-slate-500 group-hover:text-blue-500 transition-colors shrink-0" />
              {item.title}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-blue-600 rounded-full group-hover:h-6 transition-all" />
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-8 border-t border-slate-900 bg-slate-950/50 relative z-10">
        <div className="flex items-center gap-4 mb-8 bg-white/5 p-4 rounded-2xl border border-white/5">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shadow-lg shadow-blue-500/10">
            {user?.name?.[0] || "U"}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-black text-white truncate">{user?.name || "Standard User"}</p>
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{role}</p>
          </div>
        </div>

        <div className="space-y-2">
          <form action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-slate-400 hover:text-white hover:bg-red-500/10 h-12 rounded-xl group transition-all"
            >
              <LogOut className="mr-3 h-4 w-4 text-slate-500 group-hover:text-red-500 transition-colors" />
              <span className="text-sm font-bold uppercase tracking-widest">Terminate Session</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
