import { ok } from "@/lib/api-response";
import { getSessionCookieName, sessionCookieOptions } from "@/lib/auth";

export async function POST() {
  const response = ok({
    message: "Logged out.",
  });

  response.cookies.set(getSessionCookieName(), "", {
    ...sessionCookieOptions(),
    maxAge: 0,
  });

  return response;
}
