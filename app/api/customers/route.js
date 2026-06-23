import { fail, handleRouteError, ok } from "@/lib/api-response";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user || (!hasPermission(user, "pos:sales") && !hasPermission(user, "admin:customers"))) {
      return fail("Unauthorized.", 403);
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";

    const where = {};
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        customerType: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return ok({ data: customers });
  } catch (error) {
    return handleRouteError(error, "Unable to fetch customers.");
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || (!hasPermission(user, "pos:sales") && !hasPermission(user, "admin:customers"))) {
      return fail("Unauthorized.", 403);
    }

    const body = await request.json();
    const name = body.name?.trim();
    const phone = body.phone?.trim();
    let customerTypeId = body.customerTypeId;
    const email = body.email?.trim() || null;
    const creditLimit = Number(body.creditLimit || 0);

    if (!name || !phone) {
      return fail("Name and phone number are required.", 422);
    }

    // Check duplicate phone
    const existing = await prisma.customer.findUnique({
      where: { phone },
    });

    if (existing) {
      return fail("Customer with this phone number already exists.", 409);
    }

    // If customerTypeId is not provided, default to RETAIL
    if (!customerTypeId) {
      const retailType = await prisma.customerType.findFirst({
        where: { name: "RETAIL" },
      });
      customerTypeId = retailType?.id;
    }

    if (!customerTypeId) {
      return fail("Invalid customer type configuration.", 422);
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        phone,
        email,
        customerTypeId,
        creditLimit: creditLimit >= 0 ? creditLimit : 0,
        creditBalance: 0,
      },
      include: {
        customerType: true,
      },
    });

    return ok({ data: customer });
  } catch (error) {
    return handleRouteError(error, "Unable to create customer.");
  }
}
