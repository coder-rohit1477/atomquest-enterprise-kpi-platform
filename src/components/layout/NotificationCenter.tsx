"use client";

import { useState, useEffect } from "react";
import { Bell, Check, Info, AlertTriangle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { getNotifications, markAsRead, markAllAsRead } from "@/actions/notifications";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: Date;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
        const data = await getNotifications();
        setNotifications(data as Notification[]);
        setUnreadCount(data.filter((n) => !n.isRead).length);
    };

    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
    const data = await getNotifications();
    setNotifications(data as Notification[]);
    setUnreadCount(data.filter((n) => !n.isRead).length);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    const data = await getNotifications();
    setNotifications(data as Notification[]);
    setUnreadCount(data.filter((n) => !n.isRead).length);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "SUCCESS":
        return <Check className="h-4 w-4 text-green-500" />;
      case "WARNING":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "ERROR":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-xl border-slate-200 h-11 px-5 relative">
          <Bell className="h-4 w-4 mr-2 text-slate-500" />
          Notifications
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full px-2 py-0.5 text-[10px] min-w-[20px] flex items-center justify-center border-2 border-white">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-6 border-b bg-slate-50/50">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold">Notification Center</DialogTitle>
            <DialogDescription className="sr-only">View and manage your recent enterprise notifications.</DialogDescription>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                onClick={handleMarkAllAsRead}
              >
                Mark all as read
              </Button>
            )}
          </div>
        </DialogHeader>
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                <Bell className="h-6 w-6 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-900">All caught up!</p>
              <p className="text-xs text-slate-400">You don&apos;t have any new notifications at the moment.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer relative ${
                    !n.isRead ? "bg-blue-50/30" : ""
                  }`}
                  onClick={() => {
                    if (!n.isRead) handleMarkAsRead(n.id);
                    if (n.link) setIsOpen(false);
                  }}
                >
                  <div className="flex gap-4">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                      n.type === "SUCCESS" ? "bg-green-100" : 
                      n.type === "WARNING" ? "bg-amber-100" : 
                      n.type === "ERROR" ? "bg-red-100" : "bg-blue-100"
                    }`}>
                      {getTypeIcon(n.type)}
                    </div>
                    <div className="space-y-1 overflow-hidden">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-bold truncate ${!n.isRead ? "text-slate-900" : "text-slate-600"}`}>
                          {n.title}
                        </p>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {n.message}
                      </p>
                      {n.link && (
                        <Link 
                          href={n.link} 
                          className="text-[10px] font-bold text-blue-600 hover:underline inline-block mt-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Details
                        </Link>
                      )}
                    </div>
                    {!n.isRead && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="h-2 w-2 rounded-full bg-blue-600" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-4 bg-slate-50 border-t">
          <Button variant="ghost" className="w-full text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900">
            Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
