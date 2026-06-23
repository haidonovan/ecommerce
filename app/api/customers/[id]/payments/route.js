import { fail, handleRouteError, ok } from "@/lib/api-response";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || (!hasPermission(user, "pos:sales") && !hasPermission(user, "admin:customers"))) {
      return fail("Unauthorized.", 403);
    }

    const { id } = await params;
    const body = await request.json();
    const amount = Number(body.amount);
    const note = body.note?.trim();

    if (isNaN(amount) || amount <= 0) {
      return fail("Invalid payment amount.", 422);
    }

    const result = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({
        where: { id },
      });

      if (!customer) {
        throw new Error("CUSTOMER_NOT_FOUND");
      }

      const nextBalance = Number(customer.creditBalance) - amount;

      const creditLog = await tx.customerCredit.create({
        data: {
          customerId: id,
          branchId: user.branchId || null,
          type: "PAYMENT",
          amount,
          balance: nextBalance,
          note: note || "Balance payoff payment",
        },
      });

      const updatedCustomer = await tx.customer.update({
        where: { id },
        data: {
          creditBalance: nextBalance,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "UPDATE",
          module: "customers",
          recordId: id,
          oldValue: { creditBalance: Number(customer.creditBalance) },
          newValue: { creditBalance: nextBalance, creditLogId: creditLog.id },
        },
      });

      return updatedCustomer;
    });

    return ok({ data: result });
  } catch (error) {
    if (error.message === "CUSTOMER_NOT_FOUND") {
      return fail("Customer not found.", 404);
    }
    return handleRouteError(error, "Unable to record payment.");
  }
}
