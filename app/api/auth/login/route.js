import { fail, handleRouteError, ok } from "@/lib/api-response";
import {
  createSessionToken,
  getAdminPassword,
  getSessionCookieName,
  hashPassword,
  isAdminEmail,
  sessionCookieOptions,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";

export async function POST(request) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return fail("Invalid login payload.", 422, { issues: result.error.flatten() });
    }

    const email = result.data.email.toLowerCase();
    const wantsAdminLogin = body.roleHint === "admin";
    const configuredAdminPassword = getAdminPassword();
    const canUseEnvAdminPassword =
      wantsAdminLogin &&
      isAdminEmail(email) &&
      configuredAdminPassword &&
      result.data.password === configuredAdminPassword;

    let user = null;

    if (canUseEnvAdminPassword) {
      const passwordHash = await hashPassword(configuredAdminPassword);
      user = await prisma.user.upsert({
        where: {
          email,
        },
        update: {
          role: "ADMIN",
          passwordHash,
        },
        create: {
          email,
          role: "ADMIN",
          passwordHash,
        },
      });
    } else {
      user = await prisma.user.findUnique({
        where: {
          email,
        },
      });
    }

    if (!user) {
      return fail("Account not found.", 404);
    }

    const isValid = canUseEnvAdminPassword
      ? true
      : await verifyPassword(result.data.password, user.passwordHash);

    if (!isValid) {
      return fail("Incorrect password.", 401);
    }

    if (wantsAdminLogin && user.role !== "ADMIN") {
      return fail("Admin access required for that login.", 403);
    }

    const token = createSessionToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const response = ok({
      message: "Login successful.",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set(getSessionCookieName(), token, sessionCookieOptions());
    return response;
  } catch (error) {
    return handleRouteError(error, "Unable to process login request.", {
      databaseMessage: "Unable to process login right now because the database is unreachable. Check your Neon connection and try again.",
    });
  }
}
