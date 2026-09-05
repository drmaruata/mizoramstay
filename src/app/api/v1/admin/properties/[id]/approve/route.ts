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
  const { verification_level, notes } = body;

  try {
    const service = new PropertyAdminService();
    const result = await service.approveProperty({
      propertyId: id,
      adminId: admin.id,
      verificationLevel:
        typeof verification_level === "number" ? verification_level : 4,
      notes: typeof notes === "string" ? notes : null,
    });
    return NextResponse.json({ success: true, property: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed";
    const status = message === "Property not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
