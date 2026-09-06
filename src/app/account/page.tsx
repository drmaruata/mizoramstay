import Link from 'next/link'
import { ArrowRight, CalendarDays, CheckCircle2, Heart, LogOut, MapPin, Plane, ShieldCheck, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { requireUser } from '@/lib/auth/session'
import { signOut } from '@/app/(auth)/signout/actions'

const upcoming = [
  { reference: 'MZ-102873', property: 'The Hillside Homestay', place: 'Aizawl, Mizoram', dates: '12–16 Oct 2026', guests: '2 adults', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80' },
  { reference: 'MZ-102861', property: 'Reiek View Homestay', place: 'Reiek, Aizawl', dates: '18–20 Nov 2026', guests: '2 adults', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1000&q=80' },
]

export default async function AccountPage() {
  const user = await requireUser()
  const roleLabel = user.role === 'HOST' ? 'Host account' : user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? 'Admin account' : 'Traveller account'
  const dashboardHref = user.role === 'HOST' ? '/host/dashboard' : user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? '/admin' : '/account'
  const name = user.email?.split('@')[0] ?? 'traveller'
  const initials = name.slice(0, 2).toUpperCase()

  return (
    <main className="min-h-screen bg-[#f7f3eb] text-[#17332e]">
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-8 md:px-6 md:pt-12">
        <div className="rounded-[30px] bg-[#154637] px-5 py-6 text-white shadow-[0_18px_50px_rgba(21,70,55,.14)] md:px-7 md:py-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-4"><div className="grid size-16 shrink-0 place-items-center rounded-3xl bg-white/10 text-xl font-black ring-1 ring-white/15">{initials}</div><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-white/55">{roleLabel}</p><h1 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">Welcome back.</h1><p className="mt-2 text-sm text-white/65">{user.email ?? 'Signed-in traveller'} · Manage your Mizoram trips in one place.</p></div></div>
            <div className="flex flex-wrap gap-2"><Link href="/stays"><Button className="bg-white text-[#154637] hover:bg-white/90"><Plane className="size-4" /> Find a stay</Button></Link>{dashboardHref !== '/account' && <Link href={dashboardHref}><Button variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/15">Open {user.role === 'HOST' ? 'host studio' : 'admin'} <ArrowRight className="size-4" /></Button></Link>}<form action={signOut}><Button variant="ghost" className="text-white hover:bg-white/10"><LogOut className="size-4" /> Sign out</Button></form></div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3"><div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#7d8b85]">Upcoming</p><p className="mt-2 text-3xl font-black">2 trips</p><p className="mt-1 text-xs text-muted-foreground">Your next Mizoram stays</p></div><div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#7d8b85]">Saved</p><p className="mt-2 text-3xl font-black">12 stays</p><p className="mt-1 text-xs text-muted-foreground">Wishlist across destinations</p></div><div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#7d8b85]">Reviews</p><p className="mt-2 flex items-center gap-2 text-3xl font-black">4.9 <Star className="size-5 fill-current text-[#d4942f]" /></p><p className="mt-1 text-xs text-muted-foreground">Your traveller rating</p></div></div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_340px]">
          <Card className="overflow-hidden border-black/5 shadow-sm"><CardHeader className="flex flex-row items-center justify-between border-b border-black/5 px-5 py-4"><div><CardTitle className="text-xl">Upcoming trips</CardTitle><p className="mt-1 text-xs text-muted-foreground">Your booked stays and important travel details.</p></div><Link href="/stays" className="text-xs font-bold text-[#1b5d47]">Plan another trip</Link></CardHeader><CardContent className="p-4">{upcoming.map((trip) => <Link href={`/booking/${trip.reference}`} key={trip.reference} className="group mb-3 flex flex-col overflow-hidden rounded-3xl border border-black/5 bg-[#fbfaf7] transition hover:-translate-y-0.5 hover:shadow-md sm:flex-row last:mb-0"><div className="relative h-44 w-full overflow-hidden sm:h-auto sm:w-48"><img src={trip.image} alt={trip.property} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></div><div className="flex min-w-0 flex-1 flex-col justify-center p-5"><div className="flex flex-wrap items-center gap-2"><Badge>Confirmed</Badge><span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{trip.reference}</span></div><h3 className="mt-3 text-lg font-black">{trip.property}</h3><p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="size-3.5" /> {trip.place}</p><div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-[#52665e]"><span className="inline-flex items-center gap-1.5 rounded-full bg-[#eaf0eb] px-3 py-1.5"><CalendarDays className="size-3.5" /> {trip.dates}</span><span className="rounded-full bg-[#eef1ed] px-3 py-1.5">{trip.guests}</span></div></div><div className="flex items-center justify-end p-5 pt-0 sm:p-5"><ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1" /></div></Link>)}</CardContent></Card>

          <div className="space-y-4">
            <Card className="border-black/5 shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Heart className="size-5 text-[#c67563]" /> Wishlist</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-muted-foreground">Keep your favourite stays together while you compare dates, locations and rooms.</p><Link href="/stays" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#1b5d47]">Browse saved stays <ArrowRight className="size-3.5" /></Link></CardContent></Card>
            <Card className="border-black/5 shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Star className="size-5 text-[#d4942f]" /> Reviews</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-muted-foreground">Reviews become available after a completed booking, keeping feedback tied to real stays.</p><div className="mt-4 flex items-center gap-2 text-sm font-bold"><CheckCircle2 className="size-4 text-[#2b7a5c]" /> Verified traveller reviews</div></CardContent></Card>
            <Card className="border-black/5 bg-[#eef3ee] shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><ShieldCheck className="size-5 text-[#1b5d47]" /> Account security</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-muted-foreground">Your session and identity are handled through Supabase Auth. Keep your account details current.</p></CardContent></Card>
          </div>
        </div>
      </section>
    </main>
  )
}
