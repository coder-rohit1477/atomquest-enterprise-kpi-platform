import type { NextAuthConfig } from "next-auth";

function getRoleHome(role?: string | null) {
  if (role === "ADMIN") return "/admin";
  if (role === "MANAGER") return "/manager/dashboard";
  return "/dashboard";
}

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;
      const pathname = nextUrl.pathname;
      const isProtectedRoute =
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/manager") ||
        pathname.startsWith("/admin") ||
        pathname.startsWith("/reports");

      if (isProtectedRoute) {
        if (!isLoggedIn) return false;

        if (pathname.startsWith("/admin") && role !== "ADMIN") {
          return Response.redirect(new URL(getRoleHome(role), nextUrl));
        }

        if (pathname.startsWith("/manager") && role !== "MANAGER" && role !== "ADMIN") {
          return Response.redirect(new URL(getRoleHome(role), nextUrl));
        }

        return true;
      }

      if (isLoggedIn && (pathname === "/login" || pathname === "/")) {
        return Response.redirect(new URL(getRoleHome(role), nextUrl));
      }

      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role;
        token.id = user.id as string;
      }
      if (trigger === "update" && session) {
        token.name = session.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (typeof token.role === "string" && session.user) {
        session.user.role = token.role;
      }
      if (typeof token.id === "string" && session.user) {
        session.user.id = token.id;
      }
      return session;
    },
  },
  providers: [], // Providers are added in auth.ts
} satisfies NextAuthConfig;
