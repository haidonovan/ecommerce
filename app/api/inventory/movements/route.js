import { fail, handleRouteError, ok } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const admin = await requireAdminUser();

    if (!admin) {
      return fail("Admin access required.", 403);
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 25), 1), 100);

    const movements = await prisma.inventoryMovement.findMany({
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        product: {
          select: {
            name: true,
            sku: true,
          },
        },
      },
    });

    return ok({
      data: movements.map((movement) => ({
        id: movement.id,
        productId: movement.productId,
        productName: movement.product?.name || "Unknown product",
        sku: movement.product?.sku || movement.productId,
        type: movement.type.toLowerCase(),
        channel: movement.channel.toLowerCase(),
        quantity: movement.quantity,
        previousStock: movement.previousStock,
        nextStock: movement.nextStock,
        note: movement.note || "",
        createdAt: movement.createdAt,
      })),
    });
  } catch (error) {
    return handleRouteError(error, "Unable to load inventory movements.");
  }
}
