export interface TimelineEntry {
  id?: number
  title: string
  memo?: string
  category?: string
  tags?: string
  date: string // ISO date yyyy-MM-dd
  eventId?: number
  createdAt?: string
  updatedAt?: string
}

export interface TimelineFilters {
  fromDate?: string
  toDate?: string
  search?: string
  category?: string
  tag?: string
}
