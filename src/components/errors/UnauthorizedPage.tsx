import Link from "next/link";
import { ShieldAlert, LogIn } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function UnauthorizedPage({
  title = "Access denied",
  description = "You don't have permission to view this page.",
  actionHref = "/login",
  actionLabel = "Sign in",
}: {
  title?: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
            <ShieldAlert className="h-7 w-7 text-amber-600" />
          </div>
          <h1 className="font-display mt-5 text-2xl">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          <Link
            href={actionHref}
            className={buttonVariants({ className: "mt-6" })}
          >
            <LogIn data-icon="inline-start" />
            {actionLabel}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}