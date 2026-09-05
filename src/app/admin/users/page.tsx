import Link from "next/link";
import { Users, UserCheck, Search } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { single } from "@/lib/supabase/relations";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Users | Admin",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const tab = typeof params.tab === "string" ? params.tab : "all";
  const query = typeof params.q === "string" ? params.q : "";

  const supabase = await createClient();

  // Fetch profiles with host info
  let profilesQuery = supabase
    .from("profiles")
    .select(
      `
      id,
      first_name,
      last_name,
      email,
      phone,
      role,
      created_at,
      host_profiles ( display_name, identity_status, bank_account_status )
      `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (tab === "hosts") {
    profilesQuery = profilesQuery.eq("role", "HOST");
  } else if (tab === "tourists") {
    profilesQuery = profilesQuery.eq("role", "TOURIST");
  } else if (tab === "admins") {
    profilesQuery = profilesQuery.in("role", ["ADMIN", "SUPER_ADMIN"]);
  }

  if (query) {
    profilesQuery = profilesQuery.or(
      `first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`
    );
  }

  const { data: profiles, count } = await profilesQuery;

  const tabs = [
    { key: "all", label: "All users" },
    { key: "hosts", label: "Hosts" },
    { key: "tourists", label: "Tourists" },
    { key: "admins", label: "Admins" },
  ];

  const roleColors: Record<string, string> = {
    TOURIST: "bg-blue-50 text-blue-700",
    HOST: "bg-primary/10 text-primary",
    GUIDE: "bg-purple-50 text-purple-700",
    DRIVER: "bg-orange-50 text-orange-700",
    OPERATOR: "bg-teal-50 text-teal-700",
    ADMIN: "bg-red-50 text-red-700",
    SUPER_ADMIN: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[.18em] text-primary">
          Users
        </p>
        <h1 className="font-display mt-2 text-3xl">User management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {count ?? 0} users found
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={tab}>
        <TabsList>
          {tabs.map((t) => (
            <Link key={t.key} href={`/admin/users?tab=${t.key}`}>
              <TabsTrigger value={t.key}>
                <span className="cursor-pointer">{t.label}</span>
              </TabsTrigger>
            </Link>
          ))}
        </TabsList>
      </Tabs>

      {/* Search */}
      <form className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search by name or email..."
            className="pl-10"
          />
        </div>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {/* Users table */}
      {profiles && profiles.length > 0 ? (
        <div className="overflow-x-auto border border-border bg-background">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-muted">
                <TableHead className="px-5 py-3 font-semibold text-foreground">User</TableHead>
                <TableHead className="px-5 py-3 font-semibold text-foreground">Contact</TableHead>
                <TableHead className="px-5 py-3 font-semibold text-foreground">Role</TableHead>
                <TableHead className="px-5 py-3 font-semibold text-foreground">Host status</TableHead>
                <TableHead className="px-5 py-3 font-semibold text-foreground">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => {
                const host = single<{
                  display_name: string | null;
                  identity_status: string | null;
                  bank_account_status: string | null;
                }>(profile.host_profiles);
                return (
                  <TableRow key={profile.id} className="hover:bg-accent">
                    <TableCell className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-bold text-primary">
                          {(profile.first_name ?? "U").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {[profile.first_name, profile.last_name]
                              .filter(Boolean)
                              .join(" ") || "Unnamed user"}
                          </p>
                          {host?.display_name && (
                            <p className="text-xs text-muted-foreground">
                              {host.display_name}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-muted-foreground">
                      <p>{profile.email ?? "—"}</p>
                      <p className="text-xs">{profile.phone ?? ""}</p>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <Badge variant="secondary">
                        {profile.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      {host ? (
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-primary" />
                          <span className="text-xs">
                            {host.identity_status}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not a host</span>
                      )}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-muted-foreground">
                      {new Date(profile.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="border border-dashed border-border bg-background p-12 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-medium text-foreground">No users found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {query ? "Try a different search." : "Users will appear here."}
          </p>
        </div>
      )}
    </div>
  );
}
