import React, { useCallback, useMemo } from 'react'
import { cn } from '@/lib/cn'
import { Input, InputProps } from './Input'

export interface InputWithCountProps extends InputProps {
  maxLength?: number
  showCount?: boolean
  countClassName?: string
}

export const InputWithCount = React.memo(React.forwardRef<HTMLInputElement, InputWithCountProps>(
  ({ className, maxLength, showCount = true, countClassName, onChange, value, defaultValue, ...props }, ref) => {
    const currentValue = value ?? defaultValue ?? ''
    const currentLength = String(currentValue).length
    
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      if (maxLength && e.target.value.length > maxLength) {
        e.target.value = e.target.value.slice(0, maxLength)
        e.preventDefault()
        return
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
        <Input
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

InputWithCount.displayName = 'InputWithCount'