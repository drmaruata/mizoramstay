import Link from 'next/link'
import { Button } from '@/components/ui/button'
export default function NotFound(){return <main className="grid min-h-[70vh] place-items-center px-4"><div className="max-w-md text-center"><p className="text-6xl font-black text-primary">404</p><h1 className="mt-2 text-3xl font-black">Page not found</h1><p className="mt-3 text-muted-foreground">The stay or destination you requested is not available.</p><Link href="/"><Button className="mt-5">Back to MizoramStay</Button></Link></div></main>}
