import React, { useState, useRef, useEffect } from 'react'
import { MoreVertical } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface MenuItem {
  label: string
  onClick: () => void
  icon?: React.ReactNode
  variant?: 'default' | 'danger'
}

interface DropdownMenuProps {
  items: MenuItem[]
  buttonClassName?: string
}

export function DropdownMenu({ items, buttonClassName }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'p-2 rounded-md hover:bg-accent transition-colors',
          buttonClassName
        )}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-popover ring-1 ring-border z-10">
          <div className="py-1">
            {items.map((item, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  item.onClick()
                  setIsOpen(false)
                }}
                className={cn(
                  'flex items-center w-full text-left px-4 py-2 text-sm',
                  item.variant === 'danger'
                    ? 'text-destructive hover:bg-destructive/10'
                    : 'text-popover-foreground hover:bg-accent'
                )}
              >
                {item.icon && <span className="mr-3">{item.icon}</span>}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}