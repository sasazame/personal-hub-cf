import { Moment } from '../types/moment'
import { format } from 'date-fns'
import { formatDateHeader as formatDateHeaderI18n, formatRelativeTime, formatTime as formatTimeI18n } from './dateUtils'

const TAG_COLOR_MAP = {
  Ideas: 'tag-blue',
  Discoveries: 'tag-purple',
  Emotions: 'tag-pink',
  Log: 'tag-green',
  Other: 'tag-gray'
}

const DEFAULT_TAG_COLOR = 'tag-orange'

export function groupMomentsByDate(moments: Moment[]): Record<string, Moment[]> {
  return moments.reduce((groups, moment) => {
    try {
      const date = moment.createdAt ? new Date(moment.createdAt) : new Date()
      
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date for moment ${moment.id}:`, moment.createdAt)
        const fallbackDate = new Date()
        const dateKey = format(fallbackDate, 'yyyy-MM-dd')
        if (!groups[dateKey]) {
          groups[dateKey] = []
        }
        groups[dateKey].push(moment)
        return groups
      }
      
      const dateKey = format(date, 'yyyy-MM-dd')
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(moment)
    } catch (error) {
      console.error(`Error processing moment ${moment.id}:`, error)
      if (!groups['invalid']) {
        groups['invalid'] = []
      }
      groups['invalid'].push(moment)
    }
    return groups
  }, {} as Record<string, Moment[]>)
}

export function getSortedDateKeys(groupedMoments: Record<string, Moment[]>): string[] {
  return Object.keys(groupedMoments).sort((a, b) => b.localeCompare(a))
}

export function formatDateHeader(dateString: string): string {
  try {
    const date = new Date(dateString)
    
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date string for header: ${dateString}`)
      return dateString
    }
    
    return formatDateHeaderI18n(date)
  } catch (error) {
    console.error(`Error formatting date header for ${dateString}:`, error)
    return dateString
  }
}

export function formatTime(dateString: string): string {
  try {
    const date = new Date(dateString)
    
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date string for time: ${dateString}`)
      return ''
    }
    
    // Use relative time for today's dates, otherwise use formatted time
    const today = new Date()
    if (date.toDateString() === today.toDateString()) {
      return formatRelativeTime(date)
    }
    return formatTimeI18n(date)
  } catch (error) {
    console.error(`Error formatting time for ${dateString}:`, error)
    return ''
  }
}

export function getTagColorClasses(tag: string): string {
  return TAG_COLOR_MAP[tag as keyof typeof TAG_COLOR_MAP] || DEFAULT_TAG_COLOR
}

// Deprecated: Use getTagColorClasses instead for theme-aware styling
export function getTagColorStyle(_tag: string): { backgroundColor: string; color: string } {
  console.warn('getTagColorStyle is deprecated. Use getTagColorClasses with CSS classes instead.')
  // Return empty styles to force migration to CSS classes
  return {
    backgroundColor: '',
    color: '',
  }
}