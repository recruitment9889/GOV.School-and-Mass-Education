import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true, description: true },
    });
    return NextResponse.json({ categories });
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch categories" }, { status: 500 });
  }
}
