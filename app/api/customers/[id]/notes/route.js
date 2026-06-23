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
    const noteContent = body.note?.trim();

    if (!noteContent) {
      return fail("Note content cannot be empty.", 422);
    }

    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      return fail("Customer not found.", 404);
    }

    const note = await prisma.customerNote.create({
      data: {
        customerId: id,
        note: noteContent,
        cashierId: user.id,
      },
    });

    return ok({ data: note });
  } catch (error) {
    return handleRouteError(error, "Unable to save customer note.");
  }
}
