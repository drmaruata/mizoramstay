import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

// Fallback imagery used when a destination has no hero photo yet.
const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=85",
];

type Destination = {
  id: string;
  name: string;
  slug: string;
  district: string | null;
  short_description: string | null;
  hero_image: string | null;
  property_count: number;
};

export async function DestinationsSection() {
  const supabase = await createClient();

  // Fetch published destinations with a count of published properties per district.
  const { data: destinations, error } = await supabase
    .from("destinations")
    .select("id, name, slug, district, short_description, hero_image")
    .eq("status", "PUBLISHED")
    .order("name", { ascending: true })
    .limit(6);

  if (error) {
    console.error("DestinationsSection query failed:", error.message);
  }

  // Count published properties per district for each destination.
  const enriched: Destination[] = [];
  for (const dest of destinations ?? []) {
    const district = dest.district ?? dest.name;
    const { count } = await supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("status", "PUBLISHED")
      .eq("district", district);
    enriched.push({
      ...dest,
      property_count: count ?? 0,
    });
  }

  return (
    <section id="destinations" className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[.18em] text-primary">
            Start somewhere beautiful
          </p>
          <h2 className="font-display mt-3 text-5xl tracking-tight">
            Explore by destination
          </h2>
        </div>
        <Link
          href="/destinations"
          className="hidden items-center gap-2 text-sm font-bold md:flex"
        >
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {enriched.length === 0 ? (
        <Card className="mt-9 border-dashed p-12 text-center">
          <MapPin className="mx-auto h-10 w-10 text-primary" />
          <h3 className="font-display mt-4 text-3xl">
            Destinations coming soon
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            We&apos;re curating the best places to explore across Mizoram.
            Check back soon.
          </p>
        </Card>
      ) : (
        <div className="mt-9 grid gap-5 md:grid-cols-3">
          {enriched.map((destination, index) => {
            const image =
              destination.hero_image ?? FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
            const detail =
              destination.short_description ??
              `${destination.property_count} ${
                destination.property_count === 1 ? "stay" : "stays"
              }`;
            return (
              <Link
                href={`/stays?district=${encodeURIComponent(
                  destination.district ?? destination.name
                )}`}
                key={destination.id}
                className="group relative h-80 overflow-hidden rounded-2xl bg-foreground"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-85 transition duration-500 group-hover:scale-105"
                  style={{ backgroundImage: `url(${image})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 p-6 text-white">
                  <h3 className="font-display text-4xl">{destination.name}</h3>
                  <p className="mt-1 text-sm text-white/80">{detail}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
