// Get CSS variable values at runtime
export const getCSSVariable = (variable: string, asHsl = false) => {
  if (typeof window === 'undefined') {
    console.warn(`getCSSVariable called in SSR environment for variable: ${variable}`)
    return asHsl ? 'hsl(0 0% 50%)' : ''
  }
  
  try {
    const value = window.getComputedStyle(document.documentElement).getPropertyValue(variable).trim()
    if (!value) {
      console.warn(`CSS variable ${variable} not found or empty`)
      return asHsl ? 'hsl(0 0% 50%)' : ''
    }
    return asHsl ? `hsl(${value})` : value
  } catch (error) {
    console.error(`Error getting CSS variable ${variable}:`, error)
    return asHsl ? 'hsl(0 0% 50%)' : ''
  }
}