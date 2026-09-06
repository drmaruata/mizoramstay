import Image from "next/image";
import Link from "next/link";
import { Check, MapPin, ShieldCheck, Sparkles } from "lucide-react";

const highlights = ["Verified local stays", "Secure booking experience", "Real Mizo hospitality"];

export function AuthVisualPanel({ mode }: { mode: "login" | "signup" }) {
  const isSignup = mode === "signup";
  return (
    <aside className="relative hidden min-h-screen overflow-hidden bg-[#12372f] text-white lg:block lg:w-[45%]">
      <Image src="https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1800&q=90" alt="Mizoram mountain landscape at golden hour" fill priority sizes="45vw" className="object-cover" />
      <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(9,40,33,.25),rgba(9,40,33,.48)_48%,rgba(7,30,25,.94))]" />
      <div className="relative flex min-h-screen flex-col justify-between p-10 xl:p-14">
        <Link href="/" className="w-fit leading-none">
          <span className="block text-[27px] font-black tracking-[-.06em]">mizoram<span className="text-[#e2aa3e]">stay</span></span>
          <span className="mt-1 block text-[8px] font-semibold uppercase tracking-[.28em] text-white/65">Hospitality · People · Places</span>
        </Link>
        <div className="max-w-lg pb-8">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[.16em] text-white/85 backdrop-blur-sm"><Sparkles className="size-3.5 text-[#e2aa3e]" /> Mizoram, more meaningfully</div>
          <h2 className="display-serif text-balance text-5xl leading-[.95] xl:text-6xl">
            {isSignup ? <>Make your next journey a{" "}<span className="italic text-[#e2aa3e]">local story.</span></> : <>Welcome back to the{" "}<span className="italic text-[#e2aa3e]">blue mountains.</span></>}
          </h2>
          <p className="mt-6 max-w-md text-sm leading-7 text-white/75 xl:text-base">{isSignup ? "Create one account to save stays, manage bookings and build your connection to Mizoram." : "Sign in to continue planning stays, revisit your trips and manage your MizoramStay experience."}</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {highlights.map((highlight) => <div key={highlight} className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/10 px-3 py-3 text-xs font-medium text-white/85 backdrop-blur-sm"><Check className="size-4 shrink-0 text-[#e2aa3e]" /><span>{highlight}</span></div>)}
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-white/15 pt-5 text-xs text-white/55"><span className="inline-flex items-center gap-2"><ShieldCheck className="size-4" /> Built around verified places</span><span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" /> Mizoram, India</span></div>
      </div>
    </aside>
  );
}
