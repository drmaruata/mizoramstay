import { CreditCard } from "lucide-react";
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
  title: "Payments | Admin",
};

export default async function AdminPaymentsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: payments, count } = await supabase
    .from("payments")
    .select(
      `
      id,
      provider,
      provider_transaction_id,
      amount,
      currency,
      status,
      payment_method,
      paid_at,
      created_at,
      bookings ( booking_reference, total_amount )
      `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .limit(50);

  const statusColors: Record<string, string> = {
    INITIATED: "bg-amber-50 text-amber-700",
    AUTHORIZED: "bg-blue-50 text-blue-700",
    CAPTURED: "bg-green-50 text-green-700",
    FAILED: "bg-red-50 text-red-700",
    REFUNDED: "bg-purple-50 text-purple-700",
    PARTIALLY_REFUNDED: "bg-orange-50 text-orange-700",
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[.18em] text-primary">
          Payments
        </p>
        <h1 className="font-display mt-2 text-3xl">Payment transactions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {count ?? 0} transactions
        </p>
      </div>

      {payments && payments.length > 0 ? (
        <div className="overflow-x-auto border border-border bg-background">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-muted">
                <TableHead className="px-5 py-3 font-semibold text-foreground">Booking</TableHead>
                <TableHead className="px-5 py-3 font-semibold text-foreground">Provider</TableHead>
                <TableHead className="px-5 py-3 font-semibold text-foreground">Transaction ID</TableHead>
                <TableHead className="px-5 py-3 font-semibold text-foreground">Amount</TableHead>
                <TableHead className="px-5 py-3 font-semibold text-foreground">Method</TableHead>
                <TableHead className="px-5 py-3 font-semibold text-foreground">Status</TableHead>
                <TableHead className="px-5 py-3 font-semibold text-foreground">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => {
                const booking = single<{
                  booking_reference: string | null;
                  total_amount: number | null;
                }>(payment.bookings);
                return (
                  <TableRow key={payment.id} className="hover:bg-accent">
                    <TableCell className="px-5 py-4 font-medium text-primary">
                      {booking?.booking_reference ?? "—"}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-muted-foreground">{payment.provider}</TableCell>
                    <TableCell className="px-5 py-4 font-mono text-xs text-muted-foreground">
                      {payment.provider_transaction_id ?? "—"}
                    </TableCell>
                    <TableCell className="px-5 py-4 font-semibold text-foreground">
                      {payment.currency} {Number(payment.amount).toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-muted-foreground">{payment.payment_method}</TableCell>
                    <TableCell className="px-5 py-4">
                      <Badge variant="secondary">
                        {payment.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-muted-foreground">
                      {payment.paid_at
                        ? new Date(payment.paid_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })
                        : new Date(payment.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="border border-dashed border-border bg-background p-12 text-center">
          <CreditCard className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-medium text-foreground">No payments yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Payments will appear here once bookings are made.
          </p>
        </div>
      )}
    </div>
  );
}
