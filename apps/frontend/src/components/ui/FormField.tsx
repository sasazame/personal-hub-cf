import React from 'react'
import { cn } from '@/lib/cn'

interface FormFieldProps {
  label?: string
  error?: { message?: string }
  required?: boolean
  children?: React.ReactNode
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>, FormFieldProps {}

export const FormInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, required, className, id, ...props }, ref) => {
    return (
      <div>
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-foreground mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring',
            'bg-background text-foreground border-input',
            error && 'border-red-500',
            className
          )}
          {...props}
        />
        {error?.message && (
          <p className="mt-1 text-sm text-red-500">{error.message}</p>
        )}
      </div>
    )
  }
)

FormInput.displayName = 'FormInput'

export const FormField: React.FC<FormFieldProps> = ({ label, error, required, children }) => {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {error?.message && (
        <p className="mt-1 text-sm text-red-500">{error.message}</p>
      )}
    </div>
  )
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement>, FormFieldProps {}

export const FormTextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, required, className, id, ...props }, ref) => {
    return (
      <div>
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-foreground mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn(
            'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring',
            'bg-background text-foreground border-input resize-none',
            error && 'border-red-500',
            className
          )}
          {...props}
        />
        {error?.message && (
          <p className="mt-1 text-sm text-red-500">{error.message}</p>
        )}
      </div>
    )
  }
)

FormTextArea.displayName = 'FormTextArea'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement>, FormFieldProps {
  options: SelectOption[]
}

export const FormSelect = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, required, options, className, id, ...props }, ref) => {
    return (
      <div>
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-foreground mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={cn(
            'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring',
            'bg-background text-foreground border-input',
            error && 'border-red-500',
            className
          )}
          {...props}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error?.message && (
          <p className="mt-1 text-sm text-red-500">{error.message}</p>
        )}
      </div>
    )
  }
)

FormSelect.displayName = 'FormSelect'

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement>, FormFieldProps {}

export const FormCheckbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className, id, ...props }, ref) => {
    return (
      <div className="flex items-center">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          className={cn(
            'h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary',
            error && 'border-red-500',
            className
          )}
          {...props}
        />
        {label && (
          <label htmlFor={id} className="ml-2 block text-sm text-foreground">
            {label}
          </label>
        )}
        {error?.message && (
          <p className="mt-1 text-sm text-red-500">{error.message}</p>
        )}
      </div>
    )
  }
)

FormCheckbox.displayName = 'FormCheckbox'