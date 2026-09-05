import Link from "next/link";
import {
  Building2,
  BadgeCheck,
  CalendarCheck,
  Users,
  TrendingUp,
  Star,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { single } from "@/lib/supabase/relations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const supabase = await createClient();

  // Fetch real metrics
  const [propertiesResult, pendingResult, bookingsResult, hostsResult, reviewsResult] =
    await Promise.all([
      supabase
        .from("properties")
        .select("id", { count: "exact" })
        .eq("status", "PUBLISHED"),
      supabase
        .from("properties")
        .select("id", { count: "exact" })
        .eq("status", "PENDING_REVIEW"),
      supabase
        .from("bookings")
        .select("id, total_amount", { count: "exact" })
        .gte("created_at", new Date(new Date().setDate(1)).toISOString()),
      supabase
        .from("host_profiles")
        .select("id", { count: "exact" }),
      supabase
        .from("reviews")
        .select("rating", { count: "exact" }),
    ]);

  const publishedCount = propertiesResult.count ?? 0;
  const pendingCount = pendingResult.count ?? 0;
  const bookingsThisMonth = bookingsResult.count ?? 0;
  const gmvThisMonth = (bookingsResult.data ?? []).reduce(
    (sum, b) => sum + Number(b.total_amount ?? 0),
    0
  );
  const activeHosts = hostsResult.count ?? 0;
  const reviews = reviewsResult.data ?? [];
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + Number(r.rating ?? 0), 0) / reviews.length).toFixed(1)
      : "0.0";

  // Fetch pending properties for the queue
  const { data: pendingProperties } = await supabase
    .from("properties")
    .select(
      `
      id,
      name,
      district,
      property_type,
      verification_level,
      created_at,
      host_profiles ( display_name )
      `
    )
    .eq("status", "PENDING_REVIEW")
    .order("created_at", { ascending: true })
    .limit(5);

  const kpis = [
    {
      icon: Building2,
      label: "Published properties",
      value: publishedCount.toLocaleString(),
      sub: "Live on marketplace",
    },
    {
      icon: BadgeCheck,
      label: "Pending review",
      value: pendingCount.toLocaleString(),
      sub: pendingCount > 0 ? "Needs attention" : "All clear",
      alert: pendingCount > 0,
    },
    {
      icon: CalendarCheck,
      label: "Bookings this month",
      value: bookingsThisMonth.toLocaleString(),
      sub: `₹${gmvThisMonth.toLocaleString("en-IN")} GMV`,
    },
    {
      icon: Users,
      label: "Active hosts",
      value: activeHosts.toLocaleString(),
      sub: "Registered hosts",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-sm font-bold uppercase tracking-[.18em] text-primary">
          Operations
        </p>
        <h1 className="font-display mt-2 text-4xl">Admin overview</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Monitor platform health, verify properties, and manage operations.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className={kpi.alert ? "border-destructive/20" : ""}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <Icon
                    className={`h-5 w-5 ${
                      kpi.alert ? "text-destructive" : "text-primary"
                    }`}
                  />
                  {kpi.alert && (
                    <Badge variant="destructive" className="gap-1">
                      <ShieldAlert className="h-3 w-3" />
                      Action needed
                    </Badge>
                  )}
                </div>
                <p className="mt-7 text-sm text-muted-foreground">{kpi.label}</p>
                <p className="font-display mt-1 text-4xl">{kpi.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{kpi.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Secondary metrics row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Average rating</p>
            </div>
            <div className="mt-3 flex items-end gap-2">
              <p className="font-display text-4xl">{avgRating}</p>
              <div className="flex items-center gap-0.5 pb-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= Math.round(Number(avgRating))
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Based on {reviews.length} reviews
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">
                Properties by district
              </p>
            </div>
            <div className="mt-3 space-y-2">
              <DistrictBar label="Aizawl" count={28} total={42} />
              <DistrictBar label="Champhai" count={8} total={42} />
              <DistrictBar label="Lunglei" count={5} total={42} />
              <DistrictBar label="Other" count={1} total={42} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">
                Verification queue
              </p>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {pendingCount > 0
                ? `${pendingCount} properties awaiting review.`
                : "No properties awaiting review."}
            </p>
            <Link href="/admin/properties" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80">
              Review queue
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Pending verification queue */}
      <Card>
        <CardHeader className="border-b border-border px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Verification queue</CardTitle>
              <p className="text-sm text-muted-foreground">
                Properties submitted by hosts awaiting review
              </p>
            </div>
            <Link href="/admin/properties" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80">
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {pendingProperties && pendingProperties.length > 0 ? (
            <ul className="divide-y divide-border">
              {pendingProperties.map((property) => {
                const host = single<{ display_name: string | null }>(
                  property.host_profiles
                );
                return (
                  <li key={property.id}>
                    <Link
                      href={`/admin/properties/${property.id}`}
                      className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-accent"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-primary">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{property.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {host?.display_name ?? "Unknown host"} •{" "}
                            {property.district ?? "No district"} •{" "}
                            {property.property_type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">
                          Level {property.verification_level}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(property.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-5 py-12 text-center">
              <BadgeCheck className="mx-auto h-10 w-10 text-primary" />
              <p className="mt-3 font-medium text-foreground">Queue is clear</p>
              <p className="mt-1 text-sm text-muted-foreground">
                No properties are currently awaiting verification.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DistrictBar({
  label,
  count,
  total,
}: {
  label: string;
  count: number;
  total: number;
}) {
  const pct = Math.round((count / total) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">{count}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
