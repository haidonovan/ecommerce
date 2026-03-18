import { fail, handleRouteError, ok } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return fail("Not authenticated.", 401);
    }

    const { productId } = await params;
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!product || !product.isActive) {
      return fail("Product not found.", 404);
    }

    const existing = await prisma.favorite.findFirst({
      where: {
        userId: user.id,
        productId,
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      await prisma.favorite.delete({
        where: {
          id: existing.id,
        },
      });

      return ok({ isFavorite: false });
    }

    await prisma.favorite.create({
      data: {
        userId: user.id,
        productId,
      },
    });

    return ok({ isFavorite: true });
  } catch (error) {
    return handleRouteError(error, "Unable to update favorites.");
  }
}
