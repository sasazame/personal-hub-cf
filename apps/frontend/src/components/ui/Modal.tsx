import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

export function Modal({ open, onClose, children, className }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className={cn('relative z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4', className)}>
        {children}
      </div>
    </div>
  )
}

interface ModalHeaderProps {
  children: React.ReactNode
  onClose?: () => void
}

export function ModalHeader({ children, onClose }: ModalHeaderProps) {
  return (
    <div className="flex items-center justify-between p-6 border-b">
      {children}
      {onClose && (
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500 transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}

export function ModalTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-semibold">{children}</h2>
}

export function ModalContent({ children }: { children: React.ReactNode }) {
  return <div className="p-6">{children}</div>
}