import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get reservation ID from URL
  const url = new URL(request.url);
  const reservationId = url.searchParams.get("id");

  if (!reservationId) {
    return Response.json({ error: "ID tidak diberikan" }, { status: 400 });
  }

  try {
    // Find and delete the reservation
    const reservation = await prisma.reservation.findUnique({
      where: { res_id: reservationId },
    });

    if (!reservation) {
      return Response.json({ error: "Pengajuan tidak ditemukan" }, { status: 404 });
    }

    // Delete the reservation
    await prisma.reservation.delete({
      where: { res_id: reservationId },
    });

    return Response.json(
      { message: "Pengajuan berhasil dihapus" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete error:", error);
    return Response.json(
      { error: "Gagal menghapus pengajuan" },
      { status: 500 }
    );
  }
}
