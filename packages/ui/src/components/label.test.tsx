import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Label } from './label'

describe('Label', () => {
  it('renders correctly', () => {
    render(<Label>Form Label</Label>)
    const label = screen.getByText('Form Label')
    expect(label).toBeInTheDocument()
    expect(label.tagName).toBe('LABEL')
  })

  it('applies default classes', () => {
    render(<Label>Label Text</Label>)
    const label = screen.getByText('Label Text')
    expect(label).toHaveClass('text-sm', 'font-medium', 'leading-none')
  })

  it('associates with form control using htmlFor', () => {
    render(
      <>
        <Label htmlFor="email-input">Email</Label>
        <input id="email-input" type="email" />
      </>
    )
    
    const label = screen.getByText('Email')
    const input = screen.getByRole('textbox')
    
    expect(label).toHaveAttribute('for', 'email-input')
    expect(input).toHaveAttribute('id', 'email-input')
  })

  it('applies custom className', () => {
    render(<Label className="custom-label-class">Custom Label</Label>)
    const label = screen.getByText('Custom Label')
    
    expect(label).toHaveClass('custom-label-class')
    expect(label).toHaveClass('text-sm', 'font-medium') // Still has default classes
  })

  it('handles peer-disabled state classes', () => {
    render(<Label>Disabled Label</Label>)
    const label = screen.getByText('Disabled Label')
    
    expect(label).toHaveClass('peer-disabled:cursor-not-allowed', 'peer-disabled:opacity-70')
  })
})