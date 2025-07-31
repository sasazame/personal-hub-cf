import { useEffect, useRef, useMemo } from 'react'
import { Moment } from '../types/moment'
import { Card } from './ui'
import { Edit, Trash2, Tag, Clock, Loader2 } from 'lucide-react'
import { groupMomentsByDate, getSortedDateKeys, formatDateHeader, formatTime, getTagColorStyle } from '../utils/momentUtils'

interface MomentListProps {
  pages?: Array<{
    content: Moment[]
    totalElements: number
    last: boolean
  }>
  onMomentClick: (moment: Moment) => void
  onEditMoment: (moment: Moment) => void
  onDeleteMoment: (moment: Moment) => void
  hasNextPage?: boolean
  fetchNextPage: () => void
  isFetchingNextPage: boolean
  isLoading: boolean
}

export function MomentList({ 
  pages = [],
  onMomentClick, 
  onEditMoment, 
  onDeleteMoment,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
  isLoading
}: MomentListProps) {
  const observerTarget = useRef<HTMLDivElement>(null)

  const moments = pages.flatMap(page => page.content || [])

  const { groupedMoments, sortedDates } = useMemo(() => {
    if (!moments || moments.length === 0) {
      return { groupedMoments: {}, sortedDates: [] }
    }
    
    const grouped = groupMomentsByDate(moments)
    const sorted = getSortedDateKeys(grouped)
    
    const sortedGrouped: Record<string, Moment[]> = {}
    for (const dateKey of sorted) {
      sortedGrouped[dateKey] = grouped[dateKey].sort((a, b) => 
        new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
      )
    }
    
    return { groupedMoments: sortedGrouped, sortedDates: sorted }
  }, [moments])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        <p className="text-gray-500 dark:text-gray-400 mt-2">Loading...</p>
      </div>
    )
  }

  if (!moments || moments.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 dark:text-gray-400 text-lg">No moments yet</div>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
          Start recording your thoughts and experiences
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {sortedDates.map((dateKey) => (
        <div key={dateKey}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 sticky top-0 bg-white dark:bg-gray-900 z-10 py-2">
            {formatDateHeader(dateKey)}
          </h3>
          
          <div className="space-y-3">
            {groupedMoments[dateKey].map((moment) => (
                <Card 
                  key={moment.id} 
                  className="p-4 cursor-pointer hover:shadow-md transition-all group relative"
                  onClick={() => onMomentClick(moment)}
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 min-w-[80px]">
                      <Clock className="w-3 h-3" />
                      {moment.createdAt && formatTime(moment.createdAt)}
                    </div>
                    
                    <div className="grow">
                      <div className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words mb-2">
                        {moment.content}
                      </div>
                      
                      {moment.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {moment.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                              style={getTagColorStyle(tag)}
                            >
                              <Tag className="w-3 h-3" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditMoment(moment)
                        }}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 hover:text-blue-600"
                        title="Edit"
                        aria-label="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteMoment(moment)
                        }}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 hover:text-red-600"
                        title="Delete"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      ))}

      <div ref={observerTarget} className="h-10 flex items-center justify-center">
        {isFetchingNextPage && (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-sm text-gray-500">Loading more...</span>
          </div>
        )}
        {!hasNextPage && moments.length > 20 && (
          <p className="text-sm text-gray-500">No more moments</p>
        )}
      </div>
    </div>
  )
}