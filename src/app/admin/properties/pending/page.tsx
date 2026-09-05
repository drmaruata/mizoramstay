import Link from "next/link";
import {
  Building2,
  ArrowRight,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { single } from "@/lib/supabase/relations";
import { PropertyFilters } from "./property-filters";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Pending Properties | Admin",
};

export default async function AdminPendingPropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAdmin();
  const params = await searchParams;

  const district = typeof params.district === "string" ? params.district : "";
  const type = typeof params.type === "string" ? params.type : "";
  const sort = typeof params.sort === "string" ? params.sort : "oldest";
  const page = typeof params.page === "string" ? parseInt(params.page) || 1 : 1;
  const pageSize = 10;

  const supabase = await createClient();

  // Build query
  let query = supabase
    .from("properties")
    .select(
      `
      id,
      name,
      district,
      town,
      property_type,
      verification_level,
      tourism_registration_status,
      created_at,
      host_profiles ( display_name )
      `,
      { count: "exact" }
    )
    .eq("status", "PENDING_REVIEW");

  if (district) query = query.eq("district", district);
  if (type) query = query.eq("property_type", type);

  if (sort === "newest") {
    query = query.order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: true });
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data: properties, count } = await query;

  // Fetch distinct districts for filter
  const { data: districts } = await supabase
    .from("properties")
    .select("district")
    .eq("status", "PENDING_REVIEW")
    .not("district", "is", null);

  const districtOptions = Array.from(
    new Set((districts ?? []).map((d) => d.district).filter(Boolean))
  ).sort();

  const totalPages = Math.ceil((count ?? 0) / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[.18em] text-primary">
            Properties
          </p>
          <h1 className="font-display mt-2 text-3xl">Pending review</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {count ?? 0} properties awaiting verification
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/properties/published">
              <Building2 className="h-4 w-4" />
              Published
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/properties/rejected">
              <XCircle className="h-4 w-4" />
              Rejected
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <PropertyFilters
        district={district}
        type={type}
        sort={sort}
        districtOptions={districtOptions}
      />

      {/* Properties table */}
      {properties && properties.length > 0 ? (
        <div className="overflow-x-auto border border-border bg-background">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-muted">
                <TableHead className="px-5 py-3 font-semibold text-foreground">Property</TableHead>
                <TableHead className="px-5 py-3 font-semibold text-foreground">Host</TableHead>
                <TableHead className="px-5 py-3 font-semibold text-foreground">Location</TableHead>
                <TableHead className="px-5 py-3 font-semibold text-foreground">Type</TableHead>
                <TableHead className="px-5 py-3 font-semibold text-foreground">Verification</TableHead>
                <TableHead className="px-5 py-3 font-semibold text-foreground">Submitted</TableHead>
                <TableHead className="px-5 py-3 font-semibold text-foreground">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((property) => {
                const host = single<{ display_name: string | null }>(
                  property.host_profiles
                );
                return (
                  <TableRow key={property.id} className="hover:bg-accent">
                    <TableCell className="px-5 py-4">
                      <Link
                        href={`/admin/properties/${property.id}`}
                        className="font-medium text-foreground hover:text-primary"
                      >
                        {property.name}
                      </Link>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-muted-foreground">
                      {host?.display_name ?? "Unknown"}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-muted-foreground">
                      {property.district ?? "—"}
                      {property.town ? `, ${property.town}` : ""}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <Badge variant="secondary">{property.property_type}</Badge>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        <span className="text-xs font-medium">
                          Level {property.verification_level}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Tourism: {property.tourism_registration_status}
                      </p>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-muted-foreground">
                      {new Date(property.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <Link href={`/admin/properties/${property.id}`}>
                        <Button size="sm" className="gap-1.5">
                          Review
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="border border-dashed border-border bg-background p-12 text-center">
          <Search className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-medium text-foreground">No pending properties</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {district || type
              ? "Try clearing your filters."
              : "All properties have been reviewed."}
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Button asChild variant="outline" size="sm">
                <Link
                  href={`/admin/properties/pending?page=${page - 1}${district ? `&district=${district}` : ""}${type ? `&type=${type}` : ""}`}
                >
                  Previous
                </Link>
              </Button>
            )}
            {page < totalPages && (
              <Button asChild variant="outline" size="sm">
                <Link
                  href={`/admin/properties/pending?page=${page + 1}${district ? `&district=${district}` : ""}${type ? `&type=${type}` : ""}`}
                >
                  Next
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
