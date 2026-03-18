import { fail, handleRouteError, ok } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeComment } from "@/lib/serializers";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return fail("productId is required.", 422);
    }

    const comments = await prisma.comment.findMany({
      where: {
        productId,
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return ok({
      data: comments.map(serializeComment),
    });
  } catch (error) {
    return handleRouteError(error, "Unable to load comments.");
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return fail("Not authenticated.", 401);
    }

    const body = await request.json();

    if (!body.productId || !body.message || body.message.trim().length < 3) {
      return fail("Invalid comment payload.", 422);
    }

    const product = await prisma.product.findUnique({
      where: {
        id: body.productId,
      },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!product || !product.isActive) {
      return fail("Product not found.", 404);
    }

    const comment = await prisma.comment.create({
      data: {
        productId: body.productId,
        userId: user.id,
        message: body.message.trim(),
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    return ok({
      data: serializeComment(comment),
    });
  } catch (error) {
    return handleRouteError(error, "Unable to add comment.");
  }
}
