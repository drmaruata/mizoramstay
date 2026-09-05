import Link from "next/link";
import { Building2, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { single } from "@/lib/supabase/relations";
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
  title: "Published Properties | Admin",
};

export default async function AdminPublishedPropertiesPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: properties, count } = await supabase
    .from("properties")
    .select(
      `
      id,
      name,
      district,
      town,
      property_type,
      verification_level,
      published_at,
      host_profiles ( display_name )
      `,
      { count: "exact" }
    )
    .eq("status", "PUBLISHED")
    .order("published_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[.18em] text-primary">
            Properties
          </p>
          <h1 className="font-display mt-2 text-3xl">Published</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {count ?? 0} properties live on the marketplace
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/properties/pending">
              <Building2 className="h-4 w-4" />
              Pending
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
                <TableHead className="px-5 py-3 font-semibold text-foreground">Published</TableHead>
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
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span className="text-xs font-medium">
                          Level {property.verification_level}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-muted-foreground">
                      {property.published_at
                        ? new Date(property.published_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <Link href={`/admin/properties/${property.id}`}>
                        <Button variant="outline" size="sm" className="gap-1.5">
                          View
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
          <CheckCircle2 className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-medium text-foreground">No published properties</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Properties will appear here once approved.
          </p>
        </div>
      )}
    </div>
  );
}
