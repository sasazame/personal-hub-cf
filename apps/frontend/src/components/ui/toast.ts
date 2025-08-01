import toast from 'react-hot-toast'
import { getCSSVariable } from '@/utils/cssVariables'

export const showSuccess = (message: string) => {
  toast.success(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: getCSSVariable('--success', true),
      color: getCSSVariable('--success-foreground', true),
    },
  })
}

export const showError = (message: string) => {
  toast.error(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: getCSSVariable('--destructive', true),
      color: getCSSVariable('--destructive-foreground', true),
    },
  })
}

export const showInfo = (message: string) => {
  toast(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: getCSSVariable('--info', true),
      color: getCSSVariable('--info-foreground', true),
    },
  })
}

export { toast }