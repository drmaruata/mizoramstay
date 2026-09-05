"use client";

import { useRouter } from "next/navigation";
import { CalendarDays, MapPin, Search } from "lucide-react";
import { useState } from "react";
import { trackClientEvent } from "@/lib/analytics-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function HeroSearch() {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location.trim()) params.set("q", location.trim());
    if (checkIn) params.set("check_in", checkIn);
    if (checkOut) params.set("check_out", checkOut);
    const qs = params.toString();
    void trackClientEvent("search_started", {
      query: location.trim() || null,
      check_in: checkIn || null,
      check_out: checkOut || null,
    });
    router.push(qs ? `/search?${qs}` : "/search");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-12 max-w-5xl rounded-2xl border bg-card p-2 text-foreground shadow-2xl sm:p-3"
    >
      <div className="grid gap-2 md:grid-cols-[1.35fr_1fr_1fr_.8fr_auto]">
        <label className="flex items-center gap-3 border-b border-border px-4 py-3 md:border-b-0 md:border-r">
          <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
          <span>
            <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Where
            </span>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="h-8 border-0 bg-transparent p-0 pt-1 shadow-none focus-visible:ring-0"
              placeholder="Aizawl, Hmuifang..."
              aria-label="Where do you want to stay?"
            />
          </span>
        </label>
        <label className="flex items-center gap-3 border-b border-border px-4 py-3 md:border-b-0 md:border-r">
          <CalendarDays className="h-5 w-5 text-primary" aria-hidden="true" />
          <span>
            <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Check-in
            </span>
            <Input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="h-8 border-0 bg-transparent p-0 pt-1 shadow-none focus-visible:ring-0"
              aria-label="Check-in date"
            />
          </span>
        </label>
        <label className="flex items-center gap-3 border-b border-border px-4 py-3 md:border-b-0 md:border-r">
          <CalendarDays className="h-5 w-5 text-primary" aria-hidden="true" />
          <span>
            <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Check-out
            </span>
            <Input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="h-8 border-0 bg-transparent p-0 pt-1 shadow-none focus-visible:ring-0"
              aria-label="Check-out date"
            />
          </span>
        </label>
        <label className="flex items-center gap-3 border-b border-border px-4 py-3 md:border-b-0 md:border-r">
          <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
          <span>
            <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Guests
            </span>
            <Input
              type="number"
              min={1}
              max={20}
              defaultValue={2}
              className="h-8 border-0 bg-transparent p-0 pt-1 shadow-none focus-visible:ring-0"
              aria-label="Number of guests"
            />
          </span>
        </label>
        <Button type="submit" size="lg" className="h-full">
          <Search className="h-4 w-4" /> Search
        </Button>
      </div>
    </form>
  );
}
