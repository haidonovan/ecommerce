import { NextResponse } from "next/server";

import { listCatalogCategories } from "@/lib/catalog";

export async function GET() {
  return NextResponse.json({
    data: await listCatalogCategories(),
  });
}
