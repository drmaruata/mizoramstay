import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronDown,
  Compass,
  Heart,
  Leaf,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SearchPanel } from '@/components/public/search-panel'
import { PropertyCard } from '@/components/public/property-card'
import { createClient } from '@/lib/supabase/server'
import { createSupabasePropertyService } from '@/features/properties/property.service'

const fallbackImage = 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1400&q=85'

const experiences = [
  { title: 'Trek the living root bridges', meta: 'Nature & adventure', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=85' },
  { title: 'Explore local villages', meta: 'Culture & heritage', image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=800&q=85' },
  { title: 'Taste Mizo cuisine', meta: 'Food & lifestyle', image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=85' },
  { title: 'Visit tea gardens', meta: 'Nature & relaxation', image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=85' },
  { title: 'Attend local festivals', meta: 'Culture & events', image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=85' },
  { title: 'Discover hidden waterfalls', meta: 'Off the beaten path', image: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=800&q=85' },
]

const steps = [
  { number: '01', title: 'Search', text: 'Find stays, experiences and destinations.' },
  { number: '02', title: 'Choose', text: 'Compare verified options that suit your style.' },
  { number: '03', title: 'Book', text: 'Secure your stay easily and safely.' },
  { number: '04', title: 'Experience', text: 'Create unforgettable memories in Mizoram.' },
]

const faqs = [
  'Is MizoramStay safe and reliable?',
  'How do I make a booking?',
  'Can I cancel or modify my booking?',
  'Are the stays verified?',
  'What payment methods are accepted?',
  'Do you offer travel support?',
]

export default async function HomePage() {
  const db = await createClient()
  const service = createSupabasePropertyService(db)
  const properties = await service.listPublished()

  const { data: destinations } = await db
    .from('destinations')
    .select('slug, name, district, short_description, hero_image')
    .eq('status', 'PUBLISHED')
    .order('name', { ascending: true })

  const destinationCards = (destinations ?? []).slice(0, 6).map((destination) => ({
    slug: destination.slug,
    name: destination.name,
    district: destination.district,
    blurb: destination.short_description ?? 'Discover the character of Mizoram.',
    image: destination.hero_image ?? fallbackImage,
  }))

  return (
    <main className="min-h-screen">
      <section className="relative min-h-[720px] overflow-hidden bg-[#12372f] text-white">
        <Image src={fallbackImage} alt="Mizoram mountain landscape" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#102c27]/65 via-[#12372f]/15 to-[#102c27]/85" />
        <div className="relative mx-auto flex min-h-[720px] max-w-7xl flex-col px-5 md:px-8">
          <header className="flex items-center justify-between border-b border-white/15 py-5">
            <Link href="/" className="leading-none">
              <span className="block text-[24px] font-black tracking-[-.06em]">mizoram<span className="text-[#e2aa3e]">stay</span></span>
              <span className="block text-[7px] font-semibold uppercase tracking-[.32em] text-white/65">Hospitality · People · Places</span>
            </Link>
            <nav className="hidden items-center gap-8 text-sm font-medium text-white/90 md:flex">
              <Link href="/stays" className="transition hover:text-white">Find a stay</Link>
              <Link href="/destinations" className="transition hover:text-white">Explore Mizoram</Link>
              <Link href="/host/properties" className="transition hover:text-white">List your property</Link>
            </nav>
            <Link href="/account">
              <Button variant="outline" className="rounded-full border-white/40 bg-white/10 text-white hover:bg-white hover:text-[#12372f]">Sign in</Button>
            </Link>
          </header>

          <div className="flex flex-1 items-center pb-24 pt-16 md:pb-28 md:pt-20">
            <div className="w-full">
              <div className="max-w-3xl">
                <p className="mb-5 text-xs font-bold uppercase tracking-[.28em] text-[#e4ad42]">The hills are calling</p>
                <h1 className="display-serif text-balance text-5xl leading-[.94] md:text-7xl lg:text-[84px]">Stay where Mizoram feels <span className="italic text-[#e4ad42]">most alive.</span></h1>
                <p className="mt-6 max-w-xl text-base leading-7 text-white/85 md:text-lg">Unique stays. Authentic experiences. A more meaningful way to explore Mizoram.</p>
              </div>

              <div className="mt-9 max-w-5xl">
                <SearchPanel />
              </div>

              <div className="mt-5 flex items-center gap-2 text-xs text-white/70">
                <MapPin className="size-3.5" /> Discover verified stays and local places across Mizoram.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#faf7f0] py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.25em] text-primary">Explore</p>
              <h2 className="display-serif mt-2 text-4xl md:text-5xl">Discover Mizoram by destination</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">From misty mountains to vibrant culture, each destination has a unique story.</p>
            </div>
            <Link href="/destinations" className="hidden items-center gap-2 text-sm font-semibold text-primary sm:flex">View all destinations <ArrowRight className="size-4" /></Link>
          </div>

          <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {destinationCards.map((destination) => (
              <Link key={destination.slug} href={`/destinations/${destination.slug}`} className="group relative aspect-[.82] overflow-hidden rounded-xl bg-muted lg:aspect-[.72]">
                <Image src={destination.image} alt={destination.name} fill sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 17vw" className="object-cover transition duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" />
                <div className="absolute inset-x-4 bottom-4 text-white">
                  <p className="text-lg font-bold">{destination.name}</p>
                  <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-white/75">{destination.blurb}</p>
                  <ArrowRight className="mt-3 size-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y section-rule bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.25em] text-primary">Verified stays</p>
              <h2 className="display-serif mt-2 text-4xl md:text-5xl">Handpicked stays, trusted and verified</h2>
              <p className="mt-3 text-sm text-muted-foreground">Stay with confidence. Discover beautiful homestays across Mizoram.</p>
            </div>
            <Link href="/stays" className="hidden items-center gap-2 text-sm font-semibold text-primary sm:flex">View all stays <ArrowRight className="size-4" /></Link>
          </div>
          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {properties.slice(0, 4).map((property) => <PropertyCard key={property.id} property={property} />)}
          </div>
          {properties.length === 0 && (
            <div className="mt-8 rounded-3xl border border-dashed p-10 text-center">
              <p className="font-semibold">New verified stays are being added.</p>
              <p className="mt-2 text-sm text-muted-foreground">Explore destinations while the marketplace grows.</p>
              <Link href="/destinations"><Button className="mt-5">Explore destinations</Button></Link>
            </div>
          )}
        </div>
      </section>

      <section className="bg-[#f2eee5] py-16 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 md:px-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.25em] text-primary">Authentic. Local. Meaningful.</p>
            <h2 className="display-serif mt-3 text-4xl leading-tight md:text-5xl">More than a stay.<br />A story worth sharing.</h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-muted-foreground">Stay with local hosts, experience Mizo hospitality, and discover a side of India that’s real, warm and unforgettable.</p>
            <Link href="/destinations"><Button className="mt-7 rounded-xl">Explore Mizoram <ArrowRight className="size-4" /></Button></Link>
          </div>
          <div className="relative overflow-hidden rounded-3xl">
            <Image src="https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1400&q=85" alt="A peaceful local stay in a mountain setting" width={1400} height={900} className="h-[380px] w-full object-cover md:h-[440px]" />
            <div className="absolute bottom-5 left-5 max-w-sm rounded-2xl border border-white/30 bg-[#12372f]/90 p-5 text-white backdrop-blur-md">
              <p className="display-serif text-2xl">“In Mizoram, you’re not just a guest. You’re family.”</p>
              <div className="mt-4 h-px w-10 bg-[#e2aa3e]" />
            </div>
            <div className="absolute right-5 top-5 hidden rounded-2xl bg-white/95 p-4 shadow-xl sm:block">
              <div className="space-y-3 text-xs font-semibold text-[#17332e]">
                <div className="flex items-center gap-2"><Check className="size-4 text-primary" /> Stay with local families</div>
                <div className="flex items-center gap-2"><Check className="size-4 text-primary" /> Experience authentic culture</div>
                <div className="flex items-center gap-2"><Check className="size-4 text-primary" /> Support local communities</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#faf7f0] py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-[.25em] text-primary">How MizoramStay works</p>
            <h2 className="display-serif mt-2 text-4xl md:text-5xl">Plan your journey in four simple steps</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">From discovery to check-out, we keep the journey simple and safe.</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.number} className="relative rounded-2xl border bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-full bg-[#e8f0eb] text-sm font-bold text-primary">{index + 1}</span>
                  <span className="text-3xl font-light text-[#d9d4c8]">{step.number}</span>
                </div>
                <h3 className="mt-6 text-lg font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.text}</p>
                {index < steps.length - 1 && <ArrowRight className="absolute -right-4 top-8 z-10 hidden size-7 rounded-full bg-[#faf7f0] p-1 text-muted-foreground md:block" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y section-rule bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.25em] text-primary">Things to experience</p>
              <h2 className="display-serif mt-2 text-4xl md:text-5xl">More than homestays</h2>
              <p className="mt-3 text-sm text-muted-foreground">From living traditions to breathtaking landscapes — discover experiences that make Mizoram special.</p>
            </div>
            <Link href="/destinations" className="hidden items-center gap-2 text-sm font-semibold text-primary sm:flex">Explore more <ArrowRight className="size-4" /></Link>
          </div>
          <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {experiences.map((experience) => (
              <Link key={experience.title} href="/destinations" className="group relative aspect-[.82] overflow-hidden rounded-xl">
                <Image src={experience.image} alt={experience.title} fill sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 17vw" className="object-cover transition duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute inset-x-4 bottom-4 text-white"><p className="text-sm font-bold leading-5">{experience.title}</p><p className="mt-1 text-[10px] uppercase tracking-[.12em] text-white/65">{experience.meta}</p><ArrowRight className="mt-3 size-4 transition-transform group-hover:translate-x-1" /></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f2eee5] py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-[.25em] text-primary">Loved by guests and hosts</p>
            <h2 className="display-serif mt-2 text-4xl md:text-5xl">Stories from our community</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              ['“An amazing experience! The homestay was beautiful, the hosts were so warm, and the views were incredible.”', 'Priya S.', 'New Delhi', '5.0'],
              ['“Felt like home. The hospitality, food and local insights made our trip truly special. Can’t wait to come back!”', 'Rohan K.', 'Bengaluru', '4.8'],
              ['“A wonderful platform that connects genuine travellers with real local experiences. Highly recommended.”', 'Anna T.', 'Singapore', '4.9'],
            ].map(([quote, name, city, rating]) => (
              <article key={name} className="rounded-2xl border bg-white p-6 shadow-sm">
                <span className="text-3xl font-serif text-primary/50">“</span>
                <p className="mt-1 text-sm leading-6 text-foreground/80">{quote.replace(/[“”]/g, '')}</p>
                <div className="my-5 h-px bg-border" />
                <div className="flex items-end justify-between gap-3">
                  <div><p className="text-sm font-bold">{name}</p><p className="mt-1 text-xs text-muted-foreground">{city}</p></div>
                  <div className="flex items-center gap-1 text-xs font-bold"><Star className="size-3.5 fill-current text-accent" /> {rating}</div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#faf7f0] py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-5 md:px-8">
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-[.25em] text-primary">Good to know</p>
            <h2 className="display-serif mt-2 text-4xl md:text-5xl">Quick answers for your trip</h2>
          </div>
          <div className="mt-10 grid gap-x-10 md:grid-cols-2">
            {faqs.map((faq) => (
              <details key={faq} className="group border-t border-[#cfc9bc] py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium"><span>{faq}</span><ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" /></summary>
                <p className="pt-3 text-sm leading-6 text-muted-foreground">We are building MizoramStay around clear information, verified properties and a simple guest journey. Details for this question will appear here as the corresponding marketplace feature is enabled.</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0d4034] py-14 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 px-5 md:flex-row md:items-center md:justify-between md:px-8">
          <div><p className="text-[11px] font-bold uppercase tracking-[.25em] text-[#e2aa3e]">For thoughtful hosts</p><h2 className="display-serif mt-2 text-3xl md:text-4xl">Your home has a story worth sharing.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-white/65">Join the growing community of local hosts and create a digital presence for your property.</p></div>
          <Link href="/host/properties"><Button size="lg" className="rounded-xl bg-white text-[#0d4034] hover:bg-white/90">List your property <ArrowRight className="size-4" /></Button></Link>
        </div>
      </section>

      <footer className="bg-[#092c25] text-white">
        <div className="mx-auto max-w-7xl px-5 py-12 md:px-8">
          <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1.4fr]">
            <div><span className="text-2xl font-black tracking-[-.06em]">mizoram<span className="text-[#e2aa3e]">stay</span></span><p className="mt-3 max-w-xs text-sm leading-6 text-white/55">Discover, stay and belong. Mizoram’s homestay and tourism marketplace.</p></div>
            <div><p className="text-xs font-bold uppercase tracking-[.18em] text-white/40">Quick links</p><div className="mt-4 space-y-2 text-sm text-white/70"><Link href="/stays" className="block hover:text-white">Find a stay</Link><Link href="/destinations" className="block hover:text-white">Explore Mizoram</Link><Link href="/host/properties" className="block hover:text-white">List your property</Link></div></div>
            <div><p className="text-xs font-bold uppercase tracking-[.18em] text-white/40">For hosts</p><div className="mt-4 space-y-2 text-sm text-white/70"><Link href="/host/dashboard" className="block hover:text-white">Host dashboard</Link><Link href="/host/properties" className="block hover:text-white">Manage properties</Link><Link href="/account" className="block hover:text-white">Your account</Link></div></div>
            <div><p className="text-xs font-bold uppercase tracking-[.18em] text-white/40">Get travel inspiration</p><p className="mt-4 text-sm text-white/55">Stories, destinations and local travel ideas from Mizoram.</p><div className="mt-4 flex gap-2"><div className="grid size-9 place-items-center rounded-full border border-white/15"><Compass className="size-4" /></div><div className="grid size-9 place-items-center rounded-full border border-white/15"><Heart className="size-4" /></div><div className="grid size-9 place-items-center rounded-full border border-white/15"><Sparkles className="size-4" /></div></div></div>
          </div>
          <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-5 text-xs text-white/40 md:flex-row md:items-center md:justify-between"><p>© 2026 MizoramStay. All rights reserved.</p><div className="flex gap-5"><span>Privacy Policy</span><span>Terms of Service</span><span>Cookie Policy</span></div><p>Made with <span className="text-[#e2aa3e]">♥</span> for Mizoram</p></div>
        </div>
      </footer>
    </main>
  )
}
