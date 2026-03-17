import { prisma } from "@/lib/prisma";
import { fallbackProducts } from "@/lib/fallback-data";

export function normalizeProduct(product) {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    description: product.description,
    image: product.imageUrl,
    price: Number(product.price),
    discountPercent: product.discountPercent || 0,
    rating: Number(product.ratingAvg || 0),
    ratingCount: product.ratingCount || 0,
    stock: product.stock,
    isActive: product.isActive,
    comments:
      product.comments?.map((entry) => ({
        id: entry.id,
        userEmail: entry.user?.email || "",
        message: entry.message,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        isEdited: entry.updatedAt?.getTime?.() !== entry.createdAt?.getTime?.(),
      })) || [],
  };
}

export async function listCatalogProducts() {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        comments: {
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
        },
      },
    });

    if (!products.length) {
      return fallbackProducts;
    }

    return products.map(normalizeProduct);
  } catch {
    return fallbackProducts;
  }
}

export async function listCatalogCategories() {
  const products = await listCatalogProducts();
  return [...new Set(products.map((product) => product.category))];
}
