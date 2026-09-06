export type PropertyType = 'HOMESTAY' | 'HOTEL' | 'GUESTHOUSE' | 'LODGE' | 'RESORT' | 'VILLAGE_STAY'
export type VerificationLevel = 0 | 1 | 2 | 3 | 4 | 5
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'

export interface Property {
  id: string
  slug: string
  name: string
  location: string
  district: string
  propertyType: PropertyType
  description: string
  priceFrom: number
  rating: number
  reviewCount: number
  imageUrl: string
  amenities: string[]
  verificationLevel: VerificationLevel
  tourismRegistered: boolean
  cancellation: string
  hostName: string
  latitude: number
  longitude: number
  media: PropertyMedia[]
  rooms: Room[]
}

export interface PropertyMedia {
  id: string
  url: string
  altText: string
  sortOrder: number
  isHero: boolean
  roomId: string | null
}

export interface Room {
  id: string
  name: string
  maxGuests: number
  beds: string
  bathroom: string
  price: number
  description: string
  roomType: string
  images: PropertyMedia[]
}
