export interface SearchRepository<T> { search(query: string): Promise<T[]> }
export function createSearchService<T>(repository: SearchRepository<T>) { return { search: async (query: string) => repository.search(query.trim()) } }
