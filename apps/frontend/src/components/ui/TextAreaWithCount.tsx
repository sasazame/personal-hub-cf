import React, { useCallback, useMemo } from 'react'
import { cn } from '@/lib/cn'
import { TextArea, TextAreaProps } from './TextArea'

export interface TextAreaWithCountProps extends TextAreaProps {
  maxLength?: number
  showCount?: boolean
  countClassName?: string
}

export const TextAreaWithCount = React.memo(React.forwardRef<HTMLTextAreaElement, TextAreaWithCountProps>(
  ({ className, maxLength, showCount = true, countClassName, onChange, value, defaultValue, ...props }, ref) => {
    const currentValue = value ?? defaultValue ?? ''
    const currentLength = String(currentValue).length
    
    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (maxLength && e.target.value.length > maxLength) {
        e.target.value = e.target.value.slice(0, maxLength)
      }
      onChange?.(e)
    }, [maxLength, onChange])
    
    const countInfo = useMemo(() => {
      if (!showCount) return null
      
      if (maxLength) {
        const percentage = (currentLength / maxLength) * 100
        const isNearLimit = percentage >= 90
        const isAtLimit = currentLength >= maxLength
        
        return {
          text: `${currentLength} / ${maxLength}`,
          className: cn(
            'text-xs transition-colors',
            isAtLimit && 'text-red-500 font-medium',
            isNearLimit && !isAtLimit && 'text-orange-500',
            !isNearLimit && 'text-muted-foreground'
          )
        }
      }
      
      return {
        text: `${currentLength} characters`,
        className: 'text-xs text-muted-foreground'
      }
    }, [currentLength, maxLength, showCount])
    
    return (
      <div className="relative">
        <TextArea
          ref={ref}
          className={className}
          onChange={handleChange}
          value={value}
          defaultValue={defaultValue}
          maxLength={maxLength}
          {...props}
        />
        {countInfo && (
          <div className={cn('mt-1 text-right', countClassName)} aria-live="polite" aria-atomic="true">
            <span className={countInfo.className} role="status">
              {countInfo.text}
            </span>
          </div>
        )}
      </div>
    )
  }
))

TextAreaWithCount.displayName = 'TextAreaWithCount'