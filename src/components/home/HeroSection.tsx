import Link from "next/link";
import { getAuthUser } from "@/lib/auth/session";
import { signOut } from "@/app/(auth)/signout/actions";
import { HeroSearch } from "./HeroSearch";
import { Button } from "@/components/ui/button";

export async function HeroSection() {
  const user = await getAuthUser();

  const dashboardHref =
    user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"
      ? "/admin"
      : user?.role === "HOST"
        ? "/host"
        : "/account";

  return (
    <>
      <header className="absolute z-10 w-full border-b border-white/20 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
          <Link href="/" className="font-display text-3xl tracking-tight">
            mizoram<span className="text-accent">stay</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a href="#stays">Find a stay</a>
            <a href="#destinations">Explore Mizoram</a>
            <a href="#host">List your property</a>
          </nav>
          {user ? (
            <div className="flex items-center gap-3">
              <Link href={dashboardHref}>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/40 bg-transparent text-white hover:bg-white hover:text-foreground"
                >
                  Dashboard
                </Button>
              </Link>
              <form action={signOut}>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="border-white/40 bg-transparent text-white hover:bg-white hover:text-foreground"
                >
                  Sign out
                </Button>
              </form>
            </div>
          ) : (
            <Link href="/login">
              <Button
                variant="outline"
                size="sm"
                className="border-white/40 bg-transparent text-white hover:bg-white hover:text-foreground"
              >
                Sign in
              </Button>
            </Link>
          )}
        </div>
      </header>

      <section className="relative flex min-h-[680px] items-end bg-foreground px-6 pb-16 pt-36 text-white lg:min-h-[760px] lg:px-10 lg:pb-24">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,35,28,.78),rgba(10,35,28,.18)),url('https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=2200&q=90')] bg-cover bg-center" />
        <div className="relative mx-auto w-full max-w-7xl">
          <div className="max-w-2xl">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[.22em] text-accent">
              The hills are calling
            </p>
            <h1 className="font-display text-6xl leading-[.95] tracking-tight sm:text-8xl">
              Stay close to what makes Mizoram{" "}
              <em className="text-accent">special.</em>
            </h1>
            <p className="mt-7 max-w-lg text-lg leading-7 text-white/80">
              Verified homestays, generous hosts, and a slower way to discover
              the land of the blue mountains.
            </p>
          </div>
          <HeroSearch />
        </div>
      </section>
    </>
  );
}
