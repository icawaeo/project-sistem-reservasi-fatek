import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { isSuperadminUser } from "@/lib/admin-access";
import { deleteTemplate, getTemplate, setActiveTemplate, updateTemplate } from "@/lib/template-store";
import { getRequestLogMeta, logServerError } from "@/lib/server-logger";

export const runtime = "nodejs";

const ensureSuperadmin = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (!isSuperadminUser(session.user)) {
    return { ok: false as const, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { ok: true as const };
};

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await ensureSuperadmin();
    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await params;
    const template = await getTemplate(id);
    if (!template) {
      return NextResponse.json({ error: "Template tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    logServerError("[api/admin/templates/:id] Failed to fetch template", error, getRequestLogMeta(request));
    return NextResponse.json({ error: "Gagal mengambil template." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await ensureSuperadmin();
    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Body JSON tidak valid." }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Body JSON tidak valid." }, { status: 400 });
    }

    const action = (body as { action?: unknown }).action;

    if (action === "setActive") {
      const updated = await setActiveTemplate(id);
      if (!updated) {
        return NextResponse.json({ error: "Template tidak ditemukan." }, { status: 404 });
      }

      return NextResponse.json(updated);
    }

    if (action === "updateMapping") {
      const mapping = (body as { mapping?: unknown }).mapping;
      if (!mapping || typeof mapping !== "object" || Array.isArray(mapping)) {
        return NextResponse.json({ error: "Mapping tidak valid." }, { status: 400 });
      }

      const updated = await updateTemplate(id, { mapping: mapping as Record<string, string | null> });
      if (!updated) {
        return NextResponse.json({ error: "Template tidak ditemukan." }, { status: 404 });
      }

      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Aksi tidak dikenal." }, { status: 400 });
  } catch (error) {
    logServerError("[api/admin/templates/:id] Failed to update template", error, getRequestLogMeta(request));
    return NextResponse.json({ error: "Gagal memperbarui template." }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: RouteParams) {
  try {
    const auth = await ensureSuperadmin();
    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await params;
    const ok = await deleteTemplate(id);

    if (!ok) {
      return NextResponse.json({ error: "Template tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    logServerError("[api/admin/templates/:id] Failed to delete template", error, {
      method: "DELETE",
      path: "/api/admin/templates/:id",
    });
    return NextResponse.json({ error: "Gagal menghapus template." }, { status: 500 });
  }
}
