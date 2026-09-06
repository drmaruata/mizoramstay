"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowLeft, ArrowRight, Lock, Mail } from "lucide-react";
import { login, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/forms/FormError";
import { AuthVisualPanel } from "@/components/auth/AuthVisualPanel";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <main className="min-h-screen bg-[#f7f3eb] lg:flex">
      <AuthVisualPanel mode="login" />
      <section className="flex min-h-screen flex-1 flex-col px-6 py-6 sm:px-10 lg:px-14 xl:px-20">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#61736c] transition hover:text-[#0f5a45]">
            <ArrowLeft className="size-4" /> Back to MizoramStay
          </Link>
          <Link href="/signup" className="hidden items-center gap-1.5 text-sm font-semibold text-[#0f5a45] sm:inline-flex">
            Create account <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 items-center py-12">
          <div className="w-full">
            <div className="mb-8 lg:hidden">
              <span className="text-2xl font-black tracking-[-.06em] text-[#17332e]">mizoram<span className="text-[#d99a32]">stay</span></span>
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-[.25em] text-[#61736c]">Hospitality · People · Places</p>
            </div>

            <div className="mb-9">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[.24em] text-[#0f5a45]">Welcome back</p>
              <h1 className="display-serif text-4xl leading-tight tracking-[-.035em] text-[#17332e] sm:text-5xl">Sign in to continue your journey.</h1>
              <p className="mt-4 text-sm leading-6 text-[#61736c]">Access your bookings, saved stays and host tools from one place.</p>
            </div>

            <form action={formAction} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#17332e]">Email address</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-[#0f5a45]" aria-hidden="true" />
                  <Input id="email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" className="h-12 rounded-xl border-[#cfc9bc] bg-white pl-11 text-[#17332e] shadow-sm placeholder:text-[#9aa6a1] focus-visible:ring-[#0f5a45]" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="password" className="text-[#17332e]">Password</Label>
                  <Link href="/forgot-password" className="text-xs font-semibold text-[#0f5a45] transition hover:text-[#0a4435]">Forgot password?</Link>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-[#0f5a45]" aria-hidden="true" />
                  <Input id="password" name="password" type="password" required autoComplete="current-password" placeholder="Enter your password" className="h-12 rounded-xl border-[#cfc9bc] bg-white pl-11 text-[#17332e] shadow-sm placeholder:text-[#9aa6a1] focus-visible:ring-[#0f5a45]" />
                </div>
              </div>

              <FormError message={state.error} />

              <Button type="submit" disabled={pending} size="lg" className="h-12 w-full rounded-xl bg-[#0f5a45] text-base font-semibold text-white shadow-sm transition hover:bg-[#0b4736]">
                {pending ? "Signing in…" : "Sign in"}
                {!pending && <ArrowRight className="ml-2 size-4" />}
              </Button>
            </form>

            <div className="mt-8 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#ddd8cc]" />
              <span className="text-[10px] font-bold uppercase tracking-[.2em] text-[#9aa6a1]">MizoramStay</span>
              <div className="h-px flex-1 bg-[#ddd8cc]" />
            </div>

            <p className="mt-7 text-center text-sm text-[#61736c] sm:hidden">New to MizoramStay? <Link href="/signup" className="font-semibold text-[#0f5a45]">Create an account</Link></p>
            <p className="mt-7 text-center text-xs leading-5 text-[#8a9690]">By continuing, you agree to use MizoramStay in accordance with our terms and privacy policy.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
