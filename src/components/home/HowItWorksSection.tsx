import { Search, CalendarCheck, ShieldCheck, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

const steps = [
  {
    icon: Search,
    title: "Search verified stays",
    description:
      "Browse homestays across Mizoram, each one verified by our team for quality and authenticity.",
  },
  {
    icon: CalendarCheck,
    title: "Book with confidence",
    description:
      "Clear pricing, transparent policies, and secure booking — no surprises at check-in.",
  },
  {
    icon: ShieldCheck,
    title: "Stay protected",
    description:
      "Every booking is backed by our verification and support, so you can travel worry-free.",
  },
  {
    icon: Sparkles,
    title: "Experience Mizoram",
    description:
      "Live like a local with hosts who share their home, food, and stories of the hills.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
      <div className="text-center">
        <p className="text-sm font-bold uppercase tracking-[.18em] text-primary">
          Simple by design
        </p>
        <h2 className="font-display mt-3 text-5xl tracking-tight">
          How MizoramStay works
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-muted-foreground">
          From discovery to check-out, we keep the journey simple and safe.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <Card
              key={step.title}
              className="relative border-border p-6"
            >
              <span className="absolute right-4 top-4 font-display text-4xl text-border">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display mt-5 text-xl">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {step.description}
              </p>
            </Card>
          );
        })}
      </div>
    </section>
  );
}