import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthCodeErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-foreground px-6 py-16">
      <div className="w-full max-w-md text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-accent" />
        <h1 className="mt-6 text-4xl font-black tracking-tight text-white">
          Something went wrong
        </h1>
        <p className="mt-4 text-sm leading-6 text-white/70">
          We couldn&apos;t complete the sign-in. The link may be invalid or
          expired. Please try again.
        </p>
        <Link href="/login" className="mt-8 inline-block">
          <Button size="lg" variant="secondary">
            Back to sign in
          </Button>
        </Link>
      </div>
    </main>
  );
}