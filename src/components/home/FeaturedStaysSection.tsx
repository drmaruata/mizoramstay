import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  MapPin,
  ShieldCheck,
  Star,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PropertyCardLink } from "./PropertyCardLink";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Fallback imagery used when a property has no hero photo yet.
const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1000&q=85",
  "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1000&q=85",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=85",
];

type FeaturedStay = {
  id: string;
  name: string;
  slug: string;
  district: string | null;
  town: string | null;
  property_type: string;
  rooms: { base_price: number | null }[] | null;
  reviews: { rating: number }[] | null;
};

function formatPrice(value: number | null | undefined): string {
  if (value == null) return "₹—";
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

function averageRating(reviews: { rating: number }[] | null | undefined): string {
  if (!reviews || reviews.length === 0) return "New";
  const avg =
    reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length;
  return avg.toFixed(1);
}

export async function FeaturedStaysSection() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("properties")
    .select(
      "id, name, slug, district, town, property_type, rooms(base_price), reviews(rating)"
    )
    .eq("status", "PUBLISHED")
    .order("published_at", { ascending: false })
    .limit(6);

  if (error) {
    console.error("FeaturedStaysSection query failed:", error.message);
  }

  const stays = (data ?? []) as FeaturedStay[];

  return (
    <section id="stays" className="bg-muted px-6 py-20 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.18em] text-primary">
              Stay with confidence
            </p>
            <h2 className="font-display mt-3 text-5xl tracking-tight">
              Verified places, local welcome
            </h2>
          </div>
          <Link
            href="/search"
            className="hidden items-center gap-2 text-sm font-bold md:flex"
          >
            Browse all stays <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {stays.length === 0 ? (
          <Card className="mt-9 border-dashed p-12 text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
            <h3 className="font-display mt-4 text-3xl">
              Verified stays are on the way
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Hosts are onboarding their homes right now. Check back soon to
              discover verified places to stay across Mizoram.
            </p>
          </Card>
        ) : (
          <div className="mt-9 grid gap-6 md:grid-cols-3">
            {stays.map((stay, index) => {
              const price = stay.rooms?.[0]?.base_price ?? null;
              const rating = averageRating(stay.reviews);
              const location = stay.town ?? stay.district ?? "Mizoram";
              const image = FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
              return (
                <Card
                  key={stay.id}
                  className="group overflow-hidden border-border"
                >
                  <PropertyCardLink slug={stay.slug} name={stay.name}>
                    <div className="relative h-64 overflow-hidden">
                      <div
                        className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
                        style={{ backgroundImage: `url(${image})` }}
                      />
                      <Badge className="absolute left-4 top-4 bg-white/90 text-foreground">
                        <ShieldCheck className="h-3.5 w-3.5" /> Verified stay
                      </Badge>
                    </div>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-display text-2xl">{stay.name}</h3>
                          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            {location} ·{" "}
                            {stay.property_type
                              .toLowerCase()
                              .replace(/_/g, " ")}
                          </p>
                        </div>
                        <span className="flex items-center gap-1 text-sm font-bold">
                          <Star className="h-4 w-4 fill-accent text-accent" />
                          {rating}
                        </span>
                      </div>
                      <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                        <p>
                          <span className="text-lg font-bold">
                            {formatPrice(price)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {" "}
                            / night
                          </span>
                        </p>
                        <span className="flex items-center gap-1 text-sm font-bold text-primary">
                          View stay <ChevronRight className="h-4 w-4" />
                        </span>
                      </div>
                    </CardContent>
                  </PropertyCardLink>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
