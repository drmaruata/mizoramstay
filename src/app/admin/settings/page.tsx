import { Settings } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";

export const metadata = {
  title: "Settings | Admin",
};

export default async function AdminSettingsPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[.18em] text-primary">
          Settings
        </p>
        <h1 className="font-display mt-2 text-3xl">Platform settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure platform-wide settings and preferences.
        </p>
      </div>

      <div className="border border-dashed border-border bg-background p-12 text-center">
        <Settings className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-3 font-medium text-foreground">
          Settings coming soon
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Commission rates, cancellation policies, and platform configuration
          will be managed here.
        </p>
      </div>
    </div>
  );
}
