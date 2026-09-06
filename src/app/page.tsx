import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  BedDouble,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Compass,
  Heart,
  Leaf,
  MapPin,
  Plus,
  Search,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SearchPanel } from '@/components/public/search-panel'
import { NewsletterForm } from '@/components/home/newsletter-form'
import { createClient } from '@/lib/supabase/server'
import { createSupabasePropertyService } from '@/features/properties/property.service'
import { formatINR } from '@/lib/utils'

const heroImage = 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=2400&q=80'

const fallbackDestinations = [
  { slug: 'aizawl', name: 'Aizawl', blurb: 'City views & culture', image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80' },
  { slug: 'champhai', name: 'Champhai', blurb: 'Rolling hills & tea gardens', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80' },
  { slug: 'lunglei', name: 'Lunglei', blurb: 'Rivers, valleys & adventure', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80' },
  { slug: 'mamit', name: 'Mamit', blurb: 'Untouched natural beauty', image: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=800&q=80' },
  { slug: 'reiek', name: 'Reiek', blurb: 'Hills, forests & serenity', image: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=800&q=80' },
  { slug: 'thenzawl', name: 'Thenzawl', blurb: 'Wild landscapes & traditions', image: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=800&q=80' },
]

const fallbackStays = [
  { id: '1', slug: 'hillside-homestay', name: 'The Hillside Homestay', location: 'Aizawl, Mizoram', rating: 4.9, reviews: 40, price: 2500, image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80' },
  { id: '2', slug: 'reiek-view-homestay', name: 'Reiek View Homestay', location: 'Reiek, Aizawl', rating: 4.8, reviews: 32, price: 2800, image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80' },
  { id: '3', slug: 'zoram-eco-stay', name: 'Zoram Eco Stay', location: 'Champhai', rating: 4.9, reviews: 27, price: 2200, image: 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=800&q=80' },
  { id: '4', slug: 'serene-valley-homestay', name: 'Serene Valley Homestay', location: 'Lunglei', rating: 4.7, reviews: 19, price: 1800, image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80' },
]

const experiences = [
  { title: 'Trek the living root bridges', meta: 'Nature & adventure', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80' },
  { title: 'Explore local villages', meta: 'Culture & heritage', image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=800&q=80' },
  { title: 'Taste Mizo cuisine', meta: 'Food & lifestyle', image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80' },
  { title: 'Visit tea gardens', meta: 'Nature & relaxation', image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80' },
  { title: 'Attend local festivals', meta: 'Culture & events', image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=80' },
  { title: 'Discover hidden waterfalls', meta: 'Off the beaten path', image: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=800&q=80' },
]

const steps = [
  { icon: Search, title: 'Search', text: 'Find stays, experiences and destinations.' },
  { icon: BedDouble, title: 'Choose', text: 'Compare verified options that suit your style.' },
  { icon: CalendarDays, title: 'Book', text: 'Secure your stay easily and safely.' },
  { icon: Heart, title: 'Experience', text: 'Create unforgettable memories in Mizoram.' },
]

const testimonials = [
  { quote: '"An amazing experience! The homestay was beautiful, the hosts were so warm, and the views were incredible. MizoramStay made the whole process seamless."', name: 'Priya S.', city: 'New Delhi', rating: '5.0', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80' },
  { quote: '"Felt like home. The hospitality, food and local insights made our trip truly special. Can’t wait to come back!"', name: 'Rohan K.', city: 'Bengaluru', rating: '4.8', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80' },
  { quote: '"A wonderful platform that connects genuine travellers with real local experiences. Highly recommended!"', name: 'Anna T.', city: 'Singapore', rating: '4.9', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80' },
]

const faqsLeft = ['Is MizoramStay safe and reliable?', 'How do I make a booking?', 'Can I cancel or modify my booking?']
const faqsRight = ['Are the stays verified?', 'What payment methods are accepted?', 'Do you offer travel support?']

export default async function HomePage() {
  const db = await createClient()
  const service = createSupabasePropertyService(db)
  const properties = await service.listPublished().catch(() => [])

  const { data: destinations } = await db
    .from('destinations')
    .select('slug, name, district, short_description, hero_image')
    .eq('status', 'PUBLISHED')
    .order('name', { ascending: true })

  const destinationCards = ((destinations ?? []).length > 0
    ? (destinations ?? []).slice(0, 6).map((d) => ({
        slug: d.slug,
        name: d.name,
        blurb: d.short_description ?? d.district ?? 'Discover the character of Mizoram.',
        image: d.hero_image ?? heroImage,
      }))
    : fallbackDestinations
  ).slice(0, 6)

  const stayCards = (properties.length > 0
    ? properties.slice(0, 4).map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        location: `${p.location}, ${p.district}`,
        rating: p.rating,
        reviews: p.reviewCount,
        price: p.priceFrom,
        image: p.imageUrl,
      }))
    : fallbackStays
  ).slice(0, 4)

  return (
    <main className="min-h-screen bg-[#faf7f0] text-[#1a2e28]">
      {/* HERO */}
      <section className="relative overflow-hidden bg-[#12372f] text-white">
        <Image src={heroImage} alt="Sunset over Mizoram hills" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/5 to-black/35" />
        <div className="relative mx-auto flex min-h-[640px] max-w-[1280px] flex-col px-6 md:min-h-[700px] lg:px-10">
          <header className="flex items-center justify-between py-5">
            <Link href="/" className="leading-none">
              <span className="block text-[22px] font-extrabold tracking-tight">mizoram<span className="text-[#e8a93d]">stay</span></span>
              <span className="mt-1 block text-[7px] font-semibold uppercase tracking-[.3em] text-white/60">Hospitality · People · Places</span>
            </Link>
            <nav className="hidden items-center gap-8 text-[13px] font-medium text-white/90 md:flex">
              <Link href="/stays" className="transition hover:text-white">Find a stay</Link>
              <Link href="/destinations" className="transition hover:text-white">Explore Mizoram</Link>
              <Link href="/host/properties" className="transition hover:text-white">List your property</Link>
            </nav>
            <Link href="/login" className="rounded-full border border-white/50 px-5 py-1.5 text-[13px] font-semibold text-white transition hover:bg-white hover:text-[#12372f]">Sign in</Link>
          </header>

          <div className="flex flex-1 flex-col justify-center pb-16 pt-10 md:pb-20">
            <h1 className="display-serif max-w-[560px] text-[44px] font-medium leading-[1.02] md:text-[64px]">Stay where<br />Mizoram feels<br />most alive.</h1>
            <p className="mt-4 max-w-[520px] text-[13px] leading-5 text-white/85">Unique stays. Authentic experiences. A more meaningful way<br className="hidden md:block" /> to explore Mizoram.</p>
            <div className="mt-7 max-w-[1060px]"><SearchPanel /></div>
            <div className="mt-6 flex items-end justify-between gap-6">
              <div className="hidden md:block" />
              <div className="ml-auto text-right">
                <p className="font-serif text-[22px] italic leading-none text-white/90">Mizoram</p>
                <p className="mt-1 text-[8px] font-bold uppercase tracking-[.22em] text-white/70">More than a destination<br />A feeling</p>
                <p className="mt-3 flex items-center justify-end gap-1.5 text-[11px] font-medium text-white/85"><MapPin className="size-3.5" /> Rurtlang Hills, Aizawl</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DESTINATIONS */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#5a6f67]">Explore</p>
              <h2 className="display-serif mt-1.5 text-[28px] font-medium md:text-[34px]">Discover Mizoram by destination</h2>
              <p className="mt-1.5 text-[12px] text-[#6b7f78]">From misty mountains to vibrant culture, each destination has a unique story.</p>
            </div>
            <Link href="/destinations" className="hidden shrink-0 items-center gap-1.5 text-[12px] font-semibold text-[#1a2e28] sm:flex">View all destinations <ArrowRight className="size-3.5" /></Link>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {destinationCards.map((d) => (
              <Link key={d.slug} href={`/destinations/${d.slug}`} className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-[#e5ddd0]">
                <Image src={d.image} alt={d.name} fill sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 16vw" className="object-cover transition duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <div className="absolute inset-x-3.5 bottom-3.5 text-white">
                  <p className="text-[15px] font-bold leading-tight">{d.name}</p>
                  <p className="mt-0.5 truncate text-[10px] text-white/75">{d.blurb}</p>
                  <span className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-white/90">Explore <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* VERIFIED STAYS */}
      <section className="pb-12 md:pb-16">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#5a6f67]">Verified stays</p>
              <h2 className="display-serif mt-1.5 text-[28px] font-medium md:text-[34px]">Handpicked stays, trusted and verified</h2>
              <p className="mt-1.5 text-[12px] text-[#6b7f78]">Stay with confidence. Discover beautiful homestays across Mizoram, verified for quality and hospitality.</p>
            </div>
            <Link href="/stays" className="hidden shrink-0 items-center gap-1.5 text-[12px] font-semibold text-[#1a2e28] sm:flex">View all stays <ArrowRight className="size-3.5" /></Link>
          </div>
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stayCards.map((stay) => (
              <Link key={stay.id} href={`/stays/${stay.slug}`} className="group overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_2px_12px_rgba(20,40,35,.06)] transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image src={stay.image} alt={stay.name} fill sizes="(max-width:768px) 100vw, 25vw" className="object-cover transition duration-500 group-hover:scale-105" />
                  <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-[#0f5a45]"><BadgeCheck className="size-3" /> Verified</span>
                  <button aria-label={`Save ${stay.name}`} className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-black/25 text-white backdrop-blur transition hover:bg-black/45"><Heart className="size-4" /></button>
                </div>
                <div className="p-4">
                  <h3 className="text-[13px] font-bold leading-snug">{stay.name}</h3>
                  <p className="mt-0.5 text-[11px] text-[#6b7f78]">{stay.location}</p>
                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[11px] font-semibold"><Star className="size-3.5 fill-[#e8a93d] text-[#e8a93d]" /> {stay.rating.toFixed(1)} <span className="font-normal text-[#8a9a94]">({stay.reviews})</span></span>
                    <span className="text-[12px] font-extrabold">{formatINR(stay.price)}<span className="font-normal text-[#8a9a94]"> /night</span></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* STORY */}
      <section className="bg-[#f1ece1] py-12 md:py-16">
        <div className="mx-auto grid max-w-[1280px] items-center gap-10 px-6 lg:grid-cols-[380px_1fr_230px] lg:px-10">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#5a6f67]">Authentic. Local. Meaningful.</p>
            <h2 className="display-serif mt-2 text-[30px] font-medium leading-[1.12] md:text-[36px]">More than a stay.<br />A story worth sharing.</h2>
            <p className="mt-4 text-[12px] leading-6 text-[#5a6f67]">Stay with local hosts, experience Mizo hospitality, and discover a side of India that&apos;s real, warm and unforgettable.</p>
            <Link href="/destinations"><Button className="mt-6 rounded-full bg-[#0d3d2e] px-6 text-[13px] hover:bg-[#0a2e23]">Explore experiences <ArrowRight className="size-4" /></Button></Link>
          </div>
          <div className="relative overflow-hidden rounded-2xl">
            <Image src="https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1400&q=80" alt="Veranda overlooking Mizoram hills" width={1200} height={700} className="h-[300px] w-full object-cover md:h-[360px]" />
            <div className="absolute bottom-5 left-1/2 w-[calc(100%-40px)] max-w-[420px] -translate-x-1/2 rounded-xl bg-[#0d3d2e]/95 px-6 py-4 text-center text-white backdrop-blur">
              <p className="display-serif text-[17px] italic leading-snug">&ldquo;In Mizoram, you&apos;re not just a guest, you&apos;re family.&rdquo;</p>
            </div>
          </div>
          <div className="rounded-2xl border border-black/5 bg-[#faf7f0] p-5 shadow-sm">
            <ul className="space-y-4 text-[12px] font-medium">
              {(
                [
                  { icon: Heart, label: 'Stay with local families' },
                  { icon: Leaf, label: 'Experience authentic culture' },
                  { icon: BadgeCheck, label: 'Support local communities' },
                  { icon: Compass, label: 'Travel more responsibly' },
                ]
              ).map((item) => (
                <li key={item.label} className="flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e8f0eb] text-[#0f5a45]"><item.icon className="size-4" /></span>
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10">
          <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#5a6f67]">How MizoramStay works</p>
          <h2 className="display-serif mt-1.5 text-[28px] font-medium md:text-[34px]">Plan your journey in four simple steps</h2>
          <div className="mt-9 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <div key={step.title} className="relative">
                <div className="flex items-center gap-3">
                  <span className="grid size-7 place-items-center rounded-full bg-[#0d3d2e] text-[12px] font-bold text-white">{i + 1}</span>
                  <span className="grid size-11 place-items-center rounded-full bg-[#eef2ec] text-[#0d3d2e]"><step.icon className="size-5" /></span>
                  {i < steps.length - 1 && <span className="absolute left-[104px] right-[-24px] top-1/2 hidden border-t border-dashed border-[#c9c2b2] lg:block" />}
                </div>
                <h3 className="mt-4 text-[14px] font-bold">{step.title}</h3>
                <p className="mt-1 max-w-[220px] text-[12px] leading-5 text-[#6b7f78]">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EXPERIENCES */}
      <section className="pb-12 md:pb-16">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#5a6f67]">Things to experience</p>
              <h2 className="display-serif mt-1.5 text-[28px] font-medium md:text-[34px]">More than homestays</h2>
              <p className="mt-1.5 text-[12px] text-[#6b7f78]">From living traditions to breathtaking landscapes — discover experiences that make Mizoram special.</p>
            </div>
            <Link href="/destinations" className="hidden shrink-0 items-center gap-1.5 text-[12px] font-semibold text-[#1a2e28] sm:flex">View all experiences <ArrowRight className="size-3.5" /></Link>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {experiences.map((e) => (
              <Link key={e.title} href="/destinations" className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-[#e5ddd0]">
                <Image src={e.image} alt={e.title} fill sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 16vw" className="object-cover transition duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <div className="absolute inset-x-3.5 bottom-3.5 text-white">
                  <p className="text-[12px] font-bold leading-snug">{e.title}</p>
                  <p className="mt-1 text-[9px] uppercase tracking-wide text-white/70">{e.meta}</p>
                  <ArrowRight className="mt-2 size-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-[#f1ece1] py-12 md:py-16">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#5a6f67]">Loved by guests and hosts</p>
              <h2 className="display-serif mt-1.5 text-[28px] font-medium md:text-[34px]">Stories from our community</h2>
            </div>
            <div className="hidden gap-2 sm:flex">
              <button aria-label="Previous stories" className="grid size-9 place-items-center rounded-full border border-black/10 bg-white transition hover:bg-[#0d3d2e] hover:text-white"><ChevronLeft className="size-4" /></button>
              <button aria-label="Next stories" className="grid size-9 place-items-center rounded-full border border-black/10 bg-white transition hover:bg-[#0d3d2e] hover:text-white"><ChevronRight className="size-4" /></button>
            </div>
          </div>
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {testimonials.map((t) => (
              <article key={t.name} className="rounded-2xl border border-black/5 bg-[#faf7f0] p-6 shadow-[0_2px_12px_rgba(20,40,35,.05)]">
                <p className="text-[12px] leading-6 text-[#33463f]">{t.quote}</p>
                <div className="mt-5 flex items-center justify-between border-t border-black/5 pt-4">
                  <div className="flex items-center gap-3">
                    <Image src={t.avatar} alt={t.name} width={36} height={36} className="size-9 rounded-full object-cover" />
                    <div>
                      <p className="text-[12px] font-bold">{t.name}</p>
                      <p className="text-[11px] text-[#8a9a94]">{t.city}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} className="size-3 fill-[#e8a93d] text-[#e8a93d]" />
                    ))}
                    <span className="ml-1.5 text-[11px] font-bold">{t.rating}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10">
          <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#5a6f67]">Frequently asked questions</p>
          <h2 className="display-serif mt-1.5 text-[28px] font-medium md:text-[34px]">Quick answers for your trip</h2>
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1fr_320px]">
            <div className="divide-y divide-[#ddd5c4]">
              {faqsLeft.map((q) => (
                <details key={q} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[13px] font-medium [&::-webkit-details-marker]:hidden">
                    {q}<Plus className="size-4 shrink-0 text-[#8a9a94] transition-transform group-open:rotate-45" />
                  </summary>
                  <p className="pt-2 text-[12px] leading-6 text-[#6b7f78]">Verified stays, secure booking and local support come standard on every MizoramStay trip.</p>
                </details>
              ))}
            </div>
            <div className="divide-y divide-[#ddd5c4]">
              {faqsRight.map((q) => (
                <details key={q} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[13px] font-medium [&::-webkit-details-marker]:hidden">
                    {q}<Plus className="size-4 shrink-0 text-[#8a9a94] transition-transform group-open:rotate-45" />
                  </summary>
                  <p className="pt-2 text-[12px] leading-6 text-[#6b7f78]">Verified stays, secure booking and local support come standard on every MizoramStay trip.</p>
                </details>
              ))}
            </div>
            <aside className="relative overflow-hidden rounded-2xl border border-black/5 bg-[#eef2ec] p-6">
              <Leaf className="size-8 text-[#0f5a45]" strokeWidth={1.5} />
              <h3 className="mt-4 text-[15px] font-bold">Still have questions?</h3>
              <p className="mt-1.5 text-[12px] leading-5 text-[#5a6f67]">We&apos;re here to help you plan the perfect trip.</p>
              <Link href="/stays"><Button className="mt-4 rounded-full bg-[#0d3d2e] px-5 text-[12px] hover:bg-[#0a2e23]">Contact us <ArrowRight className="size-3.5" /></Button></Link>
            </aside>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0a2e23] text-white">
        <div className="mx-auto max-w-[1280px] px-6 py-12 lg:px-10">
          <div className="grid gap-10 md:grid-cols-[1.4fr_.8fr_.8fr_.7fr_1.2fr]">
            <div>
              <span className="text-[22px] font-extrabold tracking-tight">mizoram<span className="text-[#e8a93d]">stay</span></span>
              <p className="mt-1 text-[8px] font-semibold uppercase tracking-[.28em] text-white/50">Discover. Stay. Belong.</p>
              <p className="mt-4 max-w-[240px] text-[12px] leading-5 text-white/60">Mizoram&apos;s homestay and tourism marketplace.</p>
            </div>
            <div>
              <p className="text-[11px] font-bold">Quick links</p>
              <div className="mt-3 space-y-2 text-[12px] text-white/65">
                <Link href="/stays" className="block hover:text-white">Find a stay</Link>
                <Link href="/destinations" className="block hover:text-white">Explore Mizoram</Link>
                <Link href="/host/properties" className="block hover:text-white">List your property</Link>
                <Link href="/account" className="block hover:text-white">Help & Support</Link>
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold">For hosts</p>
              <div className="mt-3 space-y-2 text-[12px] text-white/65">
                <Link href="/host/properties" className="block hover:text-white">Why join with us</Link>
                <Link href="/host/properties" className="block hover:text-white">List your property</Link>
                <Link href="/host/dashboard" className="block hover:text-white">Host resources</Link>
                <Link href="/host/dashboard" className="block hover:text-white">Join as a host</Link>
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold">Company</p>
              <div className="mt-3 space-y-2 text-[12px] text-white/65">
                <Link href="/destinations" className="block hover:text-white">About us</Link>
                <Link href="/destinations" className="block hover:text-white">Our impact</Link>
                <Link href="/destinations" className="block hover:text-white">Blog</Link>
                <Link href="/account" className="block hover:text-white">Contact us</Link>
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold">Get travel inspiration</p>
              <p className="mt-3 text-[11px] text-white/55">Stories, destinations and local travel ideas.</p>
              <NewsletterForm />
              <div className="mt-4 flex gap-2.5 text-white/70">
                <span className="grid size-7 place-items-center rounded-full border border-white/15 text-[10px] font-bold">IG</span>
                <span className="grid size-7 place-items-center rounded-full border border-white/15 text-[10px] font-bold">f</span>
                <span className="grid size-7 place-items-center rounded-full border border-white/15 text-[10px] font-bold">YT</span>
              </div>
            </div>
          </div>
          <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-5 text-[11px] text-white/40 md:flex-row md:items-center md:justify-between">
            <p>© 2026 MizoramStay. All rights reserved.</p>
            <p className="flex gap-4"><span>Privacy Policy</span><span>Terms of Service</span><span>Cookie Policy</span></p>
            <p>Made with ♥ for Mizoram</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
