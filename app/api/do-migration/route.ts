import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const buildings = await prisma.building.findMany();
    let updatedCount = 0;
    const newData = [];

    for (const building of buildings) {
      if (building.building_imageUrl) {
        newData.push({ name: building.building_name, image: building.building_imageUrl });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Terdapat ${buildings.length} data gedung`,
      newData 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
