import { fail, ok } from "@/lib/api-response";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.id) {
      return fail("Not authenticated.", 401);
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.id,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return fail("Session user not found.", 404);
    }

    return ok({
      user,
    });
  } catch {
    return fail("Unable to load session user.", 500);
  }
}
