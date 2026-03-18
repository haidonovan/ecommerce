import { fail, handleRouteError, ok } from "@/lib/api-response";
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
  } catch (error) {
    return handleRouteError(error, "Unable to load session user.", {
      databaseMessage: "Unable to load session right now because the database is unreachable. Check your Neon connection and try again.",
    });
  }
}
