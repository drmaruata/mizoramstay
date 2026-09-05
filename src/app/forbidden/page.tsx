import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-foreground px-6 py-16">
      <div className="w-full max-w-md text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-accent" />
        <h1 className="mt-6 text-4xl font-black tracking-tight text-white">
          Access denied
        </h1>
        <p className="mt-4 text-sm leading-6 text-white/70">
          You don&apos;t have permission to view this page. If you believe this
          is a mistake, contact the site administrator.
        </p>
        <Link href="/" className="mt-8 inline-block">
          <Button size="lg" variant="secondary">
            Back to home
          </Button>
        </Link>
      </div>
    </main>
  );
}