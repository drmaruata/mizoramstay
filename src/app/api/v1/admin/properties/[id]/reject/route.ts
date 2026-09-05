import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { PropertyAdminService } from "@/features/properties/admin.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const admin = await requireAdmin();

  const body = await request.json().catch(() => ({}));
  const { reason, requested_changes } = body;

  if (!reason || typeof reason !== "string" || !reason.trim()) {
    return NextResponse.json(
      { error: "A rejection reason is required" },
      { status: 400 }
    );
  }

  try {
    const service = new PropertyAdminService();
    const result = await service.rejectProperty({
      propertyId: id,
      adminId: admin.id,
      reason: reason.trim(),
      requestedChanges: Array.isArray(requested_changes)
        ? requested_changes
        : [],
    });
    return NextResponse.json({ success: true, property: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed";
    const status = message === "Property not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
