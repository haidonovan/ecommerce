import { fail, handleRouteError, ok } from "@/lib/api-response";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "admin:procurement")) {
      return fail("Unauthorized.", 403);
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!existing) {
      return fail("Supplier not found.", 404);
    }

    const data = {};
    if (body.name !== undefined) data.name = body.name.trim();
    if (body.phone !== undefined) data.phone = body.phone.trim();
    if (body.email !== undefined) data.email = body.email ? body.email.trim() : null;
    if (body.address !== undefined) data.address = body.address ? body.address.trim() : null;
    if (body.status !== undefined) data.status = body.status;

    // Check duplicates if name or phone changed
    if (data.name && data.name !== existing.name) {
      const dup = await prisma.supplier.findFirst({ where: { name: data.name } });
      if (dup) return fail("Supplier name already in use.", 409);
    }

    if (data.phone && data.phone !== existing.phone) {
      const dup = await prisma.supplier.findFirst({ where: { phone: data.phone } });
      if (dup) return fail("Supplier phone already in use.", 409);
    }

    const updated = await prisma.supplier.update({
      where: { id },
      data,
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "UPDATE",
        module: "suppliers",
        recordId: id,
        oldValue: existing,
        newValue: updated,
      },
    });

    return ok({ data: updated });
  } catch (error) {
    return handleRouteError(error, "Unable to update supplier.");
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "admin:procurement")) {
      return fail("Unauthorized.", 403);
    }

    const { id } = await params;
    const existing = await prisma.supplier.findUnique({
      where: { id },
      include: {
        purchaseOrders: { take: 1 },
      },
    });

    if (!existing) {
      return fail("Supplier not found.", 404);
    }

    if (existing.purchaseOrders.length > 0) {
      // Soft delete by setting status to INACTIVE
      const updated = await prisma.supplier.update({
        where: { id },
        data: { status: "INACTIVE" },
      });
      return ok({ message: "Supplier has purchase orders. Soft-deleted to INACTIVE status.", data: updated });
    }

    await prisma.supplier.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "DELETE",
        module: "suppliers",
        recordId: id,
        oldValue: existing,
        newValue: null,
      },
    });

    return ok({ message: "Supplier deleted successfully." });
  } catch (error) {
    return handleRouteError(error, "Unable to delete supplier.");
  }
}
