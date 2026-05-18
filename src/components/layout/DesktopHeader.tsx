"use client";

import { NotificationCenter } from "./NotificationCenter";

interface DesktopHeaderProps {
  user?: {
    name?: string | null;
    role?: string;
  };
}

export function DesktopHeader({ user }: DesktopHeaderProps) {
  return (
    <header className="hidden lg:flex h-16 items-center justify-between px-8 bg-white border-b border-slate-100 shrink-0">
      <div>
        {/* Breadcrumbs or Page Title could go here if passed as prop */}
      </div>
      <div className="flex items-center gap-4">
        <NotificationCenter />
        <div className="h-8 w-[1px] bg-slate-100 mx-2" />
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-bold text-slate-900 leading-none">{user?.name || "User"}</p>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">{user?.role || "Employee"}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
