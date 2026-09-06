import { MessageSquare, ShieldCheck, Star, ThumbsUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PortalShell } from '@/components/host/portal-shell'

const reviews = [
  { name: 'Ananya Sharma', initials: 'AS', rating: '4.9', text: 'Wonderful host and clean rooms. The breakfast and local recommendations made the stay feel genuinely personal.', date: 'October 2026', status: 'Responded' },
  { name: 'Rahul Verma', initials: 'RV', rating: '4.7', text: 'Great location and helpful local advice. Check-in was easy and the room was comfortable for our family.', date: 'September 2026', status: 'Needs response' },
  { name: 'Irene Joseph', initials: 'IJ', rating: '5.0', text: 'Beautiful hillside views and an incredibly thoughtful host. Would happily stay again.', date: 'September 2026', status: 'Responded' },
]

export default function HostReviewsPage() {
  return (
    <PortalShell>
      <div className="mx-auto w-full max-w-[1240px] space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#81918a]">Guest feedback</p><h1 className="mt-2 text-3xl font-black tracking-[-.04em] text-[#17332e] sm:text-[40px]">Reviews</h1><p className="mt-2 text-sm leading-6 text-[#66776f]">Build trust by acknowledging guests and learning from their feedback.</p></div>
          <Button variant="outline" className="rounded-xl border-[#d7dfda] bg-white text-[#17332e] hover:bg-[#f7faf7] hover:text-[#17332e]"><ThumbsUp className="size-4" /> Review insights</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-[1.1fr_1fr_1fr]">
          <Card className="rounded-[24px] border-0 bg-[#154637] text-white shadow-[0_18px_38px_rgba(21,70,55,.14)]"><CardContent className="p-5 md:p-6"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/55">Overall rating</p><div className="mt-3 flex items-center gap-3"><span className="text-4xl font-black">4.9</span><div className="flex gap-0.5">{[1,2,3,4,5].map((star) => <Star key={star} className="size-4 fill-[#e4b35b] text-[#e4b35b]" />)}</div></div><p className="mt-2 text-xs text-white/60">40 verified traveller reviews</p></CardContent></Card>
          <Card className="rounded-[24px] border-[#d6ded9] shadow-[0_8px_24px_rgba(21,70,55,.04)]"><CardContent className="p-5 md:p-6"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#75857e]">Response rate</p><p className="mt-3 text-4xl font-black text-[#17332e]">96%</p><p className="mt-2 text-xs text-muted-foreground">Keep replies within 24 hours.</p></CardContent></Card>
          <Card className="rounded-[24px] border-[#d6ded9] shadow-[0_8px_24px_rgba(21,70,55,.04)]"><CardContent className="p-5 md:p-6"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#75857e]">To answer</p><p className="mt-3 text-4xl font-black text-[#9a651e]">1</p><p className="mt-2 text-xs text-muted-foreground">A guest is still waiting for a response.</p></CardContent></Card>
        </div>

        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.name} className="rounded-[28px] border-[#d6ded9] bg-white shadow-[0_8px_26px_rgba(21,70,55,.045)]">
              <CardHeader className="flex flex-row items-start justify-between gap-4 px-5 pb-4 pt-5 md:px-6 md:pt-6">
                <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-[#e8efe9] text-xs font-black text-[#1b5d47]">{review.initials}</span><div><CardTitle className="text-base text-[#17332e]">{review.name}</CardTitle><p className="mt-1 text-xs text-muted-foreground">{review.date}</p></div></div>
                <div className="flex items-center gap-2"><Badge variant={review.status === 'Responded' ? 'default' : 'secondary'}>{review.status}</Badge><span className="flex items-center gap-1 text-sm font-bold text-[#17332e]"><Star className="size-4 fill-[#d4942f] text-[#d4942f]" /> {review.rating}</span></div>
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-0 md:px-6 md:pb-6"><p className="max-w-3xl text-sm leading-6 text-[#4f625a]">{review.text}</p><div className="mt-4 flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-3.5 text-[#2b7a5c]" /> Verified booking</div>{review.status === 'Needs response' ? <Button size="sm" className="rounded-xl bg-[#154637] text-white hover:bg-[#103b2f]"><MessageSquare className="size-4" /> Respond</Button> : <Button size="sm" variant="outline" className="rounded-xl border-[#d7dfda] bg-white text-[#17332e] hover:bg-[#f7faf7] hover:text-[#17332e]"><MessageSquare className="size-4" /> View response</Button>}</div></CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PortalShell>
  )
}
