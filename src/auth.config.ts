import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtectedRoute = nextUrl.pathname.startsWith("/dashboard") || 
                              nextUrl.pathname.startsWith("/manager") || 
                              nextUrl.pathname.startsWith("/admin") ||
                              nextUrl.pathname.startsWith("/reports");
      
      if (isProtectedRoute) {
        if (isLoggedIn) return true;
        return false; // Redirect to login
      } else if (isLoggedIn && nextUrl.pathname === "/login") {
        return Response.redirect(new URL("/dashboard", nextUrl));
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
