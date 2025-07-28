import { Moment } from '../types/moment'
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns'

const TAG_COLOR_MAP = {
  Ideas: { 
    light: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    hover: 'hover:bg-blue-200 dark:hover:bg-blue-800',
    css: { bg: '#dbeafe', text: '#1d4ed8' }
  },
  Discoveries: { 
    light: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
    hover: 'hover:bg-purple-200 dark:hover:bg-purple-800',
    css: { bg: '#e9d5ff', text: '#6b21a8' }
  },
  Emotions: { 
    light: 'bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300',
    hover: 'hover:bg-pink-200 dark:hover:bg-pink-800',
    css: { bg: '#fce7f3', text: '#be185d' }
  },
  Log: { 
    light: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    hover: 'hover:bg-green-200 dark:hover:bg-green-800',
    css: { bg: '#d1fae5', text: '#047857' }
  },
  Other: { 
    light: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    hover: 'hover:bg-gray-200 dark:hover:bg-gray-700',
    css: { bg: '#f3f4f6', text: '#374151' }
  }
}

const DEFAULT_TAG_COLOR = {
  light: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300',
  hover: '',
  css: { bg: '#fed7aa', text: '#c2410c' }
}

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
    
    if (isToday(date)) {
      return 'Today'
    }
    if (isYesterday(date)) {
      return 'Yesterday'
    }
    return format(date, 'MMMM d, yyyy')
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
    
    if (isToday(date)) {
      return formatDistanceToNow(date, { addSuffix: true })
    }
    return format(date, 'HH:mm')
  } catch (error) {
    console.error(`Error formatting time for ${dateString}:`, error)
    return ''
  }
}

export function getTagColorClasses(tag: string, includeHover = false): string {
  const colorConfig = TAG_COLOR_MAP[tag as keyof typeof TAG_COLOR_MAP] || DEFAULT_TAG_COLOR
  return includeHover && colorConfig.hover 
    ? `${colorConfig.light} ${colorConfig.hover}`
    : colorConfig.light
}

export function getTagColorStyle(tag: string): { backgroundColor: string; color: string } {
  const colorConfig = TAG_COLOR_MAP[tag as keyof typeof TAG_COLOR_MAP] || DEFAULT_TAG_COLOR
  return {
    backgroundColor: colorConfig.css.bg,
    color: colorConfig.css.text,
  }
}