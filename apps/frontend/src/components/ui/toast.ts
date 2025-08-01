import toast from 'react-hot-toast'

// Get CSS variable values at runtime
const getCSSVariable = (variable: string) => {
  return window.getComputedStyle(document.documentElement).getPropertyValue(variable).trim()
}

export const showSuccess = (message: string) => {
  toast.success(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: `hsl(${getCSSVariable('--success')})`,
      color: `hsl(${getCSSVariable('--success-foreground')})`,
    },
  })
}

export const showError = (message: string) => {
  toast.error(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: `hsl(${getCSSVariable('--destructive')})`,
      color: `hsl(${getCSSVariable('--destructive-foreground')})`,
    },
  })
}

export const showInfo = (message: string) => {
  toast(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: `hsl(${getCSSVariable('--info')})`,
      color: `hsl(${getCSSVariable('--info-foreground')})`,
    },
  })
}

export { toast }