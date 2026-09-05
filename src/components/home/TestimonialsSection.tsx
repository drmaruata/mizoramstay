import { Star, Quote } from "lucide-react";
import { Card } from "@/components/ui/card";

const testimonials = [
  {
    name: "Priya Sharma",
    location: "Travelled from Delhi",
    quote:
      "The homestay in Aizawl felt like staying with family. The host picked us up from the airport and cooked the most incredible vawksa rep. MizoramStay made it effortless.",
    rating: 5,
  },
  {
    name: "Daniel Lalrinmawia",
    location: "Local host, Hmuifang",
    quote:
      "Listing my home took minutes, and the verification team was genuinely helpful. I've hosted guests from across India who respect my home and my culture.",
    rating: 5,
  },
  {
    name: "Sarah Chen",
    location: "Travelled from Singapore",
    quote:
      "The photos were accurate, the booking was smooth, and the support team answered my questions within the hour. A truly refreshing way to travel.",
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="bg-muted px-6 py-20 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-[.18em] text-primary">
            Traveller stories
          </p>
          <h2 className="font-display mt-3 text-5xl tracking-tight">
            Loved by guests and hosts
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <Card
              key={t.name}
              className="flex flex-col border-border p-6"
            >
              <Quote className="h-6 w-6 text-primary" />
              <blockquote className="mt-4 flex-1 text-sm leading-7 text-foreground">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 border-t border-border pt-4">
                <div className="flex items-center gap-1">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-accent text-accent"
                    />
                  ))}
                </div>
                <p className="mt-2 text-sm font-bold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.location}</p>
              </figcaption>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}