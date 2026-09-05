import type { Property } from '@/types/domain'

export const properties: Property[] = [
  {
    id: 'prop-001', slug: 'mizoram-hills-homestay', name: 'Mizoram Hills Homestay', location: 'Aizawl', district: 'Aizawl', propertyType: 'HOMESTAY',
    description: 'A quiet family-run stay overlooking the Aizawl hills, designed for travellers who want local hospitality, reliable basics and easy access to the city.',
    priceFrom: 1800, rating: 4.8, reviewCount: 126, imageUrl: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=80',
    amenities: ['Wi-Fi', 'Breakfast', 'Parking', 'Hot water'], verificationLevel: 4, tourismRegistered: true, cancellation: 'Free cancellation up to 48 hours before check-in', hostName: 'Lalhmingmawia', latitude: 23.7271, longitude: 92.7176,
    rooms: [{ id: 'room-101', name: 'Deluxe Double Room', maxGuests: 2, beds: '1 queen bed', bathroom: 'Attached bathroom', price: 1800 }, { id: 'room-102', name: 'Family Room', maxGuests: 4, beds: '2 queen beds', bathroom: 'Attached bathroom', price: 2600 }]
  },
  {
    id: 'prop-002', slug: 'green-valley-stay', name: 'Green Valley Stay', location: 'Reiek', district: 'Aizawl', propertyType: 'HOMESTAY',
    description: 'A hillside homestay near Reiek with garden space, mountain views and a slower village atmosphere.',
    priceFrom: 2200, rating: 4.7, reviewCount: 89, imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    amenities: ['Mountain view', 'Breakfast', 'Garden', 'Parking'], verificationLevel: 5, tourismRegistered: true, cancellation: 'Free cancellation up to 5 days before check-in', hostName: 'Malsawmdawngliana', latitude: 23.6833, longitude: 92.6167,
    rooms: [{ id: 'room-201', name: 'Valley View Room', maxGuests: 2, beds: '1 king bed', bathroom: 'Attached bathroom', price: 2200 }]
  },
  {
    id: 'prop-003', slug: 'champhai-wine-country-stay', name: 'Champhai Wine Country Stay', location: 'Champhai', district: 'Champhai', propertyType: 'VILLAGE_STAY',
    description: 'A local stay for exploring Champhai landscapes, food and community life, with a practical base for day trips.',
    priceFrom: 1600, rating: 4.6, reviewCount: 54, imageUrl: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=80',
    amenities: ['Wi-Fi', 'Local food', 'Parking', 'Hot water'], verificationLevel: 3, tourismRegistered: true, cancellation: 'Free cancellation up to 72 hours before check-in', hostName: 'Rinawma Sailo', latitude: 23.4561, longitude: 93.3287,
    rooms: [{ id: 'room-301', name: 'Local Comfort Room', maxGuests: 2, beds: '1 double bed', bathroom: 'Shared bathroom', price: 1600 }]
  },
  {
    id: 'prop-004', slug: 'thenzawl-forest-retreat', name: 'Thenzawl Forest Retreat', location: 'Thenzawl', district: 'Serchhip', propertyType: 'HOMESTAY',
    description: 'A peaceful stay close to Thenzawl attractions, suited to couples, families and short nature-focused breaks.',
    priceFrom: 1950, rating: 4.5, reviewCount: 41, imageUrl: 'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?auto=format&fit=crop&w=1200&q=80',
    amenities: ['Wi-Fi', 'Breakfast', 'Generator', 'Family room'], verificationLevel: 4, tourismRegistered: true, cancellation: 'Free cancellation up to 48 hours before check-in', hostName: 'Vanlalruata', latitude: 23.3, longitude: 92.95,
    rooms: [{ id: 'room-401', name: 'Garden Room', maxGuests: 3, beds: '1 queen + 1 single', bathroom: 'Attached bathroom', price: 1950 }]
  },
]

export const destinations = [
  { slug: 'aizawl', name: 'Aizawl', district: 'Aizawl', blurb: 'Mizoram’s urban gateway, food, views and local culture.', image: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=900&q=80' },
  { slug: 'reiek', name: 'Reiek', district: 'Aizawl', blurb: 'Mountain scenery, village atmosphere and a classic day trip.', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=80' },
  { slug: 'champhai', name: 'Champhai', district: 'Champhai', blurb: 'Rolling landscapes, culture and border-region travel.', image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80' },
  { slug: 'thenzawl', name: 'Thenzawl', district: 'Serchhip', blurb: 'Nature-focused travel around waterfalls and forested hills.', image: 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=900&q=80' },
]
