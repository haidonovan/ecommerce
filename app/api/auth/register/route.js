import { fail, handleRouteError, ok } from "@/lib/api-response";
import {
  createSessionToken,
  getSessionCookieName,
  hashPassword,
  sessionCookieOptions,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";

function isAdminEmail(email) {
  const allowed = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return allowed.includes(email.toLowerCase());
}

export async function POST(request) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return fail("Invalid register payload.", 422, { issues: result.error.flatten() });
    }

    const email = result.data.email.toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return fail("An account with this email already exists.", 409);
    }

    const passwordHash = await hashPassword(result.data.password);
    const role = isAdminEmail(email) ? "ADMIN" : "CLIENT";

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
      },
    });

    const token = createSessionToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const response = ok({
      message: "Account created.",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set(getSessionCookieName(), token, sessionCookieOptions());
    return response;
  } catch (error) {
    return handleRouteError(error, "Unable to process register request.", {
      conflictMessage: "An account with this email already exists.",
      databaseMessage: "Unable to process registration right now because the database is unreachable. Check your Neon connection and try again.",
    });
  }
}
