const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const products = [
  {
    name: "Avocado Toast Kit",
    category: "Fresh Picks",
    description: "A bright breakfast bundle with ripe avocado, seeded loaf, and citrus seasoning.",
    imageUrl: "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?auto=format&fit=crop&w=900&q=80",
    price: 18.5,
    discountPercent: 10,
    stock: 24,
    ratingAvg: 4.8,
    ratingCount: 18,
  },
  {
    name: "Weekend Market Box",
    category: "Bundles",
    description: "Seasonal produce arranged as a premium delivery box for the home page hero.",
    imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80",
    price: 42,
    discountPercent: 15,
    stock: 16,
    ratingAvg: 4.9,
    ratingCount: 25,
  },
  {
    name: "Berry Energy Mix",
    category: "Snacks",
    description: "Reusable pouch of dried berries, toasted nuts, and dark chocolate fragments.",
    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
    price: 12.75,
    discountPercent: 0,
    stock: 40,
    ratingAvg: 4.7,
    ratingCount: 12,
  },
  {
    name: "Citrus Sunrise Crate",
    category: "Fresh Picks",
    description: "Bright oranges, lemons, and grapefruit curated for breakfast tables and juice bars.",
    imageUrl: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=900&q=80",
    price: 26.4,
    discountPercent: 8,
    stock: 30,
    ratingAvg: 4.6,
    ratingCount: 10,
  },
  {
    name: "Garden Salad Kit",
    category: "Bundles",
    description: "Washed greens, crunchy toppings, and a herb vinaigrette designed for quick lunches.",
    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
    price: 19.95,
    discountPercent: 5,
    stock: 18,
    ratingAvg: 4.7,
    ratingCount: 8,
  },
  {
    name: "Artisan Pantry Pack",
    category: "Pantry",
    description: "Olive oil, sea salt, crackers, and pantry essentials styled as a premium shelf drop.",
    imageUrl: "https://images.unsplash.com/photo-1506617564039-2f3b650b7010?auto=format&fit=crop&w=900&q=80",
    price: 34.5,
    discountPercent: 0,
    stock: 12,
    ratingAvg: 4.5,
    ratingCount: 9,
  },
];

const coupons = [
  {
    code: "WELCOME10",
    type: "PERCENT",
    value: 10,
    description: "Welcome discount for your first order.",
    audience: "EVERYONE",
    isActive: true,
  },
  {
    code: "VIPCLIENT",
    type: "FIXED",
    value: 8,
    description: "Private reward coupon for returning shoppers.",
    audience: "USER",
    userEmail: "client@example.com",
    isActive: true,
  },
];

async function main() {
  for (const product of products) {
    const existing = await prisma.product.findFirst({
      where: {
        name: product.name,
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      await prisma.product.update({
        where: {
          id: existing.id,
        },
        data: product,
      });
    } else {
      await prisma.product.create({
        data: product,
      });
    }
  }

  for (const coupon of coupons) {
    const existingCoupon = await prisma.coupon.findFirst({
      where: {
        code: coupon.code,
      },
      select: {
        id: true,
      },
    });

    if (existingCoupon) {
      await prisma.coupon.update({
        where: {
          id: existingCoupon.id,
        },
        data: coupon,
      });
    } else {
      await prisma.coupon.create({
        data: coupon,
      });
    }
  }

  console.log(`Seeded ${products.length} products and ${coupons.length} coupons.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
