'use client'
import { Button } from '@/components/ui/button'
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <main className="grid min-h-[70vh] place-items-center px-4"><div className="max-w-md text-center"><p className="text-sm font-semibold uppercase tracking-[.18em] text-primary">Something went wrong</p><h1 className="mt-2 text-3xl font-black">We couldn’t complete that request.</h1><Button className="mt-5" onClick={reset}>Try again</Button></div></main> }
