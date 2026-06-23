import { fail, handleRouteError, ok } from "@/lib/api-response";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || (!hasPermission(user, "pos:sales") && !hasPermission(user, "admin:customers"))) {
      return fail("Unauthorized.", 403);
    }

    const { id } = await params;

    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      return fail("Customer not found.", 404);
    }

    // 1. Fetch all container transactions
    const transactions = await prisma.containerTransaction.findMany({
      where: { customerId: id },
      include: {
        depositType: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 2. Compute outstanding balances
    const ledger = await prisma.containerTransaction.groupBy({
      by: ["depositTypeId", "type"],
      where: { customerId: id },
      _sum: { quantity: true },
    });

    const depositTypes = await prisma.depositType.findMany();
    const typeMap = new Map(depositTypes.map((t) => [t.id, t]));

    const balances = {};
    // Initialize balances
    for (const type of depositTypes) {
      balances[type.id] = {
        depositTypeId: type.id,
        name: type.name,
        depositValue: Number(type.depositValue || 0),
        outstandingQty: 0,
      };
    }

    for (const group of ledger) {
      const typeId = group.depositTypeId;
      const qty = group._sum.quantity || 0;

      if (!balances[typeId]) {
        const type = typeMap.get(typeId);
        balances[typeId] = {
          depositTypeId: typeId,
          name: type ? type.name : "Unknown",
          depositValue: type ? Number(type.depositValue) : 0,
          outstandingQty: 0,
        };
      }

      if (group.type === "ISSUE") {
        balances[typeId].outstandingQty += qty;
      } else if (group.type === "RETURN") {
        balances[typeId].outstandingQty -= qty;
      }
    }

    return ok({
      data: {
        balances: Object.values(balances),
        transactions,
      },
    });
  } catch (error) {
    return handleRouteError(error, "Unable to load container ledger.");
  }
}

export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || (!hasPermission(user, "pos:sales") && !hasPermission(user, "admin:customers"))) {
      return fail("Unauthorized.", 403);
    }

    const { id } = await params;
    const body = await request.json();
    const returns = Array.isArray(body.returns) ? body.returns : [];
    const refundType = body.refundType || "CASH"; // "CASH" | "CREDIT"

    if (!returns.length) {
      return fail("Returns require at least one container item.", 422);
    }

    const result = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({
        where: { id },
      });

      if (!customer) {
        throw new Error("CUSTOMER_NOT_FOUND");
      }

      let totalRefund = 0;
      const logs = [];

      for (const item of returns) {
        const depositTypeId = item.depositTypeId;
        const quantity = Number(item.quantity || 0);

        if (!depositTypeId || quantity <= 0) {
          throw new Error("INVALID_RETURN_ITEM");
        }

        const depType = await tx.depositType.findUnique({
          where: { id: depositTypeId },
        });

        if (!depType) {
          throw new Error("DEPOSIT_TYPE_NOT_FOUND");
        }

        const itemRefund = quantity * Number(depType.depositValue);
        totalRefund += itemRefund;

        // Log container transaction
        const log = await tx.containerTransaction.create({
          data: {
            customerId: id,
            depositTypeId,
            branchId: user.branchId || null,
            type: "RETURN",
            quantity,
          },
        });
        logs.push(log);
      }

      // If credit refund, deduct from customer outstanding credits
      if (refundType === "CREDIT" && totalRefund > 0) {
        const nextBalance = Number(customer.creditBalance) - totalRefund;

        await tx.customer.update({
          where: { id },
          data: {
            creditBalance: nextBalance,
          },
        });

        await tx.customerCredit.create({
          data: {
            customerId: id,
            branchId: user.branchId || null,
            type: "PAYMENT",
            amount: totalRefund,
            balance: nextBalance,
            note: "Deduction from container returns refund",
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "UPDATE",
          module: "containers",
          recordId: id,
          newValue: {
            returnsCount: returns.length,
            totalRefund,
            refundType,
          },
        },
      });

      return {
        customerId: id,
        totalRefund,
        refundType,
        transactions: logs,
      };
    });

    return ok({ data: result });
  } catch (error) {
    if (error.message === "CUSTOMER_NOT_FOUND") {
      return fail("Customer profile not found.", 404);
    }
    if (error.message === "INVALID_RETURN_ITEM" || error.message === "DEPOSIT_TYPE_NOT_FOUND") {
      return fail("One or more return container options are invalid.", 422);
    }
    return handleRouteError(error, "Unable to record container returns.");
  }
}
