import { fail, ok } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeComment } from "@/lib/serializers";

export async function GET(request) {
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
}

export async function POST(request) {
  const user = await getCurrentUser();

  if (!user) {
    return fail("Not authenticated.", 401);
  }

  const body = await request.json();

  if (!body.productId || !body.message || body.message.trim().length < 3) {
    return fail("Invalid comment payload.", 422);
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
}
