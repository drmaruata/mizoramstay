import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { PropertyAdminService } from "@/features/properties/admin.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const admin = await requireAdmin();

  const body = await request.json();
  const { required_changes = [] } = body;

  if (!Array.isArray(required_changes) || required_changes.length === 0) {
    return NextResponse.json(
      { error: "At least one required change is needed" },
      { status: 400 }
    );
  }

  try {
    const service = new PropertyAdminService();
    await service.requestChanges({
      propertyId: id,
      adminId: admin.id,
      requiredChanges: required_changes,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed";
    const status = message === "Property not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
