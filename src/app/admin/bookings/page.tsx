import { CalendarCheck } from "lucide-react";
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

export const metadata = {
  title: "Bookings | Admin",
};

export default async function AdminBookingsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: bookings, count } = await supabase
    .from("bookings")
    .select(
      `
      id,
      booking_reference,
      check_in,
      check_out,
      guests,
      total_amount,
      status,
      created_at,
      properties ( name, district ),
      profiles ( first_name, last_name, email )
      `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .limit(50);

  const statusColors: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700",
    CONFIRMED: "bg-green-50 text-green-700",
    CANCELLED: "bg-red-50 text-red-700",
    COMPLETED: "bg-blue-50 text-blue-700",
    NO_SHOW: "bg-gray-100 text-gray-700",
    REFUND_PENDING: "bg-orange-50 text-orange-700",
    REFUNDED: "bg-purple-50 text-purple-700",
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[.18em] text-primary">
          Bookings
        </p>
        <h1 className="font-display mt-2 text-3xl">All bookings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {count ?? 0} bookings total
        </p>
      </div>

      {bookings && bookings.length > 0 ? (
        <div className="overflow-x-auto border border-border bg-background">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-muted">
                <TableHead className="px-5 py-3 font-semibold text-foreground">Reference</TableHead>
                <TableHead className="px-5 py-3 font-semibold text-foreground">Guest</TableHead>
                <TableHead className="px-5 py-3 font-semibold text-foreground">Property</TableHead>
                <TableHead className="px-5 py-3 font-semibold text-foreground">Dates</TableHead>
                <TableHead className="px-5 py-3 font-semibold text-foreground">Guests</TableHead>
                <TableHead className="px-5 py-3 font-semibold text-foreground">Total</TableHead>
                <TableHead className="px-5 py-3 font-semibold text-foreground">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => {
                const profile = single<{
                  first_name: string | null;
                  last_name: string | null;
                  email: string | null;
                }>(booking.profiles);
                const property = single<{
                  name: string | null;
                  district: string | null;
                }>(booking.properties);
                return (
                  <TableRow key={booking.id} className="hover:bg-accent">
                    <TableCell className="px-5 py-4 font-medium text-primary">
                      {booking.booking_reference}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <p className="font-medium text-foreground">
                        {[profile?.first_name, profile?.last_name]
                          .filter(Boolean)
                          .join(" ") || "Guest"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {profile?.email ?? ""}
                      </p>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-muted-foreground">
                      {property?.name ?? "—"}
                      {property?.district
                        ? ` (${property.district})`
                        : ""}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-muted-foreground">
                      {new Date(booking.check_in).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      →{" "}
                      {new Date(booking.check_out).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-muted-foreground">{booking.guests}</TableCell>
                    <TableCell className="px-5 py-4 font-semibold text-foreground">
                      ₹{Number(booking.total_amount).toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <Badge variant="secondary">
                        {booking.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="border border-dashed border-border bg-background p-12 text-center">
          <CalendarCheck className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-medium text-foreground">No bookings yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Bookings will appear here once guests start booking.
          </p>
        </div>
      )}
    </div>
  );
}
