import { fail, handleRouteError, ok } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function normalizeAction(value) {
  const action = String(value || "").toUpperCase();
  return ["CREATE", "UPDATE", "DELETE", "STATUS_CHANGE", "STOCK_CHANGE"].includes(action) ? action : null;
}

function normalizeModule(value) {
  const auditModule = String(value || "").trim();
  return auditModule ? auditModule.toLowerCase() : null;
}

export async function GET(request) {
  try {
    const admin = await requireAdminUser();

    if (!admin) {
      return fail("Admin access required.", 403);
    }

    const { searchParams } = new URL(request.url);
    const auditModule = normalizeModule(searchParams.get("module"));
    const action = normalizeAction(searchParams.get("action"));
    const userId = searchParams.get("userId")?.trim();
    const take = Math.min(Math.max(Number(searchParams.get("take") || 100), 1), 200);
    const where = {};

    if (auditModule) {
      where.module = {
        equals: auditModule,
        mode: "insensitive",
      };
    }

    if (action) {
      where.action = action;
    }

    if (userId) {
      where.userId = userId;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take,
    });

    return ok({
      data: logs.map((log) => ({
        id: log.id,
        createdAt: log.createdAt,
        userId: log.userId,
        userName: log.user?.name || log.user?.email || "System",
        userEmail: log.user?.email || null,
        action: log.action,
        module: log.module,
        recordId: log.recordId,
        oldValue: log.oldValue,
        newValue: log.newValue,
      })),
    });
  } catch (error) {
    return handleRouteError(error, "Unable to load audit logs.");
  }
}
