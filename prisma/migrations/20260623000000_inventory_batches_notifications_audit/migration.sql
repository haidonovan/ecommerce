ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "nameKh" TEXT;

CREATE TABLE IF NOT EXISTS "InventoryBatch" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "batchNumber" TEXT NOT NULL,
  "qty" INTEGER NOT NULL DEFAULT 0,
  "initialQty" INTEGER NOT NULL DEFAULT 0,
  "costPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "expiryDate" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventoryBatch_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "InventoryBatch_expiryDate_idx" ON "InventoryBatch"("expiryDate");
CREATE INDEX IF NOT EXISTS "InventoryBatch_productId_branchId_expiryDate_idx" ON "InventoryBatch"("productId", "branchId", "expiryDate");

DO $$ BEGIN
  ALTER TABLE "InventoryBatch" ADD CONSTRAINT "InventoryBatch_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "InventoryBatch" ADD CONSTRAINT "InventoryBatch_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "InventoryMovement" ADD COLUMN IF NOT EXISTS "batchId" TEXT;

DO $$ BEGIN
  ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "InventoryBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
