import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  ShieldCheck,
  FileText,
  CheckCircle2,
  XCircle,
  User,
  Phone,
  Mail,
  BadgeCheck,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PropertyApprovalActions } from "./approval-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export const metadata = {
  title: "Property Review | Admin",
};

export default async function AdminPropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  // Fetch property with related data
  const { data: property, error } = await supabase
    .from("properties")
    .select(
      `
      *,
      host_profiles (
        id,
        display_name,
        bio,
        identity_status,
        bank_account_status,
        user_id
      ),
      rooms (
        id,
        name,
        description,
        max_guests,
        base_price,
        status
      )
      `
    )
    .eq("id", id)
    .single();

  if (error || !property) {
    notFound();
  }

  // Fetch host profile details
  const { data: hostProfile } = await supabase
    .from("profiles")
    .select("first_name, last_name, email, phone")
    .eq("id", property.host_profiles?.user_id ?? "")
    .single();

  // Fetch verification cases
  const { data: verificationCases } = await supabase
    .from("verification_cases")
    .select("*")
    .eq("property_id", id)
    .order("created_at", { ascending: false });

  // Fetch property documents
  const { data: documents } = await supabase
    .from("property_documents")
    .select("*")
    .eq("property_id", id);

  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700",
    PENDING_REVIEW: "bg-amber-50 text-amber-700",
    PUBLISHED: "bg-green-50 text-green-700",
    SUSPENDED: "bg-red-50 text-red-700",
  };

  const verificationLabels = [
    "Unverified",
    "Identity Verified",
    "Documents Verified",
    "Tourism Registered",
    "Platform Verified",
  ];

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/admin/properties"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to properties
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 border border-border bg-card p-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-display text-2xl">{property.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge variant={property.status === "PUBLISHED" ? "default" : property.status === "SUSPENDED" ? "destructive" : "secondary"}>
                  {property.status.replace("_", " ")}
                </Badge>
                <Badge variant="secondary">{property.property_type}</Badge>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  {verificationLabels[property.verification_level] ??
                    `Level ${property.verification_level}`}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Submitted{" "}
          {new Date(property.created_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </div>
      </div>

      {/* Three-column layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Property info */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Property information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Type</dt>
                  <dd className="font-medium text-foreground">{property.property_type}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">District</dt>
                  <dd className="font-medium text-foreground">{property.district ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Town</dt>
                  <dd className="font-medium text-foreground">{property.town ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Village</dt>
                  <dd className="font-medium text-foreground">{property.village ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Pincode</dt>
                  <dd className="font-medium text-foreground">{property.pincode ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Check-in</dt>
                  <dd className="font-medium text-foreground">
                    {property.check_in_time ?? "—"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Check-out</dt>
                  <dd className="font-medium text-foreground">
                    {property.check_out_time ?? "—"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Tourism reg.</dt>
                  <dd className="font-medium text-foreground">
                    {property.tourism_registration_number ?? "—"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Tourism status</dt>
                  <dd className="font-medium text-foreground">
                    {property.tourism_registration_status}
                  </dd>
                </div>
              </dl>

              {property.description && (
                <div className="mt-4 border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground">{property.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Host info */}
          <Card>
            <CardHeader>
              <CardTitle>Host information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-primary">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {property.host_profiles?.display_name ?? "Unknown host"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {hostProfile?.first_name} {hostProfile?.last_name}
                  </p>
                </div>
              </div>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {hostProfile?.email ?? "—"}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {hostProfile?.phone ?? "—"}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BadgeCheck className="h-4 w-4" />
                  Identity: {property.host_profiles?.identity_status}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BadgeCheck className="h-4 w-4" />
                  Bank: {property.host_profiles?.bank_account_status}
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        {/* Middle: Documents */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {documents && documents.length > 0 ? (
                <ul className="mt-4 space-y-3">
                  {documents.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-center justify-between rounded-md border border-border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {doc.document_type}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {doc.document_number ?? "No number"}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          doc.verification_status === "VERIFIED"
                            ? "default"
                            : doc.verification_status === "REJECTED"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {doc.verification_status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">No documents uploaded.</p>
              )}
            </CardContent>
          </Card>

          {/* Rooms */}
          <Card>
            <CardHeader>
              <CardTitle>Rooms</CardTitle>
            </CardHeader>
            <CardContent>
              {property.rooms && property.rooms.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Guests</TableHead>
                      <TableHead>Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {property.rooms.map((room: { id: string; name: string; max_guests: number; base_price: number }) => (
                      <TableRow key={room.id}>
                        <TableCell className="font-medium text-foreground">{room.name}</TableCell>
                        <TableCell className="text-muted-foreground">{room.max_guests}</TableCell>
                        <TableCell className="font-semibold text-primary">
                          ₹{Number(room.base_price).toLocaleString("en-IN")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">No rooms configured.</p>
              )}
            </CardContent>
          </Card>

          {/* Verification cases */}
          <Card>
            <CardHeader>
              <CardTitle>Verification history</CardTitle>
            </CardHeader>
            <CardContent>
              {verificationCases && verificationCases.length > 0 ? (
                <ul className="mt-4 space-y-3">
                  {verificationCases.map((vc) => (
                    <li
                      key={vc.id}
                      className="flex items-center justify-between rounded-md border border-border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {vc.verification_type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Risk: {vc.risk_level} • {vc.status}
                        </p>
                      </div>
                      <Badge
                        variant={
                          vc.status === "APPROVED"
                            ? "default"
                            : vc.status === "REJECTED"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {vc.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  No verification cases yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Verification checklist + actions */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Verification checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mt-4 space-y-4">
                <ChecklistSection
                  title="Identity"
                  items={[
                    { label: "Phone verified", done: true },
                    { label: "Email verified", done: true },
                    {
                      label: "ID document valid",
                      done: property.host_profiles?.identity_status === "VERIFIED",
                    },
                  ]}
                />
                <ChecklistSection
                  title="Documents"
                  items={[
                    {
                      label: "Ownership proof",
                      done:
                        documents?.some(
                          (d) =>
                            d.document_type === "OWNERSHIP" &&
                            d.verification_status === "VERIFIED"
                        ) ?? false,
                    },
                    {
                      label: "Tourism registered",
                      done: property.tourism_registration_status === "VERIFIED",
                    },
                    {
                      label: "Address proof",
                      done:
                        documents?.some(
                          (d) =>
                            d.document_type === "ADDRESS_PROOF" &&
                            d.verification_status === "VERIFIED"
                        ) ?? false,
                    },
                  ]}
                />
                <ChecklistSection
                  title="Property"
                  items={[
                    { label: "Description valid", done: !!property.description },
                    {
                      label: "Rooms configured",
                      done: (property.rooms?.length ?? 0) > 0,
                    },
                    {
                      label: "Location valid",
                      done: !!(property.latitude && property.longitude),
                    },
                  ]}
                />
                <ChecklistSection
                  title="Business"
                  items={[
                    {
                      label: "Bank details valid",
                      done: property.host_profiles?.bank_account_status === "VERIFIED",
                    },
                    {
                      label: "Payout setup",
                      done: property.host_profiles?.bank_account_status === "VERIFIED",
                    },
                  ]}
                />
              </div>
            </CardContent>
          </Card>

          {/* Approval actions */}
          <PropertyApprovalActions
            propertyId={property.id}
            currentStatus={property.status}
            verificationLevel={property.verification_level}
          />
        </div>
      </div>
    </div>
  );
}

function ChecklistSection({
  title,
  items,
}: {
  title: string;
  items: { label: string; done: boolean }[];
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-sm">
            {item.done ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 shrink-0 text-muted-foreground/30" />
            )}
            <span className={item.done ? "text-foreground" : "text-muted-foreground"}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
