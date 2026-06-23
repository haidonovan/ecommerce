import { fail, handleRouteError, ok } from "@/lib/api-response";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || (!hasPermission(user, "pos:sales") && !hasPermission(user, "admin:customers"))) {
      return fail("Unauthorized.", 403);
    }

    const { id } = await params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        customerType: true,
        addresses: true,
        notes: true,
        credits: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        containerTx: {
          include: {
            depositType: true,
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });

    if (!customer) {
      return fail("Customer not found.", 404);
    }

    return ok({ data: customer });
  } catch (error) {
    return handleRouteError(error, "Unable to load customer details.");
  }
}

export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "admin:customers")) {
      return fail("Unauthorized.", 403);
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existing) {
      return fail("Customer not found.", 404);
    }

    const data = {};
    if (body.name !== undefined) data.name = body.name.trim();
    if (body.email !== undefined) data.email = body.email ? body.email.trim() : null;
    if (body.customerTypeId !== undefined) data.customerTypeId = body.customerTypeId;
    if (body.creditLimit !== undefined) data.creditLimit = Number(body.creditLimit || 0);

    if (body.phone !== undefined) {
      const phone = body.phone.trim();
      if (phone !== existing.phone) {
        const duplicate = await prisma.customer.findUnique({
          where: { phone },
        });
        if (duplicate) {
          return fail("Phone number already assigned to another customer.", 409);
        }
        data.phone = phone;
      }
    }

    const updated = await prisma.customer.update({
      where: { id },
      data,
      include: {
        customerType: true,
      },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "UPDATE",
        module: "customers",
        recordId: id,
        oldValue: existing,
        newValue: updated,
      },
    });

    return ok({ data: updated });
  } catch (error) {
    return handleRouteError(error, "Unable to update customer.");
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "admin:customers")) {
      return fail("Unauthorized.", 403);
    }

    const { id } = await params;
    const existing = await prisma.customer.findUnique({
      where: { id },
      include: {
        sales: { take: 1 },
        orders: { take: 1 },
      },
    });

    if (!existing) {
      return fail("Customer not found.", 404);
    }

    if (existing.sales.length > 0 || existing.orders.length > 0) {
      return fail("Cannot delete customer with transaction history.", 409);
    }

    await prisma.customer.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "DELETE",
        module: "customers",
        recordId: id,
        oldValue: existing,
        newValue: null,
      },
    });

    return ok({ message: "Customer deleted successfully." });
  } catch (error) {
    return handleRouteError(error, "Unable to delete customer.");
  }
}
