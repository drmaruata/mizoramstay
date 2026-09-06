"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowLeft, ArrowRight, Check, Lock, Mail } from "lucide-react";
import { signup, type SignupState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/forms/FormError";
import { AuthVisualPanel } from "@/components/auth/AuthVisualPanel";

const initialState: SignupState = {};

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, initialState);

  return (
    <main className="min-h-screen bg-[#f7f3eb] lg:flex">
      <AuthVisualPanel mode="signup" />
      <section className="flex min-h-screen flex-1 flex-col px-6 py-6 sm:px-10 lg:px-14 xl:px-20">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#61736c] transition hover:text-[#0f5a45]">
            <ArrowLeft className="size-4" /> Back to MizoramStay
          </Link>
          <Link href="/login" className="hidden items-center gap-1.5 text-sm font-semibold text-[#0f5a45] sm:inline-flex">
            Sign in <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 items-center py-10">
          <div className="w-full">
            <div className="mb-8 lg:hidden">
              <span className="text-2xl font-black tracking-[-.06em] text-[#17332e]">mizoram<span className="text-[#d99a32]">stay</span></span>
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-[.25em] text-[#61736c]">Hospitality · People · Places</p>
            </div>

            <div className="mb-8">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[.24em] text-[#0f5a45]">Start your journey</p>
              <h1 className="display-serif text-4xl leading-tight tracking-[-.035em] text-[#17332e] sm:text-5xl">Create an account. Stay a little closer.</h1>
              <p className="mt-4 text-sm leading-6 text-[#61736c]">Save places you love, manage bookings and keep every Mizoram adventure in one account.</p>
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
                <Label htmlFor="password" className="text-[#17332e]">Create password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-[#0f5a45]" aria-hidden="true" />
                  <Input id="password" name="password" type="password" required autoComplete="new-password" placeholder="At least 8 characters" className="h-12 rounded-xl border-[#cfc9bc] bg-white pl-11 text-[#17332e] shadow-sm placeholder:text-[#9aa6a1] focus-visible:ring-[#0f5a45]" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-[#17332e]">Confirm password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-[#0f5a45]" aria-hidden="true" />
                  <Input id="confirmPassword" name="confirmPassword" type="password" required autoComplete="new-password" placeholder="Re-enter your password" className="h-12 rounded-xl border-[#cfc9bc] bg-white pl-11 text-[#17332e] shadow-sm placeholder:text-[#9aa6a1] focus-visible:ring-[#0f5a45]" />
                </div>
              </div>

              <div className="rounded-xl border border-[#d9d3c6] bg-[#efeae0]/65 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-[#e4eee8] text-[#0f5a45]"><Check className="size-4" /></div>
                  <div><p className="text-xs font-bold text-[#17332e]">One account, a simpler trip</p><p className="mt-1 text-xs leading-5 text-[#61736c]">Your account gives you access to saved stays, bookings and host tools as they become available.</p></div>
                </div>
              </div>

              <FormError message={state.error} />
              {state.message && <p role="status" className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">{state.message}</p>}

              <Button type="submit" disabled={pending} size="lg" className="h-12 w-full rounded-xl bg-[#0f5a45] text-base font-semibold text-white shadow-sm transition hover:bg-[#0b4736]">
                {pending ? "Creating account…" : "Create account"}
                {!pending && <ArrowRight className="ml-2 size-4" />}
              </Button>
            </form>

            <p className="mt-7 text-center text-sm text-[#61736c] sm:hidden">Already have an account? <Link href="/login" className="font-semibold text-[#0f5a45]">Sign in</Link></p>
            <p className="mt-7 text-center text-xs leading-5 text-[#8a9690]">By creating an account, you agree to use MizoramStay in accordance with our terms and privacy policy.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
