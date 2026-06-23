import { fail, handleRouteError, ok } from "@/lib/api-response";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return fail("Not authenticated.", 401);
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "types";

    if (type === "types") {
      const depositTypes = await prisma.depositType.findMany({
        orderBy: { name: "asc" },
      });
      return ok({ data: depositTypes });
    }

    if (type === "assignments") {
      const productId = searchParams.get("productId");
      const where = productId ? { productId } : {};
      const assignments = await prisma.productDeposit.findMany({
        where,
        include: {
          depositType: true,
          product: {
            select: { name: true, sku: true },
          },
        },
      });
      return ok({ data: assignments });
    }

    return fail("Invalid query type.", 422);
  } catch (error) {
    return handleRouteError(error, "Unable to load deposit settings.");
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "admin:settings")) {
      return fail("Unauthorized.", 403);
    }

    const body = await request.json();
    const { action } = body;

    if (action === "createType") {
      const name = body.name?.trim();
      const description = body.description?.trim() || null;

      if (!name) {
        return fail("Deposit type name is required.", 422);
      }

      const existing = await prisma.depositType.findUnique({
        where: { name },
      });

      if (existing) {
        return fail("Deposit type already exists.", 409);
      }

      const depositType = await prisma.depositType.create({
        data: { name, description },
      });

      return ok({ data: depositType });
    }

    if (action === "assignProduct") {
      const { productId, depositTypeId } = body;
      const quantity = Number(body.quantity || 1);
      const depositAmount = Number(body.depositAmount || 0);

      if (!productId || !depositTypeId || isNaN(depositAmount) || depositAmount <= 0) {
        return fail("Invalid assignment parameters.", 422);
      }

      const assignment = await prisma.productDeposit.create({
        data: {
          productId,
          depositTypeId,
          quantity,
          depositAmount,
        },
        include: {
          depositType: true,
        },
      });

      return ok({ data: assignment });
    }

    if (action === "removeAssignment") {
      const { id } = body;
      if (!id) {
        return fail("Assignment ID is required.", 422);
      }

      await prisma.productDeposit.delete({
        where: { id },
      });

      return ok({ message: "Deposit assignment removed successfully." });
    }

    return fail("Invalid action specified.", 422);
  } catch (error) {
    return handleRouteError(error, "Unable to process deposit request.");
  }
}
