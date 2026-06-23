import { fail, handleRouteError, ok } from "@/lib/api-response";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user || (!hasPermission(user, "pos:sales") && !hasPermission(user, "pos:shifts"))) {
      return fail("Unauthorized.", 403);
    }

    const activeShift = await prisma.shift.findFirst({
      where: {
        cashierId: user.id,
        status: "OPEN",
      },
      include: {
        branch: true,
      },
    });

    return ok({ data: activeShift });
  } catch (error) {
    return handleRouteError(error, "Unable to check shift status.");
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || (!hasPermission(user, "pos:sales") && !hasPermission(user, "pos:shifts"))) {
      return fail("Unauthorized.", 403);
    }

    const body = await request.json();
    const startCash = Number(body.startCash || 0);
    const branchId = body.branchId || user.branchId;

    if (isNaN(startCash) || startCash < 0) {
      return fail("Invalid starting cash amount.", 422);
    }

    // Check existing open shift
    const existing = await prisma.shift.findFirst({
      where: {
        cashierId: user.id,
        status: "OPEN",
      },
    });

    if (existing) {
      return fail("You already have an open shift active.", 409);
    }

    const shift = await prisma.shift.create({
      data: {
        cashierId: user.id,
        branchId,
        startCash,
        status: "OPEN",
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "CREATE",
        module: "shifts",
        recordId: shift.id,
        newValue: { startCash, branchId },
      },
    });

    return ok({ data: shift });
  } catch (error) {
    return handleRouteError(error, "Unable to open shift.");
  }
}
