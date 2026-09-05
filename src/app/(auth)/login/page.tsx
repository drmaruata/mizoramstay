"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowLeft, Lock, Mail } from "lucide-react";
import { login, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormError } from "@/components/forms/FormError";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center bg-foreground px-6 py-16">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-white/70 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to MizoramStay
        </Link>

        <Card className="shadow-2xl">
          <CardHeader>
            <CardTitle className="text-3xl tracking-tight">
              Sign in to your account
            </CardTitle>
            <CardDescription>
              Book verified stays, manage your property, or run your
              operations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-primary"
                    aria-hidden="true"
                  />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-primary"
                    aria-hidden="true"
                  />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="pl-10"
                  />
                </div>
              </div>

              <FormError message={state.error} />

              <Button
                type="submit"
                disabled={pending}
                className="w-full"
                size="lg"
              >
                {pending ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            <div className="mt-6 flex items-center justify-between text-sm">
              <Link
                href="/forgot-password"
                className="font-semibold text-primary hover:underline"
              >
                Forgot password?
              </Link>
              <Link
                href="/signup"
                className="font-semibold text-primary hover:underline"
              >
                Create account
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
