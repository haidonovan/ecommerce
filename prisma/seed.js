const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const starterProducts = [
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

const imageLibrary = {
  market: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80",
  salad: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
  citrus: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=900&q=80",
  pantry: "https://images.unsplash.com/photo-1506617564039-2f3b650b7010?auto=format&fit=crop&w=900&q=80",
  breakfast: "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?auto=format&fit=crop&w=900&q=80",
};

const descriptionFinishes = [
  "prepared for fast weekday cooking and easy fridge restocks.",
  "portioned for family meals, lunch prep, and repeat weekly orders.",
  "packed for bright shelf appeal with steady quality across every delivery.",
  "arranged for quick home use with balanced portions and simple storage.",
  "designed to feel fresh, practical, and easy to reorder every week.",
];

function createCategoryProducts({
  category,
  basePrice,
  priceStep,
  stockBase,
  ratingBase,
  imagePool,
  names,
  descriptionLead,
}) {
  const discountPattern = [0, 5, 10, 12, 15, 8];

  return names.map((name, index) => {
    const band = Math.floor(index / 5);
    const price = Number((basePrice + (index % 5) * priceStep + band * (priceStep * 0.85)).toFixed(2));
    const ratingAvg = Number(Math.min(ratingBase + (index % 5) * 0.08, 4.9).toFixed(1));

    return {
      name,
      category,
      description: `${descriptionLead} ${descriptionFinishes[index % descriptionFinishes.length]}`,
      imageUrl: imagePool[index % imagePool.length],
      price,
      discountPercent: discountPattern[index % discountPattern.length],
      stock: stockBase + ((index * 7) % 26),
      ratingAvg,
      ratingCount: 10 + index * 3,
    };
  });
}

const generatedProducts = [
  ...createCategoryProducts({
    category: "Fruit Boxes",
    basePrice: 15.9,
    priceStep: 2.1,
    stockBase: 18,
    ratingBase: 4.4,
    imagePool: [imageLibrary.citrus, imageLibrary.market, imageLibrary.breakfast],
    descriptionLead: "A fruit-forward box built for breakfast tables, snack trays, and home juicing.",
    names: [
      "Citrus Dawn Crate",
      "Tropical Harvest Box",
      "Ruby Orchard Mix",
      "Weekend Berry Basket",
      "Mango Share Pack",
      "Green Apple Family Box",
      "Pear & Plum Crate",
      "Morning Vitamin Box",
      "Juice Bar Fruit Pack",
      "Golden Pineapple Pair",
      "Melon Cooler Bundle",
      "Market Grape Assortment",
      "Stone Fruit Table Box",
      "Dragon Fruit Discovery Pack",
      "Cherry Snack Carton",
      "Papaya Breakfast Crate",
      "Mixed Citrus Party Box",
      "Fresh Fig Selection",
      "Lychee Treat Pack",
      "Orchard Favorites Crate",
    ],
  }),
  ...createCategoryProducts({
    category: "Salad Kits",
    basePrice: 11.4,
    priceStep: 1.65,
    stockBase: 16,
    ratingBase: 4.5,
    imagePool: [imageLibrary.salad, imageLibrary.market, imageLibrary.breakfast],
    descriptionLead: "A ready-to-build salad kit designed for fast lunches, dinners, and healthier weekly prep.",
    names: [
      "Mediterranean Crunch Bowl",
      "Crisp Garden Lunch Kit",
      "Herb Lemon Salad Set",
      "Protein Greens Meal Kit",
      "Rainbow Veggie Bowl",
      "Caesar Prep Kit",
      "Avocado Greens Box",
      "Market Lettuce Bundle",
      "Fresh Herb Toss Kit",
      "Chickpea Crunch Bowl",
      "Spinach Picnic Salad",
      "Kale Balance Kit",
      "Tomato Basil Toss Pack",
      "Cucumber Feta Bowl",
      "Roasted Veg Lunch Kit",
      "Spring Greens Counter Pack",
      "Family Salad Dinner Set",
      "Arugula Citrus Kit",
      "Crunchy Slaw Bowl",
      "Chef Greens Prep Box",
    ],
  }),
  ...createCategoryProducts({
    category: "Pantry Staples",
    basePrice: 8.9,
    priceStep: 2.45,
    stockBase: 14,
    ratingBase: 4.3,
    imagePool: [imageLibrary.pantry, imageLibrary.market, imageLibrary.breakfast],
    descriptionLead: "A shelf-stable pantry staple selected for reliable home cooking, batch prep, and weekly restocks.",
    names: [
      "Olive Oil Reserve",
      "Sea Salt Pantry Jar",
      "Wholegrain Pasta Set",
      "Brown Rice Family Bag",
      "Tomato Sauce Duo",
      "Black Bean Kitchen Pack",
      "Chickpea Cupboard Box",
      "Soup Base Essentials",
      "Roasted Nut Pantry Mix",
      "Everyday Cracker Tin",
      "Breakfast Oat Refill",
      "Curry Spice Pantry Kit",
      "Baking Shelf Starter",
      "Honey & Jam Pairing",
      "Sourdough Spread Set",
      "Kitchen Staples Carton",
      "Rice & Grain Reserve",
      "Pasta Night Pantry Pack",
      "Quick Meal Cupboard Box",
      "Home Chef Shelf Bundle",
    ],
  }),
  ...createCategoryProducts({
    category: "Breakfast",
    basePrice: 7.8,
    priceStep: 1.85,
    stockBase: 15,
    ratingBase: 4.4,
    imagePool: [imageLibrary.breakfast, imageLibrary.citrus, imageLibrary.salad],
    descriptionLead: "A breakfast-ready item chosen for quick starts, lighter mornings, and simple table prep.",
    names: [
      "Sunrise Toast Set",
      "Berry Yogurt Morning Pack",
      "Granola Bowl Starter",
      "Honey Fruit Breakfast Box",
      "Nut Butter Toast Kit",
      "Citrus Morning Tray",
      "Protein Oat Cup Set",
      "Early Market Brunch Box",
      "Avocado Breakfast Duo",
      "Family Pancake Pantry Set",
      "Morning Smoothie Pack",
      "Weekend Brunch Counter Box",
      "Golden Waffle Topping Kit",
      "Muesli Morning Refill",
      "Toast & Spread Table Kit",
      "Fruit and Yogurt Pairing",
      "Quick Start Breakfast Box",
      "Morning Crunch Pantry Pack",
      "Brunch Basket Reserve",
      "Coffee Break Snack Tray",
    ],
  }),
  ...createCategoryProducts({
    category: "Market Boxes",
    basePrice: 19.5,
    priceStep: 3.15,
    stockBase: 10,
    ratingBase: 4.6,
    imagePool: [imageLibrary.market, imageLibrary.citrus, imageLibrary.pantry, imageLibrary.salad],
    descriptionLead: "A premium mixed-produce box arranged for visual impact, practical use, and higher-value weekly orders.",
    names: [
      "Chef Counter Produce Box",
      "Family Dinner Market Chest",
      "Seasonal Greens Market Box",
      "Premium Produce Reserve",
      "Home Host Market Crate",
      "Weekly Table Harvest Box",
      "Fresh Vendor Produce Pack",
      "Signature Market Chest",
      "Produce Crowd-Pleaser Box",
      "Kitchen Prep Market Kit",
      "Large Family Harvest Box",
      "Host Pantry and Produce Box",
      "Vegetable Drawer Refill",
      "Farmstand Table Crate",
      "Meal Prep Produce Box",
      "Fresh Vendor Favorites",
      "Weekly Cook Market Box",
      "Balanced Harvest Chest",
      "Garden Produce Reserve",
      "Deluxe Market Counter Box",
    ],
  }),
];

const products = [...starterProducts, ...generatedProducts];

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

async function upsertProduct(product) {
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
    return;
  }

  await prisma.product.create({
    data: product,
  });
}

async function upsertCoupon(coupon) {
  const existing = await prisma.coupon.findFirst({
    where: {
      code: coupon.code,
    },
    select: {
      id: true,
    },
  });

  if (existing) {
    await prisma.coupon.update({
      where: {
        id: existing.id,
      },
      data: coupon,
    });
    return;
  }

  await prisma.coupon.create({
    data: coupon,
  });
}

async function main() {
  for (const product of products) {
    await upsertProduct(product);
  }

  for (const coupon of coupons) {
    await upsertCoupon(coupon);
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
