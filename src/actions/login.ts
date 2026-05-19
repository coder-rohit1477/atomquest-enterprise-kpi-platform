"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export type LoginActionState = {
  error?: string;
  redirectTo?: string;
};

export async function loginAction(
  _prevState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const requestedCallbackUrl = formData.get("callbackUrl") as string | null;
  const callbackUrl =
    requestedCallbackUrl && requestedCallbackUrl.startsWith("/")
      ? requestedCallbackUrl
      : "/dashboard";

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    return { redirectTo: callbackUrl };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials!" };
        default:
          return { error: "Something went wrong!" };
      }
    }
    throw error;
  }
}
