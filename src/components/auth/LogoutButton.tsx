"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const [isPending, setIsPending] = useState(false);

  async function handleLogout() {
    if (isPending) return;
    setIsPending(true);

    try {
      const result = await signOut({
        redirect: false,
        callbackUrl: "/login",
      });
      window.location.assign(result?.url ?? "/login");
    } catch {
      window.location.assign("/login");
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={handleLogout}
      disabled={isPending}
      className="w-full justify-start text-slate-400 hover:text-white hover:bg-red-500/10 h-12 rounded-xl group transition-all"
    >
      {isPending ? (
        <Loader2 className="mr-3 h-4 w-4 animate-spin text-red-500" />
      ) : (
        <LogOut className="mr-3 h-4 w-4 text-slate-500 group-hover:text-red-500 transition-colors" />
      )}
      <span className="text-sm font-bold uppercase tracking-widest">Terminate Session</span>
    </Button>
  );
}
