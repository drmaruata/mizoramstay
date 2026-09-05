export interface PropertySearchInput {
  destination?: string
  district?: string
  propertyType?: string
  minPrice?: number
  maxPrice?: number
  amenities?: string[]
  minVerification?: number
}

export interface PropertyRepository<TProperty> {
  listPublished(input?: PropertySearchInput): Promise<TProperty[]>
  findById(id: string): Promise<TProperty | null>
  findBySlug(slug: string): Promise<TProperty | null>
}
