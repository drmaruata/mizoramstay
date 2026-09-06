import Link from 'next/link'
import { Search, ShieldCheck, UserCheck, Users, UserRound } from 'lucide-react'
import { requireAdmin } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { single } from '@/lib/supabase/relations'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export const metadata = { title: 'Users | Admin' }

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  await requireAdmin()
  const params = await searchParams
  const tab = typeof params.tab === 'string' ? params.tab : 'all'
  const query = typeof params.q === 'string' ? params.q : ''
  const supabase = await createClient()
  let profilesQuery = supabase.from('profiles').select('id, first_name, last_name, email, phone, role, created_at, host_profiles(display_name, identity_status, bank_account_status)', { count: 'exact' }).order('created_at', { ascending: false }).limit(50)
  if (tab === 'hosts') profilesQuery = profilesQuery.eq('role', 'HOST')
  if (tab === 'tourists') profilesQuery = profilesQuery.eq('role', 'TOURIST')
  if (tab === 'admins') profilesQuery = profilesQuery.in('role', ['ADMIN', 'SUPER_ADMIN'])
  if (query) profilesQuery = profilesQuery.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
  const { data: profiles, count } = await profilesQuery
  const tabs = [['all', 'All users'], ['hosts', 'Hosts'], ['tourists', 'Tourists'], ['admins', 'Admins']] as const
  const roleClass: Record<string, string> = { TOURIST: 'bg-[#e8eef6] text-[#3f5870]', HOST: 'bg-[#e7f1ea] text-[#1d6048]', GUIDE: 'bg-[#eee8f4] text-[#665276]', DRIVER: 'bg-[#f9ebdc] text-[#986021]', OPERATOR: 'bg-[#e1f0ed] text-[#1b655a]', ADMIN: 'bg-[#f8e6e5] text-[#994944]', SUPER_ADMIN: 'bg-[#f3dcd9] text-[#843d39]' }
  return <div className="mx-auto max-w-[1240px] space-y-6">
    <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#778780]">People & access</p><h1 className="mt-2 text-3xl font-black tracking-tight">Users</h1><p className="mt-2 text-sm text-muted-foreground">Manage travellers, hosts and operational accounts with clear role and verification context.</p></div>
    <div className="grid gap-4 sm:grid-cols-3"><CardStat icon={Users} label="Users in view" value={count ?? 0} /><CardStat icon={UserRound} label="Host accounts" value="—" /><CardStat icon={ShieldCheck} label="Verified hosts" value="—" /></div>
    <div className="rounded-3xl border border-black/5 bg-white p-2 shadow-sm"><div className="flex flex-wrap items-center gap-1">{tabs.map(([key, label]) => <Link key={key} href={`/admin/users?tab=${key}${query ? `&q=${encodeURIComponent(query)}` : ''}`} className={`rounded-2xl px-4 py-2 text-xs font-bold transition-colors ${tab === key ? '!bg-[#183a31] !text-white hover:!bg-[#183a31] hover:!text-white' : 'text-[#65766f] hover:bg-[#eef3ee]'}`} aria-current={tab === key ? 'page' : undefined}>{label}</Link>)}</div></div>
    <div className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm"><form className="flex flex-col gap-2 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input name="q" defaultValue={query} placeholder="Search by name or email..." className="bg-[#fafbf9] pl-9" /></div><input type="hidden" name="tab" value={tab} /><Button type="submit" className="bg-[#183a31] hover:bg-[#183a31]/90">Search users</Button></form></div>
    <div className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm"><div className="overflow-x-auto"><Table><TableHeader><TableRow className="border-b border-black/5 bg-[#fafbf9]"><TableHead className="px-5 py-3 text-[10px] font-bold uppercase tracking-[.12em]">User</TableHead><TableHead className="px-5 py-3 text-[10px] font-bold uppercase tracking-[.12em]">Contact</TableHead><TableHead className="px-5 py-3 text-[10px] font-bold uppercase tracking-[.12em]">Role</TableHead><TableHead className="px-5 py-3 text-[10px] font-bold uppercase tracking-[.12em]">Host status</TableHead><TableHead className="px-5 py-3 text-[10px] font-bold uppercase tracking-[.12em]">Joined</TableHead></TableRow></TableHeader><TableBody>{profiles?.map((profile) => { const host = single<{ display_name: string | null; identity_status: string | null; bank_account_status: string | null }>(profile.host_profiles); const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Unnamed user'; return <TableRow key={profile.id} className="hover:bg-[#fafbf9]"><TableCell className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-2xl bg-[#e8efe9] text-xs font-black text-[#1b5d47]">{name.slice(0, 2).toUpperCase()}</span><div><p className="font-bold">{name}</p>{host?.display_name && <p className="mt-0.5 text-xs text-muted-foreground">{host.display_name}</p>}</div></div></TableCell><TableCell className="px-5 py-4 text-xs text-muted-foreground"><p>{profile.email ?? '—'}</p><p className="mt-1">{profile.phone ?? ''}</p></TableCell><TableCell className="px-5 py-4"><Badge className={`${roleClass[profile.role] ?? 'bg-muted text-muted-foreground'} border-0 text-[9px] uppercase`}>{profile.role}</Badge></TableCell><TableCell className="px-5 py-4">{host ? <div className="flex flex-col gap-1"><span className="flex items-center gap-1.5 text-xs font-semibold"><UserCheck className="size-3.5 text-[#2b7a5c]" /> {host.identity_status ?? 'Identity pending'}</span><span className="text-[10px] text-muted-foreground">Bank: {host.bank_account_status ?? 'Not set'}</span></div> : <span className="text-xs text-muted-foreground">Traveller account</span>}</TableCell><TableCell className="px-5 py-4 text-xs text-muted-foreground">{new Date(profile.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</TableCell></TableRow> })}</TableBody></Table></div>{(!profiles || !profiles.length) && <div className="p-12 text-center"><Users className="mx-auto size-10 text-muted-foreground" /><p className="mt-3 font-bold">No users found</p><p className="mt-1 text-sm text-muted-foreground">{query ? 'Try a different search.' : 'Users will appear here.'}</p></div>}</div>
  </div>
}

function CardStat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number | string }) { return <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm"><Icon className="size-5 text-[#5b756c]" /><p className="mt-4 text-xs font-bold uppercase tracking-[.15em] text-[#7b8a84]">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div> }
