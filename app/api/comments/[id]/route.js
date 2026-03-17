import { fail, ok } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeComment } from "@/lib/serializers";

async function loadComment(id) {
  return prisma.comment.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
    },
  });
}

export async function PATCH(request, { params }) {
  const user = await getCurrentUser();

  if (!user) {
    return fail("Not authenticated.", 401);
  }

  const { id } = await params;
  const body = await request.json();

  if (!body.message || body.message.trim().length < 3) {
    return fail("Invalid comment payload.", 422);
  }

  const comment = await loadComment(id);

  if (!comment) {
    return fail("Comment not found.", 404);
  }

  if (comment.userId !== user.id && user.role !== "ADMIN") {
    return fail("Not allowed.", 403);
  }

  const updated = await prisma.comment.update({
    where: { id },
    data: {
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
    data: serializeComment(updated),
  });
}

export async function DELETE(_request, { params }) {
  const user = await getCurrentUser();

  if (!user) {
    return fail("Not authenticated.", 401);
  }

  const { id } = await params;
  const comment = await loadComment(id);

  if (!comment) {
    return fail("Comment not found.", 404);
  }

  if (comment.userId !== user.id && user.role !== "ADMIN") {
    return fail("Not allowed.", 403);
  }

  await prisma.comment.delete({
    where: { id },
  });

  return ok({
    success: true,
  });
}
