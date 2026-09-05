import Link from "next/link";
import { SearchX, Home } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function NotFoundPage({
  title = "Page not found",
  description = "The page you're looking for doesn't exist or has been moved.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
            <SearchX className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-display mt-5 text-2xl">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          <Link href="/" className={buttonVariants({ className: "mt-6" })}>
            <Home data-icon="inline-start" />
            Back to home
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}