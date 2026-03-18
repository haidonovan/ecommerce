import { handleRouteError, ok } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return ok({ data: [] });
    }

    const favorites = await prisma.favorite.findMany({
      where: {
        userId: user.id,
      },
      select: {
        productId: true,
      },
    });

    return ok({
      data: favorites.map((entry) => entry.productId),
    });
  } catch (error) {
    return handleRouteError(error, "Unable to load favorites.");
  }
}
