import Link from 'next/link'
import { ArrowRight, Heart, LogOut, Plane, ShieldCheck, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { requireUser } from '@/lib/auth/session'
import { signOut } from '@/app/(auth)/signout/actions'

export default async function AccountPage() {
  const user = await requireUser()
  const dashboardHref = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? '/admin' : user.role === 'HOST' ? '/host/dashboard' : '/account'
  const roleLabel = user.role === 'HOST' ? 'Host account' : user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? 'Admin account' : 'Traveller account'

  return (
    <main className="min-h-screen bg-[#f7f3eb]">
      <section className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
        <div className="flex flex-col gap-6 border-b border-[#ddd8cc] pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.25em] text-primary">Your account</p>
            <h1 className="display-serif mt-2 text-4xl leading-tight text-[#17332e] md:text-5xl">Welcome back.</h1>
            <p className="mt-3 text-sm text-muted-foreground">{user.email ?? 'Signed in user'} · {roleLabel}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {dashboardHref !== '/account' && <Link href={dashboardHref}><Button variant="outline" className="rounded-xl border-[#cfc9bc] bg-white">Open dashboard <ArrowRight className="size-4" /></Button></Link>}
            <form action={signOut}><Button type="submit" variant="outline" className="rounded-xl border-[#cfc9bc] bg-white text-[#17332e] hover:bg-[#f2eee5]"><LogOut className="size-4" /> Sign out</Button></form>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <Card className="border-[#ddd8cc] shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-[#17332e]"><Plane className="size-5 text-primary" /> Trips</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-muted-foreground">Your upcoming and completed stays will appear here.</p><Link href="/stays"><Button variant="outline" className="mt-4 rounded-xl border-[#cfc9bc] bg-white">Browse stays <ArrowRight className="size-4" /></Button></Link></CardContent></Card>
          <Card className="border-[#ddd8cc] shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-[#17332e]"><Heart className="size-5 text-primary" /> Wishlist</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-muted-foreground">Saved properties are linked to your authenticated user record.</p><Link href="/stays"><Button variant="outline" className="mt-4 rounded-xl border-[#cfc9bc] bg-white">Browse stays <ArrowRight className="size-4" /></Button></Link></CardContent></Card>
          <Card className="border-[#ddd8cc] shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-[#17332e]"><Star className="size-5 text-primary" /> Reviews</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-muted-foreground">Only completed bookings can create verified reviews.</p></CardContent></Card>
          <Card className="border-[#ddd8cc] shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-[#17332e]"><ShieldCheck className="size-5 text-primary" /> Account & security</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-muted-foreground">Your session is managed securely through Supabase Auth.</p><Link href="/"><Button variant="outline" className="mt-4 rounded-xl border-[#cfc9bc] bg-white">Back to homepage <ArrowRight className="size-4" /></Button></Link></CardContent></Card>
        </div>
      </section>
    </main>
  )
}
