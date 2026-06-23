import { fail, handleRouteError, ok } from "@/lib/api-response";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "admin:procurement")) {
      return fail("Unauthorized.", 403);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "ACTIVE";

    const suppliers = await prisma.supplier.findMany({
      where: status !== "ALL" ? { status } : {},
      orderBy: { name: "asc" },
    });

    return ok({ data: suppliers });
  } catch (error) {
    return handleRouteError(error, "Unable to fetch suppliers.");
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "admin:procurement")) {
      return fail("Unauthorized.", 403);
    }

    const body = await request.json();
    const name = body.name?.trim();
    const phone = body.phone?.trim();
    const email = body.email?.trim() || null;
    const address = body.address?.trim() || null;

    if (!name || !phone) {
      return fail("Name and phone number are required.", 422);
    }

    const existing = await prisma.supplier.findFirst({
      where: {
        OR: [
          { name },
          { phone },
        ],
      },
    });

    if (existing) {
      return fail("Supplier with this name or phone number already exists.", 409);
    }

    const supplier = await prisma.supplier.create({
      data: {
        name,
        phone,
        email,
        address,
        status: "ACTIVE",
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "CREATE",
        module: "suppliers",
        recordId: supplier.id,
        newValue: supplier,
      },
    });

    return ok({ data: supplier });
  } catch (error) {
    return handleRouteError(error, "Unable to create supplier.");
  }
}
