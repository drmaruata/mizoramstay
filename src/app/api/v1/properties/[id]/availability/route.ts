import { NextResponse } from 'next/server'
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; return NextResponse.json({ data: { propertyId: id, inventory: 'demo', note: 'Production availability is resolved server-side against transactional room_inventory and booking locks.' } }) }
