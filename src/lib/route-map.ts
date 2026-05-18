const ROUTE_ALIASES: Record<string, string> = {
  "/notifications": "/dashboard",
  "/dashboard/notifications": "/dashboard",
  "/manager/approvals": "/manager/dashboard",
  "/manager/shared-goals": "/manager/dashboard",
  "/admin/analytics": "/reports",
  "/admin/reports": "/reports",
  "/admin/governance": "/admin/logs",
};

export function normalizeAppHref(href: string | null | undefined) {
  if (!href) {
    return null;
  }

  if (!href.startsWith("/")) {
    return href;
  }

  const [pathname, search = ""] = href.split("?");
  const normalizedPath = pathname !== "/" ? pathname.replace(/\/+$/, "") : pathname;
  const target = ROUTE_ALIASES[normalizedPath] ?? normalizedPath;

  return search ? `${target}?${search}` : target;
}
