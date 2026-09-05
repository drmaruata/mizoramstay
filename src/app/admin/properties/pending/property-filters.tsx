"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Client-side filter controls for the pending properties list.
 *
 * The parent page is a Server Component, so the interactive `<select>`
 * elements (which need `onChange` + `window.location`) must live in a
 * Client Component. Filter changes are applied by navigating to the same
 * route with updated search params.
 */
export function PropertyFilters({
  district,
  type,
  sort,
  districtOptions,
}: {
  district: string;
  type: string;
  sort: string;
  districtOptions: string[];
}) {
  const router = useRouter();

  function applyFilter(key: string, value: string) {
    const url = new URL(window.location.href);
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
    router.push(url.pathname + url.search);
  }

  const districtItems = [
    { label: "All districts", value: "" },
    ...districtOptions.map((d) => ({ label: d, value: d })),
  ];

  const typeItems = [
    { label: "All types", value: "" },
    { label: "Homestay", value: "HOMESTAY" },
    { label: "Hotel", value: "HOTEL" },
    { label: "Guesthouse", value: "GUESTHOUSE" },
    { label: "Lodge", value: "LODGE" },
    { label: "Resort", value: "RESORT" },
    { label: "Village stay", value: "VILLAGE_STAY" },
  ];

  const sortItems = [
    { label: "Oldest first", value: "oldest" },
    { label: "Newest first", value: "newest" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 border border-border bg-background p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="h-4 w-4" />
        Filters
      </div>

      <Select items={districtItems} value={district} onValueChange={(v) => applyFilter("district", v ?? "")}>
        <SelectTrigger aria-label="Filter by district" className="w-[180px]">
          <SelectValue placeholder="All districts" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {districtItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select items={typeItems} value={type} onValueChange={(v) => applyFilter("type", v ?? "")}>
        <SelectTrigger aria-label="Filter by property type" className="w-[160px]">
          <SelectValue placeholder="All types" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {typeItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select items={sortItems} value={sort} onValueChange={(v) => applyFilter("sort", v ?? "")}>
        <SelectTrigger aria-label="Sort properties" className="w-[160px]">
          <SelectValue placeholder="Oldest first" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {sortItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      {(district || type) && (
        <Link
          href="/admin/properties/pending"
          className="text-sm font-medium text-primary hover:text-primary/80"
        >
          Clear filters
        </Link>
      )}
    </div>
  );
}
