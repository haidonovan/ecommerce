import { fail, handleRouteError, isDatabaseUnavailableError, ok } from "@/lib/api-response";
import {
  createSessionToken,
  getAdminPassword,
  getCashierPassword,
  getSessionCookieName,
  hashPassword,
  isAdminEmail,
  isCashierEmail,
  sessionCookieOptions,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";

function createLoginResponse(user) {
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
}

export async function POST(request) {
  let result = null;
  let canUseEnvAdminPassword = false;
  let canUseEnvCashierPassword = false;
  let email = "";

  try {
    const body = await request.json();
    result = loginSchema.safeParse(body);

    if (!result.success) {
      return fail("Invalid login payload.", 422, { issues: result.error.flatten() });
    }

    email = result.data.email.toLowerCase();
    const configuredAdminPassword = getAdminPassword();
    const configuredCashierPassword = getCashierPassword();
    canUseEnvAdminPassword =
      isAdminEmail(email) &&
      configuredAdminPassword &&
      result.data.password === configuredAdminPassword;
    canUseEnvCashierPassword =
      isCashierEmail(email) &&
      configuredCashierPassword &&
      result.data.password === configuredCashierPassword;

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
    } else if (canUseEnvCashierPassword) {
      const passwordHash = await hashPassword(configuredCashierPassword);
      user = await prisma.user.upsert({
        where: {
          email,
        },
        update: {
          role: "CASHIER",
          passwordHash,
        },
        create: {
          email,
          role: "CASHIER",
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
      return fail("Email or password is incorrect.", 401);
    }

    const isValid = canUseEnvAdminPassword || canUseEnvCashierPassword
      ? true
      : await verifyPassword(result.data.password, user.passwordHash);

    if (!isValid) {
      return fail("Email or password is incorrect.", 401);
    }

    return createLoginResponse(user);
  } catch (error) {
    if (result?.success && isDatabaseUnavailableError(error) && (canUseEnvAdminPassword || canUseEnvCashierPassword)) {
      return createLoginResponse({
        id: `env-${canUseEnvAdminPassword ? "admin" : "cashier"}-${email}`,
        email,
        role: canUseEnvAdminPassword ? "ADMIN" : "CASHIER",
      });
    }

    return handleRouteError(error, "Unable to process login request.", {
      databaseMessage: "Unable to process login right now because the database is unreachable. Check your Neon connection and try again.",
    });
  }
}
