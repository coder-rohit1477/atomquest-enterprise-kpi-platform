"use client";

import { Menu } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogTrigger,
  DialogTitle,
  DialogDescription,
  DialogPortal,
  DialogOverlay
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import React from "react";

import { NotificationCenter } from "./NotificationCenter";

export function MobileHeader({ sidebar }: { sidebar: React.ReactNode }) {
  return (
    <header className="lg:hidden h-16 flex items-center justify-between px-6 bg-slate-950 text-white shrink-0">
      <div className="flex items-center gap-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-slate-900">
              <Menu className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          <DialogPortal>
            <DialogOverlay className="bg-black/40 backdrop-blur-sm" />
            <DialogContent className="fixed left-0 top-0 bottom-0 translate-x-0 translate-y-0 w-72 p-0 border-none rounded-none h-full bg-slate-950 duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left">
              <DialogTitle className="sr-only">Navigation Menu</DialogTitle>
              <DialogDescription className="sr-only">Access enterprise portal features</DialogDescription>
              {sidebar}
            </DialogContent>
          </DialogPortal>
        </Dialog>
        
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg">
              <Menu className="h-4 w-4" />
          </div>
          <span className="font-bold tracking-tight">AtomQuest</span>
        </div>
      </div>

      <NotificationCenter />
    </header>
  );
}
