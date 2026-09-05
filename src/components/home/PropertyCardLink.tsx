"use client";

import Link from "next/link";
import { trackClientEvent } from "@/lib/analytics-client";

/**
 * Client wrapper around a property card link that records a
 * `property_viewed` analytics event when the card is clicked.
 */
export function PropertyCardLink({
  slug,
  name,
  children,
}: {
  slug: string;
  name: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={`/stays/${slug}`}
      onClick={() => {
        void trackClientEvent("property_viewed", { property_slug: slug, property_name: name });
      }}
    >
      {children}
    </Link>
  );
}
