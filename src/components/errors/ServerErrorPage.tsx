import { ServerCrash, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ServerErrorPage({
  title = "Server error",
  description = "Something went wrong on our end. Please try again in a moment.",
  digest,
}: {
  title?: string;
  description?: string;
  digest?: string;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <ServerCrash className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="font-display mt-5 text-2xl">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          {digest && (
            <p className="mt-3 text-xs text-muted-foreground">
              Error reference: {digest}
            </p>
          )}
          <Button
            onClick={() => window.location.reload()}
            className="mt-6"
          >
            <RotateCcw data-icon="inline-start" />
            Reload page
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}