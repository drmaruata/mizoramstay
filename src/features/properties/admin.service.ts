import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Service-role client used for privileged admin workflows.
 * Bypasses RLS — must only be used server-side.
 */
type AdminClient = ReturnType<typeof createAdminClient>;

export interface ApprovePropertyInput {
  propertyId: string;
  adminId: string;
  verificationLevel?: number;
  notes?: string | null;
}

export interface RejectPropertyInput {
  propertyId: string;
  adminId: string;
  reason: string;
  requestedChanges?: string[];
}

export interface RequestChangesInput {
  propertyId: string;
  adminId: string;
  requiredChanges: string[];
}

export class PropertyAdminService {
  private admin: AdminClient;

  constructor(admin: AdminClient = createAdminClient()) {
    this.admin = admin;
  }

  /**
   * Approve a property for publication.
   * Sets status to PUBLISHED, records verification level, writes an audit log,
   * and closes any open verification case.
   */
  async approveProperty(input: ApprovePropertyInput): Promise<{ id: string }> {
    const { propertyId, adminId, verificationLevel = 4, notes } = input;

    // Fetch current state for audit trail.
    const { data: property, error: fetchError } = await this.admin
      .from("properties")
      .select("id, status, verification_level")
      .eq("id", propertyId)
      .single();

    if (fetchError || !property) {
      throw new Error("Property not found");
    }

    const now = new Date().toISOString();

    const { data: updated, error } = await this.admin
      .from("properties")
      .update({
        status: "PUBLISHED",
        verification_level: verificationLevel,
        published_at: now,
        updated_at: now,
      })
      .eq("id", propertyId)
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    await this.admin.from("audit_logs").insert({
      actor_identity: adminId,
      entity_type: "property",
      entity_id: propertyId,
      action: "APPROVED",
      old_values: {
        status: property.status,
        verification_level: property.verification_level,
      },
      new_values: { status: "PUBLISHED", verification_level: verificationLevel },
      created_at: now,
    });

    await this.admin
      .from("verification_cases")
      .update({
        status: "APPROVED",
        completed_at: now,
        notes: notes ?? null,
      })
      .eq("property_id", propertyId)
      .eq("status", "OPEN");

    return updated;
  }

  /**
   * Reject a property with a reason.
   * Sets status to SUSPENDED, records the reason, writes an audit log, closes
   * the verification case, and notifies the host.
   */
  async rejectProperty(input: RejectPropertyInput): Promise<{ id: string }> {
    const { propertyId, adminId, reason, requestedChanges = [] } = input;

    const { data: property, error: fetchError } = await this.admin
      .from("properties")
      .select("id, status, verification_level")
      .eq("id", propertyId)
      .single();

    if (fetchError || !property) {
      throw new Error("Property not found");
    }

    const now = new Date().toISOString();

    const { data: updated, error } = await this.admin
      .from("properties")
      .update({
        status: "SUSPENDED",
        updated_at: now,
      })
      .eq("id", propertyId)
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    await this.admin.from("audit_logs").insert({
      actor_identity: adminId,
      entity_type: "property",
      entity_id: propertyId,
      action: "REJECTED",
      old_values: {
        status: property.status,
        verification_level: property.verification_level,
      },
      new_values: { status: "SUSPENDED", reason, requestedChanges },
      created_at: now,
    });

    await this.admin
      .from("verification_cases")
      .update({
        status: "REJECTED",
        completed_at: now,
        notes: reason,
      })
      .eq("property_id", propertyId)
      .eq("status", "OPEN");

    await this.notifyHost(propertyId, "Property rejected", reason);

    return updated;
  }

  /**
   * Request changes from a host without fully rejecting the property.
   * Records the required changes and notifies the host.
   */
  async requestChanges(input: RequestChangesInput): Promise<void> {
    const { propertyId, adminId, requiredChanges } = input;

    const { data: property, error: fetchError } = await this.admin
      .from("properties")
      .select("id, status")
      .eq("id", propertyId)
      .single();

    if (fetchError || !property) {
      throw new Error("Property not found");
    }

    const now = new Date().toISOString();

    await this.admin.from("audit_logs").insert({
      actor_identity: adminId,
      entity_type: "property",
      entity_id: propertyId,
      action: "REQUESTED_CHANGES",
      old_values: { status: property.status },
      new_values: { requiredChanges },
      created_at: now,
    });

    const checklist = requiredChanges.join(", ");
    await this.notifyHost(
      propertyId,
      "Changes requested for your property",
      `Please address the following: ${checklist}`
    );
  }

  /**
   * Create an in-app notification for the property's host.
   */
  private async notifyHost(
    propertyId: string,
    subject: string,
    body: string
  ): Promise<void> {
    const { data: prop } = await this.admin
      .from("properties")
      .select("host_id")
      .eq("id", propertyId)
      .single();

    if (!prop?.host_id) return;

    const { data: hostProfile } = await this.admin
      .from("host_profiles")
      .select("user_id")
      .eq("id", prop.host_id)
      .single();

    if (!hostProfile?.user_id) return;

    await this.admin.from("notifications").insert({
      user_id: hostProfile.user_id,
      type: "SYSTEM",
      channel: "IN_APP",
      subject,
      body,
      status: "PENDING",
    });
  }
}
