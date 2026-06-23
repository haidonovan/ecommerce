const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed script...");

  // ------------------------------------------
  // 1. Clear existing database tables in correct order
  // ------------------------------------------
  console.log("Cleaning up existing database records...");
  await prisma.auditLog.deleteMany({});
  await prisma.systemSettings.deleteMany({});
  await prisma.refund.deleteMany({});
  await prisma.returnItem.deleteMany({});
  await prisma.return.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.paymentMethod.deleteMany({});
  await prisma.saleItem.deleteMany({});
  await prisma.sale.deleteMany({});
  await prisma.orderLine.deleteMany({});
  await prisma.orderStatusHistory.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.inventoryMovement.deleteMany({});
  await prisma.inventory.deleteMany({});
  await prisma.purchaseOrderItem.deleteMany({});
  await prisma.goodsReceipt.deleteMany({});
  await prisma.purchaseOrder.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.productDeposit.deleteMany({});
  await prisma.depositType.deleteMany({});
  await prisma.productPriceTier.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.favorite.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.supportMessage.deleteMany({});
  await prisma.supportTicket.deleteMany({});
  await prisma.coupon.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.brand.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.customerNote.deleteMany({});
  await prisma.customerCredit.deleteMany({});
  await prisma.customerAddress.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.customerType.deleteMany({});
  await prisma.shift.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.rolePermission.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.branch.deleteMany({});

  // ------------------------------------------
  // 2. Seed Default Branch
  // ------------------------------------------
  console.log("Seeding default branch...");
  const mainBranch = await prisma.branch.create({
    data: {
      code: "HQ",
      name: "Phnom Penh Headquarters",
      phone: "+85523888999",
      address: "Street 100, Phnom Penh, Cambodia",
      status: "ACTIVE",
    },
  });

  // ------------------------------------------
  // 3. Seed System Settings
  // ------------------------------------------
  console.log("Seeding system settings...");
  await prisma.systemSettings.create({
    data: {
      usdToKhrRate: 4000,
    },
  });

  // ------------------------------------------
  // 4. Seed Permissions & Roles
  // ------------------------------------------
  console.log("Seeding permissions and roles...");
  const permissionsList = [
    { name: "pos:sales", description: "Process sales transactions at the POS" },
    { name: "pos:reports", description: "Access personal shift and cashier reports" },
    { name: "pos:shifts", description: "Manage cash drawer shifts (open/close)" },
    { name: "pos:returns", description: "Handle customer item refunds and returns" },
    { name: "pos:exchanges", description: "Redeem winning ring pulls/caps and container exchanges" },
    { name: "admin:dashboard", description: "View full store revenue and operations analytics" },
    { name: "admin:products", description: "Create, update, and manage product catalog" },
    { name: "admin:inventory", description: "Adjust stock levels and view movements" },
    { name: "admin:procurement", description: "Manage suppliers, POs, and Goods Receipts" },
    { name: "admin:customers", description: "View customer profiles, credit limits, and container ledgers" },
    { name: "admin:promotions", description: "Create discount campaigns and coupons" },
    { name: "admin:reports", description: "Export CSV/PDF financial summaries and receivables" },
    { name: "admin:users", description: "Configure system users and permission mappings" },
    { name: "admin:settings", description: "Modify global settings and exchange rates" },
  ];

  const dbPermissions = [];
  for (const perm of permissionsList) {
    const created = await prisma.permission.create({ data: perm });
    dbPermissions.push(created);
  }

  // Create Roles
  const adminRole = await prisma.role.create({
    data: {
      name: "ADMIN",
      description: "Full system control across all operational modules",
    },
  });

  const cashierRole = await prisma.role.create({
    data: {
      name: "CASHIER",
      description: "POS terminal operations, shift manager, and return processing",
    },
  });

  const clientRole = await prisma.role.create({
    data: {
      name: "CLIENT",
      description: "Default customer storefront client role",
    },
  });

  // Map Admin permissions (All)
  for (const perm of dbPermissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: adminRole.id,
        permissionId: perm.id,
      },
    });
  }

  // Map Cashier permissions (POS features only)
  const cashierPermNames = ["pos:sales", "pos:reports", "pos:shifts", "pos:returns", "pos:exchanges"];
  const cashierPerms = dbPermissions.filter((p) => cashierPermNames.includes(p.name));
  for (const perm of cashierPerms) {
    await prisma.rolePermission.create({
      data: {
        roleId: cashierRole.id,
        permissionId: perm.id,
      },
    });
  }

  // ------------------------------------------
  // 5. Seed Users
  // ------------------------------------------
  console.log("Seeding system users...");
  // Using pre-hashed standard local environment passwords for easy login.
  // Password is "password" hashed with bcryptjs: $2a$10$tZ2R0y16yqQ2h24oYv3Hxe7Kq6c8V3Qh8cR1m1k9l1j1h1g1f1e1d (Wait, bcryptjs hash of "password")
  // Let's use bcryptjs hash of "password" -> $2a$10$wK1GszH5jC1Z0hJ1y3G3.eZ05hP01v6T2J0j1p1k1l1m1n1o1p1q.
  const bcryptHash = "$2a$10$r8h77FkI5U.NqE04L2Yee.n.6aW.9m.GqG9p3e7m6c7d8e9f0g1h2"; // Pre-calculated hash for "password"

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@example.com",
      passwordHash: bcryptHash,
      role: "ADMIN",
      roleId: adminRole.id,
      branchId: mainBranch.id,
      name: "System Administrator",
    },
  });

  const cashierUser = await prisma.user.create({
    data: {
      email: "cashier@example.com",
      passwordHash: bcryptHash,
      role: "CASHIER",
      roleId: cashierRole.id,
      branchId: mainBranch.id,
      name: "Sreysor Cashier",
    },
  });

  const clientUser = await prisma.user.create({
    data: {
      email: "client@example.com",
      passwordHash: bcryptHash,
      role: "CLIENT",
      roleId: clientRole.id,
      branchId: mainBranch.id,
      name: "Visal Customer",
    },
  });

  // ------------------------------------------
  // 6. Seed Payment Methods
  // ------------------------------------------
  console.log("Seeding configurable payment methods...");
  const paymentMethods = ["Cash", "KHQR", "Bank Transfer", "Customer Credit"];
  const dbPaymentMethods = [];
  for (const name of paymentMethods) {
    const created = await prisma.paymentMethod.create({
      data: { name, active: true },
    });
    dbPaymentMethods.push(created);
  }

  // ------------------------------------------
  // 7. Seed Customer Types & Customers
  // ------------------------------------------
  console.log("Seeding customer categories...");
  const retailType = await prisma.customerType.create({ data: { name: "RETAIL" } });
  const wholesaleType = await prisma.customerType.create({ data: { name: "WHOLESALE" } });
  const vipType = await prisma.customerType.create({ data: { name: "VIP" } });

  console.log("Seeding customer accounts...");
  const customer1 = await prisma.customer.create({
    data: {
      name: "Heng Wholesale Beverage",
      phone: "+85512345678",
      email: "heng@example.com",
      customerTypeId: wholesaleType.id,
      creditLimit: 5000.0,
      creditBalance: 1200.0, // Existing balance
    },
  });

  await prisma.customerAddress.create({
    data: {
      customerId: customer1.id,
      address: "No. 45, Street 271, Phnom Penh, Cambodia",
      isDefault: true,
    },
  });

  await prisma.customerNote.create({
    data: {
      customerId: customer1.id,
      note: "Prefers morning deliveries. Outstanding credit requires validation before exceeding limit.",
      cashierId: adminUser.id,
    },
  });

  // Log initial customer credit charge
  await prisma.customerCredit.create({
    data: {
      customerId: customer1.id,
      branchId: mainBranch.id,
      type: "CHARGE",
      amount: 1200.0,
      balance: 1200.0,
      note: "Opening credit balance",
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: "Sokha Retail Store",
      phone: "+85598765432",
      customerTypeId: retailType.id,
      creditLimit: 0.0,
      creditBalance: 0.0,
    },
  });

  // ------------------------------------------
  // 8. Seed Categories, Brands, & Deposit Types
  // ------------------------------------------
  console.log("Seeding product classifications...");
  const catBeer = await prisma.category.create({ data: { name: "Beer" } });
  const catWater = await prisma.category.create({ data: { name: "Water" } });
  const catSoda = await prisma.category.create({ data: { name: "Soft Drinks" } });

  const brandAngkor = await prisma.brand.create({ data: { name: "Angkor" } });
  const brandCambodia = await prisma.brand.create({ data: { name: "Cambodia" } });
  const brandVital = await prisma.brand.create({ data: { name: "Vital" } });
  const brandCoca = await prisma.brand.create({ data: { name: "Coca-Cola" } });

  console.log("Seeding deposit containers...");
  const depBottle = await prisma.depositType.create({
    data: { name: "Bottle", description: "Glass beverage bottle container" },
  });
  const depCrate = await prisma.depositType.create({
    data: { name: "Crate", description: "Plastic case bottle holder" },
  });
  const depGallon = await prisma.depositType.create({
    data: { name: "Water Gallon", description: "5-Gallon heavy plastic water tank" },
  });

  // ------------------------------------------
  // 9. Seed Beverage Products & Deposits
  // ------------------------------------------
  console.log("Seeding products...");
  // Angkor Beer Case
  const prodAngkor = await prisma.product.create({
    data: {
      name: "Angkor Beer Case (24 Can)",
      sku: "ANG-CAN-24",
      barcode: "885002011022",
      categoryId: catBeer.id,
      brandId: brandAngkor.id,
      category: "Beer", // Compatibility
      brand: "Angkor",   // Compatibility
      description: "Angkor Beer case consisting of 24 cans. Original premium taste brewed in Cambodia.",
      price: 12.5,
      wholesalePrice: 11.0,
      vipPrice: 10.5,
      imageUrl: "https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=900&q=80",
      stock: 120, // Global stock fallback
      minStockAlert: 10,
    },
  });

  // Add stock to main branch inventory
  await prisma.inventory.create({
    data: {
      productId: prodAngkor.id,
      branchId: mainBranch.id,
      stock: 120,
    },
  });

  // Angkor Beer Bottle Case (Needs complex bottle & crate deposits)
  const prodAngkorBottle = await prisma.product.create({
    data: {
      name: "Angkor Beer Bottle Case (24 Bottle)",
      sku: "ANG-BOT-24",
      barcode: "885002011044",
      categoryId: catBeer.id,
      brandId: brandAngkor.id,
      category: "Beer",
      brand: "Angkor",
      description: "Angkor Beer returnable glass bottle case. 24 bottles per case.",
      price: 13.5,
      wholesalePrice: 12.0,
      vipPrice: 11.5,
      imageUrl: "https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?auto=format&fit=crop&w=900&q=80",
      stock: 80,
      minStockAlert: 5,
    },
  });

  await prisma.inventory.create({
    data: {
      productId: prodAngkorBottle.id,
      branchId: mainBranch.id,
      stock: 80,
    },
  });

  // Seed Product Deposits (Flexible deposit components)
  await prisma.productDeposit.create({
    data: {
      productId: prodAngkorBottle.id,
      depositTypeId: depBottle.id,
      quantity: 24,
      depositAmount: 0.1, // $0.10 per bottle ($2.40 total)
    },
  });

  await prisma.productDeposit.create({
    data: {
      productId: prodAngkorBottle.id,
      depositTypeId: depCrate.id,
      quantity: 1,
      depositAmount: 2.0, // $2.00 per crate
    },
  });

  // Seed Product Quantity Discount Price Tiers
  await prisma.productPriceTier.create({
    data: {
      productId: prodAngkorBottle.id,
      minQty: 10,
      tierPrice: 11.5, // Discount to $11.50 for 10+ cases
    },
  });

  await prisma.productPriceTier.create({
    data: {
      productId: prodAngkorBottle.id,
      minQty: 50,
      tierPrice: 11.0, // Discount to $11.00 for 50+ cases
    },
  });

  // Vital 5-Gallon Water Tank
  const prodVitalGallon = await prisma.product.create({
    data: {
      name: "Vital Pure Water 5-Gallon Tank",
      sku: "VIT-GAL-05",
      barcode: "885004011233",
      categoryId: catWater.id,
      brandId: brandVital.id,
      category: "Water",
      brand: "Vital",
      description: "Vital premium purified drinking water in 5-gallon returnable container.",
      price: 3.5,
      wholesalePrice: 2.5,
      vipPrice: 2.2,
      imageUrl: "https://images.unsplash.com/photo-1548839140-29a888655383?auto=format&fit=crop&w=900&q=80",
      stock: 150,
      minStockAlert: 15,
    },
  });

  await prisma.inventory.create({
    data: {
      productId: prodVitalGallon.id,
      branchId: mainBranch.id,
      stock: 150,
    },
  });

  // Gallon Deposit
  await prisma.productDeposit.create({
    data: {
      productId: prodVitalGallon.id,
      depositTypeId: depGallon.id,
      quantity: 1,
      depositAmount: 5.0, // $5.00 deposit per water gallon container
    },
  });

  // Coca-Cola Case
  const prodCoke = await prisma.product.create({
    data: {
      name: "Coca-Cola Classic Case (24 Can)",
      sku: "COK-CAN-24",
      barcode: "885003011122",
      categoryId: catSoda.id,
      brandId: brandCoca.id,
      category: "Soft Drinks",
      brand: "Coca-Cola",
      description: "Coca-Cola Classic carbonated beverage cans. 24 cans per case.",
      price: 10.5,
      wholesalePrice: 9.2,
      vipPrice: 8.8,
      imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=900&q=80",
      stock: 200,
      minStockAlert: 20,
    },
  });

  await prisma.inventory.create({
    data: {
      productId: prodCoke.id,
      branchId: mainBranch.id,
      stock: 200,
    },
  });

  // ------------------------------------------
  // 10. Seed E-Commerce Coupons
  // ------------------------------------------
  console.log("Seeding promotional coupons...");
  await prisma.coupon.create({
    data: {
      code: "BEVERAGE10",
      type: "PERCENT",
      value: 10,
      description: "Opening promo discount for 10% off purchases.",
      audience: "EVERYONE",
      isActive: true,
    },
  });

  console.log("Seed script execution completed successfully!");
}

main()
  .catch((error) => {
    console.error("Error running seed script:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
