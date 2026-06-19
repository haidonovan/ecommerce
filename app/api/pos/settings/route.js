import { fail, handleRouteError, ok } from "@/lib/api-response";
import { canAccessPOS, getCurrentUser } from "@/lib/auth";
import { createAuditLog } from "@/lib/business-events";
import { prisma } from "@/lib/prisma";

const POS_SETTINGS_KEY = "pos-settings";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user || !canAccessPOS(user.role)) {
      return fail("POS access required.", 403);
    }

    const setting = await prisma.setting.findUnique({
      where: {
        key: POS_SETTINGS_KEY,
      },
    });

    return ok({
      data: setting?.value || null,
    });
  } catch (error) {
    return handleRouteError(error, "Unable to load POS settings.");
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();

    if (!user || !canAccessPOS(user.role)) {
      return fail("POS access required.", 403);
    }

    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return fail("Invalid settings payload.", 422);
    }

    const saved = await prisma.$transaction(async (tx) => {
      const existing = await tx.setting.findUnique({
        where: {
          key: POS_SETTINGS_KEY,
        },
      });

      const setting = await tx.setting.upsert({
        where: {
          key: POS_SETTINGS_KEY,
        },
        update: {
          value: body,
        },
        create: {
          key: POS_SETTINGS_KEY,
          value: body,
        },
      });

      await createAuditLog(tx, {
        userId: user.id,
        action: existing ? "UPDATE" : "CREATE",
        module: "settings",
        recordId: setting.id,
        oldValue: existing?.value || null,
        newValue: body,
      });

      return setting;
    });

    return ok({
      data: saved.value,
    });
  } catch (error) {
    return handleRouteError(error, "Unable to save POS settings.");
  }
}
