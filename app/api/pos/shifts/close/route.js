import { fail, handleRouteError, ok } from "@/lib/api-response";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || (!hasPermission(user, "pos:sales") && !hasPermission(user, "pos:shifts"))) {
      return fail("Unauthorized.", 403);
    }

    const body = await request.json();
    const endCashPhys = Number(body.endCashPhys);

    if (isNaN(endCashPhys) || endCashPhys < 0) {
      return fail("Invalid physical counted cash.", 422);
    }

    const result = await prisma.$transaction(async (tx) => {
      const shift = await tx.shift.findFirst({
        where: {
          cashierId: user.id,
          status: "OPEN",
        },
      });

      if (!shift) {
        throw new Error("NO_OPEN_SHIFT");
      }

      // Calculate cash collected
      const sales = await tx.sale.findMany({
        where: { shiftId: shift.id },
        include: {
          payments: true,
        },
      });

      let cashCollected = 0;
      for (const sale of sales) {
        for (const pay of sale.payments) {
          if (pay.method.toLowerCase() === "cash") {
            if (pay.currency === "KHR") {
              cashCollected += Number(pay.amount) / 4000;
            } else {
              cashCollected += Number(pay.amount);
            }
          }
        }
      }

      const endCashCalc = Number(shift.startCash) + cashCollected;
      const discrepancy = endCashPhys - endCashCalc;

      const closedShift = await tx.shift.update({
        where: { id: shift.id },
        data: {
          status: "CLOSED",
          closeTime: new Date(),
          endCashCalc,
          endCashPhys,
          discrepancy,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "UPDATE",
          module: "shifts",
          recordId: shift.id,
          newValue: {
            status: "CLOSED",
            endCashCalc,
            endCashPhys,
            discrepancy,
          },
        },
      });

      return closedShift;
    });

    return ok({ data: result });
  } catch (error) {
    if (error.message === "NO_OPEN_SHIFT") {
      return fail("No active open shift found for this user.", 404);
    }
    return handleRouteError(error, "Unable to close shift.");
  }
}
