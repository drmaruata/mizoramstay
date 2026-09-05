import Link from "next/link";
import { ArrowRight, BedDouble } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function HostCTASection() {
  return (
    <section
      id="host"
      className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:px-10"
    >
      <div>
        <p className="text-sm font-bold uppercase tracking-[.18em] text-primary">
          For thoughtful hosts
        </p>
        <h2 className="font-display mt-3 max-w-xl text-5xl leading-[1.05] tracking-tight">
          Your home has a story worth sharing.
        </h2>
        <p className="mt-6 max-w-lg text-lg leading-8 text-muted-foreground">
          Join a growing community of local hosts. We help you reach respectful
          travellers, manage your calendar, and earn on your terms.
        </p>
        <Link href="/host" className="mt-8 inline-block">
          <Button size="lg">
            List your property <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
      <div className="relative min-h-80 overflow-hidden rounded-2xl bg-muted p-8">
        <div className="absolute right-0 top-0 h-full w-2/3 bg-[url('https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1000&q=85')] bg-cover bg-center" />
        <Card className="relative z-10 max-w-xs p-6 shadow-xl">
          <BedDouble className="h-7 w-7 text-primary" />
          <h3 className="font-display mt-8 text-3xl">A better kind of travel</h3>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Authentic stays. Clear expectations. More of every booking goes to
            your host.
          </p>
        </Card>
      </div>
    </section>
  );
}
