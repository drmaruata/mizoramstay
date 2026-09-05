import { Star } from "lucide-react";
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
  title: "Reviews | Admin",
};

export default async function AdminReviewsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: reviews, count } = await supabase
    .from("reviews")
    .select(
      `
      id,
      rating,
      comment,
      status,
      created_at,
      properties ( name ),
      profiles ( first_name, last_name )
      `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .limit(50);

  const statusColors: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700",
    PUBLISHED: "bg-green-50 text-green-700",
    HIDDEN: "bg-gray-100 text-gray-700",
    FLAGGED: "bg-red-50 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[.18em] text-primary">
          Reviews
        </p>
        <h1 className="font-display mt-2 text-3xl">Review moderation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {count ?? 0} reviews
        </p>
      </div>

      {reviews && reviews.length > 0 ? (
        <div className="overflow-x-auto border border-border bg-background">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-muted">
                <TableHead className="px-5 py-3 font-semibold text-foreground">Rating</TableHead>
                <TableHead className="px-5 py-3 font-semibold text-foreground">Comment</TableHead>
                <TableHead className="px-5 py-3 font-semibold text-foreground">Reviewer</TableHead>
                <TableHead className="px-5 py-3 font-semibold text-foreground">Property</TableHead>
                <TableHead className="px-5 py-3 font-semibold text-foreground">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => {
                const profile = single<{
                  first_name: string | null;
                  last_name: string | null;
                }>(review.profiles);
                const property = single<{ name: string | null }>(review.properties);
                return (
                  <TableRow key={review.id} className="hover:bg-accent">
                    <TableCell className="px-5 py-4">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {review.rating}.0
                      </p>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-foreground">
                      {review.comment ?? "No comment"}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-muted-foreground">
                      {[profile?.first_name, profile?.last_name]
                        .filter(Boolean)
                        .join(" ") || "Guest"}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-muted-foreground">
                      {property?.name ?? "Property"}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <Badge variant="secondary">
                        {review.status}
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
          <Star className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-medium text-foreground">No reviews yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Reviews will appear here once guests leave feedback.
          </p>
        </div>
      )}
    </div>
  );
}
