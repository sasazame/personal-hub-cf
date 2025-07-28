import toast from 'react-hot-toast'

export const showSuccess = (message: string) => {
  toast.success(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#10b981',
      color: '#fff',
    },
  })
}

export const showError = (message: string) => {
  toast.error(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#ef4444',
      color: '#fff',
    },
  })
}

export const showInfo = (message: string) => {
  toast(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#3b82f6',
      color: '#fff',
    },
  })
}

export { toast }