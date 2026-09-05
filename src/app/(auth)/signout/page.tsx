import { signOut } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignOutPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-foreground px-6 py-16">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader>
            <CardTitle className="text-3xl tracking-tight">Sign out</CardTitle>
            <CardDescription>
              Are you sure you want to sign out of MizoramStay?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={signOut}>
              <Button type="submit" size="lg" className="w-full">
                Sign out
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
