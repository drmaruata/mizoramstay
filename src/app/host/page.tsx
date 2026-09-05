import Link from "next/link";
import { ArrowLeft, CalendarDays, Home, TrendingUp } from "lucide-react";
import { requireHost } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function HostPage() {
  await requireHost();
  return (
    <main className="min-h-screen bg-muted px-6 py-10 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Public site
        </Link>
        <div className="mt-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.18em] text-primary">
              Host workspace
            </p>
            <h1 className="font-display mt-2 text-5xl">Good morning.</h1>
            <p className="mt-3 text-muted-foreground">
              Your operational dashboard foundation.
            </p>
          </div>
          <Button size="lg">Add a property</Button>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            [Home, "Properties", "Your places"],
            [CalendarDays, "Today's bookings", "Calendar view"],
            [TrendingUp, "This month's revenue", "Revenue tracking"],
          ].map(([Icon, title, detail]) => (
            <Card key={title as string}>
              <CardContent className="p-6">
                <Icon className="h-6 w-6 text-primary" />
                <p className="mt-8 text-sm font-bold">{title as string}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {detail as string}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="mt-8 border-dashed p-8">
          <h2 className="font-display text-3xl">Onboarding progress</h2>
          <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
            The guided wizard will keep profile, property, documents, rooms,
            photos, pricing, and verification manageable on mobile.
          </p>
        </Card>
      </div>
    </main>
  );
}
